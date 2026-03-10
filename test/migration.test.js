// test/migration.test.js
// E2E tests for v1 -> v2 config migration and old file cleanup.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createSandbox } from './helpers/sandbox.js';

describe('migration', () => {
  let sandbox;

  beforeEach(async () => { sandbox = await createSandbox(); });
  afterEach(async () => { await sandbox.cleanup(); });

  test('migrates v1 .conf file to skilltags.json', async () => {
    await sandbox.seedSkills('home');

    await sandbox.seedFile(
      '.cursor/skilltags-categories.conf',
      'frontend=react-components\ndatabase=postgres-optimization\n',
    );

    const result = await sandbox.run(['sync']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Migrated old config');

    const config = JSON.parse(await sandbox.readFile('.cursor/skilltags.json'));
    expect(config.categories.frontend).toEqual(['react-components']);
    expect(config.categories.database).toEqual(['postgres-optimization']);

    const oldExists = await sandbox.fileExists('.cursor/skilltags-categories.conf');
    expect(oldExists).toBe(false);
  });

  test('does not overwrite existing skilltags.json', async () => {
    await sandbox.seedConfig({
      version: '2.1.2',
      categories: { frontend: ['react-components'] },
    });

    await sandbox.seedFile(
      '.cursor/skilltags-categories.conf',
      'database=postgres-optimization\n',
    );

    await sandbox.run(['sync']);

    const config = JSON.parse(await sandbox.readFile('.cursor/skilltags.json'));
    expect(config.categories.frontend).toEqual(['react-components']);
    expect(config.categories.database).toBeUndefined();
  });

  test('renames ai-agents category to agent-tools', async () => {
    await sandbox.seedSkills('home');
    await sandbox.seedConfig({
      version: '2.1.2',
      categories: { 'ai-agents': ['react-components'] },
    });

    const result = await sandbox.run(['sync']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Renamed category');

    const config = JSON.parse(await sandbox.readFile('.cursor/skilltags.json'));
    expect(config.categories['ai-agents']).toBeUndefined();
    expect(config.categories['agent-tools']).toEqual(['react-components']);
  });

  test('cleans up old output files', async () => {
    await sandbox.seedConfig({
      version: '2.1.2',
      categories: { frontend: ['react-components'] },
    });

    await sandbox.seedFile('.cursor/commands/skilltags.md', 'old file');
    await sandbox.seedFile('.cursor/commands/project-skilltags.md', 'old file');
    await sandbox.seedFile('.cursor/commands/skills-frontend.md', 'old file');

    await sandbox.run(['sync']);

    expect(await sandbox.fileExists('.cursor/commands/skilltags.md')).toBe(false);
    expect(await sandbox.fileExists('.cursor/commands/project-skilltags.md')).toBe(false);
    expect(await sandbox.fileExists('.cursor/commands/skills-frontend.md')).toBe(false);
  });

  test('--local migrates project-scoped config', async () => {
    await sandbox.seedSkills('project', '.agents/skills');

    await sandbox.seedFile(
      '.cursor/skilltags-categories.conf',
      'frontend=react-components\n',
      'project',
    );

    const result = await sandbox.run(['sync', '--local']);
    expect(result.exitCode).toBe(0);

    const config = JSON.parse(await sandbox.readFile('.cursor/skilltags.json', 'project'));
    expect(config.categories.frontend).toEqual(['react-components']);
  });
});
