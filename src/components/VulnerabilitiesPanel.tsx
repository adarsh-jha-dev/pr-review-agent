import { ShieldAlert } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

interface VulnEntry {
  pkg: string;
  ecosystem: string;
  vulns: { id: string; summary: string; severity: string }[];
}

export function VulnerabilitiesPanel({ vulnerabilities }: { vulnerabilities: VulnEntry[] }) {
  if (!vulnerabilities.length) return null;
  const total = vulnerabilities.reduce((acc, v) => acc + v.vulns.length, 0);
  return (
    <div>
      <SectionLabel>
        Dependency vulnerabilities — {total} CVE{total !== 1 ? "s" : ""} across {vulnerabilities.length} package{vulnerabilities.length !== 1 ? "s" : ""}
      </SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {vulnerabilities.map((v, i) => (
          <div key={i} style={{
            padding: "12px 14px", borderRadius: 8,
            background: "#FEF2F2", border: "1px solid #FECACA",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ShieldAlert size={14} color="#DC2626" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", fontFamily: "var(--font-mono, monospace)" }}>
                {v.pkg}
              </span>
              <span style={{
                fontSize: 11, color: "#DC2626",
                background: "#FECACA", padding: "1px 6px", borderRadius: 99,
              }}>
                {v.ecosystem}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {v.vulns.map((vuln, j) => (
                <div key={j} style={{ fontSize: 12, color: "#7F1D1D", display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", flexShrink: 0, color: "#DC2626" }}>
                    {vuln.id}
                  </span>
                  <span style={{ lineHeight: 1.5 }}>{vuln.summary}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
