"use client";
import { useState, useEffect } from "react";
import { GitPullRequest, Sun, Moon, Search } from "lucide-react";
import { VERDICT_CFG, timeAgo, type HistoryEntry } from "@/lib/constants";
import { UserMenu } from "./UserMenu";

const VERDICT_DOT = {
  approve: "#22C55E",
  request_changes: "#EF4444",
  needs_info: "#F59E0B",
};


interface SidebarProps {
  history: HistoryEntry[];
  selectedUrl: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export function Sidebar({ history, selectedUrl, onSelect }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dw-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("dw-theme", next ? "dark" : "light");
  };

  const filtered = search.trim()
    ? history.filter(h =>
        h.repo.toLowerCase().includes(search.toLowerCase()) ||
        h.prNumber.includes(search.replace("#", ""))
      )
    : history;

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: "#0F172A",
      display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* header */}
      <div style={{
        padding: "14px 14px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 9,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: "#2563EB",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <GitPullRequest size={14} color="#fff" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", flex: 1 }}>
          DiffWatch
        </span>
        <button onClick={toggleDark} title={dark ? "Light mode" : "Dark mode"} style={{
          background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6,
          color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center",
          transition: "color 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* search */}
      <div style={{ padding: "10px 10px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7, padding: "0 9px", height: 30,
        }}>
          <Search size={11} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repos…"
            style={{
              background: "none", border: "none", outline: "none", flex: 1,
              fontSize: 12, color: "rgba(255,255,255,0.7)",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* history list */}
      <div style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.09em", textTransform: "uppercase",
          padding: "6px 8px 8px",
        }}>
          {search ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "Recent"}
        </div>

        {filtered.length === 0 && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "4px 8px", lineHeight: 1.6 }}>
            {search ? "No matches." : "No reviews yet."}
          </p>
        )}

        {filtered.map(h => {
          const isActive = selectedUrl === h.prUrl;
          const dot = VERDICT_DOT[h.review.verdict];
          const cfg = VERDICT_CFG[h.review.verdict];
          return (
            <button
              key={h.prUrl}
              onClick={() => onSelect(h)}
              style={{
                width: "100%", textAlign: "left",
                padding: "9px 10px", borderRadius: 7, marginBottom: 2,
                background: isActive ? "rgba(37,99,235,0.18)" : "transparent",
                border: `1px solid ${isActive ? "rgba(37,99,235,0.35)" : "transparent"}`,
                cursor: "pointer", transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{
                fontSize: 12, fontWeight: 600, marginBottom: 2,
                color: isActive ? "#93C5FD" : "rgba(255,255,255,0.75)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {h.repo}
              </div>
              <div style={{ fontSize: 11, color: isActive ? "#60A5FA" : "rgba(255,255,255,0.3)", marginBottom: 7 }}>
                #{h.prNumber} · {timeAgo(h.reviewedAt)}
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                background: isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      <UserMenu />
    </aside>
  );
}
