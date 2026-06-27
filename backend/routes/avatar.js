const express = require("express");
const router = express.Router();
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

router.post("/create-room", async (req, res) => {
  try {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) return res.status(400).json({ error: "Daily.co API key required" });

    const { roomName = `billions-${Date.now()}` } = req.body;

    const roomRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    });

    const room = await roomRes.json();
    if (!room.url) return res.status(500).json({ error: "Room creation failed" });

    res.json({ success: true, roomUrl: room.url, roomName: room.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/generate-talking", async (req, res) => {
  try {
    const apiKey = process.env.DID_API_KEY;
    if (!apiKey) return res.status(400).json({ error: "D-ID API key required" });

    const { imageUrl, text, voiceId } = req.body;
    if (!imageUrl || !text) return res.status(400).json({ error: "imageUrl and text required" });

    const submitRes = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: imageUrl,
        script: {
          type: "text",
          input: text,
          provider: {
            type: "elevenlabs",
            voice_id: voiceId || "21m00Tcm4TlvDq8ikWAM",
          },
        },
        config: { fluent: true },
      }),
    });

    const talk = await submitRes.json();
    if (!talk.id) return res.status(500).json({ error: "Failed to start avatar generation" });

    let result = talk;
    let attempts = 0;
    while (result.status !== "done" && result.status !== "error" && attempts < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.d-id.com/talks/${result.id}`, {
        headers: { Authorization: `Basic ${apiKey}` },
      });
      result = await pollRes.json();
      attempts++;
    }

    if (result.status === "done") {
      return res.json({ success: true, videoUrl: result.result_url });
    } else {
      return res.status(500).json({ error: "Avatar generation failed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
