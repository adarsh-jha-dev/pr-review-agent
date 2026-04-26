"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SectionLabel } from "./SectionLabel";
import type { FileStats } from "@/lib/github";

export function DiffHeatmap({ files }: { files: FileStats[] }) {
  const data = files.slice(0, 10).map(f => ({
    name: f.filename.split("/").pop()!,
    additions: f.additions,
    deletions: f.deletions,
  }));

  return (
    <div>
      <SectionLabel>Diff heatmap — lines changed per file</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "0.5px solid var(--color-border-tertiary)" }}
            formatter={(v, name) => [`${v} lines`, name]}
          />
          <Bar dataKey="additions" stackId="a" fill="#639922" radius={[0, 0, 0, 0]} />
          <Bar dataKey="deletions" stackId="a" fill="#E24B4A" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
