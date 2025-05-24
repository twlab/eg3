// import ReactDOM from "react-dom";
// import { Manager, Reference, Popper } from "react-popper";
// import FeatureDetail from "./commonComponents/annotation/FeatureDetail";
// import JasparDetail from "./commonComponents/annotation/JasparDetail";
// import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
// import GeneDetail from "./geneAnnotationTrackComponents/GeneDetail";
// import SnpDetail from "./SnpComponents/SnpDetail";
// const ARROW_SIZE = 16;
// const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment

// export const geneClickToolTipMap: { [key: string]: any } = {
//   bigbed: function bedClickToolTip(feature: any, pageX, pageY, name, onClose) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <FeatureDetail feature={feature} />
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   geneannotation: function refGeneClickTooltip(
//     gene: any,
//     pageX,
//     pageY,
//     name,
//     onClose,
//     setShow3dGene,
//     isThereG3dTrack
//   ) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     const tooltipElement = (
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <GeneDetail
//                   gene={gene}
//                   collectionName={name}
//                   queryEndpoint={{}}
//                 />
//                 {isThereG3dTrack ? (
//                   <div>
//                     <button
//                       className="btn btn-sm btn-primary"
//                       onClick={() => setShow3dGene(gene)}
//                     >
//                       Show in 3D
//                     </button>
//                   </div>
//                 ) : (
//                   ""
//                 )}
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>
//     );

//     return tooltipElement;
//   },
//   refbed: function refGeneClickTooltip(
//     gene: any,
//     pageX,
//     pageY,
//     name,
//     onClosesetShow3dGene,
//     isThereG3dTrack
//   ) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <GeneDetail
//                   gene={gene}
//                   collectionName={name}
//                   queryEndpoint={{}}
//                 />

//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   bed: function bedClickTooltip(feature: any, pageX, pageY, name, onClose) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <FeatureDetail feature={feature} />
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   repeatmasker: function repeatMaskLeftClick(
//     feature: any,
//     pageX,
//     pageY,
//     name,
//     onClose
//   ) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <div>
//                   <div>
//                     <span
//                       className="Tooltip-major-text"
//                       style={{ marginRight: 5 }}
//                     >
//                       {feature.getName()}
//                     </span>
//                     <span className="Tooltip-minor-text">
//                       {feature.getClassDetails()}
//                     </span>
//                   </div>
//                   <div>
//                     {feature.getLocus().toString()} (
//                     {feature.getLocus().getLength()}bp)
//                   </div>
//                   <div>(1 - divergence%) = {feature.value.toFixed(2)}</div>
//                   <div>strand: {feature.strand}</div>
//                   <div className="Tooltip-minor-text">
//                     {trackModel.getDisplayLabel()}
//                   </div>
//                 </div>
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   omeroidr: function omeroidrClickToolTip(snp: any, pageX, pageY, onClose) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <SnpDetail snp={snp} />
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   bam: function bamClickTooltip(feature: any, pageX, pageY, name, onClose) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });
//     const alignment = feature.getAlignment();
//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <FeatureDetail feature={feature} />
//                 <div style={{ fontFamily: "monospace", whiteSpace: "pre" }}>
//                   <div>Ref {alignment.reference}</div>
//                   <div> {alignment.lines}</div>
//                   <div>Read {alignment.read}</div>
//                 </div>
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   snp: function SnpClickToolTip(snp: any, pageX, pageY, onClose) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <SnpDetail snp={snp} />
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   categorical: function featureClickTooltip(
//     feature: any,
//     pageX,
//     pageY,
//     name,
//     onClose
//   ) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <FeatureDetail
//                   feature={feature}
//                   category={configOptions.current.category}
//                 />
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   jaspar: function JasparClickTooltip(
//     feature: any,
//     pageX,
//     pageY,
//     name,
//     onClose
//   ) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <OutsideClickDetector onOutsideClick={onClose}>
//                 <JasparDetail feature={feature} />
//               </OutsideClickDetector>
//               {ReactDOM.createPortal(
//                 <div
//                   ref={arrowProps.ref}
//                   style={{
//                     ...arrowProps.style,
//                     width: 0,
//                     height: 0,
//                     position: "absolute",
//                     left: pageX - 8,
//                     top: pageY,
//                     borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderRight: `${ARROW_SIZE / 2}px solid transparent`,
//                     borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
//                   }}
//                 />,
//                 document.body
//               )}
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
//   normModbed: function normToolTip(bs: any, pageX, pageY, feature) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>

//         <div
//           style={{
//             ...contentStyle,
//             zIndex: 1001,
//           }}
//           className="Tooltip"
//         >
//           <div>
//             {bs && `position ${bs} in`} {feature.getName()} read
//           </div>
//         </div>
//       </Manager>,
//       document.body
//     );
//   },

//   barModbed: function barTooltip(
//     feature: any,
//     pageX,
//     pageY,
//     onCount,
//     onPct,
//     total
//   ) {
//     const contentStyle = Object.assign({
//       marginTop: ARROW_SIZE,
//       pointerEvents: "auto",
//     });

//     return ReactDOM.createPortal(
//       <Manager>
//         <Reference>
//           {({ ref }) => (
//             <div
//               ref={ref}
//               style={{
//                 position: "absolute",
//                 left: pageX - 8 * 2,
//                 top: pageY,
//               }}
//             />
//           )}
//         </Reference>
//         <Popper
//           placement="bottom-start"
//           modifiers={[{ name: "flip", enabled: false }]}
//         >
//           {({ ref, style, placement, arrowProps }) => (
//             <div
//               ref={ref}
//               style={{
//                 ...style,
//                 ...contentStyle,
//                 zIndex: 1001,
//               }}
//               className="Tooltip"
//             >
//               <div>
//                 {onCount}/{total} ({`${(onPct * 100).toFixed(2)}%`})
//               </div>
//               <div>{feature.getName()}</div>
//             </div>
//           )}
//         </Popper>
//       </Manager>,
//       document.body
//     );
//   },
// };
