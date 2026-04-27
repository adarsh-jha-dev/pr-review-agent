"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";

interface Props { onClose: () => void; }

type Mode = "signin" | "signup";

export function AuthModal({ onClose }: Props) {
  const [mode, setMode]           = useState<Mode>("signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState<string | null>(null);

  const supabase = createClient();

  async function oAuth(provider: "github" | "google") {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
    setLoading(null);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading("email");
    const { error } = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });

    if (error) {
      toast.error(error.message);
    } else if (mode === "signup") {
      toast.success("Check your email to confirm your account.");
      onClose();
    }
    setLoading(null);
  }

  const busy = loading !== null;

  const overlay = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 400, background: "#fff", borderRadius: 16,
        boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
        overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0D0D12", letterSpacing: "-0.025em" }}>
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: "#9CA3AF", display: "flex", borderRadius: 6,
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* OAuth buttons */}
          <button
            onClick={() => oAuth("github")}
            disabled={busy}
            style={{
              width: "100%", height: 42, borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#0D0D12", color: "#fff",
              border: "none", cursor: busy ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, opacity: loading === "github" ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
          </button>

          <button
            onClick={() => oAuth("google")}
            disabled={busy}
            style={{
              width: "100%", height: 42, borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#fff", color: "#0D0D12",
              border: "1px solid #E5E7EB",
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, opacity: loading === "google" ? 0.7 : 1,
              transition: "opacity 0.15s, box-shadow 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading === "google" ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          </div>

          {/* email + password form */}
          <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} color="#9CA3AF" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: "100%", height: 38, borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    paddingLeft: 32, paddingRight: 12,
                    fontSize: 13, color: "#0D0D12",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#2563EB")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    width: "100%", height: 38, borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    paddingLeft: 12, paddingRight: 36,
                    fontSize: 13, color: "#0D0D12",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#2563EB")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: "#9CA3AF", display: "flex",
                  }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%", height: 40, borderRadius: 9, marginTop: 2,
                background: "#2563EB", color: "#fff",
                border: "none", cursor: busy ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600,
                opacity: loading === "email" ? 0.7 : 1,
                transition: "opacity 0.15s, background 0.15s",
              }}
            >
              {loading === "email"
                ? "Please wait…"
                : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* toggle mode */}
          <p style={{ fontSize: 12, color: "#6B7280", textAlign: "center", margin: 0 }}>
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#2563EB", fontWeight: 600, fontSize: 12, padding: 0,
              }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(overlay, document.body) : null;
}
