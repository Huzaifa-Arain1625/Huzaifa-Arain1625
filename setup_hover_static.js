// Add static hover test assets to hover-test branch + wait for Pages rebuild.
const { execSync } = require("child_process");

const out = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential fill', {
  encoding: "utf8",
  env: { ...process.env, GCM_INTERACTIVE: "never", GIT_TERMINAL_PROMPT: "0" },
});
const token = (out.match(/^password=(.*)$/m) || [])[1];
if (!token) { console.error("NO_CREDS"); process.exit(1); }
const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "hover-test", "X-GitHub-Api-Version": "2022-11-28" };
const repo = "Huzaifa-Arain1625/Huzaifa-Arain1625-Huzaifa-Arain1625";

const staticSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="24" viewBox="0 0 880 24">
  <defs><linearGradient id="bar" x1="0%" y1="0" x2="100%" y2="0">
    <stop offset="0" stop-color="#800000" stop-opacity="0"/>
    <stop offset="0.18" stop-color="#800000"/>
    <stop offset="0.5" stop-color="#e66a6a"/>
    <stop offset="0.82" stop-color="#800000"/>
    <stop offset="1" stop-color="#800000" stop-opacity="0"/>
  </linearGradient></defs>
  <style>.bar { transition: filter .35s ease; } svg:hover .bar { filter: brightness(2.2) drop-shadow(0 0 8px #ff5252); }</style>
  <rect class="bar" x="0" y="9" width="880" height="6" rx="3" fill="url(#bar)"/>
</svg>`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>body{margin:0;background:#0d1117;padding:40px;font-family:sans-serif;color:#8b949e}</style></head>
<body>
<p>STATIC TEST — click line A (no animation) and keep mouse on it, screenshot.</p>
<img id="a" src="static.svg" width="880" alt="static line" />
<p style="margin-top:48px">Animated divider (for reference):</p>
<img id="b" src="https://raw.githubusercontent.com/Huzaifa-Arain1625/Huzaifa-Arain1625/main/assets/tactical-divider.svg" width="880" alt="animated line" />
</body></html>`;

const put = async (path, content) => {
  const g = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=hover-test`, { headers: h });
  const gd = await g.json();
  const body = { message: `hover static ${path}`, content: Buffer.from(content, "utf8").toString("base64"), branch: "hover-test" };
  if (g.status === 200 && gd.sha) body.sha = gd.sha;
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { method: "PUT", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const rd = await r.json();
  console.log(`put ${path} =>`, r.status, rd.commit ? "ok" : JSON.stringify(rd).slice(0, 120));
};

(async () => {
  const before = await (await fetch(`https://api.github.com/repos/${repo}/pages`, { headers: h })).json();
  console.log("pages updated_at before:", before.updated_at);
  await put("static.svg", staticSvg);
  await put("index.html", html);
  // wait until updated_at changes AND status is built
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 8000));
    const s = await fetch(`https://api.github.com/repos/${repo}/pages`, { headers: h });
    const sd = await s.json();
    console.log("pages:", sd.status, "| updated:", sd.updated_at);
    if (sd.status === "built" && sd.updated_at !== before.updated_at) { console.log("REBUILT"); return; }
  }
  console.log("TIMEOUT");
  process.exit(3);
})();
