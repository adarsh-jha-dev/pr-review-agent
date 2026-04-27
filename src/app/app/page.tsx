"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Settings, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { reviewSchema, type PRReview } from "@/lib/schemas";
import { parseRepo, SEV, type Severity, type HistoryEntry } from "@/lib/constants";
import { notifySlack, notifyDiscord } from "@/lib/notify";
import { useSettings } from "@/hooks/useSettings";

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
import { PRChatPanel } from "@/components/PRChatPanel";
import { BundleImpactPanel } from "@/components/BundleImpactPanel";
import { VoiceButton } from "@/components/VoiceButton";
import { SettingsModal } from "@/components/SettingsModal";
import { StatsPanel } from "@/components/StatsPanel";
import { RiskRadarChart } from "@/components/RiskRadarChart";
import { FileRiskTreemap } from "@/components/FileRiskTreemap";
import { IssueScatterMap } from "@/components/IssueScatterMap";
import { MergeConflictPanel } from "@/components/MergeConflictPanel";
import { ArchaeologyPanel } from "@/components/ArchaeologyPanel";
import { TimeBombPanel } from "@/components/TimeBombPanel";
import { PersonaPanel } from "@/components/PersonaPanel";
import { ShipItModal } from "@/components/ShipItModal";

export default function AppPage() {
  const [prUrl, setPrUrl]         = useState("");
  const [activeSevs, setActiveSevs] = useState<Set<Severity>>(new Set(["critical", "warning", "suggestion", "praise"]));
  const [history, setHistory]     = useState<HistoryEntry[]>([]);
  const [selected, setSelected]   = useState<HistoryEntry | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats]       = useState(false);

  const { settings } = useSettings();
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setHistory(data) : null)
      .catch(() => {});
  }, []);

  const { object, submit, isLoading } = useObject({
    api: "/api/review",
    schema: reviewSchema,
    onFinish({ object: finished }) {
      if (!finished || !prUrl) return;
      const { repo, prNumber } = parseRepo(prUrl);
      const reviewedAt = Date.now();

      const verdict = finished.verdict;
      toast.success("Review complete", {
        description: verdict === "approve"
          ? "Looks good to merge."
          : verdict === "request_changes"
          ? "Changes requested — check the comments."
          : "Needs more info before merging.",
      });

      fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl, repo, prNumber, review: finished, reviewedAt }),
      })
        .then(r => r.json())
        .then(({ id }) => {
          const entry: HistoryEntry = { id, prUrl, repo, prNumber, review: finished as PRReview, reviewedAt };
          setHistory(prev => [entry, ...prev.filter(h => h.prUrl !== prUrl)]);
          setSelected(entry);
        })
        .catch(() => toast.error("Couldn't save review to history"));

      // send notifications if webhooks configured
      const { slackWebhook, discordWebhook } = settingsRef.current;
      if (slackWebhook) notifySlack(slackWebhook, finished as PRReview, prUrl).catch(() => toast.error("Slack notification failed"));
      if (discordWebhook) notifyDiscord(discordWebhook, finished as PRReview, prUrl).catch(() => toast.error("Discord notification failed"));
    },
    onError(err) {
      toast.error("Review failed", {
        description: err instanceof Error ? err.message : "Check the PR URL and try again.",
      });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
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

  const review    = (selected?.review ?? object ?? {}) as Partial<PRReview>;
  const { repo, prNumber } = prUrl ? parseRepo(prUrl) : { repo: "", prNumber: "" };
  const hasReview = !!(review.summary || review.verdict);

  const counts = {
    critical:   review.comments?.filter(c => c.severity === "critical").length   ?? 0,
    warning:    review.comments?.filter(c => c.severity === "warning").length    ?? 0,
    suggestion: review.comments?.filter(c => c.severity === "suggestion").length ?? 0,
    praise:     review.comments?.filter(c => c.severity === "praise").length     ?? 0,
  };

  const filtered        = review.comments?.filter(c => activeSevs.has(c.severity as Severity)) ?? [];
  const uniqueFileCount = [...new Set(review.comments?.map(c => c.file))].length;

  return (
    <>
      <style>{`
        @keyframes prpulse { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes prspin  { to { transform: rotate(360deg); } }
        @keyframes prslide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

        .pr-input {
          flex: 1; height: 40px;
          border: 1.5px solid var(--color-border-secondary);
          border-radius: 9px; padding: 0 14px; font-size: 13px;
          color: var(--color-text-primary);
          background: var(--color-background-primary);
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .pr-input:focus { border-color: #93C5FD; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .pr-input::placeholder { color: var(--color-text-tertiary); }

        .pr-btn {
          height: 40px; padding: 0 18px; border-radius: 9px;
          background: #2563EB; color: #fff;
          font-size: 13px; font-weight: 600; border: none; cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
          white-space: nowrap; letter-spacing: -0.01em;
        }
        .pr-btn:hover:not(:disabled) { background: #1D4ED8; box-shadow: 0 2px 8px rgba(37,99,235,0.4); transform: translateY(-1px); }
        .pr-btn:disabled { background: #93C5FD; cursor: not-allowed; transform: none; }

        .pr-icon-btn {
          height: 40px; padding: 0 12px; border-radius: 9px;
          background: var(--color-background-primary);
          border: 1.5px solid var(--color-border-secondary);
          color: var(--color-text-tertiary);
          font-size: 13px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: border-color 0.15s, color 0.15s, transform 0.1s;
        }
        .pr-icon-btn:hover { border-color: var(--color-border-primary); color: var(--color-text-secondary); transform: translateY(-1px); }

        .pr-filter-pill {
          cursor: pointer; user-select: none;
          transition: opacity 0.15s, transform 0.1s;
        }
        .pr-filter-pill:hover { opacity: 0.8; transform: translateY(-1px); }

        .pr-section { animation: prslide 0.25s ease forwards; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background)" }}>
        <Sidebar history={history} selectedUrl={selected?.prUrl ?? null} onSelect={e => { setSelected(e); setPrUrl(e.prUrl); }} />

        <main style={{
          flex: 1, padding: "24px 32px",
          display: "flex", flexDirection: "column", gap: 20,
          minWidth: 0, overflowY: "auto", maxHeight: "100vh",
        }}>

          {/* toolbar */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flex: 1 }}>
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
            <button className="pr-icon-btn" onClick={() => setShowStats(true)} title="Statistics">
              <BarChart2 size={14} />
            </button>
            <button className="pr-icon-btn" onClick={() => setShowSettings(true)} title="Settings">
              <Settings size={14} />
            </button>
          </div>

          {/* error */}
          {hasReview && (
            <>
              {/* PR header */}
              <div className="pr-section" style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 12, paddingBottom: 18, borderBottom: "1px solid var(--color-border-tertiary)", flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4, letterSpacing: "-0.025em" }}>
                    {repo}<span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}> #{prNumber}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                    {review.comments?.length ?? 0} comment{(review.comments?.length ?? 0) !== 1 ? "s" : ""} · {uniqueFileCount} file{uniqueFileCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {review.verdict && selected?.review && <ReviewBadge verdict={review.verdict} criticalCount={counts.critical} />}
                  {review.verdict && <VerdictBadge v={review.verdict} />}
                </div>
              </div>

              {/* export + ship it */}
              {selected?.review && !isLoading && (
                <div className="pr-section" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <ShipItModal prUrl={prUrl} review={selected.review} prTitle={`${repo} #${prNumber}`} />
                  <ExportButton review={selected.review} prUrl={prUrl} />
                </div>
              )}

              {/* metrics */}
              <div className="pr-section" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <MetricCard label="Critical"    value={counts.critical}   color="#DC2626" accent="#FEE2E2" />
                <MetricCard label="Warnings"    value={counts.warning}    color="#D97706" accent="#FEF3C7" />
                <MetricCard label="Suggestions" value={counts.suggestion} color="#2563EB" accent="#DBEAFE" />
                <MetricCard label="Praise"      value={counts.praise}     color="#16A34A" accent="#DCFCE7" />
              </div>

              {/* risk radar + file treemap side by side */}
              {review.changedFiles && review.changedFiles.length > 0 && (
                <div className="pr-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{
                    background: "var(--color-background-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: 10, padding: "14px 16px",
                  }}>
                    <RiskRadarChart review={review} files={review.changedFiles} />
                  </div>
                  <div style={{
                    background: "var(--color-background-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: 10, padding: "14px 16px",
                  }}>
                    <FileRiskTreemap files={review.changedFiles} review={review} />
                  </div>
                </div>
              )}

              {/* summary + voice */}
              {review.summary && (
                <div className="pr-section">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <SectionLabel>Summary</SectionLabel>
                    <VoiceButton text={review.summary} />
                  </div>
                  <div style={{
                    background: "var(--color-background-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderLeft: "3px solid #2563EB",
                    borderRadius: 10, padding: "16px 18px",
                    fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.8,
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    {review.summary}{isLoading && <StreamingDot />}
                  </div>
                </div>
              )}

              {review.ciChecks && review.ciChecks.length > 0 && (
                <div className="pr-section"><CIChecksPanel checks={review.ciChecks} /></div>
              )}

              {review.mergeConflictRisks && review.mergeConflictRisks.length > 0 && (
                <div className="pr-section"><MergeConflictPanel risks={review.mergeConflictRisks} /></div>
              )}

              {review.timeBombs && review.timeBombs.length > 0 && (
                <div className="pr-section"><TimeBombPanel bombs={review.timeBombs} /></div>
              )}

              {review.vulnerabilities && review.vulnerabilities.length > 0 && (
                <div className="pr-section"><VulnerabilitiesPanel vulnerabilities={review.vulnerabilities} /></div>
              )}

              {review.bundleImpact && review.bundleImpact.length > 0 && (
                <div className="pr-section"><BundleImpactPanel packages={review.bundleImpact} /></div>
              )}

              {review.changedFiles && review.changedFiles.length > 0 && (
                <div className="pr-section"><DiffHeatmap files={review.changedFiles} /></div>
              )}

              {review.archaeology && review.archaeology.length > 0 && (
                <div className="pr-section"><ArchaeologyPanel entries={review.archaeology} /></div>
              )}

              {/* issue scatter map */}
              {review.comments && review.comments.length > 0 && review.changedFiles && (
                <div className="pr-section" style={{
                  background: "var(--color-background-primary)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: 10, padding: "14px 16px",
                }}>
                  <IssueScatterMap review={review} files={review.changedFiles} />
                </div>
              )}

              {/* positives */}
              {review.positives && review.positives.length > 0 && (
                <div className="pr-section">
                  <SectionLabel>What&apos;s good</SectionLabel>
                  <div style={{
                    background: "var(--color-background-primary)",
                    border: "1px solid #BBF7D0", borderLeft: "3px solid #16A34A",
                    borderRadius: 10, padding: "14px 18px",
                    display: "flex", flexDirection: "column", gap: 9,
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    {review.positives.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#166534" }}>
                        <Check size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* comments */}
              {review.comments && review.comments.length > 0 && (
                <div className="pr-section">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <SectionLabel>Comments ({review.comments.length})</SectionLabel>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(["critical", "warning", "suggestion", "praise"] as Severity[]).map(s => {
                        const on = activeSevs.has(s);
                        const cfg = SEV[s];
                        return (
                          <div key={s} className="pr-filter-pill" onClick={() => toggleSev(s)} style={{
                            fontSize: 11, padding: "3px 11px", borderRadius: 99, fontWeight: 600,
                            border: `1px solid ${on ? cfg.border : "var(--color-border-secondary)"}`,
                            background: on ? cfg.bg : "var(--color-background-primary)",
                            color: on ? cfg.text : "var(--color-text-tertiary)",
                          }}>
                            {cfg.label}{counts[s] > 0 ? ` · ${counts[s]}` : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map((c, i) => (
                      <CommentCard key={i} file={c.file} line={c.line} severity={c.severity as Severity} message={c.message} />
                    ))}
                    {filtered.length === 0 && (
                      <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", padding: "8px 0" }}>
                        No comments match the selected filters.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* team style */}
              {review.teamStyleConcerns && review.teamStyleConcerns.length > 0 && (
                <div className="pr-section" style={{
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                  padding: "10px 14px", borderRadius: 9,
                  background: "var(--color-background-secondary)",
                  border: "1px solid var(--color-border-tertiary)",
                  fontSize: 11,
                }}>
                  <span style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}>Style learned from this repo:</span>
                  {review.teamStyleConcerns.map(c => (
                    <span key={c} style={{
                      padding: "2px 9px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                      background: "var(--color-background-primary)",
                      border: "1px solid var(--color-border-secondary)",
                      color: "var(--color-text-secondary)",
                    }}>{c}</span>
                  ))}
                </div>
              )}

              {/* persona reactor */}
              {selected?.review && !isLoading && (
                <div className="pr-section">
                  <PersonaPanel prUrl={prUrl} />
                </div>
              )}

              {selected?.review && !isLoading && (
                <div className="pr-section">
                  <PRChatPanel prUrl={prUrl} review={selected.review} reviewId={selected.id} />
                </div>
              )}
            </>
          )}

          {!hasReview && !isLoading && <EmptyState />}

          {isLoading && !hasReview && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
              {[75, 55, 85, 45, 65].map((w, i) => (
                <div key={i} style={{
                  height: 13, width: `${w}%`, borderRadius: 7,
                  background: "var(--color-background-secondary)",
                  animation: `prpulse ${1 + i * 0.12}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          )}
        </main>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showStats    && <StatsPanel history={history} onClose={() => setShowStats(false)} />}
    </>
  );
}
