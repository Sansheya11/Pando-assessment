const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String },
  uploadDate: { type: Date, default: Date.now },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
});

const albumSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photos: [photoSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Transform URLs to absolute URLs when converting to JSON
albumSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.photos) {
      ret.photos = ret.photos.map(photo => {
        if (!photo.url.startsWith('http://') && !photo.url.startsWith('https://')) {
          photo.url = `http://localhost:9001${photo.url}`;
        }
        return photo;
      });
    }
    return ret;
  }
});

module.exports = mongoose.model('Album', albumSchema);
