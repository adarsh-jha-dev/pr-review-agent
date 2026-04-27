"use client";
import { useState, useRef } from "react";
import { SectionLabel } from "./SectionLabel";
import { StreamingDot } from "./StreamingDot";

interface Persona {
  id: string;
  label: string;
  emoji: string;
  color: string;
  accent: string;
}

const PERSONAS: Persona[] = [
  { id: "architect", label: "Architect",     emoji: "🏗",  color: "#2563EB", accent: "#EFF6FF" },
  { id: "security",  label: "Security Lead", emoji: "🔐",  color: "#DC2626", accent: "#FEF2F2" },
  { id: "pm",        label: "PM",            emoji: "📋",  color: "#7C3AED", accent: "#F5F3FF" },
  { id: "intern",    label: "Intern",        emoji: "🎓",  color: "#16A34A", accent: "#F0FDF4" },
];

export function PersonaPanel({ prUrl }: { prUrl: string }) {
  const [active, setActive]   = useState<string | null>(null);
  const [texts, setTexts]     = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const aborts = useRef<Record<string, AbortController>>({});

  async function fetchPersona(id: string) {
    if (texts[id]) { setActive(id); return; }
    aborts.current[id]?.abort();
    const ac = new AbortController();
    aborts.current[id] = ac;

    setActive(id);
    setLoading(p => ({ ...p, [id]: true }));
    setTexts(p => ({ ...p, [id]: "" }));

    try {
      const res = await fetch("/api/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl, persona: id }),
        signal: ac.signal,
      });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setTexts(p => ({ ...p, [id]: (p[id] ?? "") + dec.decode(value) }));
      }
    } catch {}
    setLoading(p => ({ ...p, [id]: false }));
  }

  const activePersona = PERSONAS.find(p => p.id === active);

  return (
    <div>
      <SectionLabel>Persona reactor — same PR, four lenses</SectionLabel>
      <div style={{
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 10, overflow: "hidden",
        background: "var(--color-background-primary)",
      }}>
        {/* tabs */}
        <div style={{
          display: "flex", borderBottom: "1px solid var(--color-border-tertiary)",
          background: "var(--color-background-secondary)",
        }}>
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => fetchPersona(p.id)}
              style={{
                flex: 1, padding: "10px 8px", border: "none", cursor: "pointer",
                background: active === p.id ? "var(--color-background-primary)" : "transparent",
                borderBottom: active === p.id ? `2px solid ${p.color}` : "2px solid transparent",
                fontSize: 12, fontWeight: 600,
                color: active === p.id ? p.color : "var(--color-text-tertiary)",
                transition: "color 0.15s, background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              <span style={{ fontSize: 14 }}>{p.emoji}</span>
              {p.label}
              {loading[p.id] && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: p.color, display: "inline-block",
                  animation: "prpulse 0.8s ease-in-out infinite",
                }} />
              )}
            </button>
          ))}
        </div>

        {/* content */}
        <div style={{ padding: "18px 20px", minHeight: 100 }}>
          {!active && (
            <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0, textAlign: "center", paddingTop: 16 }}>
              Click a persona tab to get their take on this PR.
            </p>
          )}
          {active && activePersona && (
            <div style={{
              fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.8,
              borderLeft: `3px solid ${activePersona.color}`,
              paddingLeft: 14,
            }}>
              {texts[active] || (loading[active]
                ? <span style={{ color: "var(--color-text-tertiary)" }}>Thinking…</span>
                : null
              )}
              {loading[active] && <StreamingDot />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
