import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/* ---------------------- APP SETUP --------------------- */
const app = express();
app.use(cors());
app.use(express.json());

/* ----------------- MongoDB Connection ----------------- */

const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

/* ------------------ Basic Test Route ------------------ */

app.get("/", (req, res) => {
  res.send("API is running!..");
});

/* -------------------- Server Start -------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
