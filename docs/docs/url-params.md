---
sidebar_position: 5
---

# URL parameters

A link to the Browser can open a genome at a given region, with your own tracks, or restore a whole
session. The parameters follow the address of the Browser after a `?` and are separated by `&`, for
example:

`https://epigenomegateway.wustl.edu/browser/?genome=hg38&position=chr7:27100000-27250000`

| parameter | what it does | needs `genome` |
| --- | --- | --- |
| [genome](#genome) | opens a genome with its default tracks | |
| [position](#position) | the region to show | yes |
| [hub](#hub) | adds the tracks of a datahub | yes |
| [noDefaultTracks](#nodefaulttracks) | with `hub`: leaves out the default tracks | yes |
| [sessionFile](#sessionfile) | restores a session from a session file | no |
| [bundleId / bundle](#bundleid--bundle) | restores a saved session bundle | no |
| [blob](#blob) | restores the session stored in a link from the **Share** tab | no |
| [datahub, coordinate, …](#legacy-links-datahub-coordinate) | links made for the retired 1st-generation browser | yes |

Without any parameter, or with a `genome` the Browser does not know, the genome picker is shown.

:::tip

If a value (such as the URL of a hub) itself contains `?`, `&` or `#`, encode it first, for example
with `encodeURIComponent` in JavaScript.
:::

When you reload a page opened from such a link, the Browser returns to the session that the link
created in this tab, with the changes you made since, instead of building a new one.

## genome

`?genome=hg19`

loads the hg19 genome default tracks

## hub

`?genome=hg19&hub=https…json`

loads hg19 default tracks plus the hub provided in the URL. Only the tracks of the hub that have `showOnHubLoad` set as `true` are displayed; the other tracks of the hub can be added later from the track table.

The hub file must be plain JSON (not JSON5), and the `url` of each track must be a full URL; see
[Datahub](datahub/datahub.md). If the hub cannot be loaded, a message says so and the genome is
shown with its default tracks.

### noDefaultTracks

`?genome=hg19&hub=https…json&noDefaultTracks=1`

displays the hub tracks without the default tracks of the genome.

If no track of the hub has `showOnHubLoad` set to `true`, the default tracks are displayed anyway.

## position

`?genome=hg19&position=chr1:1-1000`

loads hg19 plus jumping to `chr1:1-1000`

`position` works together with `genome`; it is ignored otherwise.

## sessionFile

`?sessionFile=https://your.host/your-session.json`

loads the session in the given JSON session file: genome, region, tracks and their settings. No
`genome` parameter is needed. A session file is downloaded from the session panel, see
[Manage sessions](use-the-browser/manage-sessions.md). Like a hub, the file must be on a web server
that anyone can read. If it cannot be loaded, a message says so and the genome picker is shown.

## bundleId / bundle

`?bundleId=your-session-bundle-id` (or the shorter `?bundle=your-session-bundle-id`)

loads a session bundle saved with the session panel, using its **Session Bundle ID**, see
[Manage sessions](use-the-browser/manage-sessions.md). Session bundles are stored in a database of
the Browser site; a copy of the Browser that you run yourself needs its own database for this, see
[Run your own copy](installation.md). If the bundle cannot be fetched, a message says so and the
genome picker is shown.

:::caution

A bundle ID is meant to be shared with people you trust. To publish, use a `hub` or `sessionFile`
link instead, see [Publish with the browser](contact.md).
:::

## blob

`?blob=…`

is the link made by the **Share** tab: the whole current session is written into the link itself, so
it needs no server, but it is long. See [Share, settings and help](use-the-browser/share-settings-help.md).

## Legacy links (datahub, coordinate)

`?genome=mm9&datahub=https…/hub&coordinate=chr8:87120161-87587163`

Links made for the retired 1st-generation browser (`/legacy/`) keep working:
the page served at `/legacy/` sends the visitor to `/browser/` with the same
parameters, and the browser converts the legacy datahub to current tracks when
it loads.

- `datahub` (also `datahub_jsonfile`, `datahub_json`) is the URL of a legacy
  datahub file. It is converted on the fly, following the rules of the legacy
  browser:
  - a track is displayed only if it has a `mode` other than `hide`; the other
    tracks of the hub are not displayed but stay available in the track list.
    Add `forceshowall` to the URL to display every track;
  - `hammock` tracks keep their type (see [hammock](tracks/file-tracks.md#hammock)),
    `longrange` tracks are shown as arcs (`heatmap` mode as a heatmap), and
    `native_track` entries become the matching annotation tracks of the genome;
  - display settings such as `colorpositive`, `height`, `fixedscale` and `qtc`
    are mapped to track `options`;
  - metadata given as vocabulary ids is replaced by the term names, using the
    vocabularies the hub defines or links to.
- `coordinate` is the legacy name of [position](#position). Both
  `chr8:87120161-87587163` and `chr8,87120161,chr8,87587163` are accepted. A
  `coordinate_override` entry in the hub is used when the URL has none.
- `gftk` lists annotation tracks of the genome as `name,mode` pairs, for
  example `gftk=refGene,full`.

Legacy track types with no equivalent in this browser are skipped and counted
in the browser console. This includes legacy `methylc` entries: they point to
separate files for each strand and for read depth, while the
[methylC](tracks/file-tracks.md#methylc) track of this browser reads one
combined file. Legacy `session` and
`publichub` links cannot be restored, because that data only existed on the
legacy server; the genome is loaded with its default tracks and a message
explains why.

A legacy datahub replaces the default tracks of the genome, as it lists its own annotation tracks.
