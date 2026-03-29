# Frontend on Vercel (UCU Fleet Management)

This app is a **Vite + React** SPA. Vercel runs `npm run build` and serves the `dist/` output. Client-side routes (e.g. `/admin`, `/client/dashboard`) need a rewrite to `index.html` — see `vercel.json`.

## 1. One-time environment variable

The browser must know where the **API** lives. Set this in **Vercel → Project → Settings → Environment Variables**:

| Name | Value (example) | Environments |
|------|-------------------|--------------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-APP.up.railway.app/api` | Production, Preview, Development |

After you deploy the backend on Railway, replace the URL with your real public API base (must end with `/api` — same as local `http://localhost:5000/api`).

**Important:** `VITE_*` variables are embedded at **build time**. Redeploy the frontend after changing `VITE_API_URL`.

## 2. Deploy from the Vercel dashboard

1. Push this repo to GitHub/GitLab/Bitbucket (if it is not already).
2. [vercel.com](https://vercel.com) → **Add New… → Project** → Import the repository.
3. **Root Directory:** leave as repository root (this folder is the frontend root).
4. **Framework Preset:** Vite (auto-detected).
5. **Build Command:** `npm run build` (default).
6. **Output Directory:** `dist` (default for Vite).
7. Add `VITE_API_URL` as above, then **Deploy**.

## 3. Deploy with the CLI (optional)

```bash
npm i -g vercel
vercel login
vercel        # preview
vercel --prod # production
```

Link env vars in the dashboard or:

```bash
vercel env add VITE_API_URL
```

## 4. CORS (backend on Railway — next step)

The Express app allows origins in `fleet_backend/server.js` via `FRONTEND_URL`. On Railway, set:

- `FRONTEND_URL` = your Vercel URL, e.g. `https://your-app.vercel.app`

Use the **exact** origin (scheme + host, no trailing slash). For preview deployments (`*.vercel.app`), add each preview URL or adjust backend CORS when you wire Railway.

## 5. Verify locally (production build)

```bash
# .env.production.local (gitignored) — test before pushing
# VITE_API_URL=https://your-railway-url.up.railway.app/api

npm run build
npm run preview
```

Open the preview URL and confirm API calls go to Railway, not localhost.

## 6. Checklist

- [ ] `VITE_API_URL` set on Vercel (Production at minimum).
- [ ] Railway backend deployed and reachable over HTTPS.
- [ ] `FRONTEND_URL` on Railway matches the Vercel site origin.
- [ ] Redeploy frontend after any `VITE_API_URL` change.
