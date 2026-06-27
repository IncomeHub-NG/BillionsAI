import { Link, useLocation } from "react-router-dom";

const links = [
  { path: "/", label: "Home" },
  { path: "/studio", label: "🎬 Studio" },
  { path: "/voice-clone", label: "🎙️ Voice" },
  { path: "/live-avatar", label: "📹 Live" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}>
        <span style={{ color: "#FFD700", fontSize: 26, fontWeight: 900 }}>B</span>
        <span style={{ fontSize: 22, fontWeight: 900 }}>illionsAI</span>
        <span style={s.badge}>BETA</span>
      </Link>
      <div style={s.links}>
        {links.map(l => (
          <Link key={l.path} to={l.path} style={{
            ...s.link,
            color: pathname === l.path ? "#FFD700" : "#888",
            borderBottom: pathname === l.path ? "2px solid #FFD700" : "2px solid transparent",
          }}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const s = {
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1A1A1A", background: "#0A0A0A", position: "sticky", top: 0, zIndex: 100 },
  logo: { display: "flex", alignItems: "center", gap: 2, textDecoration: "none", color: "#F5F0E8" },
  badge: { background: "#1A1200", color: "#FFD700", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 99, border: "1px solid #FFD700", marginLeft: 6, letterSpacing: 1 },
  links: { display: "flex", gap: 4, overflowX: "auto" },
  link: { textDecoration: "none", fontSize: 12, fontWeight: 700, padding: "6px 8px", whiteSpace: "nowrap" },
};
