---
sidebar_position: 1
---

# Datahub syntax

A datahub is a [JSON](http://json.org/) file descibing a set of tracks
in the browser. A datahub file is an array of tracks, which are also
defined in JSON syntax:

``` json
[
    {
    "type": "track_type1",
    "name": "track_name1",
    "url": "track_url1",
    "showOnHubLoad": true,
    "options": {
        "color": "red"
        }
    },
    {
    "type": "track_type2",
    "name": "track_name2",
    "url": "track_url2",
    "showOnHubLoad": true,
    "options": {
        "color": "blue"
        }
    }
]
```

:::danger important

For each track in datahub, `showOnHubLoad` need set to `true` for the track to be displayed in browser. Tracks without `showOnHubLoad` set to `true` won\'t be displayed in browser but can be added later in track facet table.
:::
