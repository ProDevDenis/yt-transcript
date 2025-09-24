import express from "express";
import { Innertube } from "youtubei.js";

const app = express();
app.use(express.json());

const ytPromise = Innertube.create({ retrieve_player: false });

function extractVideoId(input) {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be")) {
      const seg = u.pathname.split("/").filter(Boolean)[0];
      if (seg && /^[a-zA-Z0-9_-]{11}$/.test(seg)) return seg;
    }
    const v = u.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const m = u.pathname.match(/\/(shorts|embed|v)\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[2];
  } catch {}
  return null;
}

function transcriptToLines(tr) {
  const content = tr?.transcript?.content;
  const body =
    content?.body || content?.contents?.[0]?.body || content?.panel?.body || content;
  const segs =
    body?.initial_segments ||
    body?.initialSegments ||
    body?.segments ||
    [];

  const lines = [];
  for (const seg of segs) {
    const text =
      seg?.snippet?.runs?.map(r => r?.text ?? "").join("") ??
      seg?.text ??
      "";
    if (text && text.trim()) lines.push(text.trim());
  }
  return lines;
}

app.post("/api/transcript", async (req, res) => {
  try {
    const { url, lang } = req.body ?? {};
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: "Please provide a valid YouTube link or video ID." });
    }

    const yt = await ytPromise;
    const info = await yt.getInfo(videoId);
    let tr;
    try {
      tr = await info.getTranscript();
    } catch (e) {
      return res.status(404).json({
        error: "Transcript not available for this video (disabled or missing)."
      });
    }

    if (lang && Array.isArray(tr.languages) && tr.languages.includes(lang)) {
      try { tr = await tr.selectLanguage(lang); } catch {}
    }

    const lines = transcriptToLines(tr);
    const text = lines.join(" ");

    res.json({
      videoId,
      language: tr?.selectedLanguage ?? null,
      lines,
      text
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching transcript." });
  }
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>YouTube Transcript (YouTube.js)</title>
<style>
:root{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Noto Sans',sans-serif}
body{margin:0;padding:2rem;background:#0b0f14;color:#e6edf3}
.card{max-width:760px;margin:0 auto;background:#111823;border:1px solid #223049;border-radius:14px;padding:1.25rem;box-shadow:0 10px 30px rgba(0,0,0,.35)}
h1{margin:0 0 .75rem 0;font-size:1.25rem}
form{display:grid;gap:.75rem;grid-template-columns:1fr auto;align-items:center}
input[type="url"],input[type="text"]{width:100%;padding:.75rem .9rem;background:#0e1520;color:#e6edf3;border:1px solid #2a3a55;border-radius:10px;outline:none}
input[type="text"]{max-width:7.5rem}
button{padding:.75rem 1rem;border-radius:10px;border:1px solid #2a3a55;background:#1a2840;color:#e6edf3;cursor:pointer}
button:disabled{opacity:.6;cursor:progress}
.row{display:flex;gap:.5rem}
.help{color:#8aa4c4;font-size:.9rem;margin-top:.25rem}
pre{white-space:pre-wrap;background:#0e1520;border:1px solid #2a3a55;padding:1rem;border-radius:10px;max-height:60vh;overflow:auto}
.muted{color:#8aa4c4}
</style></head>
<body>
<div class="card">
  <h1>Get a YouTube transcript (via YouTube.js)</h1>
  <form id="f">
    <input id="url" type="url" placeholder="Paste YouTube link (watch, shorts, youtu.be…)" required />
    <div class="row">
      <input id="lang" type="text" placeholder="lang (optional, e.g. en)" />
      <button id="go" type="submit">Fetch transcript</button>
    </div>
  </form>
  <div class="help muted">Tip: Some videos have no transcript (creator disabled or none available).</div>
  <h2 class="muted" style="margin:1rem 0 .25rem">Transcript</h2>
  <pre id="out" class="muted">No transcript loaded yet.</pre>
</div>
<script type="module">
const form = document.getElementById('f');
const out  = document.getElementById('out');
const btn  = document.getElementById('go');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  out.textContent = 'Fetching…';
  btn.disabled = true;
  try {
    const url = document.getElementById('url').value.trim();
    const lang = document.getElementById('lang').value.trim() || undefined;
    const res = await fetch('/api/transcript', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, lang })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Unknown error');
    out.textContent = data.text || '(Empty transcript)';
    out.classList.remove('muted');
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
    out.classList.add('muted');
  } finally {
    btn.disabled = false;
  }
});
</script>
</body></html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
