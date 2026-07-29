import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  // Compare with password from environment
  if (password === process.env.OWNER_PASSWORD) {
    const token = jwt.sign({ owner: true }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.json({ token });
  }

  return res.status(401).json({ message: 'Incorrect passcode' });
});

// Route to verify if token is still valid
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ valid: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ valid: true });
  } catch (error) {
    return res.json({ valid: false });
  }
});

export default router;
