"use client";
import { useMemo } from "react";
import { X, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { SectionLabel } from "./SectionLabel";
import type { HistoryEntry } from "@/lib/constants";

const VERDICT_COLOR = { approve: "#16A34A", request_changes: "#DC2626", needs_info: "#D97706" };

export function StatsPanel({ history, onClose }: { history: HistoryEntry[]; onClose: () => void }) {
  const verdictData = useMemo(() => {
    const c = { approve: 0, request_changes: 0, needs_info: 0 };
    history.forEach(h => c[h.review.verdict]++);
    return [
      { name: "Approved",  value: c.approve,          color: VERDICT_COLOR.approve },
      { name: "Changes",   value: c.request_changes,   color: VERDICT_COLOR.request_changes },
      { name: "Needs info", value: c.needs_info,       color: VERDICT_COLOR.needs_info },
    ].filter(d => d.value > 0);
  }, [history]);

  const criticalTrend = useMemo(() =>
    [...history].reverse().slice(0, 12).map(h => ({
      pr: `#${h.prNumber}`,
      critical: h.review.comments.filter(c => c.severity === "critical").length,
      warning:  h.review.comments.filter(c => c.severity === "warning").length,
    })),
    [history]
  );

  const topRepos = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(h => { counts[h.repo] = (counts[h.repo] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([repo, count]) => ({ repo: repo.split("/")[1] ?? repo, count }));
  }, [history]);

  const avgCritical = useMemo(() => {
    if (!history.length) return "0";
    const total = history.reduce((n, h) =>
      n + h.review.comments.filter(c => c.severity === "critical").length, 0);
    return (total / history.length).toFixed(1);
  }, [history]);

  const approvalRate = useMemo(() => {
    if (!history.length) return "—";
    const approved = history.filter(h => h.review.verdict === "approve").length;
    return `${Math.round((approved / history.length) * 100)}%`;
  }, [history]);

  const tooltipStyle = { fontSize: 12, border: "1px solid var(--color-border-secondary)", borderRadius: 6 };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 680, maxHeight: "88vh",
        background: "var(--color-background-primary)",
        borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        border: "1px solid var(--color-border-secondary)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--color-border-tertiary)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color="#2563EB" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
              Review statistics
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6,
            color: "var(--color-text-tertiary)", display: "flex", alignItems: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", padding: "32px 0" }}>
              No reviews yet — run your first review to see stats here.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* top metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Total reviews",   value: history.length },
                  { label: "Avg critical / PR", value: avgCritical },
                  { label: "Approval rate",    value: approvalRate },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: "var(--color-background-secondary)",
                    border: "1px solid var(--color-border-tertiary)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* verdict distribution */}
              {verdictData.length > 0 && (
                <div>
                  <SectionLabel>Verdict distribution</SectionLabel>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <PieChart width={140} height={140}>
                      <Pie data={verdictData} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="value" stroke="none">
                        {verdictData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {verdictData.map(d => (
                        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>{d.name}</span>
                          <span style={{ color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* critical trend */}
              {criticalTrend.length > 1 && (
                <div>
                  <SectionLabel>Critical & warning issues (recent {criticalTrend.length} reviews)</SectionLabel>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={criticalTrend} margin={{ left: -10, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                      <XAxis dataKey="pr" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="critical" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} name="Critical" />
                      <Line type="monotone" dataKey="warning"  stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} name="Warning" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* top repos */}
              {topRepos.length > 0 && (
                <div>
                  <SectionLabel>Most reviewed repos</SectionLabel>
                  <ResponsiveContainer width="100%" height={Math.max(80, topRepos.length * 32)}>
                    <BarChart data={topRepos} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="repo" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} name="Reviews" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
