# DogCal Quick Reference

## 🚀 Essential Commands

### Development Server
```bash
# Start dev server
npm run dev

# Kill and restart server
kill $(lsof -ti:3000) 2>/dev/null; cd "/Users/asliceoftom/Documents/projects/Edi projects/dogcal" && npm run dev
```

### Database
```bash
# Reset dev database (clean slate with demo data)
npm run db:reset

# View/edit database in browser
npm run prisma:studio

# Create migration after schema changes
npm run prisma:migrate
```

### Testing
```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run admin tests only
npm run test:admin

# Reset database then run tests
npm run db:reset-and-test

# Watch mode (re-run on changes)
npm run test:watch
```

### Code Quality
```bash
# Type check
npm run typecheck

# Lint
npm run lint

# All checks (CI pipeline)
npm run ci:check
```

## 📊 Demo Data (After npm run db:reset)

### Users with WhatsApp (+447476238512)
- 👤 **Edi & Tom** (Owner) - Has pup "Max"
- 👤 **Alex** (Friend) - Can care for both pups

### All Users
- Edi & Tom (Owner)
- Sarah (Owner) - Has pup "Luna"
- Alex (Friend)
- Jamie (Friend)

### Sample Events
- 1 open hangout (needs assignment)
- 1 assigned hangout (upcoming)
- 1 completed hangout (past)
- 1 pending suggestion

## 🔑 Admin Access

```
http://localhost:3000/admin?token=admin-secret-token-change-in-production
```

Tabs:
- **Login as User** - Quick login for testing
- **Manage Users** - Add owners/friends/pups
- **Generate Tokens** - Get login URLs for all users

## 🔗 Key URLs

```bash
# Home page (requires login)
http://localhost:3000

# Admin panel
http://localhost:3000/admin?token=admin-secret-token-change-in-production

# Calendar view (requires login)
http://localhost:3000/calendar

# Approvals page (requires login)
http://localhost:3000/approvals

# Prisma Studio
http://localhost:5555 (after npm run prisma:studio)
```

## 📱 WhatsApp Testing

Users with test phone number `+447476238512`:
1. Edi & Tom (owner)
2. Alex (friend)

Test scenarios:
- Create hangout as Edi & Tom → Alex gets notification
- Suggest time as Alex → Edi & Tom gets notification

## 🐛 Troubleshooting

### Server won't start
```bash
# Kill existing process
kill $(lsof -ti:3000)

# Check what's using port 3000
lsof -i:3000
```

### Tests failing with data issues
```bash
# Reset database
npm run db:reset

# Then run tests
npm test
```

### Database connection errors
```bash
# Test connection
npx prisma db pull

# Check .env.local has correct DATABASE_URL
```

### Image loading errors
- Only images from `supabase.co` domain work
- Others show fallback avatars (colored initials)
- To add new domains: Update `next.config.ts`

### "Module not found" errors
```bash
# Reinstall dependencies
npm install

# Regenerate Prisma client
npx prisma generate
```

## 📁 Important Files

```
.env.local                  # Dev environment variables (gitignored)
env.production.example      # Production template
DATABASE.md                 # Full database guide
CLAUDE.md                   # Project conventions
package.json                # Scripts and dependencies
prisma/schema.prisma        # Database schema
prisma/reset-dev-db.ts      # Database reset script
__tests__/                  # Test suite
```

## 🔐 Security

**Never commit:**
- `.env.local` (dev credentials)
- `.env.production.local` (prod credentials)

**Safe to commit:**
- `env.production.example` (template)
- Schema files
- Test files

## 🎯 Common Workflows

### After pulling from git
```bash
npm install
npx prisma generate
npm run dev
```

### After running integration tests
```bash
npm run db:reset
```

### Before committing
```bash
npm run typecheck
npm run lint
npm test
```

### Setting up production
```bash
# 1. Create new Supabase project
# 2. Copy env template
cp env.production.example .env.production.local

# 3. Update with production values
# 4. Run migrations on production
DATABASE_URL="<prod-url>" npx prisma migrate deploy
```

### Adding a new feature
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# 3. Update schema if needed
npm run prisma:migrate

# 4. Test
npm run test

# 5. Type check
npm run typecheck

# 6. Commit
git add .
git commit -m "Add my feature"
```

## 📞 Need Help?

1. Check `DATABASE.md` for database issues
2. Check `CLAUDE.md` for coding conventions
3. Check `__tests__/README.md` for testing info
4. Check error messages in terminal
5. Run `npm run db:reset` to start fresh

## 🎨 UI Components

- UserSelector: Login screen with user avatars
- CalendarClient: FullCalendar event view
- ManageUsers: Admin forms for creating users/pups
- GenerateTokens: Admin token display with copy/WhatsApp

## 🗄️ Database Models

- **User** - Owners and Friends
- **Pup** - Dogs needing care
- **PupFriendship** - Which friends can care for which pups
- **Hangout** - Time slots for pup care
- **HangoutSuggestion** - Friend-suggested times
- **HangoutNote** - Comments on hangouts

## 💡 Pro Tips

- Use `npm run db:reset` frequently to keep dev clean
- Check Prisma Studio to debug data issues
- Use test phone number for WhatsApp testing
- Run tests before committing
- Keep dev and prod databases separate
- Generate login tokens after db:reset

---

**Last Updated:** 2026-01-28
**Version:** 1.0
