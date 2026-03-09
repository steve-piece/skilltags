<!-- NPM-README.md -->
<!-- npm-optimized README without GitHub-only features (mermaid, admonitions, etc.) -->

<p align="center">
  <h1 align="center">skilltags</h1>
</p>

<p align="center">
  <strong>Generate slash commands that help agents use the right installed skills.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/skilltags"><img src="https://img.shields.io/npm/v/skilltags?color=cb3837&label=npm&logo=npm" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/steve-piece/skilltags" alt="license"></a>
  <a href="https://skills.sh"><img src="https://img.shields.io/badge/skills.sh-ecosystem-7c3aed?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyTDIgNnY2bDEwIDQgMTAtNFY2TDEyIDJ6Ii8+PC9zdmc+" alt="skills.sh"></a>
</p>

<br>

> **Tired of hunting for the right skill name every time you want the agent to actually use the skills you've installed?**

`skilltags` generates Cursor command files like `/st-frontend`, `/st-backend`, and `/st-design`. Each command file contains a curated list of matching skills plus instructions telling the agent to review that list before it starts work.

Built for the [skills.sh](https://skills.sh) ecosystem.

---

## Quick Start

### 1. Install

```bash
npm install skilltags -g
```

Global install is the best default if you want the `skilltags` command in your shell.

If you want project-only setup instead, local install works too:

```bash
npm install skilltags
```

Global install creates or updates files in `~/.cursor/`. Local install creates or updates files in `.cursor/` inside the current repo.

On a fresh install, an interactive setup wizard walks you through category selection. Global install can also enable auto-sync. If you've already configured that scope, postinstall silently re-syncs it.

If the wizard didn't run, configure manually:

```bash
skilltags update
npx skilltags update --local
```

### 2. Pick a scope and categories

Choose the scope you want:

- Global: `~/.cursor/skilltags.json` and `~/.cursor/commands/st-*.md`
- Project: `.cursor/skilltags.json` and `.cursor/commands/st-*.md`

Then pick the categories that fit your workflow: `frontend`, `backend`, `design`, and so on. skilltags scans known skill directories, matches skills to those categories, and writes one Cursor command file per category.

### 3. Use in prompts

Add a category command to the end of any Cursor prompt:

```
I want to make my website components look more modern and responsive.
/st-frontend
```

The agent reads the generated `st-frontend.md` command file, reviews the listed skills, and opens the relevant ones before starting work.

> **Tip:** New to skills? Browse and install from [skills.sh](https://skills.sh):
>
> ```bash
> npx skills find            # search the skills directory
> npx skills add owner/repo  # install a skill package
> ```

---

## The problem

You install great skills, but when you prompt the agent, it just starts coding. It skips the skills entirely unless you explicitly tag each one by name. You end up hunting for exact skill names every single time.

## The fix

| Without skilltags | With skilltags |
|:--|:--|
| `I want to make my website components look more modern and responsive.` — The agent starts coding immediately. It does not check what relevant skills you have installed, so useful skills often go unused unless you explicitly reference them by name in your prompt. | `I want to make my website components look more modern and responsive. /st-frontend` — The agent reads the `st-frontend.md` command file, which contains a curated list of your installed frontend skill names and descriptions. The header instructs the agent to review that list, identify which skills are relevant to your request, and open only those skills before starting work. |

---

## Categories

Add a category command to the end of your prompt using `/`:

| Command | What kinds of skills it covers |
|:--------|:-------------|
| `/st-frontend` | React, Next.js, Vue, Tailwind, CSS, responsive design |
| `/st-backend` | APIs, auth, serverless, Stripe, webhooks |
| `/st-database` | Postgres, Supabase, Prisma, Drizzle, Redis |
| `/st-design` | UI/UX, typography, design systems, dark mode |
| `/st-testing` | Vitest, Playwright, Cypress, TDD, E2E |
| `/st-performance` | Core Web Vitals, lazy loading, code splitting |
| `/st-mobile` | React Native, Expo, Flutter, SwiftUI |
| `/st-devops` | Docker, GitHub Actions, Terraform, deployment |
| `/st-marketing` | SEO, Open Graph, structured data, analytics |
| `/st-accessibility` | WCAG, ARIA, screen readers, keyboard nav |
| `/st-agent-tools` | MCP, subagents, skill creation, browser automation |
| `/st-documentation` | Markdown, MDX, OpenAPI, Docusaurus |

> Don't see a category you need? [Suggest one](https://github.com/steve-piece/skilltags/issues). We're always expanding the list.

---

## How It Works

```
Install -> Choose Global or Project Scope -> Select Categories -> Scan Known Skill Paths -> Match Skills -> Write skilltags.json + st-*.md Files
```

| Step | What happens |
|:-----|:-------------|
| **Install** | Postinstall detects whether you're configuring global or project scope |
| **Select** | The setup wizard asks which categories you want. Global setup can also enable auto-sync |
| **Scan** | Global mode scans global and project skill directories. Project mode scans project directories only |
| **Match** | Skills are mapped to categories via keyword analysis on names + descriptions |
| **Generate** | skilltags writes `skilltags.json` plus one `st-{category}.md` file per selected category in the chosen scope |

### What's inside each command file

Each generated `st-{category}.md` file contains two parts:

1. **An instructional header** that tells the agent to review the listed skill names and descriptions, identify which ones are relevant to the user's request, and open those skills before starting work.
2. **A curated skill list** with every matched skill for that category, including its name, file path, and description.

> **Important:** The instructional header is what makes this work. It tells the agent to evaluate the listed skills against the request first, instead of jumping straight into implementation.

<details>
<summary><strong>What does auto-sync do?</strong></summary>

<br>

When enabled, a shell wrapper is added to your `~/.zshrc` (or equivalent) that runs `skilltags sync --quiet` after every `skills add` or `skills remove`. Your category files stay up to date automatically with no manual re-sync needed.

</details>

---

## Commands

```
skilltags                      Sync category files from current config
skilltags sync                 Same as above (explicit)
skilltags update               Add or remove skill categories
skilltags update <category>    Edit skills within a specific category
```

<details>
<summary><strong>Flags</strong></summary>

<br>

| Flag | Description |
|:-----|:-------------|
| `--local` | Write to `.cursor/commands/` (project scope) instead of global |
| `--quiet` | Suppress all output (used by auto-sync hooks) |
| `-v`, `--version` | Print version |
| `-h`, `--help` | Show help |

</details>

Full reference: [docs/usage.md](https://github.com/steve-piece/skilltags/blob/main/docs/usage.md)

---

## Contributing

**Suggest a category.** Think a new skill category would be useful? [Open an issue](https://github.com/steve-piece/skilltags/issues) with the category name and what types of skills it should cover. The more specific the better. Including "what keywords should match this category?" helps us get it right.

**Improve keyword matching.** Category keyword mappings live in [`lib/categories.js`](https://github.com/steve-piece/skilltags/blob/main/lib/categories.js). If a skill isn't landing in the right category, PRs to improve the keyword lists are welcome.

---

<p align="center">
  <sub>MIT License</sub>
</p>
