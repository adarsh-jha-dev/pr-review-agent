"use client";
import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import { reviewToMarkdown, downloadMarkdown, copyToClipboard } from "@/lib/export";
import { parseRepo } from "@/lib/constants";
import type { PRReview } from "@/lib/schemas";

export function ExportButton({ review, prUrl }: { review: PRReview; prUrl: string }) {
  const [copied, setCopied] = useState(false);
  const { repo, prNumber } = parseRepo(prUrl);
  const md = reviewToMarkdown(review, prUrl);

  const handleDownload = () =>
    downloadMarkdown(md, `${repo.replace("/", "-")}-pr-${prNumber}-review.md`);

  const handleCopy = async () => {
    await copyToClipboard(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    height: 30, padding: "0 12px", borderRadius: 6,
    fontSize: 12, fontWeight: 500,
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-secondary)",
    cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={handleDownload} style={{ ...btnBase, color: "var(--color-text-secondary)" }}>
        <Download size={12} />
        Export MD
      </button>
      <button onClick={handleCopy} style={{
        ...btnBase,
        color: copied ? "#16A34A" : "var(--color-text-secondary)",
        borderColor: copied ? "#BBF7D0" : "var(--color-border-secondary)",
      }}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy MD"}
      </button>
    </div>
  );
}
