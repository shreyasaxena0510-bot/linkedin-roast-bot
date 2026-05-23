# Brutal Honesty Bot

A screenshot-powered career roast and content coach. Upload LinkedIn profile shots, resume pages, or analytics dashboards and get blunt AI feedback — scores, roasts, fixes, or post ideas tailored to your audience.

Built as a static frontend + Vercel serverless API, powered by **Google Gemini** vision models.

## Features

| Mode | Upload | What you get |
|------|--------|--------------|
| **LinkedIn** | Profile screenshots (header, About, Experience) | 5 category scores + savage verdict |
| **Resume** | Resume page screenshots | 6 category scores (ATS, impact, formatting, etc.) |
| **Post ideas** | LinkedIn analytics screenshots + optional notes | Audience summary, insights, 6 ranked post ideas |

- Drag-and-drop up to **4 images** per run
- Auto-compresses uploads before sending (stays under API payload limits)
- Copy results to clipboard for sharing

## Tech stack

- **Frontend:** Single-page HTML/CSS/JS (`index.html`)
- **Backend:** Vercel serverless functions (`api/`)
- **AI:** Google Gemini API (vision + JSON output)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- A **Google AI Studio API key** — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Local development

```bash
git clone <your-repo-url>
cd linkedin-roast-bot
```

Create `.env.local` in the project root:

```bash
GOOGLE_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Start the dev server:

```bash
vercel dev
```

Open **http://localhost:3000** (use this URL — do not open `index.html` directly in the browser, or API calls will fail).

Check that the server sees your key:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "ok": true,
  "google_configured": true,
  "model": "gemini-2.5-flash"
}
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes | Google AI Studio API key |
| `GEMINI_API_KEY` | No | Alias for `GOOGLE_API_KEY` |
| `GEMINI_MODEL` | No | Gemini model ID (default: `gemini-2.5-flash`) |

Copy `.env.example` as a starting point.

**Do not commit** `.env.local` or any file containing API keys.

## Model notes (free tier)

Screenshot analysis requires a **vision-capable Flash model** — not `*-flash-lite` (lite models reject image input).

| Model | Notes |
|-------|--------|
| `gemini-2.5-flash` | **Recommended default** — supports images + JSON |
| `gemini-flash-latest` | Good fallback |
| `gemini-2.0-flash` | Fallback if 2.5 hits quota |

Dashboard labels like “Gemini 1.5 Flash Lite” do **not** match API model IDs. Names like `gemini-1.5-flash-lite` will 404.

If you hit **429 quota** errors, wait a minute and retry, or switch `GEMINI_MODEL` in `.env.local` and restart `vercel dev`.

## Deploy to Vercel

```bash
vercel
```

For production:

```bash
vercel --prod
```

Add environment variables in the Vercel dashboard:

**Project → Settings → Environment Variables**

- `GOOGLE_API_KEY`
- `GEMINI_MODEL` (optional)

## API routes

| Route | Method | Body | Purpose |
|-------|--------|------|---------|
| `/api/roast` | POST | `{ "images": ["data:image/..."] }` | LinkedIn profile roast |
| `/api/roast-resume` | POST | `{ "images": [...] }` | Resume roast |
| `/api/post-ideas` | POST | `{ "images": [...], "notes": "..." }` | Analytics → post ideas |
| `/api/health` | GET | — | Key + model status check |

Images must be 1–4 base64 data URLs (`data:image/jpeg;base64,...`).

## Project structure

```
linkedin-roast-bot/
├── index.html           # Frontend UI
├── api/
│   ├── roast.js         # LinkedIn roast endpoint
│   ├── roast-resume.js  # Resume roast endpoint
│   ├── post-ideas.js    # Post ideas endpoint
│   ├── health.js        # Health check
│   └── lib/
│       ├── gemini.js    # Gemini API client + model fallback
│       └── analyze.js   # Shared request handler
├── .env.example
└── package.json
```

## Tips for best results

**LinkedIn roast**
- Profile header (photo, banner, headline)
- About section
- 1–2 recent Experience sections

**Resume roast**
- Page 1 (name, summary, latest role)
- Experience bullets with dates and metrics

**Post ideas**
- Audience demographics + post performance analytics
- Paste extra metrics in the notes field if numbers are hard to read in screenshots

Start with **1–2 screenshots** per run for faster responses and fewer quota issues.

## License

Private project — use and deploy as you see fit.
