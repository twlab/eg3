import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import ReactDOM from "react-dom";
import { Manager, Reference, Popper } from "react-popper";
import FeatureDetail from "./commonComponents/annotation/FeatureDetail";
import JasparDetail from "./commonComponents/annotation/JasparDetail";
import GeneDetail from "./geneAnnotationTrackComponents/GeneDetail";
import SnpDetail from "./SnpComponents/SnpDetail";
import Vcf from "./VcfComponents/Vcf";
import VcfDetail from "./VcfComponents/VcfDetail";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment

const ARROW_SIZE = 16;
export const geneClickToolTipMap: { [key: string]: any } = {
  bigbed: function bedClickToolTip({
    feature,
    pageX,
    pageY,
    name,
    onClose,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <FeatureDetail
                  feature={feature}
                  category={undefined}
                  queryEndpoint={undefined}
                />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  geneannotation: function refGeneClickTooltip({
    gene,
    pageX,
    pageY,
    name,
    onClose,
    isThereG3dTrack,
    setShow3dGene,
  }: {
    gene: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
    isThereG3dTrack: any;
    setShow3dGene: any;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    const tooltipElement = (
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <GeneDetail
                  gene={gene}
                  collectionName={name}
                  queryEndpoint={{}}
                />
                {isThereG3dTrack ? (
                  <div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        setShow3dGene ? setShow3dGene(gene) : () => {}
                      }
                    >
                      Show in 3D
                    </button>
                  </div>
                ) : (
                  ""
                )}
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>
    );

    return tooltipElement;
  },

  refbed: function refGeneClickTooltip({
    gene,
    pageX,
    pageY,
    name,
    onClose,
    isThereG3dTrack,
    setShow3dGene,
  }: {
    gene: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
    isThereG3dTrack: any;
    setShow3dGene: any;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <GeneDetail
                  gene={gene}
                  collectionName={name}
                  queryEndpoint={{}}
                />
                {isThereG3dTrack ? (
                  <div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        setShow3dGene ? setShow3dGene(gene) : () => {}
                      }
                    >
                      Show in 3D
                    </button>
                    {/* {" "}
                    <button className="btn btn-sm btn-secondary" onClick={this.clearGene3d}>
                        Clear in 3D
                    </button> */}
                  </div>
                ) : (
                  ""
                )}
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  bed: function bedClickTooltip({
    feature,
    pageX,
    pageY,
    name,
    onClose,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <FeatureDetail
                  feature={feature}
                  category={undefined}
                  queryEndpoint={undefined}
                />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  bedcolor: function bedcolorClickTooltip({
    feature,
    pageX,
    pageY,
    name,
    onClose,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <FeatureDetail
                  feature={feature}
                  category={undefined}
                  queryEndpoint={undefined}
                />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  repeatmasker: function repeatMaskLeftClick({
    feature,
    pageX,
    pageY,
    name,
    onClose,
    trackModel,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
    trackModel: any;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <div>
                  <div>
                    <span
                      className="Tooltip-major-text"
                      style={{ marginRight: 5 }}
                    >
                      {feature.getName()}
                    </span>
                    <span className="Tooltip-minor-text">
                      {feature.getClassDetails()}
                    </span>
                  </div>
                  <div>
                    {feature.getLocus().toString()} (
                    {feature.getLocus().getLength()}bp)
                  </div>
                  <div>
                    (1 - divergence%) = {feature.repeatValue.toFixed(2)}
                  </div>
                  <div>strand: {feature.strand}</div>
                  <div className="Tooltip-minor-text">
                    {trackModel.getDisplayLabel()}
                  </div>
                </div>
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  omeroidr: function omeroidrClickToolTip({
    snp,
    pageX,
    pageY,
    onClose,
  }: {
    snp: any;
    pageX: number;
    pageY: number;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <SnpDetail snp={snp} />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  bam: function bamClickTooltip({
    feature,
    pageX,
    pageY,
    name,
    onClose,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
  }) {
    console.log(feature);
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });
    const alignment = feature.getAlignment();
    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <FeatureDetail
                  feature={feature}
                  category={undefined}
                  queryEndpoint={undefined}
                />
                <div style={{ fontFamily: "monospace", whiteSpace: "pre" }}>
                  <div>Ref {alignment.reference}</div>
                  <div> {alignment.lines}</div>
                  <div>Read {alignment.read}</div>
                </div>
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  snp: function SnpClickToolTip({
    snp,
    pageX,
    pageY,
    name = "",
    onClose,
  }: {
    snp: any;
    pageX: number;
    pageY: number;
    name?: string;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <SnpDetail snp={snp} />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  categorical: function featureClickTooltip({
    feature,
    pageX,
    pageY,
    name,
    onClose,
    configOptions,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
    configOptions: any;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <FeatureDetail
                  feature={feature}
                  category={configOptions.category}
                  queryEndpoint={undefined}
                />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  vcf: function VcfClickToolTip({
    vcf,
    pageX,
    pageY,
    name,
    onClose,
  }: {
    vcf: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
  }) {
    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,

                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <VcfDetail vcf={vcf as Vcf} />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  jaspar: function JasparClickTooltip({
    feature,
    pageX,
    pageY,
    name,
    onClose,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    name: string;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <JasparDetail feature={feature} />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  normModbed: function normToolTip({
    bs,
    pageX,
    pageY,
    feature,
    onClose,
  }: {
    bs: any;
    pageX: number;
    pageY: number;
    feature: any;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <div>
                  {bs && `position ${bs} in`} {feature.getName()} read
                </div>
              </OutsideClickDetector>
              <div>{feature.getName()}</div>
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },

  barModbed: function barTooltip({
    feature,
    pageX,
    pageY,
    onCount,
    onPct,
    total,
    onClose,
  }: {
    feature: any;
    pageX: number;
    pageY: number;
    onCount: number;
    onPct: number;
    total: number;
    onClose: () => void;
  }) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <div>
                  {onCount}/{total} ({`${(onPct * 100).toFixed(2)}%`})
                </div>
              </OutsideClickDetector>
              <div>{feature.getName()}</div>
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },
};
