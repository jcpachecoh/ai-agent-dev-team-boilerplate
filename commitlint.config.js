/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // new feature
        'fix', // bug fix
        'docs', // documentation only
        'style', // formatting, no logic change
        'refactor', // neither fixes a bug nor adds a feature
        'perf', // performance improvement
        'test', // adding or updating tests
        'build', // build system or external dependencies
        'ci', // CI configuration
        'chore', // other changes that don't modify src or test
        'revert', // reverts a previous commit
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
  },
};
