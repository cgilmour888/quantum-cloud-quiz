import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

import {
  defineConfig,
  globalIgnores,
} from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist/**',
    'node_modules/**',
    'coverage/**',
    '.vite/**',
    '_legacy/**',
  ]),

  {
    files: [
      'src/**/*.{ts,tsx}',
      'vite.config.ts',
      'vitest.config.ts',
    ],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite(),
    ],

    languageOptions: {
      ecmaVersion: 'latest',

      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      /*
       * QCQ production policy:
       * Permit deterministic primitive interpolation while continuing
       * to reject objects, arrays, and unsafe `any` stringification.
       */
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowAny: false,
          allowArray: false,
          allowBoolean: true,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: true,
        },
      ],
    },
  },
]);
