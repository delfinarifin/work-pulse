# Work Pulse

Work Pulse auto-captures tax and accounting consultants' file-based activity, classifies it by
work type (tax preparation, bookkeeping, audit, advisory, financial reporting) using rule-based
matching, rolls it into daily timesheet entries, and reports time spent by consultant, job role,
and work type — viewable without login in v1.

Built on `vibe-stack-supabase`, a Next.js 15 + Supabase starter.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Actions) |
| Language | TypeScript strict |
| Styles | Tailwind CSS v4 (CSS-first, no config file) |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Package manager | Bun |
| Deploy | Vercel |

## Quick start

```bash
bun install
cp .env.example .env.local   # fill in your Supabase keys
bun dev
```

Open http://localhost:3000. Edit `app/page.tsx` to start building.

## Provisioning a new project

Use the `/new-vibe-project <name>` skill (see `claude-dotfiles` repo) which:
1. Clones this template and renames it
2. Creates a new GitHub repo and pushes
3. Creates a Supabase project and injects URL + anon key
4. Creates a Vercel project linked to the GitHub repo
5. Triggers first deploy and returns the preview URL

## Working with AI

See [CLAUDE.md](CLAUDE.md) for conventions. This repo is pre-wired for gstack — start with `/office-hours`.

## Switching to Neon

If you need Postgres without Supabase (e.g. prefer Drizzle ORM + Clerk for auth), a `vibe-stack-neon` variant is planned. For now: fork this and swap `@supabase/ssr` for `drizzle-orm` + `@neondatabase/serverless`, add Clerk or NextAuth.
