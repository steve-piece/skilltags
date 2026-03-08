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

function isInteractive() {
  return process.stdin.isTTY && process.stdout.isTTY;
}

function detectRcFile() {
  const shellName = path.basename(process.env.SHELL || 'bash');
  if (shellName === 'zsh') return path.join(HOME, '.zshrc');
  if (process.platform === 'darwin') return path.join(HOME, '.bash_profile');
  return path.join(HOME, '.bashrc');
}

async function runSetupWizard() {
  const { checkbox, confirm } = require('@inquirer/prompts');
  const { PREDEFINED_CATEGORIES, matchSkillsToCategories, toTitleCase } = require('../lib/categories');
  const { discoverSkills } = require('../lib/discovery');
  const { writeConfig, createDefaultConfig, getCommandsDir, WRAPPER_MARKER } = require('../lib/config');
  const { generateAllCategoryFiles } = require('../lib/writer');

  console.log('\n  skilltags: setup\n');

  const selected = await checkbox({
    message: 'Select categories (space to toggle, enter to confirm)',
    choices: PREDEFINED_CATEGORIES.map(c => ({ name: toTitleCase(c), value: c })),
    pageSize: 14,
  });

  if (selected.length === 0) {
    console.log('  No categories selected. You can add them later with: skilltags update\n');
    return;
  }

  console.log(`\n  Scanning skills...\n`);
  const { skills, sourceCount } = discoverSkills();
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

  const rcFile = detectRcFile();
  const displayRc = rcFile.replace(HOME, '~');

  let alreadyInstalled = false;
  try {
    const content = fs.readFileSync(rcFile, 'utf-8');
    if (content.includes(WRAPPER_MARKER)) alreadyInstalled = true;
  } catch {}

  let autoSync = false;
  if (!alreadyInstalled) {
    autoSync = await confirm({
      message: `Auto-sync skills automatically? (adds a wrapper function to ${displayRc})`,
      default: true,
    });
  }

  if (autoSync && !alreadyInstalled) {
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

  writeConfig(config, false);

  const commandsDir = getCommandsDir(false);
  const results = generateAllCategoryFiles(config, skills, commandsDir);

  console.log('\n  Done!');
  console.log('  Generated:');
  for (const r of results) {
    const display = r.path.replace(HOME, '~');
    console.log(`    ${display}  (${r.count} skills)`);
  }

  if (autoSync) {
    console.log('\n  Auto-sync enabled. Category files will update when you add or remove skills.');
  } else {
    console.log('\n  To manually sync after adding or removing skills, run:');
    console.log('    skilltags sync');
    console.log('\n  To update your categories, run:');
    console.log('    skilltags update');
  }

  console.log('\n  Usage: type @st-frontend in Cursor chat to load frontend skills.\n');
}

async function main() {
  const { readConfig } = require('../lib/config');

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
    await runSetupWizard();
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      console.log('\n');
      return;
    }
    console.log('\n  skilltags installed. Run skilltags update to configure categories.\n');
  }
}

main();
