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

  const saveKey = (key) => { setReplicateKey(key); localStorage.setItem("replicate_key", key); setShowKeyInput(false); };

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
        setAudioName(`Voice recording (${recTime}s)`);
        stream.getTracks().forEach(t => t.stop());
        setStep(3);
      };
      mr.start(100);
      setIsRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => {
        setRecTime(t => { if (t >= 9) { stopRec(); return 10; } return t + 1; });
      }, 1000);
    } catch { setError("❌ Microphone blocked. Allow mic access in browser settings."); }
  };

  const stopRec = () => {
    if (mediaRef.current) { mediaRef.current.stop(); setIsRecording(false); clearInterval(timerRef.current); }
  };

  const previewVoice = (v) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("We no come this world to suffer. We come to build.");
    u.lang = v.lang; u.pitch = v.pitch; u.rate = v.rate;
    window.speechSynthesis.speak(u);
  };

  const generate = async () => {
    setIsGenerating(true); setProgress(0); setError(""); setResultUrl(null);
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
        if (si < stages.length) { setProgress(stages[si].pct); setProgressMsg(stages[si].msg); si++; }
      }, 2000);
      const res = await fetch(`${BACKEND}/api/lipsync/generate`, {
        method: "POST",
        headers: { "x-replicate-key": replicateKey },
        body: formData,
      });
      clearInterval(interval);
      const data = await res.json();
      if (data.success && data.videoUrl) {
        setProgress(100); setProgressMsg("Done! 🎉");
        setResultUrl(data.videoUrl); setStep(4);
      } else { setError(data.error || "Generation failed."); }
    } catch { setError("Connection error. Make sure backend is running."); }
    finally { setIsGenerating(false); }
  };

  const reset = () => {
    setStep(1); setPhoto(null); setPhotoPreview(null);
    setAudio(null); setAudioURL(null); setAudioName("");
    setAudioMode(null); setResultUrl(null); setError("");
    setProgress(0); setProgressMsg(""); setIsRecording(false); setRecTime(0);
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.pageTitle}>🎬 Lip Sync Studio</h1>
        <p style={s.pageDesc}>Upload photo + voice → Get a talking avatar video</p>

        {!replicateKey && (
          <div style={s.keyBanner} onClick={() => setShowKeyInput(true)}>
            🔑 Add Replicate API key for real lip sync
            <span style={{ color: "#FFD700", marginLeft: 8 }}>Add Key →</span>
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
              <div style={{ ...s.stepDot, background: step > i + 1 ? "#FFD700" : step === i + 1 ? "#FFD700" : "#1A1A1A", color: step >= i + 1 ? "#000" : "#444" }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: step >= i + 1 ? "#FFD700" : "#444", fontWeight: 700, textTransform: "uppercase" }}>{l}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={s.card}>
            <div style={s.emoji}>📸</div>
            <h2 style={s.cardTitle}>Upload Your Photo</h2>
            <p style={s.cardDesc}>Use your AI twin from Leonardo AI for best results.</p>
            <div style={s.uploadZone} onClick={() => photoRef.current?.click()}>
              <span style={{ fontSize: 44 }}>⬆️</span>
              <span style={s.uploadMain}>Tap to choose photo</span>
              <span style={s.uploadSub}>JPG or PNG · Clear face</span>
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </div>
        )}

        {step === 2 && (
          <div style={s.card}>
            {photoPreview && <img src={photoPreview} alt="" style={s.thumb} />}
            <div style={s.emoji}>🎙️</div>
            <h2 style={s.cardTitle}>Add Your Voice</h2>
            {!audioMode && (
              <div style={s.modeGrid}>
                <button style={s.modeBtn} onClick={() => set
