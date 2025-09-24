# yt-transcript
Get transcript from yt url
# YouTube Transcript App (YouTube.js)

A tiny web app that takes a YouTube link and returns the transcript using **[YouTube.js (youtubei.js)](https://ytjs.dev/)**.  
The server renders a minimal UI at `/` and exposes a JSON endpoint at `/api/transcript`.

> ✅ No API key required • 🎯 Works with `watch`, `shorts`, `embed`, `youtu.be` links or a plain 11-char video ID  
> ⚠️ Some videos simply don’t have transcripts (disabled or unavailable)

---

## Demo UI

- Open the app, paste a YouTube URL, optionally set a language code (e.g., `en`), and hit **Fetch transcript**
- Returns plain text in the UI. The API also returns a JSON array of lines.

---

## Features

- 🔗 Accepts most common YouTube URL formats or the bare video ID
- 🌐 Optional language switch when multiple transcript languages are available
- 🧠 Uses `retrieve_player: false` (we only fetch transcripts; we don’t need stream deciphering)
- 🧰 Simple, single-process Node server (Express), easy to deploy anywhere Node runs

---

## Requirements

- **Node.js v18+** (v20+ recommended)
- **npm** (bundled with Node)

---

## Quick Start

```bash
# install dependencies
npm install

# run the server
npm start

# open the app
# http://localhost:3000
