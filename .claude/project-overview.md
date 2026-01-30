# DogCal - Project Overview

## What is DogCal?

DogCal is a web application for dog owners to coordinate care time for their pups with trusted friends. Think of it as a shared calendar specifically designed for pet care coordination.

## Core Problem Solved

Dog owners need help caring for their pups when they're busy or away. Friends are willing to help but coordination is difficult. DogCal provides:
- A shared calendar showing when pups need care
- Easy way for friends to claim available hangout slots
- Suggestion system for friends to propose times they're available
- Communication via WhatsApp notifications

## User Roles

### Owners (OWNER role)
- Create and manage their pups
- Schedule hangout times when they need help
- Approve/reject time suggestions from friends
- Assign specific friends to hangouts
- Add notes and care instructions

### Friends (FRIEND role)
- See available hangouts for pups they're connected to
- Claim ("I'll take this!") open hangout slots
- Suggest times they're available
- Add notes during/after hangouts

## Key Features

1. **Hangout Management** - Create single or recurring care sessions
2. **Suggestion System** - Friends propose times, owners approve
3. **Calendar View** - Visual week/list view of all hangouts
4. **Notes Thread** - Communication between owner and friend per hangout
5. **WhatsApp Notifications** - Real-time alerts for new hangouts, assignments, etc.
6. **Magic Link Auth** - Simple login via personalized URLs (no passwords)

## Tech Stack Summary

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Calendar**: FullCalendar library
- **Notifications**: Twilio WhatsApp API
- **Hosting**: Vercel
- **Storage**: Supabase (photos)

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
├─────────────────────────────────────────────────┤
│  Pages (Server Components)                       │
│  └── Fetch data, render client components       │
├─────────────────────────────────────────────────┤
│  API Routes (/api/*)                            │
│  └── Business logic, validation, DB access      │
├─────────────────────────────────────────────────┤
│  Prisma ORM                                     │
│  └── Type-safe database queries                 │
├─────────────────────────────────────────────────┤
│  PostgreSQL (Supabase)                          │
└─────────────────────────────────────────────────┘
```

## Data Model (Simplified)

```
User (OWNER/FRIEND)
  │
  ├── owns ──────> Pup
  │                  │
  └── friends with ─┘ (via PupFriendship)
                     │
                     ├── Hangout (scheduled care time)
                     │     └── HangoutNote (communication)
                     │
                     └── HangoutSuggestion (proposed time)
```

## Project Goals

1. **Simplicity** - Easy for non-technical users
2. **Mobile-first** - Works great on phones
3. **Real-time communication** - WhatsApp integration
4. **Low friction** - Magic links, no passwords
5. **Reliability** - Clear status tracking, notifications
