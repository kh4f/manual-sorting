# Commit Naming Guidelines

## General Rules
- Use English
- Use backticks for file, folder, component, function, library and other code entity names, suffixes, flags, etc.
- Wrap commit message to markdown code block

## Commit Message Format
The commit message should be structured as follows:
```md
<type>(<scope>): <subject>

[body]

[BREAKING CHANG(E/ES): ...]

[footer]
```
Type, scope and subject (a.k.a. commit header) are mandatory. Body, breaking changes and footer (a.k.a. commit details) are optional.

### Header

#### Type
The type of the change. Allowed types (with commit examples):

1. **feat** (new feature)
  - feat(config): add support for multiple profiles
  - feat(cli): add `--silent` flag to suppress output

2. **fix** (bug fix)  
  - fix(root): add `suppressHydrationWarning` property to `html` tag to resolve hydration error
  - fix(utils): handle edge case in `parseVersion` function

3. **refactor** (code improvement without affecting functionality)  
  - refactor(utils): move `deepLog` function to `logger.ts` module
  - refactor(config)!: remove obsolete `ignoreWarnings` option and related logic
  - refactor(changelog)!: replace `stdout` and `outputFile` options with unified `output`
  - refactor(homepage): replace CSS modules with `linaria` for styling
  - refactor(core): simplify conditional lifecycle calls
  - refactor(pages): move `page.tsx` from `app` to `pages`

4. **style** (formatting, styling, and visual changes)  
  - style(templates): add backtick quotes around `footer` partial
  - style(codebase): apply consistent formatting across the codebase
  - style(package): normalize indentation

5. **perf** (performance improvement)  
  - perf(commit-parser): optimize commit parsing logic by caching results
  - perf(database): improve query performance with indexing

6. **docs** (documentation change)  
  - docs(copilot): add commit naming guidelines with examples
  - docs(readme): add usage instructions
  - docs(contributing): add guidelines for contributing to the project
  - docs(changelog): update repo name in urls

7. **chore** (maintenance change, e.g., tooling, dependencies, scripts...)  
  - chore(eslint): add name to global ignores
  - chore(deps): update all dependencies to latest versions
  - chore(dev-deps): bump globals from ^16.3.0 to ^16.4.0
  - chore(tsconfig): update `jsx` setting to use `react-jsx`
  - chore(gitignore): remove `next-env.d.ts` from ignored files
  - chore(package): update lint script to use `eslint` instead of `next lint`
  - chore(nextjs): add postinstall patch to prevent Next.js from modifying tsconfig

8. **test** (test change)  
  - test(utils): add unit tests for version manager
  - test(cli): include `-d` flag for changelog generation in dry run mode

9. **build** (build system change)  
  - build(tsdown): add `tsdown` build script and configuration
  - build(vite): update `vite` config for production build

10. **ci** (CI change)  
  - ci(release): add `--no-git-checks` flag to npm publish command  
  - ci(checks): add initial CI workflow

#### Scope
The area of the codebase affected (e.g., component, module, feature). Scope is always required.

#### Subject
A brief summary of the change. Use present tense, imperative mood, and lowercase.

### Details

#### Body
Add a `body` if the subject needs more context or a clearer explanation of the reason for the change.

If the `subject` is too broad and covers multiple changes, add a `body` as a bullet list of changes.

#### Breaking Changes
If the commit introduces breaking changes, add a `BREAKING CHANGES:` section. Also, add a `!` before the colon in the commit header.
- If there are multiple breaking changes, list them all in the `BREAKING CHANGES:` section as bullet points.
- If there is only one breaking change, use the singular form: `BREAKING CHANGE:` (without the trailing 's').

#### Footer
If the commit references an Issue/PR (I’ll let you know), include a footer.

#### Commits with Details Examples
- ```md
  test(cli): use `runCli` function instead of executing `dist/cli.js`
  
  This removes the need for building the project before running tests.
  ```
- ```md
  fix(changelog): use `breakingChanges` property instead of `subject` for `BREAKING CHANGES` section

  Previously, when a commit had a `breakingChanges` property, the changelog would incorrectly display the commit's `subject` in the `BREAKING CHANGES` section instead of the actual `breakingChanges` content.
  ```
- ```md
  feat(config): add silent mode to suppress console output
  
  - Add `logger.ts` utility with `setSilent` and `log` functions
  - Add `silent` option to `UserConfig` interface
  - Replace `console.log` calls with centralized `log` function across lifecycles
  - Initialize silent mode in main `relion` function
  ```
- ```md
  fix(root): add `suppressHydrationWarning` property to `html` tag
  
  Fixes #12
  Refs #34
  ```
- ```md
  feat(config)!: add support for multiple profiles with CLI `--profile` flag
  
  BREAKING CHANGE: Changed alias for 'prerelease' option to 'P' to reserve 'p' for the new '--profile' option.
  
  Refs #45
  ```
- ```md
  refactor(options)!: remove `packageFiles` option and related logic
  
  BREAKING CHANGE: The `packageFiles` option has been removed. The current version is now always read from `package.json`.
  ```
- ```md
  refactor(changelog)!: replace `stdout` and `outputFile` options with unified `output`

  - Update changelog generation logic to handle console output and file writing based on `output` value
  - Update tests to use new option format
  - Update type definitions
  - Update project's relion config

  BREAKING CHANGE: The `stdout` and `outputFile` options have been removed from changelog configuration. Use the new `output` option with 'stdout' for console output or a file path string for file output.
  ```