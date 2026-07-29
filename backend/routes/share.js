import express from 'express';
import bcrypt from 'bcrypt';
import Letter from '../models/Letter.js';

const router = express.Router();

// Helper to determine relative memory age
const getRelativeTimeString = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  }
  const diffMonths = (now.getFullYear() - past.getFullYear()) * 12 + (now.getMonth() - past.getMonth());
  if (Math.abs(diffMonths) < 12) {
    return `${Math.abs(diffMonths)} months ago`;
  }
  const diffYears = now.getFullYear() - past.getFullYear();
  return `${Math.abs(diffYears)} years ago`;
};

// 1. Check letter availability, requires password check, time capsule check, or one-time opening lock
router.get('/:slug', async (req, res) => {
  try {
    const letter = await Letter.findOne({ shareSlug: req.params.slug });
    if (!letter || !['Shared', 'Sealed'].includes(letter.status)) {
      return res.status(404).json({ message: 'This letter does not exist or has been removed.' });
    }

    // A. Check Time Capsule status
    if (letter.unlockDate && new Date(letter.unlockDate) > new Date()) {
      return res.json({
        status: 'Sealed',
        recipient: letter.recipient,
        unlockDate: letter.unlockDate,
      });
    }

    // B. Check One-Time Opening status
    if (letter.oneTimeOpening && letter.openedCount > 0) {
      return res.status(403).json({
        status: 'Opened',
        message: 'This letter has already been opened.',
      });
    }

    // C. Check if Password Protected
    if (letter.sharePassword) {
      return res.json({
        requiresPassword: true,
        recipient: letter.recipient,
      });
    }

    // D. If not password protected, open immediately
    letter.openedCount += 1;
    if (letter.oneTimeOpening) {
      // Once opened, it's sealed forever
      letter.status = 'Shared'; 
    }
    await letter.save();

    const formattedLetter = letter.toObject();
    formattedLetter.relativeMemoryTime = getRelativeTimeString(letter.memoryDate);

    res.json({
      requiresPassword: false,
      letter: formattedLetter,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking letter', error: error.message });
  }
});

// 2. Unlock password-protected letter
router.post('/:slug/unlock', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const letter = await Letter.findOne({ shareSlug: req.params.slug });
    if (!letter || !['Shared', 'Sealed'].includes(letter.status)) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    // A. Check Time Capsule
    if (letter.unlockDate && new Date(letter.unlockDate) > new Date()) {
      return res.status(403).json({
        status: 'Sealed',
        message: 'This letter is still sealed.',
        unlockDate: letter.unlockDate,
      });
    }

    // B. Check One-Time Opening
    if (letter.oneTimeOpening && letter.openedCount > 0) {
      return res.status(403).json({
        status: 'Opened',
        message: 'This letter has already been opened.',
      });
    }

    // C. Verify Password
    const match = await bcrypt.compare(password, letter.sharePassword);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect passcode' });
    }

    // D. Successful Unlock -> Increment opened count
    letter.openedCount += 1;
    await letter.save();

    const formattedLetter = letter.toObject();
    // Delete hashed password from response for safety
    delete formattedLetter.sharePassword;
    formattedLetter.relativeMemoryTime = getRelativeTimeString(letter.memoryDate);

    res.json({
      unlocked: true,
      letter: formattedLetter,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error unlocking letter', error: error.message });
  }
});

// 3. Submit the single reply
router.post('/:slug/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply content cannot be empty' });
    }

    const letter = await Letter.findOne({ shareSlug: req.params.slug });
    if (!letter || !['Shared', 'Sealed'].includes(letter.status)) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    // Check if oneReply is enabled
    if (!letter.oneReply) {
      return res.status(400).json({ message: 'Replies are not enabled for this letter' });
    }

    // Check if a reply already exists
    if (letter.reply) {
      return res.status(400).json({ message: 'A reply has already been submitted for this letter' });
    }

    // Save reply
    letter.reply = reply.trim();
    await letter.save();

    res.json({ message: 'Reply submitted successfully', reply: letter.reply });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting reply', error: error.message });
  }
});

export default router;
