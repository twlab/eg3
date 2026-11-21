---
sidebar_position: 1
---

# Datahub syntax

A datahub is a [JSON](http://json.org/) file describing a set of tracks
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

Each track is described by the properties listed in [Track properties](./track_properties.md). A complete
hub and an example of every track type are in [Example data hub](./example_datahub.md).

:::danger important

For each track in datahub, `showOnHubLoad` need set to `true` for the track to be displayed in browser. Tracks without `showOnHubLoad` set to `true` won't be displayed in browser but can be added later from **Tracks** > **Track Facet Table**.
:::

## Load a datahub

Put the datahub file and the track files on a web server that anyone can read (see
[Track file formats](../tracks/file-tracks.md) for the server settings the Browser needs). Then
load the hub in one of these ways:

- **Tracks** > **Remote Tracks** > **Add Data Hubs**: type the URL of the hub in **Remote Hub URL**
  and click **Load Hub**, or drop a hub file on your computer on **Upload Hub File**. A hub loaded
  here may also be written in [JSON5](https://json5.org/), which allows comments, unquoted keys
  and trailing commas.
- A link with the `hub` URL parameter, for example
  `https://epigenomegateway.wustl.edu/browser/?genome=mm10&hub=https://your.host/your.hub.json`.
  See [URL parameters](../url-params.md). A hub given in a link must be plain JSON, and its track
  `url`s must be full URLs.
- A hub that points to track files on your own computer is loaded from **Tracks** > **Local Tracks**
  > **Add Local Hub**, see [Local tracks](../tracks/local-tracks.md).

The tracks of the hub that are not displayed are listed in **Tracks** > **Track Facet Table**,
where they can be found by their [metadata](./track_properties.md#metadata) and added to the view.
