// test/cli-flags.test.js
// E2E tests for CLI flag handling: --version, --help, unknown commands, exit codes.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createSandbox } from './helpers/sandbox.js';

const VERSION = (await import('../package.json', { with: { type: 'json' } })).default.version;

describe('CLI flags', () => {
  let sandbox;

  beforeEach(async () => { sandbox = await createSandbox(); });
  afterEach(async () => { await sandbox.cleanup(); });

  test('--version prints version and exits 0', async () => {
    const result = await sandbox.run(['--version']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`skilltags v${VERSION}`);
  });

  test('-v prints version and exits 0', async () => {
    const result = await sandbox.run(['-v']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`skilltags v${VERSION}`);
  });

  test('--help prints usage and exits 0', async () => {
    const result = await sandbox.run(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('skilltags sync');
    expect(result.stdout).toContain('skilltags update');
    expect(result.stdout).toContain('--local');
    expect(result.stdout).toContain('--quiet');
  });

  test('-h prints usage and exits 0', async () => {
    const result = await sandbox.run(['-h']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });

  test('unknown subcommand prints error and exits 1', async () => {
    const result = await sandbox.run(['notacommand']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown command: notacommand');
  });

  test('--version takes precedence over subcommand', async () => {
    const result = await sandbox.run(['sync', '--version']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`skilltags v${VERSION}`);
  });
});
