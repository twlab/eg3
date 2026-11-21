# WashU Epigenome Browser

*(3rd generation since 2025)*

## History

### current generation since 2025

* [Access the Browser](https://epigenomegateway.wustl.edu/browser/)
* [AWS mirrow](https://epigenomegateway.org/browser/)
* [Source code](https://github.com/twlab/eg3)
* [Documentation](https://epgg.github.io/)

### the 2nd generation since 2018

* [Access the Browser](https://epigenomegateway.wustl.edu/browser2022/)
* [AWS mirror](https://epigenomegateway.org/browser2022/)
* [Source code](https://github.com/lidaof/eg-react)
* [Documentation](https://eg.readthedocs.io/en/latest/)

### the 1st generation since 2010 (retired)

* The 1st generation browser is no longer online. Links made for it (`/legacy/?genome=...&datahub=...`) open in the current browser, which converts the datahub on the fly.
* [Source code](https://github.com/epgg/eg)
* [Documentation](https://wiki.wubrowse.org/)

## Run the Browser locally

* get Node.js (version 20 or above) and the yarn package manager
* clone the code
* install the packages at the root folder

    ```bash
    yarn install
    ```

* go to the eg-browser folder and start the Browser

    ```bash
    cd eg-browser
    yarn dev
    ```

* the Browser is now running on your computer at <http://localhost:5173/browser/>

    ```bash
      VITE v5.4.21  ready in 370 ms

      ➜  Local:   http://localhost:5173/browser/
      ➜  Network: use --host to expose
    ```

See [Run your own copy](https://epgg.github.io/installation) in the documentation for building, deploying and settings.

## Use the Browser as a module in your web application

* install the package from the NPM registry (React 18 or 19 is required)

    ```bash
    npm install wuepgg
    ```

* import the component and its style sheet

    ```jsx
    import { GenomeHub } from "wuepgg";
    import "wuepgg/style.css";

    <GenomeHub
      storeConfig={{ storeId: "genome-1" }}
      genomeName="hg19"
      viewRegion={{ genomeCoordinate: "chr7:27053397-27373765" }}
      tracks={[{ type: "ruler", name: "Ruler" }]}
    />
    ```

* an example application is available at [twlab/embed-eg3](https://github.com/twlab/embed-eg3), and the full list of properties is in the [package description](https://www.npmjs.com/package/wuepgg)

## Questions or feedbacks?

* Please submit an [issue request](https://github.com/twlab/eg3/issues). We'll try to get back to you asap.

## Community

* Talk to us? Welcome to join our [Discord server](https://discord.gg/2PHxAEJFf7) for some discussion.
