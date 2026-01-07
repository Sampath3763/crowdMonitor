# CrowdMonitor 🎯

**AI-Powered Real-Time Seat Occupancy Monitoring System**

CrowdMonitor is a modern web application that uses AI-powered computer vision to monitor and analyze seat occupancy in real-time for cafeterias, libraries, and other public spaces. It helps users make informed decisions about when to visit by providing live seating availability and predictive analytics.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)

---

## 🌟 Features

### For Users
- **Live Seating Status**: Real-time view of available and occupied seats
- **Quick View Access**: Check availability without logging in
- **Multiple View Modes**: Grid and table layout options
- **Occupancy Statistics**: Current occupancy rates and estimated wait times
- **Analytics Dashboard**: Historical trends and peak hours visualization
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### For Managers
- **Place Management**: Create and manage multiple monitoring locations
- **Image Upload**: Upload images for AI-powered occupancy analysis
- **Video Upload**: Upload videos for batch analysis and data generation
- **Real-Time Updates**: Automatic synchronization across all connected users
- **Historical Analytics**: Track occupancy patterns and visitor counts
- **Predictive Insights**: AI-powered recommendations for optimization

### Technical Features
- **AI-Powered Analysis**: Computer vision using edge detection, skin-tone detection, and brightness analysis
- **Real-Time Communication**: WebSocket-based live updates
- **Persistent Data**: MongoDB database for reliable data storage
- **RESTful API**: Clean and well-structured backend API
- **Modern UI**: Built with React, TypeScript, and shadcn/ui components
- **Dark Mode Support**: Automatic theme switching

---

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: React Context API
- **Real-Time**: Socket.IO Client
- **HTTP Client**: Fetch API

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.IO
- **Image Processing**: Jimp
- **Video Processing**: FFmpeg (fluent-ffmpeg)
- **File Uploads**: Multer

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **MongoDB** (v6.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/downloads)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd seat-smart-cam-main
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
# Create a .env file with the following content:
```

**.env file content:**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/crowdmonitor
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

---

## 🗄️ Database Setup

### MongoDB Configuration

1. **Start MongoDB service:**

   **Windows:**
   ```bash
   net start MongoDB
   ```

   **macOS/Linux:**
   ```bash
   sudo systemctl start mongod
   ```

2. **Verify MongoDB is running:**
   ```bash
   mongo --eval "db.runCommand({ connectionStatus: 1 })"
   ```

3. The application will automatically create the `crowdmonitor` database and required collections on first run.

---

## 🎮 Usage

### Default Login Credentials

#### Manager Account
- **Email**: `admin@crowdmonitor.com`
- **Password**: `admin@321`

#### Regular User Account
- **Email**: `user@example.com`
- **Password**: `user123`

### Workflow

1. **Manager**: Log in and create a new monitoring location (place)
2. **Manager**: Upload an image or video of the location
3. **System**: AI analyzes the media and generates occupancy data
4. **Users**: View live seating status without logging in (Quick View)
5. **Users/Manager**: Access detailed analytics via Dashboard

---

## 📁 Project Structure

```
seat-smart-cam-main/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables (create this)
│   ├── models/                # MongoDB models
│   │   ├── Place.js          # Place/Location schema
│   │   ├── LiveData.js       # Live occupancy data schema
│   │   ├── OccupancyHistory.js # Historical data schema
│   │   └── User.js           # User authentication schema
│   ├── AIs/
│   │   └── routeVision.js    # AI vision processing
│   └── uploads/              # Uploaded media files (auto-created)
│       ├── places/           # Place images
│       └── videos/           # Place videos
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Auth, LiveData)
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
│
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

---

## 🔧 Configuration

### Backend Configuration (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/crowdmonitor` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:8080` |
| `NODE_ENV` | Environment mode | `development` |

### Frontend Configuration

The frontend is configured to connect to `http://localhost:3001` by default. This is set in the component files and contexts.

---

## 🔌 API Endpoints

### Places API
- `GET /api/places` - Get all places
- `POST /api/places` - Create new place
- `PUT /api/places/:id` - Update place
- `DELETE /api/places/:id` - Delete place
- `POST /api/places/:id/upload-image` - Upload place image
- `POST /api/places/:id/upload-video` - Upload place video

### Live Data API
- `GET /api/live-data/:placeId` - Get live occupancy data
- `POST /api/live-data/refresh/:placeId` - Refresh live data

### Analytics API
- `GET /api/occupancy-history/:placeId` - Get occupancy history and analytics

### WebSocket Events
- `liveDataUpdated` - Broadcast when occupancy data changes
- `placesUpdated` - Broadcast when places are modified
- `forceRefresh` - Trigger data refresh for clients

---

## 🎨 Features Walkthrough

### 1. Landing Page
- Public access to live occupancy preview
- Real-time data display for first available location
- Quick navigation to detailed views

### 2. Live Status Page
- Public access without authentication
- Real-time seating layout visualization
- Multiple view modes (Grid/Table)
- Place selection dropdown
- Auto-updates via WebSocket

### 3. Dashboard (Authentication Required)
- Historical occupancy trends
- Peak hours analysis
- Average wait times
- Total visitor counts
- AI-powered recommendations

### 4. Manage Places (Manager Only)
- Create/Edit/Delete locations
- Upload images for analysis
- Upload videos for batch processing
- Real-time status indicators

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Manager can create a new place
- [ ] Manager can upload an image
- [ ] System analyzes image and updates live data
- [ ] Live data displays on landing page
- [ ] Users can access Quick View without login
- [ ] WebSocket updates work in real-time
- [ ] Dashboard shows analytics
- [ ] Data persists across server restarts

---

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: Kill the process using the port or change the port in `.env`

**3. Frontend Cannot Connect to Backend**
- Verify backend is running on `http://localhost:3001`
- Check browser console for CORS errors
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL

**4. Image Analysis Not Working**
- Verify image is accessible (check file path)
- Check backend console for analysis errors
- Ensure image format is supported (JPEG, PNG)

---

## 📝 Development Notes

### Data Persistence
- Live data only updates when manager uploads new media
- No automatic data generation on refresh or server restart
- Data is stored in MongoDB and persists across sessions

### Real-Time Updates
- WebSocket connections established automatically
- All connected clients receive updates simultaneously
- Updates trigger only on actual media uploads

### AI Analysis
- Uses computer vision techniques (edge detection, skin-tone detection)
- Estimates occupancy percentage from images
- Processes videos frame-by-frame for comprehensive analysis

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🚀 Execution / Commands

### Starting the Application

#### 1. Start MongoDB (Required First!)

**Windows:**
```bash
net start MongoDB
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

#### 2. Start Backend Server

```bash
# Navigate to backend directory
cd backend

# Start the server
npm start

# OR for development with auto-reload
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 3001
📡 Socket.IO ready for real-time updates
🌐 Frontend URL: http://localhost:8080
✅ MongoDB connected successfully
```

The backend will be available at: `http://localhost:3001`

#### 3. Start Frontend Development Server

Open a **new terminal window/tab** and run:

```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

The frontend will be available at: `http://localhost:8080`

### Production Build

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

### Stopping the Application

1. **Frontend**: Press `Ctrl + C` in the terminal running Vite
2. **Backend**: Press `Ctrl + C` in the terminal running the server
3. **MongoDB** (optional):
   - Windows: `net stop MongoDB`
   - macOS: `brew services stop mongodb-community`
   - Linux: `sudo systemctl stop mongod`


