import { useState } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function LiveAvatar() {
  const [mode, setMode] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [scriptText, setScriptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultVideoUrl, setResultVideoUrl] = useState(null);
  const [liveRoomUrl, setLiveRoomUrl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [didKey, setDidKey] = useState(localStorage.getItem("did_key") || "");
  const [dailyKey, setDailyKey] = useState(localStorage.getItem("daily_key") || "");
  const [showKeys, setShowKeys] = useState(false);
  const imageRef = { current: null };

  const saveKeys = () => {
    localStorage.setItem("did_key", didKey);
    localStorage.setItem("daily_key", dailyKey);
    setShowKeys(false);
    setSuccess("✅ API keys saved!");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const generateTalkingAvatar = async () => {
    if (!imagePreview || !scriptText) { setError("Upload an image and type a script."); return; }
    setIsGenerating(true); setError(""); setResultVideoUrl(null);
    try {
      const res = await fetch(`${BACKEND}/api/avatar/generate-talking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imagePreview, text: scriptText }),
      });
      const data = await res.json();
      if (data.success) { setResultVideoUrl(data.videoUrl); setSuccess("🎉 Talking avatar ready!"); }
      else { setError(data.error || "Generation failed."); }
    } catch { setError("Connection error. Make sure backend is running."); }
    finally { setIsGenerating(false); }
  };

  const createLiveRoom = async () => {
    setIsGenerating(true); setError("");
    try {
      const res = await fetch(`${BACKEND}/api/avatar/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `billions-${Date.now()}` }),
      });
      const data = await res.json();
      if (data.success) { setLiveRoomUrl(data.roomUrl); setSuccess("🎉 Live room created!"); }
      else { setError(data.error || "Room creation failed."); }
    } catch { setError("Connection error."); }
    finally { setIsGenerating(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>📹 Live Avatar</h1>
        <p style={s.desc}>Make your AI avatar speak and move in real-time.</p>

        <div style={s.keyBanner} onClick={() => setShowKeys(!showKeys)}>
          🔑 {didKey && dailyKey ? "API keys connected ✅" : "Add API keys for live features"}
          <span style={{ color: "#FFD700", marginLeft: 8 }}>{showKeys ? "▲" : "▼"}</span>
        </div>

        {showKeys && (
          <div style={s.keyBox}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <label style={{ color: "#FFD700", fontSize: 12, fontWeight: 700 }}>D-ID Key (Talking Avatar)</label>
              <input type="password" value={didKey} onChange={e => setDidKey(e.target.value)} placeholder="D-ID API key" style={s.keyInput} />
              <span style={{ color: "#444", fontSize: 10 }}>d-id.com/account-settings</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <label style={{ color: "#FFD700", fontSize: 12, fontWeight: 700 }}>Daily.co Key (Live Calls)</label>
              <input type="password" value={dailyKey} onChange={e => setDailyKey(e.target.value)} placeholder="Daily.co API key" style={s.keyInput} />
              <span style={{ color: "#444", fontSize: 10 }}>dashboard.daily.co/developers</span>
            </div>
            <button style={s.keySaveBtn} onClick={saveKeys}>Save Keys</button>
          </div>
        )}

        {success && <div style={s.successBox}>{success}</div>}
        {error && <div style={s.err}>{error}</div>}

        {!mode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={s.modeCard} onClick={() => setMode("talking")}>
              <span style={{ fontSize: 52 }}>🗣️</span>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#F5F0E8", margin: 0 }}>Talking Avatar Video</h3>
              <p style={{ color: "#777", fontSize: 13, lineHeight: 1.6 }}>Upload your AI twin + type a script. Avatar speaks and moves in a generated video.</p>
              <div style={s.modeTag}>Powered by D-ID</div>
              <button style={s.modeBtn}>Create Talking Video →</button>
            </div>

            <div style={s.modeCard} onClick={() => setMode("live-call")}>
              <span style={{ fontSize: 52 }}>📹</span>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#F5F0E8", margin: 0 }}>Live Avatar Call</h3>
              <p style={{ color: "#777", fontSize: 13, lineHeight: 1.6 }}>Your AI avatar appears in real-time video calls. Perfect for live content.</p>
              <div style={{ ...s.modeTag, background: "#0D1A0D", color: "#00C896", border: "1px solid #00C89633" }}>Powered by Daily.co</div>
              <button style={{ ...s.modeBtn, background: "#00C896" }}>Start Live Call →</button>
            </div>
          </div>
        )}

        {mode === "talking" && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>🗣️ Talking Avatar Video</h2>
            <div style={s.uploadZone} onClick={() => document.getElementById("avatarImg")?.click()}>
              {imagePreview
                ? <img src={imagePreview} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "cover" }} />
                : <><span style={{ fontSize: 40 }}>📸</span><span style={s.uploadMain}>Upload AI twin photo</span><span style={s.uploadSub}>Clear front-facing face</span></>}
            </div>
            <input id="avatarImg" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
            <textarea style={s.scriptArea} placeholder="Type what your avatar will say..." value={scriptText} onChange={e => setScriptText(e.target.value)} rows={5} />
            {isGenerating
              ? <div style={{ textAlign: "center", padding: 20 }}><span style={{ fontSize: 36 }}>⚡</span><p style={{ color: "#FFD700", fontWeight: 700 }}>Generating avatar...</p></div>
              : <button style={s.genBtn} onClick={generateTalkingAvatar}>🎬 Generate Talking Avatar</button>}
            {resultVideoUrl && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                <video src={resultVideoUrl} controls autoPlay style={{ width: "100%", borderRadius: 14, border: "2px solid #FFD700" }} />
                <a href={resultVideoUrl} download="BillionsAI_avatar.mp4" style={{ width: "100%", textDecoration: "none" }}>
                  <button style={s.dlBtn}>⬇️ Download Video</button>
                </a>
              </div>
            )}
            <button style={s.backBtn} onClick={() => { setMode(null); setResultVideoUrl(null); setError(""); setSuccess(""); }}>← Back</button>
          </div>
        )}

        {mode === "live-call" && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>📹 Live Avatar Call</h2>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6 }}>Create a live room where your AI avatar appears in real-time.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              {[["🎭","Your AI twin face on camera"],["🎙️","Your voice plays live"],["🔴","Real-time lip sync"],["🔗","Share room link with anyone"]].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, background: "#0D0D0D", borderRadius: 10, padding: "10px 14px" }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ color: "#AAA", fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>
            {isGenerating
              ? <div style={{ textAlign: "center", padding: 20 }}><span style={{ fontSize: 36 }}>⚡</span><p style={{ color: "#00C896", fontWeight: 700 }}>Creating room...</p></div>
              : <button style={{ ...s.genBtn, background: "#00C896" }} onClick={createLiveRoom}>📹 Create Live Room</button>}
            {liveRoomUrl && (
              <div style={{ width: "100%", background: "#0D1A0D", borderRadius: 14, padding: 16, border: "1px solid #00C89633", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "#00C896", fontWeight: 700, fontSize: 14 }}>🎉 Your live room is ready!</p>
                <div style={{ background: "#0A0A0A", borderRadius: 8, padding: "10px 12px", color: "#00C896", fontSize: 12, wordBreak: "break-all" }}>{liveRoomUrl}</div>
                <button style={{ width: "100%", padding: 12, background: "#1A2A1A", border: "1px solid #00C896", borderRadius: 10, color: "#00C896", fontSize: 13, fontWeight: 700, cursor: "pointer" }} onClick={() => { navigator.clipboard.writeText(liveRoomUrl); alert("Copied!"); }}>📋 Copy Room Link</button>
                <a href={liveRoomUrl} target="_blank" rel="noreferrer" style={{ width: "100%", textDecoration: "none" }}>
                  <button style={{ ...s.genBtn, background: "#00C896" }}>🚀 Enter Live Room</button>
                </a>
              </div>
            )}
            <button style={s.backBtn} onClick={() => { setMode(null); setLiveRoomUrl(null); setError(""); setSuccess(""); }}>← Back</button>
          </div>
        )}

        {!mode && (
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #1A1A1A" }}>
            <h3 style={{ color: "#FFD700", fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>🚀 Coming Soon</h3>
            {[["🤖","AI Autopilot","Avatar responds using AI automatically"],["📺","Live Stream","Go live on TikTok & YouTube as your avatar"],["🌍","Multi-language","Switch languages mid-video"]].map(([icon,title,desc]) => (
              <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #1A1A1A" }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div><div style={{ fontWeight: 700, color: "#F5F0E8", fontSize: 13 }}>{title}</div><div style={{ color: "#555", fontSize: 12 }}>{desc}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", justifyContent: "center", padding: "20px 16px 40px" },
  container: { width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 },
  title: { fontSize: 26, fontWeight: 900, color: "#F5F0E8", textAlign: "center" },
  desc: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 1.6 },
  keyBanner: { background: "#1A1200", border: "1px solid #FFD70033", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#AAA", cursor: "pointer", display: "flex", justifyContent: "space-between" },
  keyBox: { background: "#111", border: "1px solid #FFD700", borderRadius: 14, padding: 16 },
  keyInput: { background: "#0A0A0A", border: "1px solid #333", borderRadius: 8, color: "#F5F0E8", padding: "10px 12px", fontSize: 13, outline: "none" },
  keySaveBtn: { width: "100%", padding: 12, background: "#FFD700", border: "none", borderRadius: 10, color: "#000", fontWeight: 800, cursor: "pointer", fontSize: 14 },
  successBox: { background: "#0D1A0D", border: "1px solid #00C896", borderRadius: 10, padding: "10px 14px", color: "#00C896", fontSize: 13 },
  err: { background: "#1A0000", border: "1px solid #FF4444", borderRadius: 10, padding: "10px 14px", color: "#FF8888", fontSize: 13 },
  modeCard: { background: "#111", border: "1px solid #1A1A1A", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" },
  modeTag: { alignSelf: "flex-start", background: "#1A1200", color: "#FFD700", border: "1px solid #FFD70033", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 },
  modeBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 12, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" },
  card: { background: "#111", borderRadius: 20, padding: 20, border: "1px solid #1A1A1A", display: "flex", flexDirection: "column", gap: 14 },
  cardTitle: { fontSize: 20, fontWeight: 800, color: "#F5F0E8", margin: 0 },
  uploadZone: { width: "100%", border: "2px dashed #FFD700", borderRadius: 14, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", background: "#0D0D00", overflow: "hidden" },
  uploadMain: { color: "#FFD700", fontWeight: 700, fontSize: 15 },
  uploadSub: { color: "#444", fontSize: 12 },
  scriptArea: { width: "100%", background: "#0D0D0D", border: "1px solid #2A2A2A", borderRadius: 12, color: "#F5F0E8", padding: 12, fontSize: 13, lineHeight: 1.6, outline: "none", resize: "vertical" },
  genBtn: { width: "100%", padding: 16, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 14, color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer" },
  dlBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 12, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" },
  backBtn: { background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" },
};
