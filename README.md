<p align="center">
  <h1 align="center">skilltags</h1>
</p>

<p align="center">
  <strong>One tag. All relevant skills. Automatically.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/skilltags"><img src="https://img.shields.io/npm/v/skilltags?color=cb3837&label=npm&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/skilltags"><img src="https://img.shields.io/npm/dm/skilltags?color=blue&label=downloads" alt="downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/steve-piece/skilltags" alt="license"></a>
  <a href="https://skills.sh"><img src="https://img.shields.io/badge/skills.sh-ecosystem-7c3aed?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyTDIgNnY2bDEwIDQgMTAtNFY2TDEyIDJ6Ii8+PC9zdmc+" alt="skills.sh"></a>
</p>

<br>

> **Tired of hunting for the right skill name every time you want the agent to actually use the skills you've installed?**

`skilltags` generates category-based command files for AI coding agents. Add one tag to your prompt, and the agent reviews every relevant skill before it starts working.

Built for the [skills.sh](https://skills.sh) ecosystem by Vercel.

---

## The Problem

You install great skills — `responsive-design`, `ui-ux-pro-max`, `supabase-postgres-best-practices` — but when you prompt the agent, it just starts coding. It skips the skills entirely. You end up hunting for exact skill names and tagging them manually, every single time.

## The Fix

<table>
<tr>
<td width="50%">

**Without skilltags**

```
I want to make my website components
look more modern and responsive.
```

The agent starts coding immediately. It doesn't check what skills are available. Even when you have skills relevant to your prompt that would improve the agent's output, they go untouched. Then you end of trying to remember the name of the skill(s) that would help with your request, and begin to type all the `@{relevant_keywords}` for the skill in your chat hoping autocomplete saves the day.

</td>
<td width="50%">

**With skilltags**

```
I want to make my website components
look more modern and responsive.
/st-frontend
```

The agent reads the `st-frontend.md` command file, which contains a curated list of your installed frontend skills. The header instructs the agent to review that list, identify which skills are relevant to your request, and read them before starting work.

</td>
</tr>
</table>

---

## Quick Start

```bash
npm install skilltags -g
```

The setup wizard runs on install — pick your categories, enable auto-sync, done.

> [!TIP]
> New to skills? Browse and install from [skills.sh](https://skills.sh):
> ```bash
> npx skills find            # search the skills directory
> npx skills add owner/repo  # install a skill package
> ```

---

## Categories

Add a category command to the end of your prompt using `/`:

| Command | What it loads |
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
| `/st-ai-agents` | MCP, subagents, skill creation, browser automation |
| `/st-documentation` | Markdown, MDX, OpenAPI, Docusaurus |

> [!NOTE]
> Don't see a category you need? [Suggest one](https://github.com/steve-piece/skilltags/issues) — we're always expanding the list.

---

## How It Works

```mermaid
flowchart LR
    A["Install"] --> B["Select\nCategories"]
    B --> C["Scan\n30+ Paths"]
    C --> D["Match Skills\nto Categories"]
    D --> E["Generate\nst-*.md Files"]

    style A stroke-width:2px
    style E stroke-width:2px
```

| Step | What happens |
|:-----|:-------------|
| **Install** | Setup wizard asks which categories you want and whether to enable auto-sync |
| **Scan** | Checks 30+ agent skill directories on your machine — zero configuration |
| **Match** | Skills are mapped to categories via keyword analysis on names + descriptions |
| **Generate** | A `st-{category}.md` file is created for each category in `~/.cursor/commands/` |

### What's inside each command file

Each generated `st-{category}.md` file contains two parts:

1. **An instructional header** — tells the agent to review the skills listed below and identify which are relevant to the user's request before starting work.
2. **A curated skill list** — every matched skill for that category, with its name, file path, and description.

> [!IMPORTANT]
> The instructional header is the key piece — it overrides the agent's default tendency to skip skill review and forces it to check the listed skills against your request.

<details>
<summary><strong>What does auto-sync do?</strong></summary>

<br>

When enabled, a shell wrapper is added to your `~/.zshrc` (or equivalent) that runs `skilltags sync --quiet` after every `skills add` or `skills remove`. Your category files stay up to date automatically — no manual re-sync needed.

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

Full reference: [docs/usage.md](docs/usage.md)

---

## Contributing

**Suggest a category** — Think a new skill category would be useful? [Open an issue](https://github.com/steve-piece/skilltags/issues) with the category name and what types of skills it should cover. The more specific the better — "What keywords should match this category?" helps us get it right.

**Improve keyword matching** — Category keyword mappings live in [`lib/categories.js`](lib/categories.js). If a skill isn't landing in the right category, PRs to improve the keyword lists are welcome.

---

<p align="center">
  <sub>MIT License</sub>
</p>
