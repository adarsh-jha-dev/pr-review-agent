import { CheckCircle, XCircle, Clock, Minus } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

interface CICheck {
  name: string;
  status: string;
  conclusion?: string | null;
  url: string;
}

function CIIcon({ status, conclusion }: { status: string; conclusion?: string | null }) {
  if (status !== "completed") return <Clock size={13} color="#D97706" />;
  switch (conclusion) {
    case "success":   return <CheckCircle size={13} color="#16A34A" />;
    case "failure":   return <XCircle size={13} color="#DC2626" />;
    case "skipped":
    case "cancelled": return <Minus size={13} color="#6B7280" />;
    default:          return <Clock size={13} color="#D97706" />;
  }
}

export function CIChecksPanel({ checks }: { checks: CICheck[] }) {
  if (!checks.length) return null;
  const failCount = checks.filter(c => c.conclusion === "failure").length;
  return (
    <div>
      <SectionLabel>
        CI checks ({checks.length}){failCount > 0 ? ` — ${failCount} failing` : ""}
      </SectionLabel>
      <div style={{
        background: "var(--color-background-primary)",
        border: `1px solid ${failCount > 0 ? "#FECACA" : "var(--color-border-secondary)"}`,
        borderRadius: 8, overflow: "hidden",
      }}>
        {checks.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 14px",
              borderBottom: i < checks.length - 1 ? "1px solid var(--color-border-tertiary)" : "none",
              textDecoration: "none",
            }}
          >
            <CIIcon status={c.status} conclusion={c.conclusion} />
            <span style={{ fontSize: 12, color: "var(--color-text-primary)", flex: 1 }}>{c.name}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {c.conclusion ?? c.status}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
