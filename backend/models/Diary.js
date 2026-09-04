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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Diary', DiarySchema);
