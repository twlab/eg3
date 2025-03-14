---
sidebar_position: 1
---

# What are tracks?

Tracks in the **WashU Epigenome Browser** refer to the **data tracks** loaded for visualization. These **track files** contain genomic data associated with specific **genomic coordinates**. When a user navigates to a genomic region, the corresponding data is **fetched, reformatted, and rendered** in the Browser for display.  

Tracks are categorized into **two main types** based on how data is fetched:  

1. **File-based tracks** – These tracks rely on pre-generated files, such as **BigWig, BAM, or VCF files**, stored on a remote server or a local system. The Browser fetches and processes these files dynamically when users explore genomic regions.  

2. **API-based tracks** – Instead of pre-generated files, these tracks retrieve data dynamically from an **external API**. The API sends queries to a database or a web server, and the Browser processes and visualizes the returned data in real time.  
