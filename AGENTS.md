# AGENTS.md

**Flexplorer** is an Obsidian plugin that enhances the native file explorer with custom sorting, pinning, and hiding features.

## Stack
- TypeScript v6
- React v19
- Voicss (CSS-in-TS styling)
- tsdown (transpilation + bundling)

## Architecture
- core layer (`src/core/`): DnD engine, order management, explorer observation, and patching logic
- UI layer (`src/ui/`): React components and Obsidian views

## Guidelines
- Run `bun typecheck` and `bun eslint --fix` after making changes