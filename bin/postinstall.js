#!/usr/bin/env node
// bin/postinstall.js
// Runs after `npm install skilltags`. First install: category picker + auto-sync confirm.
// Reinstall: re-sync silently. Never throws. A failed postinstall should never break npm install.

'use strict';

if (process.platform === 'win32') process.exit(0);

const path = require('path');
const fs = require('fs');
const os = require('os');

const HOME = os.homedir();

function isGlobalInstall() {
  return process.env.npm_config_global === 'true';
}

function isInteractive() {
  return process.stdin.isTTY && process.stdout.isTTY;
}

function printLocalInstallMessage({ configured = false } = {}) {
  console.log('\n  skilltags was installed locally in this project.\n');
  console.log('  This package is a CLI, so a global install is still recommended if you want `skilltags` in your shell PATH:');
  console.log('    npm install -g skilltags\n');

  if (configured) {
    console.log('  Project-level setup is complete.');
    console.log('  Use these commands from this repo:');
    console.log('    npx skilltags sync --local');
    console.log('    npx skilltags update --local\n');
    return;
  }

  console.log('  For project-level setup in this repo, run:');
  console.log('    npx skilltags update --local\n');
}

function detectRcFile() {
  const shellName = path.basename(process.env.SHELL || 'bash');
  if (shellName === 'zsh') return path.join(HOME, '.zshrc');
  if (process.platform === 'darwin') return path.join(HOME, '.bash_profile');
  return path.join(HOME, '.bashrc');
}

function printPostSetupSummary({ isLocal, autoSync, results }) {
  console.log('\n  Done!');
  console.log('  Generated:');
  for (const r of results) {
    const display = r.path.replace(HOME, '~');
    console.log(`    ${display}  (${r.count} skills)`);
  }

  if (isLocal) {
    console.log('\n  Project-level config saved to:');
    console.log('    .cursor/skilltags.json');
    console.log('\n  Run from this repo:');
    console.log('    npx skilltags sync --local');
    console.log('    npx skilltags update --local');
    console.log('\n  Usage: type /st-frontend in Cursor chat to load project skills.\n');
    return;
  }

  if (autoSync) {
    console.log('\n  Auto-sync enabled. Category files will update when you add or remove skills.');
  } else {
    console.log('\n  To manually sync after adding or removing skills, run:');
    console.log('    skilltags sync');
    console.log('\n  To update your categories, run:');
    console.log('    skilltags update');
  }

  console.log('\n  Usage: type /st-frontend in Cursor chat to load frontend skills.\n');
}

async function runSetupWizard({ isLocal }) {
  const { checkbox, confirm } = require('@inquirer/prompts');
  const { PREDEFINED_CATEGORIES, matchSkillsToCategories, toTitleCase } = require('../lib/categories');
  const { discoverSkills } = require('../lib/discovery');
  const { writeConfig, createDefaultConfig, getCommandsDir, WRAPPER_MARKER } = require('../lib/config');
  const { generateAllCategoryFiles } = require('../lib/writer');

  console.log(`\n  skilltags: ${isLocal ? 'project setup' : 'setup'}\n`);

  if (isLocal) {
    console.log('  This will create project-scoped files in the current repo:');
    console.log('    .cursor/skilltags.json');
    console.log('    .cursor/commands/st-*.md\n');
  }

  const selected = await checkbox({
    message: 'Select categories (space to toggle, enter to confirm)',
    choices: PREDEFINED_CATEGORIES.map(c => ({ name: toTitleCase(c), value: c })),
    pageSize: 14,
  });

  if (selected.length === 0) {
    console.log(`  No categories selected. You can add them later with: ${isLocal ? 'npx skilltags update --local' : 'skilltags update'}\n`);
    return false;
  }

  console.log(`\n  Scanning skills...\n`);
  const { skills, sourceCount } = discoverSkills({ localOnly: isLocal });
  console.log(`  Found ${skills.length} skill(s) across ${sourceCount} source(s)\n`);

  const matched = matchSkillsToCategories(skills, selected);
  const config = createDefaultConfig(matched);

  const pad = Math.max(...selected.map(c => toTitleCase(c).length));
  console.log('  +' + '-'.repeat(pad + 4) + '+' + '-'.repeat(10) + '+');
  console.log('  | ' + 'Category'.padEnd(pad + 2) + '| ' + 'Skills'.padEnd(8) + ' |');
  console.log('  +' + '-'.repeat(pad + 4) + '+' + '-'.repeat(10) + '+');
  for (const cat of selected) {
    const count = String(matched[cat]?.length || 0).padStart(5);
    console.log('  | ' + toTitleCase(cat).padEnd(pad + 2) + '| ' + count + '    |');
  }
  console.log('  +' + '-'.repeat(pad + 4) + '+' + '-'.repeat(10) + '+');

  let alreadyInstalled = false;
  let displayRc = '';
  if (!isLocal) {
    const rcFile = detectRcFile();
    displayRc = rcFile.replace(HOME, '~');
    try {
      const content = fs.readFileSync(rcFile, 'utf-8');
      if (content.includes(WRAPPER_MARKER)) alreadyInstalled = true;
    } catch {}
  }

  let autoSync = false;
  if (!isLocal && !alreadyInstalled) {
    autoSync = await confirm({
      message: `Auto-sync skills automatically? (adds a wrapper function to ${displayRc})`,
      default: true,
    });
  }

  if (!isLocal && autoSync && !alreadyInstalled) {
    const rcFile = detectRcFile();
    const wrapper = `
${WRAPPER_MARKER}-------------------------------------------------------
function skills() {
  npx skills "$@"
  local exit_code=$?
  if [[ "$1" == "add" || "$1" == "remove" ]] && [[ $exit_code -eq 0 ]]; then
    skilltags sync --quiet
  fi
  return $exit_code
}
# ------------------------------------------------------------------------------
`;
    try {
      fs.appendFileSync(rcFile, wrapper);
    } catch (err) {
      console.error(`\n  Failed to write to ${displayRc}: ${err.message}`);
    }
  }

  writeConfig(config, isLocal);

  const commandsDir = getCommandsDir(isLocal);
  const results = generateAllCategoryFiles(config, skills, commandsDir);

  if (isLocal && results.length === 0) {
    console.log('\n  No command files were generated yet.');
    console.log('  Project mode only scans skills inside this repo, and none matched the selected categories.');
  }

  printPostSetupSummary({ isLocal, autoSync, results });
  return true;
}

async function main() {
  const { readConfig } = require('../lib/config');

  if (!isGlobalInstall()) {
    const existingLocalConfig = readConfig(true);

    if (existingLocalConfig) {
      const { runSync } = require('../lib/sync');
      runSync({ localOnly: true, quiet: true });
      printLocalInstallMessage({ configured: true });
      return;
    }

    if (!isInteractive()) {
      printLocalInstallMessage();
      return;
    }

    try {
      const { confirm } = require('@inquirer/prompts');
      const shouldSetup = await confirm({
        message: 'Set up skilltags for this project now? (creates .cursor/skilltags.json and .cursor/commands/)',
        default: true,
      });

      if (!shouldSetup) {
        printLocalInstallMessage();
        return;
      }

      const didSetup = await runSetupWizard({ isLocal: true });
      if (didSetup) {
        printLocalInstallMessage({ configured: true });
      }
    } catch (err) {
      if (err.name === 'ExitPromptError') {
        console.log('\n');
        return;
      }
      printLocalInstallMessage();
    }
    return;
  }

  const existingConfig = readConfig(false);

  if (existingConfig) {
    const { runSync } = require('../lib/sync');
    runSync({ quiet: true });
    return;
  }

  if (!isInteractive()) {
    console.log('\n  skilltags installed. Run skilltags update to configure categories.\n');
    return;
  }

  try {
    await runSetupWizard({ isLocal: false });
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      console.log('\n');
      return;
    }
    console.log('\n  skilltags installed. Run skilltags update to configure categories.\n');
  }
}

main();
