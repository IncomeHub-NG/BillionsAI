const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const lipSyncRoutes = require("./routes/lipsync");
const voiceCloneRoutes = require("./routes/voiceclone");
const avatarRoutes = require("./routes/avatar");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-replicate-key", "x-elevenlabs-key"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/lipsync", lipSyncRoutes);
app.use("/api/voiceclone", voiceCloneRoutes);
app.use("/api/avatar", avatarRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "BillionsAI Backend Running 👑",
    version: "1.0.0",
    features: ["lip-sync", "voice-clone", "live-avatar"],
  });
});

app.listen(PORT, () => {
  console.log(`BillionsAI Backend running on port ${PORT}`);
});
