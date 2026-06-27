const express = require("express");
const router = express.Router();
const multer = require("multer");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const upload = multer({ storage: multer.memoryStorage() });

router.post("/generate", upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]), async (req, res) => {
  try {
    const { photo, audio } = req.files;
    const apiKey = req.headers["x-replicate-key"] || process.env.REPLICATE_API_TOKEN;

    if (!apiKey) return res.status(400).json({ error: "Replicate API key required" });
    if (!photo || !audio) return res.status(400).json({ error: "Photo and audio required" });

    const photoBase64 = `data:${photo[0].mimetype};base64,${photo[0].buffer.toString("base64")}`;
    const audioBase64 = `data:${audio[0].mimetype};base64,${audio[0].buffer.toString("base64")}`;

    const submitRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "sync/lipsync-2",
        input: { video: photoBase64, audio: audioBase64 },
      }),
    });

    const prediction = await submitRes.json();
    if (!prediction.id) return res.status(500).json({ error: "Failed to start", details: prediction });

    let result = prediction;
    let attempts = 0;
    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 60) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      result = await pollRes.json();
      attempts++;
    }

    if (result.status === "succeeded") {
      return res.json({ success: true, videoUrl: result.output });
    } else {
      return res.status(500).json({ error: "Generation failed", details: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
