// lib/update.js
// Handler for `skilltags update` and `skilltags update {category}`.

'use strict';

const { checkbox } = require('@inquirer/prompts');
const { readConfig, writeConfig, getCommandsDir, HOME } = require('./config');
const { PREDEFINED_CATEGORIES, matchSkillsToCategories, toTitleCase } = require('./categories');
const { discoverSkills } = require('./discovery');
const { generateAllCategoryFiles, generateCategoryFile, deleteCategoryFile } = require('./writer');

async function updateCategories(isLocal) {
  console.log('\n  skilltags: update categories\n');

  const config = readConfig(isLocal) || { version: require('./config').VERSION, categories: {} };
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

  writeConfig(config, isLocal);

  const { skills } = discoverSkills({ localOnly: isLocal });
  const results = generateAllCategoryFiles(config, skills, commandsDir);

  console.log('\n  ✓ Updated:');
  for (const r of results) {
    const display = r.path.replace(HOME, '~');
    console.log(`    ${display}  (${r.count} skills)`);
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
