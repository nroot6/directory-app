# District Directory — Vercel + Supabase

## Architecture

```
Browser → Vercel Serverless API (/api/search, /api/districts) → Supabase PostgreSQL
```

The frontend **never** touches the database directly.  
All queries go through the backend API functions which hold the secret `DATABASE_URL`.

---

## Project Structure

```
directory-app/
├── api/
│   ├── search.js       ← GET /api/search?district=X&name=Y&page=0
│   └── districts.js    ← GET /api/districts
├── public/
│   └── index.html      ← Frontend UI
├── setup.sql           ← Run this in Supabase SQL Editor
├── .env.example        ← Copy to .env.local with real values
├── package.json
└── vercel.json
```

---

## Step-by-Step Deployment
### 1. Deploy to Vercel

#### Option A — GitHub (Recommended)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. In **Environment Variables**, add:
   ```
   DATABASE_URL = postgresql://postgres:...your full string...
   ```
4. Click **Deploy** — done!

#### Option B — Vercel CLI
```bash
npm install -g vercel
cd directory-app
vercel
# Follow prompts, then add env variable:
vercel env add DATABASE_URL
```

### 4. Test

Visit your Vercel URL. The header will show `CONNECTING` then `N DISTRICTS` when the DB is live.
---

## Local Development

```bash
# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local and add your DATABASE_URL

# Run locally with Vercel CLI
npm install -g vercel
vercel dev
```

Visit http://localhost:3000
