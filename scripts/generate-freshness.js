#!/usr/bin/env node
/**
 * generate-freshness.js
 * ─────────────────────
 * Reads data.js, identifies every top-level entity (across 12 arrays:
 * PG, UMBRELLAS, DEPARTMENTS, TEAM, PRJ, SVC, AUTO, BOT, TL, CLD, ARC, IDEAS)
 * and each entity's nested sub-sections (current_status, bot_features,
 * claude_session, links, links_desc, …). Uses `git blame` to find the
 * latest commit timestamp affecting each section's line range. Writes
 * data.freshness.json — consumed at runtime by app.js to render the
 * coloured "freshness bar" on top of each card and section.
 *
 * Output shape:
 *   {
 *     "libya": {
 *       "_root":          "2026-05-25",
 *       "current_status": "2026-05-25",
 *       "bot_features":   "2026-05-23",
 *       "claude_session": "2026-05-25",
 *       "links":          "2026-05-23",
 *       "links_desc":     "2026-05-22"
 *     },
 *     ...
 *   }
 *
 * Run automatically by .git/hooks/pre-commit, OR manually:
 *   node scripts/generate-freshness.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "data.js");
const OUT = path.join(ROOT, "data.freshness.json");

if (!fs.existsSync(SRC)) {
  console.error("✗ data.js not found");
  process.exit(1);
}

// ─── 1. git blame: get unix timestamp per line ───
let blame;
try {
  blame = execSync(`git -C "${ROOT}" blame --line-porcelain -- data.js`, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (err) {
  console.error("✗ git blame failed:", err.message);
  process.exit(1);
}

const timePerLine = []; // index = line-number (1-based) → unix epoch
{
  let lineNo = 0;
  let authorTime = 0;
  for (const ln of blame.split("\n")) {
    const m = ln.match(/^[0-9a-f]{40} \d+ (\d+)/);
    if (m) {
      lineNo = parseInt(m[1], 10);
      continue;
    }
    if (ln.startsWith("author-time ")) {
      authorTime = parseInt(ln.split(" ")[1], 10);
      continue;
    }
    if (ln.startsWith("\t")) {
      timePerLine[lineNo] = authorTime;
    }
  }
}

// ─── 2. parse data.js to find entity + sub-section line ranges ───
const lines = fs.readFileSync(SRC, "utf8").split("\n");
const result = {};

let inArray = null; // current array name, or null
let entityStart = -1;
let entityId = null;
let entityDepth = 0;
let subSectionStart = -1;
let subSectionName = null;
let subSectionDepth = 0;

const ARRAY_OPEN = /^const ([A-Z][A-Z_]+) = \[/;
const ARRAY_CLOSE = /^\];?\s*$/;
const ENTITY_OPEN = /^\s{2}\{\s*$/;
const ENTITY_CLOSE = /^\s{2}\},?\s*$/;
const ID_FIELD = /^\s+id:\s*"([^"]+)"/;
const NAME_FIELD = /^\s+name:\s*"([^"]+)"/;
const SUB_OPEN = /^\s+([a-zA-Z_][a-zA-Z0-9_]*):\s*\{\s*$/;

const yyyymmdd = (epochSec) => {
  if (!epochSec || epochSec <= 0) return null;
  return new Date(epochSec * 1000).toISOString().slice(0, 10);
};

const maxTime = (startLine, endLine) => {
  let m = 0;
  for (let i = startLine; i <= endLine; i++) {
    const t = timePerLine[i] || 0;
    if (t > m) m = t;
  }
  return m;
};

let pendingEntityName = null;

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1; // 1-based
  const line = lines[i];

  // ─ Array boundary tracking ─
  if (!inArray) {
    const am = line.match(ARRAY_OPEN);
    if (am) {
      inArray = am[1];
    }
    continue;
  }
  if (entityDepth === 0 && ARRAY_CLOSE.test(line)) {
    inArray = null;
    continue;
  }

  // ─ Entity boundary tracking ─
  if (entityDepth === 0 && ENTITY_OPEN.test(line)) {
    entityStart = lineNum;
    entityId = null;
    pendingEntityName = null;
    entityDepth = 1;
    continue;
  }
  if (entityDepth === 1 && ENTITY_CLOSE.test(line)) {
    // Close out the entity
    const id = entityId || pendingEntityName;
    if (id) {
      const t = maxTime(entityStart, lineNum);
      if (!result[id]) result[id] = {};
      result[id]._root = yyyymmdd(t);
    }
    entityStart = -1;
    entityId = null;
    pendingEntityName = null;
    entityDepth = 0;
    continue;
  }

  if (entityDepth === 0) continue;

  // ─ Within entity body ─
  if (entityDepth === 1 && subSectionDepth === 0) {
    // Capture id / name as the entity identifier
    const im = line.match(ID_FIELD);
    if (im && !entityId) {
      entityId = im[1];
    }
    const nm = line.match(NAME_FIELD);
    if (nm && !pendingEntityName) {
      pendingEntityName = nm[1].toLowerCase().replace(/\s+/g, "-");
    }

    // Sub-section open: `    key: {` on its own line
    const sm = line.match(SUB_OPEN);
    if (sm) {
      subSectionStart = lineNum;
      subSectionName = sm[1];
      subSectionDepth = 1;
      continue;
    }
    continue;
  }

  // ─ Within a sub-section, count braces ─
  if (subSectionDepth > 0) {
    // Skip braces inside strings — simple heuristic: ignore lines that look
    // like string content (start with quotes after whitespace). For the
    // Prettier-formatted data.js this is robust enough.
    let stripped = line;
    // remove single-quoted and double-quoted string contents to avoid
    // counting { } inside them
    stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    for (const ch of stripped) {
      if (ch === "{") subSectionDepth++;
      else if (ch === "}") subSectionDepth--;
    }
    if (subSectionDepth === 0) {
      const id = entityId || pendingEntityName;
      if (id && subSectionName) {
        const t = maxTime(subSectionStart, lineNum);
        if (!result[id]) result[id] = {};
        result[id][subSectionName] = yyyymmdd(t);
      }
      subSectionStart = -1;
      subSectionName = null;
    }
  }
}

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      source: "data.js + git blame",
      entities: result,
    },
    null,
    2,
  ) + "\n",
);

const entityCount = Object.keys(result).length;
let sectionCount = 0;
for (const k of Object.keys(result)) sectionCount += Object.keys(result[k]).length;
console.log(
  `✓ data.freshness.json written: ${entityCount} entities, ${sectionCount} dated sections`,
);
