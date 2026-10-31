/**
 * Universal Agent Skillz — Profiles & Persona Questionnaire Engine
 * 
 * Provides role-based skill filtering, 6-question interactive questionnaire,
 * and category specialization (e.g. Designers skip testing, QA skips UI designs).
 */

const PROFILES = {
  designer: {
    id: 'designer',
    name: 'Frontend & UI/UX Designer',
    icon: '🎨',
    tagline: 'UI/UX Design Systems, Animations, Canvas & Styling',
    description: 'Tailored specifically for designers, frontend artisans, and UI/UX developers. Includes all 43 UI design system skills (animations, design-md, bento grids, design tokens, react-bits, magicui, taste-skill). Completely excludes QA testing, python pytest, and cloud infrastructure bloat.',
    includedCategories: ['design', 'efficiency'],
    excludedCategories: ['python-testing', 'cloud', 'agent-harness', 'ide-meta'],
    whyExcluded: 'Designers do not need python test harnesses, cloud infrastructure, or backend agent loops.',
    filter: (s) => s.category === 'design' || s.category === 'efficiency'
  },
  qa: {
    id: 'qa',
    name: 'QA & Reliability Test Engineer',
    icon: '🛡️',
    tagline: 'Pytest, Verification Gates, Systematic Debugging & TDD',
    description: 'Tailored for QA engineers, test automation developers, and reliability architects. Includes all Python testing skills, verification gates, systematic debugging, snapdec, code review, and TDD methodologies. Completely excludes all 43 UI design system skills.',
    includedCategories: ['python-testing', 'reliability', 'superpowers', 'development'],
    excludedCategories: ['design'],
    whyExcluded: 'QA and reliability engineers do not create UI design mockups, animation timelines, or CSS themes.',
    filter: (s) => ['python-testing', 'reliability', 'superpowers'].includes(s.category) ||
                   (s.category === 'development' && ['git-workflow', 'code-review', 'debugging'].some(k => (s.id + s.name + s.description).toLowerCase().includes(k)))
  },
  backend: {
    id: 'backend',
    name: 'Backend & Cloud Systems Architect',
    icon: '☁️',
    tagline: 'Google Cloud, Docker, APIs, Reliability & Delivery',
    description: 'Tailored for backend developers, systems architects, and cloud DevOps engineers. Includes Google Cloud, Docker, delivery pipelines, reliability gates, architecture decision records, and development tooling. Completely excludes frontend UI/UX design libraries.',
    includedCategories: ['cloud', 'engineering', 'reliability', 'development', 'agent-harness'],
    excludedCategories: ['design'],
    whyExcluded: 'Backend & systems engineers do not need frontend CSS animations, design-md mockups, or typography systems.',
    filter: (s) => ['cloud', 'engineering', 'reliability', 'development', 'agent-harness'].includes(s.category)
  },
  'agent-harness': {
    id: 'agent-harness',
    name: 'AI Agent Orchestrator & Autonomous OS',
    icon: '🧠',
    tagline: 'ECC Harness, Harness² Recursive OS, Superpowers & Caveman',
    description: 'Tailored for AI agent developers and autonomous workflow builders. Includes Everything Claude Code (ECC), Harness² recursive agent harness, caveman token compression (60%+ savings), superpowers planning, and self-reflection loops. Excludes frontend UI styling.',
    includedCategories: ['agent-harness', 'superpowers', 'efficiency', 'reliability'],
    excludedCategories: ['design'],
    whyExcluded: 'Agent orchestrators focus on cognitive loops, test gates, and token efficiency rather than UI design.',
    filter: (s) => ['agent-harness', 'superpowers', 'efficiency', 'reliability'].includes(s.category)
  },
  fullstack: {
    id: 'fullstack',
    name: 'Full-Stack Solo Founder',
    icon: '🚀',
    tagline: 'Curated 12 UI Designs + Superpowers TDD + Cloud & Testing',
    description: 'Balanced, production-curated toolkit for full-stack engineers and solo startup founders. Contains the top 12 UI design systems, full superpowers TDD, reliability gates, development tools, token compression, and testing essentials.',
    includedCategories: ['superpowers', 'development', 'reliability', 'efficiency', 'python-testing', 'cloud'],
    curatedDesignSkills: [
      'ui-ux-pro-max',
      'awesome-design-md',
      'open-design',
      'taste-skill',
      'impeccable',
      'react-bits',
      'magicui',
      'canvas-ui',
      'hallmark',
      'google-design-md',
      'design-system',
      'animate'
    ],
    filter: (s) => {
      if (s.category !== 'design') {
        return ['superpowers', 'development', 'reliability', 'efficiency', 'python-testing', 'cloud'].includes(s.category);
      }
      return [
        'ui-ux-pro-max',
        'awesome-design-md',
        'open-design',
        'taste-skill',
        'impeccable',
        'react-bits',
        'magicui',
        'canvas-ui',
        'hallmark',
        'google-design-md',
        'design-system',
        'animate'
      ].includes(s.id);
    }
  },
  all: {
    id: 'all',
    name: 'Universal Power User (All Skills)',
    icon: '⚡',
    tagline: 'All 162 Production Skills Across All 11 Categories',
    description: 'The complete unconstrained suite across all agent domains and categories.',
    includedCategories: [
      'agent-harness', 'design', 'superpowers', 'efficiency', 'reliability',
      'engineering', 'cloud', 'cursor-tools', 'development', 'ide-meta', 'python-testing'
    ],
    excludedCategories: [],
    whyExcluded: 'None — full arsenal active.',
    filter: () => true
  }
};

const WIZARD_QUESTIONS = [
  {
    id: 'role',
    num: 1,
    title: 'Primary Role & Agent Archetype',
    question: 'What is your primary role or agent archetype?',
    options: [
      { key: '1', value: 'designer', label: '🎨 Frontend & UI/UX Designer', desc: 'Design systems, animations, styling — skips QA & testing' },
      { key: '2', value: 'qa', label: '🛡️ QA & Reliability Engineer', desc: 'Pytest, verification, TDD, debugging — skips 43 UI design skills' },
      { key: '3', value: 'backend', label: '☁️ Backend & Cloud Architect', desc: 'GCP, Docker, APIs, reliability, delivery — skips UI design' },
      { key: '4', value: 'agent-harness', label: '🧠 AI Agent Orchestrator', desc: 'ECC Harness, Harness² OS, superpowers, caveman — skips UI design' },
      { key: '5', value: 'fullstack', label: '🚀 Full-Stack Solo Founder', desc: 'Curated essentials: 12 top designs + TDD + backend + QA' },
      { key: '6', value: 'all', label: '⚡ Universal Power User', desc: 'Complete 162-skill arsenal across all 11 categories' }
    ],
    default: '5'
  },
  {
    id: 'rigor',
    num: 2,
    title: 'Engineering Rigor & Verification Strictness',
    question: 'How strict should the testing, planning, and verification gates be?',
    options: [
      { key: '1', value: 'strict', label: '🔒 Strict & Contract-Driven', desc: 'Mandatory TDD, verification gates, halt-on-failure contracts' },
      { key: '2', value: 'agile', label: '🔄 Pragmatic & Agile', desc: 'Iterative plan-before-act, fast feedback loops' },
      { key: '3', value: 'creative', label: '⚡ Rapid & Creative', desc: 'Zero test friction, rapid prototyping' }
    ],
    default: '2'
  },
  {
    id: 'compression',
    num: 3,
    title: 'Token Optimization & Communication Mode',
    question: 'How should your AI agent communicate and optimize token usage?',
    options: [
      { key: '1', value: 'caveman', label: '⚡ Caveman Token Compression', desc: 'Save 60%+ tokens with ultra-terse, high-speed execution' },
      { key: '2', value: 'standard', label: '📖 Standard & Conversational', desc: 'Full explanations, comprehensive reasoning, verbose notes' }
    ],
    default: '1'
  },
  {
    id: 'featurePacks',
    num: 4,
    title: 'Optional Feature Packs',
    question: 'Select any optional feature packs to include (comma-separated or single):',
    options: [
      { key: '1', value: 'cloud', label: '☁️ Cloud & Infrastructure', desc: 'Google Cloud, Terraform, Cloud Run' },
      { key: '2', value: 'python-testing', label: '🐍 Python & QA Automation', desc: 'Pytest, typing, async testing' },
      { key: '3', value: 'design', label: '🎨 UI/UX & Design Systems', desc: 'Tailwind, animations, design tokens' },
      { key: '4', value: 'cursor-tools', label: '⚡ Cursor & IDE Power Tools', desc: 'Editor shortcuts, cursor workflows' },
      { key: '5', value: 'none', label: '🚫 None / Pure Role Focus', desc: 'Keep strict profile boundaries' }
    ],
    default: '5',
    multi: true
  },
  {
    id: 'target',
    num: 5,
    title: 'Target AI Coding Agent(s)',
    question: 'Which AI coding agent(s) do you want to install and sync skills into?',
    options: [
      { key: '1', value: 'all', label: '⚡ All Detected Agents on this PC', desc: 'Claude, Cursor, Antigravity, OpenClaw, Codex, Windsurf, etc.' },
      { key: '2', value: 'claude', label: '🟣 Claude Code', desc: '~/.claude/skills' },
      { key: '3', value: 'cursor', label: '⚡ Cursor', desc: '~/.cursor/skills-cursor' },
      { key: '4', value: 'antigravity', label: '🌌 Google Antigravity & Gemini CLI', desc: '~/.gemini/config/skills' },
      { key: '5', value: 'openclaw', label: '🤖 OpenClaw', desc: '~/.openclaw/skills' },
      { key: '6', value: 'windsurf', label: '🌊 Windsurf', desc: '~/.codeium/windsurf/skills' }
    ],
    default: '1'
  },
  {
    id: 'mode',
    num: 6,
    title: 'Filesystem Link Strategy',
    question: 'How should skills be installed and synchronized?',
    options: [
      { key: '1', value: 'symlink', label: '🔗 Zero-Drift Symlink / Junction (Recommended)', desc: 'Edits in repo reflect immediately across all agents with zero latency' },
      { key: '2', value: 'copy', label: '📁 Standalone Directory Copy', desc: 'Isolated copy without filesystem linking' }
    ],
    default: '1'
  }
];

/**
 * Filter skills from registry based on profile and questionnaire answers
 */
function resolveSkillsForProfile(registry, profileId, answers = {}) {
  const profile = PROFILES[profileId] || PROFILES.all;
  let skills = registry.skills.filter(s => profile.filter(s));

  // Feature pack add-ons from Q4
  if (answers.featurePacks && Array.isArray(answers.featurePacks)) {
    for (const pack of answers.featurePacks) {
      if (pack === 'cloud') {
        const cloudSkills = registry.skills.filter(s => s.category === 'cloud');
        skills.push(...cloudSkills);
      } else if (pack === 'python-testing') {
        const pySkills = registry.skills.filter(s => s.category === 'python-testing');
        skills.push(...pySkills);
      } else if (pack === 'design') {
        const designSkills = registry.skills.filter(s => s.category === 'design');
        skills.push(...designSkills);
      } else if (pack === 'cursor-tools') {
        const cursorSkills = registry.skills.filter(s => s.category === 'cursor-tools');
        skills.push(...cursorSkills);
      }
    }
  }

  // Deduplicate by skill ID
  const seen = new Set();
  const dedupedSkills = skills.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  // Calculate excluded categories
  const includedCatKeys = new Set(dedupedSkills.map(s => s.category));
  const excludedCategories = registry.categories.filter(c => !includedCatKeys.has(c.key));

  return {
    profile,
    skills: dedupedSkills,
    count: dedupedSkills.length,
    includedCategories: Array.from(includedCatKeys),
    excludedCategories,
    target: answers.target || 'all',
    mode: answers.mode || 'symlink'
  };
}

module.exports = {
  PROFILES,
  WIZARD_QUESTIONS,
  resolveSkillsForProfile
};
