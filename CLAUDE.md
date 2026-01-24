# CLAUDE.md - DogCal Project Conventions

This document describes the project structure, conventions, and technical decisions for DogCal.

## Project Structure

```
dogcal/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── acting-user/        # Set/get acting user cookie
│   │   ├── bootstrap/          # Initial data fetch
│   │   ├── hangouts/           # Hangout CRUD + assign/unassign
│   │   ├── suggestions/        # Suggestion CRUD + approve/reject
│   │   └── users/              # Get all users
│   ├── approvals/              # Owner approval page
│   ├── calendar/               # Calendar view page
│   ├── components/             # Reusable React components
│   ├── hangouts/new/           # Create hangout page
│   ├── lib/                    # Utility libraries
│   │   ├── cookies.ts          # Cookie management
│   │   └── prisma.ts           # Prisma client singleton
│   ├── suggest/                # Friend suggest page
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout
├── prisma/
│   ├── migrations/             # Database migrations
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Sample data seed script
├── public/                     # Static assets
├── .env.local                  # Local environment variables (gitignored)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # User-facing documentation
```

## Tech Stack Decisions

### Why Next.js?
- **Server Components**: Efficient data fetching, reduces client bundle size
- **API Routes**: Backend and frontend in one codebase
- **App Router**: Modern routing with layouts and nested routes
- **TypeScript**: Type safety across the stack
- **Vercel**: Seamless deployment

### Why Prisma?
- **Type-safe ORM**: Auto-generated types from schema
- **Migrations**: Version-controlled database changes
- **Prisma Studio**: Built-in database GUI
- **Supabase Integration**: Works seamlessly with PostgreSQL

### Why FullCalendar?
- **React Integration**: Official React component
- **Rich Features**: Week view, list view, event handling
- **MIT License**: Free for commercial use (non-premium features only)
- **Responsive**: Works on mobile

### Why Zod?
- **Runtime Validation**: Validate API inputs at runtime
- **TypeScript Integration**: Infer types from schemas
- **Clear Error Messages**: Helpful for debugging

## Coding Conventions

### File Naming
- **Components**: PascalCase (`TopNav.tsx`, `EventDetailsModal.tsx`)
- **Utilities**: camelCase (`cookies.ts`, `prisma.ts`)
- **Pages**: lowercase (`page.tsx`, `layout.tsx`)
- **API Routes**: lowercase (`route.ts`)

### Component Structure
- **Server Components by default**: Use server components for data fetching
- **Client Components when needed**: Mark with `'use client'` for interactivity
- **Separation of Concerns**:
  - Server components fetch data
  - Client components handle user interactions
  - Example: `/calendar/page.tsx` (server) → `/calendar/CalendarClient.tsx` (client)

### API Route Conventions
- **File Location**: `app/api/{resource}/route.ts` or `app/api/{resource}/[id]/route.ts`
- **HTTP Methods**: Use correct method (GET, POST, PUT, DELETE)
- **Response Format**: Always return JSON
- **Error Handling**: Try-catch with proper status codes
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (no acting user)
  - 403: Forbidden (permission denied)
  - 404: Not Found
  - 500: Internal Server Error
- **Validation**: Use Zod schemas for all inputs

### Database Conventions
- **UUIDs**: Use UUIDs for all primary keys
- **Timestamps**: `createdAt`, `updatedAt` where appropriate
- **Naming**: camelCase for fields (`ownerUserId`, not `owner_user_id`)
- **Relations**: Use descriptive relation names (`pupOwner`, not just `owner`)
- **Enums**: SCREAMING_SNAKE_CASE (`OPEN`, `ASSIGNED`, `PENDING`)

### Business Logic Location
- **API Routes**: All business rules enforced in API route handlers
- **Server Components**: Data fetching only, minimal logic
- **Client Components**: UI state and interactions only
- **No DB Access in Client**: Prisma only used in server components and API routes

## Authentication (V1)

### "Acting User" Pattern
- **Cookie-based**: Store `acting_user_id` in HTTP-only cookie
- **No real auth**: Users select themselves from dropdown
- **Session Persistence**: Cookie persists across page loads
- **Server-side**: All API routes check `actingUserId` from cookie

### Future: Real Authentication
- Replace acting user with next-auth or Supabase Auth
- Add password/magic link authentication
- Add user registration flow
- Migrate existing users to have email/password

## Data Access Patterns

### Server Components
```typescript
// Good: Fetch data in server component
export default async function MyPage() {
  const data = await prisma.user.findMany();
  return <MyClient data={data} />;
}
```

### API Routes
```typescript
// Good: Validate and enforce business rules
export async function POST(request) {
  const actingUserId = await getActingUserId();
  if (!actingUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validated = schema.parse(body);

  // Check permissions
  // Execute business logic
  // Return response
}
```

### Client Components
```typescript
// Good: Fetch via API routes
const response = await fetch('/api/resource');
const data = await response.json();
```

## Business Rules

### Hangout Assignment
- Only friends with `PupFriendship` can assign themselves
- Only `OPEN` hangouts can be assigned
- Assigning changes status to `ASSIGNED`
- Unassigning returns status to `OPEN`

### Hangout Creation
- Only `OWNER` users can create hangouts
- Owners can only create for their own pups
- Optional immediate assignment (must verify friendship)

### Suggestions
- Only `FRIEND` users can suggest times
- Friends can only suggest for pups they have friendship with
- Creates `HangoutSuggestion` with `PENDING` status
- Only pup owner can approve/reject
- Approving creates new `Hangout` with `OPEN` status

### Notes
- Only owner or assigned friend can add notes
- Notes visible to all involved parties
- Chronological display (oldest first)

## Testing Strategy (Not Yet Implemented)

### Unit Tests (Vitest)
- API route validation logic
- Zod schemas
- Helper functions
- Run: `npm run test`

### E2E Tests (Playwright)
- Critical user flows
- Run: `npm run test:e2e`

### Manual Testing
- See README.md "Manual Acceptance Testing Checklist"

## Deployment

### Environment Variables
- `DATABASE_URL`: Supabase connection string (URL-encoded password)

### Vercel Configuration
- Framework: Next.js
- Node Version: 18.x or later
- Build Command: `npm run build`
- Install Command: `npm install`

### Database Migrations
- Development: `npm run prisma:migrate`
- Production: Migrations auto-applied on deployment OR run SQL manually in Supabase

### Seeding
- Development: `npm run prisma:seed`
- Production: Optional, for demo data

## Performance Considerations

### Server Components
- Fetch data close to where it's needed
- Use parallel fetches when possible
- Leverage Next.js caching

### Client Components
- Minimize use of `'use client'`
- Only mark interactive components as client components
- Use React Server Components by default

### Database
- Add indexes on frequently queried fields (pupId, userId, status)
- Use `include` instead of separate queries
- Limit query results (`take: 20`)

## Common Pitfalls

### Path Aliases
- Use `@/` prefix for imports from `app/` directory
- Configured in `tsconfig.json`: `"@/*": ["./app/*"]`

### Prisma Client
- Use singleton pattern (`app/lib/prisma.ts`)
- Don't create multiple instances (causes connection pool issues)

### Cookie Access
- Use helper functions (`getActingUserId`, `setActingUserId`)
- Remember to `await cookies()` in Next.js 15+

### Date Handling
- Store dates as UTC in database
- Display in user's timezone
- Use `Date.toISOString()` for API payloads

### FullCalendar CSS
- Import CSS in layout.tsx
- Use non-premium features only (MIT license)

## Future Enhancements (V2)

### Phase 2 Features
- Photo uploads (Supabase Storage)
- WhatsApp integration
- Real authentication
- User registration
- Email notifications
- Recurring hangouts
- Drag-and-drop calendar editing
- Mobile app (React Native)

### Scalability
- Add Redis for caching
- Add search functionality
- Add pagination
- Optimize queries with indexes
- Add rate limiting on API routes

## Contributing

When adding new features:
1. Follow existing patterns
2. Add API validation with Zod
3. Enforce business rules server-side
4. Update README if adding new functionality
5. Run `npm run typecheck` and `npm run lint`
6. Test manually with different user roles

## Questions?

For questions or issues, contact the project maintainer.
