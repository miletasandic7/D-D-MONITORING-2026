---
name: Vercel port scope check
description: How to correctly scope a "port imported Vercel app" task — don't assume Next.js or over-strip integrations.
---

An imported "Vercel app" is not always Next.js. Before planning conversion work, run the fullstack-detect script and actually open a page/component file to confirm — some imports are plain Vite+React apps with hand-written Express-style API routes that only ever ran on Vercel's hosting, not its framework.

The port guide's instruction to "remove hosted-platform shims" refers to Vercel/Next.js-specific patterns (file routing, `next/image`, `next/link`, SSR data fetching, `next.config`). It does **not** mean stripping legitimate third-party integrations the original app chose, such as Supabase auth or PayPal Buttons checkout — those should be preserved as-is and just re-pointed at the ported backend routes.

**Why:** Treating every Vercel import as a Next.js conversion (or over-zealously removing third-party SDKs) causes unnecessary rewrites and can silently drop working features that have nothing to do with Vercel/Next.js.

**How to apply:** When porting an imported app, read the actual source before deciding scope. If it's plain Vite+React with Express-style routes already, the job is "move these routes into `artifacts/api-server` and wire secrets," not "convert Next.js routing."
