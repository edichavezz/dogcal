# DogCal - Current State

*Last updated: 2025-01-30*

## What's Working

### Core Features (Complete)
- [x] User authentication via magic links
- [x] Owner: Create hangouts (single + recurring)
- [x] Owner: View/manage pups and friends
- [x] Owner: Approve/reject suggestions
- [x] Friend: View available hangouts
- [x] Friend: Assign/unassign from hangouts
- [x] Friend: Suggest times
- [x] Calendar view (week + list modes)
- [x] Notes thread on hangouts
- [x] Photo uploads (Supabase storage)
- [x] Admin panel (user management, token generation)

### Notifications (Partial)
- [x] WhatsApp: New hangout created → notify friends
- [x] WhatsApp: New suggestion → notify owner
- [x] WhatsApp: Friend assigns to hangout → notify owner (NEW)
- [x] WhatsApp: Friend unassigns from hangout → notify owner (NEW)
- [ ] WhatsApp: Suggestion approved → notify friend
- [ ] WhatsApp: Suggestion rejected → notify friend

### UI/UX
- [x] Home page redesign with action-focused layout
- [x] Role-based views (different UI for Owner vs Friend)
- [x] Sentence case titles throughout app
- [x] Mobile-responsive design
- [x] Performance optimizations (indexes, parallel queries)

---

## In Progress

### WhatsApp Business Setup
**Status**: Blocked - waiting for Meta rate limit reset

**Context**: Setting up Twilio WhatsApp Business number for production notifications.

**Where we left off**:
1. Bought Twilio number: `+44 7426 493118`
2. Started WhatsApp Business registration in Twilio console
3. Meta verification requires SMS code sent to the number
4. Hit rate limit after multiple attempts (SMS not being received)

**Next steps**:
1. Wait for rate limit to reset (1-24 hours)
2. Verify SMS capability is enabled on Twilio number
3. Retry WhatsApp Business registration
4. Once approved, update environment variables:
   ```
   TWILIO_WHATSAPP_FROM=whatsapp:+447426493118
   WHATSAPP_ENABLED=true
   ```

**Twilio credentials** (already have):
- Account SID: *(in Twilio console)*
- Auth Token: *(in Twilio console)*
- Number: +44 7426 493118

---

## Recent Changes

### 2025-01-30
1. Applied sentence case to all titles across the app
2. Added WhatsApp notifications for hangout assign/unassign
   - New template: `generateHangoutUnassignedMessage()`
   - Updated: `app/api/hangouts/[id]/assign/route.ts`
   - Updated: `app/api/hangouts/[id]/unassign/route.ts`

### Previous
- Home page redesign with action-focused layout
- Performance optimizations (indexes, parallel queries)
- Admin interface redesign

---

## Known Issues

1. **WhatsApp not sending in production** - Credentials are placeholders, needs business number setup
2. **No notification for suggestion approval/rejection** - Templates exist but not wired up

---

## Environment Status

### Development (.env.local)
```
WHATSAPP_ENABLED=false  # Disabled until Twilio setup complete
TWILIO_* = placeholder values
```

### Production (Vercel)
- Needs Twilio environment variables once WhatsApp Business approved

---

## Priorities

1. **Immediate**: Complete Twilio WhatsApp Business setup
2. **Next**: Test all notifications end-to-end
3. **Future**: Add suggestion approval/rejection notifications
