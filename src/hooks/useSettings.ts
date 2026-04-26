"use client";
import { useState, useEffect, useCallback } from "react";

export interface Settings {
  slackWebhook: string;
  discordWebhook: string;
  customRules: string;
}

const DEFAULTS: Settings = { slackWebhook: "", discordWebhook: "", customRules: "" };

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => setSettings({
        slackWebhook: data.slack_webhook ?? "",
        discordWebhook: data.discord_webhook ?? "",
        customRules: data.custom_rules ?? "",
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: Partial<Settings>) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slack_webhook: merged.slackWebhook,
        discord_webhook: merged.discordWebhook,
        custom_rules: merged.customRules,
      }),
    }).catch(() => {});
    return merged;
  }, [settings]);

  return { settings, loading, save };
}
