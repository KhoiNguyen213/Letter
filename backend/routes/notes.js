import express from 'express';
import Note from '../models/Note.js';
import { requireOwner } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all notes for owner
router.get('/', requireOwner, async (req, res) => {
  try {
    const { search, category, tag, sort } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    let notesQuery = Note.find(query);

    if (sort === 'oldest') {
      notesQuery = notesQuery.sort({ isPinned: -1, createdAt: 1 });
    } else if (sort === 'updated') {
      notesQuery = notesQuery.sort({ isPinned: -1, updatedAt: -1 });
    } else {
      // Default: pinned first, then newest created
      notesQuery = notesQuery.sort({ isPinned: -1, createdAt: -1 });
    }

    const notes = await notesQuery;
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
});

// 2. Get single note by ID
router.get('/:id', requireOwner, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error(`Error fetching note ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching note', error: error.message });
  }
});

// 3. Create note
router.post('/', requireOwner, async (req, res) => {
  try {
    const { title, content, category, tags, isPinned, image, audio } = req.body || {};
    const note = new Note({
      title: title || 'Ghi chú mới',
      content: content || '',
      category: category || 'Personal',
      tags: tags || [],
      isPinned: isPinned || false,
      image: image || '',
      audio: audio || { url: '', title: '', duration: 0 },
    });

    const saved = await note.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Error creating note', error: error.message });
  }
});

// 4. Update note
router.put('/:id', requireOwner, async (req, res) => {
  try {
    const updated = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error(`Error updating note ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
});

// 5. Delete note
router.delete('/:id', requireOwner, async (req, res) => {
  try {
    const deleted = await Note.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(`Error deleting note ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});

export default router;
