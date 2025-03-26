// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "WashU Epigenome Browser Documentation",
    tagline: "WashU Epigenome Browser Documentation",
    favicon: "img/favicon.ico",

    // Set the production url of your site here
    url: "https://epgg.github.io", // Your website URL
    baseUrl: "/",
    projectName: "epgg.github.io",
    organizationName: "epgg",
    trailingSlash: false,
    deploymentBranch: "master",

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    routeBasePath: "/",
                    sidebarPath: "./sidebars.js",
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: "https://github.com/twlab/eg3/tree/development/docs/docs/",
                },
                blog: false,
                theme: {
                    customCss: "./src/css/custom.css",
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            // Replace with your project's social card
            image: "img/home/eg.png",
            navbar: {
                title: "WashU Epigenome Browser Documentation",
                logo: {
                    alt: "WashU Epigenome Browser Logo",
                    src: "img/logo.png",
                },
                items: [
                    // {
                    //     type: "docSidebar",
                    //     sidebarId: "tutorialSidebar",
                    //     position: "left",
                    //     label: "Tutorial",
                    // },
                    // { to: "/blog", label: "Blog", position: "left" },
                    {
                        href: "https://epigenomegateway.wustl.edu/browser/",
                        label: "Go to Browser",
                        position: "right",
                    },
                    {
                        href: "https://github.com/twlab/eg3/",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                style: "dark",
                links: [
                    {
                        title: "Docs",
                        items: [
                            {
                                label: "Tracks",
                                to: "/category/tracks",
                            },
                            {
                                label: "Datahub",
                                to: "/category/datahub",
                            },
                        ],
                    },
                    {
                        title: "Community",
                        items: [
                            {
                                label: "Discord",
                                href: "https://discord.gg/2PHxAEJFf7",
                            },
                            {
                                label: "X",
                                href: "https://x.com/wuepgg",
                            },
                            {
                                label: "YouTube",
                                href: "https://www.youtube.com/@epgg",
                            },
                        ],
                    },
                    {
                        title: "More",
                        items: [
                            {
                                label: "Contact",
                                to: "/contact",
                            },
                            {
                                label: "GitHub",
                                href: "https://github.com/twlab/eg3",
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} WashU Epigenome Browser Team.`,
            },
            prism: {
                theme: prismThemes.github,
                darkTheme: prismThemes.dracula,
            },
        }),
};

export default config;
