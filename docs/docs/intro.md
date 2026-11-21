---
slug: /
sidebar_position: 1
---

# Introduction

![eg logo](/img/home/eg.png)

*Gateway to the epigenome. (Art by **Ting Wang**)*

The **WashU Epigenome Browser** is a web-based genome browser for exploring genomic and epigenomic data. It runs entirely in your web browser: track files are read directly from where they are hosted (or from your own computer), and only the part of each file needed for the region on screen is fetched.

This documentation describes the current generation of the Browser, available since 2025 at [https://epigenomegateway.wustl.edu/browser/](https://epigenomegateway.wustl.edu/browser/).

## Basic usage

1. **Pick a genome.** Choose one of the built-in genome assemblies, or add your own. See [Pick a genome](use-the-browser/pick-genome.md).
2. **Move around.** Search for a gene, a SNP or a region, then pan and zoom. See [User interface](use-the-browser/browsing-ui.md).
3. **Add annotation and public data tracks.** The Browser gives access to public datasets from consortia such as ENCODE, 4DN, Roadmap Epigenomics and IHEC. See [Add and customize tracks](use-the-browser/tracks-menu.md).
4. **Add your own data.** Show files hosted on a web server by their URL, or files on your own computer. See [Track file formats](tracks/file-tracks.md), [Local tracks](tracks/local-tracks.md) and [Datahub](datahub/datahub.md).
5. **Analyze and share.** Use the [Apps](use-the-browser/apps.md) for region sets, gene plots, screenshots and more, and keep or share your work as a [session](use-the-browser/manage-sessions.md) or a [link](url-params.md).

## Where to find what

| I want to… | Read |
| --- | --- |
| learn the interface | [Use the Browser](use-the-browser/pick-genome.md) |
| know which file formats are supported and how to prepare them | [Tracks](tracks/file-tracks.md) |
| describe many tracks in one file | [Datahub](datahub/datahub.md) |
| build a link that opens the Browser on my data | [URL parameters](url-params.md) |
| compare genomes | [Comparative browsing](use-the-browser/comparative-browsing.md) |
| view 3D genome structure | [3D structure](tracks/3d.md) |
| run my own copy, or embed the Browser in my web application | [Run your own copy](installation.md) |
| add a genome or a track type to the code | [Developer guide](developer/add-genome.md) |

## History

### current generation since 2025

* [Access the Browser](https://epigenomegateway.wustl.edu/browser/)
* [AWS mirror](https://epigenomegateway.org/browser/)
* [Source code](https://github.com/twlab/eg3)
* [Documentation](https://epgg.github.io/)

### the 2nd generation since 2018

* [Access the Browser](https://epigenomegateway.wustl.edu/browser2022/)
* [AWS mirror](https://epigenomegateway.org/browser2022/)
* [Source code](https://github.com/lidaof/eg-react)
* [Documentation](https://eg.readthedocs.io/en/latest/)

### the 1st generation since 2010 (retired)

* The 1st generation browser is no longer online. Links made for it (`/legacy/?genome=...&datahub=...`) open in the current browser, which converts the datahub on the fly, see [legacy links](url-params.md#legacy-links-datahub-coordinate).
* [Source code](https://github.com/epgg/eg)
* [Documentation](https://wiki.wubrowse.org/)

## Questions or feedback?

* Please submit an [issue request](https://github.com/twlab/eg3/issues). We will try to get back to you as soon as possible.
* Talk to us on our [Discord server](https://discord.gg/2PHxAEJFf7).
* More ways to reach us, and how to cite the Browser, are on the [Contact us](contact.md) page.
