import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintReact from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import stylistic from '@stylistic/eslint-plugin'
import voicss from '@voicss/eslint'

export default defineConfig([
	{
		name: 'Base Rules',
		files: ['**/*.ts?(x)'],
		extends: [eslint.configs.recommended],
	},
	{
		name: 'Type-Aware Rules',
		files: ['**/*.ts?(x)'],
		extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
		languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
		rules: {
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/no-confusing-void-expression': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/no-dynamic-delete': 'off',
			'@typescript-eslint/no-this-alias': 'off',
		},
	},
	{
		name: 'React Rules',
		files: ['**/*.ts?(x)'],
		extends: [eslintReact.configs['recommended-type-checked'], reactHooks.configs.flat.recommended],
		rules: { 'react-hooks/immutability': 'off' },
	},
	{
		name: 'Stylistic Rules',
		files: ['**/*.ts?(x)'],
		extends: [stylistic.configs.recommended, voicss.configs.recommended],
		rules: {
			'@stylistic/no-tabs': 'off',
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/indent-binary-ops': ['error', 'tab'],
			'@stylistic/brace-style': ['error', '1tbs'],
			'@stylistic/arrow-parens': ['error', 'as-needed'],
			'@stylistic/comma-dangle': ['error', 'only-multiline'],
			'@stylistic/eol-last': ['error', 'never'],
			'@stylistic/jsx-indent-props': ['error', 'tab'],
			'@stylistic/jsx-one-expression-per-line': 'off',
			'@stylistic/jsx-tag-spacing': ['error', { beforeClosing: 'never', beforeSelfClosing: 'never' }],
			'@stylistic/jsx-wrap-multilines': 'off',
			'@stylistic/jsx-closing-tag-location': 'off',
			'@stylistic/jsx-closing-bracket-location': 'off',
			'@stylistic/jsx-quotes': ['error', 'prefer-single'],
			'@stylistic/operator-linebreak': 'off',
		},
	},
])