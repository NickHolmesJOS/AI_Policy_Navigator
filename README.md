# AI Policy Navigator

A modern, AI-powered application for analyzing, organizing, and understanding policies. Built with Next.js 14, TypeScript, Tailwind CSS, and OpenAI.

## Features

- **Policy Submission** — Paste text or upload `.txt`/`.md` files
- **AI Analysis** — Automatic risk scoring, compliance check, key findings, and recommendations
- **Q&A Chat** — Ask natural language questions about any policy
- **Organization** — Tag policies and group them into folders
- **Favorites** — Star important policies for quick access
- **Search & Filter** — Find policies by content, category, or status

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (optional — app runs in demo mode without one)

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand (with localStorage persistence)
- **AI**: OpenAI GPT-4o-mini
- **Icons**: Lucide React

## Configuration

Set `OPENAI_API_KEY` in `.env.local` to enable real AI analysis. Without it, the app runs with smart mock responses for demonstration purposes.
