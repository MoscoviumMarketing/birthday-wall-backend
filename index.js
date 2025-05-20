 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema and model
const postSchema = new mongoose.Schema({
  url: String,
  caption: String,
  year: String,
  type: String,
  createdAt: { type: Date, default: Date.now },
});
const Post = mongoose.model('Post', postSchema);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
app.get('/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/upload', upload.single('file'), (req, res) => {
  const { caption, year } = req.body;
  const file = req.file;

  if (!file) return res.status(400).send('No file uploaded');

  cloudinary.uploader.upload_stream(
    { resource_type: 'auto' },
    async (error, result) => {
      if (error) return res.status(500).json({ error });

      const newPost = new Post({
        url: result.secure_url,
        caption,
        year,
        type: result.resource_type,
      });

      await newPost.save();
      res.json(newPost);
    }
  ).end(file.buffer);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
