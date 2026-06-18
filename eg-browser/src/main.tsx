import { createRoot } from "react-dom/client";
import { useState } from "react";
import "./index.css";
import App from "./App.tsx";
import { startVersionCheck } from "./versionCheck";

// Remove service workers left behind by older deployments so they can't
// serve stale cached builds. Version updates are handled by polling instead.
navigator.serviceWorker
  ?.getRegistrations()
  .then((registrations) => registrations.forEach((r) => r.unregister()))
  .catch(() => {});

startVersionCheck();

const testTracks1 = [
  {
    name: "RGC RNA",
    type: "bigwig",
    url: "https://epigenome.wustl.edu/EyeEpigenome/data/ATAC_50bs/RGC.RPKM.bw",
    metadata: { cell: "RGC", assay: "ATAC" },

    options: { group: 2, label: "RGC ATAC" },
    showOnHubLoad: true,
  },
  {
    name: "RGC RNA2",
    type: "bigwig",
    url: "https://epigenome.wustl.edu/EyeEpigenome/data/RNA_50bs/RGC.RPKM.bw",
    options: { group: 1, label: "RGC RNA" },
    showOnHubLoad: true,
    metadata: { cell: "RGC", assay: "RNA" },
  },
];
const testTracks2 = [
  {
    name: "RGC RNA",
    type: "bigwig",
    url: "https://epigenome.wustl.edu/EyeEpigenome/data/ATAC_50bs/RGC.RPKM.bw",
    metadata: { cell: "RGC", assay: "ATAC" },

    options: { group: 2, label: "RGC ATAC" },
    showOnHubLoad: true,
  },
  {
    name: "RGC RNA2",
    type: "bigwig",
    url: "https://epigenome.wustl.edu/EyeEpigenome/data/RNA_50bs/RGC.RPKM.bw",
    options: { group: 1, label: "RGC RNA" },
    showOnHubLoad: true,
    metadata: { cell: "RGC", assay: "RNA" },
  },
];
// {[
//       {
//         name: "STRd_D2_Matrix_MSN.bam_merge_RNA",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_RNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_RNA.bam.bw",
//         options: {
//           color: "#0099ff",
//         },
//         showOnHubLoad: true,
//       },
//       {
//         name: "STRd_D2_Matrix_MSN.bam_merge_H3K9me3",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_DNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_H3K9me3.bam_rmdup.bw",
//         options: {
//           color: "#0099ff",
//         },
//         showOnHubLoad: true,
//       },
//       {
//         name: "STRd_D2_Matrix_MSN.bam_merge_H3K27me3",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_DNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_H3K27me3.bam_rmdup.bw",
//         options: {
//           color: "#0099ff",
//         },
//         showOnHubLoad: true,
//       },
//       {
//         name: "STRd_D2_Matrix_MSN.bam_merge_H3K27ac",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/renlab/Group/BGC_paired-Tag_Group_level_DNA_500bp_bw_file/STRd_D2_Matrix_MSN.bam_merge_H3K27ac.bam_rmdup.bw",
//         options: {
//           color: "#0099ff",
//         },
//         showOnHubLoad: true,
//       },
//       {
//         type: "geneAnnotation",
//         name: "refGene",
//         genome: "hg38",
//         showOnHubLoad: true,
//         options: {
//           color: "#0099ff",
//         },
//       },
//       {
//         name: "hg38 vs mm10",
//         type: "genomealign",
//         url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
//         metadata: {
//           genome: "hg38",
//           "Track type": "genomealign",
//         },
//         querygenome: "mm10",
//         showOnHubLoad: true,
//         options: {
//           primaryColor: "#0099ff",
//           queryColor: "#ff9900",
//         },
//       },
//       {
//         type: "geneAnnotation",
//         name: "refGene",
//         genome: "mm10",
//         showOnHubLoad: true,
//         options: {
//           color: "#ff9900",
//         },
//         metadata: {
//           genome: "mm10",
//           "Track type": "geneAnnotation",
//         },
//       },
//       {
//         name: "STRd_D2_Matrix_MSN_H3K27ac_merge",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mous_MSN_Histone_bw/STRd_D2_Matrix_MSN_H3K27ac_merge.bam_rmdup.bw",
//         metadata: {
//           genome: "mm10",
//           "Track type": "bigwig",
//         },
//         showOnHubLoad: true,
//         options: {
//           color: "#ff9900",
//         },
//       },
//       {
//         name: "STRd_D2_Matrix_MSN_H3K27me3_merge",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mous_MSN_Histone_bw/STRd_D2_Matrix_MSN_H3K27me3_merge.bam_rmdup.bw",
//         metadata: {
//           genome: "mm10",
//           "Track type": "bigwig",
//         },
//         showOnHubLoad: true,
//         options: {
//           color: "#ff9900",
//         },
//       },
//       {
//         name: "STRd_D2_Matrix_MSN_H3K9me3_merge",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mous_MSN_Histone_bw/STRd_D2_Matrix_MSN_H3K9me3_merge.bam_rmdup.bw",
//         metadata: {
//           genome: "mm10",
//           "Track type": "bigwig",
//         },
//         showOnHubLoad: true,
//         options: {
//           color: "#ff9900",
//         },
//       },
//       {
//         name: "STRd_D2_Matrix_MSN_RNA",
//         type: "bigwig",
//         url: "https://epigenome.wustl.edu/basal-ganglia-epigenome/tracks/mouse/renlab/Mouse_MSN_RNA_bw_file/STRd_D2_Matrix_MSN_merge.bam.bw",
//         metadata: {
//           genome: "mm10",
//           "Track type": "bigwig",
//         },
//         showOnHubLoad: true,
//         options: {
//           color: "#ff9900",
//         },
//       },
//     ]}
// const trackSets = [testTracks1, testTracks2];

// function Root() {
//   const [trackSetIndex, setTrackSetIndex] = useState(0);
//   const [viewRegion, setViewRegion] = useState<any>({
//     genomeCoordinate: "chr7:27053397-27373765",
//   });
//   return (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
//       <div
//         style={{
//           padding: "4px 8px",
//           background: "#222",
//           display: "flex",
//           gap: 8,
//           alignItems: "center",
//         }}
//       >
//         <span style={{ color: "#ccc", fontSize: 12 }}>Test tracks:</span>
//         {trackSets.map((_, i) => (
//           <button
//             key={i}
//             onClick={() => setTrackSetIndex(i)}
//             style={{
//               padding: "2px 10px",
//               cursor: "pointer",
//               fontWeight: trackSetIndex === i ? "bold" : "normal",
//               background: trackSetIndex === i ? "#4a90d9" : "#444",
//               color: "#fff",
//               border: "1px solid #555",
//               borderRadius: 4,
//               fontSize: 12,
//             }}
//           >
//             Set {i + 1}
//           </button>
//         ))}
//       </div>
//       <App
//         storeConfig={{
//           storeId: "main",
//           // enablePersistence: false
//         }}
//         viewRegion={viewRegion}
//         genomeName={"hg38"}
//         tracks={trackSets[trackSetIndex]}
//         showGenomeNavigator={true}
//         showNavBar={true}
//         showToolBar={true}
//         showDisclosure={false}
//         darkMode={true}
//       />
//     </div>
//   );
// }

// createRoot(document.getElementById("root")!).render(<Root />);
createRoot(document.getElementById("root")!).render(<App />);
