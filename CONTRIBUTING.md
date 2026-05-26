# Contributing

Thanks for your interest in improving **Flexplorer**! Any contributions are welcome.

## Issues
Found a bug or want to propose a feature? Please open an issue with:
- Platform (desktop or mobile)
- Clear description
- Steps to reproduce (for bugs)
- Screenshots are appreciated

## Pull Requests
### Stack
- TypeScript v6
- React v19
- Voicss (CSS-in-TS)
- tsdown (build)
- Bun (package management)

### Architecture
- core layer (`src/core/`): DnD engine, order management, explorer observation, and patching logic
- UI layer (`src/ui/`): React components and Obsidian views

### Development
```bash
git clone https://github.com/kh4f/flexplorer
cd flexplorer
bun i    # install deps
bun dev  # build artifacts
```

### Testing
```bash
bun typecheck  # static type analysis
bun eslint     # linting
```