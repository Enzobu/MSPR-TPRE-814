/**
 * Conventional Commits
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'style', 'build', 'perf', 'revert'],
    ],

    'scope-empty': [0],

    'scope-enum': [0],

    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
