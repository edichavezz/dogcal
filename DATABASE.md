# Database Management Guide

## Environment Setup

### Development Environment

The project uses `.env.local` for development. This file contains:
- Development database connection
- Test WhatsApp credentials
- Dev admin token

**Never commit `.env.local` to git!**

### Production Environment

For production, create `.env.production.local`:

```bash
cp .env.production.local.example .env.production.local
```

Then update with your production values:
- Production Supabase project URL and keys
- Production Twilio credentials
- Production app URL
- New secure admin token
- New login token secret

## Database Reset Script

### Quick Reset

Reset the dev database with clean demo data:

```bash
npm run db:reset
```

This will:
1. ✅ Delete all existing data
2. ✅ Create 2 owners (including "Edi & Tom" with +447476238512)
3. ✅ Create 2 friends (including "Alex" with +447476238512)
4. ✅ Create 2 pups
5. ✅ Create 3 friendships
6. ✅ Create 3 sample hangouts (open, assigned, completed)
7. ✅ Create 1 pending suggestion

### After Running Tests

Run this to clean up test data and restore demo environment:

```bash
npm run db:reset-and-test
```

Or just reset:

```bash
npm run db:reset
```

## Demo Data Included

### Users

**Owners:**
- 👤 **Edi & Tom** - Phone: +447476238512 (your test number)
- 👤 **Sarah**

**Friends:**
- 👤 **Alex** - Phone: +447476238512 (your test number)
- 👤 **Jamie**

### Pups

- 🐕 **Max** (Golden Retriever) - Owner: Edi & Tom
- 🐕 **Luna** (Border Collie) - Owner: Sarah

### Sample Events

- 📅 1 open hangout (needs assignment)
- 📅 1 assigned hangout (upcoming)
- 📅 1 completed hangout (past)
- 💡 1 pending suggestion

## Getting Login URLs

After resetting the database:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Go to admin panel:
   ```
   http://localhost:3000/admin?token=admin-secret-token-change-in-production
   ```

3. Click **"🔑 Generate Tokens"** tab

4. Click **"Generate All Login URLs"**

5. Copy the login URLs for each user

## WhatsApp Testing

Two users have the test phone number `+447476238512`:
- Edi & Tom (owner)
- Alex (friend)

Use these accounts to test WhatsApp notifications.

## Database Migrations

### Create a Migration

When you change the Prisma schema:

```bash
npm run prisma:migrate
```

This will:
1. Generate migration SQL
2. Apply to database
3. Update Prisma client

### View Database

Open Prisma Studio to view/edit data:

```bash
npm run prisma:studio
```

Opens at: http://localhost:5555

## Separate Dev and Production

### Best Practice: Separate Supabase Projects

**Recommended Setup:**
1. **Dev Project**: Current Supabase project (in `.env.local`)
2. **Production Project**: New Supabase project (in `.env.production.local`)

**Why?**
- ✅ Complete isolation
- ✅ Test destructive operations safely
- ✅ Different data volumes
- ✅ Different API keys

### How to Set Up Production

1. Create new Supabase project for production
2. Copy `.env.production.local.example` to `.env.production.local`
3. Update with production credentials
4. Run migrations on production:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```

## Common Commands

```bash
# Reset dev database with demo data
npm run db:reset

# Reset and run tests
npm run db:reset-and-test

# View database in browser
npm run prisma:studio

# Create migration after schema changes
npm run prisma:migrate

# Seed database (legacy - use db:reset instead)
npm run prisma:seed

# Generate Prisma client (auto-runs on install)
npx prisma generate
```

## Troubleshooting

### "Database is not empty"

If migration fails because database has data:

```bash
npm run db:reset
```

### Test Data Cluttering Database

After running integration tests:

```bash
npm run db:reset
```

### Need Production Data in Dev

1. Export from production Supabase
2. Import to dev Supabase
3. Or use `pg_dump` and `psql`

**Never** copy dev data to production!

### Connection Issues

Check your `.env.local`:
- DATABASE_URL is correct
- Password is URL-encoded
- Network allows connection to Supabase

Test connection:

```bash
npx prisma db pull
```

## Database Schema

See `prisma/schema.prisma` for full schema.

Key models:
- **User** (OWNER or FRIEND)
- **Pup** (belongs to owner)
- **PupFriendship** (friend can care for pup)
- **Hangout** (time slot for pup care)
- **HangoutSuggestion** (friend suggests time)
- **HangoutNote** (comments on hangouts)

## Environment Variables Reference

### Required in All Environments

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Twilio WhatsApp
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+..."

# App
NEXT_PUBLIC_APP_URL="https://..."
WHATSAPP_ENABLED="true"

# Security
LOGIN_TOKEN_SECRET="..." # 32+ chars
ADMIN_TOKEN="..." # secure token
```

## Security Notes

🔒 **Never commit**:
- `.env.local`
- `.env.production.local`
- Any file with real credentials

✅ **Safe to commit**:
- `.env.production.local.example` (template only)
- `DATABASE.md` (documentation)
- `prisma/schema.prisma` (schema definition)

🔐 **Production secrets**:
- Use different secrets than dev
- Use Vercel environment variables
- Rotate regularly
