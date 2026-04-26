import { Bug, MessageSquare, CheckCircle } from "lucide-react";
import { PRIcon } from "./PRIcon";

const FEATURES = [
  { Icon: Bug,           title: "Bug detection", desc: "Logic errors & security issues" },
  { Icon: MessageSquare, title: "Line comments",  desc: "File & line-level feedback" },
  { Icon: CheckCircle,   title: "What's good",    desc: "Acknowledges strong code" },
] as const;

export function EmptyState() {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      paddingTop: 48, paddingBottom: 64,
    }}>
      <div style={{ maxWidth: 400, textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "var(--color-background-primary)",
          border: "1px solid var(--color-border-secondary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <PRIcon size={24} color="var(--color-text-tertiary)" />
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Review any GitHub PR
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: "0 0 28px", lineHeight: 1.7 }}>
          Paste a pull request URL above for an AI-powered senior&#8209;engineer code review.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "left" }}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} style={{
              background: "var(--color-background-primary)",
              border: "1px solid var(--color-border-tertiary)",
              borderRadius: 9, padding: "12px 12px 11px",
            }}>
              <div style={{ marginBottom: 5, color: "var(--color-text-tertiary)" }}>
                <Icon size={16} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
