# CrowdMonitor - Application Flow

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Landing Page (/)                         │
│                                                                  │
│  ┌──────────────┐                    ┌──────────────┐          │
│  │  Sign In     │                    │  Quick View  │          │
│  │   Button     │                    │   (Guest)    │          │
│  └──────┬───────┘                    └──────┬───────┘          │
└─────────┼────────────────────────────────────┼─────────────────┘
          │                                     │
          │                                     └─────────────┐
          ▼                                                   ▼
┌─────────────────────────────────────────┐         ┌────────────────┐
│        Login Page (/login)              │         │  Live Status   │
│                                         │         │  (No Auth)     │
│  ┌─────────────┬─────────────┐         │         └────────────────┘
│  │    User     │   Manager   │         │
│  │     Tab     │     Tab     │         │
│  └─────┬───────┴─────┬───────┘         │
│        │             │                 │
│  user@example.com    manager@example..│
│  password: user123   password: manage..│
│        │             │                 │
└────────┼─────────────┼─────────────────┘
         │             │
         ▼             ▼
    ┌────────────────────────────┐
    │   AuthContext Validates    │
    │   - Check credentials      │
    │   - Create user session    │
    │   - Store in localStorage  │
    └────────┬───────────┬───────┘
             │           │
   ┌─────────┘           └──────────┐
   │                                │
   ▼                                ▼
┌──────────────────┐      ┌─────────────────────┐
│   USER ROUTES    │      │   MANAGER ROUTES    │
│                  │      │                     │
│ ✓ Live Status    │      │ ✓ Live Status       │
│                  │      │ ✓ Dashboard         │
│ Navigation:      │      │ ✓ Manage Places     │
│ - Live Status    │      │                     │
│ - Profile        │      │ Navigation:         │
│ - Logout         │      │ - Live Status       │
└──────────────────┘      │ - Dashboard         │
                          │ - Manage Places     │
                          │ - Profile           │
                          │ - Logout            │
                          └─────────────────────┘
```

## Page Access Matrix

| Page / Route      | Public | User | Manager | Description                    |
|-------------------|--------|------|---------|--------------------------------|
| `/`               | ✅     | ✅   | ✅      | Landing page                   |
| `/login`          | ✅     | ❌*  | ❌*     | Login page (*redirects if auth)|
| `/live-status`    | ✅**   | ✅   | ✅      | Live seat monitoring           |
| `/dashboard`      | ❌     | ❌   | ✅      | Analytics dashboard            |
| `/manage-places`  | ❌     | ❌   | ✅      | Location management            |

**Legend:**
- ✅ = Full access
- ❌ = No access (redirects)
- ❌* = Redirects to role-appropriate page if authenticated
- ✅** = Guest access allowed but with limited features

## Component Hierarchy

```
App.tsx
├── AuthProvider (Context)
│   ├── BrowserRouter
│   │   ├── Routes
│   │   │   ├── Public Routes
│   │   │   │   ├── Index (/)
│   │   │   │   └── PublicRoute
│   │   │   │       └── Login (/login)
│   │   │   │
│   │   │   ├── Protected Routes (All Authenticated)
│   │   │   │   └── ProtectedRoute
│   │   │   │       └── LayoutWrapper (with NavigationHeader)
│   │   │   │           └── LiveStatus (/live-status)
│   │   │   │
│   │   │   └── Manager-Only Routes
│   │   │       └── ProtectedRoute (requiredRole="manager")
│   │   │           └── LayoutWrapper (with NavigationHeader)
│   │   │               ├── Dashboard (/dashboard)
│   │   │               └── ManagePlaces (/manage-places)
```

## Data Flow - Live Status

```
┌─────────────────────────────────────────────────────────────┐
│                    LiveStatus Component                      │
│                                                              │
│  State:                                                      │
│  ├── seats (grid data)                                       │
│  ├── tables (table view data)                               │
│  ├── lastUpdate (timestamp)                                  │
│  ├── viewMode ("grid" | "table")                            │
│  └── timeUntilUpdate (countdown)                            │
│                                                              │
│  Effects:                                                    │
│  ├── Auto-refresh (every 2 minutes)                         │
│  │   └── Calls: generateSeats() & generateTables()         │
│  └── Countdown timer (every 1 second)                       │
│      └── Updates: timeUntilUpdate                           │
│                                                              │
│  User Actions:                                               │
│  ├── Manual Refresh → refreshData()                         │
│  │   ├── Regenerates all data                               │
│  │   ├── Resets countdown                                   │
│  │   └── Updates lastUpdate timestamp                       │
│  │                                                           │
│  └── Toggle View Mode                                       │
│      ├── "Grid" → SeatingLayout component                   │
│      └── "Table" → TableView components                     │
│                                                              │
│  Display:                                                    │
│  ├── Statistics Cards (3 cards)                             │
│  │   ├── Available Seats                                    │
│  │   ├── Occupancy Rate                                     │
│  │   └── Estimated Wait                                     │
│  │                                                           │
│  └── Seating Layout Card                                    │
│      ├── View Toggle Buttons                                │
│      └── Dynamic Content:                                   │
│          ├── Grid View: 8x8 seat grid                       │
│          └── Table View: 6 circular tables                  │
└─────────────────────────────────────────────────────────────┘
```

## Table View Layout

```
Each Table:

        ┌──────────────────────┐
        │                      │
        │    ● (Seat 1)       │  ← Green = Available
        │ ●           ●       │  ← Red = Occupied
        │                      │
        │  ┌─────────┐        │
        │  │Table N  │  ●     │
        │  │X Seats  │        │
        │  └─────────┘        │
        │                      │
        │ ●           ●       │
        │    ● (Seat N)       │
        └──────────────────────┘

Seats are positioned in a circle around the table
using trigonometry (Math.cos, Math.sin)
```

## Manager Dashboard Features

```
┌─────────────────────────────────────────────────────────┐
│                  Manager Dashboard                       │
│                                                         │
│  Statistics Overview:                                   │
│  ├── Average Occupancy (Today)                         │
│  ├── Peak Time                                         │
│  ├── Average Wait Time                                 │
│  └── Total Visitors                                    │
│                                                         │
│  Historical Data:                                       │
│  └── Peak Hours Table                                  │
│      ├── Time Range                                    │
│      └── Occupancy Percentage                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Manage Places Page                      │
│                                                         │
│  Actions:                                               │
│  └── Add New Place (Button) → Dialog                   │
│                                                         │
│  Places Table:                                          │
│  ├── Name                                               │
│  ├── Description                                        │
│  ├── Capacity                                           │
│  └── Actions (Edit/Delete)                             │
│                                                         │
│  Dialog Form:                                           │
│  ├── Name (required)                                    │
│  ├── Description (required)                            │
│  ├── Capacity (required, number)                       │
│  └── Image URL (optional)                              │
└─────────────────────────────────────────────────────────┘
```

## State Management

### Global State (AuthContext)
- `user` - Current user object (id, email, name, role)
- `isAuthenticated` - Boolean flag
- `isManager` - Boolean computed from user.role
- Methods: `login()`, `logout()`

### Local State (LiveStatus)
- `seats` - Array of seat objects for grid view
- `tables` - Array of table objects for table view
- `lastUpdate` - Date timestamp
- `viewMode` - Current view selection
- `timeUntilUpdate` - Countdown in seconds

### Persistence
- `localStorage('user')` - Stores authenticated user session
- Automatically restored on page reload
- Cleared on logout

## Security Notes

⚠️ **Current Implementation:**
- Mock authentication (for demo only)
- Client-side validation only
- No encryption
- Credentials hardcoded

✅ **Production Requirements:**
- Server-side authentication
- JWT tokens or session cookies
- Password hashing
- HTTPS only
- Rate limiting
- CSRF protection
- Input sanitization
