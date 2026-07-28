module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
  },
  overrides: [
    {
      files: ['src/components/ui/3d-card.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      files: ['src/components/ui/hover-border-gradient.tsx'],
      rules: {
        'react-hooks/exhaustive-deps': 'off',
      },
    },
  ],
}
