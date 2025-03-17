---
slug: /
sidebar_position: 1
---

# Introduction

![eg logo](/img/home/eg.png)

*Gateway to the epigenome. (Art by **Ting Wang**)*

The **basic usage** of the **WashU Epigenome Browser** involves the following steps:  

1. **Load a genome assembly** – Users can select from a variety of preloaded genome assemblies or upload their own custom genome using the **Genome Hub** feature.  
2. **Load annotations and public data tracks** – The Browser provides access to publicly available datasets from major consortia like **ENCODE, 4DN, Roadmap Epigenomics, and IHEC**, allowing users to integrate rich annotation tracks.  
3. **Load user data** – Users can visualize their own data through the **Remote Track** function (by providing a URL to a hosted file) or the **Local Track** function (by uploading files directly from their computer).  

This documentation provides a step-by-step guide to using the **2025 updated WashU Epigenome Browser**.

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

### the 1st generation since 2010

* [Access the Browser](https://epigenomegateway.wustl.edu/legacy/)
* [Source code](https://github.com/epgg/eg)
* [Documentation](https://wiki.wubrowse.org/)

## Run the Browser locally

* get Node.js (version 20 above recommended) and yarn package management tool
* clone the code
* install the package at root folder

    ```bash
    yarn install
    ```

* go the eg-browser folder

    ```bash
    yarn install
    yarn dev
    ```

* the browser should be running on your local computer now at [http://localhost:5173/](http://localhost:5173/)

    ```bash
    VITE v5.4.14  ready in 409 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
    ```

## Use the Browser as a module in your web application

* install the package from NPM registry

    ```bash
    npm install wuepgg
    ```

* import the package and related style sheet

    ```javascript
    import GenomeHub from "wuepg"
    import "wuepgg/style.css"
    
    <GenomeHub name={exampleName} dataHub={exampleDataHub} />
    ```

* example of screenshot for each step can found below:

![npm install screenshot](/img/home/npm1.png)
![import screenshot](/img/home/npm2.png)
![use the component screenshot](/img/home/npm3.png)
![how it looks screenshot](/img/home/npm4.png)

## Questions or feedbacks?

* Please submit an [issue request](https://github.com/twlab/eg3/issues). We'll try to get back to you asap.

## Community

* Talk to us? Welcome to join our [Discord server](https://discord.gg/Mvngzxa9) for some discussion.
