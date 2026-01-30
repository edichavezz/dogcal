# DogCal - Conventions

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TopNav.tsx`, `EventDetailsModal.tsx` |
| Pages/Routes | lowercase | `page.tsx`, `route.ts`, `layout.tsx` |
| Utilities | camelCase | `cookies.ts`, `whatsapp.ts` |
| Types (standalone) | PascalCase | `types.ts` with `type User = ...` |

## Code Style

### TypeScript
- Strict mode enabled
- Explicit return types on exported functions
- Use `type` over `interface` (project convention)
- Avoid `any` - use `unknown` if truly unknown

### Components
```tsx
// Good: Named export, typed props
type Props = {
  user: User;
  onClose: () => void;
};

export default function MyComponent({ user, onClose }: Props) {
  // ...
}
```

### API Routes
```typescript
// Standard structure
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();

    // 1. Auth check
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation (Zod)
    const body = await request.json();
    const validated = schema.parse(body);

    // 3. Business logic
    const result = await prisma.model.create({ ... });

    // 4. Return response
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error description:', error);
    return NextResponse.json({ error: 'Message' }, { status: 500 });
  }
}
```

## Database Conventions

### Field Naming
- camelCase for all fields: `ownerUserId`, `createdAt`
- Boolean fields: `isActive`, `hasNotes` (verb prefix)
- Foreign keys: `{relation}Id` e.g., `pupId`, `ownerUserId`

### Enum Values
- SCREAMING_SNAKE_CASE: `OPEN`, `ASSIGNED`, `PENDING`

### Relations
- Descriptive names: `pupOwner`, `assignedFriend`, `createdByOwner`

## UI Conventions

### Titles and Labels
- **Sentence case** for all titles: "Create new hangout" not "Create New Hangout"
- Consistent terminology:
  - "Hangout" (not "event" or "session")
  - "Pup" (not "dog" or "pet")
  - "Friend" (not "caregiver" or "sitter")

### Status Display
| Status | Color | Badge |
|--------|-------|-------|
| OPEN | Amber/Yellow | Available |
| ASSIGNED | Teal/Dark | Assigned |
| COMPLETED | Gray | Completed |
| CANCELLED | Gray | Cancelled |
| PENDING | Blue | Pending |

### Buttons
- Primary action: Coral/pink background (`bg-[#f4a9a8]`)
- Secondary: Dark teal (`bg-[#1a3a3a]`)
- Destructive: Red (`bg-red-500`)
- Cancel: Gray (`bg-gray-200`)

## Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import { NextRequest, NextResponse } from 'next/server';

// 2. External libraries
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Internal - lib/utils
import { prisma } from '@/lib/prisma';
import { getActingUserId } from '@/lib/cookies';

// 4. Internal - components
import Avatar from '@/components/Avatar';

// 5. Types (if separate)
import type { User } from '@prisma/client';
```

## Path Aliases

Use `@/` for imports from `app/` directory:
```typescript
// Good
import { prisma } from '@/lib/prisma';

// Avoid
import { prisma } from '../../../lib/prisma';
```

## Error Messages

### API Errors
- User-facing: Clear, actionable: "You are not assigned to this hangout"
- Internal: Descriptive for debugging: "Error assigning hangout:"

### Form Validation
- Inline errors below fields
- Red text, clear message: "Please select a pup"

## Comments

### When to Comment
- Non-obvious business logic
- Workarounds with context
- TODO items with ticket/reason

### When NOT to Comment
- Self-explanatory code
- Function names that describe purpose
- Type definitions (types are self-documenting)

```typescript
// Good: Explains why
// Delay between messages to avoid Twilio rate limiting
await new Promise(resolve => setTimeout(resolve, 100));

// Bad: Explains what (obvious from code)
// Loop through users
for (const user of users) { ... }
```

## Git Conventions

### Branch Names
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code improvements

### Commit Messages
```
Short summary (imperative mood)

- Bullet points for details
- What changed and why

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### What to Commit
- Source code changes
- Schema changes
- Test updates

### What NOT to Commit
- `.env.local` (secrets)
- `node_modules/`
- `.claude/settings.local.json`
