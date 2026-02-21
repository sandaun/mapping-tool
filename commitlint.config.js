/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types allowed. 'feat!' and 'fix!' trigger BREAKING CHANGE (major bump).
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature       → minor bump
        'fix', // Bug fix           → patch bump
        'chore', // Maintenance       → patch bump
        'docs', // Documentation     → no bump
        'style', // Formatting only   → no bump
        'refactor', // Code restructure  → no bump
        'perf', // Performance       → patch bump
        'test', // Tests             → no bump
        'ci', // CI/CD changes     → no bump
        'build', // Build system      → no bump
        'revert', // Revert a commit   → patch bump
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
};

module.exports = config;
