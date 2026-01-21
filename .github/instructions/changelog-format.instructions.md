# Changelog Format

## Template

```md
## &ensp; [` 📦 <tag>  `](<repoURL>/compare/<prevTag>...<tag>)

### &emsp; <section-title>
- **<brief>**: <user-friendly-description>. [🡥](<repoURL>/commit/<hash>)
- **<brief>**: <description>. [🡥](<repoURL>/commit/<hash>) [#<issue>](<repoURL>/issues/<issue>)

### &emsp; <another-section-title>
- **<brief>**:
    - <description #1>. [🡥](<repoURL>/commit/<hash>)
    - <description #2>. [🡥](<repoURL>/commit/<hash>)

##### &emsp;&emsp; [_Full Changelog_](<repoURL>/compare/<prevTag>...<tag>) &ensp;•&ensp; _<date>_
```

### Brief
A brief title of the change in 2-4 words.

### Description
A concise description of the change for end-users in sentence format.

### Allowed Sections
- 🧨 BREAKING CHANGES
- 🎁 Features
- 🩹 Fixes
- ⚡ Performance
- 📚 Documentation
- 🎨 Style
- ⚙️ Internal

## Examples

```md
## &ensp; [` 📦 3.2.3  `](https://github.com/kh4f/manual-sorting/compare/3.2.2...3.2.3)

### &emsp; 🎁 Features
- **Auto-scrolling during drag**: the explorer now scrolls automatically when dragging items near the edges. [🡥](https://github.com/kh4f/manual-sorting/commit/4h5i6j7)

### &emsp; 🩹 Fixes
- **Fixed RMB drag activation**: holding the right mouse button no longer triggers drag & drop. [🡥](https://github.com/kh4f/manual-sorting/commit/7f1a2b3) [#114](https://github.com/kh4f/manual-sorting/issues/114)
- **Reliable drop zone cleanup**: drop zones now always clear when releasing the mouse, even outside Obsidian or after opening context menus on Mac. [🡥](https://github.com/kh4f/manual-sorting/commit/8c9d0e1) [#115](https://github.com/kh4f/manual-sorting/issues/115) [#116](https://github.com/kh4f/manual-sorting/issues/116)

##### &emsp;&emsp; [_Full Changelog_](https://github.com/kh4f/manual-sorting/compare/3.2.2...3.2.3) &ensp;•&ensp; _Dec 26, 2025_
```

```md
## &ensp; [` 📦 3.2.2  `](https://github.com/kh4f/manual-sorting/compare/3.2.1...3.2.2)

### &emsp; 🩹 Fixes
- **Improved multi-selection dragging**:
    - Nested folders no longer escape to the parent level. [🡥](https://github.com/kh4f/manual-sorting/commit/4a5b6c7) [#113](https://github.com/kh4f/manual-sorting/issues/113)
    - Prevented accidental nesting of selected items. [🡥](https://github.com/kh4f/manual-sorting/commit/1d2e3f4)
    - Disallowed dropping a multi-selection into folders that are part of the same selection. [🡥](https://github.com/kh4f/manual-sorting/commit/9e8d7c6)
- **Refined drop zone behavior**:
    - Drop zones no longer appear in default sorting modes. [🡥](https://github.com/kh4f/manual-sorting/commit/0f1e2d3)
    - Fixed phantom drop zones appearing near empty folders. [🡥](https://github.com/kh4f/manual-sorting/commit/8a7b6c5)
- **Accurate drag tooltip**: the drag tooltip now always displays the correct target folder name. [🡥](https://github.com/kh4f/manual-sorting/commit/3d4e5f6)

### &emsp; 🎨 Style
- **Clearer active drop indicator**: improved the visual clarity of the active drop zone for more precise positioning. [🡥](https://github.com/kh4f/manual-sorting/commit/7g8h9i0)
- **Updated drag handle icon**: drag handles now use the more familiar 2×3 dot pattern. [🡥](https://github.com/kh4f/manual-sorting/commit/6b7c8d9)

##### &emsp;&emsp; [_Full Changelog_](https://github.com/kh4f/manual-sorting/compare/3.2.1...3.2.2) &ensp;•&ensp; _Dec 24, 2025_
```

```md
## &ensp; [` 📦 3.0.0  `](https://github.com/kh4f/manual-sorting/compare/2.5.1...3.0.0)

### &emsp; 🧨 BREAKING CHANGES
- The settings storage format has been completely redesigned. **Your existing settings, including custom order, will be reset.** [🡥](https://github.com/kh4f/manual-sorting/commit/4l5m6n7)
- The option to **disable dragging has been removed**. [🡥](https://github.com/kh4f/manual-sorting/commit/8o9p0q1)

### &emsp; 🩹 Fixes
- **Fixed mobile folder expansion**: resolved issues where folders wouldn't open when tapped on mobile. [🡥](https://github.com/kh4f/manual-sorting/commit/2j3k4l5) [#118](https://github.com/kh4f/manual-sorting/issues/118)
- **Enhanced drag boundaries**: drag events now properly handle interactions outside the file explorer. [🡥](https://github.com/kh4f/manual-sorting/commit/0i1j2k3)
- **Fixed keyboard selection issue**: resolved incorrect note highlighting when using keyboard navigation. [🡥](https://github.com/kh4f/manual-sorting/commit/6u7v8w9) [#46](https://github.com/kh4f/manual-sorting/issues/46)
- **Wider touch activation area**: expanded the drag zone width for more reliable dragging on mobile. [🡥](https://github.com/kh4f/manual-sorting/commit/6m7n8o9)

### &emsp; ⚙️ Internal
- **Settings migration**: settings storage has been updated with automatic migration to the new v4 format. [🡥](https://github.com/kh4f/manual-sorting/commit/0e1f2g3)

##### &emsp;&emsp; [_Full Changelog_](https://github.com/kh4f/manual-sorting/compare/2.5.1...3.0.0) &ensp;•&ensp; _Nov 6, 2025_
```