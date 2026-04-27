import { Timer } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

interface TimeBomb {
  file: string;
  line: number | null;
  type: string;
  content: string;
}

const TYPE_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "todo":           { label: "TODO",          color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  "console":        { label: "console.*",     color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  "ts-ignore":      { label: "@ts-ignore",    color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  "eslint-disable": { label: "eslint-disable",color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  "hardcoded-date": { label: "hardcoded date",color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD" },
  "deprecated":     { label: "deprecated",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

export function TimeBombPanel({ bombs }: { bombs: TimeBomb[] }) {
  if (!bombs.length) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionLabel>Time bombs in diff</SectionLabel>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
          background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Timer size={10} />
          {bombs.length} item{bombs.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{
        background: "var(--color-background-primary)",
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 8, overflow: "hidden",
      }}>
        {bombs.map((b, i) => {
          const cfg = TYPE_CFG[b.type] ?? TYPE_CFG["todo"];
          return (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "9px 14px",
              borderBottom: i < bombs.length - 1 ? "1px solid var(--color-border-tertiary)" : "none",
            }}>
              <span style={{
                flexShrink: 0, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                marginTop: 1,
              }}>
                {cfg.label}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{
                  fontSize: 11, fontFamily: "var(--font-mono, monospace)",
                  color: "var(--color-text-primary)", display: "block",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {b.content}
                </code>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2, display: "block" }}>
                  {b.file}{b.line != null ? `:${b.line}` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
