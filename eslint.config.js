import eslintReact from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const I18N_MESSAGE = 'UI text must come from the i18n dictionaries (use t()).';

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage', 'playwright-report', 'test-results']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      eslintReact.configs['strict-type-checked'],
      reactHooks.configs.flat['recommended-latest'],
      jsxA11y.configs.strict,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'error',
      // Every visible or announced string goes through i18n; no literals in JSX.
      'no-restricted-syntax': [
        'error',
        { selector: 'JSXText[value=/\\S/]', message: I18N_MESSAGE },
        {
          selector:
            'JSXAttribute[name.name=/^(aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext|alt|title|placeholder|label)$/] > Literal[value=/\\S/]',
          message: I18N_MESSAGE,
        },
      ],
    },
  },

  {
    // The domain layer is pure: no React, no browser adapters, no UI.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'virtual:*'],
              message: 'domain/ must stay framework-free.',
            },
            {
              group: ['**/ui/**', '**/app/**', '**/platform/**', '**/i18n/**'],
              message: 'domain/ must not depend on UI, platform adapters or i18n.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['*.config.{ts,js}', 'config/**/*.ts', 'e2e/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  prettier,
]);
