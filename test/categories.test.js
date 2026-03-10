// test/categories.test.js
// Unit tests for pure category matching functions (no filesystem dependency).

import { describe, test, expect } from 'vitest';
import {
  matchSkillToCategory,
  matchSkillsToCategories,
  PREDEFINED_CATEGORIES,
  toTitleCase,
} from '../lib/categories.js';

function skill(overrides = {}) {
  return {
    name: 'test-skill',
    title: 'Test Skill',
    path: '~/.agents/skills/test-skill',
    description: 'A test skill.',
    tags: '',
    ...overrides,
  };
}

describe('matchSkillToCategory', () => {
  test('matches by skill name', () => {
    const s = skill({ name: 'react-components' });
    expect(matchSkillToCategory(s, 'frontend')).toBe(true);
  });

  test('matches by description keyword', () => {
    const s = skill({ description: 'Optimize Postgres queries and schema designs' });
    expect(matchSkillToCategory(s, 'database')).toBe(true);
  });

  test('matches by path keyword', () => {
    const s = skill({ path: '~/.cursor/skills/tailwind-helper' });
    expect(matchSkillToCategory(s, 'frontend')).toBe(true);
  });

  test('matches with suffix variants (e.g. "testing" from "test")', () => {
    const s = skill({ name: 'webapp-testing' });
    expect(matchSkillToCategory(s, 'testing')).toBe(true);
  });

  test('does not match unrelated skill', () => {
    const s = skill({ name: 'seo-audit', description: 'SEO audit tool' });
    expect(matchSkillToCategory(s, 'frontend')).toBe(false);
  });

  test('returns false for unknown category', () => {
    const s = skill({ name: 'react-stuff' });
    expect(matchSkillToCategory(s, 'nonexistent-category')).toBe(false);
  });

  test('matches compound keywords like "react-native" to mobile', () => {
    const s = skill({ name: 'react-native-helper' });
    expect(matchSkillToCategory(s, 'mobile')).toBe(true);
  });

  test('matches keyword in multi-word description', () => {
    const s = skill({ description: 'Build accessible interfaces with proper aria labels' });
    expect(matchSkillToCategory(s, 'accessibility')).toBe(true);
  });
});

describe('matchSkillsToCategories', () => {
  test('groups skills into correct categories', () => {
    const skills = [
      skill({ name: 'react-components', description: 'React frontend components' }),
      skill({ name: 'postgres-optimization', description: 'Postgres database optimization' }),
      skill({ name: 'seo-audit', description: 'SEO audit and meta tags review' }),
    ];

    const result = matchSkillsToCategories(skills, ['frontend', 'database', 'marketing']);
    expect(result.frontend).toContain('react-components');
    expect(result.database).toContain('postgres-optimization');
    expect(result.marketing).toContain('seo-audit');
  });

  test('returns empty arrays for categories with no matches', () => {
    const skills = [skill({ name: 'react-components' })];
    const result = matchSkillsToCategories(skills, ['mobile']);
    expect(result.mobile).toEqual([]);
  });

  test('a skill can match multiple categories', () => {
    const s = skill({
      name: 'react-native-a11y',
      description: 'Accessibility helpers for React Native mobile apps',
    });

    const result = matchSkillsToCategories([s], ['mobile', 'accessibility', 'frontend']);
    expect(result.mobile).toContain('react-native-a11y');
    expect(result.accessibility).toContain('react-native-a11y');
  });
});

describe('toTitleCase', () => {
  test('converts hyphenated slug to title case', () => {
    expect(toTitleCase('agent-tools')).toBe('Agent Tools');
  });

  test('converts underscored slug to title case', () => {
    expect(toTitleCase('some_thing')).toBe('Some Thing');
  });

  test('handles single word', () => {
    expect(toTitleCase('frontend')).toBe('Frontend');
  });
});

describe('PREDEFINED_CATEGORIES', () => {
  test('contains expected categories', () => {
    expect(PREDEFINED_CATEGORIES).toContain('frontend');
    expect(PREDEFINED_CATEGORIES).toContain('backend');
    expect(PREDEFINED_CATEGORIES).toContain('database');
    expect(PREDEFINED_CATEGORIES).toContain('testing');
    expect(PREDEFINED_CATEGORIES).toContain('design');
    expect(PREDEFINED_CATEGORIES).toContain('agent-tools');
  });

  test('has 12 predefined categories', () => {
    expect(PREDEFINED_CATEGORIES).toHaveLength(12);
  });
});
