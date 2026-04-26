"use client";

import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { usePRChat } from "@/hooks/usePRChat";
import type { PRReview } from "@/lib/schemas";

const STARTERS = [
  "What's the riskiest change in this PR?",
  "Suggest a fix for the most critical issue",
  "Is this safe to merge right now?",
  "What should I test before merging?",
];

export function PRChatPanel({ prUrl, review, reviewId }: { prUrl: string; review: PRReview; reviewId: string }) {
  const { messages, input, setInput, sendMessage, isLoading } = usePRChat(prUrl, review, reviewId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{
      border: "1px solid var(--color-border-secondary)",
      borderRadius: 10,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: 400,
      background: "var(--color-background-primary)",
    }}>
      {/* header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--color-border-tertiary)",
        background: "var(--color-background-secondary)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
          Chat with this PR
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 10, fontWeight: 500,
          color: "var(--color-text-tertiary)",
          background: "var(--color-background-primary)",
          border: "1px solid var(--color-border-tertiary)",
          padding: "2px 7px", borderRadius: 99,
        }}>
          Gemini Flash
        </span>
      </div>

      {/* messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px 14px 8px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
              Ask anything about this PR — fixes, risks, merge readiness
            </p>
            {STARTERS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  textAlign: "left", padding: "7px 11px", borderRadius: 7,
                  border: "1px solid var(--color-border-secondary)",
                  background: "var(--color-background-secondary)",
                  fontSize: 12, color: "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "84%",
              padding: "9px 12px",
              borderRadius: msg.role === "user"
                ? "10px 10px 2px 10px"
                : "10px 10px 10px 2px",
              background: msg.role === "user"
                ? "#2563EB"
                : "var(--color-background-secondary)",
              color: msg.role === "user" ? "#fff" : "var(--color-text-primary)",
              fontSize: 12,
              lineHeight: 1.65,
              border: msg.role === "assistant"
                ? "1px solid var(--color-border-tertiary)"
                : "none",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {msg.content || (
                <span style={{ opacity: 0.5, fontSize: 16, letterSpacing: 2 }}>···</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid var(--color-border-tertiary)",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Ask about this PR…"
          disabled={isLoading}
          style={{
            flex: 1, height: 34, padding: "0 11px",
            borderRadius: 7,
            border: "1px solid var(--color-border-secondary)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            fontSize: 12, outline: "none",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          style={{
            width: 34, height: 34, borderRadius: 7,
            background: isLoading || !input.trim() ? "var(--color-background-secondary)" : "#2563EB",
            border: "1px solid var(--color-border-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <Send
            size={13}
            color={isLoading || !input.trim() ? "var(--color-text-tertiary)" : "#fff"}
          />
        </button>
      </div>
    </div>
  );
}