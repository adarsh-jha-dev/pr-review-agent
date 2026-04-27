"use client";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { SectionLabel } from "./SectionLabel";
import type { PRReview } from "@/lib/schemas";
import type { FileStats } from "@/lib/github";

interface Props {
  review: Partial<PRReview>;
  files: FileStats[];
}

const SEV_COLOR = { critical: "#DC2626", warning: "#D97706", suggestion: "#2563EB", praise: "#16A34A" };
const SEV_SIZE  = { critical: 140, warning: 90, suggestion: 55, praise: 40 };

interface Dot {
  x: number;
  y: number;
  z: number;
  severity: string;
  message: string;
  file: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: Dot = payload[0]?.payload;
  return (
    <div style={{
      fontSize: 12, border: "1px solid var(--color-border-secondary)",
      borderRadius: 8, padding: "8px 12px", maxWidth: 280,
      background: "var(--color-background-primary)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <div style={{ fontWeight: 600, color: SEV_COLOR[d.severity as keyof typeof SEV_COLOR], marginBottom: 4 }}>
        {d.severity}
      </div>
      <div style={{ color: "var(--color-text-primary)", lineHeight: 1.5, marginBottom: 4 }}>{d.message}</div>
      <div style={{ color: "var(--color-text-tertiary)", fontSize: 11 }}>
        {d.file}{d.x ? `:${d.x}` : ""}
      </div>
    </div>
  );
}

export function IssueScatterMap({ review, files }: Props) {
  const comments = review.comments ?? [];
  if (comments.length === 0) return null;

  const fileIndex: Record<string, number> = {};
  files.forEach((f, i) => { fileIndex[f.filename] = i; });

  const dots: Dot[] = comments.map(c => ({
    x: c.line ?? 0,
    y: fileIndex[c.file] ?? 0,
    z: SEV_SIZE[c.severity as keyof typeof SEV_SIZE] ?? 55,
    severity: c.severity,
    message: c.message.slice(0, 120),
    file: c.file,
  }));

  const fileLabels = files.map(f => f.filename.split("/").pop()!);

  return (
    <div>
      <SectionLabel>Issue scatter map — where issues cluster in the diff</SectionLabel>
      <ResponsiveContainer width="100%" height={Math.max(160, files.length * 28 + 40)}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <XAxis
            dataKey="x"
            type="number"
            name="Line"
            tick={{ fontSize: 10 }}
            label={{ value: "line number", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "var(--color-text-tertiary)" }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name="File"
            domain={[-0.5, files.length - 0.5]}
            ticks={files.map((_, i) => i)}
            tickFormatter={(i: number) => fileLabels[i] ?? ""}
            tick={{ fontSize: 10 }}
            width={100}
          />
          <ZAxis dataKey="z" range={[30, 160]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={dots}>
            {dots.map((d, i) => (
              <Cell key={i} fill={SEV_COLOR[d.severity as keyof typeof SEV_COLOR]} fillOpacity={0.75} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
