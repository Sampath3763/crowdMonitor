import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Jimp from 'jimp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import LiveData from './models/LiveData.js';
import Place from './models/Place.js';
import OccupancyHistory from './models/OccupancyHistory.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CrowdMonitor Backend is Running 🚀");
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'places');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Setup video upload handler (separate storage and filter)
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const videoFileFilter = (req, file, cb) => {
  const allowed = /mp4|webm|mov|ogg/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);
  if (mimetype || extname) return cb(null, true);
  cb(new Error('Only video files are allowed (mp4, webm, mov, ogg)'));
};

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// Configure fluent-ffmpeg to use static binary
try {
  ffmpeg.setFfmpegPath(ffmpegStatic || 'ffmpeg');
} catch (err) {
  console.warn('Could not set ffmpeg path:', err.message || err);
}

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Initialize data for all places
    await initializeLiveDataForPlaces();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate seats based on place capacity
const generateSeats = (capacity) => {
  // Random occupancy rate between 20% and 95%
  const randomOccupancyRate = 0.2 + Math.random() * 0.75;
  
  // Calculate grid dimensions (try to make it square-ish)
  const cols = Math.ceil(Math.sqrt(capacity));
  const rows = Math.ceil(capacity / cols);
  
  return Array.from({ length: capacity }, (_, i) => ({
    id: `${Math.floor(i / cols) + 1}-${(i % cols) + 1}`,
    occupied: Math.random() < randomOccupancyRate,
  }));
};

// Generate tables based on place capacity
const generateTables = (capacity) => {
  // Random occupancy rate between 20% and 95%
  const randomOccupancyRate = 0.2 + Math.random() * 0.75;
  
  // Determine number of tables (roughly capacity/6 tables)
  const avgSeatsPerTable = 6;
  const numTables = Math.max(1, Math.ceil(capacity / avgSeatsPerTable));
  
  const tables = [];
  let remainingSeats = capacity;
  
  for (let i = 0; i < numTables; i++) {
    // Distribute seats across tables (4-8 seats per table)
    const isLastTable = i === numTables - 1;
    const seatsForThisTable = isLastTable 
      ? remainingSeats 
      : Math.min(Math.max(4, Math.floor(Math.random() * 5) + 4), remainingSeats);
    
    tables.push({
      id: `Table ${i + 1}`,
      seats: Array.from({ length: seatsForThisTable }, (_, j) => ({
        id: `T${i + 1}-${j + 1}`,
        occupied: Math.random() < randomOccupancyRate,
      })),
    });
    
    remainingSeats -= seatsForThisTable;
  }
  
  return tables;
};

// Initialize live data for all places
const initializeLiveDataForPlaces = async () => {
  try {
    const places = await Place.find();
    console.log(`📋 Found ${places.length} place(s) in database`);
    
    // Just log the status, don't trigger analysis on server restart
    for (const place of places) {
      const hasMedia = Boolean(place.imageUrl && place.imageUrl.trim()) || Boolean(place.videoAnalyzed);
      const existingData = await LiveData.findOne({ placeId: place._id.toString() });
      
      if (hasMedia && existingData) {
        console.log(`✅ ${place.name}: Has media and live data`);
      } else if (hasMedia && !existingData) {
        console.log(`⚠️  ${place.name}: Has media but no live data (will be analyzed on next upload)`);
      } else {
        console.log(`ℹ️  ${place.name}: No media uploaded yet`);
      }
    }
  } catch (error) {
    console.error('❌ Error initializing live data:', error);
  }
};

// REST API Endpoints

// Get live seat data for a specific place
app.get('/api/live-data/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const liveData = await LiveData.findOne({ placeId });

    if (!liveData) {
      // If no live data exists, check if place has media
      const place = await Place.findById(placeId);
      if (!place) {
        return res.status(404).json({ error: 'Place not found' });
      }

      const hasMedia = Boolean(place.imageUrl && place.imageUrl.trim()) || Boolean(place.videoAnalyzed);
      if (!hasMedia) {
        // Return not-initialized response - no media uploaded yet
        return res.json({
          placeId: place._id.toString(),
          placeName: place.name,
          notInitialized: true,
          seats: [],
          tables: [],
          lastUpdate: null,
        });
      }

      // Media exists but analysis hasn't completed yet
      // Return not-initialized response and let image analysis create the data
      return res.json({
        placeId: place._id.toString(),
        placeName: place.name,
        notInitialized: true,
        seats: [],
        tables: [],
        lastUpdate: null,
        message: 'Analysis in progress, please wait...',
      });
    }

    res.json({
      placeId: liveData.placeId,
      placeName: liveData.placeName,
      seats: liveData.seats,
      tables: liveData.tables,
      lastUpdate: liveData.lastUpdate,
    });
    console.log(`📤 Sent live data for ${liveData.placeName} | Last updated: ${liveData.lastUpdate} | Occupied: ${liveData.seats.filter(s => s.occupied).length}/${liveData.seats.length}`);
  } catch (error) {
    console.error('Error fetching live data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh/Fetch live seat data for a specific place (does NOT generate new data)
app.post('/api/live-data/refresh/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    
    // Check if place has media uploaded
    const hasMedia = Boolean(place.imageUrl && place.imageUrl.trim()) || Boolean(place.videoAnalyzed);
    if (!hasMedia) {
      return res.json({
        placeId: place._id.toString(),
        placeName: place.name,
        notInitialized: true,
        seats: [],
        tables: [],
        lastUpdate: null,
      });
    }

    // Fetch EXISTING live data from database (do NOT generate new data)
    const liveData = await LiveData.findOne({ placeId });
    
    if (!liveData) {
      // No live data exists yet, return not initialized
      // Data will be generated when image analysis completes
      return res.json({
        placeId: place._id.toString(),
        placeName: place.name,
        notInitialized: true,
        seats: [],
        tables: [],
        lastUpdate: null,
      });
    }

    // Return existing data without modification
    const responseData = {
      placeId: liveData.placeId,
      placeName: liveData.placeName,
      seats: liveData.seats,
      tables: liveData.tables,
      lastUpdate: liveData.lastUpdate,
    };
    
    // Emit to all connected clients via WebSocket (sync existing data)
    io.emit('liveDataUpdated', responseData);
    
    res.json(responseData);
    
    console.log(`✅ Live data refreshed for ${place.name} and broadcast to all clients`);
  } catch (error) {
    console.error('Error refreshing live data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Function to track occupancy history
const trackOccupancy = async (placeId, placeName, seats) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const occupiedSeats = seats.filter(s => s.occupied).length;
    const totalSeats = seats.length;
    const occupancyRate = (occupiedSeats / totalSeats) * 100;
    
    // Find or create history document for this place
    let history = await OccupancyHistory.findOne({ placeId });
    
    if (!history) {
      // Initialize with empty hourly data
      history = new OccupancyHistory({
        placeId,
        placeName,
        date: now,
        hourlyData: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          avgOccupancy: 0,
          peakOccupancy: 0,
          totalVisitors: 0,
        })),
        todayStats: {
          avgOccupancy: 0,
          peakTime: 'N/A',
          avgWaitTime: '0 min',
          totalVisitors: 0,
        },
      });
    }
    
    // Update hourly data
    const hourData = history.hourlyData.find(h => h.hour === currentHour);
    if (hourData) {
      hourData.avgOccupancy = Math.round((hourData.avgOccupancy + occupancyRate) / 2);
      hourData.peakOccupancy = Math.max(hourData.peakOccupancy, occupancyRate);
      // Increment visitors count based on occupied seats from live status
      hourData.totalVisitors += occupiedSeats;
    }
    
    // Update today's stats
    const allOccupancies = history.hourlyData.map(h => h.avgOccupancy).filter(o => o > 0);
    history.todayStats.avgOccupancy = allOccupancies.length > 0
      ? Math.round(allOccupancies.reduce((a, b) => a + b, 0) / allOccupancies.length)
      : 0;
    
    // Find peak time
    const peakHourData = history.hourlyData.reduce((max, h) => 
      h.peakOccupancy > max.peakOccupancy ? h : max
    );
    history.todayStats.peakTime = peakHourData.peakOccupancy > 0
      ? `${peakHourData.hour}:00 - ${peakHourData.hour + 1}:00`
      : 'N/A';
    
    // Calculate avg wait time based on occupancy
    if (occupancyRate < 30) history.todayStats.avgWaitTime = '0-2 min';
    else if (occupancyRate < 70) history.todayStats.avgWaitTime = '3-5 min';
    else if (occupancyRate < 90) history.todayStats.avgWaitTime = '5-10 min';
    else history.todayStats.avgWaitTime = '10+ min';
    
    // Total visitors = sum of all hourly visitors (based on live occupancy data)
    history.todayStats.totalVisitors = history.hourlyData.reduce((sum, h) => sum + h.totalVisitors, 0);
    history.date = now;
    
    await history.save();
  } catch (error) {
    console.error('Error tracking occupancy:', error);
  }
};

// Improved image analysis (edge + skin-tone + brightness heuristic) to estimate occupancy
const analyzeImageAndUpdateLiveData = async (placeId) => {
  try {
    const place = await Place.findById(placeId);
    if (!place) return;

    const imageUrl = place.imageUrl;
    if (!imageUrl) return;

    let buffer = null;

    // If it's a local upload, read from disk
    if (imageUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, imageUrl);
      if (!fs.existsSync(localPath)) return;
      buffer = fs.readFileSync(localPath);
    } else {
      // Try fetching remote image (best-effort)
      try {
        const resp = await fetch(imageUrl);
        if (!resp.ok) return;
        const arrayBuffer = await resp.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (err) {
        console.warn('Could not fetch remote image for analysis:', err.message || err);
        return;
      }
    }

    // Load and downsize image for faster processing
    const image = await Jimp.read(buffer);
    const targetWidth = 320; // small size for faster processing
    if (image.bitmap.width > targetWidth) {
      image.resize(targetWidth, Jimp.AUTO);
    }
    const { width, height, data } = image.bitmap;

    // Build grayscale array and do sampling
    const pixels = width * height;
    const gray = new Float32Array(pixels);
    let totalBrightness = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const gb = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[width * y + x] = gb;
        totalBrightness += gb;
      }
    }
    const avgBrightness = totalBrightness / pixels;

    // Edge detection (Sobel) to estimate objectness / crowd density
    let edgeCount = 0;
    // Don't compute edges on 1-pixel border
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = width * y + x;
        // Sobel gx
        const gx = (
          -1 * gray[width * (y - 1) + (x - 1)] + 1 * gray[width * (y - 1) + (x + 1)]
          -2 * gray[width * y + (x - 1)] + 2 * gray[width * y + (x + 1)]
          -1 * gray[width * (y + 1) + (x - 1)] + 1 * gray[width * (y + 1) + (x + 1)]
        );
        // Sobel gy
        const gy = (
          -1 * gray[width * (y - 1) + (x - 1)] - 2 * gray[width * (y - 1) + x] - 1 * gray[width * (y - 1) + (x + 1)]
          +1 * gray[width * (y + 1) + (x - 1)] + 2 * gray[width * (y + 1) + x] + 1 * gray[width * (y + 1) + (x + 1)]
        );
        const mag = Math.sqrt(gx * gx + gy * gy);
        if (mag > 60) edgeCount++;
      }
    }
    const edgeDensity = edgeCount / pixels; // 0..1

    // Skin-tone detection (simple RGB heuristic) to count likely people pixels
    let skinCount = 0;
    // Sample every Nth pixel to speed up
    const sampleStep = Math.max(1, Math.floor(pixels / 20000));
    for (let i = 0; i < pixels; i += sampleStep) {
      const idx = i << 2;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      // Basic skin color range in RGB
      if (r > 95 && g > 40 && b > 20 && (maxc - minc) > 15 && r > g && r > b) {
        skinCount++;
      }
    }
    const skinDensity = skinCount / Math.max(1, Math.floor(pixels / sampleStep));

    // Combine signals into a score: edge density (0.6), skin density (0.3), brightness (0.1)
    const edgeScore = Math.min(1, edgeDensity * 3); // scale sensitivity
    const skinScore = Math.min(1, skinDensity * 4);
    const brightnessScore = 1 - Math.min(1, avgBrightness / 255);
    let score = 0.6 * edgeScore + 0.3 * skinScore + 0.1 * brightnessScore;
    // Normalize and map to occupancy percent (10%..95%)
    let occupancyPercent = 10 + Math.max(0, Math.min(1, score)) * 85;
    // Slight jitter to avoid exact repeats
    occupancyPercent = Math.max(5, Math.min(98, Math.round(occupancyPercent + (Math.random() - 0.5) * 6)));

    // Update LiveData seats and tables based on estimate
    const capacity = place.capacity || 20;
    const occupiedCount = Math.round((occupancyPercent / 100) * capacity);

    const newSeats = generateSeats(capacity).map(s => ({ ...s, occupied: false }));
    const indices = Array.from({ length: capacity }, (_, i) => i);
    // Prefer selecting seats with some spatial clustering: pick seeds then grow
    // Shuffle indices for randomness
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    for (let i = 0; i < occupiedCount && i < indices.length; i++) {
      newSeats[indices[i]].occupied = true;
    }

    const newTables = generateTables(capacity);
    let seatPointer = 0;
    for (const table of newTables) {
      for (let i = 0; i < table.seats.length; i++) {
        const occupied = newSeats[seatPointer] ? newSeats[seatPointer].occupied : false;
        table.seats[i].occupied = occupied;
        seatPointer++;
      }
    }

    const updatedData = await LiveData.findOneAndUpdate(
      { placeId: place._id.toString() },
      {
        seats: newSeats,
        tables: newTables,
        lastUpdate: new Date(),
      },
      { new: true, upsert: true }
    );

    await trackOccupancy(place._id.toString(), place.name, updatedData.seats);

    io.emit('liveDataUpdated', {
      placeId: updatedData.placeId,
      placeName: updatedData.placeName,
      seats: updatedData.seats,
      tables: updatedData.tables,
      lastUpdate: updatedData.lastUpdate,
    });

    // Notify clients that a place's image analysis completed so they can refresh places/listings
    try {
      io.emit('placesUpdated', { action: 'image_analyzed', place });
    } catch (err) {
      console.warn('Could not emit placesUpdated for image analysis:', err.message || err);
    }

    // Force refresh hint for clients (clients will refresh their currently selected place)
    try {
      io.emit('forceRefresh', { placeId: updatedData.placeId });
    } catch (err) {
      console.warn('Could not emit forceRefresh:', err.message || err);
    }

    console.log(`🔎 Image analyzed for ${place.name} — est occupancy: ${occupancyPercent}% (${occupiedCount}/${capacity}) | edge=${edgeDensity.toFixed(3)} skin=${skinDensity.toFixed(3)} bright=${avgBrightness.toFixed(0)}`);
  } catch (err) {
    console.error('Error in analyzeImageAndUpdateLiveData:', err);
  }
};

// Process uploaded video: extract sample frames, analyze each frame, aggregate results and update live data
const processVideoAndUpdateLiveData = async (placeId, videoPath) => {
  try {
    const place = await Place.findById(placeId);
    if (!place) return;

    // Ensure video exists
    if (!fs.existsSync(videoPath)) {
      console.warn('Video file does not exist for processing:', videoPath);
      return;
    }

    // Create temporary directory for frames
    const tmpDir = path.join(__dirname, 'uploads', 'videos', `frames-${Date.now()}-${Math.round(Math.random()*1e6)}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Probe video duration
    let durationSec = 0;
    try {
      const info = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata);
        });
      });
      durationSec = (info && info.format && info.format.duration) ? Math.floor(info.format.duration) : 0;
    } catch (err) {
      console.warn('Could not get video duration, defaulting to sample strategy:', err.message || err);
      durationSec = 0;
    }

    // Decide timestamps to sample (max 8 frames)
    const maxFrames = 8;
    let timestamps = [];
    if (durationSec && durationSec > 0) {
      const step = Math.max(1, Math.floor(durationSec / Math.min(maxFrames, durationSec)));
      for (let t = 0; t < durationSec && timestamps.length < maxFrames; t += step) {
        timestamps.push(t);
      }
      // ensure last frame included
      if (timestamps.length < maxFrames && durationSec > 0) timestamps.push(Math.max(0, durationSec - 1));
    } else {
      // Unknown duration: fallback to 3 frames at 0s, 1s, 2s
      timestamps = [0, 1, 2].slice(0, maxFrames);
    }

    // Use ffmpeg to extract frames at timestamps
    const frameFiles = [];
    await new Promise((resolve, reject) => {
      const command = ffmpeg(videoPath).on('error', (err) => reject(err)).on('end', () => resolve());

      timestamps.forEach((ts, idx) => {
        const outName = path.join(tmpDir, `frame-${idx}.jpg`);
        // Use seekInput to seek and take single frame
        command.clone().seekInput(ts).frames(1).outputOptions(['-qscale:v 2']).output(outName).run();
        frameFiles.push(outName);
      });
      // Wait a bit and resolve (each clone runs separately) — rely on "end" of last clone
      // Unfortunately fluent-ffmpeg doesn't provide a clean aggregate callback here, so resolve after a small timeout if needed
      // We'll set a timeout fallback
      setTimeout(() => resolve(), Math.max(2000, timestamps.length * 700));
    }).catch(err => {
      console.warn('Frame extraction encountered an issue:', err.message || err);
    });

    // If frameFiles empty, try one full-frame extraction
    if (frameFiles.length === 0) {
      const fallback = path.join(tmpDir, 'frame-0.jpg');
      try {
        await new Promise((resolve, reject) => {
          ffmpeg(videoPath).screenshots({ timestamps: ['00:00:00.000'], filename: path.basename(fallback), folder: tmpDir, size: '320x?' }).on('end', resolve).on('error', reject);
        });
        frameFiles.push(fallback);
      } catch (err) {
        console.warn('Fallback frame extraction failed:', err.message || err);
      }
    }

    // Analyze each frame and compute occupancy percent
    const occupancySamples = [];
    for (const ff of frameFiles) {
      try {
        if (!fs.existsSync(ff)) continue;
        const img = await Jimp.read(ff);
        // Reuse same analysis strategy as images but slightly lighter sampling
        const targetWidth = 320;
        if (img.bitmap.width > targetWidth) img.resize(targetWidth, Jimp.AUTO);
        const { width, height, data } = img.bitmap;
        const pixels = width * height;

        // brightness
        let totalBrightness = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
          }
        }
        const avgBrightness = totalBrightness / pixels;

        // edge density (coarse): sample a grid rather than full Sobel to save time
        let edgeCount = 0;
        const step = Math.max(1, Math.floor(Math.min(width, height) / 40));
        for (let y = 1; y < height - 1; y += step) {
          for (let x = 1; x < width - 1; x += step) {
            const i = width * y + x;
            const gx = (
              -1 * (data[((y - 1) * width + (x - 1)) << 2]) + 1 * (data[((y - 1) * width + (x + 1)) << 2])
            );
            const gy = (
              -1 * (data[((y - 1) * width + (x - 1)) << 2]) + 1 * (data[((y + 1) * width + (x - 1)) << 2])
            );
            const mag = Math.sqrt(gx * gx + gy * gy);
            if (mag > 60) edgeCount++;
          }
        }
        const edgeDensity = edgeCount / Math.max(1, (Math.floor(width / step) * Math.floor(height / step)));

        // skin density (sampled)
        let skinCount = 0;
        const sampleStep = Math.max(1, Math.floor(pixels / 8000));
        for (let i = 0; i < pixels; i += sampleStep) {
          const idx = i << 2;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          const maxc = Math.max(r, g, b), minc = Math.min(r, g, b);
          if (r > 95 && g > 40 && b > 20 && (maxc - minc) > 15 && r > g && r > b) skinCount++;
        }
        const skinDensity = skinCount / Math.max(1, Math.floor(pixels / sampleStep));

        const edgeScore = Math.min(1, edgeDensity * 3);
        const skinScore = Math.min(1, skinDensity * 4);
        const brightnessScore = 1 - Math.min(1, avgBrightness / 255);
        const score = 0.6 * edgeScore + 0.3 * skinScore + 0.1 * brightnessScore;
        let occupancyPercent = 10 + Math.max(0, Math.min(1, score)) * 85;
        occupancyPercent = Math.max(5, Math.min(98, Math.round(occupancyPercent + (Math.random() - 0.5) * 6)));
        occupancySamples.push(occupancyPercent);
      } catch (err) {
        console.warn('Error analyzing frame:', ff, err.message || err);
      }
    }

    // Compute aggregate occupancy
    const finalOccupancy = occupancySamples.length > 0 ? Math.round(occupancySamples.reduce((a, b) => a + b, 0) / occupancySamples.length) : 0;

    // Update LiveData similar to image analysis
    const capacity = place.capacity || 20;
    const occupiedCount = Math.round((finalOccupancy / 100) * capacity);
    const newSeats = generateSeats(capacity).map(s => ({ ...s, occupied: false }));
    const indices = Array.from({ length: capacity }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    for (let i = 0; i < occupiedCount && i < indices.length; i++) {
      newSeats[indices[i]].occupied = true;
    }
    const newTables = generateTables(capacity);
    let seatPointer = 0;
    for (const table of newTables) {
      for (let i = 0; i < table.seats.length; i++) {
        const occupied = newSeats[seatPointer] ? newSeats[seatPointer].occupied : false;
        table.seats[i].occupied = occupied;
        seatPointer++;
      }
    }

    const updatedData = await LiveData.findOneAndUpdate(
      { placeId: place._id.toString() },
      { seats: newSeats, tables: newTables, lastUpdate: new Date() },
      { new: true, upsert: true }
    );

    await trackOccupancy(place._id.toString(), place.name, updatedData.seats);

    // Mark place as analyzed for video
    place.videoAnalyzed = true;
    place.videoUploadedAt = new Date();
    await place.save();

    io.emit('liveDataUpdated', {
      placeId: updatedData.placeId,
      placeName: updatedData.placeName,
      seats: updatedData.seats,
      tables: updatedData.tables,
      lastUpdate: updatedData.lastUpdate,
    });

    io.emit('placesUpdated', { action: 'video_analyzed', place });

    // Force clients to refresh live data for this place (helps ensure all clients re-fetch from REST)
    try {
      io.emit('forceRefresh', { placeId: updatedData.placeId });
    } catch (err) {
      console.warn('Could not emit forceRefresh for video analysis:', err.message || err);
    }

    console.log(`🎬 Video analyzed for ${place.name} — est occupancy: ${finalOccupancy}% (${occupiedCount}/${capacity}) | samples=${occupancySamples.length}`);

    // Cleanup frames
    try {
      for (const f of frameFiles) if (fs.existsSync(f)) fs.unlinkSync(f);
      if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir, { recursive: true });
    } catch (err) {
      console.warn('Error cleaning up frame files:', err.message || err);
    }
  } catch (err) {
    console.error('Error in processVideoAndUpdateLiveData:', err);
  }
};

// Get occupancy history for a place
app.get('/api/occupancy-history/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const history = await OccupancyHistory.findOne({ placeId });
    
    if (!history) {
      // Return default data if no history exists
      return res.json({
        placeId,
        placeName: 'Unknown',
        hourlyData: [],
        todayStats: {
          avgOccupancy: 0,
          peakTime: 'N/A',
          avgWaitTime: '0 min',
          totalVisitors: 0,
        },
        peakHours: [],
      });
    }
    
    // Get top 3 peak hours
    const peakHours = [...history.hourlyData]
      .filter(h => h.peakOccupancy > 0)
      .sort((a, b) => b.peakOccupancy - a.peakOccupancy)
      .slice(0, 3)
      .map(h => ({
        time: `${h.hour}:00 - ${h.hour + 1}:00`,
        occupancy: `${Math.round(h.peakOccupancy)}%`,
      }));
    
    res.json({
      placeId: history.placeId,
      placeName: history.placeName,
      hourlyData: history.hourlyData,
      todayStats: history.todayStats,
      peakHours,
    });
  } catch (error) {
    console.error('Error fetching occupancy history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ============= OCCUPANCY HISTORY API ENDPOINTS =============

// Get occupancy history for a specific place
app.get('/api/occupancy-history/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    // Check if place exists
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    // If video hasn't been uploaded/analyzed yet, return zeros per dashboard requirement
    if (!place.videoAnalyzed) {
      return res.json({
        placeId: place._id.toString(),
        placeName: place.name,
        hourlyData: [],
        todayStats: {
          avgOccupancy: 0,
          peakTime: 'N/A',
          avgWaitTime: '0 min',
          totalVisitors: 0,
        },
        peakHours: [],
      });
    }
    
    // Get or create occupancy history
    let history = await OccupancyHistory.findOne({ placeId });
    
    if (!history) {
      // Create initial mock data with realistic peak times
      const mockHourlyData = Array.from({ length: 24 }, (_, hour) => {
        // Peak times: 12-2pm (lunch) and 6-8pm (dinner)
        const isLunchPeak = hour >= 12 && hour <= 14;
        const isDinnerPeak = hour >= 18 && hour <= 20;
        const isMorningRush = hour >= 8 && hour <= 10;
        
        let baseOccupancy = 30;
        if (isLunchPeak) baseOccupancy = 85 + Math.random() * 10;
        else if (isDinnerPeak) baseOccupancy = 75 + Math.random() * 10;
        else if (isMorningRush) baseOccupancy = 60 + Math.random() * 10;
        else if (hour >= 6 && hour <= 22) baseOccupancy = 40 + Math.random() * 20;
        else baseOccupancy = 10 + Math.random() * 15;
        
        return {
          hour,
          avgOccupancy: Math.round(baseOccupancy),
          peakOccupancy: Math.round(baseOccupancy + Math.random() * 10),
          totalVisitors: Math.round(baseOccupancy * 2),
        };
      });
      
      // Find peak times
      const sortedByOccupancy = [...mockHourlyData].sort((a, b) => b.avgOccupancy - a.avgOccupancy);
      const peakHours = sortedByOccupancy.slice(0, 3).map(d => ({
        time: `${d.hour === 0 ? 12 : d.hour > 12 ? d.hour - 12 : d.hour}:00 ${d.hour >= 12 ? 'PM' : 'AM'} - ${d.hour + 1 === 0 ? 12 : d.hour + 1 > 12 ? d.hour + 1 - 12 : d.hour + 1}:00 ${d.hour + 1 >= 12 ? 'PM' : 'AM'}`,
        occupancy: `${d.avgOccupancy}%`,
      }));
      
      const avgOccupancy = Math.round(mockHourlyData.reduce((sum, d) => sum + d.avgOccupancy, 0) / 24);
      const peakHour = sortedByOccupancy[0].hour;
      const peakTime = `${peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${peakHour >= 12 ? 'PM' : 'AM'}`;
      
      history = new OccupancyHistory({
        placeId: place._id.toString(),
        placeName: place.name,
        hourlyData: mockHourlyData,
        todayStats: {
          avgOccupancy: `${avgOccupancy}%`,
          peakTime: peakTime,
          avgWaitTime: avgOccupancy > 70 ? '5-8 min' : avgOccupancy > 50 ? '3-5 min' : '1-2 min',
          totalVisitors: mockHourlyData.reduce((sum, d) => sum + d.totalVisitors, 0),
        },
      });
      
      await history.save();
      console.log(`✅ Created occupancy history for ${place.name}`);
    }
    
    // Format peak hours for response
    const sortedByOccupancy = [...history.hourlyData].sort((a, b) => b.avgOccupancy - a.avgOccupancy);
    const peakHours = sortedByOccupancy.slice(0, 3).map(d => ({
      time: `${d.hour === 0 ? 12 : d.hour > 12 ? d.hour - 12 : d.hour}:00 ${d.hour >= 12 ? 'PM' : 'AM'} - ${d.hour + 1 === 0 ? 12 : d.hour + 1 > 12 ? d.hour + 1 - 12 : d.hour + 1}:00 ${d.hour + 1 >= 12 ? 'PM' : 'AM'}`,
      occupancy: `${d.avgOccupancy}%`,
    }));
    
    res.json({
      placeId: history.placeId,
      placeName: history.placeName,
      peakHours,
      todayStats: history.todayStats,
      hourlyData: history.hourlyData,
    });
  } catch (error) {
    console.error('Error fetching occupancy history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= PLACES API ENDPOINTS =============

// Get all places
app.get('/api/places', async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 });
    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single place by ID
app.get('/api/places/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    
    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new place
app.post('/api/places', async (req, res) => {
  try {
    const { name, description, capacity, imageUrl } = req.body;
    
    // Validation
    if (!name || !description || !capacity) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (capacity < 1) {
      return res.status(400).json({ error: 'Capacity must be at least 1' });
    }
    
    const newPlace = new Place({
      name,
      description,
      capacity,
      imageUrl: imageUrl || '',
    });
    
    await newPlace.save();
    
    // Broadcast to all connected clients
    io.emit('placesUpdated', { action: 'created', place: newPlace });
    
    // If manager provided an image, trigger analysis to generate live data
    if (newPlace.imageUrl && newPlace.imageUrl.trim()) {
      analyzeImageAndUpdateLiveData(newPlace._id.toString()).catch(err => 
        console.error('Error analyzing new place image:', err)
      );
    }
    
    res.status(201).json(newPlace);
    console.log('✅ New place created:', name, `(${capacity} seats)`);
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update place
app.put('/api/places/:id', async (req, res) => {
  try {
    const { name, description, capacity, imageUrl } = req.body;
    
    // Build update object dynamically to allow partial updates
    const updateData = { updatedAt: new Date() };
    
    // If only imageUrl is provided (image upload case)
    if (imageUrl !== undefined && !name && !description && !capacity) {
      updateData.imageUrl = imageUrl || '';
    } else {
      // Full update case (from manage places form)
      if (!name || !description || !capacity) {
        return res.status(400).json({ error: 'All fields are required for full update' });
      }
      
      if (capacity < 1) {
        return res.status(400).json({ error: 'Capacity must be at least 1' });
      }
      
      updateData.name = name;
      updateData.description = description;
      updateData.capacity = capacity;
      updateData.imageUrl = imageUrl || '';
    }
    
    const updatedPlace = await Place.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedPlace) {
      return res.status(404).json({ error: 'Place not found' });
    }
    
    // Broadcast to all connected clients
    io.emit('placesUpdated', { action: 'updated', place: updatedPlace });
    
    res.json(updatedPlace);
    console.log('✅ Place updated:', updatedPlace.name);
    // If image was updated, run a quick analysis to estimate occupancy and update live data
    if (updateData.imageUrl) {
      analyzeImageAndUpdateLiveData(updatedPlace._id.toString()).catch(err => console.error('Error analyzing image after update:', err));
    }
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload image file for a place
app.post('/api/places/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const place = await Place.findById(req.params.id);
    if (!place) {
      // Delete uploaded file if place not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Place not found' });
    }

    // Delete old image file if it exists and is a local file
    if (place.imageUrl && place.imageUrl.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, place.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted old image:', place.imageUrl);
      }
    }

    // Generate URL for the uploaded file
    const imageUrl = `/uploads/places/${req.file.filename}`;

    // Update place with new image URL
    const updatedPlace = await Place.findByIdAndUpdate(
      req.params.id,
      { imageUrl, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Broadcast to all connected clients
    io.emit('placesUpdated', { action: 'updated', place: updatedPlace });

    // Analyze uploaded image and update live data (best-effort)
    analyzeImageAndUpdateLiveData(updatedPlace._id.toString()).catch(err => console.error('Error analyzing uploaded image:', err));

    res.json({
      message: 'Image uploaded successfully',
      place: updatedPlace,
      imageUrl: imageUrl
    });
    console.log('✅ Image uploaded for place:', updatedPlace.name);
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Upload video file for a place
app.post('/api/places/:id/upload-video', uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const place = await Place.findById(req.params.id);
    if (!place) {
      // Delete uploaded file if place not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Place not found' });
    }

    // Delete old video if present
    if (place.videoUrl && place.videoUrl.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, place.videoUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log('🗑️ Deleted old video:', place.videoUrl);
      }
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;

    const updatedPlace = await Place.findByIdAndUpdate(
      req.params.id,
      { videoUrl, videoUploadedAt: new Date(), videoAnalyzed: false, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Broadcast place update
    io.emit('placesUpdated', { action: 'video_uploaded', place: updatedPlace });

    // Process video asynchronously (best-effort)
    processVideoAndUpdateLiveData(updatedPlace._id.toString(), req.file.path).catch(err => console.error('Error processing uploaded video:', err));

    res.json({ message: 'Video uploaded, processing started', place: updatedPlace, videoUrl });
    console.log('✅ Video uploaded for place:', updatedPlace.name);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Error uploading video:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Delete place
app.delete('/api/places/:id', async (req, res) => {
  try {
    const deletedPlace = await Place.findByIdAndDelete(req.params.id);
    
    if (!deletedPlace) {
      return res.status(404).json({ error: 'Place not found' });
    }

    // Delete associated image file if it's a local file
    if (deletedPlace.imageUrl && deletedPlace.imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, deletedPlace.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('🗑️ Deleted image file:', deletedPlace.imageUrl);
      }
    }
    
    // Broadcast to all connected clients
    io.emit('placesUpdated', { action: 'deleted', placeId: req.params.id });
    
    res.json({ message: 'Place deleted successfully', place: deletedPlace });
    console.log('✅ Place deleted:', deletedPlace.name);
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Handle manual refresh from client for a specific place
  socket.on('requestRefresh', async (data) => {
    try {
      const { placeId } = data;
      
      if (!placeId) {
        console.error('❌ No placeId provided for refresh');
        return;
      }
      
      const place = await Place.findById(placeId);
      if (!place) {
        console.error('❌ Place not found:', placeId);
        return;
      }
      
      // Fetch existing live data (do NOT generate new data)
      const liveData = await LiveData.findOne({ placeId });
      
      if (!liveData) {
        console.log('ℹ️ No live data available for:', place.name);
        return;
      }
      
      // Broadcast existing data to all clients (sync only, no modification)
      io.emit('liveDataUpdated', {
        placeId: liveData.placeId,
        placeName: liveData.placeName,
        seats: liveData.seats,
        tables: liveData.tables,
        lastUpdate: liveData.lastUpdate,
      });
      
      console.log(`✅ Existing data synced via WebSocket for ${place.name}`);
    } catch (error) {
      console.error('Error refreshing data via WebSocket:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Note: Auto-refresh disabled. Live data only updates when manager uploads new images/videos.
// This ensures data consistency and reflects actual analysis results.

// Start server
const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready for real-time updates`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});
