import { SectionLabel } from "./SectionLabel";
import { formatBytes } from "@/lib/bundle";

interface BundleResult {
  pkg: string;
  sizeGzip: number;
  sizeParsed: number;
  isNew: boolean;
}

export function BundleImpactPanel({ packages }: { packages: BundleResult[] }) {
  if (!packages?.length) return null;

  const totalGzip = packages.reduce((n, p) => n + p.sizeGzip, 0);
  const isHeavy   = totalGzip > 100 * 1024;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionLabel>Bundle size impact</SectionLabel>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
          background: isHeavy ? "#FEF2F2" : "#F0FDF4",
          color: isHeavy ? "#991B1B" : "#166534",
          border: `1px solid ${isHeavy ? "#FECACA" : "#BBF7D0"}`,
        }}>
          +{formatBytes(totalGzip)} gzipped total
        </span>
      </div>

      <div style={{
        background: "var(--color-background-primary)",
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 8, overflow: "hidden",
      }}>
        {packages.map((p, i) => {
          const isLarge = p.sizeGzip > 50 * 1024;
          return (
            <div key={p.pkg} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 14px",
              borderBottom: i < packages.length - 1 ? "1px solid var(--color-border-tertiary)" : "none",
              background: isLarge ? "#FFFBEB" : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{
                  fontSize: 12, fontFamily: "var(--font-mono, monospace)",
                  color: "var(--color-text-primary)",
                }}>
                  {p.pkg}
                </code>
                {p.isNew && (
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 99,
                    background: "#EFF6FF", color: "#1D4ED8",
                    border: "1px solid #BFDBFE",
                  }}>new</span>
                )}
                {isLarge && (
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 99,
                    background: "#FFFBEB", color: "#92400E",
                    border: "1px solid #FDE68A",
                  }}>heavy</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {formatBytes(p.sizeGzip)}
                  <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 400 }}> gz</span>
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                  {formatBytes(p.sizeParsed)} parsed
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}