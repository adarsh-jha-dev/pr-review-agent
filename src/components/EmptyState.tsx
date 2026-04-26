import { Zap, ShieldCheck, MessageSquare } from "lucide-react";
import { GitPullRequest } from "lucide-react";

const FEATURES = [
  { Icon: ShieldCheck, title: "Security scanning",  desc: "CVE detection on new deps", color: "#10B981" },
  { Icon: Zap,         title: "15s reviews",        desc: "Diff + CI + issues in one", color: "#3B82F6" },
  { Icon: MessageSquare, title: "Chat with the PR", desc: "Ask follow-up questions",   color: "#8B5CF6" },
] as const;

export function EmptyState() {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      paddingTop: 48, paddingBottom: 64,
    }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 22px",
          boxShadow: "0 4px 20px rgba(37,99,235,0.25)",
        }}>
          <GitPullRequest size={25} color="#fff" />
        </div>

        <h2 style={{
          fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)",
          margin: "0 0 8px", letterSpacing: "-0.025em",
        }}>
          Review any GitHub PR
        </h2>
        <p style={{
          fontSize: 13, color: "var(--color-text-tertiary)",
          margin: "0 0 32px", lineHeight: 1.75,
        }}>
          Paste a pull request URL above. DiffWatch fetches the diff, CI results,
          linked issues, and dependencies — then generates a structured review in under 15 seconds.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "left" }}>
          {FEATURES.map(({ Icon, title, desc, color }) => (
            <div key={title} style={{
              background: "var(--color-background-primary)",
              border: "1px solid var(--color-border-tertiary)",
              borderRadius: 11, padding: "14px 13px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${color}14`, border: `1px solid ${color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                <Icon size={14} color={color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 3 }}>
                {title}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.55 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
