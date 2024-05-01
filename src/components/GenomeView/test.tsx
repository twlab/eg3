// async function fetchGenomeData2() {
//   ///////-__________________________________________________________________________________________________________________________
//   let tmpRegion: Array<any> = [];

//   if (minBp < 0) {
//     let totalEndBp = 0;
//     let endBp = minBp + bpRegionSize;
//     let tmpChrIdx = chrIndexLeft;
//     console.log(minBp, bpRegionSize);
//     tmpRegion.push(
//       `${chrData[chrIndexLeft + 1]}` +
//         ":" +
//         `${0}` +
//         "-" +
//         `${endBp}` +
//         "|" +
//         `${0}` +
//         "-" +
//         `${endBp}`
//     );

//     let chrEnd = 0;

//     while (-minBp > -totalEndBp) {
//       console.log(-minBp, -(-chrLength[tmpChrIdx] + totalEndBp));
//       if (-minBp > -(-chrLength[tmpChrIdx] + totalEndBp)) {
//         chrEnd = chrLength[tmpChrIdx];
//       } else {
//         chrEnd = chrLength[tmpChrIdx] + -totalEndBp - -minBp;
//       }
//       console.log(chrEnd);
//       tmpRegion.push(
//         `${chrData[tmpChrIdx]}` +
//           ":" +
//           `${-totalEndBp}` +
//           "-" +
//           `${-totalEndBp + chrEnd}` +
//           "|" +
//           `${chrEnd === chrLength[tmpChrIdx] ? 0 : chrEnd}` +
//           "-" +
//           `${chrLength[tmpChrIdx]}`
//       );
//       totalEndBp -= chrEnd;
//       console.log(totalEndBp);
//       tmpChrIdx -= 1;
//     }

//     setchrIndexLeft(tmpChrIdx);
//     console.log(chrEnd - bpRegionSize);
//     setMinBp(chrEnd - bpRegionSize);
//   } else {
//     tmpRegion.push(
//       `${chrData[chrIndexLeft]}` +
//         ":" +
//         `${minBp}` +
//         "-" +
//         `${minBp + bpRegionSize}` +
//         "|" +
//         +`${minBp}` +
//         "-" +
//         `${minBp + bpRegionSize}`
//     );
//   }
//   let tempObj = {};
//   let userRespond;
//   let bedRespond;
//   let tmpResult: Array<any> = [];
//   let tmpBed: Array<any> = [];
//   for (let i = 0; i < tmpRegion.length; i++) {
//     let sectionRegion = tmpRegion[i];
//     const [curChrName, bpCoord] = sectionRegion.split(":");
//     const [totalBp, sectionBp] = bpCoord.split("|");

//     const [startRegion, endRegion] = totalBp.split("-");
//     const [sectionStart, sectionEnd] = sectionBp.split("-");
//     console.log(curChrName, sectionBp, totalBp);
//     try {
//       userRespond = await fetch(
//         `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${curChrName}&start=${sectionStart}&end=${sectionEnd}`,
//         { method: "GET" }
//       );
//       bedRespond = await GetBedData(
//         "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
//         curChrName,
//         Number(sectionStart),
//         Number(sectionEnd)
//       );

//       // change future chr tracks txstart and txend and pass to the track component so new coord onlu need to udpate once
//       let gotResult = await userRespond.json();
//       if (i !== 0) {
//         for (let i = 0; i < gotResult.length; i++) {
//           gotResult[i].txStart += Number(endRegion) - Number(startRegion);
//           gotResult[i].txEnd += Number(endRegion) - Number(startRegion);
//         }
//         for (let i = 0; i < bedRespond.length; i++) {
//           bedRespond[i].start += Number(startRegion);
//           bedRespond[i].end += Number(startRegion);
//         }
//       }

//       tmpResult = [...tmpResult, ...gotResult];
//       tmpBed = [...tmpBed, ...bedRespond];
//     } catch {}
//     tempObj["location"] = `${-minBp}:${-minBp + bpRegionSize}`;
//   }
//   const bedResult = tmpBed;
//   const result = tmpResult;

//   tempObj["result"] = result;
//   tempObj["bedResult"] = bedResult;
//   tempObj["side"] = "left";
//   console.log(tempObj);
//   ///////-__________________________________________________________________________________________________________________________

//   tempObj["side"] = "left";
//   setGenomeTrackR({ ...tempObj });
//   if (minBp >= 0) {
//     setMinBp(minBp - bpRegionSize);
//     tempObj["location"] = `${minBp}:${minBp + bpRegionSize}`;
//   }
//   setIsLoading(false);
// }
