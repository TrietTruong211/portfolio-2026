// @ts-check
import tseslint from 'typescript-eslint'
import angularEslint from '@angular-eslint/eslint-plugin'
import angularEslintTemplate from '@angular-eslint/eslint-plugin-template'

/** @type {import('typescript-eslint').Config} */
export const baseConfig = tseslint.config(
  tseslint.configs.strictTypeChecked,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowHigherOrderFunctions: true },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
)

/** @type {import('typescript-eslint').Config} */
export const angularConfig = tseslint.config(
  {
    plugins: {
      '@angular-eslint': angularEslint,
      '@angular-eslint/template': angularEslintTemplate,
    },
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
    },
  }
)
