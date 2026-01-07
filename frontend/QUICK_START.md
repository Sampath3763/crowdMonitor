# 🚀 Quick Start Guide - CrowdMonitor

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd "c:\Users\91801\Downloads\seat-smart-cam-main"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - The app will be available at `http://localhost:5173` (or the port shown in terminal)

## 🎯 Testing the Features

### Test 1: User Authentication (View-Only Access)

1. Click **"Sign In"** on the landing page
2. Select the **"User"** tab
3. Click **"Fill Demo Credentials"** button
4. Click **"Sign In"**

**Expected Result:**
- ✅ Redirects to `/live-status`
- ✅ Shows live seat occupancy
- ✅ Navigation menu shows only "Live Status" option
- ✅ Can toggle between Grid and Table views
- ✅ Can manually refresh data
- ✅ See countdown timer for next update

### Test 2: Manager Authentication (Full Access)

1. Logout from user account (click avatar → Logout)
2. Go to login page
3. Select the **"Manager"** tab
4. Click **"Fill Demo Credentials"** button
5. Click **"Sign In"**

**Expected Result:**
- ✅ Redirects to `/dashboard`
- ✅ Navigation menu shows: Live Status, Dashboard, Manage Places
- ✅ Can access all features
- ✅ Dashboard shows analytics
- ✅ Can manage places (add/edit/delete)

### Test 3: Live Status Features

**Grid View:**
1. Go to Live Status page
2. Ensure "Grid View" is selected
3. Observe 8x8 seat grid
4. Green = Available, Red = Occupied

**Table View:**
1. Click **"Table View"** button
2. See 6 circular tables
3. Each table shows seats arranged in a circle
4. Green dots = Available, Red dots = Occupied
5. Hover over seats to see tooltips

**Auto-Refresh:**
1. Note the "Next update in:" timer
2. Wait for countdown to reach 0:00
3. Watch data refresh automatically
4. OR click **"Refresh Now"** for immediate update

### Test 4: Manage Places (Manager Only)

1. Login as manager
2. Navigate to "Manage Places"
3. Click **"Add New Place"**
4. Fill in the form:
   - Name: "Test Location"
   - Description: "Test area"
   - Capacity: 50
   - Image URL: (optional)
5. Click **"Add Place"**
6. See new location in table
7. Click **Edit** icon to modify
8. Click **Delete** icon to remove

### Test 5: Protected Routes

**Test unauthorized access:**
1. Logout (if logged in)
2. Try to visit `http://localhost:5173/dashboard`
3. **Expected:** Redirects to `/login`

**Test role-based access:**
1. Login as **User**
2. Try to visit `http://localhost:5173/manage-places`
3. **Expected:** Redirects back to `/live-status`

## 📊 Demo Credentials Reference

### User Account
```
Email: user@example.com
Password: user123
Access: Live Status only
```

### Manager Account
```
Email: manager@example.com
Password: manager123
Access: All features
```

## 🎨 Features Checklist

### ✅ Authentication System
- [x] User/Manager role selection
- [x] Login with credentials
- [x] Session persistence
- [x] Auto-redirect based on role
- [x] Logout functionality

### ✅ Live Status Monitoring
- [x] Auto-refresh every 2 minutes
- [x] Manual refresh button
- [x] Countdown timer display
- [x] Grid view (8x8 layout)
- [x] Table view (circular seating)
- [x] Real-time statistics
- [x] Visual seat indicators

### ✅ Navigation
- [x] Role-based menu items
- [x] User profile dropdown
- [x] Responsive header
- [x] Quick access links

### ✅ Manager Features
- [x] Analytics dashboard
- [x] Historical trends
- [x] Place management (CRUD)
- [x] Capacity configuration

### ✅ Security
- [x] Protected routes
- [x] Role verification
- [x] Auto-redirect on unauthorized access
- [x] Session management

## 🐛 Troubleshooting

### Issue: Port already in use
**Solution:**
```bash
# Kill the process using port 5173
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

### Issue: Dependencies not installed
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors
**Solution:**
```bash
# Run type check
npm run build

# Check specific file
npx tsc --noEmit src/App.tsx
```

### Issue: Login not working
**Check:**
- Make sure you're using exact credentials (case-sensitive)
- Clear browser localStorage and try again
- Check browser console for errors

## 📱 Browser Compatibility

Tested on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Safari (latest)

## 🔧 Configuration

### Change Auto-Refresh Interval
**File:** `src/pages/LiveStatus.tsx`
**Line:** Find `60000` (1 minute in milliseconds)
**Change to:** 
- 1 minute: `60000`
- 5 minutes: `300000`
- 10 seconds (testing): `10000`

### Modify Seat Count (Grid View)
**File:** `src/pages/LiveStatus.tsx`
**Function:** `generateSeats()`
**Current:** 64 seats (8x8)
**Modify:** Change `Array.from({ length: 64 }, ...)`

### Add More Tables (Table View)
**File:** `src/pages/LiveStatus.tsx`
**Function:** `generateTables()`
**Add:** Copy existing table object and modify id/seats

## 📚 Documentation Files

1. **AUTHENTICATION_GUIDE.md** - Complete auth system documentation
2. **IMPLEMENTATION_SUMMARY.md** - All implemented features
3. **APPLICATION_FLOW.md** - Visual diagrams and flows
4. **QUICK_START.md** - This file

## 🎉 You're All Set!

Your CrowdMonitor application is now running with:
- ✅ User and Manager authentication
- ✅ Role-based access control
- ✅ Live seat monitoring with 2-minute auto-refresh
- ✅ Two view modes (Grid and Table)
- ✅ Manager dashboard and place management
- ✅ Full navigation system

**Enjoy monitoring your crowd! 🎊**

---

## Need Help?

Check the documentation files or review the source code comments for detailed explanations.
