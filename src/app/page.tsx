"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { reviewSchema, type PRReview } from "@/lib/schemas";
import { parseRepo, loadHistory, saveHistory, SEV, type Severity, type HistoryEntry } from "@/lib/constants";

import { Sidebar } from "@/components/Sidebar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { MetricCard } from "@/components/MetricCard";
import { SectionLabel } from "@/components/SectionLabel";
import { StreamingDot } from "@/components/StreamingDot";
import { CommentCard } from "@/components/CommentCard";
import { DiffHeatmap } from "@/components/DiffHeatmap";
import { ReviewBadge } from "@/components/ReviewBadge";
import { EmptyState } from "@/components/EmptyState";
import { CIChecksPanel } from "@/components/CIChecksPanel";
import { VulnerabilitiesPanel } from "@/components/VulnerabilitiesPanel";
import { ExportButton } from "@/components/ExportButton";

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleSelectHistory = (entry: HistoryEntry) => {
    setSelected(entry);
    setPrUrl(entry.prUrl);
  };

  const review    = (selected?.review ?? object ?? {}) as Partial<PRReview>;
  const { repo, prNumber } = prUrl ? parseRepo(prUrl) : { repo: "", prNumber: "" };
  const hasReview = !!(review.summary || review.verdict);

  const counts = {
    critical:   review.comments?.filter(c => c.severity === "critical").length   ?? 0,
    warning:    review.comments?.filter(c => c.severity === "warning").length    ?? 0,
    suggestion: review.comments?.filter(c => c.severity === "suggestion").length ?? 0,
    praise:     review.comments?.filter(c => c.severity === "praise").length     ?? 0,
  };

  const filtered       = review.comments?.filter(c => activeSevs.has(c.severity as Severity)) ?? [];
  const uniqueFileCount = [...new Set(review.comments?.map(c => c.file))].length;

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
        <Sidebar history={history} selectedUrl={selected?.prUrl ?? null} onSelect={handleSelectHistory} />

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
                      <circle cx="6" cy="6" r="4.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                      <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
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
              {/* PR header */}
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 12, paddingBottom: 20, borderBottom: "1px solid var(--color-border-tertiary)",
                flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3, letterSpacing: "-0.02em" }}>
                    {repo}
                    <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}> #{prNumber}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                    {review.comments?.length ?? 0} comment{(review.comments?.length ?? 0) !== 1 ? "s" : ""} across{" "}
                    {uniqueFileCount} file{uniqueFileCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {review.verdict && selected?.review && (
                    <ReviewBadge verdict={review.verdict} criticalCount={counts.critical} />
                  )}
                  {review.verdict && <VerdictBadge v={review.verdict} />}
                </div>
              </div>

              {/* export buttons — only shown once streaming is done */}
              {selected?.review && !isLoading && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <ExportButton review={selected.review} prUrl={prUrl} />
                </div>
              )}

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

              {/* CI checks */}
              {review.ciChecks && review.ciChecks.length > 0 && (
                <CIChecksPanel checks={review.ciChecks} />
              )}

              {/* vulnerabilities */}
              {review.vulnerabilities && review.vulnerabilities.length > 0 && (
                <VulnerabilitiesPanel vulnerabilities={review.vulnerabilities} />
              )}

              {/* diff heatmap */}
              {review.changedFiles && review.changedFiles.length > 0 && (
                <DiffHeatmap files={review.changedFiles} />
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
                        <Check size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
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
                        const on  = activeSevs.has(s);
                        const cfg = SEV[s];
                        return (
                          <div
                            key={s}
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
                      <CommentCard
                        key={i}
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
          {!hasReview && !isLoading && !error && <EmptyState />}

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
