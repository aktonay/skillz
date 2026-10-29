const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry.json');

const CATEGORY_META = {
  'agent-harness': { label: 'Agent Harness & OS (ECC / Harness²)', icon: '🧠', order: 1 },
  'design': { label: 'UI/UX & Design Systems', icon: '🎨', order: 2 },
  'superpowers': { label: 'Superpowers Methodology (TDD / Plans)', icon: '🦸', order: 3 },
  'efficiency': { label: 'Token Efficiency & Caveman', icon: '⚡', order: 4 },
  'reliability': { label: 'Reliability & Verification', icon: '🛡️', order: 5 },
  'engineering': { label: 'Engineering & Delivery', icon: '⚙️', order: 6 },
  'cloud': { label: 'Google Cloud & Infrastructure', icon: '☁️', order: 7 },
  'cursor-tools': { label: 'Cursor Meta & Workflows', icon: '⚡', order: 8 },
  'development': { label: 'Development & Polish', icon: '🚀', order: 9 },
  'ide-meta': { label: 'IDE Meta & Extensions', icon: '🧭', order: 10 },
  'python-testing': { label: 'Python & QA Automation', icon: '🐍', order: 11 }
};

function parseFrontmatter(content) {
  const result = { data: {}, content: content };
  if (!content.startsWith('---')) return result;
  
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) return result;
  
  const rawYaml = content.substring(3, endIdx).trim();
  result.content = content.substring(endIdx + 4).trim();
  
  const lines = rawYaml.split('\n');
  let currentKey = null;
  let multilineVal = [];

  for (const line of lines) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (match) {
      if (currentKey && multilineVal.length > 0) {
        result.data[currentKey] = multilineVal.join(' ').trim();
        multilineVal = [];
      }
      currentKey = match[1];
      const val = match[2].trim();
      if (val === '>' || val === '|') {
        // multiline
      } else {
        result.data[currentKey] = val.replace(/^["']|["']$/g, '');
      }
    } else if (currentKey && line.startsWith('  ')) {
      multilineVal.push(line.trim());
    }
  }
  if (currentKey && multilineVal.length > 0) {
    result.data[currentKey] = multilineVal.join(' ').trim();
  }
  
  return result;
}

function scanSkillDir(skillPath, cat) {
  const skillName = path.basename(skillPath);
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  let meta = {
    name: skillName,
    description: '',
    license: 'MIT',
    author: 'Community'
  };
  let readmeContent = '';

  if (fs.existsSync(skillMdPath)) {
    try {
      const raw = fs.readFileSync(skillMdPath, 'utf8');
      const parsed = parseFrontmatter(raw);
      if (parsed.data.name) meta.name = parsed.data.name;
      if (parsed.data.description) meta.description = parsed.data.description;
      if (parsed.data.license) meta.license = parsed.data.license;
      readmeContent = parsed.content;
    } catch (e) {
      console.warn(`Error reading ${skillMdPath}:`, e.message);
    }
  }

  // Count files recursively
  let fileCount = 0;
  function countFiles(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name === '.git' || e.name === 'node_modules') continue;
        if (e.isDirectory()) countFiles(path.join(dir, e.name));
        else fileCount++;
      }
    } catch {}
  }
  countFiles(skillPath);

  // Derive tags
  const tags = new Set([cat]);
  const text = `${meta.name} ${meta.description}`.toLowerCase();
  ['react', 'css', 'animation', 'cloud', 'python', 'typescript', 'test', 'review', 'design', 'token', 'spec', 'git', 'cursor', 'claude'].forEach(w => {
    if (text.includes(w)) tags.add(w);
  });

  return {
    id: skillName,
    name: meta.name || skillName,
    category: cat,
    categoryLabel: CATEGORY_META[cat]?.label || cat,
    icon: CATEGORY_META[cat]?.icon || '📦',
    description: meta.description || `Skill for ${skillName} in ${cat}`,
    license: meta.license,
    relativePath: path.relative(ROOT_DIR, skillPath).replace(/\\/g, '/'),
    fileCount,
    hasSkillMd: fs.existsSync(skillMdPath),
    tags: Array.from(tags)
  };
}

function buildRegistry() {
  console.log('Building skills registry...');
  const skills = [];
  const categories = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const cat of categories) {
    const catPath = path.join(SKILLS_DIR, cat);
    const subdirs = fs.readdirSync(catPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const sub of subdirs) {
      const skillPath = path.join(catPath, sub);
      const skill = scanSkillDir(skillPath, cat);
      skills.push(skill);
    }
  }

  // Sort by category order, then name
  skills.sort((a, b) => {
    const orderA = CATEGORY_META[a.category]?.order || 99;
    const orderB = CATEGORY_META[b.category]?.order || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  const registry = {
    name: 'Skills Hub',
    generatedAt: new Date().toISOString(),
    totalSkills: skills.length,
    categories: Object.keys(CATEGORY_META).map(catKey => ({
      key: catKey,
      label: CATEGORY_META[catKey].label,
      icon: CATEGORY_META[catKey].icon,
      count: skills.filter(s => s.category === catKey).length
    })),
    upstreamRepos: [
      { name: 'ECC (Everything Claude Code)', stars: '270k', url: 'https://github.com/affaan-m/ECC' },
      { name: 'Harness² (Recursive Agent Harness)', stars: 'Research', url: 'https://github.com/google-research/harness2' },
      { name: 'caveman (Token Compression)', stars: 'Trending', url: 'https://github.com/JuliusBrussee/caveman' },
      { name: 'superpowers (Agent Workflow Framework)', stars: '45k', url: 'https://github.com/obra/superpowers' },
      { name: 'ui-ux-pro-max-skill', stars: '140.6k', url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill' },
      { name: 'awesome-design-md', stars: '123.6k', url: 'https://github.com/VoltAgent/awesome-design-md' },
      { name: 'open-design', stars: '104.1k', url: 'https://github.com/nexu-io/open-design' },
      { name: 'taste-skill', stars: '102.7k', url: 'https://github.com/senlindesign/taste-skill' },
      { name: 'impeccable', stars: '88.4k', url: 'https://github.com/pbakaus/impeccable' },
      { name: 'react-bits', stars: '50.2k', url: 'https://github.com/DavidHDev/react-bits' },
      { name: 'skills (Emil Kowalski)', stars: '49.7k', url: 'https://github.com/emilkowalski/skills' },
      { name: 'hallmark', stars: '35k', url: 'https://github.com/nutlope/hallmark' },
      { name: 'design.md (Google)', stars: '28.5k', url: 'https://github.com/google-labs-code/design.md' },
      { name: 'magicui', stars: '22.9k', url: 'https://github.com/magicuidesign/magicui' },
      { name: 'gsap-skills', stars: '17.2k', url: 'https://github.com/greensock/gsap-skills' },
      { name: 'scroll-world', stars: '10.5k', url: 'https://github.com/oso95/scroll-world' },
      { name: 'canvas-ui', stars: '5.1k', url: 'https://github.com/DavidHDev/canvas-ui' },
      { name: 'dimensional-drawing', stars: '715', url: 'https://github.com/enesozturk/dimensional-drawing' }
    ],
    skills
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
  console.log(`Registry built successfully: ${skills.length} skills recorded in registry.json`);
}

buildRegistry();
