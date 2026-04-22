import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Reload the page when the service worker requests an update (fallback path)
if (
  typeof navigator !== "undefined" &&
  navigator.serviceWorker?.addEventListener
) {
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type === "SERVICE_WORKER_UPDATE") {
      try {
        location.reload();
      } catch (err) {
        /* ignore */
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <App
    storeConfig={{
      storeId: "main",
      // ,
      // enablePersistence: false
    }}
    viewRegion={{ genomeCoordinate: "chr7:27181545-27245617" }}
    genomeName={"hg38"}
    tracks={[
      {
        name: "STRd_D2_Matrix_MSN.bam_merge_RNA",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_RNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_RNA.bam.bw",
        options: {
          color: "#0099ff",
        },
        showOnHubLoad: true,
      },
      {
        name: "STRd_D2_Matrix_MSN.bam_merge_H3K9me3",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_DNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_H3K9me3.bam_rmdup.bw",
        options: {
          color: "#0099ff",
        },
        showOnHubLoad: true,
      },
      {
        name: "STRd_D2_Matrix_MSN.bam_merge_H3K27me3",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_DNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_H3K27me3.bam_rmdup.bw",
        options: {
          color: "#0099ff",
        },
        showOnHubLoad: true,
      },
      {
        name: "STRd_D2_Matrix_MSN.bam_merge_H3K27ac",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_DNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_H3K27ac.bam_rmdup.bw",
        options: {
          color: "#0099ff",
        },
        showOnHubLoad: true,
      },
      {
        type: "geneAnnotation",
        name: "refGene",
        genome: "hg38",
        showOnHubLoad: true,
        options: {
          color: "#0099ff",
        },
      },
      {
        name: "hg38 vs mm10",
        type: "genomealign",
        url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
        metadata: {
          genome: "hg38",
          "Track type": "genomealign",
        },
        querygenome: "mm10",
        showOnHubLoad: true,
        options: {
          primaryColor: "#0099ff",
          queryColor: "#ff9900",
        },
      },
      {
        type: "geneAnnotation",
        name: "refGene",
        genome: "mm10",
        showOnHubLoad: true,
        options: {
          color: "#ff9900",
        },
        metadata: {
          genome: "mm10",
          "Track type": "geneAnnotation",
        },
      },
      {
        name: "STRd_D2_Matrix_MSN_H3K27ac_merge",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mous_MSN_Histone_bw/STRd_D2_Matrix_MSN_H3K27ac_merge.bam_rmdup.bw",
        metadata: {
          genome: "mm10",
          "Track type": "bigwig",
        },
        showOnHubLoad: true,
        options: {
          color: "#ff9900",
        },
      },
      {
        name: "STRd_D2_Matrix_MSN_H3K27me3_merge",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mous_MSN_Histone_bw/STRd_D2_Matrix_MSN_H3K27me3_merge.bam_rmdup.bw",
        metadata: {
          genome: "mm10",
          "Track type": "bigwig",
        },
        showOnHubLoad: true,
        options: {
          color: "#ff9900",
        },
      },
      {
        name: "STRd_D2_Matrix_MSN_H3K9me3_merge",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mous_MSN_Histone_bw/STRd_D2_Matrix_MSN_H3K9me3_merge.bam_rmdup.bw",
        metadata: {
          genome: "mm10",
          "Track type": "bigwig",
        },
        showOnHubLoad: true,
        options: {
          color: "#ff9900",
        },
      },
      {
        name: "STRd_D2_Matrix_MSN_RNA",
        type: "bigwig",
        url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mouse_MSN_RNA_bw_file/STRd_D2_Matrix_MSN_merge.bam.bw",
        metadata: {
          genome: "mm10",
          "Track type": "bigwig",
        },
        showOnHubLoad: true,
        options: {
          color: "#ff9900",
        },
      },
    ]}
    showGenomeNavigator={true}
    showNavBar={true}
    showToolBar={true}
    // persistState={false}
  />,
);
// {...testProps}

// createRoot(document.getElementById("root")!).render(
//   <RootLayoutTest

//   />
// );
