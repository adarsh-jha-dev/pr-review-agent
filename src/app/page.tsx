"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { reviewSchema, type PRReview } from "@/lib/schemas";

// ─── types ───────────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "suggestion" | "praise";

interface HistoryEntry {
  prUrl: string;
  repo: string;
  prNumber: string;
  review: PRReview;
  reviewedAt: number;
}

// ─── constants ───────────────────────────────────────────────────────────────

const SEV = {
  critical:   { label: "Critical",   bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", tagBg: "#FCA5A5", tagText: "#450A0A" },
  warning:    { label: "Warning",    bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", tagBg: "#FCD34D", tagText: "#451A03" },
  suggestion: { label: "Suggestion", bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", tagBg: "#93C5FD", tagText: "#1E3A8A" },
  praise:     { label: "Praise",     bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", tagBg: "#86EFAC", tagText: "#052E16" },
} as const;

const VERDICT = {
  approve:         { label: "Approve",         icon: "✓", bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
  request_changes: { label: "Request changes", icon: "✕", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  needs_info:      { label: "Needs info",      icon: "?", bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
} as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseRepo(url: string) {
  const m = url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
  return m ? { repo: m[1], prNumber: m[2] } : { repo: "unknown/repo", prNumber: "0" };
}

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem("pr-history") ?? "[]"); } catch { return []; }
}

function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem("pr-history", JSON.stringify(h.slice(0, 20)));
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function VerdictBadge({ v }: { v: PRReview["verdict"] }) {
  if (!v) return null;
  const cfg = VERDICT[v];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 11px", borderRadius: 6, fontSize: 12, fontWeight: 500,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      flexShrink: 0, letterSpacing: "0.01em",
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "var(--color-background-primary)",
      borderRadius: 8, padding: "12px 14px",
      border: "1px solid var(--color-border-tertiary)",
    }}>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function SeverityTag({ sev }: { sev: Severity }) {
  const cfg = SEV[sev];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
      background: cfg.tagBg, color: cfg.tagText, letterSpacing: "0.03em",
    }}>
      {cfg.label}
    </span>
  );
}

function CommentCard({ file, line, severity, message }: {
  file: string; line: number | null; severity: Severity; message: string;
}) {
  const cfg = SEV[severity];
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 8,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <SeverityTag sev={severity} />
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "var(--color-text-tertiary)" }}>
          {file}{line ? `:${line}` : ""}
        </span>
      </div>
      <p style={{ fontSize: 13, color: cfg.text, lineHeight: 1.65, margin: 0 }}>{message}</p>
    </div>
  );
}

function StreamingDot() {
  return (
    <span style={{
      display: "inline-block", width: 5, height: 5, borderRadius: "50%",
      background: "#2563EB", marginLeft: 6, verticalAlign: "middle",
      animation: "prpulse 1.2s ease-in-out infinite",
    }} />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)",
      letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function PRIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [prUrl, setPrUrl]           = useState("");
  const [activeSevs, setActiveSevs] = useState<Set<Severity>>(new Set(["critical", "warning", "suggestion", "praise"]));
  const [history, setHistory]       = useState<HistoryEntry[]>(loadHistory);
  const [selected, setSelected]     = useState<HistoryEntry | null>(null);

  const { object, submit, isLoading, error } = useObject({
    api: "/api/review",
    schema: reviewSchema,
    onFinish({ object: finished }) {
      if (!finished || !prUrl) return;
      const { repo, prNumber } = parseRepo(prUrl);
      const entry: HistoryEntry = {
        prUrl, repo, prNumber,
        review: finished as PRReview,
        reviewedAt: Date.now(),
      };
      const next = [entry, ...history.filter(h => h.prUrl !== prUrl)];
      setHistory(next);
      saveHistory(next);
      setSelected(entry);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim() || isLoading) return;
    setSelected(null);
    submit({ prUrl: prUrl.trim() });
  };

  const toggleSev = (s: Severity) => {
    setActiveSevs(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const review = (selected?.review ?? object ?? {}) as Partial<PRReview>;

  const counts = {
    critical:   review.comments?.filter(c => c.severity === "critical").length   ?? 0,
    warning:    review.comments?.filter(c => c.severity === "warning").length    ?? 0,
    suggestion: review.comments?.filter(c => c.severity === "suggestion").length ?? 0,
    praise:     review.comments?.filter(c => c.severity === "praise").length     ?? 0,
  };

  const filtered = review.comments?.filter(c => activeSevs.has(c.severity as Severity)) ?? [];
  const { repo, prNumber } = prUrl ? parseRepo(prUrl) : { repo: "", prNumber: "" };
  const hasReview = !!(review.summary || review.verdict);

  return (
    <>
      <style>{`
        @keyframes prpulse { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes prspin  { to { transform: rotate(360deg); } }

        .pr-input {
          flex: 1; height: 40px;
          border: 1px solid var(--color-border-secondary);
          border-radius: 8px; padding: 0 14px; font-size: 13px;
          color: var(--color-text-primary);
          background: var(--color-background-primary);
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .pr-input:focus {
          border-color: #93C5FD;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .pr-input::placeholder { color: var(--color-text-tertiary); }

        .pr-btn {
          height: 40px; padding: 0 18px; border-radius: 8px;
          background: #2563EB; color: #fff;
          font-size: 13px; font-weight: 500;
          border: none; cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .pr-btn:hover:not(:disabled) {
          background: #1D4ED8;
          box-shadow: 0 1px 6px rgba(37,99,235,0.35);
        }
        .pr-btn:disabled { background: #93C5FD; cursor: not-allowed; }

        .pr-hist-item {
          cursor: pointer;
          transition: background 0.1s, border-color 0.1s;
        }
        .pr-hist-item:hover { background: var(--color-background-secondary) !important; }

        .pr-filter-pill {
          cursor: pointer; user-select: none;
          transition: opacity 0.15s, border-color 0.15s;
        }
        .pr-filter-pill:hover { opacity: 0.75; }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>

        {/* ── sidebar ── */}
        <aside style={{
          background: "var(--color-background-primary)",
          borderRight: "1px solid var(--color-border-tertiary)",
          display: "flex", flexDirection: "column",
        }}>
          {/* app header */}
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

          {/* history list */}
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
              const isActive = selected?.prUrl === h.prUrl;
              const v = VERDICT[h.review.verdict];
              return (
                <div key={h.prUrl}
                  className="pr-hist-item"
                  onClick={() => { setSelected(h); setPrUrl(h.prUrl); }}
                  style={{
                    padding: "9px 10px", borderRadius: 7, marginBottom: 2,
                    border: `1px solid ${isActive ? "#BFDBFE" : "transparent"}`,
                    background: isActive ? "#EFF6FF" : "transparent",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: isActive ? "#1E40AF" : "var(--color-text-primary)", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.repo}
                  </div>
                  <div style={{ fontSize: 11, color: isActive ? "#3B82F6" : "var(--color-text-tertiary)", marginBottom: 6 }}>
                    #{h.prNumber} · {timeAgo(h.reviewedAt)}
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 99,
                    background: v.bg, color: v.color, border: `1px solid ${v.border}`,
                  }}>
                    {v.icon} {v.label}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── main ── */}
        <main style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24, minWidth: 0, overflowY: "auto" }}>

          {/* URL input */}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              className="pr-input"
              value={prUrl}
              onChange={e => setPrUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
            />
            <button type="submit" className="pr-btn" disabled={isLoading}>
              {isLoading
                ? <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: "prspin 0.8s linear infinite" }}>
                      <circle cx="6" cy="6" r="4.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                      <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Reviewing…
                  </span>
                : "Review PR"}
            </button>
          </form>

          {/* error */}
          {error && (
            <div style={{
              padding: "11px 14px", borderRadius: 8, fontSize: 13,
              background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA",
            }}>
              {error.message}
            </div>
          )}

          {/* results */}
          {hasReview && (
            <>
              {/* PR header row */}
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 12, paddingBottom: 20, borderBottom: "1px solid var(--color-border-tertiary)",
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3, letterSpacing: "-0.02em" }}>
                    {repo}
                    <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}> #{prNumber}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                    {review.comments?.length ?? 0} comment{(review.comments?.length ?? 0) !== 1 ? "s" : ""} across{" "}
                    {[...new Set(review.comments?.map(c => c.file))].length} file{[...new Set(review.comments?.map(c => c.file))].length !== 1 ? "s" : ""}
                  </div>
                </div>
                {review.verdict && <VerdictBadge v={review.verdict} />}
              </div>

              {/* metric cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                <MetricCard label="Critical"    value={counts.critical}   color="#DC2626" />
                <MetricCard label="Warnings"    value={counts.warning}    color="#D97706" />
                <MetricCard label="Suggestions" value={counts.suggestion} color="#2563EB" />
                <MetricCard label="Praise"      value={counts.praise}     color="#16A34A" />
              </div>

              {/* summary */}
              {review.summary && (
                <div>
                  <SectionLabel>Summary</SectionLabel>
                  <div style={{
                    background: "var(--color-background-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderLeft: "3px solid #2563EB",
                    borderRadius: 8, padding: "14px 16px",
                    fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.75,
                  }}>
                    {review.summary}
                    {isLoading && <StreamingDot />}
                  </div>
                </div>
              )}

              {/* positives */}
              {review.positives && review.positives.length > 0 && (
                <div>
                  <SectionLabel>What&apos;s good</SectionLabel>
                  <div style={{
                    background: "var(--color-background-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: 8, padding: "12px 16px",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    {review.positives.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--color-text-secondary)" }}>
                        <span style={{ color: "#16A34A", flexShrink: 0, fontWeight: 600 }}>✓</span>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* comments */}
              {review.comments && review.comments.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <SectionLabel>Comments ({review.comments.length})</SectionLabel>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(["critical", "warning", "suggestion", "praise"] as Severity[]).map(s => {
                        const on = activeSevs.has(s);
                        const cfg = SEV[s];
                        return (
                          <div key={s}
                            className="pr-filter-pill"
                            onClick={() => toggleSev(s)}
                            style={{
                              fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 500,
                              border: `1px solid ${on ? cfg.border : "var(--color-border-secondary)"}`,
                              background: on ? cfg.bg : "var(--color-background-primary)",
                              color: on ? cfg.text : "var(--color-text-tertiary)",
                            }}
                          >
                            {cfg.label}{counts[s] > 0 ? ` · ${counts[s]}` : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map((c, i) => (
                      <CommentCard key={i}
                        file={c.file}
                        line={c.line}
                        severity={c.severity as Severity}
                        message={c.message}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", padding: "8px 0" }}>
                        No comments match the selected filters.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* empty state */}
          {!hasReview && !isLoading && !error && (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              paddingTop: 48, paddingBottom: 64,
            }}>
              <div style={{ maxWidth: 400, textAlign: "center" }}>
                {/* icon circle */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "var(--color-background-primary)",
                  border: "1px solid var(--color-border-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="18" r="3"/>
                    <circle cx="6" cy="6" r="3"/>
                    <path d="M13 6h3a2 2 0 0 1 2 2v7"/>
                    <line x1="6" y1="9" x2="6" y2="21"/>
                  </svg>
                </div>

                <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                  Review any GitHub PR
                </h2>
                <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: "0 0 28px", lineHeight: 1.7 }}>
                  Paste a pull request URL above for an AI-powered senior&#8209;engineer code review.
                </p>

                {/* feature grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "left" }}>
                  {[
                    { icon: "🐛", title: "Bug detection",   desc: "Logic errors & security issues" },
                    { icon: "💬", title: "Line comments",   desc: "File & line-level feedback" },
                    { icon: "✓",  title: "What's good",    desc: "Acknowledges strong code" },
                  ].map(f => (
                    <div key={f.title} style={{
                      background: "var(--color-background-primary)",
                      border: "1px solid var(--color-border-tertiary)",
                      borderRadius: 9, padding: "12px 12px 11px",
                    }}>
                      <div style={{ fontSize: 16, marginBottom: 5 }}>{f.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* loading skeleton */}
          {isLoading && !hasReview && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
              {[80, 60, 90, 50, 70].map((w, i) => (
                <div key={i} style={{
                  height: 13, width: `${w}%`, borderRadius: 6,
                  background: "var(--color-background-secondary)",
                  animation: `prpulse ${1 + i * 0.1}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
