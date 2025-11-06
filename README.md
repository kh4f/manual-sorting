<div align="center">
	<h1>📌 This is a fork of <a href="https://github.com/kh4f/manual-sorting" target="_blank">kh4f/Manual Sorting</a></h1>
	<b>Please check out the version there. This is a temporary development version. It was generated to add support for the Obsidian Sync synchronization service to Manual Sorting.</b>
	<br><br>
</div>

<div align="left">

When working with Obsidian Sync, observe the following:
- Concurrent editing is _not_ permitted. Only work on one device at a time.
- Wait until synchronization is complete before starting your work.

When using Manual Sorting with Obsidian Sync:
- Always keep the 'Obsidian Sync support' option enabled in the settings.
- The default setting for the 'Sync inactivity reset timeout' is 2000 ms.
  This value must be greater than the longest time Obsidian Sync takes between retrieving two
  consecutive files from the remote vault. After the final file has been retrieved, this value
  provides Obsidian with additional time to process and complete the synchronization.
  For large vaults, many installed plugins, or slow connections on mobile devices, the value may
  need to be increased if problems occur.
- Your sort order is stored in
  <path_to_your_local_vault>\\.obsidian\plugins\manual-sorting\data.json
  You may want to back this up from time to time.

Installing Manual Sorting with Obsidian Sync:
- Obsidian settings, Sync, Installed community plugins  off
- Install and enable Manual Sorting
- Manual Sorting settings, Obsidian Sync support    on
- Delete <path_to_your_local_vault>\\.obsidian\plugins\manual-sorting\data.json
- Obsidian settings, Sync, Installed community plugins  on<br>
Background: Because Obsidian Sync support is disabled by default, Manual Sorting writes the
data.json file immediately without waiting for synchronization to complete. To handle this, we
temporarily disable synchronization of the plugin data, remove the unnecessary data.json file, and
then re-enable synchronization.
Note that this is not necessary if either
syncMonitorObs: true in constants.ts
or
updated code of manual-sorting (Kh4f already implemented this on the branch fix/sync-conflict
https://github.com/kh4f/manual-sorting/tree/fix/sync-conflict
"Skip saving settings to data.json when updateOrder() is
    triggered by workspace layout ready (since it’s not really necessary anyway, and during sync it
    only causes trouble)."

</div>

<div align="center">
	<b>An <a href="https://obsidian.md/" target="_blank">Obsidian</a> plugin that adds manual drag&drop sorting to the file explorer.</b>
	<br><br>
	<p>
		<a href='https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugin-stats.json#:~:text="manual%2Dsorting"' target="_blank"><img src="https://img.shields.io/badge/dynamic/json?logo=obsidian&color=363636&labelColor=be2a3c&label=Downloads&query=%24%5B%22manual-sorting%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&style=flat" alt="Downloads Badge"></a>
		<a href="https://github.com/Kh4f/manual-sorting/releases"><img src="https://img.shields.io/github/v/tag/Kh4f/manual-sorting?color=373737&labelColor=9c2437&label=%F0%9F%93%A6%20Release&style=flat" alt="Version Badge"></a>
		<a href="https://github.com/Kh4f/manual-sorting/blob/master/LICENSE"><img src="https://img.shields.io/github/license/Kh4f/manual-sorting?color=373737&labelColor=88304e&label=%F0%9F%9B%A1%EF%B8%8F%20Licence&style=flat" alt="License Badge"></a>
		<a href="https://github.com/Kh4f/manual-sorting/issues?q=is%3Aissue+is%3Aopen+label%3Abug"><img src="https://img.shields.io/github/issues/Kh4f/manual-sorting/bug?color=373737&labelColor=522546&label=%F0%9F%90%9B%20Bugs&style=flat" alt="Open Bugs Badge"></a>
	</p>
	<p>
		<b>
			<a href="#-key-features">Key Features</a> •
			<a href="#-how-to-use">How To Use</a> •
			<a href="#-installation">Installation</a> •
			<a href="#-credits">Credits</a>
		</b>
	</p>
	<br>
	<img align="center" max-width="800" style="border-radius: 5px;" src="https://github.com/user-attachments/assets/c3996f68-aa16-40ed-aea4-eb5a6dce6c74" alt="demo">
	<br><br>
	<i align="right">(File explorer tree theme used: <a href="https://github.com/LennZone/enhanced-file-explorer-tree" target="_blank">LennZone/enhanced-file-explorer-tree</a>)</i>
</div>


## 🎯 Key Features

- Your custom sort order is preserved and synced across devices
- Enable manual sorting mode via `✔️ Manual sorting` option
- Toggle dragging using `☑️ Dragging` checkbox
- Reset custom order with `🗑️ Reset order` button
- Seamlessly switch between manual and other sorting modes

## 🔍 How to Use

1. Open the `⚙️ Change sort order` menu and select `✔️ Manual sorting` mode.
2. Enable drag&drop by checking the `☑️ Dragging` option.
3. Freely reorder items within the file explorer by dragging them!

## 📥 Installation
- **Via Obsidian Community Plugins**: https://obsidian.md/plugins?id=manual-sorting
- **Using the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)**: `Add Beta Plugin` → `kh4f/manual-sorting`
- **Manually**: go to the [latest release](https://github.com/Kh4f/manual-sorting/releases/latest) → copy `main.js`, `manifest.json`, `styles.css` to `your-vault/.obsidian/plugins/manual-sorting/`

## 💖 Credits
- **Powered by**:  [SortableJS](https://github.com/SortableJS/Sortable), [monkey-around](https://github.com/pjeby/monkey-around)
- **Icon library**:  [Lucide](https://lucide.dev/) (for the custom menu options)
- **Inspiration**: [Obsidian Bartender](https://github.com/nothingislost/obsidian-bartender), [Custom File Explorer sorting](https://github.com/SebastianMC/obsidian-custom-sort)
- **Huge thanks** to [@Paining1](https://github.com/Paining1), [@Azmoinal](https://github.com/Azmoinal), [@SublimePeace](https://github.com/SublimePeace) for testing and providing feedback on the plugin!
- **Special thanks** to [@Mara-Li](https://github.com/Mara-Li) for contributions and feature suggestions!

</br>

<div align="center">
  <b>MIT licensed | © 2025 <a href="https://github.com/Kh4f">Kh4f</a></b>
</div>
