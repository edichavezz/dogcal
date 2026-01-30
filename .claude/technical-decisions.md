# DogCal - Technical Decisions

## Architecture Decisions

### Why Next.js App Router?
- **Server Components**: Efficient data fetching, reduces client bundle
- **API Routes**: Backend and frontend in one codebase
- **Built-in routing**: File-based, intuitive
- **Vercel deployment**: Seamless hosting
- **Decision date**: Project inception

### Why Prisma + Supabase?
- **Type-safe ORM**: Auto-generated TypeScript types from schema
- **Migrations**: Version-controlled database changes
- **Prisma Studio**: Built-in database GUI for debugging
- **Supabase**: Managed PostgreSQL, includes storage, generous free tier
- **Decision date**: Project inception

### Why FullCalendar?
- **Official React component**: Well-maintained
- **Feature-rich**: Week view, list view, event handling out of box
- **MIT License**: Free for commercial use (non-premium features)
- **Responsive**: Works on mobile
- **Decision date**: Project inception

### Why Twilio for WhatsApp?
- **Reliable API**: Industry standard for messaging
- **WhatsApp Business API**: Official integration path
- **Good documentation**: Easy to implement
- **Pay-per-use**: No upfront commitment
- **Decision date**: Notification feature implementation

---

## Authentication Approach (V1)

### Current: "Acting User" Pattern
**Why**: MVP simplicity - get app working without auth complexity

**How it works**:
1. HTTP-only cookie stores `acting_user_id`
2. Users "log in" via magic link or admin selector
3. No passwords, no OAuth
4. Cookie persists 30 days

**Trade-offs**:
- Pro: Simple, fast to implement
- Pro: Magic links are user-friendly
- Con: Not "real" security (cookie can be manipulated)
- Con: No registration flow

**Future plan**: Migrate to Supabase Auth or NextAuth when needed

---

## Data Model Decisions

### UUIDs for Primary Keys
**Why**:
- No sequential ID exposure
- Safe for client-side generation
- Works well with distributed systems

### Timestamps
**Standard**: `createdAt` on all models, `updatedAt` where mutations expected
**Storage**: UTC in database, display in user's timezone

### Hangout Status Enum
```
OPEN → ASSIGNED → COMPLETED
              ↘ CANCELLED
```
**Why separate states**: Clear lifecycle, easy filtering, prevents invalid transitions

### Series Pattern for Recurring Events
```typescript
seriesId: String?    // Groups related hangouts
seriesIndex: Int?    // Position in series (1, 2, 3...)
```
**Why**: Simple approach, each occurrence is independent record. Allows individual editing without complex recurrence rules.

---

## API Design

### Route Structure
```
/api/[resource]/route.ts           → GET (list), POST (create)
/api/[resource]/[id]/route.ts      → GET (one), PUT/PATCH, DELETE
/api/[resource]/[id]/[action]/route.ts → POST (custom actions)
```

### Validation: Zod
**Why Zod**: Runtime validation with TypeScript inference, clear error messages

### Error Handling Pattern
```typescript
try {
  // Validate input with Zod
  // Check authorization
  // Execute business logic
  // Return success response
} catch (error) {
  console.error('Context:', error);
  return NextResponse.json({ error: 'Message' }, { status: 4xx/5xx });
}
```

### Response Format
```typescript
// Success
{ hangout: {...}, notifications?: [...] }

// Error
{ error: 'Human-readable message' }
```

---

## Notification Architecture

### Pattern: Fire-and-Forget with Logging
```typescript
// After main operation succeeds
if (process.env.WHATSAPP_ENABLED === 'true') {
  try {
    // Send notification
  } catch (error) {
    console.error('Notification failed:', error);
    // Don't fail the main request
  }
}
return NextResponse.json({ result, notifications });
```

**Why**: Notifications are secondary - main operation should succeed even if notification fails.

### Message Templates
Centralized in `lib/messageTemplates.ts`:
- Async functions (need to fetch login URLs)
- Consistent formatting
- WhatsApp-friendly markdown

---

## Frontend Patterns

### Server vs Client Components
**Default**: Server components (data fetching)
**Client only when**: User interaction, browser APIs, state management

**Pattern**:
```
/page.tsx (server) → fetches data
  └── /ClientComponent.tsx (client) → handles interaction
```

### State Management
**Local only**: useState/useReducer in components
**No global store**: Not needed at current scale
**Server state**: Refetch via `router.refresh()` after mutations

### Form Handling
**Pattern**: Controlled components with local state
**Validation**: Client-side for UX, server-side (Zod) for security

---

## Performance Decisions

### Database Indexes
Added indexes on frequently queried fields:
- `Hangout`: `pupId`, `status`, `assignedFriendUserId`, `startAt`, `(pupId, status)`
- `HangoutSuggestion`: `pupId`, `status`, `(pupId, status)`
- `PupFriendship`: `pupId`, `friendUserId`
- `HangoutNote`: `hangoutId`

### Query Optimization
- Use `select` for field projection when possible
- `Promise.all()` for parallel independent queries
- `take` limits on list queries (10-20 items)

### Caching
- API routes: `Cache-Control: max-age=60, stale-while-revalidate=120`
- Static assets: Default Next.js caching

---

## What We Chose NOT To Do

### No Redux/Zustand
**Why**: App is small, local state sufficient. Would add complexity without benefit.

### No tRPC
**Why**: Standard REST is simpler, team familiarity. tRPC adds build complexity.

### No Separate Backend
**Why**: Next.js API routes are sufficient. Monolith is simpler to deploy/maintain.

### No Real-time (WebSockets)
**Why**: Not needed yet. WhatsApp notifications + page refresh is sufficient. Could add later with Supabase Realtime if needed.
