// Client Application Logic for Skills Hub Dashboard

let registryData = null;
let agentStatusData = null;
let profilesData = null;
let currentProfile = 'all';
let currentCategory = 'all';
let currentSearch = '';
let activeSkillId = null;

// Wizard State
let wizardStep = 0;
let wizardAnswers = {
  role: 'fullstack',
  rigor: 'agile',
  compression: 'caveman',
  featurePacks: ['none'],
  target: 'all',
  mode: 'symlink'
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const categoryTabs = document.getElementById('categoryTabs');
const skillsGrid = document.getElementById('skillsGrid');
const agentsGrid = document.getElementById('agentsGrid');
const upstreamPills = document.getElementById('upstreamPills');
const agentTargetSelect = document.getElementById('agentTargetSelect');
const btnInstallCategory = document.getElementById('btnInstallCategory');
const btnInstallAllClaude = document.getElementById('btnInstallAllClaude');
const btnRefreshStatus = document.getElementById('btnRefreshStatus');

// Modal Elements
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalMeta = document.getElementById('modalMeta');
const modalMarkdown = document.getElementById('modalMarkdown');
const editorTextarea = document.getElementById('editorTextarea');
const btnSaveSkill = document.getElementById('btnSaveSkill');
const modalDeployGrid = document.getElementById('modalDeployGrid');

// Stats Elements
const statTotalSkills = document.getElementById('statTotalSkills');
const statDesignRepos = document.getElementById('statDesignRepos');
const statCategories = document.getElementById('statCategories');
const statActiveAgents = document.getElementById('statActiveAgents');

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fetch Initial Data
async function loadData() {
  try {
    const [skillsRes, statusRes, profilesRes] = await Promise.all([
      fetch('/api/skills').then(r => r.json()),
      fetch('/api/status').then(r => r.json()),
      fetch('/api/profiles').then(r => r.json())
    ]);
    registryData = skillsRes;
    agentStatusData = statusRes;
    profilesData = profilesRes;

    renderStats();
    renderAgentDeck();
    renderUpstreamPills();
    renderPersonaPills();
    renderCategoryTabs();
    renderSkillsGrid();
  } catch (err) {
    showToast('Failed to load registry: ' + err.message, 'error');
  }
}

// Render Metrics
function renderStats() {
  if (!registryData) return;
  statTotalSkills.textContent = registryData.totalSkills;
  statDesignRepos.textContent = registryData.upstreamRepos.length;
  statCategories.textContent = registryData.categories.length;

  const activeCount = Object.values(agentStatusData || {}).filter(a => a.active).length;
  statActiveAgents.textContent = activeCount;
}

// Render Agent Target Deck
function renderAgentDeck() {
  if (!agentStatusData) return;
  agentsGrid.innerHTML = '';

  const agentIcons = {
    claude: '🟣',
    cursor: '⚡',
    antigravity: '🌌',
    gemini: '✨',
    codex: '🟢',
    windsurf: '🌊',
    openhands: '🙌',
    roo: '🦘',
    cline: '🤖'
  };

  const agentNames = {
    claude: 'Claude Code',
    cursor: 'Cursor AI',
    antigravity: 'Google Antigravity',
    gemini: 'Gemini CLI',
    codex: 'Codex CLI',
    windsurf: 'Windsurf',
    openhands: 'OpenHands',
    roo: 'Roo Code',
    cline: 'Cline'
  };

  for (const [key, info] of Object.entries(agentStatusData)) {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `
      <div>
        <div class="agent-card-header">
          <div class="agent-name">${agentIcons[key] || '📦'} ${agentNames[key] || key}</div>
          <span class="agent-status-tag ${info.active ? 'agent-status-active' : 'agent-status-idle'}">
            ${info.active ? 'Active' : 'Uninitialized'}
          </span>
        </div>
        <div class="agent-path">${info.path}</div>
        <div class="agent-installed-count">${info.count} skill${info.count === 1 ? '' : 's'} linked</div>
      </div>
      <button class="btn btn-secondary btn-sm agent-install-btn" data-agent="${key}">
        Install All Skills (${registryData?.totalSkills || 114})
      </button>
    `;

    card.querySelector('.agent-install-btn').addEventListener('click', () => {
      installSkills({ target: key, all: true });
    });

    agentsGrid.appendChild(card);
  }
}

// Render 14 Design Toolkits
function renderUpstreamPills() {
  if (!registryData?.upstreamRepos) return;
  upstreamPills.innerHTML = '';

  registryData.upstreamRepos.forEach(repo => {
    const pill = document.createElement('a');
    pill.className = 'upstream-pill';
    pill.href = repo.url;
    pill.target = '_blank';
    pill.rel = 'noopener noreferrer';
    pill.innerHTML = `
      <span>${repo.name}</span>
      <span class="upstream-star">★ ${repo.stars}</span>
    `;
    upstreamPills.appendChild(pill);
  });
}

// Render Category Filter Tabs
function renderCategoryTabs() {
  if (!registryData?.categories) return;
  categoryTabs.innerHTML = '';

  // "All" tab
  const allTab = document.createElement('button');
  allTab.className = `cat-tab ${currentCategory === 'all' ? 'active' : ''}`;
  allTab.innerHTML = `<span>🌐</span> <span>All Skills</span> <span class="cat-badge">${registryData.totalSkills}</span>`;
  allTab.addEventListener('click', () => {
    currentCategory = 'all';
    renderCategoryTabs();
    renderSkillsGrid();
  });
  categoryTabs.appendChild(allTab);

  registryData.categories.forEach(cat => {
    const tab = document.createElement('button');
    tab.className = `cat-tab ${currentCategory === cat.key ? 'active' : ''}`;
    tab.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span> <span class="cat-badge">${cat.count}</span>`;
    tab.addEventListener('click', () => {
      currentCategory = cat.key;
      renderCategoryTabs();
      renderSkillsGrid();
    });
    categoryTabs.appendChild(tab);
  });
}

// Render Persona Profile Pills
function renderPersonaPills() {
  const personaPills = document.getElementById('personaPills');
  if (!personaPills || !profilesData?.profiles) return;
  personaPills.innerHTML = '';

  const allPill = document.createElement('button');
  allPill.className = `persona-pill ${currentProfile === 'all' ? 'active' : ''}`;
  allPill.innerHTML = `<span>⚡</span> <span>All Roles</span> <span class="persona-count">${registryData?.totalSkills || 162}</span>`;
  allPill.addEventListener('click', () => {
    currentProfile = 'all';
    renderPersonaPills();
    renderSkillsGrid();
  });
  personaPills.appendChild(allPill);

  profilesData.profiles.forEach(prof => {
    if (prof.id === 'all') return;
    const pill = document.createElement('button');
    pill.className = `persona-pill ${currentProfile === prof.id ? 'active' : ''}`;
    pill.innerHTML = `<span>${prof.icon}</span> <span>${prof.name}</span> <span class="persona-count">${prof.count}</span>`;
    pill.title = `${prof.tagline}\n${prof.description}`;
    pill.addEventListener('click', () => {
      currentProfile = prof.id;
      renderPersonaPills();
      renderSkillsGrid();
    });
    personaPills.appendChild(pill);
  });
}

// Filter and Render Skills Grid
function renderSkillsGrid() {
  if (!registryData?.skills) return;
  skillsGrid.innerHTML = '';

  const q = currentSearch.toLowerCase().trim();
  const filtered = registryData.skills.filter(s => {
    // Role Persona filter
    let matchProfile = true;
    if (currentProfile !== 'all') {
      if (currentProfile === 'designer') {
        matchProfile = s.category === 'design' || s.category === 'efficiency';
      } else if (currentProfile === 'qa') {
        matchProfile = ['python-testing', 'reliability', 'superpowers'].includes(s.category) ||
                       (s.category === 'development' && ['git-workflow', 'code-review', 'debugging'].some(k => (s.id + s.name + s.description).toLowerCase().includes(k)));
      } else if (currentProfile === 'backend') {
        matchProfile = ['cloud', 'engineering', 'reliability', 'development', 'agent-harness'].includes(s.category);
      } else if (currentProfile === 'agent-harness') {
        matchProfile = ['agent-harness', 'superpowers', 'efficiency', 'reliability'].includes(s.category);
      } else if (currentProfile === 'fullstack') {
        const curatedDesigns = [
          'ui-ux-pro-max', 'awesome-design-md', 'open-design', 'taste-skill', 'impeccable',
          'react-bits', 'magicui', 'canvas-ui', 'hallmark', 'google-design-md', 'design-system', 'animate'
        ];
        if (s.category === 'design') {
          matchProfile = curatedDesigns.includes(s.id);
        } else {
          matchProfile = ['superpowers', 'development', 'reliability', 'efficiency', 'python-testing', 'cloud'].includes(s.category);
        }
      }
    }

    const matchCat = currentCategory === 'all' || s.category === currentCategory;
    const matchSearch = !q || 
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q));

    return matchProfile && matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    skillsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted);">
        <h3>No matching skills found</h3>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try adjusting your search query or switching categories.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(skill => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <div>
        <div class="skill-card-top">
          <span class="skill-category-tag">${skill.icon} ${skill.categoryLabel}</span>
          <span class="skill-file-count">${skill.fileCount} files</span>
        </div>
        <h3 class="skill-title">${skill.name}</h3>
        <p class="skill-desc">${skill.description}</p>
        <div class="skill-tags">
          ${skill.tags.map(t => `<span class="skill-tag">#${t}</span>`).join('')}
        </div>
      </div>
      <div class="skill-card-actions">
        <button class="btn btn-secondary btn-sm" data-action="details">Details & Edit</button>
        <button class="btn btn-primary btn-sm btn-card-install" data-action="install">Install</button>
      </div>
    `;

    card.querySelector('[data-action="details"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openSkillModal(skill.id);
    });

    card.querySelector('[data-action="install"]').addEventListener('click', (e) => {
      e.stopPropagation();
      const targetAgent = agentTargetSelect.value;
      installSkills({ target: targetAgent, skillId: skill.id });
    });

    card.addEventListener('click', () => {
      openSkillModal(skill.id);
    });

    skillsGrid.appendChild(card);
  });
}

// Open Skill Modal
async function openSkillModal(skillId) {
  activeSkillId = skillId;
  try {
    const res = await fetch(`/api/skill/${skillId}`);
    const data = await res.json();

    modalIcon.textContent = data.icon || '📦';
    modalTitle.textContent = data.name;
    modalCategory.textContent = `${data.categoryLabel} • ${data.relativePath}`;

    modalMeta.innerHTML = `
      <div class="meta-item"><strong>ID:</strong> <code>${data.id}</code></div>
      <div class="meta-item"><strong>License:</strong> ${data.license || 'MIT'}</div>
      <div class="meta-item"><strong>Files:</strong> ${data.fileCount}</div>
      <div class="meta-item"><strong>Tags:</strong> ${data.tags.join(', ')}</div>
    `;

    // Simple markdown renderer
    modalMarkdown.innerHTML = renderSimpleMarkdown(data.content || '# No SKILL.md found');
    editorTextarea.value = data.content || '';

    // Render Deploy Options in Tab 3
    modalDeployGrid.innerHTML = '';
    const targets = ['claude', 'cursor', 'antigravity', 'codex', 'windsurf', 'openhands'];
    targets.forEach(t => {
      const deployCard = document.createElement('div');
      deployCard.className = 'deploy-card';
      deployCard.innerHTML = `
        <div>
          <div class="deploy-card-title">${t.toUpperCase()}</div>
          <div class="deploy-card-desc">Install into ${agentStatusData?.[t]?.path || t}</div>
        </div>
        <button class="btn btn-outline btn-sm" style="width:100%;">Install to ${t}</button>
      `;
      deployCard.querySelector('button').addEventListener('click', () => {
        installSkills({ target: t, skillId: data.id });
      });
      modalDeployGrid.appendChild(deployCard);
    });

    // Default to preview tab
    switchModalTab('preview');
    modalBackdrop.classList.add('open');
  } catch (err) {
    showToast('Failed to open skill: ' + err.message, 'error');
  }
}

// Simple Markdown to HTML Parser
function renderSimpleMarkdown(md) {
  // Strip YAML frontmatter if present
  let text = md.replace(/^---[\s\S]*?---\n*/, '');

  // Escape HTML tags
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks
  text = text.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Lists
  text = text.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs
  text = text.split('\n\n').map(p => {
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<li')) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return text;
}

// Modal Tabs Switcher
function switchModalTab(tabId) {
  document.querySelectorAll('.modal-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  });
}

document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    switchModalTab(tab.dataset.tab);
  });
});

// Save Skill Edits
btnSaveSkill.addEventListener('click', async () => {
  if (!activeSkillId) return;
  const newContent = editorTextarea.value;
  try {
    const res = await fetch(`/api/skill/${activeSkillId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Skill '${activeSkillId}' saved successfully!`);
      modalMarkdown.innerHTML = renderSimpleMarkdown(newContent);
      switchModalTab('preview');
      loadData();
    } else {
      showToast(result.error || 'Failed to save', 'error');
    }
  } catch (err) {
    showToast('Save error: ' + err.message, 'error');
  }
});

// Install API
async function installSkills(payload) {
  try {
    showToast(`Installing into ${payload.target}...`, 'info');
    const res = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Installed ${data.installedCount} skill(s) into ${data.target.toUpperCase()}!`);
      agentStatusData = data.status;
      renderAgentDeck();
      renderStats();
    } else {
      showToast('Install failed: ' + data.error, 'error');
    }
  } catch (err) {
    showToast('Install error: ' + err.message, 'error');
  }
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
  currentSearch = e.target.value;
  searchClear.style.display = currentSearch ? 'block' : 'none';
  renderSkillsGrid();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  currentSearch = '';
  searchClear.style.display = 'none';
  renderSkillsGrid();
});

// Shortcut '/' to search, 'Escape' to close modal
window.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== editorTextarea) {
    e.preventDefault();
    searchInput.focus();
  } else if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
    modalBackdrop.classList.remove('open');
  }
});

modalClose.addEventListener('click', () => {
  modalBackdrop.classList.remove('open');
});
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) modalBackdrop.classList.remove('open');
});

// Bulk Action Buttons
const btnInstallAllAgents = document.getElementById('btnInstallAllAgents');
if (btnInstallAllAgents) {
  btnInstallAllAgents.addEventListener('click', () => {
    installSkills({ target: 'all', all: true });
  });
}

btnInstallAllClaude.addEventListener('click', () => {
  installSkills({ target: 'claude', all: true });
});

btnInstallCategory.addEventListener('click', () => {
  const target = agentTargetSelect.value;
  if (currentCategory === 'all') {
    installSkills({ target, all: true });
  } else {
    installSkills({ target, category: currentCategory });
  }
});

btnRefreshStatus.addEventListener('click', async () => {
  showToast('Refreshing status...', 'info');
  await loadData();
  showToast('Status refreshed!');
});

// Wizard Functions
function openWizard() {
  const modal = document.getElementById('wizardModalBackdrop');
  if (!modal) return;
  modal.style.display = 'flex';
  wizardStep = 0;
  renderWizardStep();
}

function closeWizard() {
  const modal = document.getElementById('wizardModalBackdrop');
  if (modal) modal.style.display = 'none';
}

function renderWizardStep() {
  if (!profilesData?.questions) return;
  const question = profilesData.questions[wizardStep];
  const totalSteps = profilesData.questions.length;

  const indicator = document.getElementById('wizardStepIndicator');
  const progressFill = document.getElementById('wizardProgressFill');
  const btnPrev = document.getElementById('btnWizardPrev');
  const btnNext = document.getElementById('btnWizardNext');
  const btnDeploy = document.getElementById('btnWizardDeploy');

  indicator.textContent = `Question ${wizardStep + 1} of ${totalSteps}: ${question.title}`;
  progressFill.style.width = `${((wizardStep + 1) / totalSteps) * 100}%`;

  btnPrev.style.visibility = wizardStep === 0 ? 'hidden' : 'visible';
  if (wizardStep === totalSteps - 1) {
    btnNext.style.display = 'none';
    btnDeploy.style.display = 'inline-flex';
  } else {
    btnNext.style.display = 'inline-flex';
    btnDeploy.style.display = 'none';
  }

  const box = document.getElementById('wizardQuestionBox');
  box.innerHTML = `
    <h3 class="wizard-question-title">[${wizardStep + 1}/${totalSteps}] ${question.question}</h3>
    <div class="wizard-options-grid" id="wizardOptionsGrid"></div>
  `;

  const grid = document.getElementById('wizardOptionsGrid');
  const currentVal = wizardAnswers[question.id];

  question.options.forEach(opt => {
    const card = document.createElement('div');
    const isMulti = !!question.multi;
    const isSelected = isMulti 
      ? (Array.isArray(currentVal) && currentVal.includes(opt.value))
      : (currentVal === opt.value);

    card.className = `wizard-option-card ${isSelected ? 'active' : ''}`;
    card.innerHTML = `
      <div class="wizard-radio-circle"></div>
      <div class="wizard-option-content">
        <h4>${opt.label}</h4>
        <p>${opt.desc}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      if (isMulti) {
        if (!Array.isArray(wizardAnswers[question.id])) wizardAnswers[question.id] = [];
        if (opt.value === 'none') {
          wizardAnswers[question.id] = ['none'];
        } else {
          wizardAnswers[question.id] = wizardAnswers[question.id].filter(v => v !== 'none');
          if (wizardAnswers[question.id].includes(opt.value)) {
            wizardAnswers[question.id] = wizardAnswers[question.id].filter(v => v !== opt.value);
          } else {
            wizardAnswers[question.id].push(opt.value);
          }
          if (wizardAnswers[question.id].length === 0) wizardAnswers[question.id] = ['none'];
        }
      } else {
        wizardAnswers[question.id] = opt.value;
      }
      renderWizardStep();
    });

    grid.appendChild(card);
  });

  updateWizardPreview();
}

function updateWizardPreview() {
  const profileId = wizardAnswers.role || 'fullstack';
  const prof = profilesData?.profiles?.find(p => p.id === profileId) || profilesData?.profiles?.[4];
  if (!prof) return;

  const previewTitle = document.getElementById('wizardPreviewTitle');
  const previewCount = document.getElementById('wizardPreviewCount');
  const body = document.getElementById('wizardPreviewBody');

  previewTitle.innerHTML = `${prof.icon} ${prof.name}`;
  previewCount.textContent = `${prof.count} Tailored Skills`;

  const includedBadges = prof.includedCategories.map(c => `<span class="preview-pill-included">✓ ${c}</span>`).join(' ');
  const excludedBadges = prof.excludedCategories.length > 0
    ? prof.excludedCategories.map(c => `<span class="preview-pill-excluded">✗ ${c.label} (${c.count})</span>`).join(' ')
    : '<span style="color:var(--text-muted);font-size:0.75rem;">None (Universal Full Arsenal)</span>';

  body.innerHTML = `
    <div><strong>Target Agent:</strong> ${wizardAnswers.target || 'All Detected Agents'} &bull; <strong>Link Strategy:</strong> ${wizardAnswers.mode || 'Symlink / Junction'}</div>
    <div><strong>Included Categories:</strong> <div class="preview-pill-list">${includedBadges}</div></div>
    <div><strong>Excluded Bloat (Clean Specialization):</strong> <div class="preview-pill-list">${excludedBadges}</div></div>
    ${prof.whyExcluded ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;"><em>Why: ${prof.whyExcluded}</em></div>` : ''}
  `;
}

async function deployWizardProfile() {
  try {
    showToast(`Deploying ${wizardAnswers.role.toUpperCase()} profile into agents...`, 'info');
    const res = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: wizardAnswers.role,
        answers: wizardAnswers,
        target: wizardAnswers.target || 'all',
        mode: wizardAnswers.mode || 'symlink'
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Successfully deployed ${data.skillCount} skills (${data.profileMeta?.name || wizardAnswers.role}) to ${data.target.toUpperCase()}!`, 'success');
      agentStatusData = data.status;
      renderAgentDeck();
      renderStats();
      closeWizard();
    } else {
      showToast('Deployment failed: ' + data.error, 'error');
    }
  } catch (err) {
    showToast('Deployment error: ' + err.message, 'error');
  }
}

// Wizard Event Listeners
const btnOpenWizard = document.getElementById('btnOpenWizard');
if (btnOpenWizard) btnOpenWizard.addEventListener('click', openWizard);

const btnLaunchWizardFromSection = document.getElementById('btnLaunchWizardFromSection');
if (btnLaunchWizardFromSection) btnLaunchWizardFromSection.addEventListener('click', openWizard);

const wizardModalClose = document.getElementById('wizardModalClose');
if (wizardModalClose) wizardModalClose.addEventListener('click', closeWizard);

const btnWizardPrev = document.getElementById('btnWizardPrev');
if (btnWizardPrev) {
  btnPrev = btnWizardPrev;
  btnWizardPrev.addEventListener('click', () => {
    if (wizardStep > 0) {
      wizardStep--;
      renderWizardStep();
    }
  });
}

const btnWizardNext = document.getElementById('btnWizardNext');
if (btnWizardNext) {
  btnWizardNext.addEventListener('click', () => {
    if (profilesData?.questions && wizardStep < profilesData.questions.length - 1) {
      wizardStep++;
      renderWizardStep();
    }
  });
}

const btnWizardDefaults = document.getElementById('btnWizardDefaults');
if (btnWizardDefaults) {
  btnWizardDefaults.addEventListener('click', () => {
    wizardAnswers = {
      role: 'fullstack',
      rigor: 'agile',
      compression: 'caveman',
      featurePacks: ['none'],
      target: 'all',
      mode: 'symlink'
    };
    wizardStep = (profilesData?.questions?.length || 6) - 1;
    renderWizardStep();
  });
}

const btnWizardDeploy = document.getElementById('btnWizardDeploy');
if (btnWizardDeploy) btnWizardDeploy.addEventListener('click', deployWizardProfile);

const wizardModalBackdrop = document.getElementById('wizardModalBackdrop');
if (wizardModalBackdrop) {
  wizardModalBackdrop.addEventListener('click', (e) => {
    if (e.target === wizardModalBackdrop) closeWizard();
  });
}

// Initialize
loadData();

