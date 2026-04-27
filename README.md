# DiffWatch

Senior-engineer quality code reviews for any GitHub PR — in under 15 seconds.

Paste a pull request URL. Get back a full review: verdict, line-level comments, security scan, CI context, bundle impact, and a chat interface to ask follow-up questions. No setup, no waiting for a human reviewer.

## What it does

- **AI review** — Gemini 2.5 Flash reads the diff, CI results, linked issues, and dependency graph in parallel and returns a structured verdict with file-level and line-level comments
- **Security scan** — queries OSV.dev for CVEs in every new or modified dependency
- **Bundle impact** — flags packages over 50kb gzipped via Bundlephobia before they quietly bloat your bundle
- **CI context** — knows if your checks are failing and leads with that in the summary
- **Merge conflict radar** — checks other open PRs in the same repo and warns you about file overlaps before you merge
- **Code archaeology** — shows commit history per file: how many authors touched it, when it was last changed, whether it's a hotspot
- **Time bomb detector** — surfaces TODOs, `console.log`, `@ts-ignore`, hardcoded dates, and `eslint-disable` added in the diff
- **Persona reactor** — get the same PR reviewed through four lenses: Architect, Security Lead, PM, and Intern
- **Ship it** — one-click generate a Slack-ready deployment announcement from the review
- **Chat** — ask follow-up questions about any PR ("what's the riskiest change?", "is this safe to merge?")
- **Risk radar + treemap + scatter map** — dense visualizations showing where complexity and issues cluster

## Stack

- Next.js 16 (App Router)
- Gemini 2.5 Flash via `@ai-sdk/google`
- GitHub REST API
- OSV.dev + Bundlephobia for dependency analysis
- Supabase for auth and review persistence
- Recharts for visualizations
- Sonner for toasts

## Running locally

```bash
git clone https://github.com/your-username/pr-review-agent
cd pr-review-agent
npm install
```

Copy `.env.local.example` to `.env.local` and fill in the values:

```env
GITHUB_TOKEN=ghp_...
GOOGLE_GENERATIVE_AI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The GitHub token needs `repo` scope for private repos, or no scope for public ones. The Supabase project needs a `reviews` table and `user_settings` table — SQL migrations are in `/supabase`.

## License

MIT
