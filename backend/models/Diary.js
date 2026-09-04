import mongoose from 'mongoose';

const DiarySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: true,
      default: '',
    },
    mood: {
      type: String,
      trim: true,
      default: 'Peaceful',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    privateNotes: {
      type: String,
      default: '',
    },
    image: {
      type: String, // Path/URL to attached photo (legacy single image)
      default: '',
    },
    images: [
      {
        type: String, // Array of paths/URLs to attached photos
      },
    ],
    audio: {
      url: { type: String, default: '' },
      title: { type: String, default: '' },
      duration: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Diary', DiarySchema);
