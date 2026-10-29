# Universal Agent Guidelines (AGENTS.md)

This repository serves as a centralized hub for all AI coding agents:
- **Claude Code**: `~/.claude/skills`
- **Cursor**: `~/.cursor/skills-cursor`
- **Google Antigravity / Gemini CLI**: `~/.gemini/config/skills` or `.agents/skills`
- **Codex CLI**: `~/.codex/skills`
- **Windsurf**: `~/.codeium/windsurf/skills`
- **OpenHands**: `~/.openhands/skills`
- **Roo Code & Cline**: `~/.roo/skills` and `~/.cline/skills`

## Invariants & Best Practices

1. **Ground before mutating**: Before editing any skill, read its `SKILL.md` and test fixtures.
2. **Standard SKILL.md format**:
   All skills MUST adhere to the standard YAML frontmatter format:
   ```markdown
   ---
   name: skill-name
   description: Concise summary of what this skill does and when to use it
   license: MIT
   ---

   # Skill Name
   ...
   ```
3. **Symlink / Junctions**:
   Always prefer directory junctions/symlinks (`skills install <name> --target <agent>`) so that improvements made to a skill in this repository are immediately active in the target agent without copying back and forth.
4. **Registry Integrity**:
   Whenever a skill is added, removed, or modified, run `node scripts/build-registry.js` or `skills sync` to keep `registry.json` and `CATALOG.md` synchronized.
