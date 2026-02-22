#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_ITERATIONS = 20;
const DEFAULT_LABEL = 'baseline';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    baseUrl: DEFAULT_BASE_URL,
    iterations: DEFAULT_ITERATIONS,
    label: DEFAULT_LABEL,
    outDir: '',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (!next) continue;

    if (arg === '--baseUrl') {
      parsed.baseUrl = next;
      i += 1;
    } else if (arg === '--iterations') {
      parsed.iterations = Number(next);
      i += 1;
    } else if (arg === '--label') {
      parsed.label = next;
      i += 1;
    } else if (arg === '--outDir') {
      parsed.outDir = next;
      i += 1;
    }
  }

  if (!Number.isFinite(parsed.iterations) || parsed.iterations < 1) {
    throw new Error(`Invalid --iterations value: ${parsed.iterations}`);
  }

  return parsed;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function p95(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

async function waitForRouteReady(page, selector) {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function waitForPathname(page, pathname) {
  await page.waitForFunction(
    (expectedPath) => window.location.pathname === expectedPath,
    pathname,
    { timeout: 15000 }
  );
}

async function setActingUser(page, baseUrl, userId) {
  const response = await page.request.post(`${baseUrl}/api/acting-user`, {
    data: { userId },
  });
  if (!response.ok()) {
    throw new Error(`Failed to set acting user (${response.status()})`);
  }
}

async function fetchUsers(baseUrl) {
  const response = await fetch(`${baseUrl}/api/users`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users from ${baseUrl}/api/users (${response.status})`);
  }
  const data = await response.json();
  return data.users ?? [];
}

async function startChromeTrace(page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'v8.execute',
      'blink.user_timing',
    ].join(','),
    transferMode: 'ReturnAsStream',
  });
  return client;
}

async function stopChromeTrace(client, outputPath) {
  const tracingComplete = new Promise((resolve) => {
    client.once('Tracing.tracingComplete', resolve);
  });
  await client.send('Tracing.end');
  const event = await tracingComplete;
  const stream = event.stream;

  let traceData = '';
  while (true) {
    const chunk = await client.send('IO.read', { stream });
    traceData += chunk.data;
    if (chunk.eof) break;
  }
  await client.send('IO.close', { stream });
  await fs.writeFile(outputPath, traceData, 'utf8');
}

async function runRoleFlow({
  browser,
  baseUrl,
  iterations,
  roleName,
  userId,
  flow,
  outputDir,
}) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });

  await context.addInitScript(() => {
    window.__tabSwitchLongTasks = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__tabSwitchLongTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // LongTask observer can be unavailable in some environments.
    }
  });

  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await setActingUser(page, baseUrl, userId);

  const traceClient = await startChromeTrace(page);

  const byTransition = new Map();
  const allTransitions = [];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    await page.goto(`${baseUrl}${flow.startPath}`, { waitUntil: 'domcontentloaded' });
    await waitForRouteReady(page, flow.startSelector);

    let currentPath = flow.startPath;
    for (const step of flow.steps) {
      const beforeLongTaskCount = await page.evaluate(() => window.__tabSwitchLongTasks.length);
      const start = performance.now();

      await page.locator(`a[href="${step.toPath}"]`).first().click();
      await waitForPathname(page, step.toPath);
      await waitForRouteReady(page, step.readySelector);

      const elapsed = performance.now() - start;

      const newLongTaskDurations = await page.evaluate((offset) => {
        const entries = window.__tabSwitchLongTasks.slice(offset);
        return entries.map((entry) => entry.duration);
      }, beforeLongTaskCount);

      const longTasksOver50ms = newLongTaskDurations.filter((duration) => duration > 50);
      const transitionKey = `${currentPath} -> ${step.toPath}`;

      if (!byTransition.has(transitionKey)) {
        byTransition.set(transitionKey, {
          samples: [],
          longTasksOver50ms: 0,
          maxLongTaskMs: 0,
        });
      }

      const stat = byTransition.get(transitionKey);
      stat.samples.push(elapsed);
      stat.longTasksOver50ms += longTasksOver50ms.length;
      stat.maxLongTaskMs = Math.max(
        stat.maxLongTaskMs,
        longTasksOver50ms.length ? Math.max(...longTasksOver50ms) : 0
      );

      allTransitions.push({
        transition: transitionKey,
        elapsedMs: round(elapsed),
        longTasksOver50ms: longTasksOver50ms.map(round),
        iteration: iteration + 1,
      });

      currentPath = step.toPath;
    }
  }

  const tracePath = path.join(outputDir, `chrome-${roleName.toLowerCase()}.json`);
  await stopChromeTrace(traceClient, tracePath);

  const summary = {};
  for (const [transition, stats] of byTransition.entries()) {
    summary[transition] = {
      count: stats.samples.length,
      medianMs: round(median(stats.samples)),
      p95Ms: round(p95(stats.samples)),
      avgMs: round(stats.samples.reduce((acc, value) => acc + value, 0) / stats.samples.length),
      longTasksOver50ms: stats.longTasksOver50ms,
      maxLongTaskMs: round(stats.maxLongTaskMs),
    };
  }

  await context.close();
  return {
    role: roleName,
    userId,
    summary,
    samples: allTransitions,
    tracePath,
  };
}

async function main() {
  const options = parseArgs();
  const outputDir = options.outDir || path.join(process.cwd(), 'perf', options.label);
  await fs.mkdir(outputDir, { recursive: true });

  const users = await fetchUsers(options.baseUrl);
  const owner = users.find((user) => user.role === 'OWNER');
  const friend = users.find((user) => user.role === 'FRIEND');

  if (!owner || !friend) {
    throw new Error('Could not find both OWNER and FRIEND users in /api/users');
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const ownerFlow = {
      startPath: '/',
      startSelector: 'text=Welcome back',
      steps: [
        { toPath: '/calendar', readySelector: 'h1:has-text("Calendar")' },
        { toPath: '/manage', readySelector: 'h1:has-text("Pups and friends")' },
        { toPath: '/approvals', readySelector: 'h1:has-text("Pending suggestions")' },
        { toPath: '/calendar', readySelector: 'h1:has-text("Calendar")' },
      ],
    };

    const friendFlow = {
      startPath: '/',
      startSelector: 'text=Welcome back',
      steps: [
        { toPath: '/calendar', readySelector: 'h1:has-text("Calendar")' },
        { toPath: '/manage', readySelector: 'h1:has-text("Pups")' },
        { toPath: '/suggest', readySelector: 'h1:has-text("Suggest a hangout time")' },
        { toPath: '/calendar', readySelector: 'h1:has-text("Calendar")' },
      ],
    };

    const [ownerResults, friendResults] = await Promise.all([
      runRoleFlow({
        browser,
        baseUrl: options.baseUrl,
        iterations: options.iterations,
        roleName: 'OWNER',
        userId: owner.id,
        flow: ownerFlow,
        outputDir,
      }),
      runRoleFlow({
        browser,
        baseUrl: options.baseUrl,
        iterations: options.iterations,
        roleName: 'FRIEND',
        userId: friend.id,
        flow: friendFlow,
        outputDir,
      }),
    ]);

    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        baseUrl: options.baseUrl,
        iterations: options.iterations,
        label: options.label,
      },
      roles: {
        owner: ownerResults,
        friend: friendResults,
      },
    };

    const outputPath = path.join(outputDir, 'tab-switch.json');
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log(`Saved tab switch results to ${outputPath}`);
    console.log(`Saved chrome traces to ${ownerResults.tracePath} and ${friendResults.tracePath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Tab switch perf run failed:', error);
  process.exit(1);
});
