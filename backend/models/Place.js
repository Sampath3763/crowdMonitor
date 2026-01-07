import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  // Video metadata: remote/local video URL and whether we've processed it
  videoUrl: {
    type: String,
    default: '',
  },
  videoAnalyzed: {
    type: Boolean,
    default: false,
  },
  videoUploadedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
placeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Place = mongoose.model('Place', placeSchema);

export default Place;
