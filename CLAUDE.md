# Claude Code Skills & Workspace Rules

This repository (`c:\AKTONAY\Skillz`) is the unified centralized skill repository and manager for Claude Code and coding agents.

## Core Capabilities

1. **114 Production Skills**:
   - Curated across Design/UI, Engineering, Gravitas Reliability, Google Cloud, Cursor Meta, Development, and Python QA.
2. **14 Upstream Design Repositories**:
   - Stored in full under `sources/repos/` (`ui-ux-pro-max-skill`, `awesome-design-md`, `open-design`, `taste-skill`, `impeccable`, `react-bits`, `emilkowalski-skills`, `hallmark`, `google-design-md`, `magicui`, `gsap-skills`, `scroll-world`, `canvas-ui`, `dimensional-drawing`).
3. **One-Command Installation into Claude Code**:
   - Symlinks skills to `~/.claude/skills` so edits made here immediately reflect in Claude Code without re-installing!
   ```bash
   # Install all skills into Claude Code
   skills install --all --target claude

   # Install only design skills
   skills install --category design --target claude

   # Install a specific skill
   skills install ui-ux-pro-max --target claude
   ```

## Agent Workflows

- **Search for a skill**: `skills search <query>`
- **View skill details & rules**: `skills info <name>`
- **Check active agent installations**: `skills status`
- **Modify a skill**: Edit the `SKILL.md` under `skills/<category>/<skill-name>/SKILL.md`, or run `skills edit <name>`
- **Create a new skill**: `skills new <name> [category]`
- **Rebuild registry**: `node scripts/build-registry.js` or `skills sync`
- **Visual Dashboard**: `skills ui`
