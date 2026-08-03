import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooksPlugin from 'eslint-plugin-react-hooks';
import obsidianPlugin from 'eslint-plugin-obsidianmd';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      'react-hooks': hooksPlugin,
      'obsidianmd': obsidianPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'warn',
      'obsidianmd/prefer-create-el': 'warn',
      'obsidianmd/settings-tab/no-deprecated-display': 'warn',
      'obsidianmd/settings-tab/prefer-setting-definitions': 'warn',
    },
  },
  {
    ignores: ['main.js', 'node_modules/**', 'dist/**'],
  }
);
