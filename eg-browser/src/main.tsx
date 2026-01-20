import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// const testProps = {
//   viewRegion: "chr7:27181545-27245617",
//   tracks: [
//     // {
//     //   url: "https://hicfiles.s3.amazonaws.com/hiseq/gm12878/in-situ/combined.hic",
//     //   name: "hictest",
//     //   type: "hic",
//     // },
//     {
//       url: "https://vizhub.wustl.edu/hubSample/hg19/bam1.bam",
//       name: "bamtest",
//       type: "bam",
//     },
//     {
//       name: "gencodeV47",
//       type: "geneannotation",
//     },
//   ],
//   genomeName: "hg19",

//   showGenomeNavigator: true,
//   showNavBar: true,
//   showToolBar: true,
// };
createRoot(document.getElementById("root")!).render(
  <App storeConfig={{ storeId: "main" }
    // {...testProps} 

  }
  />)
// {...testProps}



// createRoot(document.getElementById("root")!).render(
//   <RootLayoutTest

//   />
// );
