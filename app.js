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
    .replace(/"/g, "&quot;");

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
          if (el.dataset.ccName === name || el.dataset.ccName.includes(name)) {
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
};

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
      };
    }
  } catch (_) {}
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
  if (cur !== "home") return;
  const home = document.getElementById("page-home");
  if (!home) return;
  home.innerHTML = R.home();
  _updateCountdown();
  requestAnimationFrame(_processIcons);
}

function _entityLookup(name) {
  if (!name) return null;
  return (
    PRJ.find((x) => x.name === name || x.ar === name) ||
    BOT.find((x) => x.name === name || x.ar === name) ||
    CLD.find((x) => x.nm === name) ||
    TL.find((x) => x.name === name || x.ar === name) ||
    ARC.find((x) => x.name === name || x.ar === name) ||
    IDEAS.find((x) => x.name === name) ||
    SVC.find((x) => x.name === name) ||
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
  _suppressHash = true;
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
      '<div class="sidebar-brand"><span class="brand-icon">' +
      _ic("⚡", 20) +
      '</span><span class="brand-text">مركز التحكم</span></div>' +
      '<button class="search-trigger" onclick="openSearch()" aria-label="بحث">' +
      _ic("🔍", 16) +
      "<span>بحث</span></button>" +
      '<nav class="sidebar-nav">' +
      PG.map(
        (p) =>
          `<a class="nav-item${cur === p.id ? " active" : ""}" data-page="${p.id}" onclick="go('${p.id}')">` +
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
            `<a class="bar-item${cur === p.id ? " active" : ""}" data-page="${p.id}" onclick="go('${p.id}')">` +
            `<span class="bar-icon">${p.ic}</span><span class="bar-label">${E(p.n)}</span></a>`,
        )
        .join("") +
      `<a class="bar-item" onclick="openSearch()"><span class="bar-icon">⌕</span><span class="bar-label">بحث</span></a>` +
      `<a class="bar-item" onclick="openMore()"><span class="bar-icon">⋯</span><span class="bar-label">المزيد</span></a>`;

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
      '<div class="search-overlay" onclick="closeSearch()"></div>' +
      '<div class="search-panel">' +
      '<div class="search-head">' +
      `<span class="search-icon">${_ic("🔍", 18)}</span>` +
      '<input id="search-input" class="search-input" type="text" dir="rtl" placeholder="ابحث في المشاريع، الخدمات، الأتمتة، البوتات، الأدوات، السحابة، الأرشيف..." autocomplete="off" />' +
      '<button class="search-close" onclick="closeSearch()" aria-label="إغلاق">&times;</button>' +
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
      setTimeout(() => openDetailSmart(itemName, hashParts[0]), 300);
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

function _activatePage(id, syncHash) {
  if (!_validPages.has(id)) return;
  cur = id;
  if (syncHash) _setHashSilently(id);
  document
    .querySelectorAll(".page")
    .forEach((el) => el.classList.remove("active"));
  const target = document.getElementById("page-" + id);
  if (target) {
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
    `<h2 class="sec-hero-title">${E(title)}</h2>` +
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
  const allTasks = AUTO.flatMap((g) => g.tasks);
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
      a: `openToolDetail('${E(t.name)}')`,
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
      a: `openProjectDetail('${E(p.name)}')`,
    })),
    ...BOT.filter((b) => b.st !== "a").map((b) => ({
      t: "بوت غير نشط",
      n: b.ar,
      d: b.summary || "",
      c: b.cl,
      a: `openBotDetail('${E(b.name)}')`,
    })),
    ...urgentIdeas.map((i) => ({
      t: `فكرة ${i.horizon}`,
      n: i.name,
      d: i.next_step || i.summary || "",
      c: i.cl,
      a: `openIdeaDetail('${E(i.name)}')`,
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
      action: `openProjectDetail('${E(p.name)}')`,
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
      action: `ccGoWithContext('projects',{highlight:${JSON.stringify(names)},reason:'مشاريع متأخرة في التحديث'})`,
      actionLabel: "راجع",
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
      action: `ccGoWithContext('projects',{highlight:${JSON.stringify(names)},reason:'مشاريع تحتاج تسجيل إيراد شهري'})`,
      actionLabel: "افتح",
      tone: "#10b981",
    });
  }

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
    `<div class="hqx">` +
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
    `<button class="cc-greet-action cc-clickable" onclick="openSearch()" title="بحث (Cmd+K)">🔍 بحث</button>` +
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
          `<div class="cc-pulse-card cc-clickable" onclick="ccGoWithContext('umbrellas',{highlight:[${JSON.stringify(u.name)}],reason:${JSON.stringify(u.name)}})" style="--umb:${u.cl}">` +
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
        const updatedISO = p.current_status.updated;
        return (
          `<div class="cc-feed-item cc-clickable" onclick="openProjectDetail('${E(p.name)}')">` +
          `<div class="cc-feed-dot" style="background:${p.cl}"></div>` +
          `<div class="cc-feed-body">` +
          `<div class="cc-feed-top">` +
          `<span class="cc-feed-name">${_ic(p.em, 14)} ${E(p.ar || p.name)}</span>` +
          (u
            ? `<span class="cc-feed-umb" style="background:${u.cl}18;color:${u.cl}">${E(u.name)}</span>`
            : "") +
          `</div>` +
          `<div class="cc-feed-text">${E((p.current_status.where || "").slice(0, 100))}${(p.current_status.where || "").length > 100 ? "…" : ""}</div>` +
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
          `<button class="exec-cov" onclick="ccGoWithContext('${e.page}',{reason:${JSON.stringify(e.label + ' · ' + (e.fail ? e.fail+' فشل' : e.warn ? e.warn+' تحذير' : e.manual ? e.manual+' يدوي' : 'مغطى'))}})" style="--c:${e.color}">` +
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
    `<button class="exec-section-link" onclick="go('projects')">كل المشاريع ←</button>` +
    `</div>` +
    `<div class="exec-progress-list">` +
    focus
      .map((p) => {
        const days = p.current_status?.updated
          ? Math.floor((Date.now() - new Date(p.current_status.updated).getTime()) / 86400000)
          : null;
        return (
          `<button class="exec-prog-row" onclick="openProjectDetail('${E(p.name)}')" style="--c:${p.cl}">` +
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
    `<div class="exec-acc-row"><span class="exec-acc-key">💻 محلي</span><code class="exec-acc-val">~/Desktop/Projects · ~/Documents/New project</code></div>` +
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
    `<div class="prj-hero" onclick="openProjectDetail('${E(hero.name)}')">` +
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
    `<div style="display:flex;flex-wrap:wrap;gap:4px">${heroTags.map((t) => `<span class="tag" style="background:rgba(255,255,255,.15);color:#fff">${E(t)}</span>`).join("")}</div>` +
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
                  `<div class="prj-card" data-cc-name="${E(p.name)}" onclick="openProjectDetail('${E(p.name)}')" style="--umb:${u.cl};--prj:${p.cl}">` +
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
      `<button class="emp-copy" id="${id}" onclick="teamCopy('${E(text)}','${id}')" title="${E(title)}">📋</button>`;

    return (
      `<div class="emp-card" data-cc-name="${E(m.name)}" data-employee-card data-search="${E(searchHay)}" style="--mc:${m.cl}">` +
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
                `<a class="emp-proj-tag" onclick="openProjectDetail('${E(p.name)}')" style="--pc:${p.cl}">${_ic(p.em, 11)} ${E(p.ar || p.name)}</a>`,
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
    `<input type="search" class="team-search" placeholder="🔍 ابحث: اسم، رقم، بريد، لغة، مشروع..." oninput="teamFilter(this.value)" />` +
    `<div class="team-view-switcher">` +
    `<button class="team-view-btn active" data-view="grouped" onclick="teamSwitchView('grouped')">📂 بالأقسام</button>` +
    `<button class="team-view-btn" data-view="all" onclick="teamSwitchView('all')">🔲 الكل</button>` +
    `</div>` +
    `<a href="survey.html" target="_blank" class="survey-link" title="رابط استبيان لملء بيانات موظف جديد">📋 استبيان موظف</a>` +
    `<button id="salary-toggle-btn" class="salary-toggle" onclick="teamToggleSalary()">${localStorage.getItem("cc_show_salary") === "1" ? "إخفاء الرواتب" : "إظهار الرواتب"}</button>` +
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
    `<div class="umb-project" onclick="openProjectDetail('${E(p.name)}')" style="--pc:${p.cl}">` +
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
        action: `openProjectDetail('${E(p.name)}')`,
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
      action: `openToolDetail('${E(t.name)}')`,
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
    `<button class="filter-btn active" data-filter="all" onclick="mapFilter('all')">الكل</button>` +
    `<button class="filter-btn" data-filter="github" onclick="mapFilter('github')">GitHub</button>` +
    `<button class="filter-btn" data-filter="local" onclick="mapFilter('local')">محلي</button>` +
    `<button class="filter-btn" data-filter="server" onclick="mapFilter('server')">سيرفر</button>` +
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
  const allTasks = allGroups.flatMap((g) => g.tasks);
  const totalTasks = allTasks.length;
  const onTasks = allTasks.filter((t) => t.on).length;

  const renderGroup = (g) =>
    '<div class="auto-group">' +
    `<div class="auto-group-header"><span class="auto-group-title">${E(g.group)}</span><span class="auto-group-loc">${E(g.loc)}</span></div>` +
    g.tasks
      .map(
        (t) =>
          `<div class="auto-task" id="auto-${encodeURIComponent(g.group + "-" + t.name).replace(/%/g, "")}"><span class="led ${t.on ? "led-on" : "led-off"}"></span>` +
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
          `</div>`,
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
  const gauges = [
    {
      label: "خدمات عاملة",
      val: String(SVC.filter((s) => s.st).length),
      pct: Math.round((SVC.filter((s) => s.st).length / SVC.length) * 100),
      cl: "#0EA5E9",
    },
    {
      label: "حاويات Docker",
      val: String(SVC.filter((s) => s.service_type === "container").length),
      pct: 100,
      cl: "#8B5CF6",
    },
    {
      label: "مهام cron",
      val: String(SVC.filter((s) => s.service_type === "cron").length),
      pct: 100,
      cl: "#10B981",
    },
    {
      label: "خدمات user",
      val: String(SVC.filter((s) => s.service_type === "user-service").length),
      pct: 100,
      cl: "#F59E0B",
    },
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
    '<div class="gauge-grid">' +
    gauges
      .map((g) => {
        return (
          `<div class="gauge-card">` +
          `<div class="gauge-ring gauge-ring-flat"><span class="gauge-val" style="color:${g.cl}">${E(g.val)}</span></div>` +
          `<span class="gauge-label">${E(g.label)}</span>` +
          `<span class="gauge-note">${E(g.pct)}% من الجرد المعروف</span>` +
          `</div>`
        );
      })
      .join("") +
    "</div>" +
    '<div class="svc-list">' +
    SVC.map((s) => {
      const prj = s.owner || s.prj || "";
      const info = s.info || "";
      const path = s.path || "";
      const host = s.host || "";
      const schedule = s.schedule || "";
      const runtime = s.runtime || "";
      const type = s.service_type || "";
      const pc = prj ? _prjColor(prj) : "";
      const ownerLabel = s.owner_type === "bot" ? "runtime" : "مشروع";
      return (
        `<button class="svc-item" data-cc-name="${E(s.name)}" onclick="openServiceDetail('${E(s.name)}')">` +
        `<span class="svc-status ${s.st ? "svc-on" : "svc-off"}"></span>` +
        `<span class="svc-em">${_ic(s.em, 18)}</span>` +
        `<div class="svc-info"><span class="svc-name">${E(s.name)}</span>` +
        (prj
          ? `<span class="svc-prj" style="background:${pc}15;color:${pc}">${E(ownerLabel)} · ${E(prj)}</span>`
          : "") +
        `<span class="svc-dt">${E(s.dt)}</span>` +
        (type
          ? `<span class="svc-desc">النوع: ${E(_serviceTypeLabel(type))}</span>`
          : "") +
        (runtime
          ? `<span class="svc-desc">التشغيل: ${E(runtime)}</span>`
          : "") +
        (host ? `<span class="svc-desc">المضيف: ${E(host)}</span>` : "") +
        (schedule
          ? `<span class="svc-desc">الجدولة: ${E(schedule)}</span>`
          : "") +
        (info ? `<span class="svc-desc">${E(info)}</span>` : "") +
        (path ? `<span class="svc-path">${E(path)}</span>` : "") +
        `</div>` +
        (s.port && s.port !== "—"
          ? `<span class="svc-port">:${E(s.port)}</span>`
          : "") +
        `</button>`
      );
    }).join("") +
    "</div>"
  );
};

/* ── BOTS ── */
R.bots = function () {
  const kindMap = {
    "telegram-bot": "بوت Telegram",
    "agent-runtime": "runtime",
    "assistant-channel": "قناة مساعد",
    "financial-app": "تطبيق/API",
  };
  const runtimeLead = BOT.find((b) => b.kind === "agent-runtime") || null;
  const restBots = runtimeLead
    ? BOT.filter((b) => b.name !== runtimeLead.name)
    : BOT;
  const leadStats = runtimeLead ? BSTATS[runtimeLead.name] || [] : [];
  return (
    _sectionHero({
      tone: "bots",
      kicker: "Agents + channels",
      title: "البوتات والـ runtimes",
      desc: "هذا القسم يفرق بين runtime حي متعدد الوكلاء، وبوتات Telegram عند الطلب، وقنوات المساعدة المرتبطة ببيئات التطوير.",
      stats: [
        { v: BOT.length, l: "إجمالي العناصر" },
        {
          v: BOT.filter((b) => b.kind === "agent-runtime").length,
          l: "runtimes",
        },
        {
          v: BOT.filter((b) => b.kind === "telegram-bot").length,
          l: "Telegram bots",
        },
        { v: BOT.filter((b) => b.st === "a").length, l: "نشطة" },
      ],
    }) +
    (runtimeLead
      ? `<div class="bot-runtime-hero" data-cc-name="${E(runtimeLead.name)}" onclick="openBotDetail('${E(runtimeLead.name)}')">` +
        `<div class="bot-runtime-mark" style="background:${runtimeLead.cl}">${_ic(runtimeLead.em, 34)}</div>` +
        `<div class="bot-runtime-copy">` +
        `<span class="bot-runtime-kicker">runtime الرئيسي</span>` +
        `<h3>${E(runtimeLead.ar || runtimeLead.name)}</h3>` +
        `<p>${E(runtimeLead.summary || (runtimeLead.desc || "").split("\n")[0])}</p>` +
        `<div class="bot-runtime-meta">` +
        `<span>${E(_botKindLabel(runtimeLead.kind))}</span>` +
        (runtimeLead.host ? `<span>${E(runtimeLead.host)}</span>` : "") +
        (runtimeLead.runtime ? `<span>${E(runtimeLead.runtime)}</span>` : "") +
        (runtimeLead.related_project
          ? `<span>${E(runtimeLead.related_project)}</span>`
          : "") +
        `</div>` +
        `</div>` +
        (leadStats.length
          ? `<div class="bot-runtime-stats">` +
            leadStats
              .map(
                (s) =>
                  `<div class="bot-runtime-stat"><strong>${E(s.v)}</strong><span>${E(s.l)}</span></div>`,
              )
              .join("") +
            `</div>`
          : "") +
        `</div>`
      : "") +
    (restBots.length
      ? `<div class="bot-subhead"><strong>القنوات والبوتات التابعة</strong><span>العناصر المرتبطة بالوصول والمساعدات والأتمتة</span></div>`
      : "") +
    '<div class="bot-list">' +
    restBots
      .map((b) => {
        const stats = BSTATS[b.name] || [];
        const tags = (b.tags || []).slice(0, 4);
        const firstLine = b.summary || (b.desc || "").split("\n")[0] || "";
        const isActive = b.st === "a";
        return (
          `<div class="bot-card-h glass" data-cc-name="${E(b.name)}" onclick="openBotDetail('${E(b.name)}')">` +
          `<div class="bot-h-icon" style="background:linear-gradient(135deg,${b.cl}22,${b.cl}08);border-left:4px solid ${b.cl}">` +
          `<span class="bot-emoji">${_ic(b.em, 36)}</span>` +
          `<span class="bot-pulse ${isActive ? "pulse-on" : "pulse-off"}"></span>` +
          `</div>` +
          `<div class="bot-h-body">` +
          `<div class="bot-h-top">` +
          `<h3 class="bot-name">${E(b.ar || b.name)}</h3>` +
          (isActive
            ? `<span class="bot-h-status bot-h-active"><span class="led led-on" style="width:6px;height:6px;display:inline-block;margin-left:4px"></span> نشط</span>`
            : `<span class="bot-h-status bot-h-paused"><span class="led led-off" style="width:6px;height:6px;display:inline-block;margin-left:4px"></span> متوقف</span>`) +
          `</div>` +
          `<p class="bot-h-desc">${E(firstLine)}</p>` +
          `<div class="bot-tags">` +
          (b.kind
            ? `<span class="tag" style="background:${b.cl}12;color:${b.cl}">${E(kindMap[b.kind] || b.kind)}</span>`
            : "") +
          (b.host ? `<span class="tag">المضيف: ${E(b.host)}</span>` : "") +
          `</div>` +
          (stats.length
            ? `<div class="bot-h-stats-grid">${stats
                .map(
                  (s) =>
                    `<div class="bot-h-stat-chip"><span class="bot-h-stat-val" style="color:${b.cl}">${E(s.v)}</span><span class="bot-h-stat-label">${E(s.l)}</span></div>`,
                )
                .join("")}</div>`
            : "") +
          `<div class="bot-tags">${tags.map((t) => `<span class="tag">${E(t)}</span>`).join("")}</div>` +
          `</div>` +
          `</div>`
        );
      })
      .join("") +
    "</div>"
  );
};

/* ── TOOLS ── */
R.tools = function () {
  const hero = TL[0];
  const emojiMap = {
    "Codex CLI": "🧭",
    "Claude Code": "⚡",
    "Meta MCP": "📢",
    GitHub: "🐙",
    Tailscale: "🔒",
    Notion: "📝",
    Perplexity: "🔍",
    Filesystem: "📁",
    Memory: "🧠",
    "Sequential Thinking": "💡",
    Firecrawl: "🕷️",
    Magic: "🎨",
    Supabase: "⚡",
    Vercel: "▲",
    Railway: "🚂",
    TestSprite: "🔧",
  };
  const cliItems = TL.filter((t) => t.category === "developer-env");
  const byCategory = (c) => TL.filter((t) => t.category === c).length;
  const dials = [
    { v: String(byCategory("mcp")), l: "MCP", cl: "var(--purple)" },
    { v: String(byCategory("platform")), l: "منصات", cl: "var(--blue)" },
    { v: String(byCategory("internal-tool")), l: "داخلية", cl: "var(--green)" },
    {
      v: String(TL.filter((t) => t.st === "a").length),
      l: "نشطة",
      cl: "var(--amber)",
    },
  ];
  const dialCirc = 2 * Math.PI * 24;
  const dialMaxes = [
    Math.max(1, TL.length),
    Math.max(1, TL.length),
    Math.max(1, TL.length),
    Math.max(1, TL.length),
  ];
  const groups = [
    "developer-env",
    "internal-tool",
    "platform",
    "infra-access",
    "mcp",
  ];
  const categoryCards = groups
    .map((cat) => ({
      cat,
      label: _toolCategoryLabel(cat),
      count: TL.filter((t) => t.category === cat).length,
      active: TL.filter((t) => t.category === cat && t.st === "a").length,
    }))
    .filter((x) => x.count);

  return (
    _sectionHero({
      tone: "tools",
      kicker: "AI CLI + MCP + workbench",
      title: "أدوات التطوير وبيئات AI CLI",
      desc: "جرد أدوات العمل نفسه: البيئات التي نستخدمها، الخوادم المتصلة، وأين يتم تعديل إعداد كل أداة أو نظام مساعد.",
      stats: [
        { v: cliItems.length, l: "AI CLI" },
        { v: byCategory("mcp"), l: "MCP" },
        { v: byCategory("internal-tool"), l: "أدوات داخلية" },
        { v: TL.length, l: "إجمالي الأدوات" },
      ],
    }) +
    `<div class="tool-note">هذه الصفحة توثق أدوات العمل نفسها، وخصوصًا بيئات AI CLI: أين يوجد إعداد كل أداة، ما التخصيصات المضافة، وما المشاريع التي تُستخدم فيها.</div>` +
    `<div class="tool-cli-grid">` +
    cliItems
      .map(
        (t) =>
          `<button class="tool-cli-card" data-cc-name="${E(t.name)}" style="--tc:${t.cl}" onclick="openToolDetail('${E(t.name)}')"><strong>${E(t.ar || t.name)}</strong><p>${E(t.summary || "")}</p><span>${E((t.capabilities || []).slice(0, 3).join(" · "))}</span></button>`,
      )
      .join("") +
    `</div>` +
    `<div class="tool-hero glass" data-cc-name="${E(hero.name)}" style="border-left:4px solid ${hero.cl}" onclick="openToolDetail('${E(hero.name)}')">` +
    `<div class="tool-hero-info"><h3 class="tool-hero-name">${E(hero.ar || hero.name)}</h3>` +
    `<p class="tool-hero-desc">${E(hero.summary || "بيئة العمل الأساسية الحالية")}</p></div>` +
    '<div class="tool-dials">' +
    dials
      .map((d, i) => {
        const pct = parseInt(d.v) / dialMaxes[i];
        const dash = pct * dialCirc;
        return (
          `<div class="dial">` +
          `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" class="dial-bg"/>` +
          `<circle cx="30" cy="30" r="24" class="dial-fg" style="stroke:${d.cl};stroke-dasharray:${dash.toFixed(1)} ${dialCirc.toFixed(1)}"/>` +
          `</svg><span class="dial-val">${E(d.v)}</span><span class="dial-label">${E(d.l)}</span></div>`
        );
      })
      .join("") +
    "</div>" +
    "</div>" +
    `<div class="tool-category-strip">` +
    categoryCards
      .map(
        (c) =>
          `<div class="tool-category-card"><strong>${c.count}</strong><span>${E(c.label)}</span><small>${c.active}/${c.count} نشط</small></div>`,
      )
      .join("") +
    `</div>` +
    groups
      .map((cat) => {
        const items = TL.filter((t) => t.category === cat);
        if (!items.length) return "";
        const activeCount = items.filter((t) => t.st === "a").length;
        return (
          `<div class="tool-section">` +
          `<div class="tool-section-head"><div><h3>${E(_toolCategoryLabel(cat))}</h3><p>${activeCount}/${items.length} نشط · ${E(_toolCategoryLabel(cat))}</p></div><span>${items.length}</span></div>` +
          `<div class="tool-grid">` +
          items
            .map((t) => {
              const em = emojiMap[t.name] || t.em || "🔧";
              const usedInArr = (t.used_in || []).slice(0, 3);
              return (
                `<div class="tool-card glass" data-cc-name="${E(t.name)}" style="border-top:3px solid ${t.cl}" onclick="openToolDetail('${E(t.name)}')">` +
                `<div class="tool-card-head">` +
                `<span style="font-size:1.5rem">${_ic(em, 24)}</span>` +
                (t.st === "a"
                  ? `<span class="cc-pulse-dot" title="نشط"></span>`
                  : `<span class="cc-pulse-dot" style="background:#94a3b8" title="غير نشط"></span>`) +
                `</div>` +
                `<h4 class="tool-card-name">${E(t.ar || t.name)}</h4>` +
                `<p class="tool-card-desc">${E(t.summary || (t.desc || "").split("\n")[0])}</p>` +
                `<div class="tool-card-tags">${E(_toolCategoryLabel(t.category))}</div>` +
                (usedInArr.length
                  ? `<div class="tool-card-usage-row">` +
                    `<span class="tool-card-usage-label">يُستخدم في:</span>` +
                    usedInArr
                      .map((projName) => {
                        const isProj = PRJ.find((p) => p.name === projName);
                        if (isProj) {
                          return `<button class="tool-usage-chip" onclick="event.stopPropagation();openProjectDetail('${E(projName)}')" title="افتح ${E(projName)}">${_ic(isProj.em, 11)} ${E(isProj.ar || projName)}</button>`;
                        }
                        return `<span class="tool-usage-chip">${E(projName)}</span>`;
                      })
                      .join("") +
                    `</div>`
                  : "") +
                `</div>`
              );
            })
            .join("") +
          "</div>" +
          `</div>`
        );
      })
      .join("")
  );
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

  return (
    _sectionHero({
      tone: "cloud",
      kicker: "Platforms + APIs + network",
      title: "السطح السحابي والخدمات الخارجية",
      desc: "بدل خلط كل المنصات معًا، يعرض هذا القسم دور كل خدمة: منصة، نشر، API، شبكة، تخزين، أو طبقة متصلة عبر MCP.",
      stats: [
        { v: CLD.length, l: "إجمالي العناصر" },
        { v: activeCount, l: "نشط في الكتالوج" },
        { v: groups.length, l: "فئات تشغيل" },
        { v: mcpLinkedCount, l: "مرتبط عبر MCP" },
      ],
    }) +
    `<div class="cloud-overview">` +
    `<div class="cloud-overview-stat"><strong>${activeCount}</strong><span>نشط حاليًا</span></div>` +
    `<div class="cloud-overview-stat"><strong>${deploymentCount}</strong><span>نشر واستضافة</span></div>` +
    `<div class="cloud-overview-stat"><strong>${mcpLinkedCount}</strong><span>مرتبط عبر MCP</span></div>` +
    `<div class="cloud-overview-stat"><strong>${groups.length}</strong><span>فئات تشغيل</span></div>` +
    `</div>` +
    `<div class="cloud-surface">` +
    surfaceCards
      .map(
        (card) =>
          `<div class="cloud-surface-card"><strong>${card.count}</strong><span>${E(card.label)}</span><p>${E(card.desc)}</p></div>`,
      )
      .join("") +
    `</div>` +
    `<div class="cloud-note">هذه الصفحة لا تخلط بين المنصة نفسها وبين نوع دورها. ستجد الفرق بين منصة، نشر، API، شبكة، وتخزين بشكل صريح داخل كل بطاقة.</div>` +
    groups
      .map((group) => {
        return (
          `<div class="cloud-category">` +
          `<div class="cloud-cat-head"><h3 class="cloud-cat-title">${E(categoryLabels[group.cat] || group.cat)}</h3><span>${group.items.length}</span></div>` +
          `<div class="cloud-cat-grid">` +
          group.items
            .map((c) => {
              const clickAttr = `data-cc-name="${E(c.nm)}" onclick="openCloudDetail('${E(c.nm)}')"`;
              const cPrj = c.prj || "";
              const cpc = cPrj ? _entityColor(cPrj, "#0EA5E9") : "";
              const status = c.active === false ? "متوقف" : "نشط";
              const usedCount = (c.used_in || []).length;
              return (
                `<div class="cloud-card clickable ${c.active === false ? "cloud-card-off" : ""}" ${clickAttr}>` +
                `<span class="cloud-card-icon">${_ic(c.em, 22)}</span>` +
                `<div class="cloud-card-info">` +
                `<div class="cloud-card-top"><span class="cloud-card-name">${E(c.nm)}</span><span class="cloud-card-status ${c.active === false ? "cloud-card-status-off" : "cloud-card-status-on"}">${E(status)}</span></div>` +
                `<div class="cloud-card-tags">` +
                `<span class="cloud-prj-tag">${E(categoryLabels[c.category] || c.category)}</span>` +
                (cPrj
                  ? `<span class="cloud-prj-tag" style="background:${cpc}15;color:${cpc}">${E(cPrj)}</span>`
                  : "") +
                (usedCount
                  ? `<span class="cloud-prj-tag">يخدم ${usedCount}</span>`
                  : "") +
                `</div>` +
                `<span class="cloud-card-dt">${E(c.dt)}</span>` +
                ((c.related_entities || c.used_in)?.length
                  ? `<div class="cloud-card-related">` +
                    (c.related_entities || c.used_in)
                      .slice(0, 3)
                      .map((rel) => {
                        const rp = PRJ.find((p) => p.name === rel);
                        if (rp) {
                          return `<button class="cloud-rel-chip" onclick="event.stopPropagation();openProjectDetail('${E(rel)}')" title="${E(rel)}">${_ic(rp.em, 10)} ${E(rp.ar || rel)}</button>`;
                        }
                        return `<span class="cloud-rel-chip">${E(rel)}</span>`;
                      })
                      .join("") +
                    `</div>`
                  : "") +
                `</div>` +
                `</div>`
              );
            })
            .join("") +
          `</div></div>`
        );
      })
      .join("")
  );
};

/* ── IDEAS ── */
R.ideas = function () {
  const prLabels = { 1: "عاجل", 2: "قريب", 3: "يوماً ما" };
  const prColors = { 1: "#EF4444", 2: "#F59E0B", 3: "#6366F1" };
  const rotations = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 2.5];
  const lanes = [1, 2, 3].map((pr) => ({
    pr,
    label: prLabels[pr],
    items: IDEAS.filter((i) => i.pr === pr),
  }));

  return (
    _sectionHero({
      tone: "ideas",
      kicker: "Strategy board",
      title: "الأفكار وخارطة الطريق",
      desc: "الأفكار هنا ليست زينة. كل بطاقة يجب أن توضّح الأولوية، النطاق، الخطوة التالية، وما المشاريع التي ستتأثر بها إن نُفذت.",
      stats: [
        { v: IDEAS.length, l: "إجمالي الأفكار" },
        { v: IDEAS.filter((i) => i.pr === 1).length, l: "عاجل" },
        { v: IDEAS.filter((i) => i.pr === 2).length, l: "قريب" },
        { v: IDEAS.filter((i) => i.pr === 3).length, l: "يوماً ما" },
      ],
    }) +
    '<div class="idea-filters">' +
    `<button class="filter-btn active" data-priority="all" onclick="filterIdeas('all')">الكل</button>` +
    `<button class="filter-btn" data-priority="1" onclick="filterIdeas(1)"><span class="pr-dot" style="background:#EF4444"></span> عاجل</button>` +
    `<button class="filter-btn" data-priority="2" onclick="filterIdeas(2)"><span class="pr-dot" style="background:#F59E0B"></span> قريب</button>` +
    `<button class="filter-btn" data-priority="3" onclick="filterIdeas(3)"><span class="pr-dot" style="background:#6366F1"></span> يوماً ما</button>` +
    "</div>" +
    '<div class="ideas-board" id="ideas-grid">' +
    lanes
      .map(
        (lane, laneIndex) =>
          `<section class="idea-lane" data-pr="${lane.pr}">` +
          `<div class="idea-lane-head"><strong>${E(lane.label)}</strong><span>${lane.items.length}</span></div>` +
          `<div class="ideas-grid">` +
          lane.items
            .map((idea, i) => {
              const rot = rotations[i % rotations.length];
              const rels = _relChips((idea.related_projects || []).slice(0, 3));
              const bullets = (idea.desc || "")
                .split("\n")
                .filter((l) => /^[🎯🔧📊🔔📈💹🌍🔄🔗]/.test(l.trim()))
                .slice(0, 5);
              const allLines = [
                idea.summary ? `الملخص: ${idea.summary}` : "",
                idea.owner_scope ? `النطاق: ${idea.owner_scope}` : "",
                idea.next_step ? `الخطوة التالية: ${idea.next_step}` : "",
              ].filter(Boolean);
              return (
                `<div class="sticky-note" data-cc-name="${E(idea.name)}" data-pr="${idea.pr}" style="border-right:4px solid ${prColors[idea.pr] || "#999"};transform:rotate(${rot}deg)" onclick="openIdeaDetail('${E(idea.name)}')">` +
                `<span class="sticky-badge" style="background:${prColors[idea.pr] || "#999"}">${E(prLabels[idea.pr] || "")}</span>` +
                `<span class="sticky-emoji">${_ic(idea.em, 42)}</span>` +
                `<h4 class="sticky-title">${E(idea.name)}</h4>` +
                `<p class="sticky-desc">${E(idea.summary || (idea.desc || "").split("\n")[0])}</p>` +
                (allLines.length
                  ? `<div class="idea-details">${allLines.map((l) => `<div class="idea-detail-line">${_icText(l.trim())}</div>`).join("")}</div>`
                  : "") +
                (bullets.length
                  ? `<div class="idea-bullets">${bullets.map((b) => `<div class="idea-bullet">${_icText(b.trim())}</div>`).join("")}</div>`
                  : "") +
                (rels
                  ? `<div class="idea-rels"><span class="idea-rels-label">يتكامل مع</span>${rels}</div>`
                  : "") +
                `</div>`
              );
            })
            .join("") +
          (laneIndex === 2
            ? `<div class="sticky-note sticky-placeholder" data-pr="3" style="border-right:4px dashed var(--brd);transform:rotate(0deg);cursor:default;opacity:.6">` +
              `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px">` +
              `<span style="font-size:32px;opacity:.3">+</span>` +
              `<span style="font-size:12px;color:var(--t3)">فكرة جديدة</span>` +
              `</div>` +
              `</div>`
            : "") +
          `</div>` +
          `</section>`,
      )
      .join("") +
    "</div>"
  );
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
      `<div class="book-card ${activeRef ? "book-card-active-ref" : ""}" data-cc-name="${E(a.name)}" onclick="openArchiveDetail('${E(a.name)}')">` +
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
    `<div class="archive-shelf">` +
    archived.map((a) => renderCard(a, false)).join("") +
    `</div>` +
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
          ? `<button class="prj-ctx-chip" onclick="ccGoWithContext('umbrellas',{highlight:[${JSON.stringify(umb.name)}],reason:'مظلة ${E(umb.name)}'})" style="--c:${umb.cl}">${_ic(umb.em, 12)} ${E(umb.name)}</button>`
          : "") +
        (dept
          ? `<button class="prj-ctx-chip" onclick="ccGoWithContext('umbrellas',{highlight:[${JSON.stringify(umb ? umb.name : '')}],reason:'قسم ${E(dept.name)} داخل ${E(umb ? umb.name : '')}'})" style="--c:${dept.cl}">${_ic(dept.em, 12)} ${E(dept.name)}</button>`
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
              `<button class="prj-team-chip" onclick="ccGoWithContext('team',{highlight:[${JSON.stringify(m.name)}],reason:'موظف مسؤول عن ${E(item.ar || item.name)}'})" style="--c:${m.cl}">` +
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
        return (
          `<a class="prj-quick-link" href="${E(v)}" target="_blank" rel="noopener">` +
          `<div class="pql-row">` +
          `<span class="pql-icon">${_ic(ico, 16)}</span>` +
          `<span class="pql-name">${E(k)}</span>` +
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
  const stCls =
    item.st === "a"
      ? "status-active"
      : item.st === "p"
        ? "status-paused"
        : "status-archive";
  const factRows = [
    { l: "النوع", v: _projectKindLabel(item.kind) || item.kind || "—" },
    { l: "الحالة", v: stLabel },
    { l: "التقدم", v: item.pct != null ? `${item.pct}%` : "—" },
    { l: "الأنظمة الفرعية", v: String(item.subsystems?.length || 0) },
    { l: "التقنيات", v: String(item.stack?.length || tags.length || 0) },
    { l: "الروابط", v: String(Object.keys(links).length) },
  ];

  document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));

  const el = document.createElement("section");
  el.id = "detail-view";
  el.className = "prj-detail prj-detail--project";
  el.innerHTML =
    `<button class="prj-detail-back" onclick="closeDetail()">← رجوع للمشاريع</button>` +
    `<div class="prj-detail-banner" style="background:linear-gradient(135deg,${cl},${cl}88)">` +
    `<span style="font-size:60px">${_ic(item.em, 60)}</span>` +
    `<h1 style="font-size:28px;font-weight:800;margin-top:10px">${E(item.ar || item.name)}</h1>` +
    `<span class="${stCls}" style="margin-top:8px">${E(stLabel)}</span>` +
    `</div>` +
    `<div class="prj-detail-summary" style="margin-top:14px;padding:14px 18px;border-radius:14px;background:linear-gradient(135deg,${cl}10,${cl}05);border:1px solid ${cl}20;color:var(--t1)">` +
    `<div style="font-size:13px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px">${_ic("🧭", 14)} الملخص التنفيذي</div>` +
    `<div style="font-size:13px;line-height:1.8;color:var(--t2)">${E(item.summary || headline || "")}</div>` +
    `</div>` +
    `<div class="prj-fact-strip">` +
    factRows
      .map(
        (f) =>
          `<div class="prj-fact"><span class="prj-fact-label">${E(f.l)}</span><strong class="prj-fact-val">${E(f.v)}</strong></div>`,
      )
      .join("") +
    `</div>` +
    _entityTrustBox(item, "project") +
    _currentStatusCard(item) +
    _claudeSessionCard(item) +
    `<div class="prj-detail-grid">` +
    sections
      .map((s) => {
        const title = s.title || "";
        const firstChar = title ? [...title][0] : "";
        const sectionTints = {
          "📐": "blue",
          "🔧": "purple",
          "📊": "green",
          "🔄": "amber",
          "🚀": "cyan",
          "💾": "cyan",
          "📱": "purple",
          "📦": "green",
          "📸": "purple",
          "🎯": "amber",
          "💹": "green",
          "⚙️": "purple",
          "🔐": "rose",
          "🛡️": "rose",
          "🤖": "purple",
          "👥": "blue",
          "🛠️": "purple",
          "📈": "green",
          "🌍": "blue",
          "🔗": "cyan",
          "📍": "amber",
          "⏰": "amber",
          "💰": "green",
          "🌐": "blue",
          "🔔": "amber",
          "📂": "amber",
          "🎨": "purple",
          "📌": "amber",
          "🎮": "purple",
          "💱": "green",
          "🧠": "purple",
          "👤": "blue",
          "📡": "cyan",
          "🐳": "cyan",
        };
        const tint = sectionTints[firstChar] || "";
        const tintClass = tint ? " prj-info-card--" + tint : "";
        return (
          `<div class="prj-info-card${tintClass}">` +
          (title ? `<h3 class="prj-info-title">${E(title)}</h3>` : "") +
          s.rows
            .map((r) => `<div class="prj-info-row">${E(r)}</div>`)
            .join("") +
          `</div>`
        );
      })
      .join("") +
    (!item.stack?.length && tags.length
      ? `<div class="prj-info-card"><h3 class="prj-info-title">${_ic("🏷️", 14)} الوسوم</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${tags.map((t) => `<span class="tag" style="background:${cl}12;color:${cl};padding:4px 12px;font-size:10px">${E(t)}</span>`).join("")}</div></div>`
      : "") +
    (!item.local_path && !item.server_path && item.path
      ? `<div class="prj-info-card"><h3 class="prj-info-title">${_ic("📁", 14)} المسار</h3><code style="font-size:12px;color:var(--t2);direction:ltr;display:block;word-break:break-all">${E(item.path)}</code></div>`
      : "") +
    _quickLinksCard(item, cl) +
    `</div>`;
  document.getElementById("app").appendChild(el);
  _setHashSilently(cur + "/" + encodeURIComponent(name));
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    el.classList.add("open");
    _processIcons();
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
  const meta = [
    item.kind ? `النوع: ${kindLabel}` : "",
    item.host ? `المضيف: ${item.host}` : "",
    item.runtime ? `التشغيل: ${item.runtime}` : "",
    item.channel ? `القناة: ${item.channel}` : "",
    item.related_entities?.length
      ? `يرتبط بـ: ${item.related_entities.join(" · ")}`
      : "",
  ].filter(Boolean);
  const related = _relChips(item.related_entities || []);

  if (item.kind !== "agent-runtime") {
    const el = document.createElement("div");
    el.id = "detail-view";
    el.className = "detail-split detail-split--bot";
    el.innerHTML =
      `<div class="dsp-overlay" onclick="closeDetail()"></div>` +
      `<div class="dsp-panel">` +
      `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">` +
      `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>` +
      `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em, 48)}</span>` +
      `<h2 style="font-size:18px;font-weight:700">${E(item.ar || item.name)}</h2>` +
      `<p style="font-size:12px;line-height:1.8;opacity:.88;margin:10px 0 0">${E(kindLabel)}</p>` +
      `</div>` +
      `<div class="dsp-content">` +
      (item.summary || headline
        ? `<p style="font-size:13px;color:var(--t2);margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px;border-right:3px solid ${cl};line-height:1.8">${E(item.summary || headline)}</p>`
        : "") +
      (meta.length
        ? `<div class="detail-meta-box">${meta.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
        : "") +
      _entityTrustBox(item, "bot") +
      (related
        ? `<div style="margin:16px 0"><div class="detail-meta-box"><div class="detail-meta-line">الكيانات المرتبطة</div><div class="meta-chip-row">${related}</div></div></div>`
        : "") +
      (stats.length
        ? `<div class="entity-stats">${stats.map((s) => `<div class="entity-stat"><span class="entity-stat-val" style="color:${cl}">${E(s.v)}</span><span class="entity-stat-label">${E(s.l)}</span></div>`).join("")}</div>`
        : "") +
      _sectionsHTML(sections) +
      (item.path ? _pathHTML(item.path) : "") +
      _linksHTML(item.links, cl) +
      `</div>` +
      `</div>`;
    document.body.appendChild(el);
    _setHashSilently(cur + "/" + encodeURIComponent(name));
    requestAnimationFrame(() => {
      el.classList.add("open");
      _processIcons();
    });
    return;
  }

  const el = document.createElement("div");
  el.id = "detail-view";
  el.className = "detail-terminal";
  el.innerHTML =
    `<div class="dt-overlay" onclick="closeDetail()"></div>` +
    `<div class="dt-panel">` +
    `<div class="dt-titlebar">` +
    `<div class="dt-dots"><span style="background:#FF5F57"></span><span style="background:#FFBD2E"></span><span style="background:#28C840"></span></div>` +
    `<span class="dt-titlebar-text">${E(item.ar || item.name)} — ${isActive ? "نشط" : "متوقف"}</span>` +
    `<button class="dt-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>` +
    `</div>` +
    `<div class="dt-body">` +
    `<div class="dt-prompt">الملف التشغيلي</div>` +
    `<div class="dt-output">` +
    `<div class="dt-line"><span class="dt-key">الاسم</span> ${E(item.ar || item.name)} ${_ic(item.em, 16)}</div>` +
    `<div class="dt-line"><span class="dt-key">الحالة</span> <span style="color:${isActive ? "#28C840" : "#FF5F57"}">${isActive ? "■ نشط" : "□ متوقف"}</span></div>` +
    (item.summary || headline
      ? `<div class="dt-line"><span class="dt-key">الوصف</span> ${E(item.summary || headline)}</div>`
      : "") +
    meta.map((m) => `<div class="dt-line">${E(m)}</div>`).join("") +
    `</div>` +
    _entityTrustBox(item, "bot") +
    (related
      ? `<div class="detail-meta-box dt-meta-box"><div class="detail-meta-line">الكيانات المرتبطة</div><div class="meta-chip-row">${related}</div></div>`
      : "") +
    (stats.length
      ? `<div class="dt-prompt">المقاييس</div><div class="dt-stats">${stats.map((s) => `<div class="dt-stat"><span class="dt-stat-val" style="color:${cl}">${E(s.v)}</span><span class="dt-stat-label">${E(s.l)}</span></div>`).join("")}</div>`
      : "") +
    (function () {
      const catMap = {
        "🔧": "tech",
        "📊": "stats",
        "🔐": "security",
        "🛡️": "security",
        "⏰": "schedule",
        "🤖": "tech",
        "👥": "tech",
        "🛠️": "tech",
        "🔗": "links",
        "🚀": "deploy",
        "💾": "deploy",
        "📱": "tech",
        "📸": "tech",
        "🧠": "tech",
        "💹": "stats",
        "📈": "stats",
        "🔔": "schedule",
      };
      const catLabels = {
        tech: "البنية والقدرات",
        stats: "المؤشرات",
        security: "الأمان",
        schedule: "الجدولة",
        links: "الروابط",
        deploy: "النشر والتشغيل",
      };
      const catColors = {
        tech: "#79c0ff",
        stats: "#7ee787",
        security: "#f97583",
        schedule: "#d2a8ff",
        links: "#79c0ff",
        deploy: "#56d4dd",
      };
      const grouped = {};
      sections.forEach((s) => {
        const firstChar = s.title ? [...s.title][0] : "";
        const cat = catMap[firstChar] || "tech";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
      });
      return Object.keys(grouped)
        .map(
          (cat) =>
            `<div class="dt-prompt" style="color:${catColors[cat] || "#7ee787"}">${catLabels[cat] || "تفاصيل"}</div>` +
            `<div class="dt-output">` +
            grouped[cat]
              .map(
                (s) =>
                  (s.title
                    ? `<div class="dt-section-title">${E(s.title)}</div>`
                    : "") +
                  s.rows
                    .map((r) => `<div class="dt-line">${E(r)}</div>`)
                    .join(""),
              )
              .join("") +
            `</div>`,
        )
        .join("");
    })() +
    (tags.length
      ? `<div class="dt-prompt">الوسوم</div><div class="dt-tags">${tags.map((t) => `<span class="dt-tag">${E(t)}</span>`).join("")}</div>`
      : "") +
    (item.path
      ? `<div class="dt-prompt">المسار</div><div class="dt-line" style="direction:ltr">${E(item.path)}</div>`
      : "") +
    _linksHTML(item.links, cl) +
    `</div>` +
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur + "/" + encodeURIComponent(name));
  requestAnimationFrame(() => {
    el.classList.add("open");
    _processIcons();
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
  const metaRows = [
    item.type ? `النوع: ${item.type}` : "",
    item.category
      ? `الفئة: ${categoryMap[item.category] || item.category}`
      : "",
  ].filter(Boolean);
  const rels = _relChips(item.used_in || []);
  const pathRows = [item.path].filter(Boolean);
  const factRows = item.facts || [];
  const customRows = item.customizations || [];
  const configPaths = item.config_paths || [];
  const structureRows = item.structure || [];
  const capabilityRows = item.capabilities || [];
  const editRows = item.edit_points || [];

  const el = document.createElement("div");
  el.id = "detail-view";
  el.className = "detail-split detail-split--tool";
  el.innerHTML =
    `<div class="dsp-overlay" onclick="closeDetail()"></div>` +
    `<div class="dsp-panel">` +
    `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">` +
    `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>` +
    `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em, 48)}</span>` +
    `<h2 style="font-size:18px;font-weight:700">${E(item.ar || item.name)}</h2>` +
    (tags.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:14px;justify-content:center">${tags.map((t) => `<span style="font-size:8px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,.15);color:#fff">${E(t)}</span>`).join("")}</div>`
      : "") +
    `</div>` +
    `<div class="dsp-content">` +
    (item.summary || headline
      ? `<p style="font-size:13px;color:var(--t2);margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px;border-right:3px solid ${cl};line-height:1.7">${E(item.summary || headline)}</p>`
      : "") +
    (metaRows.length
      ? `<div class="detail-meta-box detail-meta-box--intro">${metaRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (rels
      ? `<div style="margin-bottom:16px"><div class="detail-meta-box"><div class="detail-meta-line">يُستخدم هنا</div><div class="meta-chip-row">${rels}</div></div></div>`
      : "") +
    _entityTrustBox(item, "tool") +
    `<div class="tool-detail-grid">` +
    (factRows.length
      ? `<div class="detail-meta-box detail-meta-box--strong"><div class="detail-meta-title">الإعداد الحالي</div>${factRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (capabilityRows.length
      ? `<div class="detail-meta-box"><div class="detail-meta-title">قدرات متصلة</div>${capabilityRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (customRows.length
      ? `<div class="detail-meta-box"><div class="detail-meta-title">ما أُضيف أو خُصص</div>${customRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (structureRows.length
      ? `<div class="detail-meta-box"><div class="detail-meta-title">البنية الداخلية</div>${structureRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (editRows.length
      ? `<div class="detail-meta-box"><div class="detail-meta-title">إذا أردت تعديلها</div>${editRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (configPaths.length
      ? `<div class="detail-meta-box detail-meta-box--wide"><div class="detail-meta-title">ملفات الإعداد</div>${configPaths.map((r) => `<div class="detail-meta-line detail-meta-path">${E(r)}</div>`).join("")}</div>`
      : "") +
    `</div>` +
    _sectionsHTML(sections) +
    (pathRows.length ? _pathHTML(pathRows[0]) : "") +
    _linksHTML(item.links, cl) +
    `</div>` +
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur + "/" + encodeURIComponent(name));
  requestAnimationFrame(() => {
    el.classList.add("open");
    _processIcons();
  });
}

function openServiceDetail(name) {
  const item = SVC.find((s) => s.name === name);
  if (!item) return;
  closeDetail();
  const owner = item.owner || item.prj || "";
  const cl = _prjColor(owner || item.name) || "#0EA5E9";
  const rels = _relChips(owner ? [owner] : []);
  const metaRows = [
    item.service_type ? `النوع: ${_serviceTypeLabel(item.service_type)}` : "",
    item.st ? "حالة الكتالوج: نشط" : "حالة الكتالوج: متوقف",
  ].filter(Boolean);
  const bodyRows = [item.info ? item.info : ""].filter(Boolean);
  const runtimeRows = [
    item.dt ? item.dt : "",
    item.runtime ? `التشغيل: ${item.runtime}` : "",
    item.schedule ? `الجدولة: ${item.schedule}` : "",
    item.port && item.port !== "—" ? `المنفذ: ${item.port}` : "",
  ].filter(Boolean);
  const accessRows = [
    item.path ? `المسار: ${item.path}` : "",
    owner
      ? `${item.owner_type === "bot" ? "المالك runtime" : "يتبع"}: ${owner}`
      : "",
  ].filter(Boolean);

  const el = document.createElement("div");
  el.id = "detail-view";
  el.className = "detail-split detail-split--service";
  el.innerHTML =
    `<div class="dsp-overlay" onclick="closeDetail()"></div>` +
    `<div class="dsp-panel">` +
    `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">` +
    `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>` +
    `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em, 48)}</span>` +
    `<h2 style="font-size:18px;font-weight:700">${E(item.name)}</h2>` +
    `<p style="font-size:11px;line-height:1.8;opacity:.88;margin:10px 0 0">${E(_serviceTypeLabel(item.service_type))}</p>` +
    `</div>` +
    `<div class="dsp-content">` +
    (metaRows.length
      ? `<div class="detail-meta-box detail-meta-box--intro">${metaRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (rels
      ? `<div style="margin-bottom:16px"><div class="detail-meta-box"><div class="detail-meta-line">${item.owner_type === "bot" ? "الكيان المالك" : "المشروع المالك"}</div><div class="meta-chip-row">${rels}</div></div></div>`
      : "") +
    _entityTrustBox(item, "service") +
    `<div class="prj-detail-grid">` +
    `<div class="prj-info-card prj-info-card--cyan"><h3 class="prj-info-title">🧭 ما هذا</h3>${bodyRows.map((r) => `<div class="prj-info-row">${E(r)}</div>`).join("")}</div>` +
    (runtimeRows.length
      ? `<div class="prj-info-card prj-info-card--purple"><h3 class="prj-info-title">⚙️ التشغيل</h3>${runtimeRows.map((r) => `<div class="prj-info-row">${E(r)}</div>`).join("")}</div>`
      : "") +
    `<div class="prj-info-card prj-info-card--blue"><h3 class="prj-info-title">📍 الوصول</h3>${accessRows.map((r) => `<div class="prj-info-row">${E(r)}</div>`).join("")}</div>` +
    `</div>` +
    `</div>` +
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur + "/" + encodeURIComponent(name));
  requestAnimationFrame(() => {
    el.classList.add("open");
    _processIcons();
  });
}

function openCloudDetail(name) {
  const item = CLD.find((c) => c.nm === name);
  if (!item) return;
  closeDetail();
  const cl = _entityColor(item.prj || item.nm, "#0EA5E9");
  const rels = _relChips(item.related_entities || item.used_in || []);
  const metaRows = [
    item.category ? `الدور: ${_cloudCategoryLabel(item.category)}` : "",
    item.prj ? `يرتبط أساسًا بـ: ${item.prj}` : "",
    item.active === false ? "حالة الكتالوج: متوقف" : "حالة الكتالوج: نشط",
    item.lk ? `الرابط: ${item.lk}` : "",
  ].filter(Boolean);

  const el = document.createElement("div");
  el.id = "detail-view";
  el.className = "detail-split detail-split--cloud";
  el.innerHTML =
    `<div class="dsp-overlay" onclick="closeDetail()"></div>` +
    `<div class="dsp-panel">` +
    `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">` +
    `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>` +
    `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em, 48)}</span>` +
    `<h2 style="font-size:18px;font-weight:700">${E(item.nm)}</h2>` +
    `<p style="font-size:11px;line-height:1.8;opacity:.88;margin:10px 0 0">${E(_cloudCategoryLabel(item.category))}</p>` +
    `</div>` +
    `<div class="dsp-content">` +
    `<p style="font-size:13px;color:var(--t2);margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px;border-right:3px solid ${cl};line-height:1.7">${E(item.dt)}</p>` +
    (metaRows.length
      ? `<div class="detail-meta-box detail-meta-box--intro"><div class="detail-meta-title">تعريف سريع</div>${metaRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    (rels
      ? `<div style="margin-bottom:16px"><div class="detail-meta-box"><div class="detail-meta-title">تظهر في هذه المشاريع</div><div class="meta-chip-row">${rels}</div></div></div>`
      : "") +
    _entityTrustBox(item, "cloud") +
    (item.lk
      ? `<div style="margin-top:8px">${_linksHTML({ "افتح المنصة": item.lk }, cl)}</div>`
      : "") +
    `</div>` +
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur + "/" + encodeURIComponent(name));
  requestAnimationFrame(() => {
    el.classList.add("open");
    _processIcons();
  });
}

/* ── 4. IDEA EXPAND — بطاقة تتوسع من المركز ── */
function openIdeaDetail(name) {
  const item = IDEAS.find((i) => i.name === name);
  if (!item) return;
  closeDetail();
  const { headline, sections } = _parseDesc(item);
  const prLabels = { 1: "عاجل", 2: "قريب", 3: "يوماً ما" };
  const prColors = { 1: "#EF4444", 2: "#F59E0B", 3: "#6366F1" };
  const cl = prColors[item.pr] || "#6366F1";
  const rels = _relChips(item.related_projects || []);
  const metaRows = [
    item.owner_scope ? `النطاق: ${item.owner_scope}` : "",
    item.horizon ? `الأفق: ${item.horizon}` : "",
    item.next_step ? `الخطوة التالية: ${item.next_step}` : "",
  ].filter(Boolean);

  const el = document.createElement("div");
  el.id = "detail-view";
  el.className = "detail-idea detail-idea--idea";
  el.innerHTML =
    `<div class="di-overlay" onclick="closeDetail()"></div>` +
    `<div class="di-card" style="border-top:4px solid ${cl}">` +
    `<button class="di-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>` +
    `<div class="di-header">` +
    `<span style="font-size:42px">${_ic(item.em, 42)}</span>` +
    `<span class="di-priority" style="background:${cl}">${E(prLabels[item.pr] || "")}</span>` +
    `</div>` +
    `<h2 style="font-size:18px;font-weight:700;margin-bottom:8px">${E(item.name)}</h2>` +
    (item.summary || headline
      ? `<p style="font-size:12px;color:var(--t2);margin-bottom:14px">${E(item.summary || headline)}</p>`
      : "") +
    (metaRows.length
      ? `<div class="detail-meta-box detail-meta-box--intro"><div class="detail-meta-title">تعريف سريع</div>${metaRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    _entityTrustBox(item, "idea") +
    _sectionsHTML(sections) +
    (rels
      ? `<div style="margin-top:16px"><div class="detail-meta-box"><div class="detail-meta-title">يتكامل مع</div><div class="meta-chip-row">${rels}</div></div></div>`
      : "") +
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur + "/" + encodeURIComponent(name));
  requestAnimationFrame(() => {
    el.classList.add("open");
    _processIcons();
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
  const metaRows = [
    `التصنيف: ${_archiveKindLabel(item)}`,
    item.next_step ? `الخطوة التالية: ${item.next_step}` : "",
  ].filter(Boolean);
  const rels = _relChips(item.related_projects || []);

  const el = document.createElement("div");
  el.id = "detail-view";
  el.className = "detail-archive detail-archive--archive";
  el.innerHTML =
    `<div class="da-overlay" onclick="closeDetail()"></div>` +
    `<div class="da-paper">` +
    `<button class="da-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>` +
    `<div class="da-stamp ${item.st === "a" ? "da-stamp-active" : ""}">${E(stamp)}</div>` +
    `<div class="da-header">` +
    `<span style="font-size:44px">${_ic(item.em, 44)}</span>` +
    `<h2 style="font-size:18px;font-weight:700;color:var(--t1)">${E(item.ar || item.name)}</h2>` +
    `</div>` +
    (item.summary || headline
      ? `<p style="font-size:12px;color:var(--t2);border-bottom:1px dashed #D4C99E;padding-bottom:12px;margin-bottom:12px">${E(item.summary || headline)}</p>`
      : "") +
    (metaRows.length
      ? `<div class="detail-meta-box archive-meta-box detail-meta-box--intro"><div class="detail-meta-title">تعريف سريع</div>${metaRows.map((r) => `<div class="detail-meta-line">${E(r)}</div>`).join("")}</div>`
      : "") +
    _entityTrustBox(item, "archive") +
    _sectionsHTML(sections) +
    (rels
      ? `<div style="margin-top:16px"><div class="detail-meta-box archive-meta-box"><div class="detail-meta-title">يرتبط بـ</div><div class="meta-chip-row">${rels}</div></div></div>`
      : "") +
    _tagsHTML(item.tags, cl) +
    _pathHTML(item.path) +
    _linksHTML(item.links, cl) +
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur + "/" + encodeURIComponent(name));
  requestAnimationFrame(() => {
    el.classList.add("open");
    _processIcons();
  });
}

/* ── إغلاق أي عرض تفصيلي ── */
function closeDetail(instant) {
  const d = document.getElementById("detail-view");
  if (!d) return;
  // Restore ALL hidden pages (project detail hides all)
  document.querySelectorAll(".page").forEach((p) => {
    if (p.style.display === "none") p.style.display = "";
  });
  if (instant) {
    d.remove();
    return;
  }
  d.classList.remove("open");
  d.addEventListener("transitionend", () => d.remove(), { once: true });
  setTimeout(() => {
    if (document.getElementById("detail-view")) d.remove();
  }, 500);
  if (location.hash.includes("/")) _setHashSilently(cur);
  window.scrollTo(0, 0);
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
        `<button class="search-result" onclick="selectSearchResult('${E(r.id)}')">` +
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

let _mRaf = false;
document.addEventListener("mousemove", function (e) {
  if (_mRaf) return;
  _mRaf = true;
  requestAnimationFrame(() => {
    _mRaf = false;
    const active = document.querySelector(".page.active");
    if (!active) return;
    active.querySelectorAll(".glass").forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        card.style.setProperty("--mouse-x", x + "px");
        card.style.setProperty("--mouse-y", y + "px");
      }
    });
  });
});

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

async function bootstrap() {
  init();
  _startLiveTicks();
  _loadRuntimeData().then(() => {
    if (RUNTIME_STATE.generated_at) _refreshRuntimeBoundViews();
  });
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
