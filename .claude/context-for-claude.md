# Instructions for Claude Code Sessions

## At the Start of Every Session

**ALWAYS read these files first:**

1. `.claude/current-state.md` - What's in progress, blockers, priorities
2. `.claude/project-overview.md` - If unfamiliar with the project
3. `CLAUDE.md` - Project conventions and rules (in project root)

This takes ~30 seconds and prevents wasted effort on already-solved problems or incorrect approaches.

---

## After Completing Significant Work

**Update `.claude/current-state.md`:**

1. Move completed items to "What's Working" section
2. Update "In Progress" with new status
3. Add entry to "Recent Changes" with date
4. Update "Priorities" if needed

**If you made technical decisions:**

Add to `.claude/technical-decisions.md`:
- What was decided
- Why (alternatives considered)
- Date

---

## Before Starting a New Feature

1. Check `current-state.md` for related work
2. Check `technical-decisions.md` for relevant patterns
3. Check `conventions.md` for naming/style rules
4. Check `common-tasks.md` for how-to guides

---

## Key Project Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Official project conventions (root) |
| `prisma/schema.prisma` | Database schema |
| `app/lib/whatsapp.ts` | WhatsApp notification functions |
| `app/lib/messageTemplates.ts` | Notification message generators |
| `app/api/*/route.ts` | API endpoints |
| `.env.local` | Environment variables (don't commit!) |

---

## Common Patterns in This Codebase

### API Route Pattern
```typescript
// 1. Get acting user
const actingUserId = await getActingUserId();
if (!actingUserId) return 401;

// 2. Validate with Zod
const validated = schema.parse(body);

// 3. Check permissions
// 4. Execute business logic
// 5. Send notifications (if applicable)
// 6. Return result
```

### Notification Pattern
```typescript
const notificationResults: NotificationResult[] = [];
if (process.env.WHATSAPP_ENABLED === 'true') {
  // Send notifications, collect results
}
return NextResponse.json({ result, notifications: notificationResults });
```

### Server/Client Component Split
```
page.tsx (server) → fetches data
  └── ClientComponent.tsx → handles interaction
```

---

## Project-Specific Gotchas

1. **Cookie access**: Use `await cookies()` in Next.js 15+
2. **Prisma singleton**: Always import from `@/lib/prisma`
3. **Date handling**: Store UTC, display in user timezone
4. **FullCalendar**: Import CSS in layout.tsx, non-premium features only
5. **Phone numbers**: Use `isValidPhoneNumber()` before sending WhatsApp

---

## When Uncertain

1. Check `CLAUDE.md` for project rules
2. Look at similar existing code (e.g., existing API routes)
3. Ask the user rather than guessing

---

## Memory Management

If context is getting long:
1. Summarize completed work in `current-state.md`
2. Note any pending items
3. User can start fresh session with context preserved in these files

---

## Standard Operating Procedure

This `.claude/` directory system should be:
1. Created at the start of every new project
2. Read at the start of every session
3. Updated after significant work
4. Used as the source of truth for project state

**The `.claude/` directory is essential infrastructure, like `.git/`.**
