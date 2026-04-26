import { SEV, type Severity } from "@/lib/constants";

export function SeverityTag({ sev }: { sev: Severity }) {
  const cfg = SEV[sev];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
      background: cfg.tagBg, color: cfg.tagText, letterSpacing: "0.03em",
    }}>
      {cfg.label}
    </span>
  );
}
