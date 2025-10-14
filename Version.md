# Version history
## 57.0.0
- Implemented a way for users to retry fetching a track if there is an error 
- Implemented History menu, allow user to change to past or future states
- Implemented URL param for datahub
- Implemented shortcut keys for tools
- implemented auto detect if file is ensembl and displays them
- Allow users to import session in Genome picker menu 
- Pressing Escape now allow users to exit out of sub menus
- Redesign Sessions, history, toolbar and genome picker
- refactor gene search
- Reworked toolbar to fit screen when user zoom in and out
- fixed memory deleting memory caching 
- fixed issues between sessions
- fixed issues with custom genome saving them in session
- increase overall stability and increase error checks 

## 56.0.8

- fixed the css issue of tool bar

## 56.0.7

- fixed search bar css 
- fixed screenshot bug where track crashes
- fixed bug when tabs open changing state cause crash
- fixed bug when changing state to the latest do not update tracks

## 56.0.6

- fixed bug where track not showing when the user scroll to previous regions
- updated bigwig fetch, @gmod/bbi to new version, fixed error with negative regions

## 56.0.5

- implemented longrange local text tracks
- increase track draw speed, by using less useeffect
- fixed error when user select IMAGECOUNT

## 56.0.4

- center toolbar
- fixed initial slow loading by separating out flexlayout (found by wenjin)
- increase reactivity when switching between pages
- refactor state, userViewRegion, sizeChange, and viewRegion

## 56.0.3

- Fixed modbed crash when zooming in
- implement ability for user to save chromosomes to app session for remotely loading custom genomes
- moved Toolbar above tracks
- fixed local upload bug, where changing configs will crash
- implemented a more in depth parse for regionset and multi chromosome regions
- refactor viewRegion and userViewRegion to only use genomeCoordinate

## 56.0.2

- Fixed app session, not loading previous after saving
- implement ability for user to save chromosomes to app session for remotely loading custom genomes

## 56.0.1

- Fixed the screenshot bug
- Fixed initial loading position

## 56.0.0

- implement multiple workers to fetch and process data, individual
  tracks group will be immediately display without waiting for all tracks
  to be finishes processing
- track now support touch screen devices, allowing the user to move the tracks with touch controls
- implement hover data for ruler
- improved speed of loading tracks
- fixed tooltip hover for metadata
- fixed aggregateMethod config bug
- fixed flexlayout height bug
- implement indicator that shows number of items too small
- refactor packages.json
- refactor checking const objects

## 55.2.0

- added g3d UI and flexlayout component
- remote track, indicator when a user submit a track
- moved workers to genomeroot, decreasing init load times
- fixed where configmenu appears, so it doesn't get cut off
- refactor states in trackmanager
- fixed bug where groupscale are not applying in screenshot

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
