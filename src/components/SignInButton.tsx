"use client";

import { createClient } from "@/lib/supabase/browser";

export function SignInButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <button onClick={handleSignIn} className={className} style={{
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0D0D12">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      {children ?? "Continue with GitHub"}
    </button>
  );
}
