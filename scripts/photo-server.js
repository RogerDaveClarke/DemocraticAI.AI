const express = require('express');
const cors = require('cors');
const path = require('path');

// nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
const app = express();
const port = 3001;

const allowedOrigins = (process.env.PHOTO_SERVER_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
}));

// Serve static files from member-photos directory
app.use('/photos/members', express.static(path.join(__dirname, 'member-photos')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// List available photos
app.get('/photos', (req, res) => {
  const fs = require('fs');
  const photoDir = path.join(__dirname, 'member-photos');
  
  try {
    const files = fs.readdirSync(photoDir);
    const photos = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    res.json({ photos, count: photos.length });
  } catch (error) {
    res.status(500).json({ error: 'Cannot read photos directory' });
  }
});

app.listen(port, () => {
  console.log(`Photo server running at http://localhost:${port}`);
  console.log(`Photos available at http://localhost:${port}/photos/members/`);
});

module.exports = app;