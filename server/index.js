const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const photoRoutes = require("./routes/photoRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect("mongodb+srv://sansheyabaskar:Sansheya%4011@cluster0.dor0gap.mongodb.net/myDatabase?retryWrites=true&w=majority")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use("/api/photos", photoRoutes);

const PORT =6006;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const albumRoutes = require('./routes/albumRoutes');
app.use('/api/albums', albumRoutes);



// Static uploads folder (if needed)

  
 






