const express = require("express");
const router = express.Router();
const multer = require("multer");
const FormData = require("form-data");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const upload = multer({ storage: multer.memoryStorage() });

router.post("/clone", upload.single("audio"), async (req, res) => {
  try {
    const apiKey = req.headers["x-elevenlabs-key"] || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(400).json({ error: "ElevenLabs API key required" });
    if (!req.file) return res.status(400).json({ error: "Audio file required" });

    const { voiceName = "My Cloned Voice" } = req.body;

    const formData = new FormData();
    formData.append("name", voiceName);
    formData.append("files", req.file.buffer, {
      filename: req.file.originalname || "voice.mp3",
      contentType: req.file.mimetype,
    });

    const cloneRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": apiKey, ...formData.getHeaders() },
      body: formData,
    });

    const data = await cloneRes.json();
    if (!data.voice_id) return res.status(500).json({ error: "Clone failed", details: data });

    res.json({ success: true, voiceId: data.voice_id, voiceName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/speak", async (req, res) => {
  try {
    const apiKey = req.headers["x-elevenlabs-key"] || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(400).json({ error: "ElevenLabs API key required" });

    const { text, voiceId } = req.body;
    if (!text || !voiceId) return res.status(400).json({ error: "Text and voiceId required" });

    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!ttsRes.ok) return res.status(500).json({ error: "TTS failed" });
    const audioBuffer = await ttsRes.buffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
