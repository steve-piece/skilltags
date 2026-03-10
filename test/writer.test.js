// test/writer.test.js
// E2E tests for generated st-*.md output file content and structure.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createSandbox } from './helpers/sandbox.js';

const VERSION = (await import('../package.json', { with: { type: 'json' } })).default.version;

describe('writer output', () => {
  let sandbox;

  beforeEach(async () => { sandbox = await createSandbox(); });
  afterEach(async () => { await sandbox.cleanup(); });

  test('generated file contains correct version stamp', async () => {
    await sandbox.seedSkills('home');
    await sandbox.seedConfig({
      version: VERSION,
      categories: { frontend: ['react-components'] },
    });

    await sandbox.run(['sync', '--quiet']);
    const content = await sandbox.readFile('.cursor/commands/st-frontend.md');
    expect(content).toContain(`skilltags v${VERSION}`);
  });

  test('generated file has proper markdown structure', async () => {
    await sandbox.seedSkills('home');
    await sandbox.seedConfig({
      version: VERSION,
      categories: { database: ['postgres-optimization'] },
    });

    await sandbox.run(['sync', '--quiet']);
    const content = await sandbox.readFile('.cursor/commands/st-database.md');

    expect(content).toMatch(/^# Skills: Database/m);
    expect(content).toMatch(/^## Database Skills/m);
    expect(content).toMatch(/^### Postgres Optimization/m);
  });

  test('skill section includes path and description', async () => {
    await sandbox.seedSkills('home');
    await sandbox.seedConfig({
      version: VERSION,
      categories: { frontend: ['react-components'] },
    });

    await sandbox.run(['sync', '--quiet']);
    const content = await sandbox.readFile('.cursor/commands/st-frontend.md');

    expect(content).toContain('react-components');
    expect(content).toContain('React');
  });

  test('multiple skills in one category', async () => {
    await sandbox.seedSkills('home');
    await sandbox.seedConfig({
      version: VERSION,
      categories: { testing: ['vitest-testing'] },
    });

    await sandbox.run(['sync', '--quiet']);
    const content = await sandbox.readFile('.cursor/commands/st-testing.md');
    expect(content).toContain('Vitest Testing');
  });

  test('multiple categories produce separate files', async () => {
    await sandbox.seedSkills('home');
    await sandbox.seedConfig({
      version: VERSION,
      categories: {
        frontend: ['react-components'],
        database: ['postgres-optimization'],
        marketing: ['seo-audit'],
      },
    });

    await sandbox.run(['sync', '--quiet']);

    expect(await sandbox.fileExists('.cursor/commands/st-frontend.md')).toBe(true);
    expect(await sandbox.fileExists('.cursor/commands/st-database.md')).toBe(true);
    expect(await sandbox.fileExists('.cursor/commands/st-marketing.md')).toBe(true);
  });

  test('snapshot: database category file', async () => {
    await sandbox.seedSkills('home');
    await sandbox.seedConfig({
      version: VERSION,
      categories: { database: ['postgres-optimization'] },
    });

    await sandbox.run(['sync', '--quiet']);
    const content = await sandbox.readFile('.cursor/commands/st-database.md');
    expect(content).toMatchSnapshot();
  });
});
