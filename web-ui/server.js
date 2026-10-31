const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const { PROFILES, WIZARD_QUESTIONS, resolveSkillsForProfile } = require('../lib/profiles');

const AGENT_PATHS = {
  claude: path.join(os.homedir(), '.claude', 'skills'),
  cursor: path.join(os.homedir(), '.cursor', 'skills-cursor'),
  antigravity: path.join(os.homedir(), '.gemini', 'config', 'skills'),
  gemini: path.join(os.homedir(), '.gemini', 'config', 'skills'),
  codex: path.join(os.homedir(), '.codex', 'skills'),
  qwen: path.join(os.homedir(), '.qwen', 'skills'),
  glm: path.join(os.homedir(), '.zcode', 'skills'),
  zcode: path.join(os.homedir(), '.zcode', 'skills'),
  zencoder: path.join(os.homedir(), '.zencoder', 'skills'),
  windsurf: path.join(os.homedir(), '.codeium', 'windsurf', 'skills'),
  openhands: path.join(os.homedir(), '.openhands', 'skills'),
  cline: path.join(os.homedir(), '.cline', 'skills'),
  roo: path.join(os.homedir(), '.roo', 'skills'),
  trae: path.join(os.homedir(), '.trae', 'skills'),
  copilot: path.join(os.homedir(), '.copilot', 'skills'),
  continue: path.join(os.homedir(), '.continue', 'skills'),
  kiro: path.join(os.homedir(), '.kiro', 'skills'),
  adal: path.join(os.homedir(), '.adal', 'skills'),
  pochi: path.join(os.homedir(), '.pochi', 'skills'),
  openclaw: path.join(os.homedir(), '.openclaw', 'skills')
};

function getRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    execSync(`node "${path.join(ROOT_DIR, 'scripts', 'build-registry.js')}"`, { stdio: 'inherit' });
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function getAgentStatus() {
  const result = {};
  for (const [agent, p] of Object.entries(AGENT_PATHS)) {
    const exists = fs.existsSync(p);
    let installed = [];
    if (exists) {
      try {
        const items = fs.readdirSync(p, { withFileTypes: true });
        installed = items.filter(d => d.isDirectory() || d.isSymbolicLink()).map(d => d.name);
      } catch {}
    }
    result[agent] = {
      path: p,
      active: exists,
      count: installed.length,
      installed
    };
  }
  return result;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // API Routes
  if (pathname === '/api/skills' && req.method === 'GET') {
    return sendJson(res, 200, getRegistry());
  }

  if (pathname === '/api/profiles' && req.method === 'GET') {
    const reg = getRegistry();
    const profileSummaries = Object.keys(PROFILES).map(k => {
      const resolved = resolveSkillsForProfile(reg, k);
      return {
        id: k,
        name: resolved.profile.name,
        icon: resolved.profile.icon,
        tagline: resolved.profile.tagline,
        description: resolved.profile.description,
        count: resolved.count,
        includedCategories: resolved.includedCategories,
        excludedCategories: resolved.excludedCategories.map(c => ({ key: c.key, label: c.label, count: c.count, icon: c.icon })),
        whyExcluded: resolved.profile.whyExcluded
      };
    });
    return sendJson(res, 200, {
      profiles: profileSummaries,
      questions: WIZARD_QUESTIONS
    });
  }

  if (pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, getAgentStatus());
  }

  if (pathname === '/api/install' && req.method === 'POST') {
    try {
      const { skillId, category, profile, answers, all, target = 'all', mode = 'symlink' } = await parseBody(req);
      const reg = getRegistry();
      let toInstall = [];
      let resolvedMeta = null;

      if (profile) {
        resolvedMeta = resolveSkillsForProfile(reg, profile, answers || {});
        toInstall = resolvedMeta.skills;
      } else if (all) {
        toInstall = reg.skills;
      } else if (category) {
        toInstall = reg.skills.filter(s => s.category === category);
      } else if (skillId) {
        const found = reg.skills.find(s => s.id === skillId);
        if (found) toInstall.push(found);
      }

      const targets = (target === 'all')
        ? Object.keys(AGENT_PATHS)
        : target.split(',').map(t => t.trim());

      const targetDirs = new Set(targets.map(t => AGENT_PATHS[t] || path.resolve(t)));
      let installedCount = 0;

      for (const targetDir of targetDirs) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        for (const skill of toInstall) {
          const sourcePath = path.join(ROOT_DIR, skill.relativePath);
          const destPath = path.join(targetDir, skill.id);

          if (fs.existsSync(destPath)) {
            try {
              fs.rmSync(destPath, { recursive: true, force: true });
            } catch {}
          }

          try {
            if (mode === 'symlink') {
              const symType = process.platform === 'win32' ? 'junction' : 'dir';
              fs.symlinkSync(sourcePath, destPath, symType);
            } else {
              fs.cpSync(sourcePath, destPath, { recursive: true });
            }
            installedCount++;
          } catch (e) {
            try {
              fs.cpSync(sourcePath, destPath, { recursive: true });
              installedCount++;
            } catch {}
          }
        }
      }

      return sendJson(res, 200, {
        success: true,
        installedCount,
        skillCount: toInstall.length,
        profileMeta: resolvedMeta ? {
          name: resolvedMeta.profile.name,
          count: resolvedMeta.count,
          excluded: resolvedMeta.excludedCategories.map(c => c.label)
        } : null,
        target,
        status: getAgentStatus()
      });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  if (pathname === '/api/uninstall' && req.method === 'POST') {
    try {
      const { skillId, target = 'claude' } = await parseBody(req);
      const targetDir = AGENT_PATHS[target];
      if (targetDir && fs.existsSync(path.join(targetDir, skillId))) {
        fs.rmSync(path.join(targetDir, skillId), { recursive: true, force: true });
      }
      return sendJson(res, 200, { success: true, status: getAgentStatus() });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  if (pathname.startsWith('/api/skill/') && req.method === 'GET') {
    const skillId = pathname.replace('/api/skill/', '');
    const reg = getRegistry();
    const s = reg.skills.find(x => x.id === skillId);
    if (!s) return sendJson(res, 404, { error: 'Skill not found' });

    const skillMdPath = path.join(ROOT_DIR, s.relativePath, 'SKILL.md');
    let content = '';
    if (fs.existsSync(skillMdPath)) {
      content = fs.readFileSync(skillMdPath, 'utf8');
    }
    return sendJson(res, 200, { ...s, content, fullPath: path.join(ROOT_DIR, s.relativePath) });
  }

  if (pathname.startsWith('/api/skill/') && req.method === 'POST') {
    try {
      const skillId = pathname.replace('/api/skill/', '');
      const { content } = await parseBody(req);
      const reg = getRegistry();
      const s = reg.skills.find(x => x.id === skillId);
      if (!s) return sendJson(res, 404, { error: 'Skill not found' });

      const skillMdPath = path.join(ROOT_DIR, s.relativePath, 'SKILL.md');
      fs.writeFileSync(skillMdPath, content, 'utf8');

      // Rebuild registry
      execSync(`node "${path.join(ROOT_DIR, 'scripts', 'build-registry.js')}"`);
      return sendJson(res, 200, { success: true, message: 'Skill updated successfully' });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  // Static file serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  try {
    const fileContent = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(fileContent);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

const PORT = parseInt(process.argv[2] || process.env.PORT || '3888', 10);
server.listen(PORT, () => {
  console.log(`\n🚀 Skills Hub Dashboard running at http://localhost:${PORT}`);
  console.log(`   Interactive visual skill manager for Claude Code, Cursor, Codex & Agents.\n`);
});
