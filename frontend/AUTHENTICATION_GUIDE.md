# CrowdMonitor - Authentication & Features Guide

## Overview
CrowdMonitor is a real-time seat occupancy monitoring system with role-based authentication for users and managers.

## Authentication System

### User Roles

#### 1. **User Role**
- **Access**: View-only access to live seat occupancy
- **Features**:
  - View real-time seat availability
  - See occupancy statistics
  - Toggle between grid and table views
  - Manual refresh option

**Demo Credentials:**
- Email: `user@example.com`
- Password: `user123`

#### 2. **Manager Role**
- **Access**: Full system access including analytics and configuration
- **Features**:
  - All user features
  - View historical analytics dashboard
  - Add/edit/delete monitoring locations
  - Configure system settings

**Demo Credentials:**
- Email: `manager@example.com`
- Password: `manager123`

## Features

### 1. Login System
- Role-based authentication (User/Manager)
- Tabbed interface for role selection
- Demo credentials auto-fill button
- Session persistence (localStorage)
- Automatic redirect after login

### 2. Live Status Monitoring
- **Auto-refresh**: Updates every 2 minutes
- **Manual Refresh**: Click "Refresh Now" button anytime
- **Countdown Timer**: Shows time until next auto-update
- **Two View Modes**:
  - **Grid View**: Traditional 8x8 seat grid layout
  - **Table View**: Circular table arrangement with seats positioned around each table
- **Visual Indicators**:
  - 🟢 Green = Available seats
  - 🔴 Red = Occupied seats
- **Statistics Cards**:
  - Available seats count
  - Occupancy rate percentage
  - Estimated wait time

### 3. Manager Dashboard
- Historical trends and analytics
- Peak hours visualization
- Average occupancy statistics
- Total visitor tracking
- Daily performance metrics

### 4. Manage Places (Manager Only)
- Add new monitoring locations
- Edit existing locations
- Delete locations
- Configure capacity per location
- Optional image URL for each location

### 5. Navigation
- Role-based menu items
- User profile dropdown
- Quick access to all features
- Logout functionality
- Responsive design

## Route Structure

### Public Routes
- `/` - Landing page
- `/login` - Login page

### Protected Routes (Authentication Required)
- `/live-status` - Live seat monitoring (All authenticated users)

### Manager-Only Routes
- `/dashboard` - Analytics dashboard
- `/manage-places` - Location management

## Technical Implementation

### Authentication Flow
1. User selects role (User/Manager) on login page
2. Enters credentials
3. System validates against mock credentials
4. On success, creates user session
5. Stores session in localStorage
6. Redirects to appropriate page based on role
7. All protected routes check authentication status
8. Manager routes additionally verify manager role

### Protected Route System
- `ProtectedRoute` component wraps protected pages
- Checks authentication status
- Verifies role requirements
- Redirects unauthorized users to login
- Redirects users to appropriate pages based on role

### Data Refresh Strategy
- **Auto-refresh**: Every 2 minutes (120 seconds)
- **Manual refresh**: On-demand via button
- **Countdown timer**: Visual feedback for next update
- **Mock data**: Simulates real-time changes
- **Maintains state**: Updates without page reload

## Running the Application

### Development Mode
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## UI Components Used

- **shadcn/ui** components:
  - Card, Button, Input, Label
  - Tabs, Dialog, Table
  - Dropdown Menu, Avatar
  - Alert, Toast
  - Navigation Menu

- **Custom Components**:
  - NavigationHeader
  - ProtectedRoute
  - SeatingLayout
  - TableView
  - AvailabilityCard
  - StatusBadge

## Styling
- TailwindCSS for utility-first styling
- Gradient hero effects
- Responsive design
- Dark mode compatible
- Shadow and glow effects

## Future Enhancements
- Real API integration
- WebSocket for real-time updates
- User registration system
- Email notifications
- Advanced analytics
- Multi-location support
- Camera feed integration
- Mobile app
