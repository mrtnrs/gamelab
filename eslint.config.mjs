import nextPlugin from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  {
    plugins: {
      next: nextPlugin,
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    rules: {
      'next/no-html-link-for-pages': 'error',
    },
    settings: {
      next: {
        rootDir: '.',
      },
    },
  },
];

export default eslintConfig;
