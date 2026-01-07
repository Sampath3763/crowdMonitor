# CrowdMonitor Backend API

## Overview
Node.js + Express + MongoDB + Socket.IO backend server for real-time seat occupancy monitoring.

## Features
- ✅ REST API for seat data
- ✅ MongoDB database for persistent storage
- ✅ Socket.IO for real-time WebSocket updates
- ✅ Auto-refresh every 2 minutes
- ✅ CORS enabled for frontend
- ✅ Synchronized across all devices and accounts

## Tech Stack
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database (using Mongoose)
- **Socket.IO** - Real-time bidirectional communication
- **dotenv** - Environment variables

## Prerequisites
- Node.js v16 or higher
- MongoDB Atlas account (using provided connection string)
- npm or yarn

## Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   The `.env` file is already configured with:
   ```env
   MONGODB_URI=mongodb+srv://sampath:sam3763@cluster0.kov1cjm.mongodb.net/...
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

## Running the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### 1. Get Live Data
```http
GET /api/live-data
```

**Response:**
```json
{
  "seats": [
    { "id": "1-1", "occupied": false },
    { "id": "1-2", "occupied": true },
    ...
  ],
  "tables": [
    {
      "id": "Table 1",
      "seats": [
        { "id": "T1-1", "occupied": true },
        ...
      ]
    },
    ...
  ],
  "lastUpdate": "2025-10-17T10:30:00.000Z"
}
```

### 2. Refresh Live Data
```http
POST /api/live-data/refresh
```

Generates new seat data and broadcasts to all connected clients via WebSocket.

**Response:**
```json
{
  "seats": [...],
  "tables": [...],
  "lastUpdate": "2025-10-17T10:35:00.000Z"
}
```

### 3. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-17T10:30:00.000Z",
  "mongodb": "connected"
}
```

## WebSocket Events

### Server → Client Events

**`liveDataUpdated`**
Sent when seat data is updated (auto-refresh, manual refresh, or new client connection)

```javascript
socket.on('liveDataUpdated', (data) => {
  console.log('New data:', data);
  // data contains: { seats, tables, lastUpdate }
});
```

### Client → Server Events

**`requestRefresh`**
Request immediate data refresh

```javascript
socket.emit('requestRefresh');
```

## Database Schema

### LiveData Collection
```javascript
{
  _id: 'live-data', // Single document
  seats: [
    {
      id: String,
      occupied: Boolean
    }
  ],
  tables: [
    {
      id: String,
      seats: [
        {
          id: String,
          occupied: Boolean
        }
      ]
    }
  ],
  lastUpdate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Auto-Refresh
Server automatically generates new seat data every **2 minutes** and broadcasts to all connected clients.

## CORS Configuration
Frontend URL is whitelisted in CORS settings:
- Development: `http://localhost:5173`
- Update `FRONTEND_URL` in `.env` for production

## Logging
Server logs:
- ✅ MongoDB connection status
- 🔌 Client connections/disconnections
- 🔄 Data refresh events
- ❌ Errors

## Error Handling
- Graceful shutdown on SIGINT
- MongoDB connection error handling
- Socket.IO reconnection logic
- API error responses

## Testing

### Test REST API
```bash
# Get live data
curl http://localhost:3001/api/live-data

# Refresh data
curl -X POST http://localhost:3001/api/live-data/refresh

# Health check
curl http://localhost:3001/api/health
```

### Test WebSocket
Open browser console and run:
```javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('liveDataUpdated', (data) => {
  console.log('Data updated:', data);
});

socket.emit('requestRefresh');
```

## Production Deployment

### Environment Variables
Update `.env` for production:
```env
MONGODB_URI=your_production_mongodb_uri
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-production-frontend.com
```

### Hosting Options
- **Heroku**: Add `Procfile` with `web: node server.js`
- **Railway**: Auto-detects Node.js apps
- **Render**: Connect GitHub repo
- **AWS EC2**: Run with PM2 process manager
- **Vercel/Netlify**: Use serverless functions

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name crowdmonitor-api
pm2 save
pm2 startup
```

## Troubleshooting

### MongoDB Connection Issues
- Check connection string in `.env`
- Verify IP address is whitelisted in MongoDB Atlas
- Check network connectivity

### Port Already in Use
```bash
# Find process using port 3001
netstat -ano | findstr :3001
# Kill process
taskkill /PID <process_id> /F
```

### Frontend Can't Connect
- Verify backend is running
- Check CORS configuration
- Update frontend API_URL if needed

## Security Notes

⚠️ **Important for Production:**
- Use environment variables for sensitive data
- Implement authentication/authorization
- Add rate limiting
- Use HTTPS
- Validate input data
- Implement proper error handling
- Use MongoDB connection pooling

## License
ISC

## Support
For issues or questions, check the main project documentation.
