// lib/categories.js
// Predefined skill categories and keyword-based matching logic.

'use strict';

const PREDEFINED_CATEGORIES = [
  'frontend',
  'backend',
  'database',
  'testing',
  'design',
  'accessibility',
  'performance',
  'agent-tools',
  'devops',
  'marketing',
  'mobile',
  'documentation',
];

const CATEGORY_KEYWORDS = {
  frontend: [
    'frontend',
    'react', 'next', 'nextjs', 'vue', 'nuxt', 'svelte', 'sveltekit', 'angular',
    'tailwind', 'css', 'sass', 'html', 'jsx', 'tsx',
    'shadcn', 'radix', 'vite', 'webpack', 'turbopack',
    'framer-motion', 'container-query', 'server-component', 'rsc', 'app-router',
  ],
  backend: [
    'graphql', 'trpc', 'expressjs', 'fastify', 'nestjs', 'hono',
    'fastapi', 'django', 'laravel',
    'webhook', 'websocket', 'jwt', 'oauth', 'better-auth',
    'stripe', 'payment', 'serverless', 'edge-function', 'lambda',
  ],
  database: [
    'postgres', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis',
    'drizzle', 'prisma', 'knex',
    'supabase', 'planetscale', 'neon', 'turso',
    'sql', 'orm', 'row-level-security', 'rls',
  ],
  testing: [
    'vitest', 'jest', 'mocha', 'playwright', 'cypress', 'puppeteer', 'selenium',
    'test-driven', 'tdd', 'bdd', 'e2e', 'end-to-end',
    'webapp-testing', 'browser-testing',
  ],
  design: [
    'figma', 'sketch', 'adobe-xd',
    'typography', 'font-pairing',
    'glassmorphism', 'neumorphism', 'brutalism', 'skeuomorphism', 'flat-design',
    'dark-mode', 'design-token', 'design-system', 'style-guide', 'brand-guideline',
    'interface-design', 'ux-audit', 'ux-review', 'web-design-guideline', 'design-pattern',
  ],
  accessibility: [
    'accessibility', 'a11y', 'aria', 'wcag',
    'screen-reader', 'voiceover', 'nvda', 'jaws',
    'reduced-motion', 'prefers-reduced-motion', 'semantic-html',
    'keyboard-navigation', 'focus-trap',
  ],
  performance: [
    'lighthouse', 'web-vitals', 'core-web-vitals', 'lcp', 'cls', 'inp', 'fcp', 'ttfb',
    'lazy-load', 'code-split', 'tree-shake',
    'stale-while-revalidate', 'isr',
    'webp', 'avif', 'bundle-size', 'virtual-list',
    'react-doctor',
  ],
  'agent-tools': [
    'subagent', 'multi-agent', 'parallel-agent',
    'skill-creator', 'skill-install', 'brainstorm',
    'mcp', 'cursor', 'claude-code', 'claude-md', 'cursor-rule',
    'browser-automation', 'browser-use', 'worktree',
    'code-review', 'debugging', 'verification',
    'llm', 'openai', 'anthropic', 'gemini',
  ],
  devops: [
    'netlify', 'railway', 'fly-io', 'heroku',
    'docker', 'dockerfile', 'docker-compose', 'kubernetes', 'k8s',
    'cicd', 'github-actions', 'gitlab-ci', 'circleci',
    'terraform', 'pulumi',
    'nginx', 'caddy',
    'deploy', 'deployment', 'rollback',
  ],
  marketing: [
    'seo', 'seo-audit', 'meta-tag', 'open-graph', 'twitter-card', 'json-ld', 'schema-markup',
    'sitemap', 'robots-txt', 'structured-data',
    'google-analytics', 'plausible', 'posthog',
    'programmatic-seo', 'copywriting', 'a-b-test',
  ],
  mobile: [
    'react-native', 'expo', 'expo-router',
    'flutter', 'dart', 'swiftui', 'kotlin', 'jetpack-compose',
    'ios', 'android',
    'eas-build', 'eas-submit', 'reanimated',
  ],
  documentation: [
    'markdown', 'mdx', 'readme', 'changelog',
    'openapi', 'swagger', 'typedoc', 'jsdoc',
    'docusaurus', 'nextra', 'mintlify', 'gitbook', 'vitepress',
    'github-flavored-markdown', 'gfm',
  ],
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchSkillToCategory(skill, category) {
  const keywords = CATEGORY_KEYWORDS[category] || [];
  if (keywords.length === 0) return false;

  const searchText = [skill.name, skill.description, skill.path]
    .join(' ')
    .toLowerCase()
    .replace(/-/g, ' ');

  for (const kw of keywords) {
    const normalized = kw.toLowerCase().replace(/-/g, ' ');
    const escaped = escapeRegex(normalized);
    const pattern = new RegExp('\\b' + escaped + '(?:s|es|ed|ing|er|ment)?\\b');
    if (pattern.test(searchText)) return true;
  }

  return false;
}

function matchSkillsToCategories(skills, categoryNames) {
  const result = {};
  for (const cat of categoryNames) {
    result[cat] = skills
      .filter(s => matchSkillToCategory(s, cat))
      .map(s => s.name);
  }
  return result;
}

function toTitleCase(str) {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = {
  PREDEFINED_CATEGORIES,
  CATEGORY_KEYWORDS,
  matchSkillToCategory,
  matchSkillsToCategories,
  toTitleCase,
};
