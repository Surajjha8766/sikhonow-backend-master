// models/Course.js
import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  chapterNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  video: {
    videoId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    length: {
      type: String, // Format: "HH:MM:SS"
      required: true,
    },
    size: {
      type: Number,
    },
  },
}, {
  timestamps: true,
});

const previewVideoSchema = new mongoose.Schema({
  videoId: {
    type: String,
  },
  url: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
  },
  length: {
    type: String,
  },
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ['hours', 'weeks', 'months'],
        required: true,
      },
    },
    pricing: {
      originalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      offerPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    bannerImage: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    previewVideo: previewVideoSchema,
    chapters: [chapterSchema],
    category: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['Hindi', 'English', 'Hinglish', 'Other'],
    },
    uploadedBy: {
      type: String,
      required: true,
    },
    masterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Master',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Course', courseSchema);