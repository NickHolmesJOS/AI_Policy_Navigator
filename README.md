# AI Policy Navigator

A multipage Next.js application for analyzing, organizing, and understanding policies with AI-powered insights.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature overview |
| `/dashboard` | Full dashboard with sidebar, analysis, chat, and organize views |
| `/analyze` | Dedicated policy analysis with risk scoring and compliance checks |
| `/chat` | AI-powered Q&A chat about your policies |
| `/organize` | Tag, categorize, and folder-organize your policies |

## Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables (Optional)

The app works in **demo mode** without any API key. To enable real AI analysis, create a `.env.local` file:

```
OPENAI_API_KEY=your-key-here
```

## Deploy to Render

1. Push this repo to GitHub
2. Go to [Render](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo (`NickHolmesJOS/AI_Policy_Navigator`)
4. Render will auto-detect the `render.yaml` blueprint and configure everything
5. Optionally add `OPENAI_API_KEY` as an environment variable in Render's dashboard

**Or use the Blueprint:**
- Click **New** → **Blueprint** → select this repo. Render reads `render.yaml` automatically.

## Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **Zustand** (state management)
- **OpenAI API** (optional, for real AI analysis)
- **Lucide React** (icons)
