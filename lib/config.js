// lib/config.js
// Paths, constants, and JSON config I/O for skilltags.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const VERSION = require('../package.json').version;

const GLOBAL_CONFIG_PATH = path.join(HOME, '.cursor', 'skilltags.json');
const GLOBAL_COMMANDS_DIR = path.join(HOME, '.cursor', 'commands');
const PROJECT_COMMANDS_DIR = path.join(process.cwd(), '.cursor', 'commands');
const PROJECT_CONFIG_PATH = path.join(process.cwd(), '.cursor', 'skilltags.json');

const OLD_GLOBAL_CONFIG = path.join(HOME, '.cursor', 'skill-tags-categories.conf');
const OLD_PROJECT_CONFIG = path.join(process.cwd(), '.cursor', 'skill-tags-categories.conf');

const WRAPPER_MARKER = '# -- skilltags auto-sync ';

const GLOBAL_SKILL_SOURCES = [
  { path: path.join(HOME, '.agents', 'skills'), label: 'global skills' },
  { path: path.join(HOME, '.claude', 'skills'), label: 'claude code' },
  { path: path.join(HOME, '.cursor', 'skills'), label: 'cursor' },
  { path: path.join(HOME, '.cursor', 'skills-cursor'), label: 'cursor built-in' },
  { path: path.join(HOME, '.cursor', 'plugins', 'cache'), label: 'cursor plugins' },
  { path: path.join(HOME, '.copilot', 'skills'), label: 'github copilot' },
  { path: path.join(HOME, '.cline', 'skills'), label: 'cline' },
  { path: path.join(HOME, '.codex', 'skills'), label: 'codex' },
  { path: path.join(HOME, '.gemini', 'skills'), label: 'gemini cli' },
  { path: path.join(HOME, '.augment', 'skills'), label: 'augment' },
  { path: path.join(HOME, '.roo', 'skills'), label: 'roo code' },
  { path: path.join(HOME, '.windsurf', 'skills'), label: 'windsurf' },
  { path: path.join(HOME, '.codeium', 'windsurf', 'skills'), label: 'windsurf (codeium)' },
  { path: path.join(HOME, '.trae', 'skills'), label: 'trae' },
  { path: path.join(HOME, '.continue', 'skills'), label: 'continue' },
  { path: path.join(HOME, '.junie', 'skills'), label: 'junie' },
  { path: path.join(HOME, '.kilocode', 'skills'), label: 'kilo code' },
  { path: path.join(HOME, '.agent', 'skills'), label: 'antigravity' },
  { path: path.join(HOME, '.codebuddy', 'skills'), label: 'codebuddy' },
  { path: path.join(HOME, '.commandcode', 'skills'), label: 'command code' },
  { path: path.join(HOME, '.cortex', 'skills'), label: 'cortex code' },
  { path: path.join(HOME, '.config', 'crush', 'skills'), label: 'crush' },
  { path: path.join(HOME, '.factory', 'skills'), label: 'droid' },
  { path: path.join(HOME, '.config', 'goose', 'skills'), label: 'goose' },
  { path: path.join(HOME, '.neovate', 'skills'), label: 'neovate' },
  { path: path.join(HOME, '.config', 'opencode', 'skills'), label: 'opencode' },
  { path: path.join(HOME, '.openhands', 'skills'), label: 'openhands' },
  { path: path.join(HOME, '.pi', 'agent', 'skills'), label: 'pi' },
  { path: path.join(HOME, '.pochi', 'skills'), label: 'pochi' },
  { path: path.join(HOME, '.qoder', 'skills'), label: 'qoder' },
  { path: path.join(HOME, '.qwen', 'skills'), label: 'qwen code' },
  { path: path.join(HOME, '.zencoder', 'skills'), label: 'zencoder' },
  { path: path.join(HOME, '.claude', 'plugins', 'cache'), label: 'claude plugins' },
];

const PROJECT_SKILL_SOURCES = [
  { path: path.join(process.cwd(), '.agents', 'skills'), label: 'project skills' },
  { path: path.join(process.cwd(), '.claude', 'skills'), label: 'project claude' },
  { path: path.join(process.cwd(), '.cursor', 'skills'), label: 'project cursor' },
  { path: path.join(process.cwd(), '.github', 'skills'), label: 'project copilot' },
  { path: path.join(process.cwd(), '.cline', 'skills'), label: 'project cline' },
  { path: path.join(process.cwd(), '.roo', 'skills'), label: 'project roo' },
  { path: path.join(process.cwd(), '.codex', 'skills'), label: 'project codex' },
];

function getConfigPath(isLocal) {
  return isLocal ? PROJECT_CONFIG_PATH : GLOBAL_CONFIG_PATH;
}

function getCommandsDir(isLocal) {
  return isLocal ? PROJECT_COMMANDS_DIR : GLOBAL_COMMANDS_DIR;
}

function readConfig(isLocal) {
  const configPath = getConfigPath(isLocal);
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeConfig(config, isLocal) {
  const configPath = getConfigPath(isLocal);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function createDefaultConfig(categories) {
  return {
    version: VERSION,
    categories: categories || {},
  };
}

module.exports = {
  HOME,
  VERSION,
  GLOBAL_CONFIG_PATH,
  GLOBAL_COMMANDS_DIR,
  PROJECT_COMMANDS_DIR,
  PROJECT_CONFIG_PATH,
  OLD_GLOBAL_CONFIG,
  OLD_PROJECT_CONFIG,
  WRAPPER_MARKER,
  GLOBAL_SKILL_SOURCES,
  PROJECT_SKILL_SOURCES,
  getConfigPath,
  getCommandsDir,
  readConfig,
  writeConfig,
  createDefaultConfig,
};
