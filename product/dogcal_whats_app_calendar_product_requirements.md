# Dogcal Product Requirements: WhatsApp & Calendar Integration

## Status
Draft – v1 (coordination-first architecture)

---

## 1. Context & Philosophy

Dogcal is a scheduling and coordination service for dog owners to arrange care **with trusted friends**, not paid sitters.

The core problem Dogcal solves is **social coordination friction**, not availability discovery or marketplace matching.

Most dog-care coordination today happens via:
- WhatsApp / group chats
- Ad-hoc messages
- Manual follow-ups
- Informal calendar entries

These methods break down because they:
- Don’t scale to multiple friends
- Create awkward social pressure
- Lose track of who said yes or no
- Don’t preserve history

Dogcal exists to *reduce emotional and logistical overhead* while preserving trust and informality.

---

## 2. Design Principles (Non‑Negotiable)

1. **Dogcal is the source of truth**  
   All hangouts live in Dogcal. External tools never silently mutate state.

2. **Communication-first, not app-first**  
   WhatsApp is a primary interaction surface. The app is optional for helpers.

3. **No mandatory integrations**  
   Dogcal must work fully without calendar or messaging integrations.

4. **Explicit over implicit**  
   No inferred availability, no background syncing, no surprise changes.

5. **Calendars are representations, not contracts**  
   Calendar events are exports of Dogcal state, not the other way around.

---

## 3. Core Domain Object: Hangout

A **Hangout** represents a request for dog care.

### Required fields
- `hangout_id`
- `dog_id`
- `owner_id`
- `start_time`
- `end_time`
- `time_flexibility` (exact | flexible | open)
- `type` (walk, daycare, overnight, etc.)
- `invitees[]`
- `responses[]`
- `status` (draft → sent → confirmed → completed / cancelled)

Hangouts are **always created and edited in Dogcal**.

---

## 4. WhatsApp Integration Requirements

### 4.1 Purpose

WhatsApp is used to:
- Notify friends of hangout requests
- Collect yes/no responses
- Confirm selections
- Communicate changes

Dogcal does **not** replace WhatsApp conversations. It augments them with structure.

---

### 4.2 Hangout Creation → WhatsApp Fan‑out

#### Entry points
- Dogcal app (primary)

#### Flow
1. Owner creates a hangout in Dogcal
2. Owner selects one or more friends
3. Owner sends the hangout
4. Dogcal sends WhatsApp messages to invitees

Each invite is sent:
- Individually (v1)
- From Dogcal’s WhatsApp number

---

### 4.3 WhatsApp Message Requirements

Each hangout message must include:
- Dog name
- Owner name
- Date & time
- Short description
- Clear call to action

Required actions:
- ✅ Yes, I can help
- ❌ Sorry, I can’t
- 🔍 View details (deep link to app)

Responses must:
- Be possible entirely within WhatsApp
- Immediately update Dogcal state

---

### 4.4 Response Handling

- **Yes**
  - Marks invitee as available
  - Does not auto-confirm

- **No**
  - Marks invitee as unavailable
  - No follow-up required

No “Maybe” option in v1.

---

### 4.5 Confirmation Flow

When one or more invitees respond “Yes”:

1. Owner selects a helper in Dogcal
2. Dogcal updates hangout to `confirmed`
3. Dogcal sends WhatsApp notifications:
   - Helper: confirmation
   - Others: polite closure message

---

### 4.6 Identity & Linking

- Each WhatsApp number must be linked to a Dogcal user
- Linking happens once via secure link
- No account creation required at response time after linking

---

## 5. Calendar Integration Requirements

### 5.1 Calendar Strategy (Intentional Constraints)

Dogcal does **not**:
- Sync calendars bidirectionally
- Read friend availability
- Infer free/busy time
- Auto-update based on calendar edits

Dogcal **does**:
- Maintain its own internal calendar
- Allow explicit export of confirmed hangouts

---

### 5.2 Dogcal Calendar (Authoritative)

- All hangouts live in Dogcal
- Hangout status is explicit and visible
- All edits happen in Dogcal

Calendars outside Dogcal are always secondary.

---

### 5.3 Calendar Export (Core Feature)

For confirmed hangouts, Dogcal must support:

#### Single export
- “Add to calendar” button
- Generates:
  - `.ics` file, or
  - Calendar deep link

#### Bulk export (optional / power users)
- Read-only ICS feed of confirmed hangouts
- Feed updates when hangouts change

No OAuth required.

---

### 5.4 Friend Calendar Support

- Friends may export confirmed hangouts to their calendar
- Calendar writes are:
  - Explicit
  - One-way
  - Only for confirmed hangouts

Tentative or requested hangouts are never exported.

---

### 5.5 Rescheduling & Changes

When a confirmed hangout changes:

1. Owner edits hangout in Dogcal
2. Dogcal:
   - Notifies helper via WhatsApp
   - Marks previous calendar export as outdated
3. Helper must re-accept
4. New calendar export is offered

Dogcal never silently updates calendar events.

---

### 5.6 Optional Calendar Ingestion (Future)

Later, Dogcal may support:
- Owners inviting a Dogcal email address to a calendar event
- Dogcal parsing the event into a **draft hangout**
- Owner must confirm before sending

This is not part of v1.

---

## 6. Why This Architecture

This approach intentionally:
- Minimises permissions and setup friction
- Preserves social norms and consent
- Avoids calendar edge‑case complexity
- Keeps Dogcal understandable and predictable

Dogcal succeeds by being:
- Polite
- Explicit
- Lightweight
- Trust‑preserving

Not by being “smart” or automated.

---

## 7. Out of Scope (Explicitly)

- Paid services or sitters
- Availability inference
- Automatic calendar syncing
- Ranking or reputation systems
- Marketplace dynamics

---

## 8. Success Criteria

- Owners can coordinate care without manual follow‑ups
- Friends can respond without installing the app
- No user is required to connect a calendar
- Calendar usage never causes confusion about truth

---

_End of document_