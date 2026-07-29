import mongoose from 'mongoose';

const LetterSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    mood: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    coverImage: {
      type: String, // URL/path to local uploaded image
    },
    music: {
      url: { type: String },
      title: { type: String },
      artist: { type: String },
      duration: { type: Number }, // in seconds
      fileSize: { type: Number }, // in bytes
    },
    voice: {
      url: { type: String },
      duration: { type: Number }, // in seconds
      fileSize: { type: Number }, // in bytes
    },
    memoryDate: {
      type: Date,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Draft', 'Sealed', 'Shared', 'Archived'],
      default: 'Draft',
    },
    unlockDate: {
      type: Date, // For time capsules
    },
    oneTimeOpening: {
      type: Boolean,
      default: false,
    },
    openedCount: {
      type: Number,
      default: 0,
    },
    oneReply: {
      type: Boolean,
      default: false,
    },
    reply: {
      type: String, // The single reply left by the viewer
      trim: true,
    },
    shareSlug: {
      type: String,
      unique: true,
      sparse: true, // Allow nulls for drafts
    },
    sharePassword: {
      type: String, // Hashed password
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Letter', LetterSchema);
