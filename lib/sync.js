// lib/sync.js
// Sync orchestrator: discover skills, generate category files from config.

'use strict';

const { readConfig, getCommandsDir, HOME } = require('./config');
const { discoverSkills } = require('./discovery');
const { generateAllCategoryFiles } = require('./writer');
const { runMigration } = require('./migrate');

function log(quiet, ...args) {
  if (!quiet) console.log('  ' + args.join(' '));
}

function runSync({ localOnly = false, quiet = false } = {}) {
  if (!quiet) {
    const { VERSION } = require('./config');
    console.log(`\n  skilltags v${VERSION} — syncing\n`);
  }

  runMigration(localOnly);

  const config = readConfig(localOnly);
  if (!config || !config.categories || Object.keys(config.categories).length === 0) {
    log(quiet, 'No categories configured. Run: skilltags update');
    if (!quiet) console.log();
    return { skills: [], results: [] };
  }

  const { skills, sourceCount } = discoverSkills({ localOnly });
  log(quiet, `Found ${skills.length} skill(s) across ${sourceCount} source(s)`);

  const commandsDir = getCommandsDir(localOnly);
  const results = generateAllCategoryFiles(config, skills, commandsDir);

  if (!quiet) {
    console.log();
    for (const r of results) {
      const display = r.path.replace(HOME, '~');
      console.log(`  ✓ ${display}  (${r.count} skills)`);
    }
    console.log();
  }

  return { skills, results };
}

module.exports = { runSync };
