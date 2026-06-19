/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: String.raw`.*\.spec\.ts$`,
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  // Les fichiers types-only (interfaces) compilent en JS vide → 0 ligne couvrable.
  // index.ts n'est qu'un barrel de ré-exports, sans logique.
  collectCoverageFrom: ['**/*.(t|j)s', '!index.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
