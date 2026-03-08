// lib/discovery.js
// Scan all known agent skill paths, deduplicate, and extract metadata.

'use strict';

const fs = require('fs');
const path = require('path');
const { GLOBAL_SKILL_SOURCES, PROJECT_SKILL_SOURCES, HOME } = require('./config');

function extractDescription(skillFile) {
  let content;
  try {
    content = fs.readFileSync(skillFile, 'utf-8');
  } catch {
    return '(No description available)';
  }

  const lines = content.split('\n');
  let inFrontmatter = false;

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) { inFrontmatter = true; continue; }
      else { inFrontmatter = false; continue; }
    }
    if (inFrontmatter && line.match(/^description:/)) {
      return line
        .replace(/^description:\s*/, '')
        .replace(/^['"]|['"]$/g, '')
        .trim();
    }
  }

  inFrontmatter = false;
  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) { inFrontmatter = true; continue; }
      else { inFrontmatter = false; continue; }
    }
    if (inFrontmatter) continue;
    if (line.startsWith('#')) continue;
    if (line.trim() === '') continue;
    return line.trim();
  }

  return '(No description available)';
}

function extractMetadataTags(skillFile) {
  let content;
  try {
    content = fs.readFileSync(skillFile, 'utf-8');
  } catch {
    return '';
  }

  const lines = content.split('\n');
  let inFrontmatter = false;
  let inMetadata = false;

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) { inFrontmatter = true; continue; }
      else break;
    }
    if (inFrontmatter && line.match(/^metadata:/)) { inMetadata = true; continue; }
    if (inMetadata && line.match(/^[^ ]/)) { inMetadata = false; }
    if (inMetadata && line.includes('tags:')) {
      return line
        .replace(/.*tags:\s*/, '')
        .replace(/[\[\]]/g, '')
        .replace(/,/g, ':')
        .replace(/\s/g, '')
        .trim();
    }
  }

  return '';
}

function toTitleCase(str) {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function walkForSkills(baseDir) {
  const results = [];
  if (!fs.existsSync(baseDir)) return results;

  let entries;
  try {
    entries = fs.readdirSync(baseDir, { recursive: true, withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (!entry.isFile() || entry.name !== 'SKILL.md') continue;

    const parentDir = typeof entry.parentPath === 'string'
      ? entry.parentPath
      : path.join(baseDir, entry.path || '');
    const fullPath = path.join(parentDir, entry.name);
    const rel = path.relative(baseDir, fullPath);

    if (rel.split(path.sep).some(seg => seg !== '.' && seg.startsWith('.'))) continue;

    results.push({
      skillDir: parentDir,
      skillFile: fullPath,
      skillName: path.basename(parentDir),
    });
  }

  return results;
}

function discoverSkills({ localOnly = false } = {}) {
  const seen = new Set();
  const skills = [];
  let sourceCount = 0;

  const sources = localOnly ? PROJECT_SKILL_SOURCES : [...GLOBAL_SKILL_SOURCES, ...PROJECT_SKILL_SOURCES];

  for (const source of sources) {
    if (!fs.existsSync(source.path)) continue;
    sourceCount++;

    const found = walkForSkills(source.path);
    for (const { skillDir, skillFile, skillName } of found) {
      if (seen.has(skillName)) continue;
      seen.add(skillName);

      const displayPath = skillDir.replace(HOME, '~');
      const description = extractDescription(skillFile);
      const tags = extractMetadataTags(skillFile);
      const title = toTitleCase(skillName);

      skills.push({
        name: skillName,
        title,
        path: displayPath,
        description,
        tags,
      });
    }
  }

  return { skills, sourceCount };
}

module.exports = { discoverSkills };
