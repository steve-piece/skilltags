#!/usr/bin/env node
// bin/skilltags.js
// CLI entry point for skilltags. Routes subcommands and flags.

'use strict';

const VERSION = require('../package.json').version;

const args = process.argv.slice(2);
const subcommand = args.find(a => !a.startsWith('-'));
const flags = new Set(args.filter(a => a.startsWith('-')));

// ─── --version ───────────────────────────────────────────────────────────────

if (flags.has('--version') || flags.has('-v')) {
  console.log(`skilltags v${VERSION}`);
  process.exit(0);
}

// ─── Windows guard ───────────────────────────────────────────────────────────

if (process.platform === 'win32') {
  console.error('\n  skilltags requires macOS or Linux.\n');
  process.exit(1);
}

// ─── --help ──────────────────────────────────────────────────────────────────

if (flags.has('--help') || flags.has('-h')) {
  console.log(`
  skilltags v${VERSION}

  Usage:
    skilltags                      Sync category files from current config
    skilltags sync                 Same as above (explicit)
    skilltags update               Add or remove skill categories
    skilltags update <category>    Edit skills within a specific category

  Flags:
    --local       Write to .cursor/commands/ (project scope) instead of global
    --quiet       Suppress output (used by auto-sync hooks)
    -v, --version Print version
    -h, --help    Show this help

  Output:
    ~/.cursor/commands/st-<category>.md    one file per selected category
    .cursor/commands/st-<category>.md      with --local

  Config:
    ~/.cursor/skilltags.json               category selections (global)
    .cursor/skilltags.json                 with --local
`);
  process.exit(0);
}

// ─── Flags ───────────────────────────────────────────────────────────────────

const isLocal = flags.has('--local');
const isQuiet = flags.has('--quiet');

// ─── update ──────────────────────────────────────────────────────────────────

if (subcommand === 'update') {
  const categoryArg = args[args.indexOf('update') + 1];

  if (categoryArg && !categoryArg.startsWith('-')) {
    const { updateSingleCategory } = require('../lib/update');
    updateSingleCategory(categoryArg, isLocal).catch(err => {
      if (err.name === 'ExitPromptError') { console.log('\n'); process.exit(0); }
      console.error('  Error:', err.message);
      process.exit(1);
    });
  } else {
    const { updateCategories } = require('../lib/update');
    updateCategories(isLocal).catch(err => {
      if (err.name === 'ExitPromptError') { console.log('\n'); process.exit(0); }
      console.error('  Error:', err.message);
      process.exit(1);
    });
  }
}

// ─── sync (default) ──────────────────────────────────────────────────────────

else if (!subcommand || subcommand === 'sync') {
  const { runSync } = require('../lib/sync');
  runSync({ localOnly: isLocal, quiet: isQuiet });
}

// ─── Unknown subcommand ──────────────────────────────────────────────────────

else {
  console.error(`\n  Unknown command: ${subcommand}`);
  console.error('  Run skilltags --help for usage.\n');
  process.exit(1);
}
