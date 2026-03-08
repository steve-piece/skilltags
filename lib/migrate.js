// lib/migrate.js
// Detect and migrate v1 skilltags config/files to v2 skilltags format.

'use strict';

const fs = require('fs');
const path = require('path');
const {
  HOME,
  VERSION,
  OLD_GLOBAL_CONFIG,
  OLD_PROJECT_CONFIG,
  GLOBAL_CONFIG_PATH,
  PROJECT_CONFIG_PATH,
  GLOBAL_COMMANDS_DIR,
  PROJECT_COMMANDS_DIR,
  WRAPPER_MARKER,
} = require('./config');

const OLD_WRAPPER_MARKER = '# ─── skilltags / Cursor Skill Command Sync';

function migrateOldConfig(isLocal) {
  const oldPath = isLocal ? OLD_PROJECT_CONFIG : OLD_GLOBAL_CONFIG;
  const newPath = isLocal ? PROJECT_CONFIG_PATH : GLOBAL_CONFIG_PATH;

  if (!fs.existsSync(oldPath)) return false;
  if (fs.existsSync(newPath)) return false;

  const categories = {};
  try {
    const content = fs.readFileSync(oldPath, 'utf-8');
    for (const line of content.split('\n')) {
      if (line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const cat = line.slice(0, idx).trim();
      const skillList = line.slice(idx + 1).trim();
      if (cat) categories[cat] = skillList ? skillList.split(',').filter(Boolean) : [];
    }
  } catch {
    return false;
  }

  const config = { version: VERSION, categories };
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.writeFileSync(newPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

  try { fs.unlinkSync(oldPath); } catch {}

  return true;
}

function cleanOldOutputFiles(isLocal) {
  const commandsDir = isLocal ? PROJECT_COMMANDS_DIR : GLOBAL_COMMANDS_DIR;
  if (!fs.existsSync(commandsDir)) return;

  const oldFiles = [
    'skilltags.md',
    'project-skilltags.md',
  ];

  for (const name of oldFiles) {
    const filePath = path.join(commandsDir, name);
    try { fs.unlinkSync(filePath); } catch {}
  }

  try {
    const entries = fs.readdirSync(commandsDir);
    for (const entry of entries) {
      if (entry.startsWith('skills-') && entry.endsWith('.md')) {
        try { fs.unlinkSync(path.join(commandsDir, entry)); } catch {}
      }
    }
  } catch {}
}

function migrateShellWrapper() {
  const shellName = path.basename(process.env.SHELL || 'bash');
  let rcFile;
  if (shellName === 'zsh') rcFile = path.join(HOME, '.zshrc');
  else if (process.platform === 'darwin') rcFile = path.join(HOME, '.bash_profile');
  else rcFile = path.join(HOME, '.bashrc');

  let content;
  try {
    content = fs.readFileSync(rcFile, 'utf-8');
  } catch {
    return false;
  }

  if (!content.includes(OLD_WRAPPER_MARKER)) return false;

  const lines = content.split('\n');
  const filtered = [];
  let skipping = false;

  for (const line of lines) {
    if (line.includes(OLD_WRAPPER_MARKER)) {
      skipping = true;
      continue;
    }
    if (skipping && line.startsWith('# ─────────')) {
      skipping = false;
      continue;
    }
    if (!skipping) filtered.push(line);
  }

  let cleaned = filtered.join('\n');
  while (cleaned.endsWith('\n\n\n')) cleaned = cleaned.slice(0, -1);

  if (!cleaned.includes(WRAPPER_MARKER)) {
    cleaned += `
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
  }

  try {
    fs.writeFileSync(rcFile, cleaned, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function runMigration(isLocal) {
  let migrated = false;

  if (migrateOldConfig(isLocal)) {
    console.log('  ✓ Migrated old config to skilltags.json');
    migrated = true;
  }

  cleanOldOutputFiles(isLocal);

  if (!isLocal && migrateShellWrapper()) {
    console.log('  ✓ Updated shell wrapper to skilltags');
    migrated = true;
  }

  return migrated;
}

module.exports = { runMigration };
