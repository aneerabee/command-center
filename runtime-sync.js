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
const TAILSCALE_SSH_HOST = 'argaz@100.116.69.101';

function loadData() {
  const code = fs.readFileSync(DATA_FILE, 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${code}\nresult = { PRJ, SVC, TL, CLD, BOT, ARC, IDEAS, AUTO, DATA_TRUST_MODEL };`, context);
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

function confirmedGitHubProjects(projects) {
  const confirmed = [];
  const candidates = projects.filter(p => p.repo_url && p.local_path && fs.existsSync(p.local_path));
  for (const project of candidates) {
    const remote = safeExec(`git -C ${JSON.stringify(project.local_path)} remote get-url origin`, {timeout: 1200});
    if (!remote.ok) continue;
    const actual = normalizeGitHubRemote(remote.stdout);
    const expected = normalizeGitHubRemote(project.repo_url);
    if (actual && expected && actual === expected) confirmed.push(project.name);
  }
  return confirmed;
}

function tailscaleReachable() {
  const result = safeExec(`ssh -i ${JSON.stringify(SSH_KEY)} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=6 ${TAILSCALE_SSH_HOST} 'hostname'`, {timeout: 12000});
  if (!result.ok || !result.stdout) {
    return {ok: false, summary: 'تعذر تأكيد الوصول عبر عنوان Tailscale', facts: [result.stderr || result.stdout || 'ssh via Tailscale failed']};
  }
  return {ok: true, summary: `Tailscale SSH reachable on ${String(result.stdout).trim()}`, facts: [`host: ${String(result.stdout).trim()}`]};
}

function readClaudeSettings() {
  const file = path.join(os.homedir(), '.claude', 'settings.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function hasClaudePermission(settings, pattern) {
  const allow = settings?.permissions?.allow || [];
  return allow.some(entry => String(entry).includes(pattern));
}

function serverPathExists(serverPath) {
  if (!serverPath) return {ok: false, summary: 'no path', facts: []};
  const normalized = serverPath.replace(/^server:/, '');
  const remotePath = normalized.startsWith('~/') ? `$HOME/${normalized.slice(2)}` : normalized;
  const cmd = `ssh -i ${JSON.stringify(SSH_KEY)} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=6 ${SSH_HOST} 'if [ -e ${JSON.stringify(remotePath)} ]; then echo ok; else echo missing; fi'`;
  const result = safeExec(cmd, {timeout: 12000});
  if (!result.ok) return {ok: false, summary: 'ssh path check failed', facts: [result.stderr || result.stdout || 'ssh failed']};
  return String(result.stdout).trim() === 'ok'
    ? {ok: true, summary: 'path exists', facts: [`path: ${remotePath}`]}
    : {ok: false, summary: 'path missing', facts: [`path: ${remotePath}`]};
}

function headReachable(url) {
  const result = safeExec(`curl -L -I --connect-timeout 2 --max-time 2 --silent --show-error --output /dev/null --write-out '%{http_code}' ${JSON.stringify(url)}`);
  if (!result.ok) return {ok: false, status: 0, error: result.stderr || result.stdout || 'curl failed'};
  const status = Number(result.stdout || 0);
  if (status === 405) {
    const fallback = safeExec(`curl -L --connect-timeout 2 --max-time 3 --silent --show-error --output /dev/null --write-out '%{http_code}' ${JSON.stringify(url)}`);
    const fallbackStatus = Number(fallback.stdout || 0);
    if (fallback.ok && fallbackStatus) return {ok: fallbackStatus >= 200 && fallbackStatus < 400, status: fallbackStatus};
  }
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
  const dockerStatus = (name) => {
    const row = dockerByName[name];
    if (!row) return {verification_status: 'fail', checked_from: 'ssh', summary: `حاوية ${name} غير ظاهرة`, facts: [`container: ${name}`]};
    return {
      verification_status: row.status.toLowerCase().includes('up') ? 'ok' : 'warn',
      checked_from: 'ssh',
      summary: row.status,
      facts: [`container: ${name}`]
    };
  };
  const systemdStatus = (unitName) => {
    const unit = systemdByUnit[unitName];
    if (!unit) return {verification_status: 'fail', checked_from: 'ssh', summary: `${unitName} غير ظاهرة`, facts: [`unit: ${unitName}`]};
    return {
      verification_status: unit.active === 'active' ? 'ok' : 'warn',
      checked_from: 'ssh',
      summary: `unit: ${unit.active}/${unit.sub}`,
      facts: [`unit: ${unit.unit}`, `description: ${unit.description}`]
    };
  };
  const launchdStatus = (label) => {
    const uid = process.getuid ? process.getuid() : '';
    const result = safeExec(`launchctl print gui/${uid}/${label}`, {timeout: 4000});
    if (!result.ok) return {verification_status: 'warn', checked_from: 'launchd', summary: `${label} غير محمل في launchd`, facts: [result.stderr || result.stdout || 'launchctl failed']};
    const lastExit = String(result.stdout || '').match(/last exit code = (\d+)/)?.[1];
    const interval = String(result.stdout || '').match(/run interval = (\d+) seconds/)?.[1];
    return {
      verification_status: lastExit === '0' ? 'ok' : 'warn',
      checked_from: 'launchd',
      summary: `loaded, last exit ${lastExit || 'unknown'}`,
      facts: [`label: ${label}`, interval ? `interval: ${interval}s` : 'interval: unknown']
    };
  };

  const matchers = {
    'libya-web': () => systemdStatus('libya-web.service'),
    'adreem-bot-svc': () => systemdStatus('adreem-bot.service'),
    'adreem-api': () => systemdStatus('adreem-api.service'),
    'cc-runtime-publish': () => launchdStatus('com.rabeeshaban.command-center-runtime-publish'),
    'wapy-app': () => {
      return dockerStatus('wapydev-app');
    },
    'brixtravel-caddy': () => {
      return dockerStatus('brixtravel-caddy');
    },
    'wapy-cron': () => {
      return dockerStatus('wapydev-cron');
    },
    'wapy-db': () => {
      return dockerStatus('wapydev-db');
    },
    'dr-muhsen-svc': () => {
      return dockerStatus('dr-muhsen');
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
      if (!unit) return {verification_status: 'warn', checked_from: 'ssh', summary: 'الوحدة غير ظاهرة في اللقطة الحالية', facts: ['unit: openclaw-gateway.service']};
      const status = ['active', 'activating'].includes(unit.active) ? 'ok' : 'warn';
      return {verification_status: status, checked_from: 'ssh', summary: `unit: ${unit.active}/${unit.sub}`, facts: [`unit: ${unit.unit}`, 'health التفصيلي يُفهم من Argaz Gateway runtime لتجنب التكرار']};
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

function checkTools(tools, projects, previous, tailscale) {
  const records = {};
  const settingsText = safeExec(`cat ${JSON.stringify(path.join(os.homedir(), '.claude', 'settings.json'))}`);
  const claudeSettings = readClaudeSettings();
  const codexConfig = safeExec(`cat ${JSON.stringify(path.join(os.homedir(), '.codex', 'config.toml'))}`);
  const githubConfirmed = confirmedGitHubProjects(projects);
  if (tailscale === undefined) tailscale = tailscaleReachable();
  const mcpPermissionMap = {
    'notion-mcp':'mcp__claude_ai_Notion__',
    'perplexity-mcp':'mcp__perplexity__',
    'filesystem-mcp':'mcp__filesystem__',
    'memory-mcp':'mcp__memory__',
    'sequential-thinking-mcp':'mcp__sequential-thinking__',
    'firecrawl-mcp':'mcp__firecrawl__',
    'magic-mcp':'mcp__magic__',
    'supabase-mcp':'mcp__supabase__',
    'railway-mcp':'mcp__railway__'
  };

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
      patch = githubConfirmed.length
        ? {
            verification_status: 'ok',
            checked_from: 'git',
            summary: `تم تأكيد ${githubConfirmed.length} remote محليًا على GitHub`,
            facts: githubConfirmed.slice(0, 6).map(x => `repo: ${x}`)
          }
        : {
            verification_status: 'manual',
            checked_from: 'git',
            summary: 'لم يتم تأكيد أي remote محلي مطابق الآن؛ يلزم تحقق يدوي أو توسيع الجرد',
            facts: ['no confirmed local remotes']
          };
    } else if (tool.id === 'runtime-sync-system') {
      const configPaths = (tool.config_paths || []).map(expandHome);
      const missing = configPaths.filter(p => !fs.existsSync(p));
      const launchLabel = 'com.rabeeshaban.command-center-runtime-publish';
      const launchCheck = safeExec(`launchctl print gui/${process.getuid()}/${launchLabel}`, {timeout: 4000});
      patch = {
        verification_status: !missing.length && launchCheck.ok ? 'ok' : 'warn',
        checked_from: 'filesystem + launchd',
        summary: !missing.length && launchCheck.ok ? 'ملفات النظام موجودة وLaunchAgent محمّل' : 'بعض ملفات النظام أو حالة launchd غير مؤكدة',
        facts: [
          `config paths: ${configPaths.length - missing.length}/${configPaths.length}`,
          `launchd: ${launchCheck.ok ? 'loaded' : 'not confirmed'}`
        ].concat(missing.length ? missing.slice(0, 3).map(x => `missing: ${x}`) : [])
      };
    } else if (tool.id === 'tailscale-tool') {
      patch = {
        verification_status: tailscale.ok ? 'ok' : 'warn',
        checked_from: 'ssh via tailscale',
        summary: tailscale.summary,
        facts: tailscale.facts
      };
    } else if (mcpPermissionMap[tool.id]) {
      const allowed = hasClaudePermission(claudeSettings, mcpPermissionMap[tool.id]);
      patch = {
        verification_status: allowed ? 'ok' : 'warn',
        checked_from: 'claude settings permissions',
        summary: allowed ? 'تم تأكيد صلاحية MCP في إعدادات Claude الحالية' : 'لم يتم العثور على صلاحية MCP داخل settings.json',
        facts: [`permission pattern: ${mcpPermissionMap[tool.id]}`]
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

function checkCloud(cloudItems, previous, serverSnapshot, tailscale, projects) {
  const records = {};
  if (tailscale === undefined) tailscale = tailscaleReachable();
  const iCloudRoot = path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
  const telegramChannel = path.join(os.homedir(), '.claude', 'channels', 'telegram');
  const claudeSettings = readClaudeSettings();
  const githubConfirmed = confirmedGitHubProjects(projects || loadData().PRJ);
  const networkCheckIds = new Set(['github','supabase','vercel','railway','meta-business','airtable','hostinger','trongrid','coingecko','heroku']);
  const linkedCloudPermissionMap = {
    notion:'mcp__claude_ai_Notion__',
    perplexity:'mcp__perplexity__',
    firecrawl:'mcp__firecrawl__'
  };

  for (const cloud of cloudItems) {
    const previousRecord = previous?.cloud?.[cloud.id];
    let patch = {verification_status: 'manual', checked_from: 'manual', summary: 'لا يوجد checker آلي مباشر لهذا العنصر بعد', facts: []};

    if (cloud.id === 'contabo-vps') {
      patch = serverSnapshot.ok
        ? {verification_status: 'ok', checked_from: 'ssh', summary: `ssh reachable on ${serverSnapshot.data.hostname}`, facts: ['ssh: ok', 'runtime host confirmed']}
        : {verification_status: 'fail', checked_from: 'ssh', summary: serverSnapshot.error || 'ssh failed', facts: []};
    } else if (cloud.id === 'github') {
      patch = githubConfirmed.length
        ? {verification_status: 'ok', checked_from: 'git', summary: `تم تأكيد ${githubConfirmed.length} repo محليًا`, facts: githubConfirmed.slice(0, 6).map(x => `repo: ${x}`)}
        : {verification_status: 'warn', checked_from: 'git', summary: 'تعذر تأكيد repos محلية مطابقة في هذه الجولة', facts: ['GitHub platform نفسها لم تُفحص عبر API مباشر']};
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
        checked_from: 'ssh via tailscale',
        summary: tailscale.summary,
        facts: tailscale.facts
      };
    } else if (cloud.id === 'telegram') {
      patch = {
        verification_status: fs.existsSync(telegramChannel) && hasClaudePermission(claudeSettings, 'mcp__plugin_telegram_telegram__') ? 'ok' : 'warn',
        checked_from: 'filesystem + claude settings',
        summary: fs.existsSync(telegramChannel) ? 'قناة Telegram المحلية وصلاحية Claude مؤكدة' : 'المسار المحلي لقناة Telegram غير مؤكد',
        facts: fs.existsSync(telegramChannel) ? [`path: ${telegramChannel}`,'permission: mcp__plugin_telegram_telegram__'] : ['channel path missing']
      };
    } else if (linkedCloudPermissionMap[cloud.id]) {
      const allowed = hasClaudePermission(claudeSettings, linkedCloudPermissionMap[cloud.id]);
      patch = {
        verification_status: allowed ? 'ok' : 'warn',
        checked_from: 'claude settings permissions',
        summary: allowed ? 'تم تأكيد ربط هذا العنصر عبر صلاحيات Claude الحالية' : 'لم يتم العثور على صلاحية الربط في settings.json',
        facts: [`permission pattern: ${linkedCloudPermissionMap[cloud.id]}`]
      };
    } else if (cloud.lk && networkCheckIds.has(cloud.id)) {
      const reach = headReachable(cloud.lk);
      let status = 'warn';
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

function checkBots(bots, previous, serverSnapshot) {
  const records = {};
  const claudeSettings = readClaudeSettings();
  const systemdByUnit = Object.fromEntries(((serverSnapshot.data || {}).systemd_user || []).map(x => [x.unit, x]));

  for (const bot of bots) {
    const previousRecord = previous?.bot?.[bot.id];
    let patch = {verification_status: 'manual', checked_from: 'manual', summary: 'لا يوجد checker آلي مباشر لهذا البوت بعد', facts: []};

    if (bot.id === 'tron-address-bot') {
      const targetPath = expandHome(bot.path);
      patch = {
        verification_status: fs.existsSync(targetPath) ? 'ok' : 'warn',
        checked_from: 'filesystem',
        summary: fs.existsSync(targetPath) ? 'المسار المحلي للبوت موجود' : 'المسار المحلي للبوت غير مؤكد',
        facts: [`path: ${targetPath}`]
      };
    } else if (bot.id === 'bank-bot') {
      const targetPath = expandHome(bot.path);
      patch = {
        verification_status: fs.existsSync(targetPath) ? 'warn' : 'manual',
        checked_from: fs.existsSync(targetPath) ? 'filesystem' : 'manual',
        summary: fs.existsSync(targetPath) ? 'الكود المؤرشف موجود محليًا لكن التشغيل نفسه متوقف' : 'العنصر مؤرشف ويحتاج مراجعة يدوية',
        facts: fs.existsSync(targetPath) ? [`path: ${targetPath}`] : []
      };
    } else if (bot.id === 'argaz-bot') {
      const pathCheck = serverPathExists(bot.path);
      const unit = systemdByUnit['openclaw-gateway.service'];
      const active = unit && ['active','activating'].includes(unit.active);
      patch = {
        verification_status: pathCheck.ok && active ? 'ok' : 'warn',
        checked_from: 'ssh',
        summary: pathCheck.ok && active ? `runtime path ok · gateway ${unit.active}/${unit.sub}` : 'بعض طبقات runtime غير مؤكدة بالكامل',
        facts: [...pathCheck.facts, unit ? `gateway: ${unit.active}/${unit.sub}` : 'gateway unit missing']
      };
    } else if (bot.id === 'claude-code-bot') {
      const targetPath = expandHome(bot.path);
      const allowed = hasClaudePermission(claudeSettings, 'mcp__plugin_telegram_telegram__');
      patch = {
        verification_status: fs.existsSync(targetPath) && allowed ? 'ok' : 'warn',
        checked_from: 'filesystem + claude settings',
        summary: fs.existsSync(targetPath) && allowed ? 'قناة Telegram وصلاحيتها موجودتان' : 'مسار القناة أو صلاحية plugin غير مؤكدة',
        facts: [`path: ${targetPath}`, `permission: ${allowed ? 'ok' : 'missing'}`]
      };
    }

    records[bot.id] = buildRecord('bot', bot.id, previousRecord, patch, '7d');
  }
  return records;
}

function checkArchive(archives, previous) {
  const records = {};
  for (const item of archives) {
    const previousRecord = previous?.archive?.[item.id];
    let patch = {verification_status: 'manual', checked_from: 'manual', summary: 'مرجع أرشيفي يحتاج مراجعة يدوية', facts: []};
    const itemPath = item.path || '';

    if (itemPath.startsWith('server:')) {
      const pathCheck = serverPathExists(itemPath);
      patch = {
        verification_status: pathCheck.ok ? 'ok' : 'warn',
        checked_from: 'ssh',
        summary: pathCheck.ok ? 'المرجع موجود على السيرفر' : 'المسار المرجعي على السيرفر غير مؤكد',
        facts: pathCheck.facts
      };
    } else if (itemPath.startsWith('iCloud/')) {
      const local = path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs', itemPath.slice('iCloud/'.length));
      patch = {
        verification_status: fs.existsSync(local) ? 'ok' : 'warn',
        checked_from: 'filesystem',
        summary: fs.existsSync(local) ? 'المرجع موجود داخل iCloud Drive' : 'المسار المرجعي داخل iCloud غير مؤكد',
        facts: [`path: ${local}`]
      };
    } else if (itemPath) {
      const local = expandHome(itemPath);
      patch = {
        verification_status: fs.existsSync(local) ? 'ok' : 'warn',
        checked_from: 'filesystem',
        summary: fs.existsSync(local) ? 'المرجع موجود في مساره المحلي' : 'المسار المرجعي المحلي غير مؤكد',
        facts: [`path: ${local}`]
      };
    }

    records[item.id] = buildRecord('archive', item.id, previousRecord, patch, '60d');
  }
  return records;
}

function checkAutomations(autoGroups, previous, serverSnapshot) {
  const records = {};
  for (const group of autoGroups || []) {
    for (const task of group.tasks || []) {
      const id = `${group.host}::${task.name}`;
      const previousRecord = previous?.automation?.[id];
      let patch;
      if (!task.on) {
        patch = {
          verification_status: 'warn',
          checked_from: 'manual',
          summary: task.what?.startsWith('⚠') ? task.what.split('—')[0].trim() : 'مهمة معطّلة عمدًا',
          facts: [`on: false`, `freq: ${task.freq || '—'}`]
        };
      } else if (group.host === 'desktop') {
        if ((task.path || '').includes('LaunchAgents/') && (task.path || '').endsWith('.plist')) {
          const local = expandHome(task.path);
          const exists = fs.existsSync(local);
          patch = {
            verification_status: exists ? 'ok' : 'warn',
            checked_from: 'filesystem',
            summary: exists ? 'ملف launchd plist موجود محليًا' : 'ملف launchd plist غير موجود',
            facts: [`path: ${local}`, `freq: ${task.freq}`]
          };
        } else {
          patch = {
            verification_status: 'manual',
            checked_from: 'manual',
            summary: 'مهمة محلية تحتاج تحقق يدوي',
            facts: [`path: ${task.path}`, `freq: ${task.freq}`]
          };
        }
      } else if (group.host === 'server') {
        if ((task.path || '').startsWith('server:')) {
          const pathCheck = serverPathExists(task.path);
          patch = {
            verification_status: pathCheck.ok ? 'ok' : 'warn',
            checked_from: 'ssh',
            summary: pathCheck.ok ? 'المسار موجود على السيرفر' : 'المسار غير مؤكد على السيرفر',
            facts: [...pathCheck.facts, `freq: ${task.freq}`]
          };
        } else {
          patch = {
            verification_status: 'manual',
            checked_from: 'manual',
            summary: 'مهمة سيرفر تحتاج تحقق يدوي',
            facts: [`path: ${task.path}`, `freq: ${task.freq}`]
          };
        }
      } else {
        patch = {
          verification_status: 'manual',
          checked_from: 'manual',
          summary: 'مهمة بدون host محدد',
          facts: [`group: ${group.group}`]
        };
      }
      records[id] = buildRecord('automation', id, previousRecord, patch, '7d');
    }
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
  const {PRJ, SVC, TL, CLD, BOT, ARC, AUTO} = loadData();
  const previous = readPreviousRuntime();
  const serverSnapshot = buildServerSnapshot();
  const serverPathSnapshot = buildServerPathSnapshot(PRJ);
  // Hoist the heavy tailscale probe out of per-section checkers (was called 2x).
  const tailscale = tailscaleReachable();
  const project = checkProjects(PRJ, previous, serverPathSnapshot);
  const service = checkServices(SVC, previous, serverSnapshot);
  const tool = checkTools(TL, PRJ, previous, tailscale);
  const cloud = checkCloud(CLD, previous, serverSnapshot, tailscale, PRJ);
  const bot = checkBots(BOT, previous, serverSnapshot);
  const archive = checkArchive(ARC, previous);
  const automation = checkAutomations(AUTO, previous, serverSnapshot);

  const payload = {
    version: 2,
    checker: 'runtime-sync.js',
    generated_at: NOW,
    project,
    service,
    tool,
    cloud,
    bot,
    archive,
    automation,
    coverage: {
      project: coverageFor(project),
      service: coverageFor(service),
      tool: coverageFor(tool),
      cloud: coverageFor(cloud),
      bot: coverageFor(bot),
      archive: coverageFor(archive),
      automation: coverageFor(automation)
    }
  };

  writeRuntime(payload);
  process.stdout.write(JSON.stringify(payload.coverage, null, 2) + '\n');
}

main();
