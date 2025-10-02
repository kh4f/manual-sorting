import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

export default defineConfig([
	{
		name: 'Base Rules',
		files: ['**/*.ts'],
		extends: [eslint.configs.recommended],
		languageOptions: { globals: { ...globals.node } },
	},
	{
		name: 'Type-Aware Rules',
		files: ['**/*.ts'],
		extends: [
			tseslint.configs.strictTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		rules: {
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/no-dynamic-delete': 'off',
			'@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
			'@typescript-eslint/no-this-alias': 'off',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/naming-convention': ['error', {
				selector: ['classProperty', 'classMethod'],
				format: ['camelCase'],
				leadingUnderscore: 'forbid',
			}],
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		name: 'Stylistic Rules',
		files: ['**/*.ts'],
		extends: [stylistic.configs.recommended],
		rules: {
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/indent-binary-ops': ['error', 'tab'],
			'@stylistic/no-tabs': 'off',
			'@stylistic/linebreak-style': ['error', 'unix'],
			'@stylistic/eol-last': ['error', 'never'],
			'@stylistic/brace-style': ['error', '1tbs'],
		},
	},
])