import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * Shared ESLint configuration for React apps
 * @param {Object} options
 * @param {string[]} options.ignores - Additional patterns to ignore
 */
export function createReactConfig(options = {}) {
  const { ignores = [] } = options

  return [
    {
      ignores: ['dist', 'node_modules', ...ignores],
    },
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      extends: [
        js.configs.recommended,
        reactHooks.configs['recommended-latest'],
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        ecmaVersion: 2022,
        globals: globals.browser,
        parserOptions: {
          ecmaVersion: 'latest',
          ecmaFeatures: { jsx: true },
          sourceType: 'module',
        },
      },
      rules: {
        'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      },
    },
  ]
}

export default createReactConfig
