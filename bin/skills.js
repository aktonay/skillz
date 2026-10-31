#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry.json');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');
const { PROFILES, WIZARD_QUESTIONS, resolveSkillsForProfile } = require('../lib/profiles');

// Helpers for styled output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  bgBlue: '\x1b[44m',
  white: '\x1b[37m'
};

function logHeader(text) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${text} ===${colors.reset}`);
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.log(`${colors.yellow}Registry not found. Building now...${colors.reset}`);
    execSync(`node "${path.join(ROOT_DIR, 'scripts', 'build-registry.js')}"`, { stdio: 'inherit' });
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

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
  openclaw: path.join(os.homedir(), '.openclaw', 'skills'),
  project: path.join(process.cwd(), '.agents', 'skills')
};

// Command: list
function cmdList(categoryFilter) {
  const reg = loadRegistry();
  logHeader(`SKILLS REPOSITORY (${reg.totalSkills} total skills)`);

  let currentCat = null;
  const filtered = categoryFilter
    ? reg.skills.filter(s => s.category.toLowerCase() === categoryFilter.toLowerCase())
    : reg.skills;

  if (filtered.length === 0) {
    console.log(`${colors.yellow}No skills found matching category: "${categoryFilter}".${colors.reset}`);
    console.log(`Available categories: ${reg.categories.map(c => c.key).join(', ')}`);
    return;
  }

  for (const s of filtered) {
    if (s.category !== currentCat) {
      currentCat = s.category;
      const catMeta = reg.categories.find(c => c.key === currentCat);
      console.log(`\n${colors.bold}${catMeta?.icon || '📁'} ${catMeta?.label || currentCat.toUpperCase()} (${catMeta?.count || 0})${colors.reset}`);
      console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    }
    const shortDesc = s.description.length > 75 ? s.description.substring(0, 72) + '...' : s.description;
    console.log(`  ${colors.green}${s.id.padEnd(28)}${colors.reset} ${colors.dim}${shortDesc}${colors.reset}`);
  }
  console.log(`\n${colors.dim}Run 'skills info <name>' for details, or 'skills install <name> --target claude' to install.${colors.reset}\n`);
}

// Command: search
function cmdSearch(query) {
  if (!query) {
    console.log(`${colors.red}Please specify a search query: skills search <keyword>${colors.reset}`);
    return;
  }
  const reg = loadRegistry();
  const q = query.toLowerCase();
  const matches = reg.skills.filter(s => 
    s.id.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  );

  logHeader(`SEARCH RESULTS FOR "${query}" (${matches.length} found)`);
  if (matches.length === 0) {
    console.log(`${colors.yellow}No skills matched your query.${colors.reset}`);
    return;
  }

  for (const s of matches) {
    console.log(`  ${s.icon} ${colors.green}${colors.bold}${s.id}${colors.reset} ${colors.dim}[${s.category}]${colors.reset}`);
    console.log(`     ${s.description}`);
  }
  console.log();
}

// Command: info
function cmdInfo(skillName) {
  if (!skillName) {
    console.log(`${colors.red}Please specify a skill name: skills info <name>${colors.reset}`);
    return;
  }
  const reg = loadRegistry();
  const s = reg.skills.find(x => x.id.toLowerCase() === skillName.toLowerCase());
  if (!s) {
    console.log(`${colors.red}Skill "${skillName}" not found in registry.${colors.reset}`);
    return;
  }

  const absPath = path.join(ROOT_DIR, s.relativePath);
  const skillMdPath = path.join(absPath, 'SKILL.md');

  logHeader(`SKILL: ${s.name} (${s.id})`);
  console.log(`${colors.bold}Category:${colors.reset}    ${s.icon} ${s.categoryLabel} (${s.category})`);
  console.log(`${colors.bold}License:${colors.reset}     ${s.license || 'MIT'}`);
  console.log(`${colors.bold}Location:${colors.reset}    ${absPath}`);
  console.log(`${colors.bold}Files:${colors.reset}       ${s.fileCount} files`);
  console.log(`${colors.bold}Tags:${colors.reset}        ${s.tags.join(', ')}`);
  console.log(`\n${colors.bold}Description:${colors.reset}\n  ${s.description}`);

  if (fs.existsSync(skillMdPath)) {
    const raw = fs.readFileSync(skillMdPath, 'utf8');
    const preview = raw.length > 600 ? raw.substring(0, 600) + `\n... [${raw.length - 600} more chars. Run 'skills edit ${s.id}' to view full file]` : raw;
    console.log(`\n${colors.bold}SKILL.md Preview:${colors.reset}\n${colors.dim}${preview}${colors.reset}`);
  }
  console.log(`\n${colors.cyan}To install:${colors.reset} skills install ${s.id} --target claude`);
}

function printBanner() {
  console.log(`
${colors.cyan}${colors.bold}  ███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
  ██╔════╝██║ ██╔╝██║██║     ██║     ╚══███╔╝
  ███████╗█████╔╝ ██║██║     ██║       ███╔╝ 
  ╚════██║██╔═██╗ ██║██║     ██║      ███╔╝  
  ███████║██║  ██╗██║███████╗███████╗███████╗
  ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝${colors.reset}
  ${colors.magenta}${colors.bold}⚡ SKILLZ — UNIVERSAL AGENT SKILLS & RUNTIME HARNESS ⚡${colors.reset}
  ${colors.dim}162 Production Skills • Multi-Agent Symlinking • Zero-Drift Pipeline${colors.reset}
`);
}

// Helper: install single skill with deduplication and latest check
function installSingleSkill(skill, targetDir, mode, options = {}) {
  const sourcePath = path.resolve(ROOT_DIR, skill.relativePath);
  const destPath = path.resolve(targetDir, skill.id);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let exists = false;
  let isLink = false;
  let currentTarget = null;

  try {
    const stat = fs.lstatSync(destPath);
    exists = true;
    if (stat.isSymbolicLink() || (process.platform === 'win32' && stat.isDirectory())) {
      try {
        currentTarget = fs.readlinkSync(destPath);
        isLink = true;
      } catch (e) {
        // Not a link, normal dir
      }
    }
  } catch (e) {
    // Does not exist
  }

  // If already pointing to the exact canonical source and force is not requested:
  if (isLink && currentTarget) {
    const resolvedTarget = path.resolve(path.dirname(destPath), currentTarget);
    if (resolvedTarget.toLowerCase() === sourcePath.toLowerCase() && !options.force) {
      return { success: true, status: 'skipped', reason: 'already up-to-date' };
    }
  }

  // Remove existing stale link or folder
  if (exists) {
    try {
      fs.rmSync(destPath, { recursive: true, force: true });
    } catch (e) {
      try { fs.rmSync(destPath, { recursive: true, force: true }); } catch (err) {}
    }
  }

  if (mode === 'symlink') {
    try {
      if (process.platform === 'win32') {
        // Use directory junction on Windows to avoid needing admin privileges
        fs.symlinkSync(sourcePath, destPath, 'junction');
      } else {
        fs.symlinkSync(sourcePath, destPath, 'dir');
      }
      return { success: true, status: exists ? 'updated' : 'installed', method: 'symlink' };
    } catch (e) {
      // Fallback to copy
      fs.cpSync(sourcePath, destPath, { recursive: true });
      return { success: true, status: exists ? 'updated' : 'installed', method: 'copy (symlink fallback)' };
    }
  } else {
    fs.cpSync(sourcePath, destPath, { recursive: true });
    return { success: true, status: exists ? 'updated' : 'installed', method: 'copy' };
  }
}

// Command: install
function cmdInstall(args) {
  let target = 'all';
  let mode = 'symlink';
  let isAll = false;
  let force = false;
  let categoryFilter = null;
  let profileName = null;
  let skillNames = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' || arg === '-t') {
      target = args[++i]?.toLowerCase();
    } else if (arg === '--mode' || arg === '-m') {
      mode = args[++i]?.toLowerCase();
    } else if (arg === '--copy') {
      mode = 'copy';
    } else if (arg === '--force' || arg === '-f' || arg === '--latest') {
      force = true;
    } else if (arg === '--all' || arg === '-a') {
      isAll = true;
    } else if (arg === '--category' || arg === '-c') {
      categoryFilter = args[++i];
    } else if (arg === '--profile' || arg === '-p') {
      profileName = args[++i]?.toLowerCase();
    } else if (!arg.startsWith('-')) {
      skillNames.push(arg);
    }
  }

  const reg = loadRegistry();
  let toInstall = [];

  if (profileName) {
    const profileInfo = PROFILES[profileName];
    if (!profileInfo) {
      console.log(`${colors.red}Unknown role profile: "${profileName}".${colors.reset}`);
      console.log(`Available profiles: ${Object.keys(PROFILES).join(', ')}`);
      console.log(`Run 'skills profiles' or 'skills wizard' for guided setup.`);
      return;
    }
    const resolved = resolveSkillsForProfile(reg, profileName);
    toInstall = resolved.skills;
    console.log(`\n${colors.bold}${profileInfo.icon} Role Profile Selected: ${profileInfo.name}${colors.reset}`);
    console.log(`  ${colors.dim}${profileInfo.description}${colors.reset}`);
    if (resolved.excludedCategories.length > 0) {
      console.log(`  ${colors.yellow}Excluded Categories (skipping bloat):${colors.reset} ${resolved.excludedCategories.map(c => `${c.icon} ${c.label} (${c.count})`).join(', ')}`);
    }
  } else if (isAll || (!categoryFilter && skillNames.length === 0)) {
    toInstall = reg.skills;
  } else if (categoryFilter) {
    toInstall = reg.skills.filter(s => s.category.toLowerCase() === categoryFilter.toLowerCase());
    if (toInstall.length === 0) {
      console.log(`${colors.red}No skills found in category "${categoryFilter}".${colors.reset}`);
      return;
    }
  } else if (skillNames.length > 0) {
    for (const name of skillNames) {
      const match = reg.skills.find(s => s.id.toLowerCase() === name.toLowerCase());
      if (match) toInstall.push(match);
      else console.log(`${colors.yellow}Warning: skill "${name}" not found in registry.${colors.reset}`);
    }
  }

  // Deduplicate skills by ID so duplicate arguments or overlaps are handled cleanly
  const seenSkillIds = new Set();
  toInstall = toInstall.filter(s => {
    if (seenSkillIds.has(s.id)) return false;
    seenSkillIds.add(s.id);
    return true;
  });

  if (toInstall.length === 0) {
    console.log(`${colors.yellow}No valid skills selected for installation.${colors.reset}`);
    return;
  }

  const targets = (target === 'all')
    ? Object.keys(AGENT_PATHS).filter(k => k !== 'project')
    : target.split(',').map(t => t.trim());

  // Deduplicate target paths to avoid double-processing shared paths (e.g. gemini/antigravity or zcode/glm)
  const targetGroups = new Map();
  for (const t of targets) {
    const p = AGENT_PATHS[t] || path.resolve(t);
    const norm = path.resolve(p);
    if (!targetGroups.has(norm)) {
      targetGroups.set(norm, [t]);
    } else {
      targetGroups.get(norm).push(t);
    }
  }

  logHeader(`INSTALLING ${toInstall.length} SKILLS TO ${targetGroups.size} TARGET DIRECTORIES`);

  let totalInstalled = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const [targetDir, agentKeys] of targetGroups.entries()) {
    const targetLabel = agentKeys.map(k => k.toUpperCase()).join(' & ');
    let installed = 0;
    let updated = 0;
    let skipped = 0;

    for (const s of toInstall) {
      const res = installSingleSkill(s, targetDir, mode, { force });
      if (res.status === 'installed') installed++;
      else if (res.status === 'updated') updated++;
      else if (res.status === 'skipped') skipped++;
    }

    totalInstalled += installed;
    totalUpdated += updated;
    totalSkipped += skipped;

    console.log(`  ${colors.green}${colors.bold}✓${colors.reset} [${targetLabel}] ${colors.dim}${targetDir}${colors.reset}`);
    console.log(`    ↳ Newly linked: ${installed} | Updated: ${updated} | Skipped (already latest): ${skipped}`);
  }

  console.log(`\n${colors.green}${colors.bold}SUMMARY:${colors.reset} Processed ${toInstall.length} skills across ${targetGroups.size} agent installations.`);
  console.log(`  - Newly Installed: ${totalInstalled}`);
  console.log(`  - Updated to Latest: ${totalUpdated}`);
  console.log(`  - Skipped (Already Latest): ${totalSkipped}`);
  console.log(`\n${colors.cyan}${colors.bold}ALL COMPLETED:${colors.reset} Skills are active and ready for your agents!${colors.reset}\n`);
}

// Command: status
function cmdStatus() {
  const reg = loadRegistry();
  logHeader('DETECTED AGENT INSTALLATIONS ON THIS PC');

  for (const [agent, agentPath] of Object.entries(AGENT_PATHS)) {
    if (agent === 'project') continue;
    const exists = fs.existsSync(agentPath);
    let installedCount = 0;
    let installedList = [];

    if (exists) {
      try {
        const items = fs.readdirSync(agentPath, { withFileTypes: true });
        installedList = items.filter(d => d.isDirectory() || d.isSymbolicLink()).map(d => d.name);
        installedCount = installedList.length;
      } catch {}
    }

    const statusBadge = exists 
      ? `${colors.green}[ACTIVE: ${installedCount} skills]${colors.reset}`
      : `${colors.dim}[NOT CREATED]${colors.reset}`;

    console.log(`  ${colors.bold}${agent.padEnd(14)}${colors.reset} ${statusBadge} ${colors.dim}${agentPath}${colors.reset}`);
    if (installedCount > 0 && installedCount <= 8) {
      console.log(`    ${colors.dim}Skills: ${installedList.join(', ')}${colors.reset}`);
    } else if (installedCount > 8) {
      console.log(`    ${colors.dim}Skills (${installedCount}): ${installedList.slice(0, 7).join(', ')}... (+${installedCount - 7} more)${colors.reset}`);
    }
  }
  console.log();
}

// Command: new
function cmdNew(skillName, category) {
  if (!skillName) {
    console.log(`${colors.red}Please provide a name for the new skill: skills new <name>${colors.reset}`);
    return;
  }
  const cat = category || 'design';
  const targetDir = path.join(SKILLS_DIR, cat, skillName);

  if (fs.existsSync(targetDir)) {
    console.log(`${colors.red}Skill directory already exists: ${targetDir}${colors.reset}`);
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  const template = `---
name: ${skillName}
description: >
  Describe what this skill does, when to use it, and what standards it enforces.
license: MIT
---

# ${skillName.toUpperCase()} Skill

## Overview
Provide high-level context and rationale here.

## Rules & Guidelines
- Rule 1
- Rule 2

## Usage Examples
\`\`\`bash
# Example command or workflow
\`\`\`
`;

  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), template, 'utf8');
  console.log(`${colors.green}${colors.bold}Created new skill at:${colors.reset} ${targetDir}`);
  console.log(`${colors.dim}Rebuilding registry...${colors.reset}`);
  execSync(`node "${path.join(ROOT_DIR, 'scripts', 'build-registry.js')}"`, { stdio: 'inherit' });
  console.log(`\n${colors.cyan}Edit your new skill:${colors.reset} skills edit ${skillName}`);
}

// Command: edit
function cmdEdit(skillName) {
  if (!skillName) {
    console.log(`${colors.red}Specify skill name: skills edit <name>${colors.reset}`);
    return;
  }
  const reg = loadRegistry();
  const s = reg.skills.find(x => x.id.toLowerCase() === skillName.toLowerCase());
  if (!s) {
    console.log(`${colors.red}Skill "${skillName}" not found.${colors.reset}`);
    return;
  }
  const skillMdPath = path.join(ROOT_DIR, s.relativePath, 'SKILL.md');
  const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'nano');
  
  console.log(`Opening ${skillMdPath} with ${editor}...`);
  try {
    spawn(editor, [skillMdPath], { stdio: 'inherit', detached: true });
  } catch (e) {
    console.log(`${colors.yellow}Could not launch editor automatically. File path:${colors.reset} ${skillMdPath}`);
  }
}

// Command: validate
function cmdValidate(skillName) {
  const reg = loadRegistry();
  const toCheck = skillName 
    ? reg.skills.filter(s => s.id.toLowerCase() === skillName.toLowerCase())
    : reg.skills;

  logHeader(`VALIDATING ${toCheck.length} SKILLS`);
  let errors = 0;

  for (const s of toCheck) {
    const skillPath = path.join(ROOT_DIR, s.relativePath);
    const skillMd = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      console.log(`  ${colors.red}FAIL${colors.reset} ${s.id}: Missing SKILL.md`);
      errors++;
      continue;
    }
    const content = fs.readFileSync(skillMd, 'utf8');
    if (!content.startsWith('---')) {
      console.log(`  ${colors.yellow}WARN${colors.reset} ${s.id}: SKILL.md missing frontmatter delimiters`);
    } else {
      // Good
    }
  }

  if (errors === 0) {
    console.log(`\n${colors.green}${colors.bold}VERDICT: PASS${colors.reset} - All ${toCheck.length} skills validated successfully.\n`);
  } else {
    console.log(`\n${colors.red}${colors.bold}VERDICT: FAIL${colors.reset} - Found ${errors} error(s).\n`);
  }
}

// Command: ui (Launch interactive web dashboard)
function cmdUi(portArg) {
  const port = parseInt(portArg || '3888', 10);
  const serverScript = path.join(ROOT_DIR, 'web-ui', 'server.js');
  if (!fs.existsSync(serverScript)) {
    console.log(`${colors.red}Web UI server script not found at ${serverScript}.${colors.reset}`);
    return;
  }
  console.log(`${colors.bold}${colors.cyan}Starting Skills Visual Dashboard on http://localhost:${port}...${colors.reset}`);
  const srv = spawn('node', [serverScript, port.toString()], { stdio: 'inherit' });
  
  // Attempt to open browser
  setTimeout(() => {
    try {
      const openCmd = process.platform === 'win32' ? `start http://localhost:${port}` : `open http://localhost:${port}`;
      execSync(openCmd);
    } catch {}
  }, 1000);
}

// Command: profiles (List available persona profiles)
function cmdProfiles() {
  logHeader('ROLE PROFILES & SPECIALIZED SKILL SETS');
  console.log(`${colors.dim}Skillz categorizes skills by role so designers don't get testing suites, and QA testers don't get UI design libraries.${colors.reset}\n`);

  for (const [key, p] of Object.entries(PROFILES)) {
    console.log(`${colors.bold}${p.icon} ${p.name.toUpperCase()} (ID: ${colors.cyan}${key}${colors.reset}${colors.bold})${colors.reset}`);
    console.log(`  ${colors.magenta}${p.tagline}${colors.reset}`);
    console.log(`  ${colors.dim}${p.description}${colors.reset}`);
    console.log(`  ${colors.green}Included:${colors.reset} ${p.includedCategories.join(', ')}`);
    if (p.excludedCategories && p.excludedCategories.length > 0) {
      console.log(`  ${colors.yellow}Excluded:${colors.reset} ${p.excludedCategories.join(', ')} (${p.whyExcluded})`);
    }
    console.log(`  ${colors.cyan}Install:${colors.reset}  skills install --profile ${key} --target all`);
    console.log();
  }
}

// Command: wizard / init / setup (Interactive 6-Question Setup Questionnaire)
async function cmdWizard() {
  const reg = loadRegistry();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const lineQueue = [];
  const waiterQueue = [];

  rl.on('line', (line) => {
    if (waiterQueue.length > 0) {
      const resolve = waiterQueue.shift();
      resolve(line);
    } else {
      lineQueue.push(line);
    }
  });

  rl.on('close', () => {
    while (waiterQueue.length > 0) {
      const resolve = waiterQueue.shift();
      resolve('');
    }
  });

  const ask = (query) => new Promise((resolve) => {
    process.stdout.write(query);
    if (lineQueue.length > 0) {
      const line = lineQueue.shift();
      process.stdout.write(line + '\n');
      resolve(line);
    } else {
      waiterQueue.push(resolve);
    }
  });

  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`  ${colors.bold}🧙 SKILLZ INTERACTIVE SETUP WIZARD (6 Questions)${colors.reset}`);
  console.log(`  ${colors.dim}Profile your role, engineering workflow, and target agent environment${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);

  const answers = {};

  try {
    // Question 1: Role
    console.log(`${colors.bold}${colors.cyan}[1/6] Primary Role & Agent Archetype${colors.reset}`);
    console.log(`  What is your primary role or agent archetype?`);
    WIZARD_QUESTIONS[0].options.forEach(opt => {
      console.log(`    ${colors.green}${opt.key})${colors.reset} ${colors.bold}${opt.label}${colors.reset}`);
      console.log(`       ${colors.dim}${opt.desc}${colors.reset}`);
    });
    const ans1 = (await ask(`  ${colors.bold}> Select [1-6] (Default: 5 - Full-Stack): ${colors.reset}`)).trim() || '5';
    const selectedRoleOpt = WIZARD_QUESTIONS[0].options.find(o => o.key === ans1) || WIZARD_QUESTIONS[0].options[4];
    answers.role = selectedRoleOpt.value;
    console.log(`  ${colors.green}✓ Selected:${colors.reset} ${selectedRoleOpt.label}\n`);

    // Question 2: Rigor
    console.log(`${colors.bold}${colors.cyan}[2/6] Engineering Rigor & Verification Strictness${colors.reset}`);
    console.log(`  How strict should the testing, planning, and verification gates be?`);
    WIZARD_QUESTIONS[1].options.forEach(opt => {
      console.log(`    ${colors.green}${opt.key})${colors.reset} ${colors.bold}${opt.label}${colors.reset}`);
      console.log(`       ${colors.dim}${opt.desc}${colors.reset}`);
    });
    const ans2 = (await ask(`  ${colors.bold}> Select [1-3] (Default: 2 - Pragmatic & Agile): ${colors.reset}`)).trim() || '2';
    const selectedRigorOpt = WIZARD_QUESTIONS[1].options.find(o => o.key === ans2) || WIZARD_QUESTIONS[1].options[1];
    answers.rigor = selectedRigorOpt.value;
    console.log(`  ${colors.green}✓ Selected:${colors.reset} ${selectedRigorOpt.label}\n`);

    // Question 3: Compression
    console.log(`${colors.bold}${colors.cyan}[3/6] Token Optimization & Communication Mode${colors.reset}`);
    console.log(`  How should your AI agent communicate and optimize token usage?`);
    WIZARD_QUESTIONS[2].options.forEach(opt => {
      console.log(`    ${colors.green}${opt.key})${colors.reset} ${colors.bold}${opt.label}${colors.reset}`);
      console.log(`       ${colors.dim}${opt.desc}${colors.reset}`);
    });
    const ans3 = (await ask(`  ${colors.bold}> Select [1-2] (Default: 1 - Caveman Token Compression): ${colors.reset}`)).trim() || '1';
    const selectedCompOpt = WIZARD_QUESTIONS[2].options.find(o => o.key === ans3) || WIZARD_QUESTIONS[2].options[0];
    answers.compression = selectedCompOpt.value;
    console.log(`  ${colors.green}✓ Selected:${colors.reset} ${selectedCompOpt.label}\n`);

    // Question 4: Optional Feature Packs
    console.log(`${colors.bold}${colors.cyan}[4/6] Optional Feature Packs${colors.reset}`);
    console.log(`  Select any additional feature packs to include:`);
    WIZARD_QUESTIONS[3].options.forEach(opt => {
      console.log(`    ${colors.green}${opt.key})${colors.reset} ${colors.bold}${opt.label}${colors.reset}`);
      console.log(`       ${colors.dim}${opt.desc}${colors.reset}`);
    });
    const ans4 = (await ask(`  ${colors.bold}> Select comma-separated numbers [1-5] (Default: 5 - None): ${colors.reset}`)).trim() || '5';
    const packKeys = ans4.split(',').map(s => s.trim());
    answers.featurePacks = [];
    packKeys.forEach(k => {
      const match = WIZARD_QUESTIONS[3].options.find(o => o.key === k);
      if (match && match.value !== 'none') answers.featurePacks.push(match.value);
    });
    console.log(`  ${colors.green}✓ Feature Packs:${colors.reset} ${answers.featurePacks.length > 0 ? answers.featurePacks.join(', ') : 'Pure Role Focus'}\n`);

    // Question 5: Target Agents
    console.log(`${colors.bold}${colors.cyan}[5/6] Target AI Coding Agent(s)${colors.reset}`);
    console.log(`  Which AI coding agent(s) do you want to install and sync skills into?`);
    WIZARD_QUESTIONS[4].options.forEach(opt => {
      console.log(`    ${colors.green}${opt.key})${colors.reset} ${colors.bold}${opt.label}${colors.reset} ${colors.dim}${opt.desc}${colors.reset}`);
    });
    const ans5 = (await ask(`  ${colors.bold}> Select [1-6] (Default: 1 - All Detected Agents): ${colors.reset}`)).trim() || '1';
    const selectedTargetOpt = WIZARD_QUESTIONS[4].options.find(o => o.key === ans5) || WIZARD_QUESTIONS[4].options[0];
    answers.target = selectedTargetOpt.value;
    console.log(`  ${colors.green}✓ Selected Target:${colors.reset} ${selectedTargetOpt.label}\n`);

    // Question 6: Sync Strategy
    console.log(`${colors.bold}${colors.cyan}[6/6] Filesystem Link Strategy${colors.reset}`);
    console.log(`  How should skills be installed and synchronized?`);
    WIZARD_QUESTIONS[5].options.forEach(opt => {
      console.log(`    ${colors.green}${opt.key})${colors.reset} ${colors.bold}${opt.label}${colors.reset}`);
      console.log(`       ${colors.dim}${opt.desc}${colors.reset}`);
    });
    const ans6 = (await ask(`  ${colors.bold}> Select [1-2] (Default: 1 - Zero-Drift Symlink / Junction): ${colors.reset}`)).trim() || '1';
    const selectedModeOpt = WIZARD_QUESTIONS[5].options.find(o => o.key === ans6) || WIZARD_QUESTIONS[5].options[0];
    answers.mode = selectedModeOpt.value;
    console.log(`  ${colors.green}✓ Selected Mode:${colors.reset} ${selectedModeOpt.label}\n`);

    // Resolve skills
    const resolved = resolveSkillsForProfile(reg, answers.role, answers);

    console.log(`${colors.cyan}----------------------------------------------------------------------${colors.reset}`);
    console.log(`  ${colors.bold}📋 SETUP WIZARD SUMMARY:${colors.reset}`);
    console.log(`    • Role Archetype:     ${colors.bold}${resolved.profile.icon} ${resolved.profile.name}${colors.reset}`);
    console.log(`    • Selected Skills:    ${colors.green}${colors.bold}${resolved.count} tailored skills${colors.reset}`);
    if (resolved.excludedCategories.length > 0) {
      console.log(`    • Excluded Bloat:     ${colors.yellow}${resolved.excludedCategories.map(c => `${c.label} (${c.count})`).join(', ')}${colors.reset}`);
      console.log(`    • Exclusion Reason:   ${colors.dim}${resolved.profile.whyExcluded}${colors.reset}`);
    }
    console.log(`    • Workflow Rigor:     ${selectedRigorOpt.label}`);
    console.log(`    • Token Optimization: ${selectedCompOpt.label}`);
    console.log(`    • Target Agent(s):    ${selectedTargetOpt.label}`);
    console.log(`    • Link Strategy:      ${selectedModeOpt.label}`);
    console.log(`${colors.cyan}----------------------------------------------------------------------${colors.reset}\n`);

    const confirm = (await ask(`  ${colors.bold}Deploy and install these ${resolved.count} skills now? (Y/n): ${colors.reset}`)).trim().toLowerCase();
    rl.close();

    if (confirm === '' || confirm === 'y' || confirm === 'yes') {
      const installArgs = ['--target', answers.target, '--mode', answers.mode, '--force', '--profile', answers.role];
      cmdInstall(installArgs);
    } else {
      console.log(`\n${colors.yellow}Setup cancelled. You can rerun anytime with 'skills wizard' or install directly with 'skills install --profile <role>'.${colors.reset}\n`);
    }
  } catch (err) {
    rl.close();
    console.log(`${colors.red}Wizard error: ${err.message}${colors.reset}`);
  }
}

// CLI entrypoint router
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';

  if (!args.includes('--quiet') && !args.includes('-q')) {
    printBanner();
  }

  switch (cmd) {
    case 'wizard':
    case 'init':
    case 'setup':
    case 'role':
      await cmdWizard();
      break;
    case 'profiles':
      cmdProfiles();
      break;
    case 'list':
    case 'ls':
      cmdList(args[1]);
      break;
    case 'search':
    case 'find':
      cmdSearch(args[1]);
      break;
    case 'info':
    case 'show':
      cmdInfo(args[1]);
      break;
    case 'install':
    case 'i':
    case 'add':
      cmdInstall(args.slice(1));
      break;
    case 'update':
    case 'upgrade':
      console.log(`${colors.cyan}Synchronizing and updating all skills across all agents...${colors.reset}`);
      execSync(`node "${path.join(ROOT_DIR, 'scripts', 'build-registry.js')}"`, { stdio: 'inherit' });
      cmdInstall(['--all', '--target', 'all', '--force']);
      break;
    case 'latest':
      cmdInstall(['--all', '--target', 'all', '--force']);
      break;
    case 'status':
      cmdStatus();
      break;
    case 'sync':
      console.log('Rebuilding registry and synchronizing...');
      execSync(`node "${path.join(ROOT_DIR, 'scripts', 'build-registry.js')}"`, { stdio: 'inherit' });
      cmdStatus();
      break;
    case 'new':
    case 'create':
      cmdNew(args[1], args[2]);
      break;
    case 'edit':
      cmdEdit(args[1]);
      break;
    case 'validate':
    case 'check':
      cmdValidate(args[1]);
      break;
    case 'ui':
    case 'dashboard':
    case 'web':
      cmdUi(args[1]);
      break;
    case 'help':
    case '--help':
    case '-h':
      console.log(`
${colors.bold}${colors.cyan}Skills CLI — Universal Agent Skill Engine & Runtime Harness${colors.reset}

${colors.bold}USAGE:${colors.reset}
  skills <command> [options]
  skillz <command> [options]

${colors.bold}COMMANDS:${colors.reset}
  ${colors.green}wizard / init / setup${colors.reset}     Interactive 6-question questionnaire to configure role & install
  ${colors.green}profiles${colors.reset}                   List all persona profiles (Designer, QA, Backend, Fullstack, etc.)
  ${colors.green}install [name] [options]${colors.reset}   Install skill(s) into AI coding agent(s) (default: all agents)
  ${colors.green}update / upgrade${colors.reset}           Pull registry updates and force-sync all latest skills
  ${colors.green}status${colors.reset}                     Show detected agent installations and linked skills
  ${colors.green}list [category]${colors.reset}            List all skills (optionally filter by category)
  ${colors.green}search <query>${colors.reset}             Search skills by name, tag, or description
  ${colors.green}info <name>${colors.reset}                Show detailed metadata and instructions for a skill
  ${colors.green}validate [name]${colors.reset}           Lint and check SKILL.md frontmatter integrity
  ${colors.green}sync${colors.reset}                      Rebuild registry.json and catalog
  ${colors.green}new <name> [category]${colors.reset}     Scaffold a new skill with valid SKILL.md
  ${colors.green}edit <name>${colors.reset}               Open skill in your default editor
  ${colors.green}ui [port]${colors.reset}                 Launch local visual dashboard on browser (default: 3888)

${colors.bold}INSTALL OPTIONS:${colors.reset}
  --profile, -p <role>     Install by persona profile: designer, qa, backend,
                           agent-harness, fullstack, all
  --target, -t <agent>     Target agent: all, claude, cursor, antigravity, codex,
                           windsurf, openhands, cline, roo, etc. (default: all)
  --all, -a                Install all 162 skills
  --category, -c <cat>     Install all skills in a category (e.g. agent-harness, design)
  --force, -f, --latest    Force re-link and update even if already up to date
  --copy                   Copy files instead of directory junction/symlink

${colors.bold}ROLE PROFILES (SPECIALIZED CATEGORIZATION):${colors.reset}
  ${colors.cyan}designer${colors.reset}      🎨 43 UI design systems, animations & styling (skips QA & testing)
  ${colors.cyan}qa${colors.reset}            🛡️ Python testing, pytest, TDD, verification gates (skips 43 UI designs)
  ${colors.cyan}backend${colors.reset}       ☁️ GCP cloud, Docker, APIs, reliability, architecture (skips UI designs)
  ${colors.cyan}agent-harness${colors.reset} 🧠 ECC harness, Harness² OS, superpowers, caveman (skips UI designs)
  ${colors.cyan}fullstack${colors.reset}     🚀 12 curated designs + superpowers TDD + backend + testing + cloud
  ${colors.cyan}all${colors.reset}           ⚡ Universal 162-skill suite across all 11 categories

${colors.bold}EXAMPLES:${colors.reset}
  skills wizard                          # Run interactive 6-question role wizard
  skills profiles                        # View all role profiles and excluded categories
  skills install --profile designer      # Install UI/UX design suite (no testing bloat)
  skills install --profile qa            # Install QA & testing suite (no UI design bloat)
  skills install --profile fullstack     # Install curated full-stack founder toolkit
  skills install --all --target all      # Universal 1-command install to all agents
      `);
      break;
    default:
      console.log(`${colors.red}Unknown command: ${cmd}${colors.reset}. Run 'skills help' for usage.`);
  }
}

main();

