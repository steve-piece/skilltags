// test/cli-postinstall.test.js
// E2E tests for all installation paths: postinstall behavior and wizard entry points.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createSandbox } from './helpers/sandbox.js';

describe('postinstall', () => {
  let sandbox;

  beforeEach(async () => { sandbox = await createSandbox(); });
  afterEach(async () => { await sandbox.cleanup(); });

  // ─── npm install skilltags (local, no -g flag) ──────────────────────────────

  describe('local install: npm install skilltags', () => {
    const localEnv = { npm_config_global: '' };

    test('fresh install: tells user it was installed locally', async () => {
      const result = await sandbox.runPostinstall({ env: localEnv });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('skilltags was installed locally in this project');
    });

    test('fresh install: recommends global install for shell PATH', async () => {
      const result = await sandbox.runPostinstall({ env: localEnv });
      expect(result.stdout).toContain('npm install -g skilltags');
    });

    test('fresh install: tells user to run npx skilltags update --local', async () => {
      const result = await sandbox.runPostinstall({ env: localEnv });
      expect(result.stdout).toContain('npx skilltags update --local');
    });

    test('fresh install: does not print global setup message', async () => {
      const result = await sandbox.runPostinstall({ env: localEnv });
      expect(result.stdout).not.toContain('skilltags installed. Run skilltags update');
    });

    test('existing local config: silently re-syncs', async () => {
      await sandbox.seedSkills('project', '.agents/skills');
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: ['react-components'] },
      }, 'project');

      const result = await sandbox.runPostinstall({ env: localEnv });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('installed locally');
      expect(result.stdout).not.toContain('npx skilltags update');
    });

    test('existing local config: generates category files', async () => {
      await sandbox.seedSkills('project', '.agents/skills');
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: ['react-components'] },
      }, 'project');

      await sandbox.runPostinstall({ env: localEnv });
      const exists = await sandbox.fileExists('.cursor/commands/st-frontend.md', 'project');
      expect(exists).toBe(true);
    });

    test('existing local config: does not touch global commands', async () => {
      await sandbox.seedSkills('project', '.agents/skills');
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: ['react-components'] },
      }, 'project');

      await sandbox.runPostinstall({ env: localEnv });
      const globalExists = await sandbox.fileExists('.cursor/commands/st-frontend.md', 'home');
      expect(globalExists).toBe(false);
    });
  });

  // ─── npm install -g skilltags (global) ──────────────────────────────────────

  describe('global install: npm install -g skilltags', () => {
    const globalEnv = { npm_config_global: 'true' };

    test('fresh install: prints skilltags installed message', async () => {
      const result = await sandbox.runPostinstall({ env: globalEnv });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('skilltags installed');
    });

    test('fresh install: tells user to run skilltags update', async () => {
      const result = await sandbox.runPostinstall({ env: globalEnv });
      expect(result.stdout).toContain('skilltags update');
    });

    test('fresh install: does not print local install message', async () => {
      const result = await sandbox.runPostinstall({ env: globalEnv });
      expect(result.stdout).not.toContain('installed locally');
      expect(result.stdout).not.toContain('npx skilltags update --local');
    });

    test('existing global config: silently re-syncs', async () => {
      await sandbox.seedSkills('home');
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { database: ['postgres-optimization'] },
      });

      const result = await sandbox.runPostinstall({ env: globalEnv });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('skilltags installed');
      expect(result.stdout).not.toContain('skilltags update');
    });

    test('existing global config: generates category files', async () => {
      await sandbox.seedSkills('home');
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { database: ['postgres-optimization'] },
      });

      await sandbox.runPostinstall({ env: globalEnv });
      const exists = await sandbox.fileExists('.cursor/commands/st-database.md');
      expect(exists).toBe(true);
    });

    test('existing global config: generated files have correct content', async () => {
      await sandbox.seedSkills('home');
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { database: ['postgres-optimization'] },
      });

      await sandbox.runPostinstall({ env: globalEnv });
      const content = await sandbox.readFile('.cursor/commands/st-database.md');
      expect(content).toContain('Postgres Optimization');
      expect(content).toContain('# Skills: Database');
    });
  });
});
