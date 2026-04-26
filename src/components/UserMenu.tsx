"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (!user) return null;

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const name   = (user.user_metadata?.user_name ?? user.user_metadata?.name ?? user.email ?? "") as string;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "10px 14px",
      borderTop: "1px solid rgba(255,255,255,0.07)",
    }}>
      {avatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={avatar} alt={name} width={26} height={26}
          style={{ borderRadius: "50%", flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "#2563EB",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {name[0]?.toUpperCase()}
        </div>
      )}

      <span style={{
        fontSize: 12, fontWeight: 500,
        color: "rgba(255,255,255,0.65)",
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {name}
      </span>

      <button onClick={handleSignOut} title="Sign out" style={{
        background: "none", border: "none", cursor: "pointer",
        color: "rgba(255,255,255,0.35)", padding: 4, borderRadius: 5,
        display: "flex", alignItems: "center",
        transition: "color 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
