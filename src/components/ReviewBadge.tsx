"use client";
import { Copy } from "lucide-react";

export function ReviewBadge({ verdict, criticalCount }: { verdict: string; criticalCount: number }) {
  const color = verdict === "approve" ? "brightgreen"
    : verdict === "request_changes" ? "red" : "yellow";
  const label = verdict === "approve" ? "approved"
    : verdict === "request_changes" ? `${criticalCount}+critical` : "needs-info";
  const badgeUrl = `https://img.shields.io/badge/AI%20Review-${encodeURIComponent(label)}-${color}`;

  const copyBadge = () => navigator.clipboard.writeText(`![AI Review](${badgeUrl})`);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={badgeUrl} alt="review badge" style={{ height: 20 }} />
      <button onClick={copyBadge} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, color: "var(--color-text-tertiary)",
        background: "none", border: "none", cursor: "pointer", padding: 0,
      }}>
        <Copy size={11} />
        copy badge
      </button>
    </div>
  );
}
