/* ══════════════════════════════════════════════
   APP.JS — الدوال فقط، لا بيانات هنا
   البيانات في data.js (يُحمَّل قبل هذا الملف)
   ══════════════════════════════════════════════ */

/* ─────────────── 1. UTILITIES ─────────────── */

const E = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* EJ — escapes a string for safe injection inside a JS string literal that
 * sits inside an HTML attribute (e.g. onclick="foo('${EJ(name)}')").
 * Must NOT use HTML entities — browsers HTML-decode the attribute BEFORE
 * passing to the JS parser, so &#39; becomes ' which breaks the literal. */
const EJ = (s) =>
  String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/\r?\n/g, "\\n");

/* h(tag, attrs, ...children) — tiny safe HTML builder.
 *
 * - Auto-escapes attribute values via E()
 * - Auto-escapes text children (strings) via E()
 * - Passes pre-built HTML through ONLY via h.raw("...") sentinel
 * - Skips null/undefined children silently (so `cond && h(...)` works)
 *
 * Use to eliminate the manual-escape XSS surface that produced ~7 fixes
 * across two prior commits. Migrate hot render sites first.
 *
 * Example:
 *   h("button", { class: "x", onclick: `go('${EJ(name)}')`, "data-id": id },
 *     h("span", { class: "em" }, em),
 *     name)
 */
function h(tag, attrs, ...children) {
  let html = "<" + tag;
  if (attrs && typeof attrs === "object") {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (v === true) { html += " " + k; continue; }
      html += ` ${k}="${E(v)}"`;
    }
  }
  // void elements have no closing tag and no children
  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
  if (VOID.test(tag)) return html + " />";
  html += ">";
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) { html += c.map(x => _hChild(x)).join(""); continue; }
    html += _hChild(c);
  }
  return html + "</" + tag + ">";
}
function _hChild(c) {
  if (c == null || c === false) return "";
  if (c && c.__html != null) return c.__html;          // h.raw output
  if (typeof c === "string") return E(c);
  if (typeof c === "number") return String(c);
  return E(String(c));
}
/* h.raw — wrap pre-built HTML so h() won't re-escape it. USE SPARINGLY. */
h.raw = function (htmlStr) { return { __html: String(htmlStr || "") }; };

/* smartRender(el, html) — diff-and-patch DOM instead of nuke-and-replace.
 *
 * Falls back to plain innerHTML if morphdom isn't loaded (offline CDN, etc).
 * Use for runtime refresh paths where we want to preserve user state
 * (scroll position, open drawer, focused input, hover states).
 *
 * Wrap HTML in the same outer tag as el so morphdom diffs the children
 * (morphdom requires same root tag).
 */
function smartRender(el, html) {
  if (!el) return;
  // morphdom requires the new content to be wrapped in a tag matching el
  if (typeof morphdom !== "function") {
    el.innerHTML = html;
    return;
  }
  try {
    // Build a wrapper of same tag with same id/class so morphdom diffs children
    const tag = el.tagName.toLowerCase();
    const idAttr = el.id ? ` id="${el.id}"` : "";
    const clsAttr = el.className ? ` class="${el.className}"` : "";
    const wrapped = `<${tag}${idAttr}${clsAttr}>${html}</${tag}>`;
    morphdom(el, wrapped, {
      onBeforeElUpdated: (fromEl, toEl) => {
        // Preserve focused input value so user typing isn't disrupted
        if (fromEl === document.activeElement && fromEl.tagName === "INPUT") {
          toEl.value = fromEl.value;
        }
        // Skip elements explicitly marked to preserve (e.g., open drawer)
        if (fromEl.hasAttribute && fromEl.hasAttribute("data-cc-keep")) {
          return false;
        }
        return true;
      },
    });
  } catch (e) {
    console.warn("[cc] smartRender fallback:", e && e.message);
    el.innerHTML = html;
  }
}

/* ccActions — central dispatch table for data-action delegated events.
 * Replaces inline onclick="..." patterns. Renderers that opt in just emit:
 *
 *   <button data-action="openProject" data-arg="LIBYA">…</button>
 *
 * The single document-level click handler at bottom of file looks up
 * data-action in ccActions and calls the function with data-arg + element.
 *
 * Benefits over inline onclick:
 *  - Zero XSS surface from string-interpolated handlers
 *  - Listener attached once, not per-render — no orphan listeners
 *  - Re-renders don't lose handlers (no setTimeout race-hack needed)
 */
const ccActions = {
  openProject:  (arg) => typeof openProjectDetail === "function" && openProjectDetail(arg),
  openService:  (arg) => typeof openServiceDetail === "function" && openServiceDetail(arg),
  openBot:      (arg) => typeof openBotDetail === "function" && openBotDetail(arg),
  openTool:     (arg) => typeof openToolDetail === "function" && openToolDetail(arg),
  openCloud:    (arg) => typeof openCloudDetail === "function" && openCloudDetail(arg),
  openArchive:  (arg) => typeof openArchiveDetail === "function" && openArchiveDetail(arg),
  openAuto:     (arg) => typeof openAutoDetail === "function" && openAutoDetail(arg),
  openTeam:     (arg) => typeof openTeamDetail === "function" && openTeamDetail(arg),
  openIdea:     (arg) => typeof openIdeaDetail === "function" && openIdeaDetail(arg),
  goPage:       (arg) => typeof go === "function" && go(arg),
  copyDrawerLink: (arg, el) => ccCopyDrawerLink(el),
  closeDetail:  () => typeof closeDetail === "function" && closeDetail(),
  openSearch:   () => typeof openSearch === "function" && openSearch(),
  closeSearch:  () => typeof closeSearch === "function" && closeSearch(),
  openMore:     () => typeof openMore === "function" && openMore(),
  mapFilter:    (arg) => typeof mapFilter === "function" && mapFilter(arg),
  teamSwitchView: (arg) => typeof teamSwitchView === "function" && teamSwitchView(arg),
  teamToggleSalary: () => typeof teamToggleSalary === "function" && teamToggleSalary(),
};
/* Single delegated click handler — runs once, covers all data-action buttons */
document.addEventListener("click", function (e) {
  const t = e.target instanceof Element && e.target.closest("[data-action]");
  if (!t) return;
  const action = t.getAttribute("data-action");
  const fn = ccActions[action];
  if (!fn) return;
  e.preventDefault();
  e.stopPropagation();
  const arg = t.getAttribute("data-arg") || "";
  try { fn(arg, t); } catch (err) { console.warn("[cc] action " + action + " failed:", err); }
});

/* normalizeEntity(e, kind) — apply per-kind defaults so renderers can trust
 * that common fields exist. Idempotent: calling twice returns same shape.
 * Returns a NEW object (immutable pattern). Does NOT mutate input.
 *
 * Eliminates the 33+ scattered `e.tags || []`, `e.cl || "#888"`, `e.links || {}`
 * checks across render functions. Add new kinds via DEFAULTS table.
 */
const ENTITY_DEFAULTS = {
  project:   { cl: "#7C3AED", em: "📦", tags: [], links: {}, st: "p" },
  service:   { cl: "#22C55E", em: "🔧", tags: [], links: {}, st: 0, port: "—" },
  bot:       { cl: "#0088CC", em: "🤖", tags: [], links: {}, st: "p" },
  cloud:     { cl: "#475569", em: "☁️", tags: [], links: {} },
  tool:      { cl: "#0EA5E9", em: "🛠️", tags: [], links: {} },
  archive:   { cl: "#94A3B8", em: "📁", tags: [], links: {}, st: "arc" },
  idea:      { cl: "#A855F7", em: "💡", tags: [], links: {} },
  umbrella:  { cl: "#6366F1", em: "🏢", tags: [], links: {} },
  department:{ cl: "#64748B", em: "📂", tags: [], links: {} },
  team:      { cl: "#3B82F6", em: "👤", tags: [], links: {} },
  automation:{ cl: "#10B981", em: "⏱️",  tags: [], links: {}, on: false },
};
function normalizeEntity(e, kind) {
  if (!e || typeof e !== "object") return null;
  const defaults = ENTITY_DEFAULTS[kind] || {};
  return {
    ...defaults,
    ...e,
    // Always-derived
    name: e.name || e.nm || e.ar || e.id || "بدون اسم",
    ar: e.ar || e.name || e.nm || e.id || "بدون اسم",
    id: e.id || e.nm || (e.name || "unknown").toLowerCase().replace(/\s+/g, "-"),
    tags: Array.isArray(e.tags) ? e.tags : (defaults.tags || []),
    links: (e.links && typeof e.links === "object") ? e.links : (defaults.links || {}),
  };
}

/* ccCopyDrawerLink — copies the current drawer's full URL to clipboard. */
function ccCopyDrawerLink(btn) {
  const url = location.href;
  const done = (ok) => {
    if (typeof ccToast === "function") {
      ccToast(ok ? "تم نسخ الرابط ✓" : "تعذّر النسخ — انسخ من شريط العنوان", ok ? "ok" : null);
    }
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = ok ? "✓" : "✗";
      setTimeout(() => { if (btn.isConnected) btn.textContent = orig; }, 1200);
    }
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(() => done(true), () => done(false));
  } else {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(true); } catch (e) { done(false); }
    ta.remove();
  }
}

/* ccToast — small aria-live toast surface. Use ccToast('text') after any
 * silent UI action (mark-reviewed, copy-link, save) so user gets feedback. */
function ccToast(text, kind) {
  let host = document.getElementById("cc-toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "cc-toast-host";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    host.setAttribute("aria-atomic", "true");
    document.body.appendChild(host);
  }
  const toast = document.createElement("div");
  toast.className = "cc-toast" + (kind ? " cc-toast-" + kind : "");
  toast.textContent = text;
  host.appendChild(toast);
  // Animate in next frame
  requestAnimationFrame(() => toast.classList.add("is-show"));
  setTimeout(() => {
    toast.classList.remove("is-show");
    setTimeout(() => toast.remove(), 220);
  }, 2400);
}

/* ══════════════════════════════════════════════
   DESIGN SYSTEM — Smart Helpers
   ══════════════════════════════════════════════ */

/* تنسيق رقم: 1234 -> "1,234", 1234567 -> "1.2M" */
function fmtNum(n) {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 10_000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("en-US");
}

/* عملة بفاصلات ورمز */
function fmtCurrency(n, code = "USD") {
  const symbol = { USD: "$", TRY: "₺", EUR: "€" }[code] || code;
  return symbol + fmtNum(Math.abs(n));
}

/* تعدد عربي صحيح */
function arPlural(n, singular, dual, plural3to10, plural11plus) {
  if (n === 0) return `لا ${plural3to10}`;
  if (n === 1) return singular;
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return `${n} ${plural3to10}`;
  return `${n} ${plural11plus || plural3to10}`;
}
const arPluralEmp = (n) => arPlural(n, "موظف واحد", "موظفان", "موظفين", "موظفاً");
const arPluralProj = (n) => arPlural(n, "مشروع واحد", "مشروعان", "مشاريع", "مشروعاً");
const arPluralDept = (n) => arPlural(n, "قسم واحد", "قسمان", "أقسام", "قسماً");
const arPluralIdea = (n) => arPlural(n, "فكرة واحدة", "فكرتان", "أفكار", "فكرة");

/* صيغة وحدة زمنية عربية صحيحة:
   1     → "منذ أسبوع"        (مفرد بدون رقم)
   2     → "منذ أسبوعين"      (مثنى بدون رقم)
   3-10  → "منذ 3 أسابيع"     (جمع كثرة)
   11+   → "منذ 15 أسبوعاً"   (مفرد منصوب)             */
function _arTimeUnit(n, single, dual, plural3to10, singularAccusative) {
  if (n === 1) return `منذ ${single}`;
  if (n === 2) return `منذ ${dual}`;
  if (n >= 3 && n <= 10) return `منذ ${n} ${plural3to10}`;
  return `منذ ${n} ${singularAccusative || single}`;
}

/* وقت نسبي بالعربية — يحدّث تلقائياً */
function relTime(iso) {
  if (!iso) return "";
  const then = new Date(iso);
  const diff = (Date.now() - then.getTime()) / 1000;
  if (diff < 30) return "الآن";
  if (diff < 60) return `منذ ${Math.floor(diff)} ثانية`;
  if (diff < 120) return "منذ دقيقة";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return _arTimeUnit(m, "دقيقة", "دقيقتين", "دقائق", "دقيقة");
  }
  if (diff < 7200) return "منذ ساعة";
  if (diff < 86400) {
    const hr = Math.floor(diff / 3600);
    return _arTimeUnit(hr, "ساعة", "ساعتين", "ساعات", "ساعة");
  }
  if (diff < 172800) return "أمس";
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return _arTimeUnit(d, "يوم", "يومين", "أيام", "يوماً");
  }
  if (diff < 2592000) {
    const w = Math.floor(diff / 604800);
    return _arTimeUnit(w, "أسبوع", "أسبوعين", "أسابيع", "أسبوعاً");
  }
  if (diff < 31536000) {
    const mo = Math.floor(diff / 2592000);
    return _arTimeUnit(mo, "شهر", "شهرين", "أشهر", "شهراً");
  }
  const yr = Math.floor(diff / 31536000);
  return _arTimeUnit(yr, "سنة", "سنتين", "سنوات", "سنة");
}

/* تحية ذكية حسب الوقت */
function smartGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "صباح الخير", em: "☀️", tone: "morning" };
  if (h >= 12 && h < 17) return { text: "مساء النور", em: "🌞", tone: "afternoon" };
  if (h >= 17 && h < 21) return { text: "مساء الخير", em: "🌆", tone: "evening" };
  return { text: "ليلة سعيدة", em: "🌙", tone: "night" };
}

/* تاريخ اليوم بصيغة عربية */
function todayLong() {
  return new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* تصنيف "طزاجة" حسب آخر تحديث */
function staleness(iso) {
  if (!iso) return { level: "unknown", label: "لم يُحدّث", cl: "#94a3b8" };
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (days < 1) return { level: "fresh", label: "اليوم", cl: "#10b981" };
  if (days < 7) return { level: "recent", label: "هذا الأسبوع", cl: "#0ea5e9" };
  if (days < 30) return { level: "ok", label: "هذا الشهر", cl: "#6366f1" };
  if (days < 60) return { level: "stale", label: "متأخر", cl: "#f59e0b" };
  return { level: "very-stale", label: "قديم جداً", cl: "#ef4444" };
}

/* اشتقاق لون حالة من رقم مع هدف */
function statusFromTarget(value, target) {
  if (!target || value <= 0) return "#94a3b8";
  const pct = (value / target) * 100;
  if (pct >= 100) return "#10b981";
  if (pct >= 70) return "#84cc16";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

/* الأبجدية الأولى من اسم — يدعم العربي */
function nameInitial(s) {
  return (String(s || "?").trim().match(/\S/) || ["?"])[0];
}

/* نسخ آمن للحافظة مع feedback */
window.copyToClipboard = function (text, btn) {
  return navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const orig = btn.textContent;
      const wasDisabled = btn.disabled;
      btn.textContent = "✓ تم النسخ";
      btn.disabled = true;
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = wasDisabled;
        btn.classList.remove("copied");
      }, 1500);
    }
  });
};

/* mini sparkline من قائمة أرقام */
function _miniSpark(values, color = "#6366f1", w = 60, h = 18) {
  if (!values || !values.length) return "";
  const max = Math.max(...values, 1);
  const step = w / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    `<svg class="cc-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

/* تشغيل tick حي لتحديث الأوقات النسبية كل دقيقة */
let _liveTickInterval = null;
function _startLiveTicks() {
  if (_liveTickInterval) clearInterval(_liveTickInterval);
  _liveTickInterval = setInterval(() => {
    document.querySelectorAll("[data-live-time]").forEach((el) => {
      el.textContent = relTime(el.dataset.liveTime);
    });
  }, 60_000);
}

/* ════════════════════════════════════════════════════════════
   BRIDGE — نظام الربط الذكي بين كل الأقسام
   عند أي ضغط على تحذير: ينقلك للقسم + يُضيء العنصر + سبب الانتقال
   ════════════════════════════════════════════════════════════ */

window.__bridge = null;

/* استخدام: نمرر السياق ثم نتنقل */
window.ccGoWithContext = function (page, context) {
  window.__bridge = {
    ...context,
    timestamp: Date.now(),
    fromPage: window.cur || "home",
  };
  go(page);
};

/* بعد كل render نطبّق الإضاءة إن وُجد bridge */
function _applyBridgeHighlight() {
  const b = window.__bridge;
  if (!b) return;
  // تجاهل bridge قديم (>30 ثانية)
  if (Date.now() - b.timestamp > 30_000) {
    window.__bridge = null;
    return;
  }
  // banner شرحي في أعلى الصفحة
  const main = document.getElementById("app");
  if (main && b.reason) {
    const banner = document.createElement("div");
    banner.className = "cc-bridge-banner";
    banner.innerHTML =
      `<span class="cc-bridge-em">↓</span>` +
      `<span class="cc-bridge-text">${E(b.reason)}</span>` +
      (b.highlight && b.highlight.length
        ? `<span class="cc-bridge-count">${b.highlight.length}</span>`
        : "") +
      `<button class="cc-bridge-close" onclick="this.parentElement.remove();window.__bridge=null">×</button>`;
    main.insertBefore(banner, main.firstChild);
    setTimeout(() => banner.classList.add("show"), 50);
  }
  // إضاءة العناصر المستهدفة
  if (b.highlight && b.highlight.length) {
    setTimeout(() => {
      let firstEl = null;
      b.highlight.forEach((name) => {
        // ابحث بالاسم في أي بطاقة
        document.querySelectorAll("[data-cc-name]").forEach((el) => {
          if (el.dataset.ccName === name || el.dataset.ccName?.includes(name)) {
            el.classList.add("cc-highlight");
            if (!firstEl) firstEl = el;
          }
        });
        // fallback: ابحث في النصوص
        if (!firstEl) {
          document.querySelectorAll(".prj-card, .emp-card, .umb-card").forEach((el) => {
            if (el.textContent.includes(name) && !el.classList.contains("cc-highlight")) {
              el.classList.add("cc-highlight");
              if (!firstEl) firstEl = el;
            }
          });
        }
      });
      // scroll للأول
      if (firstEl) {
        firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          document.querySelectorAll(".cc-highlight").forEach((el) => el.classList.remove("cc-highlight"));
          window.__bridge = null;
        }, 6000);
      }
    }, 200);
  }
}

/* ── ICON SYSTEM — Lucide SVG icons replace emojis ── */
const IC = {
  "🏠": "home",
  "🚀": "rocket",
  "🗺️": "map",
  "⚙️": "settings",
  "🖥️": "monitor",
  "🤖": "bot",
  "🛠️": "wrench",
  "💡": "lightbulb",
  "☁️": "cloud",
  "🗄️": "archive",
  "🏨": "building-2",
  "💒": "heart",
  "📢": "megaphone",
  "💳": "credit-card",
  "⚡": "zap",
  "💬": "message-circle",
  "🌐": "globe",
  "♟️": "trophy",
  "🧠": "brain",
  "💰": "wallet",
  "🏦": "landmark",
  "💱": "arrow-right-left",
  "🏢": "building",
  "🛍️": "shopping-bag",
  "🏗️": "hard-hat",
  "📸": "camera",
  "🔐": "lock-keyhole",
  "🦞": "terminal",
  "🐙": "github",
  "📊": "bar-chart-3",
  "✈️": "send",
  "🔍": "search",
  "🕷️": "scan-search",
  "🔗": "link",
  "🪙": "circle-dollar-sign",
  "🚂": "train-front",
  "📝": "file-text",
  "🔒": "shield-check",
  "📁": "folder-open",
  "🔧": "settings",
  "🕵️": "scan-eye",
  "📘": "book-open",
  "🟣": "circle-dot",
  "▲": "triangle",
  "⏰": "clock",
  "💾": "hard-drive",
  "🛡️": "shield",
  "📱": "smartphone",
  "📦": "package",
  "🎯": "target",
  "🔄": "refresh-cw",
  "🐳": "container",
  "📡": "radio-tower",
  "👥": "users",
  "🌍": "earth",
  "📈": "trending-up",
  "💹": "trending-up",
  "🎨": "palette",
  "🔔": "bell",
  "🎮": "gamepad-2",
  "👤": "user",
  "📌": "pin",
  "⚠️": "alert-triangle",
  "📂": "folder",
  "🏷️": "tag",
  "📐": "ruler",
  "📍": "map-pin",
  "📄": "file-text",
  "⛔": "ban",
  "🔴": "circle",
  "🟡": "circle",
  "⚫": "circle",
  "🔥": "flame",
};

/* _icText(str) — replaces leading emoji in text with icon */
function _icText(str) {
  if (!str) return "";
  const chars = [...str];
  const first = chars[0];
  const nm = IC[first];
  if (nm)
    return (
      _ic(first, 12) +
      " " +
      E(
        str
          .replace(first, "")
          .replace(/^\uFE0F/, "")
          .trim(),
      )
    );
  // Try two-char emoji
  if (chars.length > 1) {
    const two = chars[0] + chars[1];
    const nm2 = IC[two];
    if (nm2)
      return (
        _ic(two, 12) +
        " " +
        E(
          str
            .substring(two.length)
            .replace(/^\uFE0F/, "")
            .trim(),
        )
      );
  }
  return E(str);
}

/* _projAnim(emoji, color) — animated SVG motion graphic per project */
function _projAnim(em, cl) {
  const A = {
    "🏨": `<svg viewBox="0 0 44 44" width="38" height="38"><rect x="10" y="8" width="24" height="30" rx="2" fill="none" stroke="${cl}" stroke-width="1.5"/><rect x="18" y="30" width="8" height="8" rx="1" fill="none" stroke="${cl}" stroke-width="1.5"/><rect x="14" y="13" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:0s"/><rect x="20" y="13" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:.4s"/><rect x="26" y="13" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:.8s"/><rect x="14" y="19" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1.2s"/><rect x="20" y="19" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1.6s"/><rect x="26" y="19" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:2s"/><rect x="14" y="25" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:.2s"/><rect x="20" y="25" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1s"/><rect x="26" y="25" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1.8s"/></svg>`,

    "💒": `<svg viewBox="0 0 44 44" width="38" height="38"><path d="M22 8 L22 16" stroke="${cl}" stroke-width="1.5" stroke-linecap="round"/><path d="M22 14 C16 14 12 20 12 24 L12 36 L32 36 L32 24 C32 20 28 14 22 14Z" fill="none" stroke="${cl}" stroke-width="1.5"/><circle cx="22" cy="22" r="4" fill="none" stroke="${cl}" stroke-width="1.2" class="pm-beat"/><rect x="19" y="30" width="6" height="6" rx="1" fill="none" stroke="${cl}" stroke-width="1.2"/><circle cx="22" cy="8" r="2" fill="${cl}" class="pm-sparkle"/><circle cx="16" cy="11" r="1" fill="${cl}" class="pm-sparkle" style="--d:.5s"/><circle cx="28" cy="11" r="1" fill="${cl}" class="pm-sparkle" style="--d:1s"/></svg>`,

    "📢": `<svg viewBox="0 0 44 44" width="38" height="38"><path d="M10 18 L10 26 L16 26 L24 32 L24 12 L16 18Z" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linejoin="round"/><path d="M28 16 C30 18 30 26 28 28" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linecap="round" class="pm-wave" style="--d:0s"/><path d="M31 12 C35 16 35 28 31 32" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linecap="round" class="pm-wave" style="--d:.3s"/><path d="M34 8 C40 14 40 30 34 36" fill="none" stroke="${cl}" stroke-width="1.2" stroke-linecap="round" class="pm-wave" style="--d:.6s"/></svg>`,

    "💳": `<svg viewBox="0 0 44 44" width="38" height="38"><rect x="6" y="12" width="32" height="22" rx="3" fill="none" stroke="${cl}" stroke-width="1.5"/><line x1="6" y1="19" x2="38" y2="19" stroke="${cl}" stroke-width="1.5"/><rect x="10" y="24" width="10" height="2" rx="1" fill="${cl}" opacity=".4"/><rect x="10" y="28" width="6" height="2" rx="1" fill="${cl}" opacity=".3"/><line x1="0" y1="12" x2="0" y2="34" stroke="${cl}" stroke-width="2" stroke-linecap="round" class="pm-scan"/></svg>`,

    "⚡": `<svg viewBox="0 0 44 44" width="38" height="38"><polygon points="24,4 12,24 20,24 18,40 32,18 24,18" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linejoin="round" class="pm-flash"/><circle cx="22" cy="22" r="18" fill="none" stroke="${cl}" stroke-width=".8" opacity=".15" class="pm-ring1"/><circle cx="22" cy="22" r="14" fill="none" stroke="${cl}" stroke-width=".6" opacity=".1" class="pm-ring2"/></svg>`,

    "💬": `<svg viewBox="0 0 44 44" width="38" height="38"><rect x="6" y="8" width="22" height="16" rx="4" fill="none" stroke="${cl}" stroke-width="1.5"/><path d="M12 24 L10 30 L18 24" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linejoin="round"/><rect x="18" y="18" width="18" height="12" rx="3" fill="none" stroke="${cl}" stroke-width="1.2" class="pm-bubble"/><circle cx="13" cy="15" r="1.2" fill="${cl}" class="pm-dot" style="--d:0s"/><circle cx="17" cy="15" r="1.2" fill="${cl}" class="pm-dot" style="--d:.3s"/><circle cx="21" cy="15" r="1.2" fill="${cl}" class="pm-dot" style="--d:.6s"/></svg>`,

    "🌐": `<svg viewBox="0 0 44 44" width="38" height="38"><circle cx="22" cy="22" r="16" fill="none" stroke="${cl}" stroke-width="1.5"/><ellipse cx="22" cy="22" rx="8" ry="16" fill="none" stroke="${cl}" stroke-width="1" opacity=".5"/><line x1="6" y1="22" x2="38" y2="22" stroke="${cl}" stroke-width=".8" opacity=".4"/><line x1="6" y1="16" x2="38" y2="16" stroke="${cl}" stroke-width=".6" opacity=".25"/><line x1="6" y1="28" x2="38" y2="28" stroke="${cl}" stroke-width=".6" opacity=".25"/><circle cx="34" cy="10" r="3" fill="none" stroke="${cl}" stroke-width="1" class="pm-orbit"/></svg>`,

    "♟️": `<svg viewBox="0 0 44 44" width="38" height="38"><circle cx="22" cy="12" r="5" fill="none" stroke="${cl}" stroke-width="1.5"/><path d="M16 38 L16 30 C16 26 18 24 22 22 C26 24 28 26 28 30 L28 38" fill="none" stroke="${cl}" stroke-width="1.5"/><line x1="14" y1="38" x2="30" y2="38" stroke="${cl}" stroke-width="1.5" stroke-linecap="round"/><line x1="22" y1="7" x2="22" y2="4" stroke="${cl}" stroke-width="1.2" stroke-linecap="round"/><rect x="12" y="6" width="20" height="36" fill="${cl}" opacity="0" class="pm-shine"/></svg>`,
  };
  return A[em] || _ic(em, 22);
}

/* _ic(emoji, size) — returns Lucide icon markup */
function _ic(em, sz) {
  const nm = IC[em];
  if (!nm) return em || "";
  const s = sz || 20;
  const sw = s > 28 ? 1.5 : s > 18 ? 1.75 : 2;
  return `<span class="ic-wrap" style="width:${s}px;height:${s}px;display:inline-flex;align-items:center;justify-content:center;line-height:0"><i data-lucide="${nm}" style="width:${s}px;height:${s}px" stroke-width="${sw}"></i></span>`;
}

/* _processIcons — aggressive: scans ALL DOM for remaining emojis */
function _processIcons() {
  if (!window.lucide) return;
  // Target known containers
  const targets = [
    [".nav-icon", 16, 2],
    [".bar-icon", 20, 2],
    [".more-icon", 22, 2],
    [".brand-icon", 20, 2.5],
    [".orb-icon", 22, 2],
    [".svc-em", 18, 2],
    [".planet-emoji", 26, 1.5],
    [".book-emoji", 32, 1.5],
    [".sticky-emoji", 36, 1.5],
    [".bot-emoji", 26, 2],
    [".map-item>span:first-child", 18, 2],
  ];
  targets.forEach(([sel, sz, sw]) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.querySelector("svg")) return;
      const em = el.textContent.trim();
      const nm = IC[em];
      if (nm)
        el.innerHTML = `<i data-lucide="${nm}" style="width:${sz}px;height:${sz}px" stroke-width="${sw}"></i>`;
    });
  });
  // Handle ANY span with font-size containing single emoji
  document.querySelectorAll('span[style*="font-size"]').forEach((el) => {
    if (el.querySelector("svg") || el.children.length > 0) return;
    const em = el.textContent.trim();
    if (!em || em.length > 4) return;
    const nm = IC[em];
    if (nm) {
      const m = el.style.fontSize.match(/(\d+)/);
      const sz = m ? parseInt(m[1]) : 24;
      el.innerHTML = `<i data-lucide="${nm}" style="width:${sz}px;height:${sz}px" stroke-width="${sz > 28 ? 1.5 : 2}"></i>`;
    }
  });
  lucide.createIcons();
}

let RUNTIME_STATE = {
  generated_at: null,
  checker: null,
  coverage: {},
  project: {},
  service: {},
  tool: {},
  cloud: {},
  bot: {},
  archive: {},
  automation: {},
};

/* Aggregate runtime coverage across all entity kinds → {ok,warn,fail,manual,total} */
function _runtimeAggregate() {
  const cov = RUNTIME_STATE.coverage || {};
  const sum = { ok: 0, warn: 0, fail: 0, manual: 0, total: 0 };
  Object.values(cov).forEach((v) => {
    if (!v || typeof v !== "object") return;
    ["ok", "warn", "fail", "manual", "total"].forEach((k) => {
      sum[k] += Number(v[k]) || 0;
    });
  });
  return sum;
}

/* Health cluster HTML — compact pills for the top bar */
function _healthClusterHTML() {
  const a = _runtimeAggregate();
  if (!a.total) {
    return `<div class="cc-health-cluster cc-health-empty" title="بيانات التحقق غير محمّلة بعد">` +
      `<span class="cc-health-pill cc-health-idle">··· تحقّق</span></div>`;
  }
  const synced = RUNTIME_STATE.generated_at;
  const parts = [];
  parts.push(`<span class="cc-health-pill cc-health-ok" title="مؤكَّد">✓ ${a.ok}</span>`);
  if (a.warn) parts.push(`<span class="cc-health-pill cc-health-warn" title="يحتاج انتباهًا">⚠ ${a.warn}</span>`);
  if (a.fail) parts.push(`<span class="cc-health-pill cc-health-fail" title="فشل">✗ ${a.fail}</span>`);
  if (a.manual) parts.push(`<span class="cc-health-pill cc-health-manual" title="تحقّق يدوي">◐ ${a.manual}</span>`);
  const syncHTML = synced
    ? `<span class="cc-health-sync" data-live-time="${E(synced)}" title="آخر مزامنة تلقائية">${E(relTime(synced))}</span>`
    : "";
  return `<button class="cc-health-cluster" data-action="goPage" data-arg="home" aria-label="ملخّص صحة الأنظمة — افتح الرئيسية">` +
    parts.join("") + syncHTML + `</button>`;
}

/* Re-render the health cluster in place (after runtime loads) */
function _refreshHealthCluster() {
  const host = document.getElementById("cc-health-slot");
  if (host) {
    host.innerHTML = _healthClusterHTML();
    requestAnimationFrame(_processIcons);
  }
}

/* Map a runtime (kind,id) back to its data.js entity + a click handler.
 * Returns {name, em, cl, openCall} or null. */
function _runtimeEntityRef(kind, id) {
  if (kind === "project") {
    const p = (typeof PRJ !== "undefined" ? PRJ : []).find((x) => x.id === id);
    if (p) return { name: p.ar || p.name, em: p.em, cl: p.cl, open: `openProjectDetail('${EJ(p.name)}')` };
  } else if (kind === "service") {
    const s = (typeof SVC !== "undefined" ? SVC : []).find((x) => x.id === id);
    if (s) return { name: s.ar || s.name, em: s.em, cl: "#06B6D4", open: `openServiceDetail('${EJ(s.name)}')` };
  } else if (kind === "tool") {
    const t = (typeof TL !== "undefined" ? TL : []).find((x) => x.id === id);
    if (t) return { name: t.ar || t.name, em: t.em, cl: t.cl, open: `openToolDetail('${EJ(t.name)}')` };
  } else if (kind === "cloud") {
    const c = (typeof CLD !== "undefined" ? CLD : []).find((x) => x.id === id);
    if (c) return { name: c.ar || c.nm || c.name, em: c.em, cl: c.cl, open: `openCloudDetail('${EJ(c.nm || c.name)}')` };
  } else if (kind === "bot") {
    const b = (typeof BOT !== "undefined" ? BOT : []).find((x) => x.id === id);
    if (b) return { name: b.ar || b.name, em: b.em, cl: b.cl, open: `openBotDetail('${EJ(b.name)}')` };
  } else if (kind === "archive") {
    const a = (typeof ARC !== "undefined" ? ARC : []).find((x) => x.id === id);
    if (a) return { name: a.ar || a.name, em: a.em, cl: a.cl, open: `openArchiveDetail('${EJ(a.name)}')` };
  } else if (kind === "automation") {
    return { name: id.split("::").pop(), em: "⚙️", cl: "#22D3EE", open: `openAutoDetail('${EJ(id)}')` };
  }
  return null;
}

/* Staleness widget — surfaces runtime entities flagged stale===true,
 * sorted oldest-verified first. Hidden entirely when nothing is stale. */
function _stalenessWidget() {
  const kinds = ["project", "service", "tool", "cloud", "bot", "archive", "automation"];
  const stale = [];
  kinds.forEach((kind) => {
    const bucket = RUNTIME_STATE[kind] || {};
    Object.entries(bucket).forEach(([id, rec]) => {
      if (rec && rec.stale === true) {
        stale.push({ kind, id, verified: rec.verified_at || rec.stale_at || null, summary: rec.summary || "" });
      }
    });
  });
  if (!stale.length) return "";
  stale.sort((a, b) => new Date(a.verified || 0) - new Date(b.verified || 0));
  const rows = stale.slice(0, 8).map((s) => {
    const ref = _runtimeEntityRef(s.kind, s.id);
    const name = ref ? ref.name : s.id;
    const cl = ref ? ref.cl : "#94a3b8";
    const open = ref ? ref.open : "";
    const kindLabel = {
      project: "مشروع", service: "خدمة", tool: "أداة", cloud: "سحابة",
      bot: "بوت", archive: "أرشيف", automation: "أتمتة",
    }[s.kind] || s.kind;
    return (
      `<button class="cc-stale-item cc-clickable" onclick="${open}" style="--sc:${cl}">` +
      `<span class="cc-stale-dot"></span>` +
      `<span class="cc-stale-name">${E(name)}</span>` +
      `<span class="cc-stale-kind">${E(kindLabel)}</span>` +
      (s.verified
        ? `<span class="cc-stale-age" data-live-time="${E(s.verified)}">${E(relTime(s.verified))}</span>`
        : "") +
      `</button>`
    );
  }).join("");
  return (
    `<section class="cc-stale">` +
    `<h2 class="cc-section-title">` +
    `<span class="cc-section-em">🕓</span>` +
    `يحتاج إعادة تحقّق` +
    `<span class="cc-section-badge">${stale.length}</span>` +
    `</h2>` +
    `<div class="cc-stale-list">${rows}</div>` +
    `</section>`
  );
}

async function _loadRuntimeData() {
  try {
    const response = await fetch(`data.runtime.json?v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = await response.json();
    if (payload && typeof payload === "object") {
      RUNTIME_STATE = {
        generated_at: payload.generated_at || null,
        checker: payload.checker || null,
        coverage: payload.coverage || {},
        project: payload.project || {},
        service: payload.service || {},
        tool: payload.tool || {},
        cloud: payload.cloud || {},
        bot: payload.bot || {},
        archive: payload.archive || {},
        automation: payload.automation || {},
      };
    }
  } catch (err) {
    console.warn("[CC] runtime fetch failed:", err.message);
  }
}

/* ──── HEALTH MONITOR — يقرأ health-status.json كل تحميل ──── */
let HEALTH_STATE = null;
async function _loadHealthData() {
  try {
    const response = await fetch(`health-status.json?v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    HEALTH_STATE = await response.json();
    // refresh home if visible
    if (cur === "home" && document.getElementById("page-home")) {
      const home = document.getElementById("page-home");
      home.innerHTML = R.home();
      requestAnimationFrame(_processIcons);
    }
  } catch (err) {
    console.warn("[CC] health fetch failed:", err.message);
  }
}

function _refreshRuntimeBoundViews() {
  const parts = _hashParts();
  const page = parts[0];
  const itemName = parts[1] ? decodeURIComponent(parts[1]) : null;
  if (
    itemName &&
    _entityLookup(itemName) &&
    document.getElementById("detail-view")
  ) {
    closeDetail(true);
    openDetailSmart(itemName, page);
    return;
  }
  // Re-render pages whose content depends on runtime state.
  // _RUNTIME_BOUND_PAGES is the single source of truth (defined near _activatePage).
  if (!_RUNTIME_BOUND_PAGES.has(cur)) return;
  const pageEl = document.getElementById("page-" + cur);
  if (!pageEl || !R[cur]) return;
  // PHASE-3B: diff-and-patch instead of nuke-rebuild — preserves scroll,
  // focus, hover states, and any inputs the user is currently typing in.
  smartRender(pageEl, R[cur]());
  _updateCountdown();
  requestAnimationFrame(_processIcons);
}

/* Runtime status tokens for an entity — used by dense-page filters.
 * Returns a space-joined string like "rt-warn rt-stale" (may be empty). */
function _rtStatusTokens(kind, id) {
  const rec = (RUNTIME_STATE[kind] || {})[id];
  if (!rec) return "";
  const t = [];
  const s = rec.verification_status;
  if (s === "ok") t.push("rt-ok");
  else if (s === "warn") t.push("rt-warn");
  else if (s === "fail") t.push("rt-warn", "rt-fail");
  else if (s === "manual") t.push("rt-manual");
  if (rec.stale === true) t.push("rt-stale");
  return t.join(" ");
}

function _entityLookup(name) {
  if (!name) return null;
  // First try exact match (fast path, common case)
  let hit = (
    PRJ.find((x) => x.name === name || x.ar === name) ||
    BOT.find((x) => x.name === name || x.ar === name) ||
    CLD.find((x) => x.nm === name) ||
    TL.find((x) => x.name === name || x.ar === name) ||
    ARC.find((x) => x.name === name || x.ar === name) ||
    IDEAS.find((x) => x.name === name) ||
    SVC.find((x) => x.name === name) ||
    null
  );
  if (hit) return hit;
  // PHASE-5B: fall back to case-insensitive — shared links like
  // #projects/libya (lowercased by user) used to silently fail.
  const lc = name.toLowerCase();
  const ci = (arr, ...keys) => arr.find((x) => keys.some((k) => (x[k] || "").toLowerCase() === lc));
  return (
    ci(PRJ, "name", "ar", "id") ||
    ci(BOT, "name", "ar", "id") ||
    ci(CLD, "nm", "id") ||
    ci(TL, "name", "ar", "id") ||
    ci(ARC, "name", "ar", "id") ||
    ci(IDEAS, "name", "id") ||
    ci(SVC, "name", "id") ||
    null
  );
}

function _entityColor(name, fallback) {
  const entity = _entityLookup(name);
  return entity?.cl || _prjColor(name) || fallback || "#888";
}

function _runtimeRecord(kind, item) {
  if (!item?.id || !RUNTIME_STATE?.[kind]) return null;
  return RUNTIME_STATE[kind][item.id] || null;
}

function _runtimeStatusMeta(status) {
  return (
    {
      ok: { label: "مؤكد", color: "#059669" },
      warn: { label: "يحتاج انتباهًا", color: "#D97706" },
      fail: { label: "فشل التحقق", color: "#DC2626" },
      manual: { label: "مراجعة يدوية", color: "#6B7280" },
      unknown: { label: "غير معروف", color: "#6B7280" },
    }[status] || { label: status || "غير معروف", color: "#6B7280" }
  );
}

function _fmtRuntimeDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function _relChips(names) {
  if (!names || !names.length) return "";
  return [...new Set(names.filter(Boolean))]
    .map((rn) => {
      const rp = _entityLookup(rn);
      const label = rp ? rp.ar || rp.name || rp.nm : rn;
      return rp
        ? `<span class="meta-chip">${_ic(rp.em, 12)} ${E(label)}</span>`
        : `<span class="meta-chip">${E(rn)}</span>`;
    })
    .join("");
}

function _archiveKindLabel(item) {
  const map = {
    "archived-project": "مشروع مؤرشف",
    "archived-brand": "هوية مؤرشفة",
    "archived-client-work": "عمل عميل مؤرشف",
    "archived-site-export": "تصدير موقع مؤرشف",
    "archived-tool": "أداة مؤرشفة",
    "active-security": "مرجع أمني نشط",
    "active-runtime": "طبقة تشغيل نشطة",
  };
  return map[item.kind] || (item.st === "a" ? "نشط" : "مؤرشف");
}

function _archiveStamp(item) {
  if (item.kind === "active-security") return "نشط";
  if (item.kind === "active-runtime") return "Runtime";
  if (item.st === "a") return "نشط";
  return "مؤرشف";
}

function _projectKindLabel(kind) {
  return (
    {
      product: "منتج",
      umbrella: "منظومة",
      dashboard: "لوحة",
      website: "موقع",
      "service-app": "خدمة",
      "content-product": "منتج محتوى",
      "internal-tool": "أداة داخلية",
      "financial-app": "تطبيق مالي",
    }[kind] || kind
  );
}

function _toolCategoryLabel(category) {
  return (
    {
      "developer-env": "AI CLI",
      "internal-tool": "أداة داخلية",
      platform: "منصة",
      "infra-access": "وصول بنية",
      mcp: "MCP",
    }[category] || category
  );
}

function _botKindLabel(kind) {
  return (
    {
      "telegram-bot": "بوت Telegram",
      "agent-runtime": "runtime وكلاء",
      "assistant-channel": "قناة مساعد",
      "financial-app": "تطبيق مالي",
    }[kind] || kind
  );
}

function _cloudCategoryLabel(category) {
  return (
    {
      platform: "منصة",
      "database-platform": "منصة بيانات",
      deployment: "نشر",
      "marketing-platform": "تسويق",
      "data-platform": "بيانات",
      communication: "تواصل",
      infrastructure: "بنية",
      storage: "تخزين",
      "mcp-linked": "MCP",
      network: "شبكة",
      "external-api": "API",
    }[category] || category
  );
}

function _serviceTypeLabel(kind) {
  return (
    {
      app: "تطبيق",
      container: "حاوية",
      database: "قاعدة بيانات",
      "agent-runtime": "runtime",
      "user-service": "خدمة مستخدم",
      cron: "cron",
      network: "شبكة",
    }[kind] || kind
  );
}

function _entityMeta(item, kind) {
  const base =
    typeof DATA_TRUST_MODEL !== "undefined" && DATA_TRUST_MODEL[kind]
      ? DATA_TRUST_MODEL[kind]
      : {};
  const derived = {};

  if (kind === "project") {
    if (item.server_path) derived.source = "server path + manual audit";
    else if (item.local_path) derived.source = "local path + source files";
    else if (item.repo_url || item.deploy_url)
      derived.source = "repo + deploy surface";
  }
  if (kind === "service") {
    derived.source = "server runtime audit";
  }
  if (kind === "tool") {
    if (item.category === "developer-env") {
      derived.source = "config files مباشرة";
      derived.refresh_mode = "file-audit";
      derived.auto_refresh = "future: file watcher";
      derived.stale_after = "7d";
    }
  }
  if (kind === "cloud") {
    derived.source = item.lk
      ? "dashboard/link + manual linkage"
      : "manual linkage";
  }
  if (kind === "bot") {
    derived.source =
      item.kind === "agent-runtime"
        ? "runtime + server path"
        : "config/manual runtime audit";
  }

  return { ...base, ...derived, ...(item.meta || {}) };
}

function _metaModeLabel(mode) {
  return (
    {
      "manual-audit": "مراجعة يدوية من المصدر",
      "runtime-audit": "تحقق دوري من المصدر المناسب",
      "file-audit": "فحص ملفات الإعداد",
      "manual-curation": "تحرير يدوي",
    }[mode] ||
    mode ||
    "غير محدد"
  );
}

function _entityTrustBox(item, kind) {
  const meta = _entityMeta(item, kind);
  const runtime = _runtimeRecord(kind, item);
  const runtimeMeta = runtime
    ? _runtimeStatusMeta(runtime.verification_status)
    : null;
  if (
    !meta ||
    (!meta.source &&
      !meta.refresh_mode &&
      !meta.stale_after &&
      !meta.auto_refresh)
  )
    return "";
  return (
    `<div class="trust-box">` +
    `<div class="trust-box-head"><strong>مصدر وتحديث البيانات</strong><span>سياسة التوثيق: ${E(_metaModeLabel(meta.refresh_mode))}</span></div>` +
    `<div class="trust-section-head trust-section-head--plan">وصف ثابت للعنصر</div>` +
    `<div class="trust-grid">` +
    (meta.source
      ? `<div class="trust-item"><span>المصدر</span><strong>${E(meta.source)}</strong></div>`
      : "") +
    (meta.stale_after
      ? `<div class="trust-item"><span>حد التقادم</span><strong>${E(meta.stale_after)}</strong></div>`
      : "") +
    (meta.auto_refresh
      ? `<div class="trust-item trust-item-wide trust-item-plan"><span>${String(meta.auto_refresh).startsWith("نشط الآن") ? "التحديث الآلي الحالي" : "مسار الأتمتة لاحقًا"}</span><strong>${E(meta.auto_refresh)}</strong></div>`
      : "") +
    `</div>` +
    (runtime
      ? `<div class="trust-live"><div class="trust-section-head trust-section-head--live">آخر نتيجة تحقق آلي محفوظة</div><div class="trust-grid">` +
        `<div class="trust-item"><span>حالة آخر تحقق</span><strong><span class="runtime-badge" style="--rb:${runtimeMeta.color}">${E(runtimeMeta.label)}</span></strong></div>` +
        `<div class="trust-item"><span>آخر تحقق</span><strong>${E(_fmtRuntimeDate(runtime.verified_at))}</strong></div>` +
        (runtime?.checked_from
          ? `<div class="trust-item"><span>من أين تم التحقق</span><strong>${E(runtime.checked_from)}</strong></div>`
          : "") +
        (runtime?.summary
          ? `<div class="trust-item trust-item-wide"><span>النتيجة الحالية</span><strong>${E(runtime.summary)}</strong>${runtime.facts?.length ? `<div class="runtime-facts">${runtime.facts.map((f) => `<span class="runtime-fact">${E(f)}</span>`).join("")}</div>` : ""}</div>`
          : "") +
        `</div></div>`
      : "") +
    `</div>`
  );
}

function _searchableText(v) {
  if (!v) return "";
  if (Array.isArray(v)) return v.map(_searchableText).join(" ");
  if (typeof v === "object")
    return Object.values(v).map(_searchableText).join(" ");
  return String(v);
}

function _buildSearchIndex() {
  const rows = [];
  const push = (entry) =>
    rows.push({
      id: entry.id,
      kind: entry.kind,
      page: entry.page,
      title: entry.title,
      subtitle: entry.subtitle || "",
      action: entry.action || null,
      tokens: _searchableText(entry.tokens).toLowerCase(),
    });

  PRJ.forEach((p) =>
    push({
      id: p.id,
      kind: "project",
      page: "projects",
      title: p.ar || p.name,
      subtitle: p.summary || p.kind,
      action: () => {
        go("projects");
        setTimeout(() => openProjectDetail(p.name), 120);
      },
      tokens: [
        p.name,
        p.ar,
        p.summary,
        p.desc,
        p.tags,
        p.stack,
        p.subsystems,
        p.local_path,
        p.server_path,
        p.repo_url,
        p.deploy_url,
      ],
    }),
  );

  SVC.forEach((s) =>
    push({
      id: s.id,
      kind: "service",
      page: "server",
      title: s.name,
      subtitle: [s.owner || s.prj, s.service_type, s.host]
        .filter(Boolean)
        .join(" · "),
      action: () => {
        go("server");
        setTimeout(() => openServiceDetail(s.name), 120);
      },
      tokens: [
        s.name,
        s.prj,
        s.owner,
        s.owner_type,
        s.info,
        s.dt,
        s.path,
        s.runtime,
        s.service_type,
        s.host,
        s.schedule,
        s.port,
      ],
    }),
  );

  AUTO.forEach((group) =>
    group.tasks.forEach((task) =>
      push({
        id: `${group.group}-${task.name}`,
        kind: "automation",
        page: "auto",
        title: task.name,
        subtitle: [group.group, task.prj, task.freq]
          .filter(Boolean)
          .join(" · "),
        action: () => {
          go("auto");
          const id = `auto-${encodeURIComponent(group.group + "-" + task.name).replace(/%/g, "")}`;
          setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
              el.scrollIntoView({ block: "center", behavior: "smooth" });
              el.classList.add("auto-task-focus");
              setTimeout(() => el.classList.remove("auto-task-focus"), 1800);
            }
          }, 120);
        },
        tokens: [
          group.group,
          task.name,
          task.what,
          task.prj,
          task.path,
          task.kind,
          task.freq,
          task.on,
        ],
      }),
    ),
  );

  BOT.forEach((b) =>
    push({
      id: b.id,
      kind: "bot",
      page: "bots",
      title: b.ar || b.name,
      subtitle: [_botKindLabel(b.kind), b.host].filter(Boolean).join(" · "),
      action: () => {
        go("bots");
        setTimeout(() => openBotDetail(b.name), 120);
      },
      tokens: [
        b.name,
        b.ar,
        b.summary,
        b.desc,
        b.tags,
        b.kind,
        b.host,
        b.runtime,
        b.channel,
        b.related_entities,
      ],
    }),
  );

  TL.forEach((t) =>
    push({
      id: t.id,
      kind: "tool",
      page: "tools",
      title: t.ar || t.name,
      subtitle: [t.category, ...(t.used_in || [])].filter(Boolean).join(" · "),
      action: () => {
        go("tools");
        setTimeout(() => openToolDetail(t.name), 120);
      },
      tokens: [
        t.name,
        t.ar,
        t.summary,
        t.desc,
        t.tags,
        t.category,
        t.type,
        t.used_in,
        t.path,
      ],
    }),
  );

  CLD.forEach((c) =>
    push({
      id: c.id,
      kind: "cloud",
      page: "cloud",
      title: c.nm,
      subtitle: [_cloudCategoryLabel(c.category), c.prj]
        .filter(Boolean)
        .join(" · "),
      action: () => {
        go("cloud");
        setTimeout(() => openCloudDetail(c.nm), 120);
      },
      tokens: [
        c.nm,
        c.dt,
        c.category,
        c.prj,
        c.used_in,
        c.related_entities,
        c.lk,
      ],
    }),
  );

  ARC.forEach((a) =>
    push({
      id: a.id,
      kind: a.kind,
      page: "archive",
      title: a.ar || a.name,
      subtitle: [_archiveKindLabel(a), ...(a.related_projects || [])]
        .filter(Boolean)
        .join(" · "),
      action: () => {
        go("archive");
        setTimeout(() => openArchiveDetail(a.name), 120);
      },
      tokens: [
        a.name,
        a.ar,
        a.summary,
        a.desc,
        a.kind,
        a.related_projects,
        a.next_step,
        a.tags,
        a.path,
      ],
    }),
  );

  IDEAS.forEach((i) =>
    push({
      id: i.id,
      kind: "idea",
      page: "ideas",
      title: i.name,
      subtitle: [i.horizon, i.owner_scope].filter(Boolean).join(" · "),
      action: () => {
        go("ideas");
        setTimeout(() => openIdeaDetail(i.name), 120);
      },
      tokens: [
        i.name,
        i.summary,
        i.desc,
        i.horizon,
        i.owner_scope,
        i.related_projects,
        i.next_step,
      ],
    }),
  );

  return rows;
}

let SEARCH_INDEX = [];
const _validPages = new Set(PG.map((p) => p.id));
function _hashParts() {
  const raw = location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  return parts;
}

function _readHash() {
  const h = _hashParts()[0];
  return _validPages.has(h) ? h : "home";
}
let cur = _readHash();
const MOBILE_ITEMS = ["home", "umbrellas", "projects", "server", "tools"];
let _countdownTimer = null;

function _setHashSilently(nextHash) {
  const normalized = nextHash.startsWith("#") ? nextHash : `#${nextHash}`;
  if (location.hash === normalized) {
    _suppressHash = false;
    return;
  }
  // Use replaceState so we don't pollute browser history with duplicate
  // entries (was causing back-button to need 2 presses to leave a drawer).
  // history.replaceState doesn't fire hashchange, so no need for _suppressHash
  // flag — but keep it set for the legacy fallback below.
  _suppressHash = true;
  if (history.replaceState) {
    try {
      history.replaceState(history.state, "", normalized);
      _suppressHash = false; // no hashchange will fire, clear immediately
      return;
    } catch (e) { /* fall through to legacy path */ }
  }
  location.hash = normalized;
}

/* ─────────────── 2. NAVIGATION ─────────────── */

/* الوضع الداكن مُلغى — ثيم موحّد فقط (نظيف من تفضيلات قديمة) */
(function clearOldTheme() {
  document.documentElement.removeAttribute("data-theme");
  try { localStorage.removeItem("cc_theme"); } catch (e) {}
})();

function init() {
  const sidebar = document.getElementById("sidebar");
  const bottomBar = document.getElementById("bottom-bar");
  const app = document.getElementById("app");
  SEARCH_INDEX = _buildSearchIndex();

  if (sidebar) {
    sidebar.innerHTML =
      '<div class="sidebar-brand"><span class="brand-icon"><img src="cc-favicon.svg" alt="" width="24" height="24" style="display:block"/></span><span class="brand-text">مركز التحكم</span></div>' +
      '<button class="search-trigger" data-action="openSearch" aria-label="بحث">' +
      _ic("🔍", 16) +
      "<span>بحث</span></button>" +
      `<div id="cc-health-slot">${_healthClusterHTML()}</div>` +
      '<nav class="sidebar-nav">' +
      PG.map(
        (p) =>
          `<a class="nav-item${cur === p.id ? " active" : ""}" data-page="${p.id}" data-action="goPage" data-arg="${E(p.id)}">` +
          `<span class="nav-icon">${p.ic}</span><span class="nav-label">${E(p.n)}</span></a>`,
      ).join("") +
      "</nav>";
  }

  if (bottomBar) {
    const mobilePages = PG.filter((p) => MOBILE_ITEMS.includes(p.id));
    const morePage = PG.filter((p) => !MOBILE_ITEMS.includes(p.id));
    bottomBar.innerHTML =
      mobilePages
        .map(
          (p) =>
            `<a class="bar-item${cur === p.id ? " active" : ""}" data-page="${p.id}" data-action="goPage" data-arg="${E(p.id)}">` +
            `<span class="bar-icon">${p.ic}</span><span class="bar-label">${E(p.n)}</span></a>`,
        )
        .join("") +
      `<a class="bar-item" data-action="openSearch"><span class="bar-icon">⌕</span><span class="bar-label">بحث</span></a>` +
      `<a class="bar-item" data-action="openMore"><span class="bar-icon">⋯</span><span class="bar-label">المزيد</span></a>`;

    if (!document.getElementById("more-sheet")) {
      const sheet = document.createElement("div");
      sheet.id = "more-sheet";
      sheet.className = "more-sheet";
      sheet.innerHTML =
        '<div class="more-sheet-overlay" onclick="closeMore()"></div>' +
        '<div class="more-sheet-content">' +
        '<div class="more-sheet-handle"></div>' +
        morePage
          .map(
            (p) =>
              `<a class="more-item" data-page="${p.id}" onclick="go('${p.id}');closeMore()">` +
              `<span class="more-icon">${p.ic}</span><span class="more-label">${E(p.n)}</span></a>`,
          )
          .join("") +
        "</div>";
      document.body.appendChild(sheet);
    }
  }

  if (!document.getElementById("global-search")) {
    const search = document.createElement("div");
    search.id = "global-search";
    search.className = "global-search";
    search.innerHTML =
      '<div class="search-overlay" data-action="closeSearch"></div>' +
      '<div class="search-panel">' +
      '<div class="search-head">' +
      `<span class="search-icon">${_ic("🔍", 18)}</span>` +
      '<input id="search-input" class="search-input" type="search" dir="rtl" aria-label="بحث شامل في كل الكيانات" placeholder="ابحث في المشاريع، الخدمات، الأتمتة، البوتات، الأدوات، السحابة، الأرشيف..." autocomplete="off" />' +
      '<button class="search-close" data-action="closeSearch" aria-label="إغلاق">&times;</button>' +
      "</div>" +
      '<div class="search-helper">يشمل كل البيانات المنظمة في اللوحة. جرّب اسم مشروع، مسار، خدمة، أداة، أو كلمة من الوصف.</div>' +
      '<div id="search-results" class="search-results"></div>' +
      "</div>";
    document.body.appendChild(search);
  }

  if (app) {
    app.innerHTML = PG.map(
      (p) =>
        `<section id="page-${p.id}" class="page${cur === p.id ? " active" : ""}">${(R[p.id] || (() => ""))()}</section>`,
    ).join("");
  }

  _updateCountdown();
  if (_countdownTimer) clearInterval(_countdownTimer);
  _countdownTimer = setInterval(_updateCountdown, 60000);
  requestAnimationFrame(_processIcons);
  _renderSearchResults("");

  const hashParts = _hashParts();
  if (hashParts[1]) {
    const itemName = decodeURIComponent(hashParts[1]);
    if (_entityLookup(itemName)) {
      // PHASE-5B: was setTimeout(300) — caused visible page-then-drawer
      // flash on shared links. requestAnimationFrame waits exactly one
      // paint frame, so the page lays out once and the drawer opens
      // immediately on top, no visible flicker.
      requestAnimationFrame(() => openDetailSmart(itemName, hashParts[0]));
    }
  }

  const input = document.getElementById("search-input");
  if (input && !input.dataset.bound) {
    input.dataset.bound = "1";
    input.addEventListener("input", (e) =>
      _renderSearchResults(e.target.value || ""),
    );
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = document.querySelector(".search-result");
        if (first) first.click();
      }
    });
  }
}

/* Pages whose rendered content depends on async-loaded runtime state.
 * Initial init() render happens before data.runtime.json arrives, so
 * these must be re-rendered on navigation once runtime is available. */
const _RUNTIME_BOUND_PAGES = new Set(["home", "tools", "cloud"]);

function _activatePage(id, syncHash) {
  if (!_validPages.has(id)) return;
  cur = id;
  if (syncHash) _setHashSilently(id);
  document
    .querySelectorAll(".page")
    .forEach((el) => el.classList.remove("active"));
  const target = document.getElementById("page-" + id);
  if (target) {
    // Re-render runtime-bound pages so health filters / widgets reflect
    // the latest runtime state (loaded async after the first paint).
    if (_RUNTIME_BOUND_PAGES.has(id) && RUNTIME_STATE.generated_at && R[id]) {
      target.innerHTML = R[id]();
    }
    target.classList.add("active");
    target.scrollTop = 0;
  }
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.toggle("active", el.dataset.page === id));
  document
    .querySelectorAll(".bar-item")
    .forEach((el) => el.classList.toggle("active", el.dataset.page === id));
  window.scrollTo(0, 0);
  requestAnimationFrame(_processIcons);
  // ✨ تطبيق إضاءة Bridge بعد render الصفحة
  setTimeout(_applyBridgeHighlight, 100);
}

function go(id) {
  if (!_validPages.has(id)) return;
  closeDetail(true);
  _activatePage(id, true);
}

function openMore() {
  const s = document.getElementById("more-sheet");
  if (s) s.classList.add("open");
}

function closeMore() {
  const s = document.getElementById("more-sheet");
  if (s) s.classList.remove("open");
}

/* popstate removed — hashchange handles all navigation */

/* ─────────────── 3. RENDER FUNCTIONS ─────────────── */

const R = {};

function _sectionHero({
  tone = "violet",
  kicker = "",
  title = "",
  desc = "",
  stats = [],
}) {
  return (
    `<div class="sec-hero sec-hero--${tone}">` +
    `<div class="sec-hero-copy">` +
    (kicker ? `<span class="sec-hero-kicker">${E(kicker)}</span>` : "") +
    `<h1 class="sec-hero-title">${E(title)}</h1>` +
    (desc ? `<p class="sec-hero-desc">${E(desc)}</p>` : "") +
    `</div>` +
    (stats.length
      ? `<div class="sec-hero-stats">` +
        stats
          .map(
            (s) =>
              `<div class="sec-hero-stat"><strong>${E(String(s.v))}</strong><span>${E(s.l)}</span></div>`,
          )
          .join("") +
        `</div>`
      : "") +
    `</div>`
  );
}

/* ── HOME — Executive Briefing Board ── */
R.home = function () {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const activeP = PRJ.filter((p) => p.st === "a");
  const pausedP = PRJ.filter((p) => p.st === "p");
  const activeSvc = SVC.filter((s) => s.st).length;
  const activeBots = BOT.filter((b) => b.st === "a").length;
  const allTasks = AUTO.flatMap((g) => g.tasks || []);
  const activeTasks = allTasks.filter((t) => t.on).length;
  const runningContainers = SVC.filter(
    (s) => s.service_type === "container" && s.st,
  ).length;
  const runningCron = SVC.filter(
    (s) => s.service_type === "cron" && s.st,
  ).length;
  const runningUserServices = SVC.filter(
    (s) => s.service_type === "user-service" && s.st,
  ).length;
  const focusNames = [
    "BRIX Travel System",
    "EasyBooking",
    "Wapy.dev",
    "WhatsApp CRM",
    "Command Center",
  ];
  const focus = focusNames
    .map((n) => PRJ.find((p) => p.name === n))
    .filter(Boolean);
  const urgentIdeas = IDEAS.filter((i) => i.pr === 1 || i.pr === 2);
  const activeRefs = ARC.filter((a) => a.st === "a");
  const runtimeGenerated = RUNTIME_STATE.generated_at;
  const runtimeCoverage = RUNTIME_STATE.coverage || {};
  const coverageEntries = [
    { key: "project", label: "المشاريع", color: "#6C3AED", page: "projects" },
    { key: "service", label: "الخدمات", color: "#0284C7", page: "server" },
    { key: "tool", label: "الأدوات", color: "#7C3AED", page: "tools" },
    { key: "cloud", label: "السحابة", color: "#059669", page: "cloud" },
    { key: "bot", label: "البوتات", color: "#9333EA", page: "bots" },
    { key: "archive", label: "الأرشيف", color: "#EA580C", page: "archive" },
  ].map((entry) => {
    const cov = runtimeCoverage[entry.key] || {};
    const ok = cov.ok ?? 0;
    const warn = cov.warn ?? 0;
    const fail = cov.fail ?? 0;
    const manual = cov.manual ?? 0;
    const total = ok + warn + fail + manual;
    const state = fail ? "fail" : warn ? "warn" : manual ? "manual" : "ok";
    const rate = total ? Math.round((ok / total) * 100) : 0;
    return { ...entry, ok, warn, fail, manual, total, state, rate };
  });
  const runtimeTotals = coverageEntries.reduce(
    (acc, entry) => ({
      ok: acc.ok + entry.ok,
      warn: acc.warn + entry.warn,
      fail: acc.fail + entry.fail,
      manual: acc.manual + entry.manual,
      total: acc.total + entry.total,
    }),
    { ok: 0, warn: 0, fail: 0, manual: 0, total: 0 },
  );
  const trustScore = runtimeTotals.total
    ? Math.round((runtimeTotals.ok / runtimeTotals.total) * 100)
    : 0;
  const prioritySignals = coverageEntries
    .filter((entry) => entry.total)
    .sort(
      (a, b) =>
        b.fail - a.fail ||
        b.warn - a.warn ||
        b.manual - a.manual ||
        a.ok - b.ok,
    )
    .slice(0, 4)
    .map((entry) => ({
      ...entry,
      action: `go('${entry.page}')`,
      note: entry.fail
        ? `يوجد ${entry.fail} فشل يحتاج إغلاقه`
        : entry.warn
          ? `يوجد ${entry.warn} تحذير يحتاج مراجعة`
          : entry.manual
            ? `${entry.manual} عنصر ما زال يدويًا`
            : "التحقق الحالي مطمئن",
    }));
  const trustSummary = [
    {
      t: "فحص حي/تشغيلي",
      n:
        PRJ.filter(
          (p) => _entityMeta(p, "project").refresh_mode === "runtime-audit",
        ).length +
        SVC.filter(
          (s) => _entityMeta(s, "service").refresh_mode === "runtime-audit",
        ).length +
        CLD.filter(
          (c) => _entityMeta(c, "cloud").refresh_mode === "runtime-audit",
        ).length +
        BOT.filter(
          (b) => _entityMeta(b, "bot").refresh_mode === "runtime-audit",
        ).length,
      d: "عناصر يجري لها تحقق دوري من runtime أو من السيرفر أو من أسطح النشر المعروفة.",
      c: "#0EA5E9",
    },
    {
      t: "فحص ملفات/مسارات",
      n:
        TL.filter((t) => _entityMeta(t, "tool").refresh_mode === "file-audit")
          .length +
        ARC.filter(
          (a) => _entityMeta(a, "archive").refresh_mode === "file-audit",
        ).length,
      d: "عناصر تعتمد على ملفات إعداد أو مسارات معروفة، لذلك يتحقق منها النظام بوجودها لا بمعنى محتواها بالكامل.",
      c: "#6C3AED",
    },
    {
      t: "مراجعة يدوية",
      n: IDEAS.filter(
        (i) => _entityMeta(i, "idea").refresh_mode === "manual-curation",
      ).length,
      d: "الأفكار ومنطقة التخطيط لا يوجد لها checker دوري موثوق، لذلك تبقى مرتبطة بالمراجعة البشرية.",
      c: "#D97706",
    },
    {
      t: "مراجع حساسة",
      n: activeRefs.length,
      d: "مراجع الوصول والأمن يجب التعامل معها كطبقة تشغيلية حساسة لا كأرشيف بصري فقط.",
      c: "#E11D48",
    },
  ];
  const aiCliTools = TL.filter((t) => t.category === "developer-env").map(
    (t) => ({
      t: t.ar || t.name,
      d: t.summary || "",
      f: (t.facts || []).slice(0, 2).join(" · "),
      a: `openToolDetail('${EJ(t.name)}')`,
    }),
  );
  const layerCards = [
    {
      t: "أنظمة ومنتجات",
      n: PRJ.filter((p) =>
        [
          "product",
          "service-app",
          "website",
          "content-product",
          "financial-app",
          "dashboard",
        ].includes(p.kind),
      ).length,
      d: "مشاريع وتشغيل فعلي يملك كودًا أو نشرًا أو خدمة حية.",
      c: "#6C3AED",
    },
    {
      t: "تسويق وأتمتة",
      n: ["EasyBooking", "WhatsApp CRM", "Meta MCP"].length,
      d: "منظومات الإعلانات والتحويل والـ MCP الداخلي.",
      c: "#2563EB",
    },
    {
      t: "بوتات وأمن",
      n: BOT.length + activeRefs.length,
      d: "Telegram bots والمراجع الأمنية الحساسة.",
      c: "#E11D48",
    },
    {
      t: "تشغيل ومعرفة",
      n: TL.length + CLD.length,
      d: "أدوات التطوير، السحابة، الوصول، والبنية التشغيلية.",
      c: "#0EA5E9",
    },
  ];
  const attention = [
    ...pausedP.map((p) => ({
      t: "مشروع متوقف",
      n: p.ar,
      d: p.summary || "",
      c: p.cl,
      a: `openProjectDetail('${EJ(p.name)}')`,
    })),
    ...BOT.filter((b) => b.st !== "a").map((b) => ({
      t: "بوت غير نشط",
      n: b.ar,
      d: b.summary || "",
      c: b.cl,
      a: `openBotDetail('${EJ(b.name)}')`,
    })),
    ...urgentIdeas.map((i) => ({
      t: `فكرة ${i.horizon}`,
      n: i.name,
      d: i.next_step || i.summary || "",
      c: i.cl,
      a: `openIdeaDetail('${EJ(i.name)}')`,
    })),
  ].slice(0, 6);
  const quickLinks = [
    { n: "GitHub", h: "https://github.com/aneerabee", e: "🐙" },
    { n: "Meta Business", h: "https://business.facebook.com", e: "📢" },
    { n: "Supabase", h: "https://supabase.com/dashboard", e: "⚡" },
    { n: "Railway", h: "https://railway.app", e: "🚂" },
    { n: "Vercel", h: "https://vercel.com", e: "▲" },
    { n: "Airtable", h: "https://airtable.com", e: "📊" },
  ];
  const overviewCards = [
    {
      l: "محفظة حية",
      v: activeP.length,
      note: `من أصل ${PRJ.length} مشروع`,
      c: "#6C3AED",
    },
    {
      l: "تشغيل موثق",
      v: activeSvc,
      note: `${runningContainers} حاوية · ${runningUserServices} خدمة user`,
      c: "#0284C7",
    },
    {
      l: "أتمتة نشطة",
      v: activeTasks,
      note: `من أصل ${allTasks.length} مهمة`,
      c: "#D97706",
    },
    {
      l: "بوتات نشطة",
      v: activeBots,
      note: `من أصل ${BOT.length} بوت`,
      c: "#9333EA",
    },
  ];

  // ──── SMART HOME v2 — منطق ذكي يستنبط من البيانات ────
  const greet = smartGreeting();
  const hourNow = new Date().getHours();

  // اكتشاف العناصر التي تحتاج انتباه
  const staleProjects = PRJ.filter((p) => {
    const days = p.current_status?.updated
      ? (Date.now() - new Date(p.current_status.updated).getTime()) / 86400000
      : 999;
    return days > 14 && p.priority === "high";
  });
  const projectsWithBlockers = PRJ.filter(
    (p) =>
      p.current_status?.blockers?.some(
        (b) => b.priority === "high" || b.priority === "med",
      ),
  );
  const teamMissingData = (typeof TEAM !== "undefined" ? TEAM : []).filter(
    (t) => !t.full_name || !t.email_work,
  );
  const projectsWithNoRevenue = PRJ.filter(
    (p) =>
      p.revenue_model !== "none" &&
      (!p.monthly_revenue_usd || p.monthly_revenue_usd === 0),
  );

  // briefs ذكية
  const briefs = [];
  projectsWithBlockers.slice(0, 2).forEach((p) => {
    const b = p.current_status.blockers.find((x) => x.priority === "high") ||
      p.current_status.blockers[0];
    briefs.push({
      level: b.priority === "high" ? "critical" : "warn",
      icon: b.priority === "high" ? "🔴" : "🟡",
      title: p.ar || p.name,
      detail: b.text.slice(0, 80) + (b.text.length > 80 ? "…" : ""),
      action: `openProjectDetail('${EJ(p.name)}')`,
      actionLabel: "افتح المشروع",
      tone: b.priority === "high" ? "#ef4444" : "#f59e0b",
    });
  });
  if (teamMissingData.length > 2) {
    briefs.push({
      level: "info",
      icon: "📋",
      title: `${teamMissingData.length} موظفون ببيانات ناقصة`,
      detail: "أرسل لهم رابط الاستبيان لاستكمال الملفات",
      action: `window.open('survey.html','_blank')`,
      actionLabel: "افتح الاستبيان",
      tone: "#6366f1",
    });
  }
  if (staleProjects.length) {
    const names = staleProjects.map((p) => p.name);
    briefs.push({
      level: "warn",
      icon: "⏰",
      title: `${staleProjects.length} مشاريع ذات أولوية عالية لم تُحدّث`,
      detail: staleProjects.map((p) => p.ar || p.name).join(" · "),
      action: `ccGoWithContext('projects',{highlight:${E(JSON.stringify(names))},reason:'مشاريع متأخرة في التحديث'})`,
      actionLabel: "راجع",
      tone: "#f59e0b",
    });
  }

  // P0 UX: surface DOWN services and FAILED automations above the fold —
  // previously only counts of "active" appeared, hiding real failures.
  const downServices = SVC.filter((s) => !s.st);
  if (downServices.length) {
    briefs.unshift({
      level: "critical",
      icon: "🔴",
      title: `${downServices.length} خدمة متوقّفة`,
      detail: downServices.slice(0, 3).map((s) => s.name).join(" · ") +
        (downServices.length > 3 ? ` · +${downServices.length - 3}` : ""),
      action: `go('server')`,
      actionLabel: "افتح الخدمات",
      tone: "#ef4444",
    });
  }
  const failedAutos = (typeof AUTO !== "undefined" ? AUTO : [])
    .flatMap((g) => g.tasks || [])
    .filter((t) => t.on === false);
  if (failedAutos.length) {
    briefs.unshift({
      level: "warn",
      icon: "🟡",
      title: `${failedAutos.length} أتمتة معطّلة`,
      detail: failedAutos.slice(0, 3).map((t) => t.name).join(" · ") +
        (failedAutos.length > 3 ? ` · +${failedAutos.length - 3}` : ""),
      action: `go('automations')`,
      actionLabel: "افتح الأتمتة",
      tone: "#f59e0b",
    });
  }
  if (projectsWithNoRevenue.length > 0 && hourNow >= 10 && hourNow < 19) {
    const names = projectsWithNoRevenue.map((p) => p.name);
    briefs.push({
      level: "info",
      icon: "💰",
      title: `${projectsWithNoRevenue.length} مشاريع بدون تتبّع إيراد`,
      detail: projectsWithNoRevenue.map((p) => p.ar || p.name).slice(0,3).join(" · "),
      action: `ccGoWithContext('projects',{highlight:${E(JSON.stringify(names))},reason:'مشاريع تحتاج تسجيل إيراد شهري'})`,
      actionLabel: "افتح",
      tone: "#10b981",
    });
  }

  // PHASE-5B: rank briefs by SEVERITY (critical > warn > info), not insertion
  // order — previously a 'survey reminder' could float above a 'high blocker'.
  const _briefRank = { critical: 0, warn: 1, info: 2 };
  briefs.sort((a, b) => (_briefRank[a.level] ?? 9) - (_briefRank[b.level] ?? 9));

  // pulse: الإيرادات الحية لكل مظلة
  const umbPulse = UMBRELLAS.map((u) => {
    const projs = PRJ.filter((p) => p.parent === u.id);
    const rev = projs.reduce(
      (s, p) => s + (Number(p.monthly_revenue_usd) || 0),
      0,
    );
    const active = projs.filter((p) => p.st === "a").length;
    const teamCount = (typeof TEAM !== "undefined" ? TEAM : []).filter(
      (t) => t.parent === u.id,
    ).length;
    // mock trend data for sparkline (في الحقيقة من تاريخ التحديثات)
    const trend = projs.map((p) => p.pct || 0).slice(0, 7);
    return { ...u, rev, active, teamCount, prjCount: projs.length, trend };
  });

  // activity feed: آخر التحديثات
  const activityFeed = PRJ.filter((p) => p.current_status?.updated)
    .sort(
      (a, b) =>
        new Date(b.current_status.updated) - new Date(a.current_status.updated),
    )
    .slice(0, 6);

  // smart suggestions
  const suggestions = [];
  const incompleteTeam = teamMissingData.length;
  if (incompleteTeam > 0)
    suggestions.push({
      em: "👤",
      text: `بيانات ${incompleteTeam} موظفين غير مكتملة`,
      cta: "أرسل الاستبيان",
      action: `window.open('survey.html','_blank')`,
    });
  const rihlaty = PRJ.find((p) => p.id === "rihlaty-travel");
  if (rihlaty && rihlaty.pct < 50)
    suggestions.push({
      em: "✈️",
      text: "Rihlaty Travel تحت 50% — صفحات السوشيال لم تُنشأ",
      cta: "افتح المشروع",
      action: `openProjectDetail('Rihlaty Travel')`,
    });
  const mm = PRJ.find((p) => p.id === "money-manager");
  if (mm && mm.st === "p")
    suggestions.push({
      em: "💰",
      text: "Money Manager متوقف رغم أنه قاعدة مالية للكل",
      cta: "إنعاش",
      action: `openProjectDetail('Money Manager')`,
    });

  return (
    `<div class="hqx cc-aurora">` +
    // ──── SMART HEADER v2 — الترحيب + التاريخ + الحالة العامة ────
    `<section class="cc-greet" data-tone="${greet.tone}">` +
    `<div class="cc-greet-main">` +
    `<div class="cc-greet-row">` +
    `<span class="cc-greet-em">${greet.em}</span>` +
    `<h1 class="cc-greet-title">${E(greet.text)}، ربيع</h1>` +
    `<span class="cc-pulse-dot" title="النظام متصل"></span>` +
    `</div>` +
    `<p class="cc-greet-sub">${E(todayLong())} · ${arPluralProj(PRJ.length)} · ${arPluralEmp(TEAM ? TEAM.length : 0)} · ${arPluralDept(DEPARTMENTS ? DEPARTMENTS.length : 0)}</p>` +
    `</div>` +
    `<div class="cc-greet-actions">` +
    `<button class="cc-greet-action cc-clickable" data-action="openSearch" title="بحث (Cmd+K)">🔍 بحث</button>` +
    `<a class="cc-greet-action cc-clickable" href="graph.html" title="Knowledge Graph">🧠 العلاقات</a>` +
    `<a class="cc-greet-action cc-clickable" href="survey.html" target="_blank" title="استبيان موظف">📋 استبيان</a>` +
    `</div>` +
    `</section>` +
    // ──── TODAY'S BRIEF — ما يحتاج انتباهك الآن ────
    (briefs.length
      ? `<section class="cc-brief">` +
        `<h2 class="cc-section-title">` +
        `<span class="cc-section-em">🔥</span>` +
        `يحتاج انتباهك الآن` +
        `<span class="cc-section-badge">${briefs.length}</span>` +
        `</h2>` +
        `<div class="cc-brief-list">` +
        briefs
          .map(
            (b) =>
              `<div class="cc-brief-item cc-clickable" onclick="${b.action}" style="--bt:${b.tone}">` +
              `<span class="cc-brief-icon">${b.icon}</span>` +
              `<div class="cc-brief-body">` +
              `<div class="cc-brief-title">${E(b.title)}</div>` +
              `<div class="cc-brief-detail">${E(b.detail)}</div>` +
              `</div>` +
              `<button class="cc-brief-cta" onclick="event.stopPropagation();${b.action}">${E(b.actionLabel)} ←</button>` +
              `</div>`,
          )
          .join("") +
        `</div>` +
        `</section>`
      : `<section class="cc-brief cc-brief-empty">` +
        `<span class="cc-pulse-dot"></span>` +
        `لا شيء حرج الآن — كل شيء يعمل بسلاسة ✓` +
        `</section>`) +
    // ──── LIVE PULSE — نبض الشركات الحي ────
    `<section class="cc-pulse">` +
    `<h2 class="cc-section-title">` +
    `<span class="cc-section-em">⚡</span>` +
    `نبض الشركات الحي` +
    `</h2>` +
    `<div class="cc-pulse-grid">` +
    umbPulse
      .map(
        (u) =>
          `<div class="cc-pulse-card cc-clickable" onclick="ccGoWithContext('umbrellas',{highlight:[${E(JSON.stringify(u.name))}],reason:${E(JSON.stringify(u.name))}})" style="--umb:${u.cl}">` +
          `<div class="cc-pulse-head">` +
          `<span class="cc-pulse-em">${_ic(u.em, 18)}</span>` +
          `<span class="cc-pulse-name">${E(u.name)}</span>` +
          `</div>` +
          `<div class="cc-pulse-stats">` +
          `<div class="cc-pulse-stat"><strong>${u.prjCount}</strong><span>مشاريع</span></div>` +
          `<div class="cc-pulse-stat"><strong>${u.teamCount}</strong><span>فريق</span></div>` +
          `<div class="cc-pulse-stat"><strong>${u.rev ? fmtCurrency(u.rev) : "—"}</strong><span>شهري</span></div>` +
          `</div>` +
          `<div class="cc-pulse-spark">${_miniSpark(u.trend.length ? u.trend : [1], u.cl, 100, 24)}</div>` +
          `</div>`,
      )
      .join("") +
    `</div>` +
    `</section>` +
    // ──── STALENESS — كيانات تحتاج إعادة تحقّق ────
    _stalenessWidget() +
    // ──── ACTIVITY FEED — آخر التحديثات بوقت حي ────
    `<section class="cc-feed">` +
    `<h2 class="cc-section-title">` +
    `<span class="cc-section-em">🕐</span>` +
    `آخر التحديثات` +
    `</h2>` +
    `<div class="cc-feed-list">` +
    activityFeed
      .map((p) => {
        const u = UMBRELLAS.find((x) => x.id === p.parent);
        const updatedISO = p.current_status?.updated;
        const whereStr = p.current_status?.where || "";
        return (
          `<div class="cc-feed-item cc-clickable" data-action="openProject" data-arg="${E(p.name)}">` +
          `<div class="cc-feed-dot" style="background:${p.cl}"></div>` +
          `<div class="cc-feed-body">` +
          `<div class="cc-feed-top">` +
          `<span class="cc-feed-name">${_ic(p.em, 14)} ${E(p.ar || p.name)}</span>` +
          (u
            ? `<span class="cc-feed-umb" style="background:${u.cl}18;color:${u.cl}">${E(u.name)}</span>`
            : "") +
          `</div>` +
          `<div class="cc-feed-text">${E(whereStr.slice(0, 100))}${whereStr.length > 100 ? "…" : ""}</div>` +
          `</div>` +
          `<div class="cc-feed-time" data-live-time="${E(updatedISO)}">${E(relTime(updatedISO))}</div>` +
          `</div>`
        );
      })
      .join("") +
    `</div>` +
    `</section>` +
    // ──── SMART SUGGESTIONS ────
    (suggestions.length
      ? `<section class="cc-sug">` +
        `<h2 class="cc-section-title">` +
        `<span class="cc-section-em">💡</span>` +
        `اقتراحات ذكية` +
        `</h2>` +
        `<div class="cc-sug-list">` +
        suggestions
          .map(
            (s) =>
              `<div class="cc-sug-item">` +
              `<span class="cc-sug-em">${s.em}</span>` +
              `<span class="cc-sug-text">${E(s.text)}</span>` +
              `<button class="cc-sug-cta cc-clickable" onclick="${s.action}">${E(s.cta)} →</button>` +
              `</div>`,
          )
          .join("") +
        `</div>` +
        `</section>`
      : "") +
    // ──── شريط Runtime نشط — معلومة دقيقة بدون كذب ────
    `<div class="cc-runtime-bar">` +
    `<span class="cc-runtime-badge"><span class="cc-pulse-dot"></span>Runtime نشط</span>` +
    `<span class="cc-runtime-info">يفحص ويُحدّث ${arPluralProj(PRJ.length).replace(/^لا /, "0 ")} تلقائياً كل 6 ساعات عبر launchd</span>` +
    (RUNTIME_STATE && RUNTIME_STATE.generated_at
      ? `<span class="cc-runtime-time" data-live-time="${E(RUNTIME_STATE.generated_at)}">${E(relTime(RUNTIME_STATE.generated_at))}</span>`
      : "") +
    `</div>` +
    // ──── 🩺 Health Monitor — حالة السيرفر الحية ────
    (typeof HEALTH_STATE !== "undefined" && HEALTH_STATE
      ? (() => {
          const h = HEALTH_STATE;
          const okClass = h.ok ? "ok" : (h.alerts || []).some((a) => a.level === "critical") ? "critical" : "warn";
          const m = h.metrics || {};
          return (
            `<div class="cc-health-bar cc-health-${okClass}">` +
            `<div class="cc-health-head">` +
            `<span class="cc-health-pulse"><span class="cc-pulse-dot"></span></span>` +
            `<span class="cc-health-title">صحة السيرفر</span>` +
            `<span class="cc-health-state">${h.ok ? "✓ كل شيء ممتاز" : (h.alerts || []).some((a) => a.level === "critical") ? "✗ تحذيرات حرجة" : "⚠ تحذيرات"}</span>` +
            (h.checked_at
              ? `<span class="cc-health-time" data-live-time="${E(h.checked_at)}">${E(relTime(h.checked_at))}</span>`
              : "") +
            `</div>` +
            `<div class="cc-health-metrics">` +
            `<div class="cc-health-metric"><strong>${m.disk_pct || 0}%</strong><span>القرص</span></div>` +
            `<div class="cc-health-metric"><strong>${m.disk_free || "?"}</strong><span>متاح</span></div>` +
            `<div class="cc-health-metric"><strong>${m.docker_running || 0}/3</strong><span>Wapy</span></div>` +
            `<div class="cc-health-metric"><strong>${m.wapy_backup_age_h >= 0 ? m.wapy_backup_age_h + "h" : "?"}</strong><span>backup</span></div>` +
            `<div class="cc-health-metric"><strong>${m.svc_failed || 0}</strong><span>فاشل</span></div>` +
            `<div class="cc-health-metric"><strong>${m.load_1m || 0}</strong><span>load</span></div>` +
            `</div>` +
            ((h.alerts || []).length
              ? `<div class="cc-health-alerts">` +
                h.alerts
                  .map(
                    (a) =>
                      `<div class="cc-health-alert cc-alert-${E(a.level)}">${a.level === "critical" ? "🔴" : "🟡"} ${E(a.msg)}</div>`,
                  )
                  .join("") +
                `</div>`
              : "") +
            `</div>`
          );
        })()
      : `<div class="cc-health-bar cc-health-loading"><span class="cc-pulse-dot"></span><span>جارٍ تحميل صحة السيرفر...</span></div>`) +
    // ════════════════════════════════════════════════════════════
    // EXECUTIVE BRIEFING v3 — لوحة قيادة عملية مدمجة
    // ════════════════════════════════════════════════════════════
    `<details class="exec-collapsible" open>` +
    `<summary class="exec-summary">` +
    `<span class="exec-summary-icon">📊</span>` +
    `<span class="exec-summary-text">لوحة القيادة التنفيذية</span>` +
    `<span class="exec-summary-score">${trustScore}%</span>` +
    `<span class="exec-summary-arrow">⌄</span>` +
    `</summary>` +
    `<div class="exec-body">` +
    // ─── Panel 1: HEALTH SCORE — مؤشر الصحة الكبير ───
    `<div class="exec-health" data-state="${trustScore >= 80 ? "healthy" : trustScore >= 60 ? "warn" : "critical"}">` +
    `<div class="exec-health-ring" style="--score:${trustScore}">` +
    `<svg viewBox="0 0 100 100" class="exec-health-svg">` +
    `<circle cx="50" cy="50" r="42" fill="none" stroke="var(--brd)" stroke-width="8"/>` +
    `<circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(trustScore / 100) * 264} 264" transform="rotate(-90 50 50)"/>` +
    `</svg>` +
    `<div class="exec-health-num"><strong>${trustScore}</strong><span>%</span></div>` +
    `</div>` +
    `<div class="exec-health-info">` +
    `<div class="exec-health-label">صحة المنظومة</div>` +
    `<div class="exec-health-state">${trustScore >= 80 ? "✓ ممتاز" : trustScore >= 60 ? "⚠ يحتاج مراجعة" : "✗ حرج"}</div>` +
    `<div class="exec-health-meta">` +
    `<span class="exec-mini ok">✓ ${runtimeTotals.ok}</span>` +
    `<span class="exec-mini warn">⚠ ${runtimeTotals.warn + runtimeTotals.fail}</span>` +
    `<span class="exec-mini man">✋ ${runtimeTotals.manual}</span>` +
    `</div>` +
    (runtimeGenerated
      ? `<div class="exec-health-time" data-live-time="${E(runtimeGenerated)}">${E(relTime(runtimeGenerated))}</div>`
      : "") +
    `</div>` +
    `</div>` +
    // ─── Panel 2: COVERAGE METER — تغطية بصرية ───
    `<div class="exec-coverage">` +
    coverageEntries
      .map((e) => {
        const pct = e.total ? Math.round((e.ok / e.total) * 100) : 0;
        return (
          `<button class="exec-cov" onclick="ccGoWithContext('${E(e.page)}',{reason:${E(JSON.stringify(e.label + ' · ' + (e.fail ? e.fail+' فشل' : e.warn ? e.warn+' تحذير' : e.manual ? e.manual+' يدوي' : 'مغطى')))}})" style="--c:${e.color}">` +
          `<div class="exec-cov-top">` +
          `<span class="exec-cov-label">${E(e.label)}</span>` +
          `<span class="exec-cov-num"><strong>${e.ok}</strong>/${e.total}</span>` +
          `</div>` +
          `<div class="exec-cov-bar"><i style="width:${pct}%;background:${e.color}"></i></div>` +
          `<div class="exec-cov-state exec-state-${e.state}">${e.fail ? `${e.fail} فشل` : e.warn ? `${e.warn} تحذير` : e.manual ? `${e.manual} يدوي` : `${pct}% مغطى`}</div>` +
          `</button>`
        );
      })
      .join("") +
    `</div>` +
    // ─── Panel 3: TOP PROJECTS PROGRESS — تقدم المشاريع المحورية ───
    `<div class="exec-progress">` +
    `<div class="exec-section-head">` +
    `<span class="exec-section-title">المحاور النشطة</span>` +
    `<button class="exec-section-link" data-action="goPage" data-arg="projects">كل المشاريع ←</button>` +
    `</div>` +
    `<div class="exec-progress-list">` +
    focus
      .map((p) => {
        const days = p.current_status?.updated
          ? Math.floor((Date.now() - new Date(p.current_status.updated).getTime()) / 86400000)
          : null;
        return (
          `<button class="exec-prog-row" data-action="openProject" data-arg="${E(p.name)}" style="--c:${p.cl}">` +
          `<span class="exec-prog-icon">${_ic(p.em, 16)}</span>` +
          `<span class="exec-prog-name">${E(p.ar || p.name)}</span>` +
          `<span class="exec-prog-bar"><i style="width:${p.pct}%"></i></span>` +
          `<span class="exec-prog-pct">${p.pct}%</span>` +
          (days !== null
            ? `<span class="exec-prog-time">${days === 0 ? "اليوم" : days === 1 ? "أمس" : `${days}د`}</span>`
            : `<span class="exec-prog-time">—</span>`) +
          `</button>`
        );
      })
      .join("") +
    `</div>` +
    `</div>` +
    // ─── Panel 4: ACCESS LAYERS — طبقات الوصول مدمجة ───
    `<div class="exec-access">` +
    `<div class="exec-section-head">` +
    `<span class="exec-section-title">طبقات الوصول</span>` +
    `<span class="exec-section-link" style="cursor:default">أين كل شيء</span>` +
    `</div>` +
    `<div class="exec-access-rows">` +
    `<div class="exec-acc-row"><span class="exec-acc-key">💻 محلي</span><code class="exec-acc-val">~/Desktop/Projects · ~/Developer</code></div>` +
    `<div class="exec-acc-row"><span class="exec-acc-key">☁️ سيرفر</span><code class="exec-acc-val">62.171.128.44 · Tailscale: 100.116.69.101</code></div>` +
    `<div class="exec-acc-row"><span class="exec-acc-key">🌐 سحابي</span><code class="exec-acc-val">GitHub · Railway · Supabase · Hostinger · Meta Business</code></div>` +
    `<div class="exec-acc-row"><span class="exec-acc-key">🔐 حساس</span><code class="exec-acc-val">Vault · Tron Bot · Tailscale (طبقات أمنية حيّة)</code></div>` +
    `</div>` +
    `</div>` +
    // ─── Panel 5: QUICK ACTIONS — اختصارات تشغيل ===
    `<div class="exec-actions">` +
    `<div class="exec-section-head">` +
    `<span class="exec-section-title">اختصارات سريعة</span>` +
    `</div>` +
    `<div class="exec-action-grid">` +
    quickLinks
      .map(
        (l) =>
          `<a class="exec-action" href="${l.h}" target="_blank" rel="noopener">` +
          `<span class="exec-action-icon">${_ic(l.e, 16)}</span>` +
          `<span class="exec-action-label">${E(l.n)}</span>` +
          `</a>`,
      )
      .join("") +
    `</div>` +
    `</div>` +
    `</div>` +
    `</details>` +
    `</div>`
  );
};

/* زر التحديث المُضلِّل تم حذفه — Runtime Sync يعمل تلقائياً عبر launchd */

/* ── PROJECTS — Hero + Grid ── */
R.projects = function () {
  if (!PRJ.length) {
    return '<section class="page-empty"><h1>لا توجد مشاريع بعد</h1><p>أضف أوّل مشروع في data.js لتظهر هنا.</p></section>';
  }
  const hero = PRJ[0];
  const rest = PRJ.slice(1);
  const heroDesc = (hero.desc || "").split("\n")[0];
  const heroTags = (hero.tags || []).slice(0, 6);
  const heroLinks = Object.entries(hero.links || {}).slice(0, 4);
  const heroStats = [
    { v: `${hero.pct || 0}%`, l: "التقدم" },
    { v: String((hero.stack || []).length), l: "تقنيات أساسية" },
    { v: String((hero.subsystems || []).length), l: "أنظمة فرعية" },
    { v: String(Object.keys(hero.links || {}).length), l: "روابط مرجعية" },
  ];
  const portfolioMix = [
    {
      label: "منتجات/منظومات",
      count: PRJ.filter((p) => ["product", "umbrella"].includes(p.kind)).length,
      tone: "#6C3AED",
    },
    {
      label: "مواقع",
      count: PRJ.filter((p) => p.kind === "website").length,
      tone: "#E8453C",
    },
    {
      label: "لوحات/أدوات",
      count: PRJ.filter((p) =>
        [
          "dashboard",
          "internal-tool",
          "financial-app",
          "service-app",
          "content-product",
        ].includes(p.kind),
      ).length,
      tone: "#0EA5E9",
    },
    {
      label: "لها نشر",
      count: PRJ.filter((p) => p.deploy_url).length,
      tone: "#10B981",
    },
  ];

  return (
    _sectionHero({
      tone: "projects",
      kicker: "Operating Portfolio",
      title: "محفظة المشاريع والأنظمة",
      desc: "هذا القسم يوضح المنتجات والأنظمة الداخلية والمواقع الحية، مع فصل أوضح بين المنتج، البنية، والأدوات التابعة له.",
      stats: [
        { v: PRJ.length, l: "إجمالي المشاريع" },
        { v: PRJ.filter((p) => p.st === "a").length, l: "نشط" },
        {
          v: PRJ.filter((p) => p.kind === "product" || p.kind === "umbrella")
            .length,
          l: "منتجات/منظومات",
        },
        { v: PRJ.filter((p) => p.deploy_url).length, l: "عناصر لها نشر" },
      ],
    }) +
    `<div class="prj-hero" data-action="openProject" data-arg="${E(hero.name)}">` +
    `<div class="prj-hero-accent" style="background:linear-gradient(135deg,${hero.cl},${hero.cl}aa)"></div>` +
    `<div class="prj-hero-content">` +
    `<div class="prj-hero-top">` +
    `<span style="font-size:52px">${_ic(hero.em, 52)}</span>` +
    `<div>` +
    `<span class="prj-hero-badge">المشروع الرئيسي</span>` +
    `<h2 class="prj-hero-title">${E(hero.ar)}</h2>` +
    `<p class="prj-hero-desc">${E(heroDesc)}</p>` +
    `</div>` +
    `</div>` +
    `<div class="prj-hero-stats">${heroStats.map((s) => `<div class="prj-hero-stat"><span class="prj-stat-val">${s.v}</span><span class="prj-stat-label">${s.l}</span></div>`).join("")}</div>` +
    `<div class="prj-hero-footer">` +
    `<div style="display:flex;flex-wrap:wrap;gap:4px">${heroTags.map((t) => `<span class="tag" style="background:rgba(0,0,0,.28);color:#fff;font-weight:700">${E(t)}</span>`).join("")}</div>` +
    `<div style="display:flex;gap:6px">${heroLinks.map(([k, v]) => `<a href="${E(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="prj-hero-link">${E(k)}</a>`).join("")}</div>` +
    `</div>` +
    `<div class="prj-hero-progress"><div class="prj-hero-progress-bar" style="width:${hero.pct || 0}%"></div></div>` +
    `<span class="prj-hero-progress-text">${hero.pct || 0}% مكتمل</span>` +
    `</div>` +
    `</div>` +
    `<div class="prj-summary-row">` +
    portfolioMix
      .map(
        (item) =>
          `<div class="prj-summary-card" style="--psc:${item.tone}"><strong>${item.count}</strong><span>${item.label}</span></div>`,
      )
      .join("") +
    `</div>` +
    UMBRELLAS.map((u) => {
      // عرض كل مشاريع المظلة (بما فيها hero لإكمال صورة الشركة)
      const items = PRJ.filter((p) => p.parent === u.id);
      if (!items.length) return "";
      return (
        `<div class="prj-umb-section" style="--umb:${u.cl}">` +
        `<div class="prj-umb-header">` +
        `<span class="prj-umb-ic" style="background:${u.cl}22;color:${u.cl}">${_ic(u.em, 22)}</span>` +
        `<span class="prj-umb-name">${E(u.name)}</span>` +
        `<span class="prj-umb-count">${items.length} مشروع</span>` +
        `<span class="prj-umb-specialty">${E(u.specialty)}</span>` +
        `</div>` +
        `<div class="prj-grid">` +
        items
          .map((p) => {
            const firstLine = (p.desc || "").split("\n")[0];
            const tags = (p.tags || []).slice(0, 3);
            const links = Object.entries(p.links || {}).slice(0, 2);
            const role = p.parent_role || "";
            const isB2B = role.includes("b2b");
            const isB2C = role.includes("b2c");
            const segLabel = isB2B ? "B2B" : isB2C ? "B2C" : "";
            const segCl = isB2B ? "#7c3aed" : isB2C ? "#0EA5E9" : null;
            const today = new Date();
            const updated = p.current_status?.updated;
            const ageDays = updated
              ? Math.floor((today - new Date(updated)) / 86400000)
              : null;
            const isFresh = ageDays !== null && ageDays <= 7;
            return (
              (() => {
                const blockers = p.current_status?.blockers || [];
                const highBlockers = blockers.filter(
                  (b) => typeof b === "object" && (b.priority === "high" || b.priority === "med"),
                );
                const isStale = ageDays !== null && ageDays > 14 && p.priority === "high";
                const badge = highBlockers.length
                  ? `<span class="prj-card-blockers-badge" title="${highBlockers.length} عوائق">⚠ ${highBlockers.length}</span>`
                  : isStale
                    ? `<span class="prj-card-stale-badge" title="لم يُحدّث منذ ${ageDays} يوم">⏰ متأخر</span>`
                    : "";
                return (
                  `<div class="prj-card" data-cc-name="${E(p.name)}" data-action="openProject" data-arg="${E(p.name)}" style="--umb:${u.cl};--prj:${p.cl}">` +
                  badge +
                  `<div class="prj-card-strip" title="${E(u.name)}"></div>` +
                  `<div class="prj-card-accent" style="background:${p.cl}"></div>` +
                  `<div class="prj-card-body">` +
                  `<div class="prj-card-head">` +
                  `<span style="font-size:30px">${_ic(p.em, 30)}</span>` +
                  (segLabel
                    ? `<span class="prj-card-seg" style="background:${segCl}18;color:${segCl}">${segLabel}</span>`
                    : "") +
                  (isFresh
                    ? `<span class="prj-card-fresh" title="مُحدّث ${ageDays === 0 ? "اليوم" : `قبل ${ageDays} يوم`}">جديد</span>`
                    : "") +
                  `<span class="prj-card-dot" style="background:${p.st === "a" ? "var(--green)" : "var(--t3)"}"></span>` +
                  `</div>`
                );
              })() +
              `<h3 class="prj-card-name">${E(p.ar || p.name)}</h3>` +
              `<p class="prj-card-desc">${E(firstLine)}</p>` +
              (p.parent_role || p.priority
                ? `<div class="prj-card-meta">` +
                  (p.parent_role
                    ? `<span class="prj-card-role">${E(p.parent_role)}</span>`
                    : "") +
                  (p.priority
                    ? `<span class="prj-card-priority prio-${E(p.priority)}">${p.priority === "high" ? "أولوية عالية" : p.priority === "med" ? "متوسطة" : "منخفضة"}</span>`
                    : "") +
                  `</div>`
                : "") +
              `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:8px">${tags.map((t) => `<span class="tag" style="background:${p.cl}12;color:${p.cl}">${E(t)}</span>`).join("")}</div>` +
              (links.length
                ? `<div class="prj-card-links">${links.map(([k, v]) => `<a href="${E(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${E(k)}</a>`).join("")}</div>`
                : "") +
              `<div class="prj-progress" style="margin-top:12px"><div class="prj-progress-bar" style="width:${p.pct || 0}%;background:${p.cl}"></div></div>` +
              `</div>` +
              `</div>`
            );
          })
          .join("") +
        `</div>` +
        `</div>`
      );
    }).join("")
  );
};

/* ── TEAM — عرض ذكي للموظفين بـ3 مجموعات + راتب حساس ── */

/* أزرار سريعة + نسخ + تبديل عرض الراتب — عبر window */
window.teamCopy = function (text, btnId) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(btnId);
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = "✓";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove("copied");
      }, 1500);
    }
  });
};

window.teamToggleSalary = function () {
  const cur = localStorage.getItem("cc_show_salary") === "1";
  localStorage.setItem("cc_show_salary", cur ? "0" : "1");
  document.querySelectorAll(".team-salary-row").forEach((el) => {
    el.classList.toggle("revealed", !cur);
  });
  const btn = document.getElementById("salary-toggle-btn");
  if (btn) btn.textContent = !cur ? "إخفاء الرواتب" : "إظهار الرواتب";
};

window.teamSwitchView = function (mode) {
  document.querySelectorAll(".team-view-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === mode),
  );
  const grid = document.getElementById("team-content");
  if (grid) grid.dataset.view = mode;
};

window.teamFilter = function (q) {
  const norm = (s) => (s || "").toLowerCase();
  const term = norm(q);
  document.querySelectorAll("[data-employee-card]").forEach((card) => {
    const hay = norm(card.dataset.search);
    card.style.display = !term || hay.includes(term) ? "" : "none";
  });
};

R.team = function () {
  const teamData = typeof TEAM !== "undefined" ? TEAM : [];
  const deptData = typeof DEPARTMENTS !== "undefined" ? DEPARTMENTS : [];
  const prjData = typeof PRJ !== "undefined" ? PRJ : [];
  const umbData = typeof UMBRELLAS !== "undefined" ? UMBRELLAS : [];

  const byDept = (deptId) => teamData.filter((t) => t.department === deptId);
  const lookupDept = (id) => deptData.find((d) => d.id === id);
  const lookupUmb = (id) => umbData.find((u) => u.id === id);
  const lookupProj = (id) => prjData.find((p) => p.id === id);

  const totalEmployees = teamData.length;
  const totalActive = teamData.filter((t) => t.status !== "terminated").length;
  const totalDepts = deptData.filter((d) => byDept(d.id).length > 0).length;
  const totalWA = teamData.filter((t) => t.whatsapp).length;

  // ── بطاقة موظف ذكية (تجمع 3 مجموعات + راتب) ──
  const renderEmployeeCard = (m) => {
    const initial = (m.name || "?").slice(0, 1);
    const dept = lookupDept(m.department);
    const umb = lookupUmb(m.parent);
    const projs = (m.assigned_projects || [])
      .map(lookupProj)
      .filter(Boolean);
    const langs = m.languages || [];
    const waUrl = m.whatsapp ? `https://wa.me/${m.whatsapp}` : null;
    const telUrl = m.phone ? `tel:${m.phone}` : null;
    const smsUrl = m.phone ? `sms:${m.phone}` : null;
    const mailUrl = m.email_work ? `mailto:${m.email_work}` : null;
    const tgUrl = m.telegram
      ? `https://t.me/${m.telegram.replace(/^@/, "")}`
      : null;

    const searchHay = [
      m.name, m.name_en, m.full_name, m.role, m.phone, m.whatsapp,
      m.email_work, m.telegram, m.location_office, m.nationality,
      dept?.name, umb?.name, ...langs,
    ]
      .filter(Boolean)
      .join(" ");

    const statusBadge = {
      active: { label: "نشط", cl: "#10b981" },
      "on-leave": { label: "إجازة", cl: "#f59e0b" },
      terminated: { label: "منتهي", cl: "#ef4444" },
    }[m.status] || { label: "—", cl: "#94a3b8" };

    const fillNote = (label, val) =>
      val
        ? `<div class="emp-field"><span class="emp-field-label">${E(label)}</span><span class="emp-field-val">${E(val)}</span></div>`
        : `<div class="emp-field empty"><span class="emp-field-label">${E(label)}</span><span class="emp-field-val">—</span></div>`;

    const copyBtn = (text, id, title) =>
      `<button class="emp-copy" id="${E(id)}" onclick="event.stopPropagation();teamCopy('${EJ(text)}','${EJ(id)}')" title="${E(title)}" aria-label="${E(title)}">📋</button>`;

    return (
      `<div class="emp-card emp-card-clickable" data-cc-name="${E(m.name)}" data-employee-card data-search="${E(searchHay)}" style="--mc:${m.cl}" role="button" tabindex="0" aria-haspopup="dialog" data-action="openTeam" data-arg="${E(m.full_name || m.name)}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openTeamDetail('${EJ(m.full_name || m.name)}')}">` +
      // ── HEADER: Identity ──
      `<div class="emp-header">` +
      `<div class="emp-avatar" style="background:linear-gradient(135deg,${m.cl},${m.cl}88)">${E(initial)}</div>` +
      `<div class="emp-header-info">` +
      `<div class="emp-name-row">` +
      `<h3 class="emp-name">${E(m.full_name || m.name)}</h3>` +
      `<span class="emp-status-badge" style="background:${statusBadge.cl}18;color:${statusBadge.cl}">${E(statusBadge.label)}</span>` +
      `</div>` +
      (m.name_en
        ? `<div class="emp-name-en" dir="ltr">${E(m.name_en)}</div>`
        : "") +
      `<div class="emp-role">${E(m.role || "")}</div>` +
      `<div class="emp-context">` +
      (dept
        ? `<span class="emp-chip" style="background:${dept.cl}18;color:${dept.cl}">${_ic(dept.em, 11)} ${E(dept.name)}</span>`
        : "") +
      (umb
        ? `<span class="emp-chip" style="background:${umb.cl}18;color:${umb.cl}">${_ic(umb.em, 11)} ${E(umb.name)}</span>`
        : "") +
      `</div>` +
      `</div>` +
      `</div>` +
      // ── ACTION BAR (سريع جداً) ──
      `<div class="emp-action-bar">` +
      (telUrl
        ? `<a class="emp-action call" href="${E(telUrl)}" title="اتصال">${_ic("📞", 16)}<span>اتصال</span></a>`
        : "") +
      (waUrl
        ? `<a class="emp-action wa" href="${E(waUrl)}" target="_blank" rel="noopener" title="فتح واتساب">${_ic("💬", 16)}<span>واتساب</span></a>`
        : "") +
      (smsUrl
        ? `<a class="emp-action sms" href="${E(smsUrl)}" title="رسالة SMS">${_ic("📱", 16)}<span>SMS</span></a>`
        : "") +
      (mailUrl
        ? `<a class="emp-action mail" href="${E(mailUrl)}" title="بريد إلكتروني">${_ic("📧", 16)}<span>بريد</span></a>`
        : "") +
      `</div>` +
      // ── GROUP 1: CONTACT (تواصل) ──
      `<div class="emp-section">` +
      `<div class="emp-section-title">📞 التواصل</div>` +
      (m.phone_local
        ? `<div class="emp-field with-copy"><span class="emp-field-label">رقم الهاتف</span><span class="emp-field-val mono" dir="ltr">${E(m.phone_local)}</span>${copyBtn(m.phone_local, "cp-phone-" + m.id, "نسخ الرقم")}</div>`
        : `<div class="emp-field empty"><span class="emp-field-label">رقم الهاتف</span><span class="emp-field-val">—</span></div>`) +
      (m.whatsapp
        ? `<div class="emp-field with-copy"><span class="emp-field-label">واتساب</span><span class="emp-field-val mono" dir="ltr">wa.me/${E(m.whatsapp)}</span>${copyBtn("wa.me/" + m.whatsapp, "cp-wa-" + m.id, "نسخ رابط واتساب")}</div>`
        : "") +
      fillNote("اسم العرض على واتساب", m.whatsapp_display_name) +
      fillNote("البريد الإلكتروني", m.email_work) +
      (m.telegram
        ? `<div class="emp-field"><span class="emp-field-label">تيليجرام</span><a class="emp-field-val mono" href="${E(tgUrl)}" target="_blank" rel="noopener" dir="ltr">${E(m.telegram)}</a></div>`
        : `<div class="emp-field empty"><span class="emp-field-label">تيليجرام</span><span class="emp-field-val">—</span></div>`) +
      fillNote("موقع المكتب", m.location_office) +
      `</div>` +
      // ── GROUP 2: IDENTITY (هوية) ──
      `<div class="emp-section">` +
      `<div class="emp-section-title">👤 الهوية</div>` +
      fillNote("الاسم بالإنجليزية", m.name_en) +
      fillNote("الاسم الكامل", m.full_name) +
      fillNote("الجنسية", m.nationality) +
      `<div class="emp-field"><span class="emp-field-label">اللغات</span>` +
      (langs.length
        ? `<span class="emp-langs">${langs.map((l) => `<span class="emp-lang-tag">${E(l)}</span>`).join("")}</span>`
        : `<span class="emp-field-val empty-val">—</span>`) +
      `</div>` +
      `</div>` +
      // ── GROUP 3: WORK (عمل) ──
      `<div class="emp-section">` +
      `<div class="emp-section-title">💼 العمل</div>` +
      (projs.length
        ? `<div class="emp-field"><span class="emp-field-label">المشاريع</span>` +
          `<span class="emp-projs">` +
          projs
            .map(
              (p) =>
                `<a class="emp-proj-tag" data-action="openProject" data-arg="${E(p.name)}" style="--pc:${p.cl}">${_ic(p.em, 11)} ${E(p.ar || p.name)}</a>`,
            )
            .join("") +
          `</span></div>`
        : `<div class="emp-field empty"><span class="emp-field-label">المشاريع</span><span class="emp-field-val">—</span></div>`) +
      fillNote("المدير المباشر", m.manager) +
      fillNote("تاريخ الانضمام", m.hire_date) +
      fillNote("نوع التعاقد", m.contract_type) +
      fillNote("ساعات العمل", m.working_hours) +
      `</div>` +
      // ── SENSITIVE: SALARY ──
      `<div class="emp-section sensitive">` +
      `<div class="emp-section-title sensitive">🔒 معلومات حساسة</div>` +
      `<div class="emp-field team-salary-row${localStorage.getItem("cc_show_salary") === "1" ? " revealed" : ""}">` +
      `<span class="emp-field-label">الراتب الشهري</span>` +
      `<span class="emp-salary-val">${m.salary_usd ? `$${m.salary_usd}` : "—"}</span>` +
      `<span class="emp-salary-mask">••••• USD</span>` +
      `</div>` +
      `</div>` +
      `</div>`
    );
  };

  // ── الواجهة الكاملة ──
  return (
    _sectionHero({
      tone: "team",
      kicker: "Team & Employees",
      title: "الفريق والموظفون",
      desc: "ملف ذكي شامل لكل موظف: تواصل + هوية + عمل. أزرار اتصال وواتساب وSMS وبريد، نسخ سريع للأرقام والروابط، وبحث فوري عبر كل الحقول.",
      stats: [
        { v: totalEmployees, l: "إجمالي" },
        { v: totalActive, l: "نشط" },
        { v: totalDepts, l: "أقسام" },
        { v: totalWA, l: "متصل بواتساب" },
      ],
    }) +
    // ── شريط التحكم ──
    `<div class="team-controls">` +
    `<input type="search" class="team-search" aria-label="بحث في الفريق" placeholder="🔍 ابحث: اسم، رقم، بريد، لغة، مشروع..." oninput="teamFilter(this.value)" />` +
    `<div class="team-view-switcher">` +
    `<button class="team-view-btn active" data-view="grouped" data-action="teamSwitchView" data-arg="grouped">📂 بالأقسام</button>` +
    `<button class="team-view-btn" data-view="all" data-action="teamSwitchView" data-arg="all">🔲 الكل</button>` +
    `</div>` +
    `<a href="survey.html" target="_blank" class="survey-link" title="رابط استبيان لملء بيانات موظف جديد">📋 استبيان موظف</a>` +
    `<button id="salary-toggle-btn" class="salary-toggle" data-action="teamToggleSalary">${localStorage.getItem("cc_show_salary") === "1" ? "إخفاء الرواتب" : "إظهار الرواتب"}</button>` +
    `</div>` +
    // ── المحتوى ──
    `<div id="team-content" class="team-content" data-view="grouped">` +
    // عرض الكل (يظهر في وضع "الكل")
    `<div class="team-all-grid">` +
    teamData.map(renderEmployeeCard).join("") +
    `</div>` +
    // عرض بالأقسام (الافتراضي)
    `<div class="team-grouped">` +
    deptData
      .map((d) => {
        const members = byDept(d.id);
        if (!members.length) return "";
        const umb = lookupUmb(d.parent);
        return (
          `<div class="team-dept" style="--dept:${d.cl}">` +
          `<div class="team-dept-header">` +
          `<span class="team-dept-ic" style="background:${d.cl}22;color:${d.cl}">${_ic(d.em, 24)}</span>` +
          `<div class="team-dept-titles">` +
          `<h3 class="team-dept-name">${E(d.name)}</h3>` +
          `<p class="team-dept-ar">${E(d.ar || "")}${umb ? ` · ${E(umb.name)}` : ""}</p>` +
          `</div>` +
          `<span class="team-dept-count">${members.length} موظف</span>` +
          `</div>` +
          `<div class="emp-cards-grid">` +
          members.map(renderEmployeeCard).join("") +
          `</div>` +
          `</div>`
        );
      })
      .join("") +
    `</div>` +
    `</div>`
  );
};

/* ── UMBRELLAS — عرض هرمي: مظلة → أقسام → مشاريع + موظفون ── */
R.umbrellas = function () {
  const projByParent = (id) => PRJ.filter((p) => p.parent === id);
  const ideasByParent = (id) =>
    typeof IDEAS !== "undefined"
      ? IDEAS.filter((i) => i.parent === id)
      : [];
  const deptsByParent = (id) =>
    typeof DEPARTMENTS !== "undefined"
      ? DEPARTMENTS.filter((d) => d.parent === id)
      : [];
  const teamByDept = (deptId) =>
    typeof TEAM !== "undefined" ? TEAM.filter((t) => t.department === deptId) : [];
  const projByDept = (deptId) => PRJ.filter((p) => p.department === deptId);
  const teamByParent = (parentId) =>
    typeof TEAM !== "undefined"
      ? TEAM.filter((t) => t.parent === parentId)
      : [];

  const totalProjects = PRJ.length;
  const totalActive = PRJ.filter((p) => p.st === "a").length;
  const totalTeam = typeof TEAM !== "undefined" ? TEAM.length : 0;
  const totalRevenue = PRJ.reduce(
    (s, p) => s + (Number(p.monthly_revenue_usd) || 0),
    0,
  );

  // مكوّن: بطاقة مشروع مصغّرة داخل قسم
  const renderProjectRow = (p) =>
    `<div class="umb-project" data-action="openProject" data-arg="${E(p.name)}" style="--pc:${p.cl}">` +
    `<span class="umb-project-ic">${_ic(p.em, 18)}</span>` +
    `<span class="umb-project-name">${E(p.ar || p.name)}</span>` +
    (p.parent_role
      ? `<span class="umb-project-role">${E(p.parent_role)}</span>`
      : "") +
    `<span class="umb-project-pct">${p.pct || 0}%</span>` +
    `</div>`;

  // مكوّن: بطاقة موظف مصغّرة داخل قسم
  const renderMemberRow = (m) => {
    const initial = (m.name || "?").slice(0, 1);
    const waUrl = m.whatsapp ? `https://wa.me/${m.whatsapp}` : null;
    const telUrl = m.phone ? `tel:${m.phone}` : null;
    return (
      `<div class="umb-member" style="--mc:${m.cl}">` +
      `<div class="umb-member-avatar" style="background:linear-gradient(135deg,${m.cl},${m.cl}88)">${E(initial)}</div>` +
      `<div class="umb-member-info">` +
      `<div class="umb-member-name">${E(m.full_name || m.name)}</div>` +
      `<div class="umb-member-role">${E(m.role || "")}</div>` +
      `</div>` +
      `<div class="umb-member-actions">` +
      (telUrl
        ? `<a class="umb-member-btn tel" href="${E(telUrl)}" onclick="event.stopPropagation()" title="${E(m.phone_local || m.phone)}">${_ic("📞", 14)}</a>`
        : "") +
      (waUrl
        ? `<a class="umb-member-btn wa" href="${E(waUrl)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="wa.me/${E(m.whatsapp)}">${_ic("💬", 14)}</a>`
        : "") +
      `</div>` +
      `</div>`
    );
  };

  // مكوّن: قسم داخل مظلة (BRIX-B2B, EasyBooking, Rihlaty…)
  const renderDepartment = (d) => {
    const dProjects = projByDept(d.id);
    const dTeam = teamByDept(d.id);
    return (
      `<div class="umb-dept" style="--dept:${d.cl}">` +
      `<div class="umb-dept-header">` +
      `<span class="umb-dept-ic" style="background:${d.cl}22;color:${d.cl}">${_ic(d.em, 18)}</span>` +
      `<div class="umb-dept-titles">` +
      `<div class="umb-dept-name">${E(d.name)}</div>` +
      `<div class="umb-dept-ar">${E(d.ar || "")}</div>` +
      `</div>` +
      `<div class="umb-dept-counts">` +
      `<span class="umb-dept-count">📦 ${dProjects.length}</span>` +
      `<span class="umb-dept-count">👥 ${dTeam.length}</span>` +
      `</div>` +
      `</div>` +
      (dProjects.length
        ? `<div class="umb-dept-block"><div class="umb-dept-block-label">المشاريع</div>` +
          `<div class="umb-projects-list">${dProjects.map(renderProjectRow).join("")}</div></div>`
        : "") +
      (dTeam.length
        ? `<div class="umb-dept-block"><div class="umb-dept-block-label">الموظفون</div>` +
          `<div class="umb-members-list">${dTeam.map(renderMemberRow).join("")}</div></div>`
        : "") +
      (!dProjects.length && !dTeam.length
        ? `<div class="umb-dept-empty">— لا يوجد مشاريع أو موظفون بعد —</div>`
        : "") +
      `</div>`
    );
  };

  return (
    _sectionHero({
      tone: "umbrellas",
      kicker: "Companies & Umbrellas",
      title: "الشركات والمظلات",
      desc: "عرض هرمي كامل: كل مظلة تكشف أقسامها، وكل قسم يعرض مشاريعه وموظفيه في مكان واحد. اضغط أي مشروع لفتح تفاصيله، أو رقم/واتساب للاتصال مباشرة.",
      stats: [
        { v: UMBRELLAS.length, l: "مظلات" },
        { v: totalProjects, l: "مشاريع" },
        { v: totalActive, l: "نشط" },
        { v: totalTeam, l: "موظفين" },
      ],
    }) +
    `<div class="umb-grid">` +
    UMBRELLAS.map((u) => {
      const projects = projByParent(u.id);
      const ideas = ideasByParent(u.id);
      const depts = deptsByParent(u.id);
      const activeCount = projects.filter((p) => p.st === "a").length;
      const revenue = projects.reduce(
        (s, p) => s + (Number(p.monthly_revenue_usd) || 0),
        0,
      );
      const umbTeamCount = teamByParent(u.id).length;

      // مشاريع لا تنتمي لأي قسم محدد (مظلات بلا أقسام)
      const unassignedProjects = projects.filter(
        (p) => !depts.find((d) => d.id === p.department),
      );

      return (
        `<div class="umb-card" data-cc-name="${E(u.name)}" style="--umb:${u.cl}">` +
        // ── HEADER ──
        `<div class="umb-card-header">` +
        `<div class="umb-card-icon" style="background:${u.cl}22;color:${u.cl}">${_ic(u.em, 32)}</div>` +
        `<div class="umb-card-titles">` +
        `<h3 class="umb-card-name">${E(u.name)}</h3>` +
        `<p class="umb-card-specialty">${E(u.specialty)}</p>` +
        (u.location
          ? `<span class="umb-card-loc">📍 ${E(u.location)}</span>`
          : "") +
        `</div>` +
        `</div>` +
        `<p class="umb-card-summary">${E(u.summary)}</p>` +
        // ── STATS ──
        `<div class="umb-card-stats">` +
        `<div class="umb-stat"><strong>${projects.length}</strong><span>مشاريع</span></div>` +
        `<div class="umb-stat"><strong>${activeCount}</strong><span>نشط</span></div>` +
        `<div class="umb-stat"><strong>${umbTeamCount}</strong><span>موظفين</span></div>` +
        `<div class="umb-stat"><strong>${ideas.length}</strong><span>أفكار</span></div>` +
        `<div class="umb-stat"><strong>$${revenue}</strong><span>شهري</span></div>` +
        `</div>` +
        // ── DEPARTMENTS (هرمي للمظلات التي لها أقسام) ──
        (depts.length
          ? `<div class="umb-depts-wrapper">` +
            depts.map(renderDepartment).join("") +
            `</div>`
          : "") +
        // ── مشاريع غير مصنّفة لقسم (مظلات بلا أقسام) ──
        (unassignedProjects.length
          ? `<div class="umb-projects-title">${depts.length ? "مشاريع أخرى" : "المشاريع"}</div>` +
            `<div class="umb-projects-list">${unassignedProjects.map(renderProjectRow).join("")}</div>`
          : "") +
        // ── الأفكار ──
        (ideas.length
          ? `<div class="umb-projects-title">الأفكار</div>` +
            `<div class="umb-ideas-list">` +
            ideas
              .map(
                (i) =>
                  `<div class="umb-idea" style="--pc:${i.cl}">` +
                  `<span class="umb-project-ic">${_ic(i.em, 16)}</span>` +
                  `<span class="umb-project-name">${E(i.name)}</span>` +
                  `<span class="umb-idea-stage">${E(i.stage || i.horizon || "")}</span>` +
                  `</div>`,
              )
              .join("") +
            `</div>`
          : "") +
        `</div>`
      );
    }).join("") +
    `</div>`
  );
};

/* ── MAP ── */
R.map = function () {
  const mapData = [
    ...PRJ.map((p) => {
      const loc = p.server_path
        ? "server"
        : p.local_path
          ? "local"
          : p.repo_url
            ? "github"
            : "local";
      const path = p.server_path
        ? `server:${p.server_path}`
        : p.local_path || p.path || "—";
      const repoName = p.repo_url ? p.repo_url.split("/").slice(-1)[0] : "";
      const status = p.st === "a" ? "نشط" : p.st === "p" ? "متوقف" : "أرشيف";
      const hint = p.deploy_url
        ? `نشر: ${p.deploy_url}`
        : p.summary || _projectKindLabel(p.kind);
      return {
        name: p.name,
        n: p.ar || p.name,
        e: p.em,
        l: loc,
        p: path,
        g: repoName,
        gp: !!p.deploy_url,
        s: status,
        c: p.cl,
        t: hint,
        kind: _projectKindLabel(p.kind),
        action: `openProjectDetail('${EJ(p.name)}')`,
      };
    }),
    ...TL.filter((t) => t.category === "developer-env").map((t) => ({
      name: t.name,
      n: t.ar || t.name,
      e: t.name === "Codex CLI" ? "🧭" : "⚡",
      l: "local",
      p: t.path || "—",
      g: "",
      gp: 0,
      s: t.st === "a" ? "نشط" : "متوقف",
      c: t.cl || "#0EA5E9",
      t: (t.config_paths || []).slice(0, 2).join(" · ") || t.summary || "",
      kind: "AI CLI",
      action: `openToolDetail('${EJ(t.name)}')`,
    })),
    {
      name: "Tron Address Bot",
      n: "بوت عناوين ترون",
      e: "🕵️",
      l: "local",
      p: "/Users/rabeeshaban/Desktop/Projects/🤖 Bots/🕵️ tron-address-bot",
      g: "",
      gp: 0,
      s: "عند الطلب",
      c: "#EF4444",
      t: "نظام حساس أمنيًا يعمل محليًا فقط",
      kind: "بوت Telegram",
      action: `openBotDetail('Tron Address Bot')`,
    },
  ];

  const counts = { github: 0, local: 0, server: 0 };
  mapData.forEach((d) => counts[d.l]++);
  const locLabel = {
    github: "مرتبط بـ GitHub",
    local: "محلي",
    server: "على السيرفر",
  };

  return (
    _sectionHero({
      tone: "map",
      kicker: "Paths + surfaces",
      title: "خريطة الوصول والمسارات",
      desc: "خريطة تشغيلية توضح أين يعيش كل شيء: محليًا، على السيرفر، أو عبر GitHub، مع المسار المرجعي لكل عنصر.",
      stats: [
        { v: counts.local, l: "محلي" },
        { v: counts.server, l: "سيرفر" },
        { v: counts.github, l: "GitHub" },
        { v: mapData.length, l: "عناصر معروضة" },
      ],
    }) +
    '<div class="map-stats">' +
    `<div class="map-stat"><span class="map-stat-val">${counts.github}</span><span class="map-stat-label">GitHub</span></div>` +
    `<div class="map-stat"><span class="map-stat-val">${counts.local}</span><span class="map-stat-label">محلي</span></div>` +
    `<div class="map-stat"><span class="map-stat-val">${counts.server}</span><span class="map-stat-label">سيرفر</span></div>` +
    `<div class="map-stat"><span class="map-stat-val">${mapData.length}</span><span class="map-stat-label">المجموع</span></div>` +
    "</div>" +
    '<div class="map-note">هذه الصفحة تجيب على سؤال واحد: أين يوجد كل عنصر فعليًا، وما هو نوع وجوده: محلي، GitHub، أو سيرفر.</div>' +
    '<div class="map-filters">' +
    `<button class="filter-btn active" data-filter="all" data-action="mapFilter" data-arg="all">الكل</button>` +
    `<button class="filter-btn" data-filter="github" data-action="mapFilter" data-arg="github">GitHub</button>` +
    `<button class="filter-btn" data-filter="local" data-action="mapFilter" data-arg="local">محلي</button>` +
    `<button class="filter-btn" data-filter="server" data-action="mapFilter" data-arg="server">سيرفر</button>` +
    "</div>" +
    '<div class="map-list" id="map-list">' +
    mapData
      .map((d) => {
        const ghLink = d.g
          ? `<a href="https://github.com/aneerabee/${E(d.g)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="map-item-link">${_ic(d.gp ? "🌐" : "🔒", 12)} GitHub</a>`
          : "";
        return (
          `<button class="map-item" data-loc="${d.l}" style="border-right:4px solid ${d.c}" onclick="${d.action}">` +
          `<span class="map-item-icon">${_ic(d.e, 18)}</span>` +
          `<div class="map-item-main"><span class="map-item-name">${E(d.n)}</span>` +
          `<div class="map-item-meta"><span class="map-item-chip" style="background:${d.c}12;color:${d.c}">${E(d.kind)}</span><span class="map-item-chip">${E(locLabel[d.l] || d.l)}</span><span class="map-item-chip">${E(d.s)}</span></div>` +
          `<span class="map-item-path">${E(d.p)}</span>` +
          `<span class="map-item-text">${E(d.t)}</span></div>` +
          `<div class="map-item-side">${ghLink}</div></button>`
        );
      })
      .join("") +
    "</div>"
  );
};

/* ── AUTO ── */
R.auto = function () {
  const allGroups = AUTO || [];
  const allTasks = allGroups.flatMap((g) => g.tasks || []);
  const totalTasks = allTasks.length;
  const onTasks = allTasks.filter((t) => t.on).length;

  const renderGroup = (g) =>
    '<div class="auto-group">' +
    `<div class="auto-group-header"><span class="auto-group-title">${E(g.group)}</span><span class="auto-group-loc">${E(g.loc)}</span></div>` +
    g.tasks
      .map(
        (t) => {
          const taskKey = g.host + "::" + t.name;
          return (
            `<button type="button" class="auto-task auto-task-clickable" data-cc-name="${E(t.id || taskKey)}" data-auto-key="${E(taskKey)}" id="auto-${encodeURIComponent(g.group + "-" + t.name).replace(/%/g, "")}" aria-haspopup="dialog" data-action="openAuto" data-arg="${E(taskKey)}">` +
            `<span class="led ${t.on ? "led-on" : "led-off"}"></span>` +
            `<span class="auto-task-name">${E(t.name)}</span>` +
            `<span class="auto-task-dt">${E(t.freq)}</span>` +
            (t.prj || [])
              .map((p) => {
                const pc = _prjColor(p) || "#888";
                return `<span class="auto-prj-tag" style="background:${pc}15;color:${pc};border:1px solid ${pc}25">${E(p)}</span>`;
              })
              .join("") +
            `<span class="auto-task-desc">${E(t.what)}</span>` +
            (t.path
              ? `<span class="auto-task-desc" style="font-family:var(--mono);font-size:10px;color:var(--t3)">${E(t.path)}</span>`
              : "") +
            `</button>`
          );
        },
      )
      .join("") +
    "</div>";

  return (
    _sectionHero({
      tone: "auto",
      kicker: "Schedulers + hooks + runtime tasks",
      title: "طبقة الأتمتة والتشغيل الدوري",
      desc: "كل مهمة هنا توضح المصدر، التكرار، والكيان الذي تتبعه، حتى لا تبقى الأتمتة مجرد أسماء مبهمة أو hooks غير مفهومة.",
      stats: [
        { v: totalTasks, l: "مهمة معروفة" },
        { v: onTasks, l: "مفعلة" },
        { v: allGroups.length, l: "طبقات تشغيل" },
        {
          v: allTasks.filter(
            (t) => t.kind === "automation" || t.kind === "cron",
          ).length,
          l: "مهام دورية",
        },
      ],
    }) +
    '<div class="auto-header">' +
    '<div class="terminal-line"><span class="terminal-prompt">$</span> <span class="terminal-text">حالة الأتمتة — جميع الأنظمة</span></div>' +
    "</div>" +
    '<div class="auto-stats">' +
    `<div class="auto-stat-box"><span class="auto-stat-val">${totalTasks}</span><span class="auto-stat-label">مهمة</span></div>` +
    `<div class="auto-stat-box"><span class="auto-stat-val">${onTasks}</span><span class="auto-stat-label">نشط</span></div>` +
    `<div class="auto-stat-box"><span class="auto-stat-val">${allGroups.length}</span><span class="auto-stat-label">أنظمة</span></div>` +
    '<div class="auto-stat-box"><span class="auto-stat-val">24/7</span><span class="auto-stat-label">متاح</span></div>' +
    "</div>" +
    allGroups.map((g) => renderGroup(g)).join("") +
    `<div style="margin-top:1.5rem;padding:.75rem 1rem;border-radius:8px;background:var(--elevated);font-size:.75rem;color:var(--t3)">${_ic("💡", 12)} المصدر الآن من data.js: محلي + cron + systemd + hooks</div>`
  );
};

/* ── PROJECT COLOR HELPER ── */
function _prjColor(name) {
  if (!name) return "#888";
  const p = PRJ.find((x) => x.name === name || x.ar === name);
  if (p) return p.cl;
  const colors = {
    system: "#8B5CF6",
    Contabo: "#0EA5E9",
    "BRIX Travel": "#6C3AED",
    "Wapy.dev": "#10B981",
    EasyBooking: "#2563EB",
    "Meta MCP": "#2563EB",
    "WhatsApp CRM": "#25D366",
    "Chess Academy": "#d4a843",
    "Command Center": "#F59E0B",
  };
  return colors[name] || "#888";
}

/* ── SERVER ── */
function _sparkline(data, color) {
  if (!Array.isArray(data) || data.length === 0) return "";
  const w = 80,
    h = 20,
    max = Math.max(...data),
    min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map(
    (v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`,
  );
  return `<svg viewBox="0 0 ${w} ${h}" class="sparkline" style="width:80px;height:20px;display:block;margin:6px auto 0"><polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

R.server = function () {
  const _ringSvg = (pct, color, valHTML) => {
    const safePct = Math.max(0, Math.min(100, Number(pct) || 0));
    const offset = 251.327 - (251.327 * safePct) / 100;
    return (
      `<div class="cc-ring-gauge">` +
      `<svg viewBox="0 0 88 88">` +
      `<circle class="cc-rg-bg" cx="44" cy="44" r="40"/>` +
      `<circle class="cc-rg-fg" cx="44" cy="44" r="40" stroke="${color}" style="stroke-dashoffset:${offset.toFixed(2)}"/>` +
      `</svg>` +
      `<div class="cc-rg-val">${valHTML || ""}</div>` +
      `</div>`
    );
  };

  const totalSvc = SVC.length;
  const onSvc = SVC.filter((s) => s.st).length;
  const dockerSvc = SVC.filter((s) => s.service_type === "container").length;
  const cronSvc = SVC.filter((s) => s.service_type === "cron").length;
  const userSvc = SVC.filter((s) => s.service_type === "user-service").length;

  const gauges = [
    { label: "خدمات عاملة", val: String(onSvc), pct: Math.round((onSvc / totalSvc) * 100), cl: "#0EA5E9", note: "running" },
    { label: "حاويات Docker", val: String(dockerSvc), pct: Math.round((dockerSvc / totalSvc) * 100), cl: "#8B5CF6", note: "container" },
    { label: "مهام cron", val: String(cronSvc), pct: Math.round((cronSvc / totalSvc) * 100), cl: "#10B981", note: "scheduled" },
    { label: "خدمات user", val: String(userSvc), pct: Math.round((userSvc / totalSvc) * 100), cl: "#F59E0B", note: "systemd user" },
  ];
  const hostFacts = [
    { label: "المضيف", value: "Contabo VPS", note: "vmi3061403 · Ubuntu 24" },
    {
      label: "طبقات التشغيل",
      value: "Docker + cron + systemd",
      note: "جرد موثق من السيرفر",
    },
    {
      label: "البيئات المتصلة",
      value: "Wapy · BRIX · Western Office",
      note: "الخدمات والمهام الفعلية",
    },
    {
      label: "سياسة التحقق",
      value: "runtime sync",
      note: "ssh + docker + systemd + cron",
    },
  ];
  return (
    _sectionHero({
      tone: "server",
      kicker: "Infra + runtime",
      title: "طبقة السيرفر والتشغيل",
      desc: "جرد تشغيلي موثق من السيرفر يوضح الحاويات، خدمات systemd، المهام المجدولة، والطبقات التي تملك كل خدمة.",
      stats: [
        { v: SVC.length, l: "إجمالي الخدمات" },
        {
          v: SVC.filter((s) => s.service_type === "container").length,
          l: "Docker",
        },
        { v: SVC.filter((s) => s.service_type === "cron").length, l: "cron" },
        {
          v: SVC.filter((s) => s.service_type === "user-service").length,
          l: "systemd user",
        },
      ],
    }) +
    '<div class="server-header">' +
    `<h2 class="page-title server-title"><span class="page-icon">${_ic("🖥️", 20)}</span> CONTABO VPS</h2>` +
    '<span class="server-ip">62.171.128.44 · Ubuntu 24 · `vmi3061403` · جرد موثق من السيرفر</span>' +
    "</div>" +
    '<div class="server-facts">' +
    hostFacts
      .map(
        (f) =>
          `<div class="server-fact"><strong>${E(f.value)}</strong><span>${E(f.label)}</span><small>${E(f.note)}</small></div>`,
      )
      .join("") +
    "</div>" +
    '<div class="gauge-grid cc-stagger">' +
    gauges
      .map((g) => (
        `<div class="gauge-card cc-lift">` +
        _ringSvg(g.pct, g.cl,
          `<span class="cc-rg-num cc-counter" style="color:${g.cl}" data-target="${g.val}">0</span>` +
          `<span class="cc-rg-suf">${E(g.note)}</span>`
        ) +
        `<span class="gauge-label" style="margin-top:8px;font-weight:700">${E(g.label)}</span>` +
        `<span class="gauge-note"><span class="cc-live-dot cc-live-dot--green" style="margin-inline-end:6px;vertical-align:middle"></span>${E(g.pct)}% من الجرد</span>` +
        `</div>`
      ))
      .join("") +
    "</div>" +
    // ── Filter chips row ──
    `<div class="cc-filter-row" id="cc-svc-filters" data-svc-filter="all">` +
    `<button class="cc-mag-chip is-active" data-filter="all">${_ic("📊", 12)} الكل<span class="cc-filter-count">${totalSvc}</span></button>` +
    `<button class="cc-mag-chip" data-filter="container">${_ic("🐳", 12)} Docker<span class="cc-filter-count">${dockerSvc}</span></button>` +
    `<button class="cc-mag-chip" data-filter="cron">${_ic("⏰", 12)} cron<span class="cc-filter-count">${cronSvc}</span></button>` +
    `<button class="cc-mag-chip" data-filter="user-service">${_ic("⚙️", 12)} systemd<span class="cc-filter-count">${userSvc}</span></button>` +
    `<button class="cc-mag-chip" data-filter="database">${_ic("🗄️", 12)} DB<span class="cc-filter-count">${SVC.filter(s=>s.service_type==='database').length}</span></button>` +
    `<button class="cc-mag-chip" data-filter="off">${_ic("⛔", 12)} متوقفة<span class="cc-filter-count">${SVC.filter(s=>!s.st).length}</span></button>` +
    `</div>` +
    // ── Grouped service list (by host then by runtime) ──
    (() => {
      const groups = new Map();
      SVC.forEach((s) => {
        const key = s.host || "غير محدد";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(s);
      });
      return Array.from(groups.entries())
        .map(([host, list]) => (
          `<div class="cc-svc-group" data-host="${E(host)}">` +
          `<div class="cc-svc-group-head">${_ic("🖥️", 12)} ${E(host)}<span class="cc-svc-group-count">${list.length}</span></div>` +
          `<div class="svc-list cc-stagger">` +
          list.map((s) => {
            const prj = s.owner || s.prj || "";
            const info = s.info || "";
            const path = s.path || "";
            const schedule = s.schedule || "";
            const runtime = s.runtime || "";
            const type = s.service_type || "";
            const pc = prj ? _prjColor(prj) : "";
            const ownerLabel = s.owner_type === "bot" ? "runtime" : "مشروع";
            return (
              `<button class="svc-item cc-lift" ` +
              `data-cc-name="${E(s.name)}" ` +
              `data-svc-type="${E(type || 'unknown')}" ` +
              `data-svc-status="${s.st ? 'on' : 'off'}" ` +
              `aria-label="${E(s.name)} — ${s.st ? 'شغّال' : 'متوقف'}" ` +
              `data-action="openService" data-arg="${E(s.name)}">` +
              `<span class="svc-status ${s.st ? "svc-on" : "svc-off"}" aria-hidden="true"></span>` +
              `<span class="svc-em">${_ic(s.em, 18)}</span>` +
              `<div class="svc-info"><span class="svc-name">${E(s.name)}</span>` +
              (prj ? `<span class="svc-prj" style="background:${pc}15;color:${pc}">${E(ownerLabel)} · ${E(prj)}</span>` : "") +
              `<span class="svc-dt">${E(s.dt)}</span>` +
              (type ? `<span class="svc-desc">النوع: ${E(_serviceTypeLabel(type))}</span>` : "") +
              (runtime ? `<span class="svc-desc">التشغيل: ${E(runtime)}</span>` : "") +
              (schedule ? `<span class="svc-desc">الجدولة: ${E(schedule)}</span>` : "") +
              (info ? `<span class="svc-desc">${E(info)}</span>` : "") +
              (path ? `<span class="svc-path">${E(path)}</span>` : "") +
              `</div>` +
              (s.port && s.port !== "—" ? `<span class="svc-port">:${E(s.port)}</span>` : "") +
              `</button>`
            );
          }).join("") +
          `</div></div>`
        )).join("");
    })()
  );
};

/* ── Modern Section Hero — replacement for boring _sectionHero ── */
function _modernHero({ tone, color, kicker, title, desc, bigNum, bigLabel, pills }) {
  const cl = color || "#7C3AED";
  return (
    `<section class="mod-hero" style="--mh-cl:${cl}">` +
    `<div class="mod-hero-grid">` +
    (bigNum != null
      ? `<div class="mod-hero-num"><strong>${E(bigNum)}</strong><span>${E(bigLabel || "")}</span></div>`
      : "") +
    `<div class="mod-hero-body">` +
    (kicker ? `<div class="mod-hero-kicker">${E(kicker)}</div>` : "") +
    `<h1 class="mod-hero-title">${E(title)}</h1>` +
    (desc ? `<p class="mod-hero-desc">${E(desc)}</p>` : "") +
    (pills && pills.length
      ? `<div class="mod-hero-pills">` +
        pills.map((p) => (
          `<span class="mod-hero-pill">` +
          (p.dot !== false ? `<span class="dot" style="background:${p.color || cl}"></span>` : "") +
          `<strong>${E(p.v)}</strong> ${E(p.l)}` +
          `</span>`
        )).join("") +
        `</div>`
      : "") +
    `</div>` +
    `</div>` +
    `</section>`
  );
}

/* ── Modern Toolbar (filter chips + search) ── */
function _modernToolbar({ filters, searchPlaceholder, id }) {
  return (
    `<div class="mod-toolbar" id="${E(id)}">` +
    (searchPlaceholder
      ? `<div class="mod-search"><span class="mod-search-ico">🔍</span>` +
        `<input type="search" aria-label="${E(searchPlaceholder)}" placeholder="${E(searchPlaceholder)}" data-mod-search/></div>`
      : "") +
    `<div class="mod-chips">` +
    (filters || []).map((f) => (
      // Accept both {value} and {key} — historically inconsistent across pages.
      `<button class="mod-chip${f.active ? " is-active" : ""}" data-mod-filter="${E(f.value ?? f.key ?? "all")}">` +
      (f.icon ? `${_ic(f.icon, 12)} ` : "") +
      E(f.label) +
      (f.count != null ? `<span class="mod-chip-count">${E(f.count)}</span>` : "") +
      `</button>`
    )).join("") +
    `</div>` +
    `</div>`
  );
}

/* ── Wire up modern toolbar interactions for any section ── */
function _modernToolbarWire(toolbarId, cardSelector, getMatchKey) {
  setTimeout(() => {
    const tb = document.getElementById(toolbarId);
    if (!tb) return;
    const search = tb.querySelector('[data-mod-search]');
    let activeFilter = (tb.querySelector('.mod-chip.is-active') || {}).getAttribute?.('data-mod-filter') || 'all';
    let searchTerm = '';
    const apply = () => {
      const cards = document.querySelectorAll(cardSelector);
      let visibleCount = 0;
      cards.forEach((el) => {
        const matchKey = getMatchKey(el);
        const text = (el.textContent || '').toLowerCase();
        const matchesFilter = activeFilter === 'all' || matchKey.includes(activeFilter);
        const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
        const visible = matchesFilter && matchesSearch;
        el.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
      });
      // Show empty state
      const empty = document.querySelector(`[data-empty-for="${toolbarId}"]`);
      if (empty) empty.style.display = visibleCount === 0 ? '' : 'none';
    };
    tb.addEventListener('click', (e) => {
      const chip = e.target.closest('.mod-chip');
      if (!chip) return;
      tb.querySelectorAll('.mod-chip').forEach((c) => c.classList.toggle('is-active', c === chip));
      activeFilter = chip.getAttribute('data-mod-filter') || 'all';
      apply();
    });
    if (search) {
      search.addEventListener('input', (e) => { searchTerm = e.target.value; apply(); });
    }
  }, 100);
}

/* ── BOTS — full modern redesign ── */
R.bots = function () {
  const kindMap = {
    "telegram-bot": "بوت Telegram",
    "agent-runtime": "runtime",
    "assistant-channel": "قناة مساعد",
    "financial-app": "تطبيق/API",
  };
  const total = BOT.length;
  const active = BOT.filter((b) => b.st === "a" || b.st === 1).length;
  const tg = BOT.filter((b) => b.kind === "telegram-bot").length;
  const cloud = BOT.filter((b) => b.host && (b.host.includes("Contabo") || b.host.includes("Railway") || b.host.includes("Cloudflare"))).length;
  const runtimeLead = BOT.find((b) => b.kind === "agent-runtime") || BOT.find((b) => b.st === "a") || null;
  const restBots = runtimeLead ? BOT.filter((b) => b.name !== runtimeLead.name) : BOT;
  const leadStats = runtimeLead ? BSTATS[runtimeLead.name] || [] : [];

  const renderCard = (b, opts = {}) => {
    const stats = BSTATS[b.name] || [];
    const tags = (b.tags || []).slice(0, 3);
    const firstLine = b.summary || (b.desc || "").split("\n")[0] || "";
    const isActive = b.st === "a" || b.st === 1;
    const handle = b.links?.Telegram?.replace("https://t.me/", "@") || "";
    const sizeClass = opts.size || "b-3";
    const featuredClass = opts.featured ? " is-featured" : "";
    const matchAttrs = `data-bot-kind="${E(b.kind || '')}" data-bot-status="${isActive ? 'on' : 'off'}" data-bot-host="${E((b.host || '').toLowerCase())}"`;
    return (
      `<div class="mod-card mod-bot-card ${sizeClass}${featuredClass}" style="--card-cl:${b.cl || '#7C3AED'}" ${matchAttrs} data-cc-name="${E(b.name)}" data-action="openBot" data-arg="${E(b.name)}">` +
      `<div class="mod-card-head">` +
      `<div class="mod-card-icon">${_ic(b.em, opts.featured ? 28 : 22)}</div>` +
      `<span class="mod-card-status ${isActive ? 'is-on' : 'is-off'}"><span class="dot"></span>${isActive ? 'نشط' : 'متوقف'}</span>` +
      `</div>` +
      `<h3 class="mod-card-title">${E(b.ar || b.name)}</h3>` +
      (handle ? `<div class="mod-card-handle">${E(handle)}</div>` : "") +
      (firstLine ? `<p class="mod-card-desc">${E(firstLine)}</p>` : "") +
      (opts.featured && stats.length
        ? `<div class="mod-card-stats">` +
          stats.slice(0, 4).map((s) => (
            `<div class="mod-card-stat"><strong>${E(s.v)}</strong><span>${E(s.l)}</span></div>`
          )).join("") +
          `</div>`
        : "") +
      (tags.length || b.host
        ? `<div class="mod-card-meta">` +
          (b.kind ? `<span class="mod-card-tag">${E(kindMap[b.kind] || b.kind)}</span>` : "") +
          (b.host ? `<span class="mod-card-tag">📍 ${E(b.host)}</span>` : "") +
          tags.map((t) => `<span class="mod-card-tag">${E(t)}</span>`).join("") +
          `</div>`
        : "") +
      `</div>`
    );
  };

  return (
    _modernHero({
      color: "#0088CC",
      kicker: "Agents · Channels · Runtimes",
      title: "البوتات والوكلاء",
      desc: "كل بوت له هوية، حالة حيّة، نوع تشغيل، ومضيف موثّق. اضغط أي كارت للتفاصيل الكاملة.",
      bigNum: total,
      bigLabel: "بوت",
      pills: [
        { v: active, l: "نشط", color: "#22C55E" },
        { v: tg, l: "Telegram", color: "#0088CC" },
        { v: cloud, l: "سحابي", color: "#8B5CF6" },
        { v: total - active, l: "متوقف", color: "#94A3B8" },
      ],
    }) +
    _modernToolbar({
      id: "bots-toolbar",
      searchPlaceholder: "ابحث عن بوت بالاسم، النوع، أو المضيف...",
      filters: [
        { value: "all", label: "الكل", count: total, active: true },
        { value: "on", label: "نشط", count: active, icon: "⚡" },
        { value: "telegram-bot", label: "Telegram", count: tg, icon: "✈️" },
        { value: "contabo", label: "Contabo", count: BOT.filter(b => (b.host||'').includes("Contabo")).length, icon: "🖥️" },
        { value: "railway", label: "Railway", count: BOT.filter(b => (b.host||'').includes("Railway")).length, icon: "🚂" },
      ],
    }) +
    `<div class="mod-bento">` +
    (runtimeLead ? renderCard(runtimeLead, { size: "b-6", featured: true }) : "") +
    restBots.map((b) => renderCard(b, { size: "b-3" })).join("") +
    `<div class="mod-empty" data-empty-for="bots-toolbar" style="display:none">` +
    `<div class="mod-empty-icon">🔍</div>` +
    `<div>لا يوجد بوت يطابق الفلتر الحالي</div>` +
    `</div>` +
    `</div>`
  );
};

/* Wire bots toolbar after render */
const _origRBots = R.bots;
R.bots = function () {
  const html = _origRBots.apply(this, arguments);
  _modernToolbarWire("bots-toolbar", ".mod-bot-card", (el) =>
    `${el.getAttribute("data-bot-kind")} ${el.getAttribute("data-bot-status")} ${el.getAttribute("data-bot-host")}`
  );
  return html;
};


/* ── TOOLS ── */
R.tools = function () {
  const cliItems = TL.filter((t) => t.category === "developer-env");
  const byCategory = (c) => TL.filter((t) => t.category === c).length;
  const activeCount = TL.filter((t) => t.st === "a").length;
  const featured = cliItems[0] || TL[0];

  const _tlTok = (t) => _rtStatusTokens("tool", t.id);
  const staleCount = TL.filter((t) => _tlTok(t).includes("rt-stale")).length;
  const warnCount = TL.filter((t) => _tlTok(t).includes("rt-warn")).length;
  const filters = [
    { key: "all", label: "الكل", count: TL.length, active: true },
    { key: "developer-env", label: "AI CLI", count: byCategory("developer-env") },
    { key: "mcp", label: "MCP", count: byCategory("mcp") },
    { key: "platform", label: "منصات", count: byCategory("platform") },
    { key: "internal-tool", label: "داخلية", count: byCategory("internal-tool") },
    { key: "infra-access", label: "بنية", count: byCategory("infra-access") },
    { key: "rt-warn", label: "يحتاج انتباه", count: warnCount },
    { key: "rt-stale", label: "متقادم", count: staleCount },
  ].filter((f) => f.count > 0);

  const card = (t, sizeClass) => {
    const usedInArr = (t.used_in || []).slice(0, 3);
    const isLive = t.st === "a";
    const cat = `${t.category || ""} ${_tlTok(t)}`.trim();
    return (
      `<div class="mod-card ${sizeClass}" data-cc-name="${E(t.name)}" data-mod-cat="${E(cat)}" data-mod-name="${E((t.ar || t.name)).toLowerCase()}" style="--card-cl:${t.cl || '#7C3AED'}" data-action="openTool" data-arg="${E(t.name)}">` +
      `<div class="mod-card-head">` +
      `<div class="mod-card-em">${_ic(t.em || "🔧", 22)}</div>` +
      `<div class="mod-card-status${isLive ? " is-live" : ""}">${isLive ? "نشط" : "متوقف"}</div>` +
      `</div>` +
      `<div class="mod-card-title">${E(t.ar || t.name)}</div>` +
      `<div class="mod-card-desc">${E(t.summary || (t.desc || "").split("\n")[0] || "")}</div>` +
      `<div class="mod-card-meta">` +
      `<span class="mod-card-meta-pill">${E(_toolCategoryLabel(t.category))}</span>` +
      (usedInArr.length ? `<span class="mod-card-meta-pill">${usedInArr.length} مشروع</span>` : "") +
      `</div>` +
      `</div>`
    );
  };

  const featuredCard = featured
    ? `<div class="mod-card mod-card--featured b-6" data-cc-name="${E(featured.name)}" data-mod-cat="${E(`${featured.category || ""} ${_tlTok(featured)}`.trim())}" data-mod-name="${E((featured.ar || featured.name)).toLowerCase()}" style="--card-cl:${featured.cl || '#7C3AED'}" data-action="openTool" data-arg="${E(featured.name)}">` +
      `<div class="mod-card-head">` +
      `<div class="mod-card-em mod-card-em--lg">${_ic(featured.em || "🛠️", 36)}</div>` +
      `<div class="mod-card-status is-live">⭐ بيئة العمل الأساسية</div>` +
      `</div>` +
      `<div class="mod-card-title mod-card-title--lg">${E(featured.ar || featured.name)}</div>` +
      `<div class="mod-card-desc">${E(featured.summary || "")}</div>` +
      ((featured.capabilities || []).length
        ? `<div class="mod-card-bullets">${(featured.capabilities || []).slice(0, 4).map((c) => `<div class="mod-card-bullet"><span>•</span>${E(c)}</div>`).join("")}</div>`
        : "") +
      `</div>`
    : "";

  const otherTools = TL.filter((t) => t.name !== (featured && featured.name));

  return (
    _modernHero({
      color: "#0EA5E9",
      kicker: "أدوات التطوير · AI CLI · MCP · منصات",
      title: "ورشة العمل الكاملة",
      desc: "جرد كامل لأدوات العمل: البيئات، الخوادم المتصلة، المنصات السحابية، وأين يتم تعديل إعداد كل أداة.",
      bigNum: TL.length,
      bigLabel: "إجمالي الأدوات",
      pills: [
        { v: cliItems.length, l: "AI CLI" },
        { v: byCategory("mcp"), l: "MCP" },
        { v: byCategory("platform"), l: "منصات" },
        { v: activeCount, l: "نشطة" },
      ],
    }) +
    _modernToolbar({
      filters,
      searchPlaceholder: "ابحث في الأدوات...",
      id: "mod-tb-tools",
    }) +
    `<div class="mod-bento">` +
    featuredCard +
    otherTools.map((t) => card(t, "b-3")).join("") +
    `</div>`
  );
};
const _origRTools = R.tools;
R.tools = function () {
  const html = _origRTools.apply(this, arguments);
  setTimeout(() => _modernToolbarWire("mod-tb-tools", ".mod-card", (el) => el.getAttribute("data-mod-cat") || ""), 80);
  return html;
};

/* ── CLOUD ── */
R.cloud = function () {
  const categoryOrder = [
    "platform",
    "database-platform",
    "deployment",
    "marketing-platform",
    "data-platform",
    "infrastructure",
    "network",
    "storage",
    "communication",
    "mcp-linked",
    "external-api",
  ];
  const categoryLabels = {
    platform: "منصات أساسية",
    "database-platform": "منصات بيانات",
    deployment: "نشر واستضافة",
    "marketing-platform": "تسويق",
    "data-platform": "بيانات تشغيلية",
    infrastructure: "بنية تحتية",
    storage: "تخزين",
    "mcp-linked": "خدمات متصلة عبر MCP",
    network: "وصول وشبكات",
    "external-api": "واجهات خارجية",
    communication: "تواصل",
  };
  const groups = categoryOrder
    .map((cat) => ({ cat, items: CLD.filter((c) => c.category === cat) }))
    .filter((g) => g.items.length);
  const activeCount = CLD.filter((c) => c.active !== false).length;
  const deploymentCount = CLD.filter((c) => c.category === "deployment").length;
  const mcpLinkedCount = CLD.filter((c) => c.category === "mcp-linked").length;
  const surfaceCards = [
    {
      label: "منصات تشغيل",
      count: CLD.filter((c) =>
        ["deployment", "infrastructure", "network"].includes(c.category),
      ).length,
      desc: "النشر، البنية، والشبكات المرتبطة بالتشغيل الفعلي",
    },
    {
      label: "بيانات وتخزين",
      count: CLD.filter((c) =>
        ["database-platform", "data-platform", "storage"].includes(c.category),
      ).length,
      desc: "المنصات التي تحفظ البيانات أو تنقلها أو تنظمها",
    },
    {
      label: "واجهات وخدمات",
      count: CLD.filter((c) =>
        [
          "platform",
          "marketing-platform",
          "communication",
          "external-api",
          "mcp-linked",
        ].includes(c.category),
      ).length,
      desc: "واجهات خارجية، منصات ربط، وخدمات تشغيل تكمل المنظومة",
    },
  ];

  const _cldTok = (c) => _rtStatusTokens("cloud", c.id);
  const cldStale = CLD.filter((c) => _cldTok(c).includes("rt-stale")).length;
  const cldWarn = CLD.filter((c) => _cldTok(c).includes("rt-warn")).length;
  const filterGroups = [
    { key: "all", label: "الكل", count: CLD.length, active: true },
    { key: "platform-grp", label: "منصات", count: CLD.filter((c) => ["platform", "database-platform", "data-platform"].includes(c.category)).length, match: (c) => ["platform", "database-platform", "data-platform"].includes(c.category) },
    { key: "deploy-grp", label: "نشر", count: CLD.filter((c) => ["deployment", "infrastructure"].includes(c.category)).length, match: (c) => ["deployment", "infrastructure"].includes(c.category) },
    { key: "mcp-grp", label: "MCP", count: mcpLinkedCount, match: (c) => c.category === "mcp-linked" },
    { key: "net-grp", label: "شبكة", count: CLD.filter((c) => ["network", "communication", "external-api"].includes(c.category)).length, match: (c) => ["network", "communication", "external-api"].includes(c.category) },
    { key: "data-grp", label: "بيانات", count: CLD.filter((c) => ["storage", "marketing-platform"].includes(c.category)).length, match: (c) => ["storage", "marketing-platform"].includes(c.category) },
    { key: "off", label: "متوقف", count: CLD.filter((c) => c.active === false).length, match: (c) => c.active === false },
    { key: "rt-warn", label: "يحتاج انتباه", count: cldWarn, match: (c) => _cldTok(c).includes("rt-warn") },
    { key: "rt-stale", label: "متقادم", count: cldStale, match: (c) => _cldTok(c).includes("rt-stale") },
  ].filter((f) => f.count > 0);

  const card = (c) => {
    const cPrj = c.prj || "";
    const cpc = cPrj ? _entityColor(cPrj, "#0EA5E9") : "#0EA5E9";
    const isLive = c.active !== false;
    const usedArr = (c.related_entities || c.used_in || []).slice(0, 3);
    let groupKey = "";
    filterGroups.forEach((g) => { if (g.match && g.match(c)) groupKey += " " + g.key; });
    return (
      `<div class="mod-card b-3" data-cc-name="${E(c.nm)}" data-mod-cat="${E(groupKey.trim())}" data-mod-name="${E(c.nm.toLowerCase())}" style="--card-cl:${cpc}" data-action="openCloud" data-arg="${E(c.nm)}">` +
      `<div class="mod-card-head">` +
      `<div class="mod-card-em">${_ic(c.em, 22)}</div>` +
      `<div class="mod-card-status${isLive ? " is-live" : ""}">${isLive ? "نشط" : "متوقف"}</div>` +
      `</div>` +
      `<div class="mod-card-title">${E(c.nm)}</div>` +
      `<div class="mod-card-desc">${E(c.dt)}</div>` +
      `<div class="mod-card-meta">` +
      `<span class="mod-card-meta-pill">${E(categoryLabels[c.category] || c.category)}</span>` +
      (cPrj ? `<span class="mod-card-meta-pill">${E(cPrj)}</span>` : "") +
      (usedArr.length ? `<span class="mod-card-meta-pill">يخدم ${usedArr.length}</span>` : "") +
      `</div>` +
      `</div>`
    );
  };

  return (
    _modernHero({
      color: "#06B6D4",
      kicker: "السحابة · المنصات · الشبكات · MCP",
      title: "السطح السحابي الكامل",
      desc: "بدل خلط كل المنصات معًا، يعرض هذا القسم دور كل خدمة: منصة، نشر، API، شبكة، تخزين، أو طبقة متصلة عبر MCP.",
      bigNum: CLD.length,
      bigLabel: "خدمة سحابية",
      pills: [
        { v: activeCount, l: "نشط" },
        { v: deploymentCount, l: "نشر" },
        { v: mcpLinkedCount, l: "MCP" },
        { v: groups.length, l: "فئات" },
      ],
    }) +
    _modernToolbar({
      filters: filterGroups,
      searchPlaceholder: "ابحث في الخدمات السحابية...",
      id: "mod-tb-cloud",
    }) +
    `<div class="mod-bento">` +
    CLD.map(card).join("") +
    `</div>`
  );
};
const _origRCloud = R.cloud;
R.cloud = function () {
  const html = _origRCloud.apply(this, arguments);
  setTimeout(() => _modernToolbarWire("mod-tb-cloud", ".mod-card", (el) => el.getAttribute("data-mod-cat") || ""), 80);
  return html;
};

/* ── IDEAS ── */
R.ideas = function () {
  const prLabels = { 1: "عاجل", 2: "قريب", 3: "يوماً ما" };
  const prColors = { 1: "#EF4444", 2: "#F59E0B", 3: "#6366F1" };
  const c1 = IDEAS.filter((i) => i.pr === 1).length;
  const c2 = IDEAS.filter((i) => i.pr === 2).length;
  const c3 = IDEAS.filter((i) => i.pr === 3).length;
  const blueprintCount = IDEAS.filter((i) => i.blueprint).length;

  const filters = [
    { key: "all", label: "الكل", count: IDEAS.length, active: true },
    { key: "pr1", label: "عاجل", count: c1 },
    { key: "pr2", label: "قريب", count: c2 },
    { key: "pr3", label: "يوماً ما", count: c3 },
    { key: "bp", label: "Blueprint", count: blueprintCount },
  ].filter((f) => f.count > 0);

  const card = (idea, sizeClass) => {
    const cl = prColors[idea.pr] || "#6366F1";
    const rels = (idea.related_projects || []).slice(0, 3);
    const hasBp = !!idea.blueprint;
    const cats = `pr${idea.pr}${hasBp ? " bp" : ""}`;
    return (
      `<div class="mod-card ${sizeClass}${hasBp ? " mod-card--featured" : ""}" data-cc-name="${E(idea.name)}" data-mod-cat="${cats}" data-mod-name="${E(idea.name.toLowerCase())}" style="--card-cl:${cl}" data-action="openIdea" data-arg="${E(idea.name)}">` +
      `<div class="mod-card-head">` +
      `<div class="mod-card-em">${_ic(idea.em || "💡", 22)}</div>` +
      `<div class="mod-card-status${idea.pr === 1 ? " is-live" : ""}">${E(prLabels[idea.pr] || "")}</div>` +
      `</div>` +
      `<div class="mod-card-title${hasBp ? " mod-card-title--lg" : ""}">${E(idea.name)}</div>` +
      `<div class="mod-card-desc">${E(idea.summary || (idea.desc || "").split("\n")[0] || "")}</div>` +
      `<div class="mod-card-meta">` +
      (idea.owner_scope ? `<span class="mod-card-meta-pill">${E(idea.owner_scope)}</span>` : "") +
      (idea.horizon ? `<span class="mod-card-meta-pill">${E(idea.horizon)}</span>` : "") +
      (rels.length ? `<span class="mod-card-meta-pill">يربط ${rels.length}</span>` : "") +
      (hasBp ? `<span class="mod-card-meta-pill" style="background:rgba(139,92,246,.15);color:#A78BFA">📐 Blueprint</span>` : "") +
      `</div>` +
      `</div>`
    );
  };

  // Order: blueprint ideas first (featured b-6), then by priority
  const ordered = [
    ...IDEAS.filter((i) => i.blueprint),
    ...IDEAS.filter((i) => !i.blueprint).sort((a, b) => (a.pr || 9) - (b.pr || 9)),
  ];

  return (
    _modernHero({
      color: "#8B5CF6",
      kicker: "Strategy board · أفكار · Blueprints",
      title: "الأفكار وخارطة الطريق",
      desc: "الأفكار هنا ليست زينة. كل بطاقة توضّح الأولوية، النطاق، الخطوة التالية، والمشاريع المتأثرة.",
      bigNum: IDEAS.length,
      bigLabel: "فكرة قيد الدراسة",
      pills: [
        { v: c1, l: "عاجل" },
        { v: c2, l: "قريب" },
        { v: c3, l: "يوماً ما" },
        { v: blueprintCount, l: "Blueprint" },
      ],
    }) +
    _modernToolbar({
      filters,
      searchPlaceholder: "ابحث في الأفكار...",
      id: "mod-tb-ideas",
    }) +
    `<div class="mod-bento">` +
    ordered.map((i, idx) => card(i, i.blueprint ? "b-6" : "b-3")).join("") +
    // Ghost CTA card — invites capturing the next idea (data is manual in data.js)
    `<div class="mod-card mod-card-ghost b-3" role="note" aria-label="مساحة لفكرة جديدة">` +
    `<div class="mod-ghost-inner">` +
    `<div class="mod-ghost-em">${_ic("✨", 26)}</div>` +
    `<div class="mod-ghost-title">فكرتك القادمة تبدأ هنا</div>` +
    `<div class="mod-ghost-sub">سجّل الأفكار الجديدة في <code>data.js</code> ضمن مصفوفة <code>IDEAS</code> لتظهر هنا تلقائيًا</div>` +
    `</div>` +
    `</div>` +
    `</div>`
  );
};
const _origRIdeas = R.ideas;
R.ideas = function () {
  const html = _origRIdeas.apply(this, arguments);
  setTimeout(() => _modernToolbarWire("mod-tb-ideas", ".mod-card", (el) => el.getAttribute("data-mod-cat") || ""), 80);
  return html;
};

/* ── ARCHIVE ── */
R.archive = function () {
  const archived = ARC.filter((a) => (a.kind || "").startsWith("archived-"));
  const activeRefs = ARC.filter((a) =>
    ["active-security", "active-runtime"].includes(a.kind),
  );
  const overview = [
    { label: "مؤرشف فعليًا", count: archived.length },
    { label: "مراجع نشطة", count: activeRefs.length },
    {
      label: "مشاريع قديمة",
      count: ARC.filter((a) => a.kind === "archived-project").length,
    },
    {
      label: "هويات/أدوات",
      count: ARC.filter((a) =>
        ["archived-brand", "archived-tool"].includes(a.kind),
      ).length,
    },
  ];

  const renderCard = (a, activeRef) => {
    const tags = (a.tags || []).slice(0, 4);
    const descLines = (a.desc || "").split("\n").filter((l) => l.trim());
    const firstLine = a.summary || descLines[0] || "";
    const excerpt = descLines
      .slice(1, 3)
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !/^[📐🔧📊🔄🚀📱📦📸🎯💹⚙️🔐🛡️🤖👥🛠️📈🌍🔗📍⚡💾🎮💰🌐🔔📂⏰🔒🎨📌⚠️👤🐳📡💱🏢🛍️🏗️🧠♟️]/.test(
            l,
          ),
      )
      .join(" · ");
    const stLabel = _archiveKindLabel(a);
    const stColor = activeRef
      ? "var(--green)"
      : a.st === "arc"
        ? "#92400E"
        : "var(--amber)";
    const size = a.size || "";
    const count = a.count || "";
    return (
      `<div class="book-card ${activeRef ? "book-card-active-ref" : ""}" data-cc-name="${E(a.name)}" data-action="openArchive" data-arg="${E(a.name)}">` +
      `<div class="book-spine" style="background:${a.cl}"></div>` +
      `<div class="book-body">` +
      `<span class="book-emoji">${_ic(a.em, 32)}</span>` +
      `<h4 class="book-title">${E(a.ar || a.name)}</h4>` +
      `<p class="book-desc">${E(firstLine)}</p>` +
      (excerpt ? `<p class="book-excerpt">${E(excerpt)}</p>` : "") +
      `<div class="book-tags">${tags.map((t) => `<span class="tag" style="background:${a.cl}12;color:${a.cl}">${E(t)}</span>`).join("")}</div>` +
      `<div class="book-meta">` +
      `<span class="book-status" style="background:${stColor}18;color:${stColor}">${E(stLabel)}</span>` +
      (size ? `<span class="book-size">${E(size)}</span>` : "") +
      (count ? `<span class="book-size">${E(count)}</span>` : "") +
      `</div>` +
      `</div></div>`
    );
  };

  return (
    _sectionHero({
      tone: "archive",
      kicker: "Archive + active references",
      title: "الأرشيف والطبقات المرجعية",
      desc: "هذا القسم يميز بين ما أُرشف فعلًا وما بقي كمرجع أمني أو runtime نشط. الهدف هو منع خلط النشط بالمحفوظ بصريًا ومفهوميًا.",
      stats: [
        { v: archived.length, l: "مؤرشف فعليًا" },
        { v: activeRefs.length, l: "مراجع نشطة" },
        {
          v: ARC.filter((a) => a.kind === "archived-project").length,
          l: "مشاريع قديمة",
        },
        { v: ARC.length, l: "إجمالي العناصر" },
      ],
    }) +
    `<div class="archive-overview">` +
    overview
      .map(
        (item) =>
          `<div class="archive-overview-card"><strong>${item.count}</strong><span>${E(item.label)}</span></div>`,
      )
      .join("") +
    `</div>` +
    `<div class="archive-section">` +
    `<div class="archive-section-head"><h3>المؤرشف فعليًا</h3><span>${archived.length}</span></div>` +
    (archived.length
      ? `<div class="archive-shelf">` +
        archived.map((a) => renderCard(a, false)).join("") +
        `</div>`
      : `<div class="cc-page-empty">` +
        `<span class="cc-page-empty-em">${_ic("📦", 30)}</span>` +
        `<div class="cc-page-empty-title">لا عناصر مؤرشفة بعد</div>` +
        `<div class="cc-page-empty-sub">حين يُنقل مشروع أو أداة إلى الأرشيف، تظهر هنا مع سبب الأرشفة وتاريخها.</div>` +
        `</div>`) +
    `</div>` +
    (activeRefs.length
      ? `<div class="archive-section archive-active-block">` +
        `<div class="archive-section-head"><h3>طبقات نشطة محفوظة خارج الأرشيف</h3><span>${activeRefs.length}</span></div>` +
        `<p class="archive-section-note">هذه العناصر كانت مصنفة داخل الأرشيف بصريًا، لكن حقيقتها التشغيلية الحالية نشطة أو حساسة ويجب قراءتها كمرجع حي.</p>` +
        `<div class="archive-shelf archive-shelf-active">` +
        activeRefs.map((a) => renderCard(a, true)).join("") +
        `</div>` +
        `</div>`
      : "")
  );
};

/* ─────────────── 4. DETAIL VIEWS — 5 أنماط مختلفة ─────────────── */

let _suppressHash = false;

function _parseDesc(item) {
  const lines = (item.desc || "").split("\n");
  const headline = lines[0] || "";
  const sections = [];
  let sec = null;
  lines.slice(1).forEach((line) => {
    const t = line.trim();
    if (!t) return;
    if (
      /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}🔧📊📐🔄🚀📱📦📸🎯💹⚙️🔐🛡️🤖👥🛠️📈🌍🔗📍⚡💾🎮💰🌐🔔📂⏰🔒🎨📌⚠️👤🐳📡💱🏢🛍️🏗️🧠♟️]/u.test(
        t,
      )
    ) {
      sec = { title: t, rows: [] };
      sections.push(sec);
    } else if (sec) {
      sec.rows.push(t);
    } else {
      if (!sections.length) sections.push({ title: "", rows: [] });
      sections[sections.length - 1].rows.push(t);
    }
  });
  return { headline, sections };
}

function _sectionsHTML(sections) {
  return sections
    .map((s) => {
      // Replace emoji in section title with icon
      let title = s.title || "";
      if (title) {
        const firstChar = [...title][0];
        const iconName = IC[firstChar];
        if (iconName)
          title =
            _ic(firstChar, 14) +
            " " +
            title
              .substring(
                firstChar.length +
                  (title.codePointAt(0) > 0xffff
                    ? 0
                    : title[1] === "\uFE0F"
                      ? 1
                      : 0),
              )
              .trim();
      }
      return (
        `<div style="margin-top:14px">` +
        (title
          ? `<h4 style="font-size:12px;font-weight:600;color:var(--t1);margin-bottom:6px;display:flex;align-items:center;gap:4px">${title}</h4>`
          : "") +
        s.rows
          .map(
            (r) =>
              `<div style="font-size:11px;color:var(--t2);line-height:1.7;padding:4px 10px;background:var(--elevated);border-radius:5px;margin-bottom:2px">${E(r)}</div>`,
          )
          .join("") +
        `</div>`
      );
    })
    .join("");
}

function _tagsHTML(tags, cl) {
  if (!tags || !tags.length) return "";
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:14px">${tags.map((t) => `<span class="tag" style="background:${cl || "var(--purple)"}15;color:${cl || "var(--purple)"};border:1px solid ${cl || "var(--purple)"}22">${E(t)}</span>`).join("")}</div>`;
}

function _linksHTML(links, cl) {
  const entries = Object.entries(links || {});
  if (!entries.length) return "";
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:14px">${entries.map(([k, v]) => `<a href="${E(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;padding:7px 16px;border-radius:8px;background:${cl || "var(--purple)"};color:#fff;font-size:11px;font-weight:600;text-decoration:none;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">${E(k)}</a>`).join("")}</div>`;
}

function _pathHTML(path) {
  if (!path) return "";
  return `<div style="margin-top:14px;font-family:var(--mono);font-size:11px;background:var(--elevated);padding:10px 14px;border-radius:8px;color:var(--t2);direction:ltr;word-break:break-all;display:flex;align-items:center;gap:6px">${_ic("📁", 14)} ${E(path)}</div>`;
}

function _projectStructuredSections(item) {
  const sections = [];
  const summary = item.summary || "";
  const pathRows = [];
  if (item.local_path) pathRows.push(`محلي: ${item.local_path}`);
  if (item.server_path) pathRows.push(`سيرفر: ${item.server_path}`);
  if (!pathRows.length && item.path) pathRows.push(item.path);

  const releaseRows = [];
  if (item.repo_url) releaseRows.push(`GitHub: ${item.repo_url}`);
  if (item.deploy_url) releaseRows.push(`نشر: ${item.deploy_url}`);
  if (!releaseRows.length && item.links) {
    Object.entries(item.links).forEach(([k, v]) =>
      releaseRows.push(`${k}: ${v}`),
    );
  }

  const relationRows = [];
  if (item.parent_project) relationRows.push(`يتبع: ${item.parent_project}`);
  if (item.related_services?.length)
    relationRows.push(`الخدمات: ${item.related_services.join(" · ")}`);
  if (item.related_tools?.length)
    relationRows.push(`الأدوات: ${item.related_tools.join(" · ")}`);
  if (item.related_cloud?.length)
    relationRows.push(`السحابية: ${item.related_cloud.join(" · ")}`);

  if (summary || item.kind) {
    sections.push({
      title: "🧭 نظرة عامة",
      rows: [
        summary || "لا يوجد ملخص منظم بعد",
        item.kind ? `النوع: ${_projectKindLabel(item.kind)}` : "",
        item.pct != null ? `التقدم: ${item.pct}%` : "",
      ].filter(Boolean),
    });
  }
  if (item.stack?.length)
    sections.push({ title: "🔧 التقنيات", rows: item.stack });
  if (item.subsystems?.length)
    sections.push({ title: "🧩 الأنظمة الفرعية", rows: item.subsystems });
  if (pathRows.length) sections.push({ title: "📁 المسارات", rows: pathRows });
  if (releaseRows.length)
    sections.push({ title: "🚀 الريبو والنشر", rows: releaseRows });
  if (item.ops?.length) sections.push({ title: "⚙️ التشغيل", rows: item.ops });
  if (relationRows.length)
    sections.push({ title: "🔗 العلاقات", rows: relationRows });
  return sections;
}

function _normalizeSectionTitle(title) {
  return String(title || "")
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function _projectMergedSections(item, legacySections) {
  const structured = _projectStructuredSections(item);
  if (!structured.length) return legacySections;

  const blocked = [
    "نظرة عامة",
    "التقنيات",
    "الأنظمة الفرعية",
    "المسارات",
    "الريبو والنشر",
    "التشغيل",
    "العلاقات",
  ];

  const filteredLegacy = legacySections.filter((s) => {
    const normalized = _normalizeSectionTitle(s.title);
    if (!normalized) {
      const body = (s.rows || []).join(" ");
      if (item.summary && body.includes(item.summary)) return false;
      return true;
    }
    return !blocked.some((label) => normalized.includes(label));
  });

  return [...structured, ...filteredLegacy];
}

/* ── 1. PROJECT DETAIL — صفحة كاملة تحل محل المحتوى ── */
function _currentStatusCard(item) {
  const cs = item && item.current_status;
  if (!cs && !item.parent) return "";
  const safeCS = cs || {};
  const cl = item.cl || "#6C3AED";
  const where = safeCS.where || "";
  const next = safeCS.next_step || safeCS.next || "";
  const blockers = Array.isArray(safeCS.blockers) ? safeCS.blockers : [];
  const updated = safeCS.updated || "";
  const useGuide = safeCS.use_guide || safeCS.usage || "";

  // 🆕 ذكاء العلاقات: اعرف فريق المشروع + المظلة + القسم
  const team = typeof TEAM !== "undefined"
    ? TEAM.filter((t) => (t.assigned_projects || []).includes(item.id))
    : [];
  const umb = typeof UMBRELLAS !== "undefined"
    ? UMBRELLAS.find((u) => u.id === item.parent)
    : null;
  const dept = typeof DEPARTMENTS !== "undefined"
    ? DEPARTMENTS.find((d) => d.id === item.department)
    : null;

  return (
    `<div class="prj-status-card" style="--st-cl:${cl}">` +
    `<div class="prj-status-head">` +
    `<div class="prj-status-badge">${_ic("📍", 16)} أين وصلنا</div>` +
    (updated
      ? `<div class="prj-status-updated">آخر تحديث: ${E(updated)} · <span data-live-time="${E(updated)}">${E(typeof relTime === "function" ? relTime(updated) : "")}</span></div>`
      : "") +
    `</div>` +
    // 🆕 شريط السياق (المظلة + القسم) يربط المشروع بكل المنظومة
    (umb || dept
      ? `<div class="prj-status-context">` +
        (umb
          ? `<button class="prj-ctx-chip" onclick="ccGoWithContext('umbrellas',{highlight:[${E(JSON.stringify(umb.name))}],reason:'مظلة ${E(umb.name)}'})" style="--c:${umb.cl}">${_ic(umb.em, 12)} ${E(umb.name)}</button>`
          : "") +
        (dept
          ? `<button class="prj-ctx-chip" onclick="ccGoWithContext('umbrellas',{highlight:[${E(JSON.stringify(umb ? umb.name : ''))}],reason:'قسم ${E(dept.name)} داخل ${E(umb ? umb.name : '')}'})" style="--c:${dept.cl}">${_ic(dept.em, 12)} ${E(dept.name)}</button>`
          : "") +
        `</div>`
      : "") +
    (where
      ? `<div class="prj-status-block prj-status-where"><div class="prj-status-label">الموقف الحالي</div><div class="prj-status-text">${E(where)}</div></div>`
      : "") +
    (next
      ? `<div class="prj-status-block prj-status-next"><div class="prj-status-label">الخطوة التالية</div><div class="prj-status-text"><strong>${E(next)}</strong></div></div>`
      : "") +
    (blockers.length
      ? `<div class="prj-status-block prj-status-blockers">` +
        `<div class="prj-status-label">العوائق الحالية</div>` +
        `<ul class="prj-status-blockers-list">` +
        blockers
          .map((b) => {
            const text = typeof b === "string" ? b : b.text || "";
            const pri = typeof b === "object" ? b.priority || "" : "";
            const priCls = pri ? ` prj-blocker--${E(pri)}` : "";
            const priLabel =
              pri === "high"
                ? "حرج"
                : pri === "med" || pri === "medium"
                  ? "متوسط"
                  : pri === "low"
                    ? "منخفض"
                    : "";
            return (
              `<li class="prj-blocker${priCls}">` +
              (priLabel
                ? `<span class="prj-blocker-pri">${E(priLabel)}</span>`
                : "") +
              `<span class="prj-blocker-text">${E(text)}</span>` +
              `</li>`
            );
          })
          .join("") +
        `</ul></div>`
      : "") +
    (useGuide
      ? `<div class="prj-status-block prj-status-use"><div class="prj-status-label">${_ic("🎯", 13)} كيف أستخدمه</div><div class="prj-status-text">${E(useGuide)}</div></div>`
      : "") +
    // 🆕 الفريق المسؤول — يظهر تلقائياً إن وُجد موظفون مرتبطون
    (team.length
      ? `<div class="prj-status-block prj-status-team">` +
        `<div class="prj-status-label">${_ic("👥", 13)} الفريق المسؤول (${team.length})</div>` +
        `<div class="prj-status-team-list">` +
        team
          .map(
            (m) =>
              `<button class="prj-team-chip" onclick="ccGoWithContext('team',{highlight:[${E(JSON.stringify(m.name))}],reason:'موظف مسؤول عن ${E(item.ar || item.name)}'})" style="--c:${m.cl}">` +
              `<span class="prj-team-avatar" style="background:${m.cl}">${E((m.name || '?').slice(0,1))}</span>` +
              `<span class="prj-team-name">${E(m.full_name || m.name)}</span>` +
              `<span class="prj-team-role">${E(m.role || '')}</span>` +
              `</button>`,
          )
          .join("") +
        `</div></div>`
      : "") +
    `</div>`
  );
}

function _quickLinksCard(item, cl) {
  const links = item.links || {};
  const desc = item.links_desc || {};
  const entries = Object.entries(links);
  if (!entries.length) return "";
  const linkIcons = {
    GitHub: "💻",
    Railway: "🚂",
    Supabase: "🗄️",
    Vercel: "▲",
    Hostinger: "🌐",
    Telegram: "✈️",
    Notion: "📝",
    التطبيق: "🚀",
    "لوحة التحكم": "📊",
    "صفحة الربط": "🔗",
    Meta: "Ⓜ️",
    "Meta Console": "🛠️",
    "WhatsApp Manager": "💬",
    "Events Manager": "📊",
    "App Review": "✅",
    "API Setup": "📡",
  };
  return (
    `<div class="prj-info-card prj-info-card--quick-links" style="--ql-cl:${cl}">` +
    `<h3 class="prj-info-title">${_ic("🔗", 14)} روابط سريعة</h3>` +
    `<div class="prj-quick-links">` +
    entries
      .map(([k, v]) => {
        const ico = linkIcons[k] || "🔗";
        const d = desc[k] || "";
        // Detect private GitHub repo
        const isPrivateRepo =
          typeof PRIVATE_REPOS !== "undefined" &&
          typeof v === "string" &&
          PRIVATE_REPOS.some((r) => v.includes(r));
        return (
          `<a class="prj-quick-link${isPrivateRepo ? " is-private" : ""}" href="${E(v)}" target="_blank" rel="noopener" ${isPrivateRepo ? 'title="repo خاص — يحتاج تسجيل دخول"' : ""}>` +
          `<div class="pql-row">` +
          `<span class="pql-icon">${_ic(ico, 16)}</span>` +
          `<span class="pql-name">${E(k)}${isPrivateRepo ? ' <span class="pql-private">🔒</span>' : ""}</span>` +
          `<span class="pql-arrow">↗</span>` +
          `</div>` +
          (d ? `<div class="pql-desc">${E(d)}</div>` : "") +
          `</a>`
        );
      })
      .join("") +
    `</div></div>`
  );
}

/* ── Bot Features Card — sub-section for pricing bot ── */
function _botFeaturesCard(item) {
  const bf = item && item.bot_features;
  if (!bf) return "";
  const cl = item.cl || "#0088CC";

  const stepsHtml = (bf.flow_steps || [])
    .map((s, i) => (
      `<div class="bot-step">` +
      `<span class="bot-step-num" style="background:${cl}">${i + 1}</span>` +
      `<span class="bot-step-text">${E(s)}</span>` +
      `</div>`
    )).join("");

  const langPills = (bf.languages || [])
    .map((l) => `<span class="bot-lang-pill">${E(l)}</span>`).join("");

  const renderList = (arr, icon, kind) => arr.map((x) => (
    `<li class="bot-li bot-li--${kind}"><span class="bot-li-ico">${icon}</span><span>${E(x)}</span></li>`
  )).join("");

  const renderModules = (mods) => mods.map((m) => (
    `<div class="bot-mod"><code class="bot-mod-file">${E(m.f)}</code><span class="bot-mod-desc">${E(m.d)}</span></div>`
  )).join("");

  const renderMilestones = (ms) => ms.map((m) => (
    `<div class="bot-ms"><span class="bot-ms-date">${E(m.date)}</span><span class="bot-ms-text">${E(m.text)}</span></div>`
  )).join("");

  const tests = bf.tests || {};
  const stats = [
    bf.recent_commits_14d ? { v: String(bf.recent_commits_14d) + "+", l: "تحديث آخر أسبوعين" } : null,
    tests.total ? { v: String(tests.total), l: "اختبار يمر" } : null,
    bf.modules ? { v: String(bf.modules.length), l: "موديول" } : null,
    bf.flow_steps ? { v: String(bf.flow_steps.length), l: "خطوة في التدفّق" } : null,
  ].filter(Boolean);

  return (
    `<div class="bot-card" style="--bot-cl:${cl}">` +
    // HEADER
    `<div class="bot-head">` +
    `<div class="bot-head-left">` +
    `<div class="bot-icon">${_ic("🤖", 22)}</div>` +
    `<div>` +
    `<div class="bot-handle">` +
    (bf.url
      ? `<a href="${E(bf.url)}" target="_blank" rel="noopener">${E(bf.handle || "بوت تلجرام")}</a>`
      : E(bf.handle || "بوت تلجرام")) +
    `</div>` +
    (bf.tagline ? `<div class="bot-tagline">${E(bf.tagline)}</div>` : "") +
    `</div></div>` +
    (langPills ? `<div class="bot-langs">${langPills}</div>` : "") +
    `</div>` +
    // STATS
    (stats.length
      ? `<div class="bot-stats">` +
        stats.map((s) => (
          `<div class="bot-stat"><strong>${E(s.v)}</strong><span>${E(s.l)}</span></div>`
        )).join("") +
        `</div>`
      : "") +
    // FLOW STEPS
    (stepsHtml
      ? `<div class="bot-section">` +
        `<h4 class="bot-section-title">${_ic("🎯", 13)} تدفّق التسعير</h4>` +
        `<div class="bot-steps">${stepsHtml}</div>` +
        `</div>`
      : "") +
    // ACCESS
    (bf.access_model
      ? `<div class="bot-section bot-section--narrow">` +
        `<h4 class="bot-section-title">${_ic("🔒", 13)} الوصول</h4>` +
        `<p class="bot-prose">${E(bf.access_model)}</p>` +
        `</div>`
      : "") +
    // PARITY
    (bf.parity
      ? `<div class="bot-section bot-section--narrow">` +
        `<h4 class="bot-section-title">${_ic("🔗", 13)} التطابق مع الويب</h4>` +
        `<p class="bot-prose">${E(bf.parity)}</p>` +
        `</div>`
      : "") +
    // MODULES
    (bf.modules && bf.modules.length
      ? `<div class="bot-section">` +
        `<h4 class="bot-section-title">${_ic("🧩", 13)} موديولات البوت</h4>` +
        `<div class="bot-modules">${renderModules(bf.modules)}</div>` +
        `</div>`
      : "") +
    // 3 COLUMNS: SECURITY / UX / RELIABILITY
    `<div class="bot-triple">` +
    (bf.security && bf.security.length
      ? `<div class="bot-col bot-col--security">` +
        `<h4 class="bot-section-title">${_ic("🛡️", 13)} الأمان</h4>` +
        `<ul class="bot-list">${renderList(bf.security, "🛡️", "sec")}</ul>` +
        `</div>`
      : "") +
    (bf.ux_recent && bf.ux_recent.length
      ? `<div class="bot-col bot-col--ux">` +
        `<h4 class="bot-section-title">${_ic("✨", 13)} تحسينات UX حديثة</h4>` +
        `<ul class="bot-list">${renderList(bf.ux_recent, "✨", "ux")}</ul>` +
        `</div>`
      : "") +
    (bf.reliability && bf.reliability.length
      ? `<div class="bot-col bot-col--rel">` +
        `<h4 class="bot-section-title">${_ic("⚡", 13)} الموثوقية</h4>` +
        `<ul class="bot-list">${renderList(bf.reliability, "⚡", "rel")}</ul>` +
        `</div>`
      : "") +
    `</div>` +
    // MILESTONES
    (bf.milestones && bf.milestones.length
      ? `<div class="bot-section">` +
        `<h4 class="bot-section-title">${_ic("📅", 13)} آخر معالم</h4>` +
        `<div class="bot-milestones">${renderMilestones(bf.milestones)}</div>` +
        `</div>`
      : "") +
    // STACK
    (bf.stack && bf.stack.length
      ? `<div class="bot-stack">` +
        bf.stack.map((t) => `<span class="bot-stack-pill">${E(t)}</span>`).join("") +
        `</div>`
      : "") +
    `</div>`
  );
}

function _claudeSessionCard(item) {
  const cs = item && item.claude_session;
  if (!cs || !cs.command) return "";
  const cl = item.cl || "#25D366";
  const cmd = cs.command;
  const sessionName = cs.session_name || "";
  const terminal = cs.terminal || "Terminal";
  const cwd = cs.cwd || "";
  const memoryFile = cs.memory_file || "";
  const note = cs.note || "";
  return (
    `<div class="prj-claude-card" style="--cs-cl:${cl}">` +
    `<div class="prj-claude-head">` +
    `<div class="prj-claude-badge">${_ic("💬", 18)} استئناف محادثة Claude Code</div>` +
    (sessionName
      ? `<div class="prj-claude-session">${E(sessionName)}</div>`
      : "") +
    `</div>` +
    `<p class="prj-claude-intro">هذه المحادثة محفوظة محلياً في Claude Code. لمتابعة آخر نقطة وصلنا لها بدون فقدان السياق، نفّذ الأمر التالي في <strong>${E(terminal)}</strong>.</p>` +
    `<div class="prj-claude-cmd-wrap">` +
    `<code class="prj-claude-cmd" dir="ltr">${E(cmd)}</code>` +
    `<button class="prj-claude-copy" onclick="copyClaudeCmd(this, ${JSON.stringify(cmd).replace(/"/g, "&quot;")})" aria-label="نسخ الأمر">${_ic("📋", 14)} نسخ</button>` +
    `</div>` +
    `<ol class="prj-claude-steps">` +
    `<li>افتح <strong>${E(terminal)}</strong></li>` +
    `<li>الصق الأمر بـ ⌘V ثم اضغط Enter</li>` +
    `<li>داخل Claude اكتب <code>/resume</code></li>` +
    (sessionName
      ? `<li>اختر الجلسة المسماة <strong>${E(sessionName)}</strong></li>`
      : `<li>اختر الجلسة الأحدث للمشروع</li>`) +
    `</ol>` +
    (note
      ? `<div class="prj-claude-note">${_ic("📌", 13)} ${E(note)}</div>`
      : "") +
    (cwd || memoryFile
      ? `<div class="prj-claude-meta">` +
        (cwd
          ? `<div class="prj-claude-meta-row"><span>المجلد</span><code dir="ltr">${E(cwd)}</code></div>`
          : "") +
        (memoryFile
          ? `<div class="prj-claude-meta-row"><span>ملف الذاكرة</span><code dir="ltr">${E(memoryFile)}</code></div>`
          : "") +
        `</div>`
      : "") +
    `</div>`
  );
}

function copyClaudeCmd(btn, cmd) {
  if (!navigator.clipboard) {
    const ta = document.createElement("textarea");
    ta.value = cmd;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(ta);
  } else {
    navigator.clipboard.writeText(cmd).catch(() => {});
  }
  const original = btn.innerHTML;
  btn.innerHTML = "✓ نُسخ";
  btn.classList.add("copied");
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove("copied");
  }, 1600);
}

function openProjectDetail(name) {
  const item = PRJ.find((p) => p.name === name);
  if (!item) return;
  closeDetail(true);
  const { headline, sections: legacySections } = _parseDesc(item);
  const sections = _projectMergedSections(item, legacySections);
  const cl = item.cl || "#6C3AED";
  const tags = item.tags || [];
  const links = item.links || {};
  const stLabel = item.st === "a" ? "نشط" : item.st === "p" ? "متوقف" : "أرشيف";
  const isLive = item.st === "a";

  const facts = [
    { label: "النوع", value: _projectKindLabel(item.kind) || item.kind || "—" },
    { label: "التقدم", value: item.pct != null ? `${item.pct}%` : "—" },
    { label: "الأنظمة", value: String(item.subsystems?.length || 0) },
    { label: "التقنيات", value: String(item.stack?.length || tags.length || 0) },
    { label: "الخدمات", value: String(item.related_services?.length || 0) },
    { label: "الروابط", value: String(Object.keys(links).length) },
  ];

  const overview = item.custom_page
    ? `<div style="margin:0"><iframe src="${E(item.custom_page)}" loading="lazy" title="BRIX Mission Control" style="width:100%;height:86vh;border:1px solid #232a36;border-radius:16px;background:#0a0c10;display:block"></iframe><div style="text-align:center;margin-top:8px"><a href="${E(item.custom_page)}" target="_blank" rel="noopener" style="font-size:12px;color:#94a2b3;text-decoration:none">↗ فتح في صفحة كاملة</a></div></div>`
    : (_entityTrustBox(item, "project") +
    _currentStatusCard(item) +
    _botFeaturesCard(item) +
    _claudeSessionCard(item) +
    (item.stack?.length
      ? `<div class="cx-group-heading">التقنيات</div>` +
        `<div class="cx-chips">${item.stack.map((t) => `<span class="cx-chip">${E(t)}</span>`).join("")}</div>`
      : "") +
    (!item.stack?.length && tags.length
      ? `<div class="cx-group-heading">الوسوم</div>` +
        `<div class="cx-chips">${tags.map((t) => `<span class="cx-chip">${E(t)}</span>`).join("")}</div>`
      : ""));

  const details = _cxSectionsFromParsed(sections) || _cxEmpty("لا توجد أقسام تفصيلية", "📭");

  const relatedRows = [];
  if (item.parent_project) relatedRows.push(item.parent_project);
  if (item.related_services?.length) relatedRows.push(...item.related_services);
  if (item.related_tools?.length) relatedRows.push(...item.related_tools);
  if (item.related_cloud?.length) relatedRows.push(...item.related_cloud);
  if (item.related_entities?.length) relatedRows.push(...item.related_entities);
  const related = _cxRelatedTab(
    { name: item.ar || item.name, em: item.em, cl },
    relatedRows,
  );

  const linksHTML =
    _cxLinks(links) +
    (item.local_path ? `<div class="cx-group-heading">المسار المحلي</div>${_cxPath(item.local_path)}` : "") +
    (item.server_path ? `<div class="cx-group-heading">مسار السيرفر</div>${_cxPath(item.server_path)}` : "") +
    (!item.local_path && !item.server_path && item.path ? _cxPath(item.path) : "");

  _codexShell({
    item, kind: "project", cl,
    kicker: `مشروع · ${_projectKindLabel(item.kind) || ""}`.trim(),
    title: item.ar || item.name,
    subtitle: (item.ar && item.ar !== item.name) ? item.name : "",
    summary: item.summary || headline || "",
    facts,
    pills: [
      { label: stLabel, kind: isLive ? "live" : "status" },
      item.pct != null ? { label: `${item.pct}%` } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
      details: { html: details, count: sections.length || null },
      related: { html: related, count: relatedRows.length || null },
      links: { html: linksHTML, count: Object.keys(links).length || null },
    },
  });
}

/* ── 2. BOT TERMINAL — واجهة ترمنال داكنة ── */
function openBotDetail(name) {
  const item = BOT.find((b) => b.name === name);
  if (!item) return;
  closeDetail();
  const { headline, sections } = _parseDesc(item);
  const stats = BSTATS[item.name] || [];
  const cl = item.cl || "#6C3AED";
  const isActive = item.st === "a";
  const tags = item.tags || [];
  const kindLabel = _botKindLabel(item.kind);

  const facts = [
    { label: "الحالة", value: isActive ? "نشط" : "متوقف" },
    item.host ? { label: "المضيف", value: item.host } : null,
    item.runtime ? { label: "التشغيل", value: item.runtime } : null,
    item.channel ? { label: "القناة", value: item.channel } : null,
    ...stats.slice(0, 2).map((s) => ({ label: s.l, value: s.v })),
  ].filter(Boolean).slice(0, 6);

  const overview =
    _entityTrustBox(item, "bot") +
    _botFeaturesCard(item) +
    (stats.length
      ? `<div class="cx-group-heading">المقاييس</div>` +
        `<div class="cx-facts">${stats.map((s) => `<div class="cx-fact"><span class="cx-fact-label">${E(s.l)}</span><strong class="cx-fact-val">${E(s.v)}</strong></div>`).join("")}</div>`
      : "") +
    (tags.length
      ? `<div class="cx-group-heading">الوسوم</div>` +
        `<div class="cx-chips">${tags.map((t) => `<span class="cx-chip">${E(t)}</span>`).join("")}</div>`
      : "");

  const details = _cxSectionsFromParsed(sections) || _cxEmpty("لا توجد أقسام تفصيلية", "📭");

  const related = _cxRelatedTab(
    { name: item.ar || item.name, em: item.em, cl },
    item.related_entities || [],
  );

  const linksHTML = _cxLinks(item.links) + (item.path ? _cxPath(item.path) : "");

  _codexShell({
    item, kind: "bot", cl,
    kicker: `بوت · ${kindLabel}`,
    title: item.ar || item.name,
    subtitle: (item.ar && item.ar !== item.name) ? item.name : "",
    summary: item.summary || headline || "",
    facts,
    pills: [
      { label: isActive ? "نشط" : "متوقف", kind: isActive ? "live" : "status" },
      item.host ? { label: item.host } : null,
      item.channel ? { label: item.channel } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
      details: { html: details, count: sections.length || null },
      related: { html: related, count: (item.related_entities || []).length || null },
      links: { html: linksHTML, count: Object.keys(item.links || {}).length || null },
    },
  });
}

/* ── 3. TOOL SPLIT — لوحة منقسمة (أيقونة + تفاصيل) ── */
function openToolDetail(name) {
  const item = TL.find((t) => t.name === name);
  if (!item) return;
  closeDetail();
  const { headline, sections } = _parseDesc(item);
  const cl = item.cl || "#6C3AED";
  const tags = item.tags || [];
  const categoryMap = {
    "developer-env": "AI CLI",
    "internal-tool": "أداة داخلية",
    platform: "منصة",
    "infra-access": "وصول بنية",
    mcp: "MCP",
  };
  const catLabel = item.category ? (categoryMap[item.category] || item.category) : "";
  const usedIn = item.used_in || [];
  const factRows = item.facts || [];
  const customRows = item.customizations || [];
  const configPaths = item.config_paths || [];
  const structureRows = item.structure || [];
  const capabilityRows = item.capabilities || [];
  const editRows = item.edit_points || [];

  const facts = [
    item.type ? { label: "النوع", value: item.type } : null,
    catLabel ? { label: "الفئة", value: catLabel } : null,
    { label: "الاستخدام", value: String(usedIn.length) },
    { label: "القدرات", value: String(capabilityRows.length) },
    { label: "تخصيصات", value: String(customRows.length) },
    { label: "روابط", value: String(Object.keys(item.links || {}).length) },
  ].filter(Boolean).slice(0, 6);

  const overview =
    _entityTrustBox(item, "tool") +
    (factRows.length ? _cxSection("الإعداد الحالي", factRows) : "") +
    (capabilityRows.length ? _cxSection("قدرات متصلة", capabilityRows, "info") : "") +
    (tags.length
      ? `<div class="cx-group-heading">الوسوم</div>` +
        `<div class="cx-chips">${tags.map((t) => `<span class="cx-chip">${E(t)}</span>`).join("")}</div>`
      : "");

  const details =
    (customRows.length ? _cxSection("ما أُضيف أو خُصص", customRows, "accent") : "") +
    (structureRows.length ? _cxSection("البنية الداخلية", structureRows) : "") +
    (editRows.length ? _cxSection("إذا أردت تعديلها", editRows, "warn") : "") +
    (configPaths.length
      ? `<div class="cx-group-heading">ملفات الإعداد</div>` +
        configPaths.map((p) => _cxPath(p)).join("")
      : "") +
    _cxSectionsFromParsed(sections) ||
    _cxEmpty("لا توجد تفاصيل إضافية", "📭");

  const related = _cxRelatedTab(
    { name: item.ar || item.name, em: item.em, cl },
    usedIn,
  );

  const linksHTML = _cxLinks(item.links) + (item.path ? _cxPath(item.path) : "");

  _codexShell({
    item, kind: "tool", cl,
    kicker: `أداة · ${catLabel || ""}`.trim(),
    title: item.ar || item.name,
    subtitle: (item.ar && item.ar !== item.name) ? item.name : "",
    summary: item.summary || headline || "",
    facts,
    pills: [
      catLabel ? { label: catLabel, kind: "status" } : null,
      item.type ? { label: item.type } : null,
      usedIn.length ? { label: `يُستخدم في ${usedIn.length}` } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
      details: { html: details, count: null },
      related: { html: related, count: usedIn.length || null },
      links: { html: linksHTML, count: Object.keys(item.links || {}).length || null },
    },
  });
}

/* ── Server section: filter chips + counter animations ── */
function _ccInitServerInteractions() {
  // Counter count-up animation
  document.querySelectorAll(".cc-counter[data-target]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-target"), 10) || 0;
    if (target === 0) { el.textContent = "0"; return; }
    const duration = 900;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const v = Math.round(ease(t) * target);
      el.textContent = String(v);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  // Filter chips
  const filterRow = document.getElementById("cc-svc-filters");
  if (!filterRow) return;
  filterRow.addEventListener("click", (e) => {
    const chip = e.target.closest(".cc-mag-chip");
    if (!chip) return;
    const filter = chip.getAttribute("data-filter") || "all";
    filterRow.querySelectorAll(".cc-mag-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    document.querySelectorAll(".svc-item").forEach((el) => {
      const t = el.getAttribute("data-svc-type") || "";
      const s = el.getAttribute("data-svc-status") || "";
      let show = true;
      if (filter === "all") show = true;
      else if (filter === "off") show = s === "off";
      else show = t === filter;
      el.style.display = show ? "" : "none";
    });
    // Hide empty groups
    document.querySelectorAll(".cc-svc-group").forEach((g) => {
      const visible = Array.from(g.querySelectorAll(".svc-item")).some((el) => el.style.display !== "none");
      g.style.display = visible ? "" : "none";
    });
  });
}

// Run after server section renders
const _origRenderServer = R.server;
R.server = function () {
  const html = _origRenderServer.apply(this, arguments);
  setTimeout(_ccInitServerInteractions, 80);
  return html;
};

function openServiceDetail(name) {
  const item = SVC.find((s) => s.name === name);
  if (!item) return;
  closeDetail();
  const owner = item.owner || item.prj || "";
  const cl = _prjColor(owner || item.name) || "#0EA5E9";
  const typeLabel = item.service_type ? _serviceTypeLabel(item.service_type) : "";
  const isActive = !!item.st;

  const facts = [
    typeLabel ? { label: "النوع", value: typeLabel } : null,
    item.runtime ? { label: "التشغيل", value: item.runtime } : null,
    item.schedule ? { label: "الجدولة", value: item.schedule } : null,
    (item.port && item.port !== "—") ? { label: "المنفذ", value: String(item.port) } : null,
    owner ? { label: item.owner_type === "bot" ? "المالك" : "يتبع", value: owner } : null,
    { label: "الحالة", value: isActive ? "نشط" : "متوقف" },
  ].filter(Boolean).slice(0, 6);

  const overview =
    _entityTrustBox(item, "service") +
    (item.info ? _cxSection("ما هذا", [item.info], "info") : "") +
    (item.dt ? _cxSection("التشغيل", [item.dt], "accent") : "");

  const details = _cxSection("معلومات تشغيلية", [
    item.runtime ? `التشغيل: ${item.runtime}` : "",
    item.schedule ? `الجدولة: ${item.schedule}` : "",
    item.port && item.port !== "—" ? `المنفذ: ${item.port}` : "",
  ].filter(Boolean)) || _cxEmpty("لا توجد تفاصيل تشغيلية إضافية", "⚙️");

  const related = owner ? _cxChips([owner]) : "";

  const linksHTML = (item.path ? _cxPath(item.path) : "") + _cxLinks(item.links);

  _codexShell({
    item, kind: "service", cl,
    kicker: `خدمة · ${typeLabel || ""}`.trim(),
    title: item.name,
    summary: item.info || item.dt || "",
    facts,
    pills: [
      { label: isActive ? "نشط" : "متوقف", kind: isActive ? "live" : "status" },
      typeLabel ? { label: typeLabel } : null,
      owner ? { label: owner } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
      details: { html: details, count: null },
      related: { html: related, count: owner ? 1 : null },
      links: { html: linksHTML, count: Object.keys(item.links || {}).length || null },
    },
  });
}

function openCloudDetail(name) {
  const item = CLD.find((c) => c.nm === name);
  if (!item) return;
  closeDetail();
  const cl = _entityColor(item.prj || item.nm, "#0EA5E9");
  const catLabel = item.category ? _cloudCategoryLabel(item.category) : "";
  const isActive = item.active !== false;
  const usedIn = item.related_entities || item.used_in || [];
  const itemForShell = { ...item, name: item.nm };

  const facts = [
    catLabel ? { label: "الدور", value: catLabel } : null,
    item.prj ? { label: "المشروع", value: item.prj } : null,
    { label: "الحالة", value: isActive ? "نشط" : "متوقف" },
    { label: "يُستخدم في", value: String(usedIn.length) },
  ].filter(Boolean);

  const overview =
    _entityTrustBox(item, "cloud") +
    (item.dt ? _cxSection("الوصف", [item.dt], "info") : "");

  const details = _cxSection("التفاصيل", [
    catLabel ? `الدور: ${catLabel}` : "",
    item.prj ? `يرتبط أساسًا بـ: ${item.prj}` : "",
    item.lk ? `المنصة: ${item.lk}` : "",
  ].filter(Boolean)) || _cxEmpty("لا توجد تفاصيل إضافية", "☁️");

  const related = _cxRelatedTab(
    { name: item.ar || item.nm || item.name, em: item.em, cl },
    usedIn,
  );

  const linksHTML = item.lk
    ? `<a class="cx-link" href="${E(item.lk)}" target="_blank" rel="noopener">` +
      `<div class="cx-link-l"><span class="cx-link-label">افتح المنصة</span><span class="cx-link-url">${E(item.lk)}</span></div>` +
      `<span class="cx-link-arrow">↗</span></a>`
    : "";

  _codexShell({
    item: itemForShell, kind: "cloud", cl,
    kicker: `خدمة سحابية · ${catLabel || ""}`.trim(),
    title: item.nm,
    summary: item.dt || "",
    facts,
    pills: [
      { label: isActive ? "نشط" : "متوقف", kind: isActive ? "live" : "status" },
      catLabel ? { label: catLabel } : null,
      item.prj ? { label: item.prj } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
      details: { html: details, count: null },
      related: { html: related, count: usedIn.length || null },
      links: { html: linksHTML, count: item.lk ? 1 : null },
    },
  });
}

/* ── 4. IDEA EXPAND — بطاقة تتوسع من المركز ── */
/* ── Blueprint card for rich ideas (with item.blueprint) ── */
function _ideaBlueprintCard(item) {
  const bp = item && item.blueprint;
  if (!bp) return "";
  const cl = item.cl || "#7C3AED";

  const vision = bp.vision
    ? `<div class="bp-block bp-vision" style="--bp-cl:${cl}">` +
      `<div class="bp-eyebrow">${_ic("🎯", 12)} الرؤية</div>` +
      `<p class="bp-prose-lg">${E(bp.vision)}</p>` +
      `</div>`
    : "";

  const principle = bp.principle
    ? `<div class="bp-block bp-principle">` +
      `<div class="bp-eyebrow">${_ic("🧭", 12)} المبدأ</div>` +
      `<p class="bp-prose">${E(bp.principle)}</p>` +
      `</div>`
    : "";

  const tools = bp.tools_minimum && bp.tools_minimum.length
    ? `<div class="bp-block">` +
      `<div class="bp-eyebrow">${_ic("🛠️", 12)} الأدوات (${bp.tools_minimum.length} فقط)</div>` +
      `<div class="bp-tools-grid">` +
      bp.tools_minimum.map((t) => (
        `<div class="bp-tool"><strong>${E(t.name)}</strong><span>${E(t.role)}</span><em>${E(t.cost)}</em></div>`
      )).join("") +
      `</div></div>`
    : "";

  const kept = bp.kept_as_is && bp.kept_as_is.length
    ? `<div class="bp-block">` +
      `<div class="bp-eyebrow">${_ic("✅", 12)} نُبقيه كما هو (لا migration)</div>` +
      `<ul class="bp-list bp-list--ok">` +
      bp.kept_as_is.map((k) => `<li>${E(k)}</li>`).join("") +
      `</ul></div>`
    : "";

  const changes = bp.what_changes && bp.what_changes.length
    ? `<div class="bp-block">` +
      `<div class="bp-eyebrow">${_ic("⚡", 12)} ما الذي يتغيّر فعلاً (${bp.what_changes.length})</div>` +
      `<div class="bp-changes">` +
      bp.what_changes.map((c) => (
        `<div class="bp-change">` +
        `<div class="bp-change-row bp-change-problem"><span class="bp-tag bp-tag-red">المشكلة</span>${E(c.problem)}</div>` +
        `<div class="bp-change-row bp-change-fix"><span class="bp-tag bp-tag-blue">الحل</span>${E(c.fix)}</div>` +
        `<div class="bp-change-row bp-change-impact"><span class="bp-tag bp-tag-green">الأثر</span>${E(c.impact)}</div>` +
        `</div>`
      )).join("") +
      `</div></div>`
    : "";

  const subdomains = bp.subdomain_map && bp.subdomain_map.length
    ? `<div class="bp-block">` +
      `<div class="bp-eyebrow">${_ic("🌐", 12)} خريطة الـsubdomains (${bp.subdomain_map.length})</div>` +
      `<div class="bp-sub-table">` +
      bp.subdomain_map.map((s) => (
        `<div class="bp-sub-row">` +
        `<code class="bp-sub-code">${E(s.sub)}</code>` +
        `<span class="bp-sub-arrow">→</span>` +
        `<strong class="bp-sub-name">${E(s.to)}</strong>` +
        `<span class="bp-sub-host">${E(s.host)}</span>` +
        `</div>`
      )).join("") +
      `</div></div>`
    : "";

  const cost = bp.cost_monthly
    ? `<div class="bp-block bp-cost-block">` +
      `<div class="bp-eyebrow">${_ic("💰", 12)} التكلفة الشهرية</div>` +
      `<div class="bp-cost-grid">` +
      Object.entries(bp.cost_monthly).filter(([k]) => !["total", "currency", "note"].includes(k)).map(([k, v]) => (
        `<div class="bp-cost-cell"><span>${E(k)}</span><strong>$${v}</strong></div>`
      )).join("") +
      `<div class="bp-cost-cell bp-cost-total"><span>الإجمالي</span><strong>$${bp.cost_monthly.total}</strong></div>` +
      `</div>` +
      (bp.cost_monthly.note ? `<p class="bp-cost-note">${E(bp.cost_monthly.note)}</p>` : "") +
      `</div>`
    : "";

  const phases = bp.phases && bp.phases.length
    ? `<div class="bp-block">` +
      `<div class="bp-eyebrow">${_ic("🚀", 12)} المراحل (${bp.phases.length})</div>` +
      `<div class="bp-phases">` +
      bp.phases.map((p) => (
        `<div class="bp-phase">` +
        `<div class="bp-phase-head"><span class="bp-phase-num" style="background:${cl}">${p.n}</span><strong>${E(p.title)}</strong></div>` +
        `<ol class="bp-phase-steps">${(p.steps || []).map((s) => `<li>${E(s)}</li>`).join("")}</ol>` +
        `</div>`
      )).join("") +
      `</div></div>`
    : "";

  const power = bp.why_powerful && bp.why_powerful.length
    ? `<div class="bp-block bp-power">` +
      `<div class="bp-eyebrow">${_ic("💎", 12)} لماذا هذه الفكرة قوية</div>` +
      `<ul class="bp-list bp-list--power">` +
      bp.why_powerful.map((p) => `<li>${E(p)}</li>`).join("") +
      `</ul></div>`
    : "";

  const excluded = bp.excluded
    ? `<div class="bp-block bp-excluded">` +
      `<div class="bp-eyebrow">${_ic("⛔", 12)} مستثنى من الخطة</div>` +
      `<div class="bp-excluded-content"><strong>${E(bp.excluded.bot)}</strong><p>${E(bp.excluded.why)}</p></div>` +
      `</div>`
    : "";

  const stats = (bp.total_time || bp.total_cost || bp.risk_level)
    ? `<div class="bp-stats-strip">` +
      (bp.total_time ? `<div class="bp-stat"><span>⏱</span><strong>${E(bp.total_time)}</strong><em>وقت التنفيذ</em></div>` : "") +
      (bp.total_cost ? `<div class="bp-stat"><span>💵</span><strong>${E(bp.total_cost)}</strong><em>التكلفة</em></div>` : "") +
      (bp.risk_level ? `<div class="bp-stat"><span>🛡️</span><strong>${E(bp.risk_level)}</strong><em>المخاطرة</em></div>` : "") +
      `</div>`
    : "";

  return (
    `<div class="bp-card" style="--bp-cl:${cl}">` +
    stats +
    vision +
    principle +
    tools +
    kept +
    changes +
    subdomains +
    cost +
    phases +
    power +
    excluded +
    `</div>`
  );
}

function openIdeaDetail(name) {
  const item = IDEAS.find((i) => i.name === name);
  if (!item) return;
  closeDetail();
  const { headline, sections } = _parseDesc(item);
  const prLabels = { 1: "عاجل", 2: "قريب", 3: "يوماً ما" };
  const prColors = { 1: "#EF4444", 2: "#F59E0B", 3: "#6366F1" };
  const cl = prColors[item.pr] || "#6366F1";
  const relProj = item.related_projects || [];

  const facts = [
    { label: "الأولوية", value: prLabels[item.pr] || "—" },
    item.owner_scope ? { label: "النطاق", value: item.owner_scope } : null,
    item.horizon ? { label: "الأفق", value: item.horizon } : null,
    { label: "مرتبطة بـ", value: String(relProj.length) },
    item.next_step ? { label: "الخطوة التالية", value: item.next_step } : null,
  ].filter(Boolean).slice(0, 6);

  const overview =
    _entityTrustBox(item, "idea") +
    _ideaBlueprintCard(item);

  const details = _cxSectionsFromParsed(sections) || _cxEmpty("لا توجد أقسام تفصيلية", "💡");

  const related = _cxRelatedTab(
    { name: item.ar || item.name, em: item.em, cl },
    relProj,
  );

  const linksHTML = _cxLinks(item.links);

  _codexShell({
    item, kind: "idea", cl,
    kicker: `فكرة · ${prLabels[item.pr] || ""}`.trim(),
    title: item.name,
    summary: item.summary || headline || "",
    facts,
    pills: [
      { label: prLabels[item.pr] || "فكرة", kind: "status" },
      item.horizon ? { label: item.horizon } : null,
      item.owner_scope ? { label: item.owner_scope } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
      details: { html: details, count: sections.length || null },
      related: { html: related, count: relProj.length || null },
      links: { html: linksHTML, count: Object.keys(item.links || {}).length || null },
    },
  });
}

/* ── 5. ARCHIVE DOCUMENT — وثيقة ورقية كلاسيكية ── */
function openArchiveDetail(name) {
  const item = ARC.find((a) => a.name === name);
  if (!item) return;
  closeDetail();
  const { headline, sections } = _parseDesc(item);
  const cl = item.cl || "#F59E0B";
  const stamp = _archiveStamp(item);
  const kindLabel = _archiveKindLabel(item);
  const isActive = item.st === "a";
  const relProj = item.related_projects || [];
  const tags = item.tags || [];

  const facts = [
    { label: "التصنيف", value: kindLabel },
    { label: "الحالة", value: isActive ? "نشط" : "أرشيف" },
    { label: "مرتبط بـ", value: String(relProj.length) },
    { label: "وسوم", value: String(tags.length) },
    item.next_step ? { label: "الخطوة التالية", value: item.next_step } : null,
  ].filter(Boolean).slice(0, 6);

  const overview =
    _entityTrustBox(item, "archive") +
    (tags.length
      ? `<div class="cx-group-heading">الوسوم</div>` +
        `<div class="cx-chips">${tags.map((t) => `<span class="cx-chip">${E(t)}</span>`).join("")}</div>`
      : "");

  const details = _cxSectionsFromParsed(sections) || _cxEmpty("لا توجد أقسام تفصيلية", "📚");

  const related = _cxRelatedTab(
    { name: item.ar || item.name, em: item.em, cl },
    relProj,
  );

  const linksHTML = (item.path ? _cxPath(item.path) : "") + _cxLinks(item.links);

  _codexShell({
    item, kind: "archive", cl,
    kicker: `أرشيف · ${stamp || kindLabel}`.trim(),
    title: item.ar || item.name,
    subtitle: (item.ar && item.ar !== item.name) ? item.name : "",
    summary: item.summary || headline || "",
    facts,
    pills: [
      { label: stamp || (isActive ? "نشط" : "أرشيف"), kind: isActive ? "live" : "status" },
      kindLabel ? { label: kindLabel } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
      details: { html: details, count: sections.length || null },
      related: { html: related, count: relProj.length || null },
      links: { html: linksHTML, count: Object.keys(item.links || {}).length || null },
    },
  });
}

/* ── 8. AUTOMATION TASK — مهمة مجدولة ── */
function openAutoDetail(taskKey) {
  if (!taskKey || typeof AUTO === "undefined") return;
  let group = null, task = null;
  for (const g of AUTO) {
    const found = (g.tasks || []).find((t) => (g.host + "::" + t.name) === taskKey);
    if (found) { group = g; task = found; break; }
  }
  if (!task) return;
  closeDetail(true);
  const cl = task.on ? "#10B981" : "#94a3b8";
  const stateLabel = task.on ? "نشطة" : "معطّلة";
  const linkedProjects = (task.prj || []).map((p) => {
    const pc = _prjColor(p) || "#888";
    return `<button class="cx-chip" data-action="openProject" data-arg="${E(p)}" style="background:${pc}22;border-color:${pc}50">${E(p)}</button>`;
  }).join("");

  const facts = [
    { label: "التكرار", value: task.freq || "—" },
    { label: "النوع", value: task.kind || "—" },
    { label: "المضيف", value: group.group || "—" },
    { label: "المُشغِّل", value: group.loc || "—" },
  ];

  const overview =
    (task.what ? `<div class="cx-group-heading">الوصف</div><div class="cx-section-block"><p>${E(task.what)}</p></div>` : "") +
    (linkedProjects ? `<div class="cx-group-heading">المشاريع المرتبطة</div><div class="cx-chips">${linkedProjects}</div>` : "") +
    (task.path ? `<div class="cx-group-heading">المسار</div>${_cxPath(task.path)}` : "");

  _codexShell({
    item: { name: task.name, ar: task.name, em: task.on ? "🟢" : "⚪" },
    kind: "automation",
    cl,
    kicker: `أتمتة · ${group.group}`,
    title: task.name,
    subtitle: group.loc,
    summary: task.what || "",
    facts,
    pills: [
      { label: stateLabel, kind: task.on ? "live" : "status" },
      task.kind ? { label: task.kind } : null,
    ].filter(Boolean),
    tabs: {
      overview: { html: overview, count: null },
    },
  });
}

/* ── 9. TEAM MEMBER — موظف ── */
function openTeamDetail(name) {
  if (typeof TEAM === "undefined") return;
  const m = TEAM.find((x) => x.name === name || x.full_name === name);
  if (!m) return;
  closeDetail(true);
  const cl = m.cl || "#6366F1";
  const projects = (m.assigned_projects || []).map((pid) => {
    const p = PRJ.find((x) => x.id === pid);
    if (!p) return null;
    return `<button class="cx-chip" data-action="openProject" data-arg="${E(p.name)}">${_ic(p.em, 12)} ${E(p.ar || p.name)}</button>`;
  }).filter(Boolean).join("");

  const facts = [
    { label: "الدور", value: m.role || "—" },
    { label: "القسم", value: m.department || "—" },
    { label: "مشاريع", value: String((m.assigned_projects || []).length) },
    m.hire_date ? { label: "تاريخ الانضمام", value: m.hire_date } : null,
  ].filter(Boolean);

  const contactLines = [];
  if (m.email_work) contactLines.push(`<div><strong>إيميل:</strong> <a href="mailto:${E(m.email_work)}">${E(m.email_work)}</a></div>`);
  if (m.phone) contactLines.push(`<div><strong>هاتف:</strong> ${E(m.phone)}</div>`);

  const overview =
    (m.bio ? `<div class="cx-group-heading">نبذة</div><div class="cx-section-block"><p>${E(m.bio)}</p></div>` : "") +
    (contactLines.length ? `<div class="cx-group-heading">تواصل</div><div class="cx-section-block">${contactLines.join("")}</div>` : "") +
    (projects ? `<div class="cx-group-heading">مشاريع مسؤول عنها</div><div class="cx-chips">${projects}</div>` : "");

  _codexShell({
    item: { name: m.name, ar: m.full_name || m.name, em: "👤" },
    kind: "team",
    cl,
    kicker: `الفريق · ${m.department || "—"}`,
    title: m.full_name || m.name,
    subtitle: m.role || "",
    summary: m.bio || "",
    facts,
    pills: [
      { label: m.role || "موظف", kind: "status" },
    ],
    tabs: {
      overview: { html: overview, count: null },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   CODEX PANEL — unified popup chrome
   Replaces .di-* / .dsp-* / .dt-* / .da-* / .prj-detail with one
   dark side-drawer system. All open* functions route through this.
   ═══════════════════════════════════════════════════════════════ */
function _codexShell(opts) {
  const item = opts.item || {};
  const cl = opts.cl || "#7C3AED";
  const kind = opts.kind || "entity";
  const title = E(opts.title || item.ar || item.name || item.nm || "");
  const subtitle = opts.subtitle ? E(opts.subtitle) : "";
  const kicker = opts.kicker ? E(opts.kicker) : "";
  const emoji = item.em || opts.em || "📦";
  const pills = (opts.pills || []).filter(Boolean);
  const summary = opts.summary || "";
  const facts = opts.facts || [];
  const tabs = opts.tabs || {};
  const footer = opts.footer || "";

  const tabKeys = ["overview", "details", "related", "links"];
  const tabLabels = {
    overview: "نظرة",
    details: "تفاصيل",
    related: "مرتبط",
    links: "روابط",
  };

  const present = tabKeys.filter((k) => {
    const v = tabs[k];
    if (typeof v === "string") return v.trim().length > 0;
    if (v && typeof v === "object") return (v.html || "").trim().length > 0;
    return false;
  });

  const tabBar = present
    .map((k, i) => {
      const v = tabs[k];
      const count = (v && typeof v === "object" && v.count != null) ? v.count : null;
      return `<button class="cx-tab${i === 0 ? " is-active" : ""}" data-cx-tab="${k}">${tabLabels[k]}${count != null ? `<span class="cx-tab-count">${count}</span>` : ""}</button>`;
    })
    .join("");

  const panes = present
    .map((k, i) => {
      const v = tabs[k];
      const html = typeof v === "string" ? v : (v.html || "");
      return `<div class="cx-pane${i === 0 ? " is-active" : ""}" data-cx-pane="${k}">${html}</div>`;
    })
    .join("");

  const pillsHTML = pills
    .map((p) => {
      const klass = p.kind === "status" ? "cx-pill cx-pill--status"
        : p.kind === "live" ? "cx-pill cx-pill--status cx-pill--live"
        : "cx-pill";
      return `<span class="${klass}">${E(p.label)}</span>`;
    })
    .join("");

  const factsHTML = facts.length
    ? `<div class="cx-facts">${facts.map((f) => (
        `<div class="cx-fact"><span class="cx-fact-label">${E(f.label)}</span><strong class="cx-fact-val${(String(f.value).length > 8 ? " cx-fact-val--small" : "")}">${E(f.value)}</strong></div>`
      )).join("")}</div>`
    : "";

  const summaryHTML = summary
    ? `<div class="cx-summary">${E(summary)}</div>`
    : "";

  // First tab gets summary + facts auto-prepended (only for "overview")
  const firstPane = present[0];
  const augmentedPanes = panes.replace(
    `<div class="cx-pane is-active" data-cx-pane="${firstPane}">`,
    `<div class="cx-pane is-active" data-cx-pane="${firstPane}">${summaryHTML}${factsHTML}`
  );

  const root = document.createElement("div");
  root.id = "detail-view";
  root.className = "cx-root";
  root.setAttribute("data-cx-kind", kind);
  root.style.setProperty("--cx-cl", cl);
  root.innerHTML =
    `<div class="cx-scrim" data-cx-close></div>` +
    `<aside class="cx-panel" role="dialog" aria-modal="true" aria-labelledby="cx-title">` +
      `<header class="cx-cover">` +
        `<button class="cx-close" data-cx-close aria-label="إغلاق">×</button>` +
        `<button class="cx-copy-link" type="button" aria-label="نسخ رابط هذا الكيان" title="نسخ الرابط" data-action="copyDrawerLink">🔗</button>` +
        `<div class="cx-cover-row">` +
          `<div class="cx-emoji">${_ic(emoji, 44)}</div>` +
          `<div class="cx-titles">` +
            (kicker ? `<div class="cx-kicker">${kicker}</div>` : "") +
            `<h2 class="cx-title" id="cx-title">${title}</h2>` +
            (subtitle ? `<div class="cx-subtitle">${subtitle}</div>` : "") +
          `</div>` +
        `</div>` +
        (pillsHTML ? `<div class="cx-pill-row">${pillsHTML}</div>` : "") +
      `</header>` +
      (present.length > 1
        ? `<nav class="cx-tabs" role="tablist">${tabBar}</nav>`
        : "") +
      `<div class="cx-body">${augmentedPanes}</div>` +
      (footer ? `<footer class="cx-footer">${footer}</footer>` : "") +
    `</aside>`;

  // Restore any pages hidden by previous detail view
  document.querySelectorAll(".page").forEach((p) => {
    if (p.style.display === "none") p.style.display = "";
  });
  document.body.appendChild(root);

  // Wire close
  root.querySelectorAll("[data-cx-close]").forEach((el) =>
    el.addEventListener("click", () => closeDetail()),
  );

  // Wire tabs
  root.querySelectorAll("[data-cx-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.getAttribute("data-cx-tab");
      root.querySelectorAll(".cx-tab").forEach((t) => t.classList.toggle("is-active", t === btn));
      root.querySelectorAll(".cx-pane").forEach((p) =>
        p.classList.toggle("is-active", p.getAttribute("data-cx-pane") === k),
      );
    });
  });

  // ESC to close — DO NOT use {once:true} (any keydown would remove handler
  // before user even reached Escape). Handler is removed in closeDetail()
  // via the same `_cxEscHandler` reference attached below.
  const esc = (e) => { if (e.key === "Escape") closeDetail(); };
  document.addEventListener("keydown", esc);
  root._cxEscHandler = esc;

  if (item.name || item.nm) {
    _setHashSilently(cur + "/" + encodeURIComponent(item.name || item.nm));
  }
  document.documentElement.classList.add("cx-locked");

  // A11y: remember the trigger element so we restore focus on close
  root._cxLastFocus = document.activeElement;
  // Make the rest of the page non-interactive while drawer is open
  document.querySelectorAll("body > *:not(#detail-view):not(script):not(style)").forEach((el) => {
    if (el.id !== "detail-view") {
      el.setAttribute("aria-hidden", "true");
      if ("inert" in HTMLElement.prototype) el.inert = true;
    }
  });

  requestAnimationFrame(() => {
    root.classList.add("is-open");
    _processIcons();
    // Move focus into the drawer for screen readers + keyboard users
    const firstFocusable = root.querySelector(".cx-close, [data-cx-tab], a, button");
    if (firstFocusable) firstFocusable.focus();
  });

  // Focus trap — keep Tab inside the drawer
  root._cxTrap = (e) => {
    if (e.key !== "Tab") return;
    const focusables = root.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };
  document.addEventListener("keydown", root._cxTrap);
}

/* Helper builders for codex panes */
function _cxSection(title, rows, accent) {
  if (!rows || !rows.length) return "";
  const cls = accent ? `cx-section cx-section--${accent}` : "cx-section";
  return (
    `<div class="${cls}">` +
    (title ? `<div class="cx-section-title">${E(title)}</div>` : "") +
    rows.map((r) => `<div class="cx-section-row">${E(r)}</div>`).join("") +
    `</div>`
  );
}
function _cxSectionsFromParsed(sections) {
  if (!sections || !sections.length) return "";
  const tintMap = {
    "📐": "info", "🔧": "", "📊": "accent", "🔄": "warn", "🚀": "info",
    "💾": "info", "📱": "", "📦": "accent", "🔐": "rose", "🛡️": "rose",
    "🤖": "", "👥": "info", "🛠️": "", "📈": "accent", "🌍": "info",
    "🔗": "info", "📍": "warn", "⏰": "warn", "💰": "accent", "🌐": "info",
  };
  return sections.map((s) => {
    const first = s.title ? [...s.title][0] : "";
    return _cxSection(s.title, s.rows, tintMap[first] || "");
  }).join("");
}
function _cxChips(names) {
  if (!names || !names.length) return "";
  return `<div class="cx-chips">${names.map((n) => (
    `<button class="cx-chip" onclick="openDetailSmart('${EJ(n)}')">${E(n)}</button>`
  )).join("")}</div>`;
}

/* _cxRelGraph — radial relationship map for the drawer "related" tab.
 * central: {name, em, cl}. related: array of entity-name strings.
 * Renders an SVG hub-and-spoke; falls back to a message when empty. */
function _cxRelGraph(central, relatedNames) {
  const uniq = [...new Set((relatedNames || []).filter(Boolean))];
  if (!uniq.length) {
    return `<div class="cx-relgraph-empty">${_ic("🔗", 22)}<span>لا توجد كيانات مرتبطة موثّقة لهذا العنصر بعد</span></div>`;
  }
  const shown = uniq.slice(0, 8);
  const extra = uniq.length - shown.length;
  const CX = 160, CY = 160, R = 100;
  const n = shown.length;
  const nodes = shown.map((name, i) => {
    // start at top (-90deg), distribute evenly
    const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
    const x = CX + R * Math.cos(ang);
    const y = CY + R * Math.sin(ang);
    const ent = _entityLookup(name);
    const cl = (ent && ent.cl) || _prjColor(name) || "#94a3b8";
    const em = (ent && ent.em) || "•";
    return { name, x, y, cl, em };
  });
  const lines = nodes.map((nd) => (
    `<line x1="${CX}" y1="${CY}" x2="${nd.x.toFixed(1)}" y2="${nd.y.toFixed(1)}" ` +
    `stroke="${nd.cl}" stroke-width="1.5" stroke-opacity="0.45" />`
  )).join("");
  const nodeEls = nodes.map((nd) => {
    const short = nd.name.length > 14 ? nd.name.slice(0, 13) + "…" : nd.name;
    return (
      `<g class="cx-rg-node" onclick="openDetailSmart('${EJ(nd.name)}')" tabindex="0" ` +
      `role="button" aria-label="${E(nd.name)}" ` +
      `onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetailSmart('${EJ(nd.name)}')}">` +
      `<title>${E(nd.name)}</title>` +
      `<circle cx="${nd.x.toFixed(1)}" cy="${nd.y.toFixed(1)}" r="20" fill="${nd.cl}" fill-opacity="0.18" stroke="${nd.cl}" stroke-width="1.5"/>` +
      `<text x="${nd.x.toFixed(1)}" y="${(nd.y + 5).toFixed(1)}" text-anchor="middle" font-size="16">${E(nd.em)}</text>` +
      `<text x="${nd.x.toFixed(1)}" y="${(nd.y + 36).toFixed(1)}" text-anchor="middle" class="cx-rg-label">${E(short)}</text>` +
      `</g>`
    );
  }).join("");
  const centralCl = central.cl || "var(--cx-cl)";
  return (
    `<div class="cx-relgraph">` +
    `<svg viewBox="0 0 320 320" class="cx-relgraph-svg" role="img" aria-label="خريطة العلاقات">` +
    lines +
    `<circle cx="${CX}" cy="${CY}" r="34" fill="${centralCl}" fill-opacity="0.22" stroke="${centralCl}" stroke-width="2"/>` +
    `<text x="${CX}" y="${CY + 9}" text-anchor="middle" font-size="26">${E(central.em || "📦")}</text>` +
    nodeEls +
    `</svg>` +
    (extra > 0 ? `<div class="cx-relgraph-more">+${extra} كيانًا آخر</div>` : "") +
    `</div>`
  );
}

/* Build the full related-tab content: graph + flat chips list.
 * Returns "" when there are no relations so the tab stays hidden. */
function _cxRelatedTab(central, relatedNames) {
  const uniq = [...new Set((relatedNames || []).filter(Boolean))];
  if (!uniq.length) return "";
  return (
    _cxRelGraph(central, uniq) +
    `<div class="cx-group-heading">كل الكيانات المرتبطة (${uniq.length})</div>` +
    _cxChips(uniq)
  );
}
function _cxLinks(links) {
  if (!links) return "";
  const entries = Object.entries(links).filter(([, v]) => v);
  if (!entries.length) return "";
  return entries.map(([k, v]) => (
    `<a class="cx-link" href="${E(v)}" target="_blank" rel="noopener">` +
    `<div class="cx-link-l"><span class="cx-link-label">${E(k)}</span><span class="cx-link-url">${E(v)}</span></div>` +
    `<span class="cx-link-arrow">↗</span>` +
    `</a>`
  )).join("");
}
function _cxPath(path) {
  if (!path) return "";
  return `<div class="cx-pathblock">${E(path)}</div>`;
}
function _cxEmpty(msg, icon) {
  return `<div class="cx-empty"><span class="cx-empty-icon">${icon || "·"}</span>${E(msg || "لا توجد تفاصيل بعد")}</div>`;
}

/* ── إغلاق أي عرض تفصيلي ── */
function closeDetail(instant) {
  const d = document.getElementById("detail-view");
  if (!d) {
    document.documentElement.classList.remove("cx-locked");
    return;
  }
  // Restore ALL hidden pages (project detail hides all)
  document.querySelectorAll(".page").forEach((p) => {
    if (p.style.display === "none") p.style.display = "";
  });
  document.documentElement.classList.remove("cx-locked");

  // A11y: remove inert/aria-hidden + restore focus
  document.querySelectorAll('body > [aria-hidden="true"]').forEach((el) => {
    el.removeAttribute("aria-hidden");
    if ("inert" in HTMLElement.prototype) el.inert = false;
  });
  if (d._cxTrap) document.removeEventListener("keydown", d._cxTrap);
  // ESC handler attached at drawer open — remove explicitly (was leaking before)
  const root = d.querySelector(".cx-panel");
  if (root && root._cxEscHandler) document.removeEventListener("keydown", root._cxEscHandler);
  const lastFocus = d._cxLastFocus;
  if (lastFocus && typeof lastFocus.focus === "function") {
    setTimeout(() => lastFocus.focus(), 0);
  }

  if (instant) {
    d.remove();
    return;
  }
  d.classList.remove("open");
  d.classList.remove("is-open");
  d.addEventListener("transitionend", () => d.remove(), { once: true });
  setTimeout(() => {
    if (document.getElementById("detail-view")) d.remove();
  }, 600);
  if (location.hash.includes("/")) _setHashSilently(cur);
}

/* ── فتح ذكي حسب نوع العنصر (للتنقل بالهاش) ── */
function openDetailSmart(name, pageHint) {
  const openByPage = {
    projects: () => {
      if (PRJ.find((p) => p.name === name)) {
        openProjectDetail(name);
        return true;
      }
      return false;
    },
    server: () => {
      if (SVC.find((s) => s.name === name)) {
        openServiceDetail(name);
        return true;
      }
      return false;
    },
    bots: () => {
      if (BOT.find((b) => b.name === name)) {
        openBotDetail(name);
        return true;
      }
      return false;
    },
    tools: () => {
      if (TL.find((t) => t.name === name)) {
        openToolDetail(name);
        return true;
      }
      return false;
    },
    cloud: () => {
      if (CLD.find((c) => c.nm === name)) {
        openCloudDetail(name);
        return true;
      }
      return false;
    },
    ideas: () => {
      if (IDEAS.find((i) => i.name === name)) {
        openIdeaDetail(name);
        return true;
      }
      return false;
    },
    archive: () => {
      if (ARC.find((a) => a.name === name)) {
        openArchiveDetail(name);
        return true;
      }
      return false;
    },
  };
  if (pageHint && openByPage[pageHint]) {
    if (openByPage[pageHint]()) return;
  }
  if (PRJ.find((p) => p.name === name)) return openProjectDetail(name);
  if (SVC.find((s) => s.name === name)) return openServiceDetail(name);
  if (BOT.find((b) => b.name === name)) return openBotDetail(name);
  if (TL.find((t) => t.name === name)) return openToolDetail(name);
  if (CLD.find((c) => c.nm === name)) return openCloudDetail(name);
  if (IDEAS.find((i) => i.name === name)) return openIdeaDetail(name);
  if (ARC.find((a) => a.name === name)) return openArchiveDetail(name);
}

/* ─────────────── 5. FILTER FUNCTIONS ─────────────── */

function mapFilter(f) {
  const list = document.getElementById("map-list");
  if (!list) return;
  list.querySelectorAll(".map-item").forEach((el) => {
    el.style.display = f === "all" || el.dataset.loc === f ? "" : "none";
  });
  document.querySelectorAll(".map-filters .filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === f);
  });
}

function filterIdeas(pr) {
  const grid = document.getElementById("ideas-grid");
  if (!grid) return;
  grid.querySelectorAll(".sticky-note").forEach((el) => {
    el.style.display =
      pr === "all" || el.dataset.pr === String(pr) ? "" : "none";
  });
  document.querySelectorAll(".idea-filters .filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.priority === String(pr));
    btn.classList.toggle(
      "idea-active",
      btn.dataset.priority === String(pr) && pr !== "all",
    );
  });
}

function _searchKindLabel(kind) {
  const labels = {
    project: "مشروع",
    service: "خدمة",
    automation: "أتمتة",
    bot: "بوت",
    tool: "أداة",
    cloud: "سحابي",
    idea: "فكرة",
    "archived-project": "أرشيف",
    "archived-brand": "أرشيف",
    "archived-client-work": "أرشيف",
    "archived-site-export": "أرشيف",
    "archived-tool": "أرشيف",
    "active-security": "مرجع نشط",
    "active-runtime": "مرجع نشط",
  };
  return labels[kind] || kind;
}

function _searchEmpty(query) {
  return (
    `<div class="search-empty">` +
    `<span class="search-empty-icon">${_ic("🔍", 22)}</span>` +
    `<strong>${query ? "لا توجد نتائج مطابقة" : "ابحث في كل اللوحة من مكان واحد"}</strong>` +
    `<p>${query ? "جرّب اسم مشروع، خدمة، مسار، أو كلمة من الوصف." : "المصدر يشمل المشاريع، الخدمات، الأتمتة، البوتات، الأدوات، السحابية، الأرشيف، والأفكار."}</p>` +
    `</div>`
  );
}

function _renderSearchResults(query) {
  const resultsEl = document.getElementById("search-results");
  if (!resultsEl) return;
  const q = (query || "").trim().toLowerCase();
  let rows = SEARCH_INDEX;
  if (q) {
    const parts = q.split(/\s+/).filter(Boolean);
    rows = SEARCH_INDEX.filter((r) => parts.every((p) => r.tokens.includes(p)));
  }
  rows = rows.slice(0, 18);
  if (!rows.length) {
    resultsEl.innerHTML = _searchEmpty(query);
    requestAnimationFrame(_processIcons);
    return;
  }
  resultsEl.innerHTML = rows
    .map(
      (r) =>
        `<button class="search-result" onclick="selectSearchResult('${EJ(r.id)}')">` +
        `<span class="search-result-kind">${E(_searchKindLabel(r.kind))}</span>` +
        `<div class="search-result-body">` +
        `<strong class="search-result-title">${E(r.title)}</strong>` +
        (r.subtitle
          ? `<span class="search-result-sub">${E(r.subtitle)}</span>`
          : "") +
        `</div>` +
        `<span class="search-result-page">${E(PG.find((p) => p.id === r.page)?.n || r.page)}</span>` +
        `</button>`,
    )
    .join("");
  requestAnimationFrame(_processIcons);
}

function openSearch() {
  closeMore();
  const el = document.getElementById("global-search");
  if (!el) return;
  el.classList.add("open");
  const input = document.getElementById("search-input");
  if (input) {
    input.value = "";
    _renderSearchResults("");
    setTimeout(() => input.focus(), 60);
  }
}

function closeSearch() {
  const el = document.getElementById("global-search");
  if (el) el.classList.remove("open");
}

function selectSearchResult(id) {
  const row = SEARCH_INDEX.find((r) => r.id === id);
  if (!row) return;
  closeSearch();
  if (row.action) row.action();
}

/* ─────────────── 6. INTERACTIVE EFFECTS ─────────────── */

// Removed: .glass-card mouse-glow effect. The .glass class was dropped in the
// bento redesign (no card template assigns it anymore), so the handler was
// running on every mousemove with zero visible effect. CSS for .glass at
// style.css:884 is also dead — slated for SWEEP 1 cleanup.

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeDetail();
    closeMore();
    closeSearch();
  }
  if (
    (e.key === "/" &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) ||
    ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
  ) {
    e.preventDefault();
    openSearch();
  }
});

/* ─────────────── 7. COUNTDOWN HELPER ─────────────── */

function _updateCountdown() {
  const weddingDate = new Date(2026, 3, 21);
  const days = Math.max(0, Math.ceil((weddingDate - new Date()) / 86400000));
  const circumference = 2 * Math.PI * 34;
  const totalDays = 365;
  const pct = Math.min(1, Math.max(0, (totalDays - days) / totalDays));

  const daysEl = document.getElementById("ring-days");
  const fgEl = document.getElementById("ring-fg");
  if (daysEl) daysEl.textContent = days;
  if (fgEl)
    fgEl.style.strokeDasharray = `${(pct * circumference).toFixed(1)} ${circumference.toFixed(1)}`;
}

/* ─────────────── 8. INIT ─────────────── */

/* normalizeAllEntities — apply normalizeEntity() defaults to every entity
 * array IN-PLACE so all renderers can trust shape. Idempotent.
 * Called once at bootstrap, before init() touches data. */
function normalizeAllEntities() {
  const map = [
    [typeof PRJ !== "undefined" && PRJ, "project"],
    [typeof SVC !== "undefined" && SVC, "service"],
    [typeof BOT !== "undefined" && BOT, "bot"],
    [typeof CLD !== "undefined" && CLD, "cloud"],
    [typeof TL  !== "undefined" && TL,  "tool"],
    [typeof ARC !== "undefined" && ARC, "archive"],
    [typeof IDEAS !== "undefined" && IDEAS, "idea"],
    [typeof UMBRELLAS !== "undefined" && UMBRELLAS, "umbrella"],
    [typeof DEPARTMENTS !== "undefined" && DEPARTMENTS, "department"],
    [typeof TEAM !== "undefined" && TEAM, "team"],
  ];
  for (const [arr, kind] of map) {
    if (!Array.isArray(arr)) continue;
    for (let i = 0; i < arr.length; i++) {
      const norm = normalizeEntity(arr[i], kind);
      if (norm) {
        // Merge defaults back without losing object identity (in-place upgrade)
        for (const k in norm) if (arr[i][k] === undefined) arr[i][k] = norm[k];
      }
    }
  }
  // AUTO has nested .tasks arrays
  if (typeof AUTO !== "undefined" && Array.isArray(AUTO)) {
    for (const g of AUTO) {
      if (!Array.isArray(g.tasks)) continue;
      for (let i = 0; i < g.tasks.length; i++) {
        const norm = normalizeEntity(g.tasks[i], "automation");
        if (norm) for (const k in norm) if (g.tasks[i][k] === undefined) g.tasks[i][k] = norm[k];
      }
    }
  }
}

async function bootstrap() {
  // PHASE-4A: normalize entity arrays IN-PLACE before any renderer runs.
  // Fills missing defaults (cl/em/tags/links/st) per entity kind so the
  // ~33 scattered `e.field || fallback` checks become redundant.
  normalizeAllEntities();
  init();
  _startLiveTicks();
  _loadRuntimeData().then(() => {
    _refreshHealthCluster();
    if (RUNTIME_STATE.generated_at) _refreshRuntimeBoundViews();
  });
  _loadHealthData();
  // إعادة فحص صحة كل 5 دقائق
  setInterval(_loadHealthData, 5 * 60 * 1000);
}

bootstrap();

window.addEventListener("hashchange", function () {
  if (_suppressHash) {
    _suppressHash = false;
    return;
  }
  const parts = _hashParts();
  const page = parts[0];
  if (_validPages.has(page) && page !== cur) _activatePage(page, false);
  if (!parts[1] && document.getElementById("detail-view")) closeDetail(true);
  if (parts[1]) {
    const itemName = decodeURIComponent(parts[1]);
    if (_entityLookup(itemName)) {
      setTimeout(() => {
        if (document.getElementById("detail-view")) closeDetail(true);
        openDetailSmart(itemName, page);
      }, 200);
    }
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   FRESHNESS BAR — auto-injected coloured top-strip on every entity card.
   Reads data.freshness.json (generated from git history) so we never have
   to remember to bump an "updated" date by hand. Per-section dates are
   used inside the drawer; the entity _root date is used on listing cards.

   Colours (medium-visible bar, ~22px tall):
     ≤  7 days → 🟢 green   "حديث"
     ≤ 30 days → 🟡 yellow  "متوسّط"
     ≤ 90 days → 🟠 orange  "قديم"
     > 90 days → 🔴 red     "قديم جدًّا"

   The "✓ راجعتُ" button stores a manual review date in localStorage so the
   user can mark unchanged-but-verified entities as fresh again.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  let FRESH_DATA = null;
  let _decorating = false;

  async function _loadFreshness() {
    if (FRESH_DATA) return FRESH_DATA;
    try {
      const r = await fetch("data.freshness.json?v=" + Date.now());
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      FRESH_DATA = j.entities || {};
      return FRESH_DATA;
    } catch (e) {
      // Don't cache the failure — next call retries (transient network/404).
      console.warn("[CC] freshness load failed, will retry:", e.message);
      return {};
    }
  }

  function _reviewKey(id) { return "cc_reviewed_" + id; }
  function _getReview(id) { return localStorage.getItem(_reviewKey(id)) || null; }
  function _setReview(id) {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(_reviewKey(id), today);
  }

  function _ageDays(dateStr) {
    if (!dateStr) return 9999;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  }

  function _ageMeta(days) {
    if (days <= 7)  return { cls: "cc-fresh-green",  label: "حديث",       icon: "🟢" };
    if (days <= 30) return { cls: "cc-fresh-yellow", label: "متوسّط",     icon: "🟡" };
    if (days <= 90) return { cls: "cc-fresh-orange", label: "قديم",       icon: "🟠" };
    return                  { cls: "cc-fresh-red",    label: "قديم جدًّا", icon: "🔴" };
  }

  // Build name→entity lookup once (covers ALL 11 entity arrays in data.js)
  let _nameLookup = null;
  function _buildLookup() {
    if (_nameLookup) return _nameLookup;
    const lk = {};
    const arrs = [
      typeof PRJ !== "undefined" ? PRJ : null,
      typeof BOT !== "undefined" ? BOT : null,
      typeof CLD !== "undefined" ? CLD : null,
      typeof TL !== "undefined" ? TL : null,
      typeof ARC !== "undefined" ? ARC : null,
      typeof IDEAS !== "undefined" ? IDEAS : null,
      typeof SVC !== "undefined" ? SVC : null,
      typeof UMBRELLAS !== "undefined" ? UMBRELLAS : null,
      typeof DEPARTMENTS !== "undefined" ? DEPARTMENTS : null,
      typeof TEAM !== "undefined" ? TEAM : null,
      typeof AUTO !== "undefined" ? AUTO : null,
    ];
    const _index = (e) => {
      const key = e.id || e.nm;
      if (!key) return;
      [e.name, e.ar, e.nm, e.id]
        .filter(Boolean)
        .forEach((n) => (lk[n] = Object.assign({}, e, { id: key })));
    };
    for (const arr of arrs) {
      if (!Array.isArray(arr)) continue;
      for (const e of arr) {
        if (!e) continue;
        _index(e);
        // Walk nested groupings (AUTO has `tasks`, others may have `items`)
        if (Array.isArray(e.tasks)) e.tasks.forEach(_index);
        if (Array.isArray(e.items)) e.items.forEach(_index);
      }
    }
    _nameLookup = lk;
    return lk;
  }

  function _findEntity(el) {
    const lk = _buildLookup();
    const dcn = el.getAttribute("data-cc-name");
    if (dcn) return lk[dcn] || (typeof _entityLookup === "function" ? _entityLookup(dcn) : null);
    const oc = el.getAttribute("onclick") || "";
    const m = /open[A-Z]\w*Detail\w*\(['"]([^'"]+)['"]/.exec(oc);
    if (m) return lk[m[1]] || (typeof _entityLookup === "function" ? _entityLookup(m[1]) : null);
    // last resort: heading text inside the card
    const h = el.querySelector(
      "h2, h3, h4, .prj-card-name, .mod-card-title, .svc-name, .auto-task-name, .emp-name, .umb-card-name, .bot-card-name",
    );
    if (h) {
      const t = h.textContent.trim();
      for (const [n, e] of Object.entries(lk)) {
        if (t === n || t.includes(n)) return e;
      }
    }
    return null;
  }

  const CARD_SELECTORS = [
    "[data-cc-name]",
    // Active entity cards only — dead classes (.tl-card/.tool-card/.cloud-card/.ideas-card/.arc-card/.svc-card)
    // were replaced by .mod-card in the modern bento redesign. Keep .bot-card for legacy bot drawer renders.
    ".prj-card:not([class*='prj-card-'])",
    ".bot-card:not([class*='bot-card-'])",
    ".umb-card:not([class*='umb-card-'])",
    ".emp-card:not([class*='emp-card-'])",
    ".mod-card:not([class*='mod-card-'])",
    ".svc-item",
    ".auto-task",
  ].join(", ");

  // Per-card-type title anchors — the pill is inserted INSIDE the card's
  // natural title element so it flows with the layout instead of overlaying
  // existing corner badges. Falls back to any h2/h3/h4 found in the card.
  const TITLE_ANCHORS = {
    "prj-card":   ".prj-card-name",
    "bot-card":   ".bot-card-name, .bot-card-h, h3",
    "umb-card":   ".umb-card-name",
    "emp-card":   ".emp-name, h3",
    "mod-card":   ".mod-card-title",
    "svc-item":   ".svc-name",
    "auto-task":  ".auto-task-name",
  };
  const FALLBACK_ANCHOR = "h2, h3, h4, [class*='-name'], [class*='-title']";

  function _findTitleAnchor(card) {
    for (const [cls, sel] of Object.entries(TITLE_ANCHORS)) {
      if (card.classList.contains(cls)) {
        const t = card.querySelector(sel);
        if (t) return t;
      }
    }
    return card.querySelector(FALLBACK_ANCHOR);
  }

  async function _decorateCards() {
    if (_decorating) return;
    _decorating = true;
    // Capture the page that triggered us; if user navigates during await, bail.
    const pageAtStart = typeof cur !== "undefined" ? cur : null;
    try {
      const fresh = await _loadFreshness();
      // Race guard: did user navigate away while we awaited?
      if (pageAtStart !== null && typeof cur !== "undefined" && pageAtStart !== cur) return;
      if (!fresh || !Object.keys(fresh).length) return;
      document.querySelectorAll(CARD_SELECTORS).forEach((el) => {
        // Already decorated?
        if (el.querySelector(":scope .cc-fresh-pill")) return;
        const entity = _findEntity(el);
        if (!entity || !entity.id) return;
        const data = fresh[entity.id];
        if (!data || !data._root) return;

        const anchor = _findTitleAnchor(el);
        if (!anchor) return; // no natural place to insert — skip silently

        const review = _getReview(entity.id);
        const effectiveDate = review && review > data._root ? review : data._root;
        const days = _ageDays(effectiveDate);
        const meta = _ageMeta(days);

        const pill = document.createElement("span");
        pill.className = "cc-fresh-pill " + meta.cls;
        pill.setAttribute(
          "title",
          `آخر تحديث: ${effectiveDate}${review ? " (راجعتَ يدويًّا في " + review + ")" : ""} — قبل ${days} يومًا`,
        );
        pill.setAttribute("role", "status");
        pill.innerHTML =
          `<span class="cc-fresh-dot" aria-hidden="true"></span>` +
          // Visually-hidden category for screen readers (color alone isn't accessible)
          `<span class="cc-sr-only">${meta.label} —</span>` +
          `<span class="cc-fresh-num">${days}</span>` +
          `<span class="cc-fresh-unit">ي</span>` +
          // tabindex="-1": this ✓ is a power-user convenience for mouse/touch.
          // Adding it to the tab order would create N tab-stops on dense pages.
          // Keyboard users mark-reviewed through the drawer instead.
          `<button type="button" class="cc-fresh-review" tabindex="-1" aria-label="تأكيد المراجعة" title="تأكيد المراجعة — تحديث التاريخ">✓</button>`;

        // Insert AT THE END of the title element so it flows after the name
        anchor.appendChild(pill);

        pill.addEventListener("click", (e) => {
          if (!(e.target instanceof Element) || !e.target.closest(".cc-fresh-review")) return;
          e.stopPropagation();
          e.preventDefault();
          // Guard against concurrent clicks on different pills firing
          // before _decorating is re-armed by the next decorate pass.
          if (pill.dataset.ccClicked === "1") return;
          pill.dataset.ccClicked = "1";
          _setReview(entity.id);
          // Visible confirmation — previously the pill flashed away/back
          // silently, leaving user unsure if save worked.
          if (typeof ccToast === "function") {
            ccToast(`تم تحديث "${entity.ar || entity.name || entity.id}"`, "ok");
          }
          // Pause observer so pill.remove() doesn't cascade into a redundant
          // decorate pass that the throttle would just block anyway.
          if (window.__ccFreshPause) window.__ccFreshPause();
          pill.remove();
          _decorating = false;
          _decorateCards().finally(() => {
            if (window.__ccFreshResume) window.__ccFreshResume();
          });
        });
      });
    } finally {
      _decorating = false;
    }
  }

  // Inside the drawer: add per-section bars (current_status, bot_features, …)
  async function _decorateDrawer() {
    try {
      const fresh = await _loadFreshness();
      if (!fresh) return;
      // Re-query AFTER await — drawer may have closed/reopened
      const panel = document.querySelector(".cx-panel");
      if (!panel) return;
      const name = (panel.getAttribute("data-cc-entity") || panel.querySelector("#cx-title")?.textContent || "").trim();
      if (!name) return;
      const entity =
        _buildLookup()[name] || (typeof _entityLookup === "function" ? _entityLookup(name) : null);
      if (!entity || !entity.id) return;
      const sections = fresh[entity.id];
      if (!sections) return;
      // Look for known section markers in the drawer (text headings)
      const SECTION_HINTS = {
        current_status: ["الحالة", "أين هي", "Where"],
        bot_features: ["المميزات", "الإمكانات", "Features"],
        claude_session: ["جلسة كلود", "Claude session"],
        links: ["روابط"],
        blockers: ["معوّقات", "Blockers"],
      };
      panel.querySelectorAll("h2, h3, h4").forEach((h) => {
        const txt = h.textContent.trim();
        for (const [key, hints] of Object.entries(SECTION_HINTS)) {
          if (!sections[key]) continue;
          if (h.dataset.ccFreshHooked) continue;
          const matched = hints.some((hint) => txt.includes(hint));
          if (!matched) continue;
          const review = _getReview(entity.id + "::" + key);
          const effectiveDate = review && review > sections[key] ? review : sections[key];
          const days = _ageDays(effectiveDate);
          const meta = _ageMeta(days);
          const chip = document.createElement("span");
          chip.className = "cc-fresh-chip " + meta.cls;
          chip.title = `آخر تحديث: ${effectiveDate} — قبل ${days} يومًا`;
          chip.innerHTML =
            `<span class="cc-fresh-dot"></span>` +
            `<span class="cc-fresh-num">${days}</span>` +
            `<span class="cc-fresh-unit">ي</span>`;
          h.appendChild(chip);
          h.dataset.ccFreshHooked = "1";
        }
      });
    } catch (e) {
      // Decorator failures should never crash the app
      console.warn("[CC] _decorateDrawer error:", e?.message || e);
    }
  }

  let _scheduledAt = 0;
  function _scheduleDecorate() {
    // Throttle: collapse rapid hashchange storms into one decorate pass.
    const now = Date.now();
    if (now - _scheduledAt < 250) return;
    _scheduledAt = now;
    setTimeout(_decorateCards, 80);
    setTimeout(_decorateCards, 350);
    setTimeout(_decorateDrawer, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _scheduleDecorate);
  } else {
    _scheduleDecorate();
  }
  window.addEventListener("hashchange", _scheduleDecorate);

  // Use MutationObserver instead of setInterval polling — fires only when
  // DOM actually changes (e.g., page re-render, drawer open). Much cheaper
  // than scanning every 1.5s forever.
  let _observing = false;
  let _moTargets = [];
  const _mo = new MutationObserver(() => {
    // Our own pill insertions also trigger the observer — guard against the loop.
    if (_decorating || (_scheduledAt && Date.now() - _scheduledAt < 250)) return;
    _scheduleDecorate();
  });
  function _pauseObserver() {
    if (_observing) { _mo.disconnect(); _observing = false; }
  }
  function _resumeObserver() {
    if (_observing || !_moTargets.length) return;
    _moTargets.forEach(([el, opts]) => _mo.observe(el, opts));
    _observing = true;
  }
  // Wait for #app to exist before observing
  function _startObserving() {
    const app = document.getElementById("app");
    if (!app) { setTimeout(_startObserving, 100); return; }
    _moTargets = [
      [app, { childList: true, subtree: true }],
      [document.body, { childList: true }],
    ];
    _resumeObserver();
  }
  _startObserving();
  // Expose pause/resume to decorators
  window.__ccFreshPause = _pauseObserver;
  window.__ccFreshResume = _resumeObserver;
})();
