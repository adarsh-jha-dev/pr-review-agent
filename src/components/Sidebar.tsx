"use client";
import { Check, X, CircleHelp } from "lucide-react";
import { VERDICT_CFG, timeAgo, type HistoryEntry } from "@/lib/constants";
import { PRIcon } from "./PRIcon";

const VERDICT_ICONS = {
  approve: Check,
  request_changes: X,
  needs_info: CircleHelp,
};

interface SidebarProps {
  history: HistoryEntry[];
  selectedUrl: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export function Sidebar({ history, selectedUrl, onSelect }: SidebarProps) {
  return (
    <aside style={{
      background: "var(--color-background-primary)",
      borderRight: "1px solid var(--color-border-tertiary)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "16px 16px 14px",
        borderBottom: "1px solid var(--color-border-tertiary)",
        display: "flex", alignItems: "center", gap: 9,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "#2563EB",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <PRIcon size={14} color="#fff" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>
          PR Review
        </span>
      </div>

      <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)",
          letterSpacing: "0.07em", textTransform: "uppercase",
          padding: "4px 6px 8px",
        }}>
          Recent
        </div>

        {history.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "2px 6px", lineHeight: 1.6 }}>
            No reviews yet.
          </p>
        )}

        {history.map(h => {
          const isActive = selectedUrl === h.prUrl;
          const cfg = VERDICT_CFG[h.review.verdict];
          const Icon = VERDICT_ICONS[h.review.verdict];
          return (
            <div
              key={h.prUrl}
              className="pr-hist-item"
              onClick={() => onSelect(h)}
              style={{
                padding: "9px 10px", borderRadius: 7, marginBottom: 2,
                border: `1px solid ${isActive ? "#BFDBFE" : "transparent"}`,
                background: isActive ? "#EFF6FF" : "transparent",
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 500, marginBottom: 1,
                color: isActive ? "#1E40AF" : "var(--color-text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {h.repo}
              </div>
              <div style={{ fontSize: 11, color: isActive ? "#3B82F6" : "var(--color-text-tertiary)", marginBottom: 6 }}>
                #{h.prNumber} · {timeAgo(h.reviewedAt)}
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 99,
                background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
              }}>
                <Icon size={10} strokeWidth={2.5} />
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
