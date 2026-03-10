// test/cli-update.test.js
// E2E tests for the interactive setup wizard (skilltags update).
// Uses closeStdin to send immediate EOF, triggering ExitPromptError which
// the CLI catches gracefully. This lets us verify output before the prompt.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createSandbox } from './helpers/sandbox.js';
import { PREDEFINED_CATEGORIES } from '../lib/categories.js';

describe('skilltags update (wizard)', () => {
  let sandbox;

  beforeEach(async () => { sandbox = await createSandbox(); });
  afterEach(async () => { await sandbox.cleanup(); });

  // ─── Global first setup ───────────────────────────────────────────────────

  describe('global first setup: skilltags update', () => {
    test('prints "setup" header on fresh config', async () => {
      const result = await sandbox.run(['update'], { closeStdin: true });
      expect(result.stdout).toContain('skilltags: setup');
    });

    test('exits cleanly when stdin is closed (prompt cancelled)', async () => {
      const result = await sandbox.run(['update'], { closeStdin: true });
      expect(result.exitCode).toBe(0);
    });

    test('does not print project-scoped file paths', async () => {
      const result = await sandbox.run(['update'], { closeStdin: true });
      expect(result.stdout).not.toContain('.cursor/skilltags.json');
      expect(result.stdout).not.toContain('.cursor/commands/st-*.md');
    });
  });

  // ─── Local first setup ─────────────────────────────────────────────────────

  describe('local first setup: skilltags update --local', () => {
    test('prints "project setup" header on fresh config', async () => {
      const result = await sandbox.run(['update', '--local'], { closeStdin: true });
      expect(result.stdout).toContain('skilltags: project setup');
    });

    test('mentions project-scoped file paths', async () => {
      const result = await sandbox.run(['update', '--local'], { closeStdin: true });
      expect(result.stdout).toContain('.cursor/skilltags.json');
      expect(result.stdout).toContain('.cursor/commands/st-*.md');
    });

    test('mentions files will be created in the current repo', async () => {
      const result = await sandbox.run(['update', '--local'], { closeStdin: true });
      expect(result.stdout).toContain('project-scoped files in the current repo');
    });

    test('exits cleanly when stdin is closed', async () => {
      const result = await sandbox.run(['update', '--local'], { closeStdin: true });
      expect(result.exitCode).toBe(0);
    });
  });

  // ─── Existing config update ─────────────────────────────────────────────────

  describe('existing config: skilltags update', () => {
    beforeEach(async () => {
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: ['react-components'], database: ['postgres-optimization'] },
      });
    });

    test('prints "update categories" header', async () => {
      const result = await sandbox.run(['update'], { closeStdin: true });
      expect(result.stdout).toContain('skilltags: update categories');
    });

    test('does not print first-setup header', async () => {
      const result = await sandbox.run(['update'], { closeStdin: true });
      expect(result.stdout).not.toMatch(/skilltags: setup\n/);
      expect(result.stdout).not.toContain('skilltags: project setup');
    });
  });

  // ─── Single category edit ──────────────────────────────────────────────────

  describe('skilltags update <category>', () => {
    test('no config: prints error and exits 1', async () => {
      const result = await sandbox.run(['update', 'frontend'], { closeStdin: true });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No config found');
      expect(result.stderr).toContain('skilltags update');
    });

    test('unknown category: prints error with available categories', async () => {
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: ['react-components'], database: ['postgres-optimization'] },
      });

      const result = await sandbox.run(['update', 'nonexistent'], { closeStdin: true });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('"nonexistent" not found');
      expect(result.stderr).toContain('frontend');
      expect(result.stderr).toContain('database');
    });

    test('valid category: prints edit header with category title', async () => {
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: ['react-components'] },
      });

      const result = await sandbox.run(['update', 'frontend'], { closeStdin: true });
      expect(result.stdout).toContain('skilltags: edit Frontend category');
    });

    test('empty category: prints "No skills" message', async () => {
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: [] },
      });

      const result = await sandbox.run(['update', 'frontend'], { closeStdin: true });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No skills in this category');
    });

    test('valid category with skills: exits cleanly when prompt cancelled', async () => {
      await sandbox.seedConfig({
        version: '2.1.2',
        categories: { frontend: ['react-components'] },
      });

      const result = await sandbox.run(['update', 'frontend'], { closeStdin: true });
      expect(result.exitCode).toBe(0);
    });
  });
});

// ─── Category / documentation alignment ────────────────────────────────────

describe('category documentation alignment', () => {
  const DOCUMENTED_CATEGORIES = [
    'frontend',
    'backend',
    'database',
    'testing',
    'design',
    'performance',
    'mobile',
    'devops',
    'marketing',
    'accessibility',
    'agent-tools',
    'documentation',
  ];

  test('all documented categories exist in PREDEFINED_CATEGORIES', () => {
    for (const cat of DOCUMENTED_CATEGORIES) {
      expect(PREDEFINED_CATEGORIES).toContain(cat);
    }
  });

  test('all PREDEFINED_CATEGORIES are documented', () => {
    for (const cat of PREDEFINED_CATEGORIES) {
      expect(DOCUMENTED_CATEGORIES).toContain(cat);
    }
  });

  test('exactly 12 predefined categories', () => {
    expect(PREDEFINED_CATEGORIES).toHaveLength(12);
  });
});
