# Testing Guide: Encrypted Login URLs & Admin Interface

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the admin panel:**
   Visit: `http://localhost:3000/admin?token=admin-secret-token-change-in-production`

## Testing the New Features

### 1. Admin Panel Access

**Test valid admin token:**
- URL: `http://localhost:3000/admin?token=admin-secret-token-change-in-production`
- Expected: Should see admin interface with 3 tabs

**Test invalid admin token:**
- URL: `http://localhost:3000/admin?token=wrong-token`
- Expected: Should see "Access denied" message

**Test no token:**
- URL: `http://localhost:3000/admin`
- Expected: Should see "Access denied" message

### 2. Admin Tab 1: Login as User

- Click on any user card to log in as that user
- Expected: Should redirect to home page (welcome screen) with that user's profile
- Check browser cookie: Should have `acting_user_id` set

### 3. Admin Tab 2: Manage Users

**Add New Owner:**
1. Fill out the "Add New Owner" form
   - Name (required): e.g., "Test Owner"
   - Phone Number: e.g., "+1234567890"
   - Profile Photo URL: Any valid image URL
   - Address: e.g., "123 Test St"
2. Click "Add Owner"
3. Expected: Success message and user appears in "All Users" table below

**Add New Pup:**
1. Fill out the "Add New Pup" form
   - Select an owner from dropdown
   - Name (required): e.g., "Test Pup"
   - Breed: e.g., "Golden Retriever"
   - Profile Photo URL: Any valid image URL
   - Care Instructions: e.g., "Needs to be walked twice a day"
2. Click "Add Pup"
3. Expected: Success message

**Add New Friend:**
1. Fill out the "Add New Friend" form
   - Name (required): e.g., "Test Friend"
   - Phone Number: e.g., "+1234567890"
   - Check boxes for which pups they can care for
2. Click "Add Friend"
3. Expected: Success message and user appears in "All Users" table

### 4. Admin Tab 3: Generate Tokens

1. Click "Generate All Login URLs" button
2. Expected: Table appears with all users and their login URLs
3. Test copy button:
   - Click "Copy" next to any user
   - Button should turn green and say "Copied!"
   - Paste in a new tab - should be a valid URL like:
     `http://localhost:3000/login/[encrypted-token]`
4. Test WhatsApp button (if user has phone number):
   - Click "WhatsApp" button
   - Expected: Opens WhatsApp Web with pre-filled message containing login link

### 5. Login Token Flow

**Test valid login token:**
1. Copy a login URL from the admin panel
2. Open in a new incognito/private window
3. Expected:
   - Should automatically set authentication cookie
   - Should redirect to home page (welcome screen)
   - Should see personalized welcome with user's name and pups

**Test invalid login token:**
1. Visit `http://localhost:3000/login/invalid-token-123`
2. Expected: Should see "Invalid Login Link" error page

**Test token with destination:**
- The login tokens generated in WhatsApp messages include destinations
- When clicked from a WhatsApp message, users should be redirected to the specific page (calendar or approvals) after login

### 6. Welcome Screen (Root Page)

**Test while logged in:**
1. Log in as a user via admin panel
2. Visit `http://localhost:3000/`
3. Expected:
   - Should see personalized welcome message
   - Should see user profile with photo and role badge
   - For OWNERS: Should see their pups with photos
   - For FRIENDS: Should see pups they care for with owner names
   - Should see quick action buttons (view calendar, create hangout, etc.)

**Test while NOT logged in:**
1. Clear cookies or use incognito window
2. Visit `http://localhost:3000/`
3. Expected: Should see message "Please use your personalized login link"

### 7. WhatsApp Integration

**Test hangout creation notification:**
1. Log in as an owner
2. Create a new hangout via `/hangouts/new`
3. If WhatsApp is enabled and friends have phone numbers:
   - Friends should receive WhatsApp messages with personalized login links
   - Links should redirect to calendar with the hangout highlighted
4. Check admin "Generate Tokens" tab to verify different users get different URLs

**Test suggestion notification:**
1. Log in as a friend
2. Create a suggestion via `/suggest`
3. If WhatsApp is enabled and owner has phone number:
   - Owner should receive WhatsApp message with personalized login link
   - Link should redirect to approvals page with the suggestion highlighted

### 8. Security Testing

**Test token encryption:**
1. Generate tokens for multiple users
2. Verify tokens are different for each user
3. Verify tokens are opaque (can't see user ID)
4. Verify tokens are URL-safe (no special characters)

**Test token reuse:**
1. Copy a login URL
2. Use it to log in
3. Log out (clear cookies)
4. Use the same URL again
5. Expected: Should still work (tokens are reusable)

**Test admin token protection:**
1. Try to access `/admin` without token
2. Try with wrong token
3. Expected: Both should show "Access denied"

## Environment Variables

Make sure these are set in `.env.local`:

```bash
# Login Token Encryption Secret (already set)
LOGIN_TOKEN_SECRET=a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0

# Admin Panel Access Token (already set)
ADMIN_TOKEN=admin-secret-token-change-in-production

# Other required variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
WHATSAPP_ENABLED=true
```

## Production Deployment Checklist

Before deploying to production:

1. **Generate secure secrets:**
   ```bash
   # Generate LOGIN_TOKEN_SECRET (64 chars)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate ADMIN_TOKEN (strong random string)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. **Update environment variables in Vercel:**
   - Set `LOGIN_TOKEN_SECRET` to the generated value
   - Set `ADMIN_TOKEN` to the generated value
   - Set `NEXT_PUBLIC_APP_URL` to your production domain (https://...)
   - Ensure `WHATSAPP_ENABLED=true`
   - Update Twilio settings for production WhatsApp number

3. **Distribute login URLs:**
   - Access admin panel in production
   - Generate tokens for all users
   - Send login URLs via WhatsApp, email, or SMS

4. **Security notes:**
   - Keep ADMIN_TOKEN secret (never commit to git)
   - Share admin URL only with trusted administrators
   - Login tokens act as passwords - users should keep them private
   - Consider adding token expiration for production (optional)

## Troubleshooting

**Issue: "Invalid or expired login link" error**
- Verify `LOGIN_TOKEN_SECRET` is set in environment
- Ensure secret is at least 32 characters
- Check that Prisma client is up to date (`npm run prisma:generate`)

**Issue: Admin panel shows "Access denied"**
- Verify `ADMIN_TOKEN` is set in environment
- Check URL has correct token parameter: `?token=your-token`

**Issue: Welcome screen doesn't show user data**
- Check that user is logged in (cookie is set)
- Verify database connection is working
- Check browser console for errors

**Issue: WhatsApp notifications not sending**
- Verify `WHATSAPP_ENABLED=true` in environment
- Check Twilio credentials are correct
- Ensure users have valid phone numbers
- Check Twilio sandbox is joined (for development)

**Issue: Type errors after pulling changes**
- Run `npm run prisma:generate` to regenerate Prisma client
- Run `npm run typecheck` to verify no errors

## Next Steps

After testing, consider implementing:

1. **Token expiration:** Add `expiresAt` field to token payload
2. **Logout functionality:** Add logout button that clears cookie
3. **User profile editing:** Allow users to edit their own profiles
4. **QR codes:** Generate QR codes for easy mobile access
5. **Email invitations:** Send login links via email in addition to WhatsApp
6. **Audit logging:** Track admin actions in database
7. **Rate limiting:** Prevent abuse of login and admin endpoints
