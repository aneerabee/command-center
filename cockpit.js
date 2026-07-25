/* ============================================================
   Command Center — قمرة القيادة (v5)
   ١٢ صفحة → ٤ · بطاقة واحدة · درج بلا تبويبات · بحث يفهرس كل شيء
   يقرأ نفس data.js — لا يغيّر أي حقل ولا أي معرّف.
   ============================================================ */
(() => {
  "use strict";

  // ── أدوات ────────────────────────────────────────────────
  const $ = (s, r = document) => r.querySelector(s);
  const E = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const has = (v) => v !== null && v !== undefined && v !== "";

  const DAY = 864e5;
  function age(dateStr) {
    if (!has(dateStr)) return null;
    const d = new Date(String(dateStr).slice(0, 10));
    if (isNaN(d)) return null;
    const n = Math.floor((Date.now() - d) / DAY);
    if (n < 0) return null;
    if (n === 0) return "اليوم";
    if (n === 1) return "أمس";
    if (n < 30) return `منذ ${n} يوم`;
    if (n < 365) return `منذ ${Math.floor(n / 30)} شهر`;
    return `منذ ${Math.floor(n / 365)} سنة`;
  }
  const ageDays = (s) => {
    const d = new Date(String(s ?? "").slice(0, 10));
    return isNaN(d) ? Infinity : Math.floor((Date.now() - d) / DAY);
  };

  function toast(msg) {
    let t = $(".toast-in");
    if (!t) {
      const w = document.createElement("div");
      w.className = "toast";
      w.innerHTML = '<div class="toast-in"></div>';
      document.body.appendChild(w);
      t = $(".toast-in");
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("is-on"));
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("is-on"), 1800);
  }

  async function copy(text, label = "نُسخ") {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    toast(label);
  }

  // ── تطبيع الكيانات إلى صفّ موحّد ───────────────────────
  // status: ok | warn | down | idle
  const S = { ok: "ok", warn: "warn", down: "down", idle: "idle" };

  function mkRow(o) {
    return {
      id: o.id, name: o.name, ar: o.ar || "", kind: o.kind,
      status: o.status || S.idle, color: o.color || "",
      summary: o.summary || "", next: o.next || "", meta: o.meta || [],
      path: o.path || "", updated: o.updated || "", raw: o.raw,
      group: o.group || "", search: o.search || "",
    };
  }

  const KIND_AR = {
    project: "مشروع", umbrella: "شركة", idea: "فكرة", archive: "أرشيف",
    service: "خدمة", automation: "أتمتة", bot: "بوت", tool: "أداة",
    cloud: "سحابة", person: "شخص", department: "قسم",
  };

  function buildRows() {
    const R = { work: [], ops: [], people: [] };
    // data.js يعرّف هذه بـ const على المستوى العام → ترتبط لفظياً لا على window.
    // نلتقطها بمرجع مباشر داخل try لكل واحدة، فلا نحتاج eval ولا نكسر إن غاب أحدها.
    const SRC = {};
    try { SRC.PRJ = PRJ; } catch { SRC.PRJ = []; }
    try { SRC.SVC = SVC; } catch { SRC.SVC = []; }
    try { SRC.AUTO = AUTO; } catch { SRC.AUTO = []; }
    try { SRC.BOT = BOT; } catch { SRC.BOT = []; }
    try { SRC.TL = TL; } catch { SRC.TL = []; }
    try { SRC.CLD = CLD; } catch { SRC.CLD = []; }
    try { SRC.ARC = ARC; } catch { SRC.ARC = []; }
    try { SRC.IDEAS = IDEAS; } catch { SRC.IDEAS = []; }
    try { SRC.TEAM = TEAM; } catch { SRC.TEAM = []; }
    try { SRC.UMBRELLAS = UMBRELLAS; } catch { SRC.UMBRELLAS = []; }
    try { SRC.DEPARTMENTS = DEPARTMENTS; } catch { SRC.DEPARTMENTS = []; }
    const A = (n) => SRC[n] || [];

    // ── العمل: مشاريع + شركات + أفكار + أرشيف ──
    A("PRJ").forEach((p) => {
      const st = p.st === "a" ? S.ok : p.st === "p" ? S.idle : S.idle;
      const stale = ageDays(p.current_status?.updated) > 45;
      const blockers = p.current_status?.blockers;
      const hasBlock = Array.isArray(blockers) ? blockers.length : has(blockers);
      R.work.push(mkRow({
        id: p.id, name: p.name, ar: p.ar, kind: "project",
        status: hasBlock ? S.warn : stale ? S.warn : st,
        color: p.cl, summary: p.summary || "",
        next: p.current_status?.next_step || p.next_milestone || "",
        updated: p.current_status?.updated,
        path: p.local_path || p.path || "",
        meta: [p.parent, p.priority === "high" ? "أولوية عالية" : "", p.deploy_url ? "منشور" : ""].filter(Boolean),
        group: p.parent || "بلا شركة", raw: p,
        search: [p.name, p.ar, p.summary, p.parent, p.local_path].join(" "),
      }));
    });
    A("UMBRELLAS").forEach((u) => R.work.push(mkRow({
      id: u.id, name: u.name, ar: u.ar, kind: "umbrella", status: S.idle, color: u.cl,
      summary: u.summary || u.specialty || "", meta: [u.type, u.location].filter(Boolean),
      group: "الشركات", raw: u, search: [u.name, u.ar, u.summary, u.specialty].join(" "),
    })));
    A("IDEAS").forEach((i) => R.work.push(mkRow({
      id: i.id, name: i.name, ar: i.ar, kind: "idea", status: S.idle, color: i.cl,
      summary: i.summary || "", next: i.next_step || "",
      meta: [i.stage, i.horizon].filter(Boolean), group: "أفكار", raw: i,
      search: [i.name, i.summary, i.stage].join(" "),
    })));
    A("ARC").forEach((a) => R.work.push(mkRow({
      id: a.id, name: a.name, ar: a.ar, kind: "archive", status: S.idle, color: a.cl,
      summary: a.summary || "", path: a.path || "", meta: ["مؤرشف"],
      group: "أرشيف", raw: a, search: [a.name, a.ar, a.summary].join(" "),
    })));

    // ── التشغيل: خدمات + أتمتة + بوتات + سحابة + أدوات ──
    A("SVC").forEach((s) => R.ops.push(mkRow({
      id: s.id, name: s.name, ar: s.ar, kind: "service",
      status: s.st ? S.ok : S.down, summary: s.info || s.dt || "",
      path: s.path || "", updated: s.last_check,
      meta: [s.host, s.port ? `منفذ ${s.port}` : "", s.schedule].filter(Boolean),
      group: s.host || "غير محدّد", raw: s,
      search: [s.name, s.ar, s.info, s.host, s.path].join(" "),
    })));
    A("AUTO").forEach((g) => (g.tasks || []).forEach((t) => R.ops.push(mkRow({
      id: t.id, name: t.name, ar: "", kind: "automation",
      status: t.on ? S.ok : S.down, summary: t.what || "",
      path: t.path || "", meta: [t.freq, t.kind].filter(Boolean),
      group: g.host || g.loc || "أتمتة", raw: { ...t, _group: g.group },
      search: [t.name, t.what, t.freq].join(" "),
    }))));
    A("BOT").forEach((b) => R.ops.push(mkRow({
      id: b.id, name: b.name, ar: b.ar, kind: "bot",
      status: b.st === "a" ? S.ok : b.st === "p" ? S.idle : S.down,
      color: b.cl, summary: b.summary || "", path: b.path || "",
      updated: b.last_check, meta: [b.host, b.channel].filter(Boolean),
      group: b.host || "بوتات", raw: b, search: [b.name, b.ar, b.summary, b.host].join(" "),
    })));
    A("CLD").forEach((c) => R.ops.push(mkRow({
      id: c.id, name: c.nm || c.name, ar: c.ar, kind: "cloud",
      status: c.active ? S.ok : S.idle, summary: c.active_note || c.dt || "",
      meta: [c.category, ...(c.used_in || []).slice(0, 2)].filter(Boolean),
      group: "سحابة", raw: c, search: [c.nm, c.name, c.ar, c.active_note].join(" "),
    })));
    A("TL").forEach((t) => R.ops.push(mkRow({
      id: t.id, name: t.name, ar: t.ar, kind: "tool",
      status: t.st === "a" ? S.ok : S.idle, color: t.cl,
      summary: t.summary || "", path: t.path || "",
      meta: [t.category || t.type, ...(t.used_in || []).slice(0, 2)].filter(Boolean),
      group: "أدوات", raw: t, search: [t.name, t.ar, t.summary].join(" "),
    })));

    // ── الناس ──
    A("TEAM").forEach((p) => R.people.push(mkRow({
      id: p.id, name: p.name, ar: p.full_name || p.name_en, kind: "person",
      status: p.status === "active" ? S.ok : S.idle, color: p.cl,
      summary: [p.role, p.location_office].filter(Boolean).join(" · "),
      meta: [p.department, ...(p.assigned_projects || []).slice(0, 2)].filter(Boolean),
      group: p.department || "بلا قسم", raw: p,
      search: [p.name, p.name_en, p.full_name, p.role, p.department].join(" "),
    })));
    A("DEPARTMENTS").forEach((d) => R.people.push(mkRow({
      id: d.id, name: d.name, ar: d.ar, kind: "department", status: S.idle,
      summary: d.desc || d.summary || "", meta: [d.parent].filter(Boolean),
      group: "الأقسام", raw: d, search: [d.name, d.ar, d.desc].join(" "),
    })));

    return R;
  }

  let ROWS = { work: [], ops: [], people: [] };
  const ALL = () => [...ROWS.work, ...ROWS.ops, ...ROWS.people];

  // ── قوالب العرض ──────────────────────────────────────────
  // الكثافة تحدّد ما يظهر: مضغوط = اسم فقط · افتراضي = + سطر شرح · غنيّ = + التالي وشارات
  function rowHTML(r, opts = {}) {
    const bits = [];
    if (opts.showNext && r.next) bits.push(`<div class="row-next"><b>التالي</b> ${E(r.next)}</div>`);
    if (opts.showMeta && (r.meta.length || r.path)) {
      const m = r.meta.slice(0, 2).map((x) => `<span class="badge">${E(x)}</span>`).join("");
      const p = r.path ? `<span class="path mono" title="${E(r.path)}"><span>${E(r.path)}</span></span>` : "";
      if (m || p) bits.push(`<div class="row-meta">${m}${p}</div>`);
    }
    const a = age(r.updated);
    return `<button class="row" data-act="open" data-id="${E(r.id)}"${r.color ? ` style="--row-cl:${E(r.color)}"` : ""}>
      <span class="dot dot--${r.status}"></span>
      <span class="row-main">
        <span class="row-name">${E(r.name)}</span>
        ${r.summary ? `<span class="row-sub">${E(r.summary)}</span>` : ""}
        ${bits.join("")}
      </span>
      <span class="row-side">${a ? `<span class="row-age">${E(a)}</span>` : ""}</span>
    </button>`;
  }

  const listHTML = (rows, density = "default", opts = {}) => {
    // ما يظهر مشتقّ من الكثافة تلقائياً — فلا يختلف شكل الصفّ بين الصفحات
    const o = { showNext: density === "rich", showMeta: density === "rich", ...opts };
    return rows.length
      ? `<div class="rows rows--${density}">${rows.map((r) => rowHTML(r, o)).join("")}</div>`
      : `<div class="empty">${E(opts.empty || "لا يوجد")}</div>`;
  };

  // ── الصفحة ١ · اليوم ─────────────────────────────────────
  function renderToday() {
    const broken = ROWS.ops.filter((r) => r.status === S.down);
    const resume = ROWS.work
      .filter((r) => r.kind === "project" && r.raw?.st === "a")
      .sort((a, b) => ageDays(a.updated) - ageDays(b.updated))
      .filter((r) => r.next)
      .slice(0, 4);
    const stale = ROWS.work.filter((r) => r.kind === "project" && ageDays(r.updated) > 45);

    const d = new Date();
    const date = d.toLocaleDateString("ar", { weekday: "long", day: "numeric", month: "long" });

    return `
      <div class="page-head">
        <h1 class="f-display">${E(date)}</h1>
        <span class="sub">${ROWS.work.filter((r) => r.kind === "project").length} مشروع · ${ROWS.ops.length} عنصر تشغيل</span>
      </div>

      ${broken.length ? `<section class="block">
        <div class="block-head"><h2>ما هو متوقّف الآن</h2><span class="count">${broken.length}</span></div>
        ${listHTML(broken.slice(0, 5), "default")}
        ${broken.length > 5 ? `<div style="margin-top:var(--s2)"><button class="btn" data-act="go" data-arg="ops">عرض الكل (${broken.length}) ←</button></div>` : ""}
      </section>` : ""}

      <section class="block">
        <div class="block-head"><h2>استأنف من حيث توقّفت</h2><span class="count">${resume.length}</span></div>
        ${listHTML(resume, "rich", { showNext: true, empty: "لا مشروع نشط بخطوة تالية محدّدة" })}
      </section>

      ${stale.length ? `<section class="block">
        <div class="block-head"><h2>لم يُحدَّث منذ فترة</h2><span class="count">${stale.length}</span></div>
        ${listHTML(stale.slice(0, 5), "compact")}
      </section>` : ""}
    `;
  }

  // ── الصفحات ٢-٤ · قوائم بشريط أدوات ─────────────────────
  const FILTERS = {
    work: [
      { k: "all", t: "الكل" }, { k: "project", t: "مشاريع" }, { k: "umbrella", t: "شركات" },
      { k: "idea", t: "أفكار" }, { k: "archive", t: "أرشيف" },
    ],
    ops: [
      { k: "all", t: "الكل" }, { k: "down", t: "متوقّف ⛔" }, { k: "service", t: "خدمات" },
      { k: "automation", t: "أتمتة" }, { k: "bot", t: "بوتات" }, { k: "cloud", t: "سحابة" }, { k: "tool", t: "أدوات" },
    ],
    people: [{ k: "all", t: "الكل" }, { k: "person", t: "أشخاص" }, { k: "department", t: "أقسام" }],
  };

  const state = { work: { f: "all", q: "" }, ops: { f: "all", q: "" }, people: { f: "all", q: "" } };

  function renderList(page, title) {
    const st = state[page];
    let rows = ROWS[page];
    if (st.f === "down") rows = rows.filter((r) => r.status === S.down);
    else if (st.f !== "all") rows = rows.filter((r) => r.kind === st.f);
    if (st.q) {
      const q = st.q.toLowerCase();
      rows = rows.filter((r) => (r.search || r.name).toLowerCase().includes(q));
    }

    const groups = {};
    rows.forEach((r) => { (groups[r.group] ||= []).push(r); });
    const density = page === "ops" ? "compact" : "default";
    const body = Object.keys(groups).length
      ? Object.entries(groups).map(([g, rs]) =>
          `<div class="group-head">${E(g)} <span class="count">${rs.length}</span></div>
           ${listHTML(rs, density, { showNext: page === "work" })}`).join("")
      : `<div class="empty">لا نتائج${st.q ? ` لِـ «${E(st.q)}»` : ""}</div>`;

    return `
      <div class="page-head"><h1 class="f-display">${E(title)}</h1><span class="sub">${rows.length} من ${ROWS[page].length}</span></div>
      <div class="toolbar">
        <input class="tb-search" type="search" placeholder="تصفية…" value="${E(st.q)}" data-filter="${page}">
        ${FILTERS[page].map((f) => `<button class="chip" data-act="filter" data-page="${page}" data-arg="${f.k}" aria-pressed="${st.f === f.k}">${E(f.t)}</button>`).join("")}
      </div>
      ${body}
    `;
  }

  // ── الدرج ────────────────────────────────────────────────
  function openDrawer(id) {
    const r = ALL().find((x) => x.id === id);
    if (!r) return;
    const o = r.raw || {};
    const cs = o.current_status || {};

    const facts = [];
    const F = (k, v) => { if (has(v)) facts.push(`<div><dt>${E(k)}</dt><dd>${v}</dd></div>`); };
    const mono = (v) => `<span class="mono">${E(v)}</span>`;
    const link = (v, t) => `<a href="${E(v)}" target="_blank" rel="noopener">${E(t || v)} ↗</a>`;

    F("النوع", KIND_AR[r.kind] || r.kind);
    if (has(o.pct)) F("التقدّم", `${o.pct}٪`);
    F("المسار", r.path ? mono(r.path) : "");
    F("الخادم", o.server_path ? mono(o.server_path) : "");
    F("المستودع", o.repo_url ? link(o.repo_url, o.repo_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")) : "");
    F("النشر", o.deploy_url ? link(o.deploy_url) : "");
    F("المضيف", o.host);
    F("المنفذ", o.port);
    F("الجدولة", o.freq || o.schedule);
    F("الشركة", o.parent);
    F("القسم", o.department);
    F("الدور", o.role);
    F("آخر فحص", o.last_check);
    F("التقنيات", Array.isArray(o.stack) ? o.stack.join(" · ") : o.stack);

    const cmd = o.claude_session?.command;
    const btns = [];
    if (cmd) btns.push(`<button class="btn btn--accent" data-act="copy" data-arg="${E(cmd)}">نسخ أمر الاستئناف</button>`);
    if (r.path) btns.push(`<button class="btn" data-act="copy" data-arg="${E(`cd "${r.path}"`)}">نسخ مسار الدخول</button>`);
    if (o.deploy_url) btns.push(`<a class="btn" href="${E(o.deploy_url)}" target="_blank" rel="noopener">فتح المنشور ↗</a>`);

    const blockers = Array.isArray(cs.blockers) ? cs.blockers : has(cs.blockers) ? [cs.blockers] : [];
    // بعض الحقول تحوي جدار نصّ (متوسّط 943 حرفاً) — نعرض الجوهر ونطوي الباقي
    // حتى تبقى بطاقة الفعل قابلة للمسح البصري مهما طالت البيانات.
    const clamp = (txt, n = 200) => {
      const full = String(txt).trim();
      // نطوي الأسطر الجديدة إلى مسافات في المعاينة فقط — وإلا انفجر ارتفاع البطاقة
      const flat = full.replace(/\s*\n+\s*/g, " · ").replace(/\s{2,}/g, " ");
      if (flat.length <= n) return E(flat);
      const sp = flat.lastIndexOf(" ", n);
      const cut = flat.slice(0, sp > n * 0.6 ? sp : n);
      return `${E(cut)}… <details class="fold" style="border:0;margin:4px 0 0;padding:0">
        <summary>عرض النصّ كاملاً</summary><div class="fold-body">${E(full)}</div></details>`;
    };
    const actLines = [];
    if (has(cs.where)) actLines.push(`<div class="act-line"><dt>أين وصلنا</dt><dd>${clamp(cs.where)}</dd></div>`);
    if (has(r.next)) actLines.push(`<div class="act-line"><dt>التالي</dt><dd>${clamp(r.next, 150)}</dd></div>`);
    // العوائق قد تكون كائنات بأشكال مختلفة — نستخرج النصّ ولا نرسم السطر إن خرج فارغاً
    const blockText = blockers
      .map((b) => (typeof b === "string" ? b : b.what || b.title || b.text || b.name || b.issue || ""))
      .map((s) => String(s).trim()).filter(Boolean);
    if (blockText.length) actLines.push(`<div class="act-line"><dt>العوائق</dt><dd>${blockText.map((b) => clamp(b, 130)).join("<br>")}</dd></div>`);
    if (has(r.summary) && !actLines.length) actLines.push(`<div class="act-line"><dt>الملخّص</dt><dd>${E(r.summary)}</dd></div>`);

    const rel = [...(o.related_entities || []), ...(o.related_services || []), ...(o.related_tools || []), ...(o.assigned_projects || []), ...(o.used_in || [])]
      .filter(Boolean).slice(0, 12);

    $(".dw-head").innerHTML = `
      <span class="dot dot--${r.status}" style="margin-top:9px"></span>
      <span class="row-main">
        <span class="row-name">${E(r.name)}</span>
        ${r.ar && r.ar !== r.name ? `<span class="row-sub">${E(r.ar)}</span>` : ""}
      </span>
      ${age(r.updated) ? `<span class="row-age" style="margin-top:6px">${E(age(r.updated))}</span>` : ""}
      <button class="dw-close" data-act="close" aria-label="إغلاق">×</button>`;

    $(".dw-body").innerHTML = `
      ${actLines.length || btns.length ? `<div class="act">${actLines.join("")}${btns.length ? `<div class="act-btns">${btns.join("")}</div>` : ""}</div>` : ""}
      ${facts.length ? `<dl class="facts">${facts.join("")}</dl>` : ""}
      ${rel.length ? `<div class="chips">${rel.map((x) => `<button class="chip" data-act="find" data-arg="${E(x)}">${E(x)}</button>`).join("")}</div>` : ""}
      ${has(o.desc) ? `<details class="fold"><summary>التفاصيل الكاملة</summary><div class="fold-body">${E(o.desc)}</div></details>` : ""}
      ${has(o.info) || has(o.why) ? `<details class="fold"><summary>ملاحظات تشغيلية</summary><div class="fold-body">${E(o.info || "")}${o.why ? "\n\n" + E(o.why) : ""}</div></details>` : ""}
    `;

    $(".drawer").classList.add("is-open");
    $(".scrim").classList.add("is-open");
    $(".dw-body").scrollTop = 0;
    document.body.style.overflow = "hidden";
    if (location.hash.indexOf("/") === -1) history.pushState({ d: id }, "", `${location.hash || "#today"}/${encodeURIComponent(r.name)}`);
  }

  function closeDrawer(skipHash) {
    $(".drawer").classList.remove("is-open");
    $(".scrim").classList.remove("is-open");
    document.body.style.overflow = "";
    if (!skipHash && location.hash.includes("/")) history.pushState({}, "", location.hash.split("/")[0]);
  }

  // ── لوحة البحث ⌘K ────────────────────────────────────────
  let cmdkSel = 0, cmdkRows = [];
  function cmdkRender(q) {
    const all = ALL();
    cmdkRows = (q ? all.filter((r) => (r.search || r.name).toLowerCase().includes(q.toLowerCase())) : all).slice(0, 40);
    cmdkSel = 0;
    $(".cmdk-list").innerHTML = cmdkRows.length
      ? cmdkRows.map((r, i) => `<button class="cmdk-item" data-act="open" data-id="${E(r.id)}" aria-selected="${i === 0}">
          <span class="dot dot--${r.status}"></span>
          <span class="row-main"><span class="row-name" style="font-size:13.5px">${E(r.name)}</span></span>
          <span class="k">${E(KIND_AR[r.kind] || "")}</span></button>`).join("")
      : `<div class="empty">لا نتائج</div>`;
  }
  function cmdkOpen() {
    $(".cmdk").classList.add("is-open");
    const i = $(".cmdk-input"); i.value = ""; cmdkRender(""); i.focus();
  }
  const cmdkClose = () => $(".cmdk").classList.remove("is-open");
  function cmdkMove(d) {
    if (!cmdkRows.length) return;
    cmdkSel = (cmdkSel + d + cmdkRows.length) % cmdkRows.length;
    [...document.querySelectorAll(".cmdk-item")].forEach((el, i) => {
      el.setAttribute("aria-selected", i === cmdkSel);
      if (i === cmdkSel) el.scrollIntoView({ block: "nearest" });
    });
  }

  // ── التوجيه — أربع صفحات + أسماء مستعارة للروابط القديمة ─
  const PAGES = ["today", "work", "ops", "people"];
  const ALIAS = {
    home: "today", projects: "work", umbrellas: "work", map: "work", ideas: "work", archive: "work",
    server: "ops", auto: "ops", bots: "ops", cloud: "ops", tools: "ops", team: "people",
  };
  const TITLES = { today: "اليوم", work: "العمل", ops: "التشغيل", people: "الناس" };
  const scrollMem = new Map();
  let current = "today";

  function render(page) {
    const el = $(`#pg-${page}`);
    el.innerHTML = page === "today" ? renderToday() : renderList(page, TITLES[page]);
  }

  function go(page, push = true) {
    page = ALIAS[page] || page;
    if (!PAGES.includes(page)) page = "today";
    if (current !== page) scrollMem.set(current, window.scrollY);
    current = page;
    render(page);
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("is-active", p.id === `pg-${page}`));
    document.querySelectorAll("[data-nav]").forEach((a) =>
      a.setAttribute("aria-current", a.dataset.nav === page ? "page" : "false"));
    if (push && location.hash.split("/")[0] !== `#${page}`) history.pushState({ p: page }, "", `#${page}`);
    requestAnimationFrame(() => window.scrollTo(0, scrollMem.get(page) || 0));
  }

  function fromHash(push = false) {
    const [h, name] = decodeURIComponent(location.hash.slice(1)).split("/");
    go(h || "today", push);
    if (name) {
      const r = ALL().find((x) => x.name === name);
      if (r) { openDrawer(r.id); return; }
    }
    closeDrawer(true);
  }

  // ── الأحداث ──────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const { act, arg, id, page } = t.dataset;
    if (act === "open") { e.preventDefault(); cmdkClose(); openDrawer(id); }
    else if (act === "cmdk") { e.preventDefault(); cmdkOpen(); }
    else if (act === "cmdk-scrim") { if (e.target === t) cmdkClose(); }
    else if (act === "close") closeDrawer();
    else if (act === "go") go(arg);
    else if (act === "copy") copy(arg);
    else if (act === "filter") { state[page].f = arg; render(page); }
    else if (act === "find") {
      const r = ALL().find((x) => x.name === arg || x.id === arg);
      if (r) openDrawer(r.id); else { cmdkOpen(); $(".cmdk-input").value = arg; cmdkRender(arg); }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.matches(".tb-search")) {
      const p = e.target.dataset.filter;
      state[p].q = e.target.value;
      const pos = e.target.selectionStart;
      render(p);
      const n = $(`.tb-search[data-filter="${p}"]`);
      if (n) { n.focus(); n.setSelectionRange(pos, pos); }
    } else if (e.target.matches(".cmdk-input")) cmdkRender(e.target.value);
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmdkOpen(); return; }
    if ($(".cmdk").classList.contains("is-open")) {
      if (e.key === "Escape") cmdkClose();
      else if (e.key === "ArrowDown") { e.preventDefault(); cmdkMove(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cmdkMove(-1); }
      else if (e.key === "Enter" && cmdkRows[cmdkSel]) { e.preventDefault(); cmdkClose(); openDrawer(cmdkRows[cmdkSel].id); }
      return;
    }
    if (e.key === "Escape") closeDrawer();
  });

  window.addEventListener("popstate", () => fromHash(false));

  // ── الإقلاع ──────────────────────────────────────────────
  function boot() {
    ROWS = buildRows();
    const down = ROWS.ops.filter((r) => r.status === S.down).length;
    const warn = [...ROWS.work, ...ROWS.ops].filter((r) => r.status === S.warn).length;
    const ok = ALL().filter((r) => r.status === S.ok).length;
    $(".statbar").innerHTML = `
      <button class="stat stat--ok" data-act="go" data-arg="ops" title="سليم">● ${ok}</button>
      <button class="stat stat--warn" data-act="go" data-arg="work" title="يحتاج مراجعة">▲ ${warn}</button>
      <button class="stat stat--down" data-act="go" data-arg="ops" title="متوقّف">⛔ ${down}</button>`;
    fromHash(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
