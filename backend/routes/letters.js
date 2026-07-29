import express from 'express';
import bcrypt from 'bcrypt';
import Letter from '../models/Letter.js';
import { requireOwner } from '../middleware/auth.js';
import { generateMemorableSlug } from '../utils/slug.js';

const router = express.Router();

const adjectives = ['golden', 'silent', 'misty', 'amber', 'silver', 'gentle', 'velvet', 'soft', 'warm', 'sweet'];
const nouns = ['rain', 'river', 'forest', 'echo', 'shadow', 'dream', 'memory', 'sky', 'star', 'leaf', 'wind'];

function generateReadablePassword() {
  const word1 = adjectives[Math.floor(Math.random() * adjectives.length)];
  const word2 = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return `${word1}-${word2}-${number}`;
}

// 1. Get all letters (for owner)
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

    // Create base query
    let lettersQuery = Letter.find(query);

    // Sorting
    if (sort === 'oldest') {
      lettersQuery = lettersQuery.sort({ createdAt: 1 });
    } else if (sort === 'memoryDateNewest') {
      lettersQuery = lettersQuery.sort({ memoryDate: -1, createdAt: -1 });
    } else if (sort === 'memoryDateOldest') {
      lettersQuery = lettersQuery.sort({ memoryDate: 1, createdAt: 1 });
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

// 2. Get a single letter by ID (for owner)
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
      return res.status(400).json({ message: 'Invalid letter ID format', error: error.message });
    }
    res.status(500).json({ message: 'Error fetching letter', error: error.message });
  }
});

// 3. Create a new letter draft
router.post('/', requireOwner, async (req, res) => {
  try {
    const defaultLetter = new Letter({
      recipient: 'Someone',
      title: 'Untitled Letter',
      content: '',
      status: 'Draft',
      tags: [],
    });

    const savedLetter = await defaultLetter.save();
    res.status(201).json(savedLetter);
  } catch (error) {
    console.error('Error creating letter draft:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Letter validation failed', error: error.message });
    }
    res.status(500).json({ message: 'Error creating letter', error: error.message });
  }
});

// 4. Update a letter (autosave support)
router.put('/:id', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    const updates = req.body;

    // Check status logic when updating
    // If status is Sealed but unlockDate is updated to empty/past, auto transition to Shared
    if (updates.status === 'Sealed' && updates.unlockDate && new Date(updates.unlockDate) <= new Date()) {
      updates.status = 'Shared';
    } else if (updates.status === 'Shared' && updates.unlockDate && new Date(updates.unlockDate) > new Date()) {
      updates.status = 'Sealed';
    }

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
      return res.status(400).json({ message: 'Invalid letter ID format', error: error.message });
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
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid letter ID format', error: error.message });
    }
    res.status(500).json({ message: 'Error updating favorite status', error: error.message });
  }
});

// 6. Generate share link & passcode (returns plaintext password once)
router.post('/:id/share', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6 || password.length > 64) {
      return res.status(400).json({ message: 'Password must be between 6 and 64 characters' });
    }

    // Generate unique slug if not present
    if (!letter.shareSlug) {
      let unique = false;
      let slug;
      while (!unique) {
        slug = generateMemorableSlug();
        const existing = await Letter.findOne({ shareSlug: slug });
        if (!existing) unique = true;
      }
      letter.shareSlug = slug;
    }

    const salt = await bcrypt.genSalt(10);
    letter.sharePassword = await bcrypt.hash(password, salt);

    // Determine status (Sealed if time capsule is locked, Shared otherwise)
    if (letter.unlockDate && new Date(letter.unlockDate) > new Date()) {
      letter.status = 'Sealed';
    } else {
      letter.status = 'Shared';
    }

    await letter.save();

    // Return the updated letter along with the plain password
    res.json({
      letter,
      plainPassword: password, // Send this once so user can view/copy it
    });
  } catch (error) {
    console.error(`Error sharing letter ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid letter ID format', error: error.message });
    }
    res.status(500).json({ message: 'Error generating share credentials', error: error.message });
  }
});

// 7. Revoke sharing (reverts to Draft)
router.post('/:id/unshare', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    letter.shareSlug = undefined;
    letter.sharePassword = undefined;
    letter.status = 'Draft';
    await letter.save();

    res.json(letter);
  } catch (error) {
    console.error(`Error unsharing letter ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid letter ID format', error: error.message });
    }
    res.status(500).json({ message: 'Error revoking share link', error: error.message });
  }
});

// 8. Delete a letter
router.delete('/:id', requireOwner, async (req, res) => {
  try {
    const letter = await Letter.findByIdAndDelete(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    console.error(`Error deleting letter ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid letter ID format', error: error.message });
    }
    res.status(500).json({ message: 'Error deleting letter', error: error.message });
  }
});

export default router;
