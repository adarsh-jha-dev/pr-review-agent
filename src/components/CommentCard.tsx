"use client";
import { useState } from "react";
import { SEV, type Severity } from "@/lib/constants";
import { SeverityTag } from "./SeverityTag";
import { FileCode, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export function CommentCard({ file, line, severity, message }: {
  file: string;
  line: number | null;
  severity: Severity;
  message: string;
}) {
  const cfg = SEV[severity];
  const [showFix, setShowFix] = useState(false);
  const [fix, setFix] = useState("");
  const [loadingFix, setLoadingFix] = useState(false);
  const canFix = severity === "critical" || severity === "warning";

  const handleFix = async () => {
    if (fix) { setShowFix(s => !s); return; }
    setShowFix(true);
    setLoadingFix(true);
    try {
      const res = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, line, severity, message }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setFix(text);
      }
    } catch {
      setFix("Failed to generate fix. Please try again.");
    } finally {
      setLoadingFix(false);
    }
  };

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* header bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px",
        borderBottom: `1px solid ${cfg.border}`,
        background: `${cfg.border}55`,
      }}>
        <SeverityTag sev={severity} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
          <FileCode size={11} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: 11, fontFamily: "var(--font-mono, monospace)",
            color: "var(--color-text-tertiary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {file}{line != null ? `:${line}` : ""}
          </span>
        </div>
        {canFix && (
          <button onClick={handleFix} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
            background: "rgba(255,255,255,0.6)", border: `1px solid ${cfg.border}`,
            color: cfg.text, cursor: "pointer",
            flexShrink: 0, letterSpacing: "0.01em",
            transition: "opacity 0.15s",
          }}>
            <Sparkles size={9} />
            {loadingFix ? "Generating…" : fix ? (showFix ? "Hide fix" : "Show fix") : "Suggest fix"}
            {fix && !loadingFix && (showFix ? <ChevronUp size={9} /> : <ChevronDown size={9} />)}
          </button>
        )}
      </div>

      {/* message */}
      <p style={{ fontSize: 13, color: cfg.text, lineHeight: 1.7, margin: 0, padding: "12px 14px" }}>
        {message}
      </p>

      {/* fix panel */}
      {showFix && (
        <div style={{
          borderTop: `1px solid ${cfg.border}`,
          padding: "12px 14px",
          background: "rgba(255,255,255,0.55)",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: cfg.text,
            letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <Sparkles size={10} />
            AI Fix Suggestion
          </div>
          {loadingFix && !fix ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: "50%", background: cfg.text,
                  opacity: 0.4,
                  animation: `prpulse ${0.8 + i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          ) : (
            <pre style={{
              margin: 0, fontSize: 12, lineHeight: 1.65,
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--color-text-primary)",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {fix}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
