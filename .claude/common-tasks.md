# DogCal - Common Tasks

## Development

### Start Development Server
```bash
npm run dev
# Opens at http://localhost:3000
```

### View Database (Prisma Studio)
```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

### Reset Database with Demo Data
```bash
npm run db:reset
# Creates: 2 owners, 2 friends, 2 pups, sample hangouts
```

### Run Type Checking
```bash
npm run typecheck
```

### Run Linting
```bash
npm run lint
```

### Run Tests
```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests (Playwright)
```

---

## Database Operations

### Create a Migration
```bash
npm run prisma:migrate
# Or with name:
npx prisma migrate dev --name add_new_field
```

### Apply Migrations (Production)
```bash
DATABASE_URL="<prod-url>" npx prisma migrate deploy
```

### Generate Prisma Client
```bash
npx prisma generate
# Usually automatic after migrate
```

### View Schema
File: `prisma/schema.prisma`

---

## Adding a New Feature

### 1. New API Route
Create: `app/api/{resource}/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  // validation schema
});

export async function POST(request: NextRequest) {
  try {
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = schema.parse(body);

    // Business logic...

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### 2. New Page
Create: `app/{page}/page.tsx` (server component)
```typescript
import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import AppLayout from '@/components/AppLayout';
import MyClient from './MyClient';

export default async function MyPage() {
  const actingUserId = await getActingUserId();
  if (!actingUserId) redirect('/');

  const data = await prisma.model.findMany({ ... });

  return (
    <AppLayout user={user}>
      <MyClient data={data} />
    </AppLayout>
  );
}
```

### 3. New Client Component
Create: `app/components/MyComponent.tsx`
```typescript
'use client';

import { useState } from 'react';

type Props = {
  data: DataType[];
};

export default function MyComponent({ data }: Props) {
  const [state, setState] = useState(initialValue);

  return (
    // JSX
  );
}
```

---

## Adding a Notification

### 1. Create Message Template
File: `app/lib/messageTemplates.ts`
```typescript
export async function generateMyNotificationMessage(params: {
  userId: string;
  userName: string;
  // ... other params
}): Promise<string> {
  const loginUrl = await getLoginUrl(params.userId);

  return `🐕 *DogCal: Title*

Hi ${params.userName}!

Message body...

👉 Take action:

${loginUrl}`;
}
```

### 2. Add to API Route
```typescript
import { sendWhatsAppMessage, isValidPhoneNumber, type NotificationResult } from '@/lib/whatsapp';
import { generateMyNotificationMessage } from '@/lib/messageTemplates';

// After main operation:
const notificationResults: NotificationResult[] = [];

if (process.env.WHATSAPP_ENABLED === 'true') {
  try {
    if (!isValidPhoneNumber(user.phoneNumber)) {
      notificationResults.push({
        userId: user.id,
        userName: user.name,
        phoneNumber: user.phoneNumber,
        status: 'skipped',
        reason: 'No valid phone number',
      });
    } else {
      const message = await generateMyNotificationMessage({ ... });
      const result = await sendWhatsAppMessage(user.phoneNumber!, message);

      notificationResults.push({
        userId: user.id,
        userName: user.name,
        phoneNumber: user.phoneNumber,
        status: result.success ? 'sent' : 'failed',
        reason: result.error,
        twilioSid: result.sid,
      });
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

return NextResponse.json({ result, notifications: notificationResults });
```

---

## Testing Login

### As Owner
1. Go to `/admin?token=dev-admin-token`
2. Click "Generate tokens" tab
3. Copy login URL for an owner
4. Open in browser

### As Friend
Same process, copy friend's login URL

### Quick Switch (Dev)
1. Go to admin page
2. Use "Login as user" tab
3. Click any user avatar

---

## Deploying

### To Vercel (Production)
```bash
git push origin main
# Vercel auto-deploys from main branch
```

### Environment Variables
Set in Vercel dashboard > Project > Settings > Environment Variables

Required:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `WHATSAPP_ENABLED`
- `LOGIN_TOKEN_SECRET`
- `ADMIN_TOKEN`

---

## Debugging

### Check API Response
```bash
curl -X GET http://localhost:3000/api/hangouts \
  -H "Cookie: acting_user_id=<user-id>"
```

### View Logs
- Dev: Terminal running `npm run dev`
- Production: Vercel dashboard > Deployments > Functions

### Check Database State
```bash
npm run prisma:studio
```

### Check Twilio Logs
Twilio Console > Monitor > Logs > Messaging

---

## Common Fixes

### "Module not found" after schema change
```bash
npx prisma generate
```

### Database out of sync
```bash
npm run prisma:migrate
```

### Type errors after Prisma change
```bash
npm run typecheck
# Then fix any issues shown
```

### WhatsApp not sending
1. Check `WHATSAPP_ENABLED=true` in `.env.local`
2. Check Twilio credentials are real (not "placeholder")
3. Check recipient has valid phone number
4. Check Twilio console for errors
