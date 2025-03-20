---
sidebar_position: 5
---

# URL parameters

## genome

`?genome=hg19`

loads the hg19 genome default tracks

## hub

`?genome=hg19&hub=https…json`

loads hg19 default tracks plus the hub provided in the URL, only load the tracks in hub has `showOnHubLoad` set as `true`

## sessionFile

`?sessionFile=http..json`  

loads the session using the prodived JSON session file.

## position

`?genome=hg19&position=chr1:1-1000`

loads hg19 plus jumping to `chr1:1-1000`
