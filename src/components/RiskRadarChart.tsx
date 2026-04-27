"use client";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { SectionLabel } from "./SectionLabel";
import type { PRReview } from "@/lib/schemas";
import type { FileStats } from "@/lib/github";

interface Props {
  review: Partial<PRReview>;
  files: FileStats[];
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }

export function RiskRadarChart({ review, files }: Props) {
  const vulnCount   = review.vulnerabilities?.length ?? 0;
  const ciChecks    = review.ciChecks ?? [];
  const bundleItems = review.bundleImpact ?? [];
  const comments    = review.comments ?? [];
  const timeBombs   = review.timeBombs ?? [];

  const ciPassing = ciChecks.length
    ? ciChecks.filter(c => c.conclusion === "success").length / ciChecks.length
    : 1;
  const totalGzip   = bundleItems.reduce((n, b) => n + b.sizeGzip, 0);
  const totalChurn  = files.reduce((n, f) => n + f.changes, 0);
  const criticals   = comments.filter(c => c.severity === "critical").length;
  const warnings    = comments.filter(c => c.severity === "warning").length;
  const hasTests    = files.some(f => /\.(test|spec)\.[tj]sx?$|__tests__/.test(f.filename));

  const scores = [
    { axis: "Security",    value: clamp(100 - vulnCount * 25) },
    { axis: "CI Health",   value: clamp(Math.round(ciPassing * 100)) },
    { axis: "Bundle",      value: clamp(100 - Math.round(totalGzip / 3000)) },
    { axis: "Code Churn",  value: clamp(100 - Math.round(totalChurn / 8)) },
    { axis: "Issue Density", value: clamp(100 - criticals * 15 - warnings * 7) },
    { axis: "Test Signal", value: clamp(hasTests ? 85 : timeBombs.length === 0 ? 40 : 20) },
  ];

  const avg = Math.round(scores.reduce((n, s) => n + s.value, 0) / scores.length);
  const color = avg >= 70 ? "#16A34A" : avg >= 45 ? "#D97706" : "#DC2626";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionLabel>Risk radar</SectionLabel>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99,
          background: color + "18", color, border: `1px solid ${color}40`,
        }}>
          {avg}/100 health score
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={scores} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="var(--color-border-tertiary)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)", fontWeight: 500 }}
          />
          <Radar
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.18}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid var(--color-border-secondary)", borderRadius: 6 }}
            formatter={(v) => [`${v ?? 0}/100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
