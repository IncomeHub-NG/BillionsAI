import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import VoiceClone from "./pages/VoiceClone";
import LiveAvatar from "./pages/LiveAvatar";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F5F0E8" }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/voice-clone" element={<VoiceClone />} />
          <Route path="/live-avatar" element={<LiveAvatar />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
