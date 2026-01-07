import mongoose from 'mongoose';

const hourlyDataSchema = new mongoose.Schema({
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  avgOccupancy: {
    type: Number,
    required: true,
    default: 0,
  },
  peakOccupancy: {
    type: Number,
    required: true,
    default: 0,
  },
  totalVisitors: {
    type: Number,
    required: true,
    default: 0,
  },
});

const occupancyHistorySchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: true,
    unique: true,
  },
  placeName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  hourlyData: [hourlyDataSchema],
  todayStats: {
    avgOccupancy: {
      type: Number,
      default: 0,
    },
    peakTime: {
      type: String,
      default: 'N/A',
    },
    avgWaitTime: {
      type: String,
      default: '0 min',
    },
    totalVisitors: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

const OccupancyHistory = mongoose.model('OccupancyHistory', occupancyHistorySchema);

export default OccupancyHistory;
