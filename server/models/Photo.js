const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  title: { type: String, default: "" },      // Optional title field
  tags: [{ type: String }],                  // Array of tags
  favorite: { type: Boolean, default: false },
  uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Photo", photoSchema);
