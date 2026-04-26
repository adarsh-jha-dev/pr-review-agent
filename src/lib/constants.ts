import type { PRReview } from "@/lib/schemas";

export type Severity = "critical" | "warning" | "suggestion" | "praise";

export interface HistoryEntry {
  id: string;
  prUrl: string;
  repo: string;
  prNumber: string;
  review: PRReview;
  reviewedAt: number;
}

export const SEV = {
  critical:   { label: "Critical",   bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", tagBg: "#FCA5A5", tagText: "#450A0A" },
  warning:    { label: "Warning",    bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", tagBg: "#FCD34D", tagText: "#451A03" },
  suggestion: { label: "Suggestion", bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", tagBg: "#93C5FD", tagText: "#1E3A8A" },
  praise:     { label: "Praise",     bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", tagBg: "#86EFAC", tagText: "#052E16" },
} as const;

export const VERDICT_CFG = {
  approve:         { label: "Approve",         bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
  request_changes: { label: "Request changes", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  needs_info:      { label: "Needs info",      bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
} as const;

export function parseRepo(url: string) {
  const m = url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
  return m ? { repo: m[1], prNumber: m[2] } : { repo: "unknown/repo", prNumber: "0" };
}

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
