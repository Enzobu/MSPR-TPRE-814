/**
 * Conventional Commits — aligné avec .claude/rules/06-git.md
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'style'],
    ],
    'scope-enum': [
      2,
      'always',
      ['pays', 'central', 'front', 'iot', 'contracts', 'docker', 'ci', 'docs', 'deps', 'repo'],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
