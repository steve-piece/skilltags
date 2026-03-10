#!/usr/bin/env node
// bin/postinstall.js
// Runs after `npm install skilltags`. Keeps install non-interactive on modern npm.
// If config already exists, re-sync silently. Otherwise print the next setup command.

'use strict';

if (process.platform === 'win32') process.exit(0);

function isGlobalInstall() {
  return process.env.npm_config_global === 'true';
}

function printLocalInstallMessage() {
  console.log('\n  skilltags was installed locally in this project.\n');
  console.log('  This package is a CLI, so a global install is still recommended if you want `skilltags` in your shell PATH:');
  console.log('    npm install -g skilltags\n');

  console.log('  For project-level setup in this repo, run:');
  console.log('    npx skilltags update --local\n');
}

async function main() {
  const { readConfig } = require('../lib/config');

  if (!isGlobalInstall()) {
    const existingLocalConfig = readConfig(true);

    if (existingLocalConfig) {
      const { runSync } = require('../lib/sync');
      try {
        runSync({ localOnly: true, quiet: true });
      } catch (err) {
        // Ignore errors to avoid breaking npm install
      }
      return;
    }

    printLocalInstallMessage();
    return;
  }

  const existingConfig = readConfig(false);

  if (existingConfig) {
    const { runSync } = require('../lib/sync');
    try {
      runSync({ quiet: true });
    } catch (err) {
      // Ignore errors to avoid breaking npm install
    }
    return;
  }

  console.log('\n  skilltags installed. Run skilltags update to configure categories.\n');
}

main();
