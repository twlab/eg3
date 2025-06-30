# Version history

## 55.2.0

- added g3d UI and flexlayout component
- remote track, indicator when a user submit a track
- moved workers to genomeroot, decreasing init load times
- fixed where configmenu appears, so it doesn't get cut off
- refactor states in trackmanager

## 55.1.0

- Added loading indicator and track placeholder
- Added fetch seq in the top menu tab
- Implement apply matplot in right click menu
- Implement bin and norm for hic track
- Fixed track fetching the same regions when scrolling too fast or slow internet
- Fixed session upload where tracks is updated before genomeconfig
- Fixed regionSet bug
- refactor fetchworker

## 55.0.3

- Reworked screenshots - using expanded view only and working with genomealign and interaction
- Fixed highlight issue in screenshot, causing it to crash
- Fixed highlight on tracks when resizing window
- Stop the screenshot page from going blank from clicking download svg

## 55.0.2

- Refactor package.json
- Reorganize files for modularization
- Updated npm version

## 55.0.1

- Fixed a bug in screenshot
- Fixed a session saving error

## 55.0.0

- This is the first version of the third generation of the WashU Epigenome Browser, code was rewritten based on Vite.js and React framework, this update is described at [the Browser 2025 NAR update paper](https://doi.org/10.1093/nar/gkaf387).
