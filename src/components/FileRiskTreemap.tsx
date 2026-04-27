"use client";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { SectionLabel } from "./SectionLabel";
import type { FileStats } from "@/lib/github";
import type { PRReview } from "@/lib/schemas";

interface Props {
  files: FileStats[];
  review: Partial<PRReview>;
}

const SEV_COLOR = { critical: "#DC2626", warning: "#D97706", suggestion: "#2563EB", praise: "#16A34A" };

function TreemapContent(props: any) {
  const { x, y, width, height, name, color, changes } = props;
  if (width < 20 || height < 20) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.5} rx={4} />
      {width > 50 && height > 28 && (
        <text x={x + 6} y={y + 15} fontSize={10} fill={color} fontWeight={600} style={{ userSelect: "none" }}>
          {name.length > 18 ? name.slice(0, 16) + "…" : name}
        </text>
      )}
      {width > 50 && height > 42 && (
        <text x={x + 6} y={y + 28} fontSize={9} fill={color} fillOpacity={0.7} style={{ userSelect: "none" }}>
          {changes}L
        </text>
      )}
    </g>
  );
}

export function FileRiskTreemap({ files, review }: Props) {
  if (!files.length) return null;

  const issuesByFile: Record<string, { sev: keyof typeof SEV_COLOR; count: number }> = {};
  for (const c of review.comments ?? []) {
    const existing = issuesByFile[c.file];
    const sevOrder = ["critical", "warning", "suggestion", "praise"] as const;
    const incoming = c.severity as keyof typeof SEV_COLOR;
    if (!existing || sevOrder.indexOf(incoming) < sevOrder.indexOf(existing.sev)) {
      issuesByFile[c.file] = { sev: incoming, count: (existing?.count ?? 0) + 1 };
    } else {
      issuesByFile[c.file] = { sev: existing.sev, count: existing.count + 1 };
    }
  }

  const data = files
    .filter(f => f.changes > 0)
    .map(f => {
      const issue = issuesByFile[f.filename];
      const sev   = issue?.sev ?? "suggestion";
      return {
        name: f.filename.split("/").pop()!,
        fullPath: f.filename,
        size: Math.max(f.changes, 1),
        changes: f.changes,
        issueCount: issue?.count ?? 0,
        color: SEV_COLOR[sev],
        sev,
      };
    });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionLabel>File risk treemap</SectionLabel>
        <div style={{ display: "flex", gap: 10 }}>
          {(Object.entries(SEV_COLOR) as [string, string][]).map(([sev, color]) => (
            <span key={sev} style={{ fontSize: 10, color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: color, display: "inline-block" }} />
              {sev}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          content={<TreemapContent />}
        >
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid var(--color-border-secondary)", borderRadius: 6 }}
            formatter={(_: unknown, __: unknown, props: any) => [
              `${props.payload?.changes ?? 0} lines changed · ${props.payload?.issueCount ?? 0} issue(s)`,
              props.payload?.fullPath ?? "",
            ]}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
