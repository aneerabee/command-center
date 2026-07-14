#!/usr/bin/env node
/**
 * audit-data.js
 * Verifies factual claims in data.js against the real world:
 *   • repo_url     → gh api check (does the GitHub repo exist?)
 *   • deploy_url   → HTTP status (does the URL respond?)
 *   • local_path   → fs.exists (does the local folder exist?)
 *   • server_path  → ssh ls (does it exist on Contabo?)
 *   • AUTO tasks   → launchctl list (is the agent loaded?)
 *   • Services     → ssh systemctl is-active (active?)
 *
 * Outputs a structured JSON report grouped by entity.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execSync, execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SSH_HOST = "argaz@62.171.128.44";
const SSH_KEY = path.join(process.env.HOME, ".ssh/contabo_key");

// Load data.js
const ctx = { console };
vm.createContext(ctx);
const src = fs
  .readFileSync(path.join(ROOT, "data.js"), "utf8")
  .replace(/^const ([A-Z][A-Z_]+)\s*=/gm, "this.$1 =");
vm.runInContext(src, ctx);

const REPORT = { generated_at: new Date().toISOString(), entities: {} };

const log = (e, k, v) => {
  if (!REPORT.entities[e]) REPORT.entities[e] = {};
  REPORT.entities[e][k] = v;
};

// ─── utils ───
function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function httpStatus(url, timeoutMs = 10000) {
  if (!isHttpUrl(url)) return null;
  try {
    const out = execFileSync(
      "curl",
      ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", String(Math.ceil(timeoutMs / 1000)), url],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

function ghRepoExists(repoUrl) {
  const m = /github\.com\/([^/]+)\/([^/?#]+)/.exec(repoUrl || "");
  if (!m) return null;
  const slug = `${m[1]}/${m[2].replace(/\.git$/, "")}`;
  try {
    execFileSync("gh", ["api", `repos/${slug}`, "--jq", ".name"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return slug;
  } catch {
    return false;
  }
}

function localPathExists(p) {
  if (!p || typeof p !== "string") return null;
  if (!p.startsWith("/") && !p.startsWith("~")) return null;
  const expanded = p.replace(/^~/, process.env.HOME);
  try {
    return fs.existsSync(expanded);
  } catch {
    return false;
  }
}

const SSH_RESULTS = {};
function ssh(cmd, key) {
  if (SSH_RESULTS[key] !== undefined) return SSH_RESULTS[key];
  try {
    const out = execFileSync(
      "ssh",
      ["-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=8", SSH_HOST, cmd],
      { encoding: "utf8" },
    );
    SSH_RESULTS[key] = out.trim();
  } catch (e) {
    SSH_RESULTS[key] = `ERR: ${e.message.split("\n")[0]}`;
  }
  return SSH_RESULTS[key];
}

function launchctlList() {
  try {
    return execFileSync("launchctl", ["list"], { encoding: "utf8" });
  } catch {
    return "";
  }
}
const LAUNCHCTL = launchctlList();

// ─── 1. PRJ — every project ───
console.log(`\n═══ Auditing PRJ (${ctx.PRJ.length} projects) ═══`);
for (const p of ctx.PRJ) {
  const id = p.id;
  log(id, "kind", "project");
  log(id, "name", p.name);

  if (p.repo_url) {
    const r = ghRepoExists(p.repo_url);
    log(id, "repo_url", { value: p.repo_url, exists: r ? true : r === false ? false : null });
  }
  if (p.deploy_url) {
    const s = httpStatus(p.deploy_url, 10000);
    log(id, "deploy_url", { value: p.deploy_url, status: s, ok: s >= 200 && s < 400 });
  }
  if (p.local_path) {
    const exists = localPathExists(p.local_path);
    log(id, "local_path", { value: p.local_path, exists });
  }
  if (p.server_path) {
    const out = ssh(`test -d ${p.server_path} && echo yes || echo no`, `dir:${p.server_path}`);
    log(id, "server_path", { value: p.server_path, exists: out === "yes" });
  }
}

// ─── 2. SVC — every server service ───
console.log(`\n═══ Auditing SVC (${ctx.SVC.length} services) ═══`);
for (const s of ctx.SVC) {
  const id = s.id;
  log(id, "kind", "service");
  log(id, "name", s.name);

  // Many SVC entries are systemd user services on Contabo
  if (s.systemd) {
    const active = ssh(`systemctl --user is-active ${s.systemd} 2>/dev/null || echo missing`, `svc:${s.systemd}`);
    log(id, "systemd", { unit: s.systemd, status: active });
  }
  if (s.port && /^\d+$/.test(String(s.port))) {
    const status = httpStatus(`http://62.171.128.44:${s.port}/`, 8000);
    log(id, "port_http", { port: s.port, status });
  }
}

// ─── 3. CLD — cloud platform endpoints ───
console.log(`\n═══ Auditing CLD (${ctx.CLD.length} cloud services) ═══`);
for (const c of ctx.CLD) {
  const id = c.id || c.nm;
  log(id, "kind", "cloud");
  log(id, "name", c.nm);
  if (c.url) {
    const s = httpStatus(c.url, 10000);
    log(id, "url", { value: c.url, status: s, ok: s >= 200 && s < 400 });
  }
}

// ─── 4. BOT — every bot ───
console.log(`\n═══ Auditing BOT (${ctx.BOT.length} bots) ═══`);
for (const b of ctx.BOT) {
  const id = b.id;
  log(id, "kind", "bot");
  log(id, "name", b.name);
  if (b.repo_url) {
    const r = ghRepoExists(b.repo_url);
    log(id, "repo_url", { value: b.repo_url, exists: r ? true : r === false ? false : null });
  }
  if (b.systemd) {
    const active = ssh(`systemctl --user is-active ${b.systemd} 2>/dev/null || echo missing`, `bot:${b.systemd}`);
    log(id, "systemd", { unit: b.systemd, status: active });
  }
}

// ─── 5. AUTO — every automation (nested tasks) ───
console.log(`\n═══ Auditing AUTO ═══`);
for (const grp of ctx.AUTO) {
  if (!Array.isArray(grp.tasks)) continue;
  for (const t of grp.tasks) {
    const id = t.id;
    log(id, "kind", "automation");
    log(id, "name", t.name);
    log(id, "group", grp.group);
    if (t.host === "desktop") {
      // Try to find a launchd agent matching the id
      const label = t.label || t.plist?.replace(/\.plist$/, "")?.split("/").pop();
      if (label) {
        const found = LAUNCHCTL.split("\n").some((line) => line.includes(label));
        log(id, "launchd", { label, loaded: found });
      }
    }
  }
}

// ─── Write report ───
const OUT = path.join(ROOT, "data.audit.json");
fs.writeFileSync(OUT, JSON.stringify(REPORT, null, 2));
console.log(`\n✓ Report written to data.audit.json`);

// ─── Summary ───
let ok = 0, broken = 0, unknown = 0;
for (const e of Object.values(REPORT.entities)) {
  for (const [k, v] of Object.entries(e)) {
    if (typeof v !== "object" || v === null) continue;
    if (v.exists === true || v.ok === true || v.status === "active" || v.loaded === true) ok++;
    else if (v.exists === false || v.ok === false || v.status === "missing" || v.loaded === false) broken++;
    else if (v.status === "missing" || v.exists === null) unknown++;
  }
}
console.log(`\nأخضر (سليم): ${ok}  |  أحمر (مكسور): ${broken}  |  رمادي (غير محدّد): ${unknown}`);
