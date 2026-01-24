# DogCal 🐾

A web application for dog owners to coordinate care time for their pups with trusted friends.

## Overview

DogCal is a scheduling and coordination tool that helps dog owners arrange hangouts for their pets with friends who care for them. The app features a calendar view, hangout management, friend suggestions, and a notes system.

## Features

### For Pup Owners (🏠)
- Create and manage hangout events for your pups
- Assign hangouts to specific friends or leave them open
- View all hangouts on a calendar
- Approve or reject time suggestions from friends
- Add care instructions and notes to hangouts

### For Pup Friends (🤝)
- View available hangouts for pups you care for
- Self-assign to open hangout times
- Suggest new hangout times to owners
- Add notes and updates during hangouts
- View your upcoming commitments on a calendar

### Shared Features
- Interactive weekly calendar view with color-coded events
- Real-time updates when hangouts are assigned/unassigned
- Notes thread on each hangout
- Mobile-responsive design
- Timezone-aware scheduling

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Calendar**: FullCalendar React
- **Validation**: Zod
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dogcal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase database**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - **CRITICAL for Vercel**: Click the green **"Connect"** button at the top of your dashboard
   - In the connection modal:
     - Select **"Transaction pooler"** from the mode dropdown
     - Copy the connection string (format: `postgresql://postgres.[PROJECT-REF]:[password]@aws-X-region.pooler.supabase.com:6543/postgres`)
   - **Important**: URL-encode special characters in the password:
     - `?` becomes `%3F`
     - `!` becomes `%21`
     - `*` becomes `%2A`

4. **Configure environment variables**
   ```bash
   # Create .env.local file with Transaction pooler connection string
   echo 'DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[encoded-password]@aws-X-region.pooler.supabase.com:6543/postgres"' > .env.local
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database with sample data**
   ```bash
   npm run prisma:seed
   ```

   This creates:
   - 2 owners (Sarah Johnson, Michael Chen)
   - 3 friends (Emma Davis, Alex Rodriguez, Jamie Williams)
   - 3 pups (Max, Luna, Charlie)
   - Several hangouts and suggestions for testing

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Select a user from the dropdown to begin

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Database Management

### View/Edit Data
```bash
npm run prisma:studio
```
This opens Prisma Studio at [http://localhost:5555](http://localhost:5555) where you can:
- View all database tables
- Edit existing records
- Add new users, pups, or friendships manually

### Reset Database
```bash
# Reset and re-run migrations
npx prisma migrate reset

# Re-seed with sample data
npm run prisma:seed
```

## Deployment to Vercel

### Step 1: Prepare Your Database

1. Ensure your Supabase project is set up and migrations are run
2. Optionally seed production database with sample data

### Step 2: Deploy to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add `DATABASE_URL` with your Supabase **Transaction pooler** connection string
   - **CRITICAL**: Must use the pooler URL from Connect → Transaction pooler
   - Format: `postgresql://postgres.[PROJECT-REF]:[encoded-password]@aws-X-region.pooler.supabase.com:6543/postgres`
   - Make sure the password special characters are URL-encoded

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Step 3: Post-Deployment

1. **Run migrations** (if not already run on production DB):
   - The migrations are already applied if you used the same Supabase project
   - Otherwise, run SQL from `prisma/migrations` in Supabase SQL Editor

2. **Seed production database** (optional, for demo):
   ```bash
   DATABASE_URL="your-prod-url" npm run prisma:seed
   ```

3. **Test the deployed app**:
   - Visit your Vercel URL
   - Select a user and test all flows

## Manual Acceptance Testing Checklist

Test these scenarios on the deployed app:

### ✅ User Selection & Navigation
- [ ] Can select a user from the dropdown on home page
- [ ] Owner sees "Create Hangout" and "Approvals" in nav
- [ ] Friend sees "Suggest Time" in nav
- [ ] Role badge shows correctly (🏠 Owner or 🤝 Friend)

### ✅ Owner Workflows
- [ ] Can create a new hangout for my pup
- [ ] Hangout appears on calendar as yellow (OPEN)
- [ ] Can assign hangout to a specific friend during creation
- [ ] Assigned hangout appears as orange (ASSIGNED)
- [ ] Can view pending suggestions in Approvals page
- [ ] Can approve a suggestion → creates new OPEN hangout
- [ ] Can reject a suggestion with optional comment
- [ ] Can add notes to any of my pups' hangouts

### ✅ Friend Workflows
- [ ] Can see available OPEN hangouts for pups I'm friends with
- [ ] Can click "I'll take this!" to assign myself
- [ ] Status changes to ASSIGNED (orange) after assignment
- [ ] Can unassign myself (returns to OPEN)
- [ ] Can suggest a new hangout time for a pup
- [ ] Suggestion appears in owner's Approvals page
- [ ] Can add notes to hangouts I'm assigned to

### ✅ Calendar & UI
- [ ] Calendar displays all relevant hangouts
- [ ] Can switch between week view and list view
- [ ] Clicking an event opens details modal
- [ ] Modal shows pup info, times, care instructions
- [ ] Notes thread displays chronologically
- [ ] Can add new notes via the form in modal
- [ ] Colors are correct: Yellow (OPEN), Orange (ASSIGNED)

### ✅ Mobile Responsiveness
- [ ] App works on mobile browser (test on phone)
- [ ] Calendar is readable on small screen
- [ ] Forms are usable with touch
- [ ] Navigation works on mobile

### ✅ Data Integrity
- [ ] Cannot assign to a hangout if not friends with that pup
- [ ] Cannot create hangout for pup I don't own
- [ ] Cannot approve suggestions for pups I don't own
- [ ] Times display in correct timezone

## Data Model

### Users
- Role: OWNER or FRIEND
- Has name, address

### Pups
- Belong to one owner
- Have care instructions

### PupFriendships
- Links friends to pups they can care for
- Unique per pup-friend pair

### Hangouts
- Status: OPEN, ASSIGNED, COMPLETED, CANCELLED
- Can be assigned to one friend
- Includes owner notes and care instructions

### HangoutNotes
- Comments/updates on hangouts
- Visible to owner and assigned friend

### HangoutSuggestions
- Status: PENDING, APPROVED, REJECTED
- Friends suggest times, owners approve/reject
- Approved suggestions create new hangouts

## Adding New Users

To add users to the database manually:

1. **Open Prisma Studio**:
   ```bash
   npm run prisma:studio
   ```

2. **Navigate to User table**

3. **Click "Add record"**

4. **Fill in fields**:
   - name: "New User Name"
   - role: OWNER or FRIEND
   - addressText: "123 Main St"

5. **Create pups** (if owner) and **friendships** (if friend)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env.local` is correct
- Ensure password special characters are URL-encoded
- Check Supabase project is active and not paused

### Build Errors
- Run `npm run typecheck` to find TypeScript errors
- Run `npm run lint` to find linting issues
- Delete `.next` folder and rebuild

### Missing Data
- Re-run `npm run prisma:seed` to restore sample data
- Use Prisma Studio to manually add data

## Environment Variables

Required environment variables:

```bash
DATABASE_URL="postgresql://postgres:[encoded-password]@[host]:5432/postgres"
```

## License

Private project - All rights reserved.
