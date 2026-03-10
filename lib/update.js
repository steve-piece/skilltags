// lib/update.js
// Handler for `skilltags update` and `skilltags update {category}`.

'use strict';

const fs = require('fs');
const path = require('path');
const { checkbox, confirm } = require('@inquirer/prompts');
const { readConfig, writeConfig, getCommandsDir, HOME, WRAPPER_MARKER } = require('./config');
const { PREDEFINED_CATEGORIES, matchSkillsToCategories, toTitleCase } = require('./categories');
const { discoverSkills } = require('./discovery');
const { generateAllCategoryFiles, generateCategoryFile, deleteCategoryFile } = require('./writer');

function detectRcFile() {
  const shellName = path.basename(process.env.SHELL || 'bash');
  if (shellName === 'zsh') return path.join(HOME, '.zshrc');
  if (process.platform === 'darwin') return path.join(HOME, '.bash_profile');
  return path.join(HOME, '.bashrc');
}

function hasAutoSyncWrapper(rcFile) {
  try {
    return fs.readFileSync(rcFile, 'utf-8').includes(WRAPPER_MARKER);
  } catch {
    return false;
  }
}

function installAutoSyncWrapper(rcFile) {
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

  fs.appendFileSync(rcFile, wrapper);
}

async function updateCategories(isLocal) {
  const existingConfig = readConfig(isLocal);
  const isFirstSetup = !existingConfig || Object.keys(existingConfig.categories || {}).length === 0;
  const header = isFirstSetup
    ? `skilltags: ${isLocal ? 'project setup' : 'setup'}`
    : 'skilltags: update categories';

  console.log(`\n  ${header}\n`);

  if (isFirstSetup && isLocal) {
    console.log('  This will create project-scoped files in the current repo:');
    console.log('    .cursor/skilltags.json');
    console.log('    .cursor/commands/st-*.md\n');
  }

  const config = existingConfig || { version: require('./config').VERSION, categories: {} };
  const existing = new Set(Object.keys(config.categories || {}));

  const selected = await checkbox({
    message: 'Select categories (space to toggle, enter to confirm)',
    choices: PREDEFINED_CATEGORIES.map(c => ({
      name: `${toTitleCase(c)}${existing.has(c) ? ` (${(config.categories[c] || []).length} skills)` : ''}`,
      value: c,
      checked: existing.has(c),
    })),
    pageSize: 14,
  });

  const selectedSet = new Set(selected);
  const commandsDir = getCommandsDir(isLocal);

  const removed = [...existing].filter(c => !selectedSet.has(c));
  for (const cat of removed) {
    delete config.categories[cat];
    deleteCategoryFile(cat, commandsDir);
    console.log(`  - Removed: ${toTitleCase(cat)}`);
  }

  const added = selected.filter(c => !existing.has(c));

  if (added.length > 0) {
    console.log(`\n  Scanning skills...\n`);
    const { skills } = discoverSkills({ localOnly: isLocal });
    const matched = matchSkillsToCategories(skills, added);

    for (const cat of added) {
      config.categories[cat] = matched[cat] || [];
      console.log(`  + ${toTitleCase(cat)}  (${config.categories[cat].length} skills)`);
    }
  }

  if (removed.length === 0 && added.length === 0) {
    console.log('  No changes.\n');
    return;
  }

  let autoSyncEnabled = false;
  let autoSyncAlreadyInstalled = false;
  let autoSyncWriteError = '';
  let autoSyncRcFile = '';

  if (isFirstSetup && !isLocal) {
    autoSyncRcFile = detectRcFile();
    const displayRc = autoSyncRcFile.replace(HOME, '~');
    autoSyncAlreadyInstalled = hasAutoSyncWrapper(autoSyncRcFile);

    if (!autoSyncAlreadyInstalled) {
      autoSyncEnabled = await confirm({
        message: `Auto-sync skills automatically? (adds a wrapper function to ${displayRc})`,
        default: true,
      });

      if (autoSyncEnabled) {
        try {
          installAutoSyncWrapper(autoSyncRcFile);
        } catch (err) {
          autoSyncWriteError = err.message;
          autoSyncEnabled = false;
        }
      }
    }
  }

  writeConfig(config, isLocal);

  const { skills } = discoverSkills({ localOnly: isLocal });
  const results = generateAllCategoryFiles(config, skills, commandsDir);

  console.log('\n  ✓ Updated:');
  for (const r of results) {
    const display = r.path.replace(HOME, '~');
    console.log(`    ${display}  (${r.count} skills)`);
  }

  if (isFirstSetup && !isLocal) {
    if (autoSyncEnabled) {
      console.log('\n  Auto-sync enabled. Category files will update when you add or remove skills.');
    } else if (autoSyncAlreadyInstalled) {
      console.log('\n  Auto-sync is already enabled.');
    }

    if (autoSyncWriteError) {
      console.log(`\n  Failed to enable auto-sync: ${autoSyncWriteError}`);
    }
  }

  console.log();
}

async function updateSingleCategory(categoryName, isLocal) {
  const config = readConfig(isLocal);
  if (!config || !config.categories) {
    console.error('\n  No config found. Run: skilltags update\n');
    process.exit(1);
  }

  const skillNames = config.categories[categoryName];
  if (!skillNames) {
    console.error(`\n  Category "${categoryName}" not found in config.`);
    console.error(`  Available: ${Object.keys(config.categories).join(', ')}\n`);
    process.exit(1);
  }

  console.log(`\n  skilltags: edit ${toTitleCase(categoryName)} category\n`);

  if (skillNames.length === 0) {
    console.log('  No skills in this category.\n');
    return;
  }

  const kept = await checkbox({
    message: `Uncheck skills to remove from ${toTitleCase(categoryName)} (space to toggle)`,
    choices: skillNames.map(s => ({
      name: s,
      value: s,
      checked: true,
    })),
    pageSize: 20,
  });

  const removedCount = skillNames.length - kept.length;

  if (removedCount === 0) {
    console.log('  No changes.\n');
    return;
  }

  config.categories[categoryName] = kept;
  writeConfig(config, isLocal);

  const commandsDir = getCommandsDir(isLocal);
  const { skills } = discoverSkills({ localOnly: isLocal });
  const result = generateCategoryFile(categoryName, kept, skills, commandsDir);

  const display = result.path.replace(HOME, '~');
  console.log(`\n  ✓ ${display}  (${result.count} skills, ${removedCount} removed)\n`);
}

module.exports = { updateCategories, updateSingleCategory };
