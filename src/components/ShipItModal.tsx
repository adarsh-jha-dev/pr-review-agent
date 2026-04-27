"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Rocket, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { StreamingDot } from "./StreamingDot";
import type { PRReview } from "@/lib/schemas";

interface Props {
  prUrl: string;
  review: PRReview;
  prTitle?: string;
}

export function ShipItModal({ prUrl, review, prTitle }: Props) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  async function generate() {
    setOpen(true);
    if (text) return;
    setLoading(true);
    setText("");
    const criticalCount = review.comments?.filter(c => c.severity === "critical").length ?? 0;
    const warningCount  = review.comments?.filter(c => c.severity === "warning").length ?? 0;
    try {
      const res = await fetch("/api/shipit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prUrl,
          title: prTitle ?? prUrl,
          summary: review.summary,
          verdict: review.verdict,
          criticalCount,
          warningCount,
          positives: review.positives ?? [],
        }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText(p => p + dec.decode(value));
      }
    } catch (err) {
      toast.error("Couldn't generate announcement", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
      setOpen(false);
    }
    setLoading(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access denied");
    }
  }

  const overlay = open ? (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div style={{
        width: 600, maxHeight: "80vh",
        background: "var(--color-background-primary)",
        borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        border: "1px solid var(--color-border-secondary)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--color-border-tertiary)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Rocket size={15} color="#16A34A" />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
              Ship it — Slack announcement
            </span>
          </div>
          <button onClick={() => setOpen(false)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6,
            color: "var(--color-text-tertiary)", display: "flex",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{
            background: "var(--color-background-secondary)",
            border: "1px solid var(--color-border-tertiary)",
            borderRadius: 8, padding: "16px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 13, lineHeight: 1.75,
            color: "var(--color-text-primary)",
            whiteSpace: "pre-wrap", minHeight: 120,
          }}>
            {text || (loading
              ? <span style={{ color: "var(--color-text-tertiary)" }}>Generating…</span>
              : null
            )}
            {loading && <StreamingDot />}
          </div>
        </div>

        <div style={{
          padding: "14px 20px", borderTop: "1px solid var(--color-border-tertiary)",
          display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0,
        }}>
          <button
            onClick={() => { setText(""); generate(); }}
            disabled={loading}
            style={{
              padding: "8px 14px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
              background: "var(--color-background-secondary)",
              border: "1px solid var(--color-border-secondary)",
              fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)",
            }}
          >
            Regenerate
          </button>
          <button
            onClick={copy}
            disabled={!text || loading}
            style={{
              padding: "8px 16px", borderRadius: 8,
              cursor: !text || loading ? "not-allowed" : "pointer",
              background: copied ? "#16A34A" : "#2563EB",
              color: "#fff", border: "none",
              fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 0.15s",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={generate}
        style={{
          height: 40, padding: "0 14px", borderRadius: 9, cursor: "pointer",
          background: "#16A34A", color: "#fff", border: "none",
          fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em",
          display: "flex", alignItems: "center", gap: 6,
          transition: "background 0.15s, transform 0.1s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#15803D")}
        onMouseLeave={e => (e.currentTarget.style.background = "#16A34A")}
      >
        <Rocket size={13} />
        Ship it
      </button>
      {typeof document !== "undefined" && createPortal(overlay, document.body)}
    </>
  );
}
