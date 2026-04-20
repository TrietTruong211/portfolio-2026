// @ts-check
import tseslint from 'typescript-eslint'
import angularEslint from '@angular-eslint/eslint-plugin'
import angularEslintTemplate from '@angular-eslint/eslint-plugin-template'
import playwright from 'eslint-plugin-playwright'

export default tseslint.config(
  tseslint.configs.strictTypeChecked,
  {
    plugins: {
      '@angular-eslint': angularEslint,
    },
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    plugins: { '@angular-eslint/template': angularEslintTemplate },
    files: ['src/**/*.html'],
    rules: {
      '@angular-eslint/template/no-negated-async': 'error',
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-networkidle': 'off',
    },
  },
  {
    ignores: ['dist/**', '.angular/**', 'coverage/**', 'src/index.html', 'src/app/app.component.html'],
  }
)
