import { Flame, Clock, Users } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

interface ArchaeologyEntry {
  filename: string;
  commitCount: number;
  lastModified: string;
  uniqueAuthors: number;
  isHotspot: boolean;
}

function timeAgoShort(iso: string) {
  if (!iso) return "unknown";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 2592000)}mo ago`;
}

export function ArchaeologyPanel({ entries }: { entries: ArchaeologyEntry[] }) {
  if (!entries.length) return null;
  const hotspots = entries.filter(e => e.isHotspot).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionLabel>Code archaeology</SectionLabel>
        {hotspots > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
            background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <Flame size={10} />
            {hotspots} hotspot{hotspots !== 1 ? "s" : ""} (10+ commits)
          </span>
        )}
      </div>
      <div style={{
        background: "var(--color-background-primary)",
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 8, overflow: "hidden",
      }}>
        {entries.map((e, i) => {
          const barPct = Math.min(100, (e.commitCount / 30) * 100);
          return (
            <div key={e.filename} style={{
              padding: "10px 14px",
              borderBottom: i < entries.length - 1 ? "1px solid var(--color-border-tertiary)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {e.isHotspot && <Flame size={12} color="#DC2626" />}
                <span style={{
                  fontSize: 12, fontFamily: "var(--font-mono, monospace)",
                  color: "var(--color-text-primary)", fontWeight: 500, flex: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {e.filename}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} /> {timeAgoShort(e.lastModified)}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={10} /> {e.uniqueAuthors} author{e.uniqueAuthors !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 11, color: e.isHotspot ? "#DC2626" : "var(--color-text-tertiary)", fontWeight: e.isHotspot ? 600 : 400 }}>
                  {e.commitCount} commits
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: "var(--color-background-secondary)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${barPct}%`, borderRadius: 99,
                  background: e.isHotspot ? "#DC2626" : e.commitCount >= 5 ? "#D97706" : "#16A34A",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
