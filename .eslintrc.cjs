module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  env: { node: true, es2022: true, browser: false },
  ignorePatterns: ['**/dist/**', '**/build/**', 'node_modules/**'],
  overrides: [
    {
      files: ['**/*.tsx', '**/*.jsx'],
      env: { browser: true },
      plugins: ['react', 'react-hooks'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended', 'prettier'],
      settings: { react: { version: 'detect' } }
    }
  ]
};
