import { SignInButton } from "@/components/SignInButton";
import {
  GitPullRequest, ShieldCheck, Package, Cpu,
  Users, MessageSquare, Zap, Lock,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Zap,
    title: "15-second reviews",
    desc: "Full AI review in under 15 seconds — faster than opening Slack to ping your reviewer.",
    color: "#F59E0B",
  },
  {
    Icon: ShieldCheck,
    title: "Security scanning",
    desc: "Automatically queries the OSV.dev database for CVEs in every new dependency.",
    color: "#10B981",
  },
  {
    Icon: Package,
    title: "Bundle impact",
    desc: "Flags packages over 50kb gzipped before they quietly bloat your production bundle.",
    color: "#6366F1",
  },
  {
    Icon: Cpu,
    title: "CI context-aware",
    desc: "The review knows if your tests are failing and leads with that in the summary.",
    color: "#3B82F6",
  },
  {
    Icon: Users,
    title: "Team style learning",
    desc: "Reads your last 50 review comments and mirrors your team's tone and top concerns.",
    color: "#EC4899",
  },
  {
    Icon: MessageSquare,
    title: "Chat with any PR",
    desc: "\"What's the riskiest change?\" → get a line-specific answer in seconds.",
    color: "#8B5CF6",
  },
];

const STEPS = [
  { n: "1", title: "Paste a PR URL", body: "Any public or private GitHub pull request you have access to." },
  { n: "2", title: "AI reviews in 15s", body: "Gemini 2.5 Flash reads the diff, CI results, linked issues, and dependency graph in parallel." },
  { n: "3", title: "Ask follow-ups", body: "Chat directly with the review. Ask for fixes, risk assessments, or merge recommendations." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080B12", color: "#fff", fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>

      {/* nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 60,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,11,18,0.85)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GitPullRequest size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>DiffWatch</span>
        </div>
        <SignInButton />
      </nav>

      {/* hero */}
      <section style={{
        padding: "96px 40px 80px",
        maxWidth: 960, margin: "0 auto",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px 5px 10px", borderRadius: 99,
          background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)",
          fontSize: 12, fontWeight: 500, color: "#93C5FD",
          marginBottom: 32, letterSpacing: "0.01em",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} />
          Free — powered by Gemini 2.5 Flash &amp; GitHub API
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 800,
          letterSpacing: "-0.04em", lineHeight: 1.06,
          margin: "0 0 24px",
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.55) 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Stop waiting<br />for code reviews.
        </h1>

        <p style={{
          fontSize: "clamp(16px, 2vw, 19px)", color: "rgba(255,255,255,0.5)",
          lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px",
          fontWeight: 400,
        }}>
          Get senior-engineer quality reviews on any GitHub PR in under 15 seconds —
          with security scanning, CI context, and follow-up chat.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <SignInButton />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            No credit card. Free tier only. Under 15 seconds.
          </p>
        </div>
      </section>

      {/* features */}
      <section style={{
        padding: "0 40px 96px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            What it does
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff", margin: 0 }}>
            Everything a senior engineer checks
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {FEATURES.map(({ Icon, title, desc, color }) => (
            <div key={title} style={{
              padding: "24px", borderRadius: 14,
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.07)",
              transition: "border-color 0.2s",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                <Icon size={17} color={color} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>
                {title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section style={{
        padding: "80px 40px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            How it works
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 56px" }}>
            Three steps to a better review
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "left" }}>
            {STEPS.map(({ n, title, body }) => (
              <div key={n} style={{
                padding: "24px 24px 28px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: "#2563EB",
                  marginBottom: 14, letterSpacing: "0.02em",
                }}>
                  {n.padStart(2, "0")}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section style={{
        padding: "80px 40px",
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Lock size={20} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 12px" }}>
          Ready to review smarter?
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.65 }}>
          Sign in with GitHub to get started. No configuration required.
        </p>
        <SignInButton />
      </section>

      {/* footer */}
      <footer style={{
        padding: "24px 40px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GitPullRequest size={11} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>DiffWatch</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Built with Gemini 2.5 Flash · GitHub API · OSV.dev · Bundlephobia
        </p>
      </footer>
    </div>
  );
}
