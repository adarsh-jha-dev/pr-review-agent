import { Check, X, CircleHelp } from "lucide-react";
import type { PRReview } from "@/lib/schemas";
import { VERDICT_CFG } from "@/lib/constants";

const VERDICT_ICONS = {
  approve: Check,
  request_changes: X,
  needs_info: CircleHelp,
};

export function VerdictBadge({ v }: { v: PRReview["verdict"] }) {
  if (!v) return null;
  const cfg = VERDICT_CFG[v];
  const Icon = VERDICT_ICONS[v];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 11px", borderRadius: 6, fontSize: 12, fontWeight: 500,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      flexShrink: 0, letterSpacing: "0.01em",
    }}>
      <Icon size={12} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}
