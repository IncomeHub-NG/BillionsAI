import { Link } from "react-router-dom";

const features = [
  { icon: "🎬", title: "Lip Sync Studio", desc: "Upload your AI twin photo + voice. Watch your avatar speak with perfect lip sync.", link: "/studio", btn: "Open Studio", color: "#FFD700" },
  { icon: "🎙️", title: "Voice Cloning", desc: "Clone any voice from audio or video sample. Speak any script in that voice.", link: "/voice-clone", btn: "Clone Voice", color: "#FF8C00" },
  { icon: "📹", title: "Live Avatar Calls", desc: "Your AI avatar speaks and moves in real-time video calls.", link: "/live-avatar", btn: "Go Live", color: "#00C896" },
];

export default function Home() {
  return (
    <div style={s.page}>
      <section style={s.hero}>
        <div style={s.heroTag}>👑 Built by Papi-Billions · Nigeria to the World 🇳🇬</div>
        <h1 style={s.heroTitle}>Turn Any Photo Into a<br /><span style={{ color: "#FFD700" }}>Talking AI Avatar</span></h1>
        <p style={s.heroDesc}>Lip sync. Voice cloning. Live avatar video calls. No studio required.</p>
        <div style={s.heroBtns}>
          <Link to="/studio" style={s.primaryBtn}>🎬 Start Creating Free</Link>
          <Link to="/voice-clone" style={s.secondaryBtn}>🎙️ Clone Your Voice</Link>
        </div>
      </section>

      <section style={s.features}>
        <h2 style={s.sectionTitle}>Everything You Need</h2>
        <div style={s.featureGrid}>
          {features.map(f => (
            <div key={f.title} style={s.featureCard}>
              <span style={{ fontSize: 48 }}>{f.icon}</span>
              <h3 style={{ ...s.featureTitle, color: f.color }}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
              <Link to={f.link} style={{ ...s.featureBtn, background: f.color }}>{f.btn} →</Link>
            </div>
          ))}
        </div>
      </section>

      <section style={s.howItWorks}>
        <h2 style={s.sectionTitle}>How It Works</h2>
        <div style={s.steps}>
          {[
            ["1", "Upload Photo", "Use your AI twin from Leonardo AI"],
            ["2", "Add Voice", "Record, upload, or clone any voice"],
            ["3", "Generate", "AI syncs lips to voice in seconds"],
            ["4", "Download & Post", "Share to TikTok, Instagram & YouTube"],
          ].map(([num, title, desc]) => (
            <div key={num} style={s.step}>
              <div style={s.stepNum}>{num}</div>
              <strong style={{ color: "#F5F0E8", fontSize: 14 }}>{title}</strong>
              <span style={{ color: "#666", fontSize: 12 }}>{desc}</span>
            </div>
          ))}
        </div>
      </section>

      <footer style={s.footer}>
        <span style={{ color: "#FFD700", fontWeight: 800 }}>BillionsAI</span> © 2026 — Built by Papi-Billions 👑🇳🇬
      </footer>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh" },
  hero: { width: "100%", maxWidth: 600, padding: "48px 20px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  heroTag: { background: "#1A1200", border: "1px solid #FFD70033", borderRadius: 99, padding: "6px 16px", fontSize: 12, color: "#FFD700", fontWeight: 700 },
  heroTitle: { fontSize: 36, fontWeight: 900, lineHeight: 1.2, color: "#F5F0E8" },
  heroDesc: { color: "#777", fontSize: 15, lineHeight: 1.7 },
  heroBtns: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 },
  primaryBtn: { background: "linear-gradient(135deg,#FFD700,#FF8C00)", color: "#000", padding: "14px 24px", borderRadius: 14, textDecoration: "none", fontWeight: 800, fontSize: 15 },
  secondaryBtn: { background: "#1A1A1A", color: "#F5F0E8", padding: "14px 24px", borderRadius: 14, textDecoration: "none", fontWeight: 700, fontSize: 15, border: "1px solid #2A2A2A" },
  features: { width: "100%", maxWidth: 680, padding: "32px 20px" },
  sectionTitle: { fontSize: 22, fontWeight: 800, color: "#F5F0E8", textAlign: "center", marginBottom: 24 },
  featureGrid: { display: "flex", flexDirection: "column", gap: 16 },
  featureCard: { background: "#111", border: "1px solid #1A1A1A", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  featureTitle: { fontSize: 20, fontWeight: 800, margin: 0 },
  featureDesc: { color: "#777", fontSize: 14, lineHeight: 1.6 },
  featureBtn: { alignSelf: "flex-start", color: "#000", padding: "10px 20px", borderRadius: 10, textDecoration: "none", fontWeight: 800, fontSize: 13 },
  howItWorks: { width: "100%", maxWidth: 680, padding: "0 20px 32px" },
  steps: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  step: { background: "#111", border: "1px solid #1A1A1A", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 6 },
  stepNum: { width: 36, height: 36, borderRadius: "50%", background: "#FFD700", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 },
  footer: { padding: "24px 20px", borderTop: "1px solid #1A1A1A", width: "100%", textAlign: "center", color: "#444", fontSize: 13 },
};
