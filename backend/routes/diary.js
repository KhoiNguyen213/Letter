import express from 'express';
import Diary from '../models/Diary.js';
import { requireOwner } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all diary entries for owner
router.get('/', requireOwner, async (req, res) => {
  try {
    const { search, mood, tag, sort } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { privateNotes: { $regex: search, $options: 'i' } },
      ];
    }

    if (mood) {
      query.mood = mood;
    }

    if (tag) {
      query.tags = tag;
    }

    let diaryQuery = Diary.find(query);

    if (sort === 'oldest') {
      diaryQuery = diaryQuery.sort({ date: 1, createdAt: 1 });
    } else {
      // Default: newest date
      diaryQuery = diaryQuery.sort({ date: -1, createdAt: -1 });
    }

    const entries = await diaryQuery;
    res.json(entries);
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    res.status(500).json({ message: 'Error fetching diary entries', error: error.message });
  }
});

// 2. Get single diary entry by ID
router.get('/:id', requireOwner, async (req, res) => {
  try {
    const entry = await Diary.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error(`Error fetching diary entry ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching diary entry', error: error.message });
  }
});

// 3. Create diary entry
router.post('/', requireOwner, async (req, res) => {
  try {
    const { date, title, content, mood, tags, privateNotes } = req.body;
    const entry = new Diary({
      date: date || new Date(),
      title: title || '',
      content: content || '',
      mood: mood || 'Peaceful',
      tags: tags || [],
      privateNotes: privateNotes || '',
    });

    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating diary entry:', error);
    res.status(500).json({ message: 'Error creating diary entry', error: error.message });
  }
});

// 4. Update diary entry
router.put('/:id', requireOwner, async (req, res) => {
  try {
    const updated = await Diary.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error(`Error updating diary entry ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating diary entry', error: error.message });
  }
});

// 5. Delete diary entry
router.delete('/:id', requireOwner, async (req, res) => {
  try {
    const deleted = await Diary.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    res.json({ message: 'Diary entry deleted successfully' });
  } catch (error) {
    console.error(`Error deleting diary entry ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting diary entry', error: error.message });
  }
});

export default router;
