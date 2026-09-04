import express from 'express';
const router = express.Router();

router.all('*', (req, res) => {
  res.status(403).json({
    message: 'Public sharing is disabled on this private letter workspace.',
  });
});

export default router;
