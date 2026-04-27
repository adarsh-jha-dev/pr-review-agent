import { GitMerge, ExternalLink } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

interface MergeConflictRisk {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  sharedFiles: string[];
}

export function MergeConflictPanel({ risks }: { risks: MergeConflictRisk[] }) {
  if (!risks.length) return null;
  const totalShared = risks.reduce((n, r) => n + r.sharedFiles.length, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionLabel>Merge conflict risks</SectionLabel>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
          background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A",
        }}>
          {risks.length} open PR{risks.length !== 1 ? "s" : ""} · {totalShared} file overlap{totalShared !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{
        background: "var(--color-background-primary)",
        border: "1px solid #FDE68A",
        borderRadius: 8, overflow: "hidden",
      }}>
        {risks.map((r, i) => (
          <div key={r.prNumber} style={{
            padding: "10px 14px",
            borderBottom: i < risks.length - 1 ? "1px solid var(--color-border-tertiary)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <GitMerge size={13} color="#D97706" />
              <a href={r.prUrl} target="_blank" rel="noreferrer" style={{
                fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)",
                textDecoration: "none", flex: 1,
              }}>
                #{r.prNumber}: {r.prTitle.slice(0, 60)}{r.prTitle.length > 60 ? "…" : ""}
              </a>
              <ExternalLink size={11} color="var(--color-text-tertiary)" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {r.sharedFiles.map(f => (
                <span key={f} style={{
                  fontSize: 10, fontFamily: "var(--font-mono, monospace)",
                  padding: "2px 7px", borderRadius: 4,
                  background: "#FEF3C7", color: "#92400E",
                  border: "1px solid #FDE68A",
                }}>
                  {f.split("/").slice(-2).join("/")}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
