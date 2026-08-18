const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

// Enable CORS for all origins
app.use(cors());

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