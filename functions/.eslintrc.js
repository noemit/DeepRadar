module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:promise/recommended',
    'plugin:node/recommended',
    'google',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'semi': ['error', 'always'],
    'no-console': 'off',
    'require-jsdoc': 'off',
  },
  plugins: [
    'promise',
    'node',
  ],
  overrides: [
    {
      files: ['functions/index.js'],
      rules: {
        'node/no-missing-require': 'off',
      },
    },
  ],
};
