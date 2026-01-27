# DogCal Testing Implementation Plan

## Overview

We will introduce a layered automated testing strategy for DogCal, covering unit tests, service/API business logic tests, React component tests where valuable, and Playwright E2E tests that mirror the existing manual acceptance checklist. All of these tests will be wired into the existing `ci:check` script and GitHub Actions workflow so they run on every push/PR to `main`.

## 1. Test Infrastructure & Config

- **Vitest configuration**
  - Add a `vitest.config.ts` at the repo root to standardize test behavior.
  - Key settings:
    - Use `ts-node`/ESM support appropriate for the current TypeScript setup.
    - Configure `test.environment` as `node` by default, with `jsdom` available for component tests.
    - Set up path aliases to match `tsconfig.json` (e.g., `@/` → `./app`).
    - Exclude `e2e/**` and `.next/**` from Vitest test discovery.

- **Playwright configuration**
  - Add `playwright.config.ts` at the root.
  - Configure:
    - `baseURL: 'http://localhost:3000'`.
    - Projects for at least `chromium` (desktop) and one mobile emulation (e.g., iPhone) to validate mobile responsiveness.
    - Output folders for traces, screenshots, and videos (e.g., `playwright-report/`).

- **Test folder & naming conventions**
  - Use `*.test.ts` / `*.test.tsx` naming.
  - Co-locate unit/service tests next to source files where it improves discoverability (e.g., `app/lib/colorUtils.test.ts`).
  - Place E2E tests in an `e2e/` directory at the repo root (e.g., `e2e/owner-flows.spec.ts`).

## 2. Unit Tests for Utilities (`app/lib`)

- **Targets**
  - `app/lib/colorUtils.ts`
    - Functions that map hangout status to colors and other display logic.
  - `app/lib/cookies.ts`
    - Helper functions for `acting_user_id` cookie management.
  - Any other small, pure helpers discovered in `app/lib` or components.

- **Test design**
  - For `colorUtils`:
    - Verify each status (`OPEN`, `ASSIGNED`, `COMPLETED`, `CANCELLED`) maps to the correct color tokens as used in the UI.
    - Ensure invalid or unknown statuses either throw or return a safe default.
  - For `cookies`:
    - Test cookie parsing when cookie is present, missing, or malformed.
    - Test setting the acting user cookie with correct attributes (e.g., httpOnly, path).
  - Keep these tests pure (no Prisma, no Next runtime) for speed and determinism.

## 3. Extract Testable Services from API Routes

- **Refactor API routes to services**
  - For complex business logic in `app/api/**`, create service modules that encapsulate the core rules while keeping the route handlers thin.
  - Examples:
    - `app/api/hangouts/hangouts.service.ts`
    - `app/api/hangouts/[id]/assign/assign.service.ts`
    - `app/api/hangouts/[id]/unassign/unassign.service.ts`
    - `app/api/suggestions/suggestions.service.ts`
    - `app/api/hangouts/[id]/notes/notes.service.ts`
  - Each service function should:
    - Accept primitive arguments (IDs, payloads, acting user ID).
    - Depend on an injected Prisma client instance.
    - Implement all business rules defined in `CLAUDE.md`.

- **Keep API route handlers thin**
  - Route handlers (`route.ts`) should:
    - Parse/validate input (Zod).
    - Resolve `actingUserId` via cookies.
    - Call the appropriate service function.
    - Map service outcomes to HTTP responses and status codes.

## 4. Service/Business Logic Tests (Vitest + Prisma)

- **Scope of service tests**
  - Use Vitest to test the new service modules at a business-logic level.
  - Interact with a real Postgres DB via Prisma (shared with the CI Postgres service).

- **Business rules to encode**
  - **Hangout Assignment**
    - Only friends with `PupFriendship` can assign themselves to a hangout.
    - Only `OPEN` hangouts can be assigned; assignment changes status to `ASSIGNED`.
    - Unassigning an assigned hangout returns status to `OPEN`.
  - **Hangout Creation**
    - Only `OWNER` users can create hangouts.
    - Owners can only create hangouts for pups they own.
    - Optional immediate assignment must validate friendship.
  - **Suggestions**
    - Only `FRIEND` users can suggest times.
    - Friends can only suggest for pups they have friendship with.
    - Suggestions start as `PENDING` and can only be approved/rejected by the pup owner.
    - Approving a suggestion creates a new `OPEN` hangout.
  - **Notes**
    - Only the owner or the assigned friend can add notes.
    - Ensure notes are returned in chronological order.

- **DB and test data strategy**
  - Use the same `DATABASE_URL` as defined in CI (`postgres://postgres:postgres@localhost:5432/dogcal`).
  - Before each test file or test suite:
    - Ensure migrations have been applied (already handled by CI step `prisma migrate deploy`).
    - Either:
      - Truncate and reseed tables using helper functions that call Prisma directly, or
      - Reuse the existing `prisma/seed.ts` for a known baseline, then modify data in tests.
  - Provide test helpers to fetch known entities from the seeded data (e.g., seeded owners/friends/pups) for consistent IDs.

## 5. Targeted React Component Tests (Vitest + Testing Library)

- **Environment setup**
  - In `vitest.config.ts`, configure a secondary `jsdom` environment for component tests.
  - Optionally add a separate script like `"test:components": "vitest --environment jsdom"` for local dev convenience (still covered by `npm run test`).

- **Components to cover**
  - `app/components/CalendarView.tsx`
    - Renders events with correct color coding and labels.
    - Clicking on an event fires a callback (to open modal).
  - `app/components/EventDetailsModal.tsx`
    - Displays correct details for a hangout (status, pup, times, notes).
    - Renders notes in chronological order and shows/hides actions based on role.
  - `app/components/CreateHangoutForm.tsx` and `app/components/SuggestHangoutForm.tsx`
    - Validates required fields and disables submit until valid.
    - Calls submit handlers with the correct payload structure.

- **Testing approach**
  - Use `@testing-library/react` and `@testing-library/user-event` to simulate user interaction.
  - Do not hit real APIs: stub props and handlers.
  - Focus on state transitions and UI behavior rather than styling.

## 6. Playwright E2E Tests (Happy Paths + Key Edge Cases)

- **Config & project structure**
  - Implement `playwright.config.ts` with dev server integration.
  - Ensure dev server is started before tests (in CI and locally).
  - Place specs under `e2e/`:
    - `e2e/owner-flows.spec.ts`
    - `e2e/friend-flows.spec.ts`
    - `e2e/calendar-ui.spec.ts`

- **Scenarios (mirroring README manual checklist)**
  - **Owner flows**
    - Select an owner user from the home dropdown.
    - Create a new hangout; verify it appears on the calendar as `OPEN` (yellow).
    - Assign the hangout to a friend; verify status and color change to `ASSIGNED` (orange).
    - View and process suggestions from the Approvals page (approve and reject paths).
  - **Friend flows**
    - Select a friend user.
    - View list of open hangouts for pups they are friends with.
    - Self-assign to a hangout and verify calendar and status changes.
    - Unassign and verify it returns to `OPEN`.
    - Suggest a new hangout time and verify it appears for the owner in Approvals.
  - **Notes & calendar UI**
    - Add notes from both owner and friend and confirm they display in chronological order.
    - Click calendar events to open the details modal and verify pup info and times.
    - Check list/week views and basic mobile layout behavior on the mobile project.

- **Data assumptions**
  - Rely on the seeded data from `prisma/seed.ts` (e.g., specific owners, friends, pups names) for deterministic selectors.
  - Consider adding stable `data-testid` attributes in key components if necessary for robust selectors.

## 7. CI Pipeline Integration & Dev Server Handling

- **Dev server orchestration in CI**
  - Update the CI workflow (`.github/workflows/ci.yml`) to:
    - Run `lint`, `typecheck`, and unit/service/component tests before E2E.
    - Start `npm run dev` in the background and wait until `http://localhost:3000` responds.
    - Then run `npm run test:e2e`.
  - Consider separating steps logically:
    - Step A: `npm run lint && npm run typecheck`.
    - Step B: `npm run test` (Vitest).
    - Step C: Start dev server + `npm run test:e2e`.
  - Keep `ci:check` as a single entry point so local and CI behavior stay aligned.

- **Runtime and flakiness control**
  - Configure Playwright timeouts and retries for CI (e.g., 1 retry on failure in CI only).
  - Only add a small number of E2E tests initially to keep CI runtime reasonable; expand gradually.

## 8. Optional: Coverage & Quality Gates

- **Coverage**
  - Configure Vitest coverage (e.g., `c8`/built-in coverage) via `vitest.config.ts`.
  - Optionally add a `"test:coverage"` script and a CI step that enforces minimum coverage for `app/lib` and service modules.

- **Branch protection**
  - After tests are in place and stable, enable GitHub branch protection rules on `main` so that the CI workflow must pass before merging.

## 9. Documentation Updates

- Update `README.md` with a **Testing** section:
  - How to run all tests: `npm run ci:check`.
  - How to run subsets:
    - `npm run test` (unit/service/component)
    - `npm run test:e2e` (Playwright)
    - `npm run lint`, `npm run typecheck`.
  - Short description of what each layer (unit, service, E2E) is responsible for.

- Optionally update `CLAUDE.md` **Testing Strategy** section to reflect that tests now exist and to document conventions for adding new tests when features are implemented.
