import express from 'express';
import Letter from '../models/Letter.js';
import { requireOwner } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all private letters (for owner)
router.get('/', requireOwner, async (req, res) => {
  try {
    const { search, tag, status, sort } = req.query;
    let query = {};

    // Apply search filter (searches recipient, title, content)
    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // Apply tag filter
    if (tag) {
      query.tags = tag;
    }

    // Apply status filter
    if (status) {
      query.status = status;
    }

    let lettersQuery = Letter.find(query);

    // Sorting
    if (sort === 'oldest') {
      lettersQuery = lettersQuery.sort({ createdAt: 1 });
    } else if (sort === 'updated') {
      lettersQuery = lettersQuery.sort({ updatedAt: -1 });
    } else {
      // Default: newest created
      lettersQuery = lettersQuery.sort({ createdAt: -1 });
    }

    const letters = await lettersQuery;
    res.json(letters);
  } catch (error) {
    console.error('Error fetching letters:', error);
    res.status(500).json({ message: 'Error fetching letters', error: error.message });
  }
});

// 2. Get a single letter by ID
router.get('/:id', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    res.json(letter);
  } catch (error) {
    console.error(`Error fetching letter ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid letter ID format' });
    }
    res.status(500).json({ message: 'Error fetching letter', error: error.message });
  }
});

// 3. Create a new letter draft
router.post('/', requireOwner, async (req, res) => {
  try {
    const { recipient, title, content, tags, status } = req.body || {};
    const defaultLetter = new Letter({
      recipient: recipient || 'Gửi bản thân',
      title: title || 'Lá thư chưa đặt tên',
      content: content || '',
      status: status || 'Draft',
      tags: tags || [],
    });

    const savedLetter = await defaultLetter.save();
    res.status(201).json(savedLetter);
  } catch (error) {
    console.error('Error creating letter:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Letter validation failed', error: error.message });
    }
    res.status(500).json({ message: 'Error creating letter', error: error.message });
  }
});

// 4. Update a letter
router.put('/:id', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    const updates = req.body;
    const updatedLetter = await Letter.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json(updatedLetter);
  } catch (error) {
    console.error(`Error updating letter ${req.params.id}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Letter validation failed', error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid letter ID format' });
    }
    res.status(500).json({ message: 'Error updating letter', error: error.message });
  }
});

// 5. Toggle favorite status
router.post('/:id/favorite', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    letter.isFavorite = !letter.isFavorite;
    await letter.save();
    res.json(letter);
  } catch (error) {
    console.error(`Error favoriting letter ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating favorite status', error: error.message });
  }
});

// 6. Delete a letter
router.delete('/:id', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findByIdAndDelete(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    console.error(`Error deleting letter ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting letter', error: error.message });
  }
});

export default router;
