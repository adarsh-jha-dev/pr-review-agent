import { SEV, type Severity } from "@/lib/constants";
import { SeverityTag } from "./SeverityTag";

export function CommentCard({ file, line, severity, message }: {
  file: string;
  line: number | null;
  severity: Severity;
  message: string;
}) {
  const cfg = SEV[severity];
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 8,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <SeverityTag sev={severity} />
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "var(--color-text-tertiary)" }}>
          {file}{line ? `:${line}` : ""}
        </span>
      </div>
      <p style={{ fontSize: 13, color: cfg.text, lineHeight: 1.65, margin: 0 }}>{message}</p>
    </div>
  );
}
