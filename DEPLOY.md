# Deploying outside Replit (Render + Firebase + Neon)

This project's default, zero-extra-accounts deploy is Replit's own Publish
feature (frontend, backend, and DB together). This doc covers the alternative
split-hosting setup: **backend on Render, frontend on Firebase Hosting,
database on Neon.** You'll need accounts on all three plus the repo pushed to
GitHub — Replit can prep the code but can't create those accounts for you.

## 1. Database — Neon

1. Create a Neon project and a Postgres database.
2. Copy the pooled connection string (`postgresql://...`).
3. Run the schema against it once, from your local machine or Replit shell:
   ```
   DATABASE_URL="<your neon connection string>" pnpm --filter @workspace/db run push
   ```

## 2. Backend — Render

1. Push this repo to GitHub (see below).
2. In Render: **New → Blueprint**, point it at the repo. Render reads
   `render.yaml` at the repo root and provisions a Node web service named
   `committee-manager-api`.
3. In the Render dashboard, set the `DATABASE_URL` environment variable to
   your Neon connection string (left out of `render.yaml` on purpose so it's
   never committed). `render.yaml` already sets `DB_SSL_MODE=require`, which
   makes `lib/db/src/index.ts` use verified TLS — required by Neon.
4. Render sets `PORT` automatically; the server already reads it
   (`artifacts/api-server/src/index.ts`).
5. Once deployed, note the public URL, e.g. `https://committee-manager-api.onrender.com`.
6. Once you know your Firebase domain, set `CORS_ORIGIN` in the Render
   dashboard to it (e.g. `https://<your-firebase-app>.web.app`) to restrict
   the API to that origin — `artifacts/api-server/src/app.ts` reads this env
   var and locks down CORS accordingly. Left unset, CORS stays open (fine for
   initial testing, not recommended long-term).

## 3. Frontend — Firebase Hosting

1. Install the Firebase CLI locally and run `firebase login` (outside Replit —
   the CLI needs a real browser for OAuth).
2. `firebase init hosting` inside `artifacts/committee-manager`, or reuse the
   provided `firebase.json` (already configured for a Vite SPA: serves
   `dist/public`, rewrites all routes to `index.html`). Copy
   `.firebaserc.example` to `.firebaserc` and fill in your Firebase project ID.
3. Build with the Render backend URL baked in:
   ```
   cd artifacts/committee-manager
   PORT=5173 BASE_PATH=/ VITE_API_URL="https://committee-manager-api.onrender.com" pnpm run build
   ```
   (`PORT`/`BASE_PATH` are required by this project's Vite config even for a
   one-off build; `BASE_PATH=/` is correct for a root-hosted Firebase site.)
4. Deploy:
   ```
   firebase deploy --only hosting
   ```

## How the pieces connect

- `lib/api-client-react`'s generated hooks call relative paths like `/api/...`.
  `setBaseUrl()` (called in `artifacts/committee-manager/src/main.tsx` when
  `VITE_API_URL` is set at build time) prepends the Render URL to every
  request, so the same generated client works both same-origin (Replit) and
  cross-origin (Firebase → Render).
- No cookies/sessions are used by this app currently, so no `credentials:
  "include"` or cookie SameSite changes are needed for the cross-origin setup.

## Pushing to GitHub

This repl isn't connected to a GitHub repo yet. From your own machine (or
after connecting a repo through Replit's Git pane):

```
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
