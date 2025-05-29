const express = require("express");
const multer = require("multer");
const Photo = require("../models/Photo");
const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload photo(s) with optional titles and tags
router.post("/upload", (req, res, next) => {
  upload.array("photos", 10)(req, res, function (err) {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    const titles = req.body.titles || [];
    const tags = req.body.tags || [];

    const photos = req.files.map((file, index) => ({
      filename: file.filename,
      originalname: file.originalname,
      title: Array.isArray(titles) ? titles[index] || "" : titles,
      tags: Array.isArray(tags) ? tags[index]?.split(",") || [] : (tags ? tags.split(",") : []),
    }));

    const savedPhotos = await Photo.insertMany(photos);
    res.json(savedPhotos);
  } catch (err) {
    next(err); // Pass error to error handler middleware
  }
});

// Get all photos
router.get("/", async (req, res, next) => {
  try {
    const photos = await Photo.find();
    res.json(photos);
  } catch (err) {
    next(err);
  }
});

// Update tags for a photo
router.post("/tag/:id", async (req, res, next) => {
  try {
    const { tags } = req.body;
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { $set: { tags } },
      { new: true }
    );
    res.json(photo);
  } catch (err) {
    next(err);
  }
});

// Update title for a photo
router.post("/title/:id", async (req, res, next) => {
  try {
    const { title } = req.body;
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { $set: { title } },
      { new: true }
    );
    res.json(photo);
  } catch (err) {
    next(err);
  }
});

// Search photos by tag (can extend later)
router.get("/search", async (req, res, next) => {
  try {
    const { tag } = req.query;
    const photos = await Photo.find({ tags: tag });
    res.json(photos);
  } catch (err) {
    next(err);
  }
});

// Toggle favorite
router.post("/favorite/:id", async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id);
    photo.favorite = !photo.favorite;
    await photo.save();
    res.json(photo);
  } catch (err) {
    next(err);
  }
});

// Delete photo
router.delete("/:id", async (req, res, next) => {
  try {
    await Photo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Error handling middleware for this router (must be last)
router.use((err, req, res, next) => {
  console.error("Unhandled error in photos router:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = router;
