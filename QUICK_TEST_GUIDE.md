# Quick Test Guide - Followers/Following Feature

## Current Status
✅ Backend logic is correct - it updates followers/following when accepting friend requests
✅ Frontend displays the counts correctly from the profile data
✅ Sync scripts are ready to fix existing data

## What You Need To Do

### Step 1: Create Test Accounts
Since your database is currently empty, create two test accounts:

1. **Start the backend** (if not already running):
   ```bash
   cd Backend
   npm start
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   cd Frontend
   npm start
   ```

3. **Register Account 1**:
   - Go to `http://localhost:3000`
   - Click "Sign Up"
   - Name: Your Name
   - Email: your@email.com
   - Password: your password
   - Click Register

4. **Register Account 2** (use incognito/another browser):
   - Open incognito window or another browser
   - Go to `http://localhost:3000`
   - Click "Sign Up"
   - Name: Friend Name
   - Email: friend@email.com
   - Password: friend password
   - Click Register

### Step 2: Send Friend Request

**In Account 1 (Normal browser):**
1. Go to **Discover** or **Connections** tab
2. Search for your friend (friend@email.com or Friend Name)
3. Click **Follow** or **Add Friend** button
4. You should see button change to "Requested"

### Step 3: Accept Friend Request

**In Account 2 (Incognito browser):**
1. Click the **Notifications** bell icon
2. You should see: "Your Name sent you a friend request"
3. Click **Accept**
4. Refresh the page

### Step 4: Verify Counts

**In Account 2 (Incognito - who accepted):**
1. Click on your profile picture or go to Profile
2. Check the stats:
   - **Posts**: 0 (or however many you created)
   - **Followers**: 1 ✅
   - **Following**: 1 ✅

**In Account 1 (Normal browser - who sent request):**
1. Refresh the page (F5)
2. Go to your Profile
3. Check the stats:
   - **Posts**: 0 (or however many you created)
   - **Followers**: 1 ✅
   - **Following**: 1 ✅

### Step 5: Go to Connections Tab

**In either account:**
1. Click **Connections** in the sidebar
2. You should see your friend listed
3. This confirms the friendship is working

### Step 6: Verify in Database (Optional)

If you want to verify in the database:
```bash
cd Backend
node utils/checkDatabase.js
```

Expected output:
```
Total users: 2

1. Your Name (your@email.com)
   - Friends: 1
   - Followers: 1
   - Following: 1
   - Friend Requests: 0
   - Sent Requests: 0

2. Friend Name (friend@email.com)
   - Friends: 1
   - Followers: 1
   - Following: 1
   - Friend Requests: 0
   - Sent Requests: 0
```

## If You Already Have Friends But Counts Are 0

This means your friendship was created before the followers/following logic was added.

**Fix it by running:**
```bash
cd Backend
node utils/manualSync.js
```

This will:
1. Find all users with friends
2. Copy the friends list to followers array
3. Copy the friends list to following array
4. Do this for both users (mutual)

Then:
1. Refresh your browser
2. Go to Profile
3. Counts should now be correct

## Expected Results After Everything

When you have **N friends**, you should see:
- **Friends**: N (in Connections tab)
- **Followers**: N (on Profile)
- **Following**: N (on Profile)

## Troubleshooting

### "Counts still show 0"
1. Make sure backend is running
2. Logout and login again
3. Clear browser cache (Ctrl+Shift+Delete)
4. Run: `node utils/checkDatabase.js` to verify database

### "Friend request not showing"
1. Check Notifications tab
2. Refresh the page
3. Check browser console for errors (F12)

### "Sync script shows 0 users"
- This means your database is empty
- You need to register accounts first
- Then create friendships
- Then run sync if needed

### "One account shows correct count, other shows 0"
- Run sync script again: `node utils/manualSync.js`
- It ensures both sides are updated

## Summary

The system is working correctly for **new** friendships. If you have **existing** friendships with 0 counts, run the sync script to fix them.

**For new friendships**: The backend automatically updates followers/following when you accept a friend request.

**For old friendships**: Run the sync script once to fix historical data.
