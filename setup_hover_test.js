// Publish hover-test page (branch + GitHub Pages) on the origin repo.
const { execSync } = require("child_process");

const out = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential fill', {
  encoding: "utf8",
  env: { ...process.env, GCM_INTERACTIVE: "never", GIT_TERMINAL_PROMPT: "0" },
});
const token = (out.match(/^password=(.*)$/m) || [])[1];
if (!token) { console.error("NO_CREDS"); process.exit(1); }
const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "hover-test", "X-GitHub-Api-Version": "2022-11-28" };
const repo = "Huzaifa-Arain1625/Huzaifa-Arain1625-Huzaifa-Arain1625";

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>body{margin:0;background:#0d1117;padding:40px;font-family:sans-serif;color:#8b949e}</style></head>
<body>
<p>HOVER TEST — click the line and keep the mouse on it, then screenshot.</p>
<img id="d" src="https://raw.githubusercontent.com/Huzaifa-Arain1625/Huzaifa-Arain1625/main/assets/tactical-divider.svg" width="880" alt="divider" />
</body></html>`;

const b64 = Buffer.from(html, "utf8").toString("base64");
const empty = Buffer.from("", "utf8").toString("base64");

(async () => {
  // 1) create/update branch files via API (index.html + .nojekyll)
  for (const [path, content] of [["index.html", b64], [".nojekyll", empty]]) {
    // check existing
    const g = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=hover-test`, { headers: h });
    const gd = await g.json();
    const body = { message: `hover test ${path}`, content, branch: "hover-test" };
    if (g.status === 200 && gd.sha) body.sha = gd.sha;
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { method: "PUT", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const rd = await r.json();
    console.log(`put ${path} =>`, r.status, rd.commit ? "ok" : JSON.stringify(rd).slice(0, 150));
  }

  // 2) enable Pages for hover-test branch
  let p = await fetch(`https://api.github.com/repos/${repo}/pages`, { method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ source: { branch: "hover-test", path: "/" } }) });
  if (p.status === 409) {
    p = await fetch(`https://api.github.com/repos/${repo}/pages`, { method: "PUT", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ source: { branch: "hover-test", path: "/" } }) });
  }
  console.log("pages create/update =>", p.status, JSON.stringify(await p.json()).slice(0, 200));

  // 3) poll until built
  for (let i = 0; i < 30; i++) {
    const s = await fetch(`https://api.github.com/repos/${repo}/pages`, { headers: h });
    const sd = await s.json();
    console.log(`pages status: ${sd.status} / ${sd.html_url || "-"}`);
    if (sd.status === "built") { console.log("PAGES_URL:", sd.html_url); return; }
    if (sd.status === "errored") { console.log("BUILD ERROR", JSON.stringify(sd).slice(0, 300)); process.exit(2); }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log("TIMEOUT waiting for pages build");
  process.exit(3);
})();
