const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo" }],
});

module.exports = mongoose.model("Album", albumSchema);
