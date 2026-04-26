"use client";
import { useState } from "react";
import { X, Bell, BookOpen, ExternalLink } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import Image from "next/image";

const TABS = ["Notifications", "Custom Rules"] as const;
type Tab = typeof TABS[number];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, loading, save } = useSettings();
  const [tab, setTab] = useState<Tab>("Notifications");
  const [draft, setDraft] = useState<typeof settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = draft ?? settings;

  const handleSave = async () => {
    setSaving(true);
    await save(current);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const testWebhook = async (url: string, type: "slack" | "discord") => {
    if (!url) return;
    const payload = type === "slack"
      ? { text: "✅ DiffWatch notification test — webhooks are working!" }
      : { content: "✅ DiffWatch notification test — webhooks are working!" };
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 36, padding: "0 11px",
    borderRadius: 7, fontSize: 13,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)", outline: "none",
    fontFamily: "var(--font-mono, monospace)",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 520, background: "var(--color-background-primary)",
        borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        border: "1px solid var(--color-border-secondary)",
        overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--color-border-tertiary)",
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Settings
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6,
            color: "var(--color-text-tertiary)", display: "flex", alignItems: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        {/* tabs */}
        <div style={{
          display: "flex", gap: 4, padding: "12px 20px 0",
          borderBottom: "1px solid var(--color-border-tertiary)",
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 14px", borderRadius: "7px 7px 0 0", fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#2563EB" : "var(--color-text-tertiary)",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: tab === t ? "2px solid #2563EB" : "2px solid transparent",
              marginBottom: -1, transition: "color 0.15s",
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* body */}
        <div style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {loading ? (
            <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", padding: "16px 0" }}>Loading…</p>
          ) : tab === "Notifications" ? (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <Image src="/slack.svg" alt="Slack logo" width={13} height={13} /> Slack webhook URL
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={inputStyle}
                    placeholder="https://hooks.slack.com/services/..."
                    value={current.slackWebhook}
                    onChange={e => setDraft({ ...current, slackWebhook: e.target.value })}
                  />
                  <button
                    onClick={() => testWebhook(current.slackWebhook, "slack")}
                    disabled={!current.slackWebhook}
                    style={{
                      height: 36, padding: "0 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                      color: "var(--color-text-secondary)",
                      cursor: current.slackWebhook ? "pointer" : "not-allowed",
                      opacity: current.slackWebhook ? 1 : 0.45, whiteSpace: "nowrap",
                    }}
                  >
                    Test
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>
                  Sent automatically after every review. <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer" style={{ color: "#2563EB", display: "inline-flex", alignItems: "center", gap: 2 }}>Get a webhook <ExternalLink size={10} /></a>
                </p>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <Image src="/discord.svg" alt="Discord logo" width={13} height={13} /> Discord webhook URL
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={inputStyle}
                    placeholder="https://discord.com/api/webhooks/..."
                    value={current.discordWebhook}
                    onChange={e => setDraft({ ...current, discordWebhook: e.target.value })}
                  />
                  <button
                    onClick={() => testWebhook(current.discordWebhook, "discord")}
                    disabled={!current.discordWebhook}
                    style={{
                      height: 36, padding: "0 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                      color: "var(--color-text-secondary)",
                      cursor: current.discordWebhook ? "pointer" : "not-allowed",
                      opacity: current.discordWebhook ? 1 : 0.45, whiteSpace: "nowrap",
                    }}
                  >
                    Test
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                <BookOpen size={13} /> Custom review rules
              </label>
              <textarea
                style={{
                  ...inputStyle, height: 180, padding: "10px 11px",
                  resize: "vertical", lineHeight: 1.65,
                  fontFamily: "var(--font-mono, monospace)",
                }}
                placeholder={"- Always flag console.log statements in production code\n- Check for missing error handling in async functions\n- Flag any TODO or FIXME comments\n- Ensure all new functions have type annotations"}
                value={current.customRules}
                onChange={e => setDraft({ ...current, customRules: e.target.value })}
              />
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>
                These rules are injected verbatim into every review prompt. One rule per line works best.
              </p>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid var(--color-border-tertiary)",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button onClick={onClose} style={{
            height: 34, padding: "0 16px", borderRadius: 7, fontSize: 13,
            background: "var(--color-background-secondary)",
            border: "1px solid var(--color-border-secondary)",
            color: "var(--color-text-secondary)", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            height: 34, padding: "0 18px", borderRadius: 7, fontSize: 13, fontWeight: 600,
            background: saved ? "#16A34A" : "#2563EB", color: "#fff",
            border: "none", cursor: "pointer", transition: "background 0.2s",
            minWidth: 72,
          }}>
            {saving ? "Saving…" : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
