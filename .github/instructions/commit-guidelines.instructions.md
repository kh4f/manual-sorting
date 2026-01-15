# Commit Message Guidelines

## Style
- Use American English
- Use backticks for code entities, paths, libraries, flags, etc.

## Format
The commit message should be structured as follows:
```md
<type>(<scope>): <subject>
<blank line>
<body>
<blank line>
<breaking changes>
<blank line>
<footer>
```
where \<type>, \<scope>, and \<subject> (a.k.a. 'commit header') are mandatory, and \<body>, \<breaking changes>, and \<footer> (a.k.a. 'commit details') are optional.

### Header

#### Type
The type of the change. Allowed types (with commit examples):

1. **feat** (a new feature for the user)
  - feat(dnd): implement auto-scrolling during drag
  - feat(cli): add `--silent` flag to suppress output
  - feat(ui): introduce dark mode theme switcher
  - feat(settings): add `newItemsPosition` option to control default position for new items
  - feat(changelog-gen): add `replace` helper to default changelog helpers
2. **fix** (bug fix)
  - fix(root): add `suppressHydrationWarning` property to `html` tag to resolve hydration error
  - fix(dnd): display correct target folder in drag tooltip
  - fix(utils): handle edge case in `parseVersion` function
  - fix(versioner): prioritize breaking changes over features
  - fix(tsdown): add `.d.ts` to resolve extensions and eliminate unresolved import warnings
3. **refactor** (code/structure improvement)
  - refactor(utils): move `deepLog` function to `logger.ts` module
  - refactor(config)!: remove obsolete `ignoreWarnings` option and related logic
  - refactor(changelog-gen)!: replace `stdout` and `outputFile` options with unified `output`
  - refactor(homepage): replace CSS modules with `linaria` for styling
  - refactor(pages): move `page.tsx` from `app` to `pages`
4. **perf** (performance improvement)
  - perf(commit-parser): optimize commit parsing logic by caching results
  - perf(dnd): replace post-processing reordering with incremental insertion during load
  - perf(database): improve query performance with indexing
  - perf(image-loader): implement lazy loading for images
  - perf(api): optimize response time by batching requests
5. **style** (formatting, styling, visual changes)
  - style(codebase): apply consistent formatting across the codebase
  - style(package): normalize indentation
  - style(readme): update badges layout for better appearance
  - style(header): add shadow for better contrast
  - style(logger): prefix run outputs with `[syncroid]` tag
6. **chore** (maintenance change, e.g., tooling, dependencies, scripts...)
  - chore(copilot): add initial copilot instructions
  - chore(eslint): add name to global ignores
  - chore(deps): bump `vite` from ^7.2.0 to ^7.2.1
  - chore(tsconfig): update `jsx` setting to use `react-jsx`
  - chore(package): update lint script to use `eslint` instead of `next lint`
7. **build** (build system change)
  - build(tsdown): configure `tsdown` and build scripts
  - build(bundler): migrate from `esbuild` to `tsdown` for better ecosystem support
  - build(vite): update config for production build
  - build(docker): update Dockerfile for multi-stage build
  - build(tsdown): replace file-based `syncroid` detection with env variable
8. **test** (test change)
  - test(auth): mock external API calls
  - test(versioner): add unit tests for version manager
  - test(cli): replace manual CLI checks with automated tests
  - test(dnd): add integration tests for drag-and-drop functionality
  - test(config-resolver): add tests for multiple profile support
9. **ci** (CI change)
  - ci(checks): add initial CI workflow for push events
  - ci(release): add `--no-git-checks` flag to npm publish command
  - ci(release): restrict release trigger to semantic version tags
  - ci(workflows): update lint step to use `lint:fix` script instead of `lint` for auto-fixing
  - ci(workflows): update build step to run in production mode
10. **docs** (documentation change)
  - docs(readme): add usage instructions
  - docs(readme): add contribution guidelines section
  - docs(readme): update examples for new configuration options
  - docs(api): document new endpoints in API reference
  - docs(changelog): update repo name in URLs

#### Scope
The specific area of the project affected (e.g., component, module, feature).

#### Subject
A brief summary of the change. Use present tense, imperative mood, and lowercase.

### Details

#### Body
Add a \<body> if the \<subject> needs more context or a clearer explanation of the reason for the change. Using the present tense and imperative mood is preferable.

If the \<subject> is too broad and covers multiple changes, add a \<body> as a bullet list of changes.

#### Breaking Changes
If the commit introduces breaking changes, add a \<breaking changes> section starting with the 'BREAKING CHANGE:' token. Also, add a '!' before the colon in the commit header.

For multiple breaking changes, list them as bullet points.

#### Footer
If the commit references an Issue/PR (I’ll let you know), include a \<footer>.

#### Detailed Commit Examples
- test(cli): use `runCli` function instead of executing `dist/cli.js`
  
  Remove the need for building the project before running tests.
- fix(changelog-gen): use `breakingChanges` property instead of `subject` for `BREAKING CHANGES` section
  
  Previously, when a commit had a `breakingChanges` property, the changelog would incorrectly display the commit's `subject` in the `BREAKING CHANGES` section instead of the actual `breakingChanges` content.
- feat(config): add silent mode to suppress console output
  
  - Add `logger.ts` utility with `setSilent` and `log` functions
  - Add `silent` option to `UserConfig` interface
  - Replace `console.log` calls with centralized `log` function across lifecycles
  - Initialize silent mode in main `relion` function
- fix(root): add `suppressHydrationWarning` property to `html` tag
  
  Fixes #12
  Refs #34
- feat(config)!: add support for multiple profiles with CLI `--profile` flag
  
  BREAKING CHANGE: Changed alias for 'prerelease' option to 'P' to reserve 'p' for the new '--profile' option.
  
  Closes #45
- refactor(config)!: remove `packageFiles` option and related logic
  
  BREAKING CHANGE: The `packageFiles` option has been removed. The current version is now always read from `package.json`.
- refactor(changelog-gen)!: replace `stdout` and `outputFile` options with unified `output`
  
  - Update changelog generation logic to handle console output and file writing based on `output` value
  - Update tests to use new option format
  - Update type definitions
  - Update project's relion config

  BREAKING CHANGE: The `stdout` and `outputFile` options have been removed from changelog configuration. Use the new `output` option with 'stdout' for console output or a file path string for file output.