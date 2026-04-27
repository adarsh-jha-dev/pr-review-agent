"use client";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

export function SignInButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className}
        style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "0 24px", height: 44, borderRadius: 10,
          background: "#fff", color: "#0D0D12",
          fontSize: 14, fontWeight: 600,
          border: "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer",
          transition: "transform 0.15s, box-shadow 0.15s",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.1)"; }}
      >
        {children ?? "Get started"}
      </button>
      {open && <AuthModal onClose={() => setOpen(false)} />}
    </>
  );
}
