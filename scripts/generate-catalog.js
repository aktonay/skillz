const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry.json');
const CATALOG_PATH = path.join(ROOT_DIR, 'CATALOG.md');

const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

let md = `# Complete Skills Hub Catalog (${reg.totalSkills} Skills)

This document provides a full reference catalog of all **${reg.totalSkills} skills** and **${reg.upstreamRepos.length} featured UI/design repositories** consolidated into this repository.

---

## 🌟 14 Featured Startup Design & UI Repositories

| # | Repository | Stars | Description | Local Source Path |
|---|---|:---:|---|---|
${reg.upstreamRepos.map((r, i) => `| ${i + 1} | [${r.name}](${r.url}) | **${r.stars}** | Top design toolkit for founders & agents | \`sources/repos/${r.name.split(' ')[0]}\` |`).join('\n')}

---

## 📂 Skills by Category

`;

for (const cat of reg.categories) {
  const catSkills = reg.skills.filter(s => s.category === cat.key);
  md += `### ${cat.icon} ${cat.label} (${catSkills.length} skills)\n\n`;
  md += `| Skill ID | Name | Description | Files | Install Command |\n`;
  md += `|---|---|---|:---:|---|\n`;
  for (const s of catSkills) {
    const cleanDesc = (s.description || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const shortDesc = cleanDesc.length > 90 ? cleanDesc.substring(0, 87) + '...' : cleanDesc;
    md += `| \`${s.id}\` | **${s.name}** | ${shortDesc} | ${s.fileCount} | \`skills install ${s.id} -t claude\` |\n`;
  }
  md += `\n---\n\n`;
}

fs.writeFileSync(CATALOG_PATH, md, 'utf8');
console.log(`CATALOG.md generated successfully with ${reg.totalSkills} skills.`);
