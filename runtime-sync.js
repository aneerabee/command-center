#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const crypto = require('crypto');
const {execSync} = require('child_process');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.js');
const RUNTIME_FILE = path.join(ROOT, 'data.runtime.json');
const SSH_HOST = 'argaz@62.171.128.44';
const SSH_KEY = path.join(os.homedir(), '.ssh', 'contabo_key');
const NOW = new Date().toISOString();
const STALE_DAYS = {service: 3, tool: 7, cloud: 14};

function loadData() {
  const code = fs.readFileSync(DATA_FILE, 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${code}\nresult = { PRJ, SVC, TL, CLD, DATA_TRUST_MODEL };`, context);
  return context.result;
}

function readPreviousRuntime() {
  if (!fs.existsSync(RUNTIME_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(RUNTIME_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeRuntime(payload) {
  fs.writeFileSync(RUNTIME_FILE, JSON.stringify(payload, null, 2) + '\n');
}

function expandHome(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2));
  return inputPath;
}

function hashPayload(value) {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex');
}

function safeExec(command, options = {}) {
  try {
    const stdout = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 4000,
      ...options
    });
    return {ok: true, stdout: String(stdout || '').trim(), stderr: ''};
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || error.message || '').trim()
    };
  }
}

function headReachable(url) {
  const result = safeExec(`curl -L -I --connect-timeout 2 --max-time 2 --silent --show-error --output /dev/null --write-out '%{http_code}' ${JSON.stringify(url)}`);
  if (!result.ok) return {ok: false, status: 0, error: result.stderr || result.stdout || 'curl failed'};
  const status = Number(result.stdout || 0);
  return {ok: status >= 200 && status < 400, status};
}

function parseStaleDays(value) {
  if (!value) return null;
  const days = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(days) && days > 0 ? days : null;
}

function buildRecord(kind, id, previous, patch, staleAfter) {
  const basePayload = {
    verification_status: patch.verification_status || 'unknown',
    checked_from: patch.checked_from || 'manual',
    summary: patch.summary || '',
    facts: patch.facts || []
  };
  const sourceHash = hashPayload(basePayload);
  const changed = !previous || previous.source_hash !== sourceHash;
  const staleDays = parseStaleDays(staleAfter) || STALE_DAYS[kind] || 14;
  const staleAt = new Date(Date.now() + staleDays * 86400000).toISOString();
  const stale = ['manual', 'unknown'].includes(basePayload.verification_status) || Date.now() > Date.parse(staleAt);

  return {
    verified_at: NOW,
    verification_status: basePayload.verification_status,
    checked_from: basePayload.checked_from,
    stale,
    stale_at: staleAt,
    summary: basePayload.summary,
    facts: basePayload.facts,
    source_hash: sourceHash,
    last_change_detected: changed ? NOW : (previous.last_change_detected || previous.verified_at || NOW)
  };
}

function countDirEntries(dirPath) {
  try {
    return fs.readdirSync(dirPath).length;
  } catch {
    return 0;
  }
}

function buildServerSnapshot() {
  const cmd = `ssh -i ${JSON.stringify(SSH_KEY)} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 ${SSH_HOST} 'hostname; echo __DOCKER__; docker ps --format "{{.Names}}|{{.Status}}"; echo __SYSTEMD__; systemctl --user list-units --type=service --all --no-pager --no-legend; echo __CRON__; crontab -l'`;
  const result = safeExec(cmd, {timeout: 30000});
  if (!result.ok || !result.stdout) {
    return {
      ok: false,
      error: result.stderr || result.stdout || 'ssh failed'
    };
  }
  try {
    const lines = result.stdout.split('\n');
    const hostname = (lines.shift() || '').trim();
    let mode = '';
    const docker = [];
    const systemd_user = [];
    const crontab = [];
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line) continue;
      if (line === '__DOCKER__' || line === '__SYSTEMD__' || line === '__CRON__') {
        mode = line;
        continue;
      }
      if (mode === '__DOCKER__') {
        const [name, status] = line.split('|');
        if (name) docker.push({name: name.trim(), status: String(status || '').trim()});
      } else if (mode === '__SYSTEMD__') {
        const parts = line.trim().split(/\s+/, 5);
        if (parts.length >= 5) {
          systemd_user.push({
            unit: parts[0],
            load: parts[1],
            active: parts[2],
            sub: parts[3],
            description: parts[4]
          });
        }
      } else if (mode === '__CRON__') {
        crontab.push(line);
      }
    }
    return {
      ok: true,
      data: {hostname, docker, systemd_user, crontab, crontab_ok: true}
    };
  } catch (error) {
    return {ok: false, error: error.message};
  }
}

function buildServerPathSnapshot(projects) {
  const serverProjects = projects.filter(p => p.server_path);
  if (!serverProjects.length) return {ok: true, data: {}};
  const checks = serverProjects
    .map(p => `if [ -e ${JSON.stringify(p.server_path)} ]; then echo ${JSON.stringify(`${p.id}|ok`)};
else echo ${JSON.stringify(`${p.id}|missing`)}; fi`)
    .join('; ');
  const cmd = `ssh -i ${JSON.stringify(SSH_KEY)} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 ${SSH_HOST} '${checks}'`;
  const result = safeExec(cmd, {timeout: 15000});
  if (!result.ok) return {ok: false, error: result.stderr || result.stdout || 'server path snapshot failed'};
  const rows = {};
  for (const line of String(result.stdout || '').split('\n')) {
    const [id, status] = line.trim().split('|');
    if (id) rows[id] = status;
  }
  return {ok: true, data: rows};
}

function checkServices(services, previous, serverSnapshot) {
  const records = {};
  const dockerByName = Object.fromEntries(((serverSnapshot.data || {}).docker || []).map(x => [x.name, x]));
  const systemdByUnit = Object.fromEntries(((serverSnapshot.data || {}).systemd_user || []).map(x => [x.unit, x]));
  const crontab = ((serverSnapshot.data || {}).crontab || []).join('\n');
  const tailscale = safeExec('command -v tailscale >/dev/null 2>&1 && tailscale ip -4');

  const matchers = {
    'wedding-planner-app': () => {
      const unit = systemdByUnit['wedding-planner.service'];
      if (!unit) return {verification_status: 'fail', checked_from: 'ssh', summary: 'خدمة wedding-planner.service غير ظاهرة', facts: []};
      const status = unit.active === 'active' ? 'ok' : unit.active === 'activating' ? 'warn' : 'fail';
      return {verification_status: status, checked_from: 'ssh', summary: `service: ${unit.active}/${unit.sub}`, facts: [`unit: ${unit.unit}`, `description: ${unit.description}`]};
    },
    'wapy-app': () => {
      const row = dockerByName['wapydev-app'];
      if (!row) return {verification_status: 'fail', checked_from: 'ssh', summary: 'حاوية wapydev-app غير ظاهرة', facts: []};
      return {verification_status: row.status.toLowerCase().includes('up') ? 'ok' : 'warn', checked_from: 'ssh', summary: row.status, facts: ['container: wapydev-app']};
    },
    'wapy-cron': () => {
      const row = dockerByName['wapydev-cron'];
      if (!row) return {verification_status: 'fail', checked_from: 'ssh', summary: 'حاوية wapydev-cron غير ظاهرة', facts: []};
      return {verification_status: row.status.toLowerCase().includes('up') ? 'ok' : 'warn', checked_from: 'ssh', summary: row.status, facts: ['container: wapydev-cron']};
    },
    'wapy-db': () => {
      const row = dockerByName['wapydev-db'];
      if (!row) return {verification_status: 'fail', checked_from: 'ssh', summary: 'حاوية wapydev-db غير ظاهرة', facts: []};
      return {verification_status: row.status.toLowerCase().includes('up') ? 'ok' : 'warn', checked_from: 'ssh', summary: row.status, facts: ['container: wapydev-db']};
    },
    'argaz-gateway': () => {
      const unit = systemdByUnit['openclaw-gateway.service'];
      if (!unit) return {verification_status: 'fail', checked_from: 'ssh', summary: 'openclaw-gateway.service غير ظاهرة', facts: []};
      return {verification_status: unit.active === 'active' ? 'ok' : 'warn', checked_from: 'ssh', summary: `gateway: ${unit.active}/${unit.sub}`, facts: [`unit: ${unit.unit}`, `description: ${unit.description}`]};
    },
    'chrome-headless': () => {
      const unit = systemdByUnit['chrome-headless.service'];
      if (!unit) return {verification_status: 'fail', checked_from: 'ssh', summary: 'chrome-headless.service غير ظاهرة', facts: []};
      return {verification_status: unit.active === 'active' ? 'ok' : 'warn', checked_from: 'ssh', summary: `service: ${unit.active}/${unit.sub}`, facts: [`unit: ${unit.unit}`]};
    },
    'reminders-scheduler': () => {
      const unit = systemdByUnit['reminders-scheduler.service'];
      if (!unit) return {verification_status: 'fail', checked_from: 'ssh', summary: 'reminders-scheduler.service غير ظاهرة', facts: []};
      return {verification_status: unit.active === 'active' ? 'ok' : 'warn', checked_from: 'ssh', summary: `service: ${unit.active}/${unit.sub}`, facts: [`unit: ${unit.unit}`]};
    },
    'wedding-backup-cron': () => {
      const exists = crontab.includes('/home/argaz/wedding-planner/backup-wedding.sh');
      return {verification_status: exists ? 'ok' : 'fail', checked_from: 'ssh', summary: exists ? 'cron موجود' : 'cron غير موجود', facts: ['pattern: backup-wedding.sh']};
    },
    'wapy-backup-cron': () => {
      const exists = crontab.includes('/opt/wapy') && crontab.includes('./scripts/backup.sh');
      return {verification_status: exists ? 'ok' : 'fail', checked_from: 'ssh', summary: exists ? 'cron موجود' : 'cron غير موجود', facts: ['pattern: /opt/wapy/scripts/backup.sh']};
    },
    'wapy-cleanup-cron': () => {
      const exists = crontab.includes("find /opt/wapy/.backup");
      return {verification_status: exists ? 'ok' : 'fail', checked_from: 'ssh', summary: exists ? 'cron موجود' : 'cron غير موجود', facts: ['pattern: find /opt/wapy/.backup']};
    },
    'gateway-watchdog': () => {
      const exists = crontab.includes('/home/argaz/gateway-watchdog.sh');
      return {verification_status: exists ? 'ok' : 'fail', checked_from: 'ssh', summary: exists ? 'cron موجود' : 'cron غير موجود', facts: ['pattern: gateway-watchdog.sh']};
    },
    'config-backup': () => {
      const exists = crontab.includes('/home/argaz/backup-config.sh');
      return {verification_status: exists ? 'ok' : 'fail', checked_from: 'ssh', summary: exists ? 'cron موجود' : 'cron غير موجود', facts: ['pattern: backup-config.sh']};
    },
    'openclaw-gateway-service': () => {
      const unit = systemdByUnit['openclaw-gateway.service'];
      if (!unit) return {verification_status: 'manual', checked_from: 'ssh', summary: 'الوحدة غير ظاهرة في اللقطة الحالية وتبقى موثقة فقط', facts: ['unit: openclaw-gateway.service']};
      return {verification_status: 'manual', checked_from: 'ssh', summary: `وحدة موثقة: ${unit.active}/${unit.sub}`, facts: [`unit: ${unit.unit}`, 'runtime health محسوب عبر Argaz Gateway لتجنب التكرار']};
    },
    'tailscale-vpn': () => {
      if (!tailscale.ok) {
        return {verification_status: 'warn', checked_from: 'command', summary: 'tailscale CLI غير متاح في هذه الجلسة؛ تعذر تشغيل التحقق الآلي للـ VPN', facts: ['الحالة ليست فشل شبكة مؤكدًا بل تعذر في بيئة الفحص المحلية']};
      }
      return {verification_status: 'ok', checked_from: 'command', summary: 'tailscale CLI متاح ويعيد عناوين محلية', facts: tailscale.stdout.split('\n').filter(Boolean).slice(0, 2).map(x => `ip: ${x}`)};
    }
  };

  for (const service of services) {
    const previousRecord = previous?.service?.[service.id];
    const patch = serverSnapshot.ok && matchers[service.id]
      ? matchers[service.id]()
      : {verification_status: 'warn', checked_from: 'ssh', summary: serverSnapshot.error || 'تعذر تشغيل server snapshot', facts: ['فشل checker لا يعني فشل الخدمة نفسها']};
    records[service.id] = buildRecord('service', service.id, previousRecord, patch, `${STALE_DAYS.service}d`);
  }
  return records;
}

function checkProjects(projects, previous, serverPathSnapshot) {
  const records = {};

  for (const project of projects) {
    const previousRecord = previous?.project?.[project.id];
    const facts = [];
    let status = 'manual';
    let summary = 'لا يوجد تحقق آلي كافٍ لهذا المشروع بعد';
    let checkedFrom = 'manual';

    if (project.local_path) {
      checkedFrom = 'filesystem';
      const localExists = fs.existsSync(project.local_path);
      facts.push(`local path: ${localExists ? 'ok' : 'missing'}`);
      if (!localExists) {
        status = 'fail';
        summary = 'المسار المحلي غير موجود';
      } else {
        status = 'ok';
        summary = 'المسار المحلي موجود';
      }
    }

    if (project.server_path) {
      checkedFrom = checkedFrom === 'manual' ? 'ssh' : `${checkedFrom} + ssh`;
      if (!serverPathSnapshot.ok) {
        status = status === 'fail' ? 'fail' : 'warn';
        summary = 'تعذر تأكيد مسار السيرفر الآن';
        facts.push('server path: snapshot unavailable');
      } else {
        const serverOk = serverPathSnapshot.data[project.id] === 'ok';
        facts.push(`server path: ${serverOk ? 'ok' : 'missing'}`);
        if (!serverOk) {
          status = 'fail';
          summary = 'مسار السيرفر غير موجود';
        } else if (status !== 'fail') {
          status = 'ok';
          summary = project.local_path ? 'المساران المحلي والسيرفري مؤكدان' : 'مسار السيرفر موجود';
        }
      }
    }

    if (project.local_path && project.repo_url && fs.existsSync(project.local_path)) {
      checkedFrom = checkedFrom === 'manual' ? 'git' : `${checkedFrom} + git`;
      const remote = safeExec(`git -C ${JSON.stringify(project.local_path)} remote get-url origin`, {timeout: 1200});
      if (remote.ok) {
        const actual = normalizeGitHubRemote(remote.stdout);
        const expected = normalizeGitHubRemote(project.repo_url);
        const matches = actual && expected && actual === expected;
        facts.push(`repo remote: ${matches ? 'ok' : 'mismatch'}`);
        if (!matches && status !== 'fail') {
          status = 'warn';
          summary = 'المسار المحلي موجود لكن remote غير مطابق';
        }
      } else {
        facts.push('repo remote: unknown');
        if (status !== 'fail') {
          status = 'warn';
          summary = 'المشروع موجود محليًا لكن Git remote غير مؤكد';
        }
      }
    }

    if (project.deploy_url) {
      checkedFrom = checkedFrom === 'manual' ? 'http' : `${checkedFrom} + http`;
      const reach = headReachable(project.deploy_url);
      if (reach.ok) {
        facts.push(`deploy: HTTP ${reach.status}`);
        if (status === 'manual') {
          status = 'ok';
          summary = 'رابط النشر متاح';
        }
      } else if (reach.status) {
        facts.push(`deploy: HTTP ${reach.status}`);
        if (status !== 'fail') {
          status = 'warn';
          summary = 'رابط النشر يرد بحالة غير متوقعة';
        }
      } else {
        facts.push('deploy: probe inconclusive');
        if (status !== 'fail') {
          status = 'warn';
          summary = 'تعذر تأكيد رابط النشر الآن';
        }
      }
    }

    if (!project.local_path && !project.server_path && !project.deploy_url && !project.repo_url) {
      facts.push('project: static documentation only');
    }

    records[project.id] = buildRecord('project', project.id, previousRecord, {
      verification_status: status,
      checked_from: checkedFrom,
      summary,
      facts
    }, `${STALE_DAYS.project || 14}d`);
  }

  return records;
}

function normalizeGitHubRemote(url) {
  if (!url) return null;
  return String(url)
    .trim()
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
}

function checkTools(tools, projects, previous) {
  const records = {};
  const settingsText = safeExec(`cat ${JSON.stringify(path.join(os.homedir(), '.claude', 'settings.json'))}`);
  const codexConfig = safeExec(`cat ${JSON.stringify(path.join(os.homedir(), '.codex', 'config.toml'))}`);

  for (const tool of tools) {
    const previousRecord = previous?.tool?.[tool.id];
    let patch = {verification_status: 'manual', checked_from: 'manual', summary: 'لا يوجد checker آلي مباشر لهذا النوع بعد', facts: []};

    if (tool.id === 'codex-cli') {
      const configPaths = (tool.config_paths || []).map(expandHome);
      const missing = configPaths.filter(p => !fs.existsSync(p));
      patch = {
        verification_status: missing.length ? 'warn' : 'ok',
        checked_from: 'filesystem',
        summary: missing.length ? `ملفات ناقصة: ${missing.length}` : 'ملفات Codex الأساسية موجودة',
        facts: [
          `path: ${fs.existsSync(expandHome(tool.path)) ? 'ok' : 'missing'}`,
          `config paths: ${configPaths.length - missing.length}/${configPaths.length}`,
          codexConfig.ok && codexConfig.stdout.includes('model = "gpt-5.4"') ? 'model: gpt-5.4 confirmed' : 'model: not confirmed'
        ]
      };
    } else if (tool.id === 'claude-code') {
      const rootPath = expandHome(tool.path);
      const configPaths = (tool.config_paths || []).map(expandHome);
      const missing = configPaths.filter(p => !fs.existsSync(p));
      patch = {
        verification_status: missing.length ? 'warn' : 'ok',
        checked_from: 'filesystem',
        summary: missing.length ? `ملفات/مسارات ناقصة: ${missing.length}` : 'ملفات Claude الأساسية موجودة',
        facts: [
          `root: ${fs.existsSync(rootPath) ? 'ok' : 'missing'}`,
          `agents: ${countDirEntries(path.join(rootPath, 'agents'))}`,
          `commands: ${countDirEntries(path.join(rootPath, 'commands'))}`,
          settingsText.ok && settingsText.stdout.includes('"enabledPlugins"') ? 'settings.json confirmed' : 'settings.json unreadable'
        ]
      };
    } else if (tool.id === 'meta-mcp-tool') {
      const targetPath = expandHome(tool.path);
      if (!fs.existsSync(targetPath)) {
        patch = {
          verification_status: 'fail',
          checked_from: 'filesystem',
          summary: 'المسار غير موجود',
          facts: [`path: ${targetPath}`]
        };
      } else {
      const gitCheck = safeExec(`git -C ${JSON.stringify(targetPath)} rev-parse --is-inside-work-tree`, {timeout: 1200});
      patch = {
        verification_status: gitCheck.ok ? 'ok' : 'warn',
        checked_from: 'filesystem',
        summary: gitCheck.ok ? 'المسار موجود وهو مستودع Git' : 'المسار موجود لكن Git غير مؤكد',
        facts: [
          `path: ${targetPath}`,
          `git: ${gitCheck.ok ? 'ok' : 'unknown'}`
        ]
      };
      }
    } else if (tool.id === 'github-tool') {
      const candidates = projects.filter(p => p.repo_url && p.local_path && fs.existsSync(p.local_path));
      const confirmed = [];
      for (const project of candidates) {
        const remote = safeExec(`git -C ${JSON.stringify(project.local_path)} remote get-url origin`, {timeout: 1200});
        if (!remote.ok) continue;
        const actual = normalizeGitHubRemote(remote.stdout);
        const expected = normalizeGitHubRemote(project.repo_url);
        if (actual && expected && actual === expected) confirmed.push(project.name);
      }
      patch = confirmed.length
        ? {
            verification_status: 'ok',
            checked_from: 'git',
            summary: `تم تأكيد ${confirmed.length} remote محليًا على GitHub`,
            facts: confirmed.slice(0, 5).map(x => `repo: ${x}`)
          }
        : {
            verification_status: 'manual',
            checked_from: 'git',
            summary: 'لم يتم تأكيد أي remote محلي مطابق الآن؛ يلزم تحقق يدوي أو توسيع الجرد',
            facts: [`candidates: ${candidates.length}`]
          };
    } else if (tool.id === 'tailscale-tool') {
      const tailscale = safeExec('command -v tailscale && tailscale ip -4');
      patch = {
        verification_status: tailscale.ok ? 'ok' : 'warn',
        checked_from: 'command',
        summary: tailscale.ok ? 'tailscale command available locally' : 'tailscale command غير متاح من هذه الجلسة',
        facts: tailscale.ok ? tailscale.stdout.split('\n').filter(Boolean).slice(0, 2).map(x => `ip: ${x}`) : ['غياب CLI لا يعني تعطل الشبكة نفسها']
      };
    } else if ((tool.links && Object.values(tool.links).length)) {
      patch = {
        verification_status: 'manual',
        checked_from: 'link',
        summary: 'يوجد رابط معروف لكن لم يُربط checker خاص بعد',
        facts: [`links: ${Object.values(tool.links).length}`]
      };
    }

    records[tool.id] = buildRecord('tool', tool.id, previousRecord, patch, `${STALE_DAYS.tool}d`);
  }
  return records;
}

function checkCloud(cloudItems, previous, serverSnapshot) {
  const records = {};
  const tailscale = safeExec('command -v tailscale && tailscale ip -4');
  const iCloudRoot = path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
  const telegramChannel = path.join(os.homedir(), '.claude', 'channels', 'telegram');
  const networkCheckIds = new Set(['github','supabase','vercel','railway','meta-business','airtable','hostinger','trongrid','coingecko','heroku']);

  for (const cloud of cloudItems) {
    const previousRecord = previous?.cloud?.[cloud.id];
    let patch = {verification_status: 'manual', checked_from: 'manual', summary: 'لا يوجد checker آلي مباشر لهذا العنصر بعد', facts: []};

    if (cloud.id === 'contabo-vps') {
      patch = serverSnapshot.ok
        ? {verification_status: 'ok', checked_from: 'ssh', summary: `ssh reachable on ${serverSnapshot.data.hostname}`, facts: ['ssh: ok', 'runtime host confirmed']}
        : {verification_status: 'fail', checked_from: 'ssh', summary: serverSnapshot.error || 'ssh failed', facts: []};
    } else if (cloud.id === 'icloud-drive') {
      patch = {
        verification_status: fs.existsSync(iCloudRoot) ? 'ok' : 'fail',
        checked_from: 'filesystem',
        summary: fs.existsSync(iCloudRoot) ? 'iCloud Drive root موجود' : 'iCloud Drive root غير موجود',
        facts: [`path: ${iCloudRoot}`]
      };
    } else if (cloud.id === 'tailscale') {
      patch = {
        verification_status: tailscale.ok ? 'ok' : 'warn',
        checked_from: 'command',
        summary: tailscale.ok ? 'tailscale command available locally' : 'tailscale command غير متاح من الجلسة',
        facts: tailscale.ok ? tailscale.stdout.split('\n').filter(Boolean).slice(0, 2).map(x => `ip: ${x}`) : ['غياب CLI لا يؤكد تعطل Tailscale']
      };
    } else if (cloud.id === 'telegram') {
      patch = {
        verification_status: 'manual',
        checked_from: fs.existsSync(telegramChannel) ? 'filesystem' : 'manual',
        summary: fs.existsSync(telegramChannel) ? 'تم تأكيد مسار قناة Claude Telegram فقط؛ الطبقة الأوسع تحتاج تحققًا منفصلًا' : 'يتطلب تحققًا يدويًا/توكن',
        facts: fs.existsSync(telegramChannel) ? [`path: ${telegramChannel}`] : []
      };
    } else if (cloud.lk && networkCheckIds.has(cloud.id)) {
      const reach = headReachable(cloud.lk);
      let status = cloud.active === false ? 'warn' : 'warn';
      let summary = reach.error || 'probe غير حاسم';
      if (reach.ok) {
        status = cloud.active === false ? 'warn' : 'ok';
        summary = `HTTP ${reach.status}`;
      } else if (reach.status) {
        status = 'warn';
        summary = `HTTP ${reach.status}`;
      } else {
        status = 'warn';
      }
      patch = {
        verification_status: status,
        checked_from: 'http',
        summary,
        facts: [`url: ${cloud.lk}`]
      };
    } else if (cloud.lk) {
      patch = {
        verification_status: 'manual',
        checked_from: 'link',
        summary: 'يوجد رابط معروف لكن لا يوجد checker مباشر لهذا النوع بعد',
        facts: [`url: ${cloud.lk}`]
      };
    }

    records[cloud.id] = buildRecord('cloud', cloud.id, previousRecord, patch, `${STALE_DAYS.cloud}d`);
  }
  return records;
}

function coverageFor(records) {
  const values = Object.values(records);
  return {
    total: values.length,
    ok: values.filter(x => x.verification_status === 'ok').length,
    warn: values.filter(x => x.verification_status === 'warn').length,
    fail: values.filter(x => x.verification_status === 'fail').length,
    manual: values.filter(x => x.verification_status === 'manual').length,
    unknown: values.filter(x => x.verification_status === 'unknown').length
  };
}

function main() {
  const {PRJ, SVC, TL, CLD} = loadData();
  const previous = readPreviousRuntime();
  const serverSnapshot = buildServerSnapshot();
  const serverPathSnapshot = buildServerPathSnapshot(PRJ);
  const project = checkProjects(PRJ, previous, serverPathSnapshot);
  const service = checkServices(SVC, previous, serverSnapshot);
  const tool = checkTools(TL, PRJ, previous);
  const cloud = checkCloud(CLD, previous, serverSnapshot);

  const payload = {
    version: 1,
    checker: 'runtime-sync.js',
    generated_at: NOW,
    project,
    service,
    tool,
    cloud,
    coverage: {
      project: coverageFor(project),
      service: coverageFor(service),
      tool: coverageFor(tool),
      cloud: coverageFor(cloud)
    }
  };

  writeRuntime(payload);
  process.stdout.write(JSON.stringify(payload.coverage, null, 2) + '\n');
}

main();
