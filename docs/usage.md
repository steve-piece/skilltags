# Usage & Reference

Detailed documentation for `skilltags`, including how category commands work, where skills are discovered, and how configuration is stored.

---

## Installation Methods

### npm global (recommended)

```bash
npm install skilltags -g
```

This installs the CLI globally, runs the global setup wizard on first install, and writes files to `~/.cursor/`.

### npm project-local

```bash
npm install skilltags
```

This keeps the package inside the current repo, runs the project setup wizard on first install when interactive, and writes files to `.cursor/` in that repo. Use `npx skilltags ... --local` for project-scoped commands.

### curl one-liner

```bash
curl -fsSL https://raw.githubusercontent.com/steve-piece/skilltags/main/install.sh | bash
```

The curl installer performs the global install flow.

---

## Setup Wizard

The wizard runs automatically after install and changes slightly based on scope.

### Global install

Global setup asks two things:

1. **Select categories** - checkbox list of 12 predefined categories (space to toggle, enter to confirm)
2. **Enable auto-sync?** - adds a shell wrapper to your rc file that runs `skilltags sync --quiet` after every `skills add` or `skills remove`

The shell wrapper is added to whichever file matches your shell:

| Shell | File |
|-------|------|
| zsh | `~/.zshrc` |
| bash (macOS) | `~/.bash_profile` |
| bash (Linux) | `~/.bashrc` |
| other | `~/.bashrc` |

On reinstall, the wizard is skipped and category files are re-synced silently.

### Project-local install

Project setup asks whether you want to configure the current repo now. If you continue, it:

1. Prompts for categories
2. Scans project skill directories only
3. Writes `.cursor/skilltags.json`
4. Writes `.cursor/commands/st-*.md`

Project mode does not modify your shell rc file and does not enable the global auto-sync wrapper.

If install runs in a non-interactive context, use:

```bash
npx skilltags update --local
```

---

## Commands

### `skilltags` / `skilltags sync`

Regenerate all category command files from your current config. Reads `skilltags.json`, scans skill sources, and writes `st-{category}.md` files.

```bash
skilltags              # sync (default)
skilltags sync         # sync (explicit)
skilltags sync --local # sync project-scoped files only
skilltags sync --quiet # sync without any output (used by auto-sync hooks)
```

### `skilltags update`

Re-run the category picker. Add new categories, remove existing ones.

```bash
skilltags update
```

Newly added categories are auto-matched to your installed skills via keyword analysis. Existing category lists are preserved. Removed categories have their `st-{category}.md` files deleted.

### `skilltags update <category>`

Edit the skills within a specific category. Shows a checkbox list of all skills currently in that category. Uncheck any you want removed.

```bash
skilltags update frontend
```

This is useful when a skill was matched to a category by keyword but isn't actually relevant. Your changes are saved to config and persist across syncs.

---

## Flags

| Flag | Description |
|------|-------------|
| `--local` | Use project scope. Reads and writes `.cursor/skilltags.json` and `.cursor/commands/` in the current repo instead of the global `~/.cursor/` paths |
| `--quiet` | Suppress all terminal output. Used by the auto-sync shell wrapper so sync runs silently after `skills add/remove`. |
| `-v`, `--version` | Print version number |
| `-h`, `--help` | Show help text |

---

## Config

### Location

| Scope | Path |
|-------|------|
| Global | `~/.cursor/skilltags.json` |
| Project (`--local`) | `.cursor/skilltags.json` |

### Format

```json
{
  "version": "2.1.1",
  "categories": {
    "frontend": ["responsive-design", "ui-ux-pro-max", "vercel-react-best-practices"],
    "backend": ["supabase-postgres-best-practices"],
    "design": ["web-design-guidelines", "ui-animation"]
  }
}
```

- `version` - config schema version
- `categories` - map of category name to array of skill names. Skill names match the directory name containing `SKILL.md`.

---

## Skill Sources

skilltags scans every known agent skill directory on your machine. No configuration needed. If a directory exists, it's scanned.

### Global paths

| Path | Agent(s) |
|------|----------|
| `~/.agents/skills/` | Universal (Cursor, Copilot, Cline, Codex, Amp, Gemini CLI, Kimi Code, OpenCode) |
| `~/.claude/skills/` | Claude Code |
| `~/.cursor/skills/` | Cursor |
| `~/.cursor/skills-cursor/` | Cursor built-in skills |
| `~/.cursor/plugins/cache/` | Cursor marketplace plugins |
| `~/.copilot/skills/` | GitHub Copilot |
| `~/.cline/skills/` | Cline |
| `~/.codex/skills/` | Codex |
| `~/.gemini/skills/` | Gemini CLI |
| `~/.roo/skills/` | Roo Code |
| `~/.augment/skills/` | Augment |
| `~/.trae/skills/` | Trae |
| `~/.continue/skills/` | Continue |
| `~/.junie/skills/` | Junie |
| `~/.windsurf/skills/` | Windsurf |
| `~/.codeium/windsurf/skills/` | Windsurf (Codeium) |
| `~/.kilocode/skills/` | Kilo Code |
| And 15+ more | See [`lib/config.js`](../lib/config.js) for the full list |

### Project paths

| Path | Agent(s) |
|------|----------|
| `.agents/skills/` | Universal |
| `.claude/skills/` | Claude Code |
| `.cursor/skills/` | Cursor |
| `.github/skills/` | GitHub Copilot |
| `.cline/skills/` | Cline |
| `.roo/skills/` | Roo Code |
| `.codex/skills/` | Codex |

Project paths are scanned alongside global paths during global sync. In `--local` mode, only project paths are scanned.

### Deduplication

Skills are deduplicated by name. The first source to provide a skill wins (global sources are scanned before project sources). This handles the symlinks that `npx skills add` creates across agent directories.

---

## Output Files

Category command files are written to `~/.cursor/commands/` in global mode or `.cursor/commands/` in project mode.

Each file follows this structure:

```markdown
# Skills: Frontend

<!-- Auto-generated by skilltags v2.1.1 - do not edit manually -->

[Instructional header telling the agent to review listed skill names and descriptions before acting]

## Frontend Skills

### Responsive Design
`~/.agents/skills/responsive-design`

Description of the skill...

### Ui Ux Pro Max
`~/.agents/skills/ui-ux-pro-max`

Description of the skill...
```

The instructional header is what makes this work. It tells the agent to evaluate the listed skill names and descriptions against the current request first, then open only the relevant skills.

---

## Migration from v1

If you're upgrading from `skilltags` v1.x, skilltags v2 automatically:

- Migrates `skilltags-categories.conf` to `skilltags.json`
- Removes old output files (`skilltags.md`, `project-skilltags.md`, `skills-*.md`)
- Updates the shell wrapper in your rc file to use the new `skilltags sync --quiet` command

This happens on the first `skilltags sync` after upgrading. No manual steps needed.
