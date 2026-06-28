import { useState, useRef } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function VoiceClone() {
  const [mode, setMode] = useState(null);
  const [audio, setAudio] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [voiceName, setVoiceName] = useState("My Cloned Voice");
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState(null);
  const [scriptText, setScriptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultAudioUrl, setResultAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [elevenKey, setElevenKey] = useState(localStorage.getItem("eleven_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const saveKey = (key) => { setElevenKey(key); localStorage.setItem("eleven_key", key); setShowKeyInput(false); };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudio(file); setAudioURL(URL.createObjectURL(file)); setAudioName(file.name);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudio(file); setAudioURL(URL.createObjectURL(file));
    setAudioName(`Audio from: ${file.name}`);
    setSuccess("✅ Video uploaded! Audio will be extracted and cloned.");
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudio(new File([blob], "sample.webm", { type: "audio/webm" }));
        setAudioURL(URL.createObjectURL(blob));
        setAudioName(`Voice sample (${recTime}s)`);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100); setIsRecording(true); setRecTime(0);
      timerRef.current = setInterval(() => {
        setRecTime(t => { if (t >= 59) { stopRec(); return 60; } return t + 1; });
      }, 1000);
    } catch { setError("❌ Microphone blocked."); }
  };

  const stopRec = () => {
    if (mediaRef.current) { mediaRef.current.stop(); setIsRecording(false); clearInterval(timerRef.current); }
  };

  const cloneVoice = async () => {
    if (!audio) { setError("Provide an audio sample first."); return; }
    if (!elevenKey) { setError("ElevenLabs API key required."); return; }
    setIsCloning(true); setError(""); setSuccess("");
    try {
      const formData = new FormData();
      formData.append("audio", audio);
      formData.append("voiceName", voiceName);
      const res = await fetch(`${BACKEND}/api/voiceclone/clone`, {
        method: "POST",
        headers: { "x-elevenlabs-key": elevenKey },
        body: formData,
      });
      const data = await res.json();
      if (data.success) { setClonedVoiceId(data.voiceId); setSuccess(`✅ Voice cloned! "${voiceName}" is ready.`); }
      else { setError(data.error || "Cloning failed."); }
    } catch { setError("Connection error."); }
    finally { setIsCloning(false); }
  };

  const generateSpeech = async () => {
    if (!scriptText) { setError("Type a script first."); return; }
    if (!clonedVoiceId) { setError("Clone a voice first."); return; }
    setIsGenerating(true); setError("");
    try {
      const res = await fetch(`${BACKEND}/api/voiceclone/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-elevenlabs-key": elevenKey },
        body: JSON.stringify({ text: scriptText, voiceId: clonedVoiceId }),
      });
      if (!res.ok) throw new Error("Speech generation failed");
      const blob = await res.blob();
      setResultAudioUrl(URL.createObjectURL(blob));
    } catch (err) { setError(err.message); }
    finally { setIsGenerating(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>🎙️ Voice Cloning</h1>
        <p style={s.desc}>Clone any voice from audio or video. Make it speak any script.</p>

        {!elevenKey
          ? <div style={s.keyBanner} onClick={() => setShowKeyInput(true)}>🔑 Add ElevenLabs API key<span style={{ color: "#FFD700", marginLeft: 8 }}>Add Key →</span></div>
          : <div style={{ ...s.keyBanner, background: "#0D1A0D", borderColor: "#00C89633" }}>✅ ElevenLabs connected · <span style={{ color: "#FFD700", cursor: "pointer" }} onClick={() => setShowKeyInput(true)}>Change</span></div>
        }
        {showKeyInput && (
          <div style={s.keyBox}>
            <p style={{ color: "#FFD700", fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>ElevenLabs API Key</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="password" id="ekey" defaultValue={elevenKey} placeholder="sk_xxxx" style={s.keyInput} />
              <button style={s.keySaveBtn} onClick={() => saveKey(document.getElementById("ekey").value)}>Save</button>
            </div>
          </div>
        )}

        <div style={s.card}>
          <h2 style={s.cardTitle}>Step 1 — Voice Sample</h2>
          <p style={s.cardDesc}>Min 30 seconds for best clone quality.</p>
          {!mode && (
            <div style={s.modeGrid}>
              <button style={s.modeBtn} onClick={() => setMode("record")}>🎙️<br /><strong>Record</strong><br /><span style={s.modeSub}>Up to 60s</span></button>
              <button style={s.modeBtn} onClick={() => setMode("upload")}>📂<br /><strong>Upload Audio</strong><br /><span style={s.modeSub}>MP3, WAV</span></button>
              <button style={s.modeBtn} onClick={() => setMode("video")}>🎬<br /><strong>From Video</strong><br /><span style={s.modeSub}>Clone from video</span></button>
            </div>
          )}
          {mode === "record" && (
            <div style={s.recBox}>
              <div style={{ fontSize: 56, fontWeight: 900, color: isRecording ? "#FF4444" : "#FFD700" }}>{recTime}s<span style={{ fontSize: 14, color: "#555" }}> / 60s</span></div>
              {!isRecording
                ? <button style={s.recBtn} onClick={startRec}>● Start Recording</button>
                : <button style={{ ...s.recBtn, background: "#FF4444" }} onClick={stopRec}>■ Stop</button>}
              {audioURL && <audio controls src={audioURL} style={{ width: "100%" }} />}
              <button style={s.backBtn} onClick={() => setMode(null)}>← Back</button>
            </div>
          )}
          {mode === "upload" && (
            <div style={s.recBox}>
              <div style={s.uploadZone} onClick={() => audioRef.current?.click()}>
                <span style={{ fontSize: 36 }}>🎵</span>
                <span style={s.uploadMain}>Upload audio</span>
                <span style={s.uploadSub}>MP3 · WAV · Min 30 seconds</span>
              </div>
              <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioUpload} />
              {audioURL && <audio controls src={audioURL} style={{ width: "100%" }} />}
              <button style={s.backBtn} onClick={() => setMode(null)}>← Back</button>
            </div>
          )}
          {mode === "video" && (
            <div style={s.recBox}>
              <div style={s.uploadZone} onClick={() => videoRef.current?.click()}>
                <span style={{ fontSize: 36 }}>🎬</span>
                <span style={s.uploadMain}>Upload video</span>
                <span style={s.uploadSub}>Voice extracted automatically</span>
              </div>
              <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} />
              {audioURL && <video controls src={audioURL} style={{ width: "100%", borderRadius: 10, maxHeight: 200 }} />}
              <button style={s.backBtn} onClick={() => setMode(null)}>← Back</button>
            </div>
          )}
        </div>

        {audio && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Step 2 — Name & Clone</h2>
            <input style={s.nameInput} placeholder="Name your cloned voice..." value={voiceName} onChange={e => setVoiceName(e.target.value)} />
            {error && <div style={s.err}>{error}</div>}
            {success && <div style={s.successBox}>{success}</div>}
            <button style={s.genBtn} onClick={cloneVoice} disabled={isCloning}>
              {isCloning ? "⏳ Cloning..." : "🧬 Clone This Voice"}
            </button>
          </div>
        )}

        {clonedVoiceId && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Step 3 — Make It Speak</h2>
            <textarea style={s.scriptArea} placeholder="Type any script..." value={scriptText} onChange={e => setScriptText(e.target.value)} rows={5} />
            <button style={s.genBtn} onClick={generateSpeech} disabled={isGenerating}>
              {isGenerating ? "⏳ Generating..." : "🔊 Generate Speech"}
            </button>
            {resultAudioUrl && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "#FFD700", fontWeight: 700, fontSize: 14 }}>🎉 Your cloned voice:</p>
                <audio controls src={resultAudioUrl} style={{ width: "100%" }} />
                <a href={resultAudioUrl} download="BillionsAI_voice.mp3" style={{ width: "100%", textDecoration: "none" }}>
                  <button style={s.dlBtn}>⬇️ Download Audio</button>
                </a>
              </div>
            )}
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
  keyInput: { flex: 1, background: "#0A0A0A", border: "1px solid #333", borderRadius: 8, color: "#F5F0E8", padding: "10px 12px", fontSize: 13, outline: "none" },
  keySaveBtn: { background: "#FFD700", border: "none", borderRadius: 8, color: "#000", fontWeight: 800, padding: "0 16px", cursor: "pointer" },
  card: { background: "#111", borderRadius: 20, padding: 20, border: "1px solid #1A1A1A", display: "flex", flexDirection: "column", gap: 14 },
  cardTitle: { fontSize: 18, fontWeight: 800, color: "#F5F0E8", margin: 0 },
  cardDesc: { color: "#666", fontSize: 13, lineHeight: 1.6 },
  modeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  modeBtn: { background: "#0D0D0D", border: "1px solid #2A2A2A", borderRadius: 14, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", color: "#F5F0E8", fontSize: 20, textAlign: "center" },
  modeSub: { fontSize: 10, color: "#555", fontWeight: 400 },
  recBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" },
  recBtn: { width: "100%", padding: 16, background: "#FFD700", border: "none", borderRadius: 14, color: "#000", fontSize: 16, fontWeight: 800, cursor: "pointer" },
  backBtn: { background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" },
  uploadZone: { width: "100%", border: "2px dashed #FFD700", borderRadius: 14, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", background: "#0D0D00" },
  uploadMain: { color: "#FFD700", fontWeight: 700, fontSize: 15 },
  uploadSub: { color: "#444", fontSize: 12 },
  nameInput: { width: "100%", background: "#0A0A0A", border: "1px solid #333", borderRadius: 10, color: "#F5F0E8", padding: "12px 14px", fontSize: 14, outline: "none" },
  genBtn: { width: "100%", padding: 16, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 14, color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer" },
  err: { background: "#1A0000", border: "1px solid #FF4444", borderRadius: 10, padding: "10px 14px", color: "#FF8888", fontSize: 13, textAlign: "center" },
  successBox: { background: "#0D1A0D", border: "1px solid #00C896", borderRadius: 10, padding: "10px 14px", color: "#00C896", fontSize: 13 },
  scriptArea: { width: "100%", background: "#0D0D0D", border: "1px solid #2A2A2A", borderRadius: 12, color: "#F5F0E8", padding: 12, fontSize: 13, lineHeight: 1.6, outline: "none", resize: "vertical" },
  dlBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 12, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" },
};
