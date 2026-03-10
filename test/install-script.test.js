// test/install-script.test.js
// Tests that install.sh references the correct commands and fallback messages.

import { describe, test, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INSTALL_SH = await readFile(
  resolve(import.meta.dirname, '..', 'install.sh'),
  'utf-8',
);

describe('install.sh', () => {
  test('installs globally with --ignore-scripts', () => {
    expect(INSTALL_SH).toContain('npm install -g skilltags --ignore-scripts');
  });

  test('runs skilltags update as the interactive wizard', () => {
    expect(INSTALL_SH).toContain('skilltags update');
  });

  test('prints fallback commands if not interactive', () => {
    expect(INSTALL_SH).toContain('skilltags update');
    expect(INSTALL_SH).toContain('skilltags sync');
    expect(INSTALL_SH).toContain('skilltags --help');
  });

  test('checks for Node.js before installing', () => {
    expect(INSTALL_SH).toContain('command -v node');
  });

  test('checks for npm before installing', () => {
    expect(INSTALL_SH).toContain('command -v npm');
  });

  test('handles non-interactive shells gracefully', () => {
    expect(INSTALL_SH).toMatch(/-t 0.*-t 1/);
  });
});
