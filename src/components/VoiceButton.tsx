"use client";
import { useState, useEffect, useRef } from "react";
import { Volume2, Square } from "lucide-react";

export function VoiceButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.93;
    utt.pitch = 1;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? "Stop reading" : "Listen to summary"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        height: 30, padding: "0 11px", borderRadius: 6,
        fontSize: 12, fontWeight: 500,
        background: speaking ? "#EFF6FF" : "var(--color-background-primary)",
        border: `1px solid ${speaking ? "#BFDBFE" : "var(--color-border-secondary)"}`,
        color: speaking ? "#2563EB" : "var(--color-text-secondary)",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {speaking
        ? <Square size={10} fill="currentColor" strokeWidth={0} />
        : <Volume2 size={11} />}
      {speaking ? "Stop" : "Listen"}
    </button>
  );
}
