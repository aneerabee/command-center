/* Shared, side-effect-free rules for the workspace and its checks. */
const WorkspaceModel = (() => {
  const MAX_CHECK_AGE = 12 * 60 * 60 * 1000;
  const HEALTH_MAX_AGE = 15 * 60 * 1000;
  const LOCALE = 'ar-EG-u-nu-latn';
  function latinDigits(value) {
    return String(value ?? '').replace(/[\u0660-\u0669\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) % 16));
  }
  const STATES = Object.freeze({
    ok: { label: 'اجتاز الفحص', icon: 'circle-check', rank: 4 },
    warn: { label: 'يحتاج مراجعة', icon: 'triangle-alert', rank: 1 },
    fail: { label: 'تعذر التحقق', icon: 'circle-x', rank: 0 },
    stale: { label: 'فحص قديم', icon: 'clock-3', rank: 2 },
    manual: { label: 'مراجعة يدوية', icon: 'eye', rank: 3 },
    unknown: { label: 'لم يُفحص', icon: 'circle-dashed', rank: 5 },
  });
  function status(record, now = Date.now()) {
    if (!record) return { ...STATES.unknown, state: 'unknown', checked: null };
    const checked = record.verified_at || null;
    const stamp = Date.parse(checked || '');
    const expiry = Date.parse(record.stale_at || '');
    const result = Object.hasOwn(STATES, record.verification_status) ? record.verification_status : 'unknown';
    const old = !Number.isFinite(stamp) || now - stamp > MAX_CHECK_AGE || stamp > now + 60000 || (Number.isFinite(expiry) && now > expiry);
    const state = result === 'manual' ? 'manual' : old || record.stale === true ? 'stale' : result;
    return { ...STATES[state], state, checked, result };
  }
  function registry(data, runtime = {}) {
    const specs = [
      ['PRJ','project','projects','openProject'], ['SVC','service','server','openService'],
      ['BOT','bot','bots','openBot'], ['TL','tool','tools','openTool'],
      ['CLD','cloud','cloud','openCloud'], ['ARC','archive','archive','openArchive'],
      ['IDEAS','idea','ideas','openIdea'], ['TEAM','team','team','openTeam'],
    ];
    const rows = specs.flatMap(([source,kind,page,action]) => (data[source] || []).map(item => ({
      key: `${kind}:${item.id}`, id: item.id, item, kind, page, action,
      arg: item.name || item.nm, title: item.ar || item.full_name || item.name || item.nm,
      record: runtime[kind]?.[item.id] || null,
    })));
    return [...rows, ...(data.AUTO || []).flatMap(group => (group.tasks || []).map(item => {
      const arg = `${group.host}::${item.name}`;
      return { key: `automation:${item.id}`, id: item.id, item, kind: 'automation', page: 'auto',
        action: 'openAuto', arg, title: item.name, group: group.group,
        record: runtime.automation?.[arg] || runtime.automation?.[item.id] || null };
    }))];
  }
  function counts(rows, now = Date.now()) {
    return rows.reduce((sum,row) => {
      const key = status(row.record, now).state;
      return { ...sum, [key]: sum[key] + 1, total: sum.total + 1 };
    }, { ok:0, warn:0, fail:0, stale:0, manual:0, unknown:0, total:0 });
  }
  function normalize(value) {
    return latinDigits(value).normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
  }
  function matches(row, query) {
    const text = normalize([row.title, row.arg, row.item.summary, row.item.role, row.item.host,
      row.item.path, row.item.local_path, row.item.server_path, ...(row.item.tags || [])].join(' '));
    return normalize(query).trim().split(/\s+/).filter(Boolean).every(word => text.includes(word));
  }
  function safeUrl(value) {
    if (!value || typeof value !== 'string') return null;
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
    catch { return null; }
  }
  function primaryLink(row) {
    const item = row.item;
    const deployed = safeUrl(item.deploy_url);
    if (deployed) return { url: deployed, label: 'فتح المشروع' };
    const platform = safeUrl(item.lk);
    if (platform) return { url: platform, label: 'فتح المنصة' };
    return null;
  }
  function health(state, now = Date.now()) {
    if (!state) return { state:'unknown', label:'لا توجد نتيجة فحص' };
    const stamp = Date.parse(state.checked_at || '');
    if (!Number.isFinite(stamp) || now - stamp > HEALTH_MAX_AGE || stamp > now + 60000) return { state:'stale', label:'نتيجة الخادم قديمة' };
    return state.ok && state.reachable ? { state:'ok', label:'الخادم متاح' } : { state:'warn', label:'الخادم يحتاج مراجعة' };
  }
  function route(row) { return `${row.page}/${encodeURIComponent(row.arg)}`; }
  const lookupIndexes = new WeakMap();
  function resolve(rows, value, page) {
    if(!lookupIndexes.has(rows)) {
      const index = new Map();
      for(const row of rows) {
        const names = new Set([row.key,row.arg,row.id,row.item.name,row.item.nm,row.item.ar,row.item.full_name].filter(Boolean).map(normalize));
        for(const name of names) index.set(name,[...(index.get(name) || []),row]);
      }
      lookupIndexes.set(rows,index);
    }
    const matches = lookupIndexes.get(rows).get(normalize(value)) || [];
    return matches.find(row => row.page === page) || matches[0] || null;
  }
  function references(item) {
    return [...new Set([
      ...['related_entities','related_services','related_tools','related_cloud','related_projects','assigned_projects'].flatMap(key => item[key] || []),
      ...(Array.isArray(item.prj) ? item.prj : []), ...(item.parent_project ? [item.parent_project] : []),
    ])];
  }
  function related(rows, row) {
    const targets = item => [
      ...Object.entries({related_entities:null,related_services:'server',related_tools:'tools',related_cloud:'cloud',related_projects:'projects',assigned_projects:'projects'}).flatMap(([key,page]) => (item[key] || []).map(name => resolve(rows,name,page))),
      ...(Array.isArray(item.prj) ? item.prj : []).map(name => resolve(rows,name,'projects')),
      ...(item.parent_project ? [resolve(rows,item.parent_project,'projects')] : []),
    ].filter(Boolean);
    const direct = targets(row.item);
    const inverse = rows.filter(other => targets(other.item).some(target => target.key === row.key) || other.kind === 'service' && other.item.prj === row.arg);
    return [...new Map([...direct,...inverse].filter(other => other && other.key !== row.key).map(other => [other.key,other])).values()];
  }
  return Object.freeze({ LOCALE, latinDigits, route, resolve, references, related, MAX_CHECK_AGE, HEALTH_MAX_AGE, STATES, status, registry, counts, normalize, matches, safeUrl, primaryLink, health });
})();
if (typeof module !== 'undefined') module.exports = WorkspaceModel;
