import { useState, useRef } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const VOICES = [
  { id: "emeka", name: "Emeka", flag: "🇳🇬", desc: "Nigerian Male · Deep", pitch: 0.8, rate: 0.9, lang: "en-NG" },
  { id: "adaeze", name: "Adaeze", flag: "🇳🇬", desc: "Nigerian Female · Warm", pitch: 1.2, rate: 0.95, lang: "en-NG" },
  { id: "kofi", name: "Kofi", flag: "🇬🇭", desc: "Ghanaian Male · Smooth", pitch: 0.85, rate: 0.9, lang: "en-GH" },
  { id: "marcus", name: "Marcus", flag: "🇺🇸", desc: "American Male · Deep", pitch: 0.75, rate: 0.92, lang: "en-US" },
  { id: "oliver", name: "Oliver", flag: "🇬🇧", desc: "British Male · Sharp", pitch: 0.95, rate: 0.93, lang: "en-GB" },
  { id: "zara", name: "Zara", flag: "🌍", desc: "Female · Inspiring", pitch: 1.1, rate: 0.9, lang: "en-US" },
];

export default function Studio() {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audio, setAudio] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [audioMode, setAudioMode] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [scriptText, setScriptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState("");
  const [replicateKey, setReplicateKey] = useState(localStorage.getItem("replicate_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const photoRef = useRef(null);
  const audioRef = useRef(null);

  const saveKey = (key) => {
    setReplicateKey(key);
    localStorage.setItem("replicate_key", key);
    setShowKeyInput(false);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep(2);
  };

  const handleAudioFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudio(file);
    setAudioURL(URL.createObjectURL(file));
    setAudioName(file.name);
    setStep(3);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudio(new File([blob], "recording.webm", { type: "audio/webm" }));
        setAudioURL(URL.createObjectURL(blob));
        setAudioName("Voice recording (" + recTime + "s)");
        stream.getTracks().forEach(function(t) { t.stop(); });
        setStep(3);
      };
      mr.start(100);
      setIsRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => {
        setRecTime(function(t) {
          if (t >= 9) { stopRec(); return 10; }
          return t + 1;
        });
      }, 1000);
    } catch(e) {
      setError("Microphone blocked. Allow mic access in browser settings.");
    }
  };

  const stopRec = () => {
    if (mediaRef.current) {
      mediaRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const previewVoice = (v) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("We no come this world to suffer. We come to build.");
    u.lang = v.lang;
    u.pitch = v.pitch;
    u.rate = v.rate;
    window.speechSynthesis.speak(u);
  };

  const generate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError("");
    setResultUrl(null);
    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("audio", audio);
      let si = 0;
      const stages = [
        { pct: 20, msg: "Uploading files..." },
        { pct: 40, msg: "Analysing face..." },
        { pct: 60, msg: "Processing audio..." },
        { pct: 80, msg: "Syncing lips..." },
        { pct: 95, msg: "Rendering video..." },
      ];
      const interval = setInterval(() => {
        if (si < stages.length) {
          setProgress(stages[si].pct);
          setProgressMsg(stages[si].msg);
          si++;
        }
      }, 2000);
      const res = await fetch(BACKEND + "/api/lipsync/generate", {
        method: "POST",
        headers: { "x-replicate-key": replicateKey },
        body: formData,
      });
      clearInterval(interval);
      const data = await res.json();
      if (data.success && data.videoUrl) {
        setProgress(100);
        setProgressMsg("Done!");
        setResultUrl(data.videoUrl);
        setStep(4);
      } else {
        setError(data.error || "Generation failed.");
      }
    } catch(e) {
      setError("Connection error. Make sure backend is running.");
    }
    setIsGenerating(false);
  };

  const reset = () => {
    setStep(1);
    setPhoto(null);
    setPhotoPreview(null);
    setAudio(null);
    setAudioURL(null);
    setAudioName("");
    setAudioMode(null);
    setResultUrl(null);
    setError("");
    setProgress(0);
    setProgressMsg("");
    setIsRecording(false);
    setRecTime(0);
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.pageTitle}>Lip Sync Studio</h1>
        <p style={s.pageDesc}>Upload photo + voice and get a talking avatar video</p>

        {!replicateKey && (
          <div style={s.keyBanner} onClick={() => setShowKeyInput(true)}>
            Add Replicate API key for real lip sync
          </div>
        )}

        {showKeyInput && (
          <div style={s.keyBox}>
            <p style={{ color: "#FFD700", fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>Replicate API Token</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="password" id="rkey" defaultValue={replicateKey} placeholder="r8_xxxx" style={s.keyInput} />
              <button style={s.keySaveBtn} onClick={() => saveKey(document.getElementById("rkey").value)}>Save</button>
            </div>
          </div>
        )}

        <div style={s.steps}>
          {["Photo", "Voice", "Generate", "Result"].map((l, i) => (
            <div key={l} style={s.stepItem}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, border: "2px solid #FFD700", background: step > i + 1 ? "#FFD700" : step === i + 1 ? "#FFD700" : "#1A1A1A", color: step >= i + 1 ? "#000" : "#444" }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: step >= i + 1 ? "#FFD700" : "#444", fontWeight: 700, textTransform: "uppercase" }}>{l}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={s.card}>
            <div style={{ fontSize: 48 }}>📸</div>
            <h2 style={s.cardTitle}>Upload Your Photo</h2>
            <p style={s.cardDesc}>Use your AI twin from Leonardo AI for best results.</p>
            <div style={s.uploadZone} onClick={() => photoRef.current && photoRef.current.click()}>
              <span style={{ fontSize: 44 }}>⬆️</span>
              <span style={s.uploadMain}>Tap to choose photo</span>
              <span style={s.uploadSub}>JPG or PNG</span>
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </div>
        )}

        {step === 2 && (
          <div style={s.card}>
            {photoPreview && <img src={photoPreview} alt="" style={s.thumb} />}
            <div style={{ fontSize: 48 }}>🎙️</div>
            <h2 style={s.cardTitle}>Add Your Voice</h2>

            {!audioMode && (
              <div style={s.modeGrid}>
                <button style={s.modeBtn} onClick={() => setAudioMode("record")}>🎙️<br /><strong>Record</strong></button>
                <button style={s.modeBtn} onClick={() => setAudioMode("upload")}>📂<br /><strong>Upload</strong></button>
                <button style={s.modeBtn} onClick={() => setAudioMode("voices")}>🗣️<br /><strong>AI Voices</strong></button>
                <button style={s.modeBtn} onClick={() => setAudioMode("type")}>⌨️<br /><strong>Type Script</strong></button>
              </div>
            )}

            {audioMode === "record" && (
              <div style={s.recBox}>
                <div style={{ fontSize: 56, fontWeight: 900, color: isRecording ? "#FF4444" : "#FFD700" }}>{recTime}s</div>
                {error && <div style={s.err}>{error}</div>}
                {!isRecording
                  ? <button style={s.recBtn} onClick={startRec}>Start Recording</button>
                  : <button style={{ width: "100%", padding: 16, background: "#FF4444", border: "none", borderRadius: 14, color: "#000", fontSize: 16, fontWeight: 800, cursor: "pointer" }} onClick={stopRec}>Stop</button>
                }
                <button style={s.backBtn} onClick={() => { setAudioMode(null); setError(""); }}>Back</button>
              </div>
            )}

            {audioMode === "upload" && (
              <div style={s.recBox}>
                <div style={s.uploadZone} onClick={() => audioRef.current && audioRef.current.click()}>
                  <span style={{ fontSize: 36 }}>🎵</span>
                  <span style={s.uploadMain}>Upload audio file</span>
                  <span style={s.uploadSub}>MP3 or WAV</span>
                </div>
                <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioFile} />
                <button style={s.backBtn} onClick={() => setAudioMode(null)}>Back</button>
              </div>
            )}

            {audioMode === "voices" && (
              <div style={{ width: "100%" }}>
                {VOICES.map(function(v) {
                  return (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", marginBottom: 8, border: selectedVoice && selectedVoice.id === v.id ? "1px solid #FFD700" : "1px solid #1A1A1A", background: selectedVoice && selectedVoice.id === v.id ? "#1A1200" : "#0D0D0D" }} onClick={() => setSelectedVoice(v)}>
                      <span style={{ fontSize: 24 }}>{v.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#F5F0E8", fontSize: 14 }}>{v.name}</div>
                        <div style={{ color: "#666", fontSize: 11 }}>{v.desc}</div>
                      </div>
                      <button style={s.playBtn} onClick={function(e) { e.stopPropagation(); previewVoice(v); }}>▶</button>
                    </div>
                  );
                })}
                <button style={{ width: "100%", padding: 18, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 16, color: "#000", fontSize: 16, fontWeight: 900, cursor: "pointer", opacity: selectedVoice ? 1 : 0.4 }} disabled={!selectedVoice} onClick={() => {
                  if (selectedVoice) {
                    setAudio("voice_catalog");
                    setAudioName(selectedVoice.flag + " " + selectedVoice.name);
                    setStep(3);
                  }
                }}>
                  Use {selectedVoice ? selectedVoice.name : "Selected Voice"}
                </button>
                <button style={s.backBtn} onClick={() => { setAudioMode(null); setSelectedVoice(null); }}>Back</button>
              </div>
            )}

            {audioMode === "type" && (
              <div style={{ width: "100%" }}>
                {VOICES.slice(0, 3).map(function(v) {
                  return (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", marginBottom: 8, border: selectedVoice && selectedVoice.id === v.id ? "1px solid #FFD700" : "1px solid #1A1A1A" }} onClick={() => setSelectedVoice(v)}>
                      <span>{v.flag}</span>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: "#F5F0E8" }}>{v.name}</span>
                      <button style={s.playBtn} onClick={function(e) { e.stopPropagation(); previewVoice(v); }}>▶</button>
                    </div>
                  );
                })}
                <textarea style={s.scriptArea} placeholder="Type your script here..." value={scriptText} onChange={function(e) { setScriptText(e.target.value); }} rows={4} />
                <button style={{ width: "100%", padding: 18, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 16, color: "#000", fontSize: 16, fontWeight: 900, cursor: "pointer", marginTop: 10, opacity: selectedVoice && scriptText ? 1 : 0.4 }} onClick={() => {
                  if (selectedVoice && scriptText) {
                    setAudio("tts");
                    setAudioName(selectedVoice.flag + " " + selectedVoice.name + " TTS");
                    setStep(3);
                  }
                }}>
                  Continue
                </button>
                <button style={s.backBtn} onClick={() => { setAudioMode(null); setSelectedVoice(null); setScriptText(""); }}>Back</button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "#0D0D0D", borderRadius: 12, padding: 14 }}>
              {photoPreview && <img src={photoPreview} alt="" style={s.summaryImg} />}
              <div>
                <div style={s.summaryItem}>Photo ready</div>
                <div style={s.summaryItem}>{audioName}</div>
                <div style={s.summaryItem}>{replicateKey ? "API key active" : "No API key"}</div>
              </div>
            </div>
            {audioURL && (
              <div style={{ width: "100%", background: "#0D0D0D", borderRadius: 12, padding: 12 }}>
                <audio controls src={audioURL} style={{ width: "100%" }} />
              </div>
            )}
            <h2 style={s.cardTitle}>Ready to Generate!</h2>
            {isGenerating ? (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                <div style={{ width: "100%", height: 8, background: "#1A1A1A", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg,#FFD700,#FF8C00)", borderRadius: 99, width: progress + "%", transition: "width 0.4s" }} />
                </div>
                <span style={{ color: "#FFD700", fontSize: 14, fontWeight: 700 }}>{progress}% {progressMsg}</span>
              </div>
            ) : (
              <button style={s.genBtn} onClick={generate}>Generate Lip Sync Video</button>
            )}
            {error && <div style={s.err}>{error}</div>}
          </div>
        )}

        {step === 4 && (
          <div style={s.card}>
            <div style={{ fontSize: 48 }}>🎉</div>
            <h2 style={s.cardTitle}>Your Video is Ready!</h2>
            <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", border: "2px solid #FFD700" }}>
              {resultUrl ? (
                <video src={resultUrl} controls autoPlay style={{ width: "100%" }} />
              ) : (
                <div style={{ position: "relative" }}>
                  {photoPreview && <img src={photoPreview} alt="" style={{ width: "100%", opacity: 0.7 }} />}
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#00000077" }}>
                    <span style={{ fontSize: 48 }}>▶️</span>
                    <span style={{ color: "#FFD700", fontSize: 12, fontWeight: 700 }}>
                      {replicateKey ? "Video Ready!" : "Add API key for real video"}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <a href={resultUrl || photoPreview} download="BillionsAI.mp4" style={{ width: "100%", textDecoration: "none" }}>
              <button style={s.dlBtn}>Download Video</button>
            </a>
            <button style={s.shareBtn} onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "BillionsAI", url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
              }
            }}>
              Share
            </button>
            <button style={{ width: "100%", padding: 14, background: "none", border: "1px solid #FFD700", borderRadius: 14, color: "#FFD700", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={reset}>
              New Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", justifyContent: "center", padding: "20px 16px 40px" },
  container: { width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 },
  pageTitle: { fontSize: 26, fontWeight: 900, color: "#F5F0E8", textAlign: "center" },
  pageDesc: { color: "#666", fontSize: 14, textAlign: "center" },
  keyBanner: { background: "#1A1200", border: "1px solid #FFD70033", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#AAA", cursor: "pointer" },
  keyBox: { background: "#111", border: "1px solid #FFD700", borderRadius: 14, padding: 16 },
  keyInput: { flex: 1, background: "#0A0A0A", border: "1px solid #333", borderRadius: 8, color: "#F5F0E8", padding: "10px 12px", fontSize: 13, outline: "none" },
  keySaveBtn: { background: "#FFD700", border: "none", borderRadius: 8, color: "#000", fontWeight: 800, padding: "0 16px", cursor: "pointer" },
  steps: { display: "flex", gap: 4 },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 5 },
  card: { background: "#111", borderRadius: 20, padding: 20, border: "1px solid #1A1A1A", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  cardTitle: { fontSize: 22, fontWeight: 800, color: "#F5F0E8", margin: 0, textAlign: "center" },
  cardDesc: { color: "#666", fontSize: 13, textAlign: "center", lineHeight: 1.6 },
  uploadZone: { width: "100%", border: "2px dashed #FFD700", borderRadius: 14, padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", background: "#0D0D00" },
  uploadMain: { color: "#FFD700", fontWeight: 700, fontSize: 16 },
  uploadSub: { color: "#444", fontSize: 12 },
  thumb: { width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "2px solid #FFD700" },
  modeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" },
  modeBtn: { background: "#0D0D0D", border: "1px solid #2A2A2A", borderRadius: 14, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", color: "#F5F0E8", fontSize: 22 },
  recBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" },
  recBtn: { width: "100%", padding: 16, background: "#FFD700", border: "none", borderRadius: 14, color: "#000", fontSize: 16, fontWeight: 800, cursor: "pointer" },
  backBtn: { background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" },
  playBtn: { background: "#FFD700", border: "none", borderRadius: 8, width: 34, height: 34, fontSize: 13, cursor: "pointer", fontWeight: 800 },
  scriptArea: { width: "100%", background: "#0D0D0D", border: "1px solid #2A2A2A", borderRadius: 12, color: "#F5F0E8", padding: 12, fontSize: 13, lineHeight: 1.6, outline: "none", resize: "vertical" },
  summaryImg: { width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "2px solid #FFD700" },
  summaryItem: { color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 4 },
  genBtn: { width: "100%", padding: 18, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 16, color: "#000", fontSize: 16, fontWeight: 900, cursor: "pointer" },
  err: { background: "#1A0000", border: "1px solid #FF4444", borderRadius: 10, padding: "10px 14px", color: "#FF8888", fontSize: 13, width: "100%", textAlign: "center" },
  dlBtn: { width: "100%", padding: 16, background: "linear-gradient(135deg,#FFD700,#FF8C00)", border: "none", borderRadius: 14, color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer" },
  shareBtn: { width: "100%", padding: 14, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 14, color: "#F5F0E8", fontSize: 14, fontWeight: 700, cursor: "pointer" },
};
