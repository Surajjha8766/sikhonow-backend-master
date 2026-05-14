import express from "express";
dotenv.config();
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import masterRoutes from "./routes/masterRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";



connectDB();

const app = express();

app.use(cors());

app.use(express.json());

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);

app.use("/api/master", masterRoutes);
app.use("/api/courses", courseRoutes);

app.get("/", (req, res) => {
  res.send("Master Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});