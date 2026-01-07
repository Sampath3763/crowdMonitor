import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  occupied: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const tableSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  seats: [seatSchema],
});

const liveDataSchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: true,
    unique: true,
  },
  placeName: {
    type: String,
    required: true,
  },
  seats: [seatSchema],
  tables: [tableSchema],
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const LiveData = mongoose.model('LiveData', liveDataSchema);

export default LiveData;
