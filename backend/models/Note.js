import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Ghi chú mới',
    },
    content: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Personal', 'Idea', 'Plan', 'Remember', 'Goal', 'List', 'Random'],
      default: 'Personal',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
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

export default mongoose.model('Note', NoteSchema);
