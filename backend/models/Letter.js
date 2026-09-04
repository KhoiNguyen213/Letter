import mongoose from 'mongoose';

const LetterSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      default: 'Gửi bản thân',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Lá thư chưa đặt tên',
    },
    content: {
      type: String,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Completed'],
      default: 'Draft',
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    music: {
      url: { type: String },
      title: { type: String },
      artist: { type: String },
      duration: { type: Number },
    },
    voice: {
      url: { type: String },
      duration: { type: Number },
    },
    memoryDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Letter', LetterSchema);
