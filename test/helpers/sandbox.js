// test/helpers/sandbox.js
// Temp directory factory for isolated E2E tests. Creates fake HOME + project dirs, seeds fixtures.

'use strict';

import { mkdtemp, rm, mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execa } from 'execa';

const BIN = resolve(import.meta.dirname, '..', '..', 'bin', 'skilltags.js');
const POSTINSTALL_BIN = resolve(import.meta.dirname, '..', '..', 'bin', 'postinstall.js');
const FIXTURES_DIR = resolve(import.meta.dirname, '..', 'fixtures', 'skills');

export async function createSandbox() {
  const root = await mkdtemp(join(tmpdir(), 'skilltags-test-'));
  const home = join(root, 'home');
  const project = join(root, 'project');

  await mkdir(home, { recursive: true });
  await mkdir(project, { recursive: true });

  return {
    root,
    home,
    project,

    async seedSkills(targetBase = 'home', location = '.agents/skills') {
      const base = targetBase === 'home' ? home : project;
      const destDir = join(base, location);
      await cp(FIXTURES_DIR, destDir, { recursive: true });
    },

    async seedSkill(name, content, targetBase = 'home', location = '.agents/skills') {
      const base = targetBase === 'home' ? home : project;
      const skillDir = join(base, location, name);
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
    },

    async seedConfig(config, targetBase = 'home') {
      const base = targetBase === 'home' ? home : project;
      const configDir = join(base, '.cursor');
      await mkdir(configDir, { recursive: true });
      await writeFile(join(configDir, 'skilltags.json'), JSON.stringify(config, null, 2) + '\n', 'utf-8');
    },

    async seedFile(relativePath, content, targetBase = 'home') {
      const base = targetBase === 'home' ? home : project;
      const fullPath = join(base, relativePath);
      await mkdir(join(fullPath, '..'), { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
    },

    async readFile(relativePath, targetBase = 'home') {
      const base = targetBase === 'home' ? home : project;
      return readFile(join(base, relativePath), 'utf-8');
    },

    async fileExists(relativePath, targetBase = 'home') {
      const base = targetBase === 'home' ? home : project;
      try {
        await readFile(join(base, relativePath));
        return true;
      } catch {
        return false;
      }
    },

    run(args = [], opts = {}) {
      const execaOpts = {
        cwd: opts.cwd || project,
        env: { ...process.env, HOME: home, ...opts.env },
        reject: false,
      };
      if (opts.closeStdin) execaOpts.input = '';
      return execa('node', [BIN, ...args], execaOpts);
    },

    runPostinstall(opts = {}) {
      return execa('node', [POSTINSTALL_BIN], {
        cwd: opts.cwd || project,
        env: { ...process.env, HOME: home, ...opts.env },
        reject: false,
      });
    },

    async cleanup() {
      await rm(root, { recursive: true, force: true });
    },
  };
}
