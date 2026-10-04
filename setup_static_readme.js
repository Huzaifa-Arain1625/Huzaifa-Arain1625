// Put a minimal test README (static svg, no animation) on the hover-test branch.
const { execSync } = require("child_process");

const out = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential fill', {
  encoding: "utf8",
  env: { ...process.env, GCM_INTERACTIVE: "never", GIT_TERMINAL_PROMPT: "0" },
});
const token = (out.match(/^password=(.*)$/m) || [])[1];
if (!token) { console.error("NO_CREDS"); process.exit(1); }
const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "hover-test", "X-GitHub-Api-Version": "2022-11-28" };
const repo = "Huzaifa-Arain1625/Huzaifa-Arain1625-Huzaifa-Arain1625";

const readme = `# Static hover test

Hover target (no animation — hover applies brightness 2.2 + red glow):

<img src="static.svg" alt="static hover line" />

End of test.
`;

(async () => {
  const g = await fetch(`https://api.github.com/repos/${repo}/contents/README.md?ref=hover-test`, { headers: h });
  const gd = await g.json();
  const body = { message: "test readme for hover verification", content: Buffer.from(readme, "utf8").toString("base64"), branch: "hover-test" };
  if (g.status === 200 && gd.sha) body.sha = gd.sha;
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/README.md`, { method: "PUT", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const rd = await r.json();
  console.log("put README =>", r.status, rd.commit ? "ok" : JSON.stringify(rd).slice(0, 150));
})();
