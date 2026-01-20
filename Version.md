# Version history

## 59.1.1
- fixed vcf not updating when changing zooming and viewRegion
- fixed screenshot causing crash when dragging track after opening and closing screenshot menu
- fixed dbedgraph not displaying 
- fixed css for some track during screenshot view
- change browser back to save state after refresh
- refactor tracklegend 
- mute some redux error


## 59.1.0
- added config options to change tracklegend font color
- fixed toolbar issue where click might not work
- added more conditions to prevent tracks from redrawing 
- fixed height issue with categorical tracks
- fixed vcf zoom causing crash 
- query genome follows genomealign in rough mode 
- outsideclicks now unselects and close config menu
- added query genome Annotation tracks selection when user add genomealign
- fixed crash when user move tracks when screenshot is open
- unselect Drag in toolbar will stop the track from moving
- fixed bigwig, numerical track not displaying the right density, because of computation
- reorganzing workers, and refactor code by moving them into one centralize location
- bugs fixs with, highlight menu, hubs
- implement old genome align rough hover css

## 59.0.0

- fixed rough mode genome alignment
- fixed sparse numerical display, now showing full view
- fixed feature placer, now correctly converting from genomic loci to xspan
- added better error checking for fetch
- rechecked all tracks for bugs with changes to feature placer
- readjusted color config for genomealign rough mode
- optimized and refactor trackmanager

## 58.0.5

- fixed critical bug where genome that querys with genomealign fetches too much data, increasing performance
- implemented white space checking for searching genome coordinates
- fixed long range text track not parsing file correctly
- fixed genome align rough mode color config

## 58.0.2

- fixed groupscale not displaying because of new code rework

## 58.0.1

- fixed small issue with custom genome not properly displaying when given id and name property

## 58.0.0

- reduced memory usage by combining loops and removing repeating creation of array elements
- implement workers into package version and refactor worker creation
- fixed configmenu css positioning
- fixed heatmap beam position
- fixed url link bug when you can't make a url after clicking url link
- implement full url for users that can't use tinyurl
- fixed genome align for package
- fixed clear all history bug and refactor history state
- clear static numerical fetch instance raw data after fetch, reducing memory usage
- implement persist state for package version, each new component keeps their previous state and load it on refresh
- changed how numerical track are displayed when there are only negative or positive

## 57.0.1

- added more error checking for saving sessions
- removed unused session tab
- small changes to session picker css, clearer import and move icon to top

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
