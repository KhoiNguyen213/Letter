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

// Route to get session status (alias/standard auth endpoint)
router.get('/session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ authenticated: true, owner: decoded.owner });
  } catch (error) {
    return res.status(401).json({ authenticated: false, message: 'Invalid or expired session' });
  }
});

// Private registration disabled route
router.post('/register', (req, res) => {
  return res.status(403).json({
    message: 'Registration is disabled on this private letter instance.'
  });
});

// Refresh token route
router.post('/refresh', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const newToken = jwt.sign({ owner: true }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.json({ token: newToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
