import ReactDOM from "react-dom";
import { Manager, Reference, Popper } from "react-popper";
import { MenuTitle, RemoveOption } from "./TrackContextMenu";
import "./TrackContextMenu.css";
import getBigData from "../../components/GenomeView/getRemoteData/bigSource";
import getTabixData from "../../components/GenomeView/getRemoteData/tabixSource";
import OutsideClickDetector from "../../components/GenomeView/commonComponents/OutsideClickDetector";

const trackConfigMenu: { [key: string]: any } = {
  refGene: function refGeneConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  gencodeV39: function refGeneConfigMenu(data: any) {
    console.log(data);
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  bed: async function bedFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getTabixData(loci, options, url);
  },

  bigWig: function bigWigFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getBigData(loci, options, url);
  },

  dynseq: function dynseqFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getBigData(loci, options, url);
  },
  methylc: function methylcFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getTabixData(loci, options, url);
  },
  hic: function hicFetch(straw, options, loci, basesPerPixel) {
    return straw.getData(loci, basesPerPixel, options);
  },
  genomealign: function genomeAlignFetch(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
};
function ConfigMenuComponent(props) {
  let menuData = props.menuData;

  return ReactDOM.createPortal(
    // need to set id matching the track component so it rememebers each specific
    // track config settings
    <Manager>
      <Reference>
        {({ ref }) => (
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: menuData.pageX,
              top: Math.max(0, menuData.pageY - 190),
            }}
          />
        )}
      </Reference>
      <Popper>
        {({ ref, style, placement, arrowProps }) => (
          <div
            ref={ref}
            style={{
              ...style,
              position: "absolute",
              zIndex: 1000,
            }}
          >
            <OutsideClickDetector onOutsideClick={menuData.onCloseConfigMenu}>
              <div
                className="TrackContextMenu-body"
                style={{ backgroundColor: "white" }}
              >
                <MenuTitle
                  title={menuData.trackModel.getDisplayLabel()}
                  numTracks={menuData.trackIdx}
                />
                {menuData.items.map((MenuComponent, index) => {
                  let defaultVal: any;
                  // if we don't give default option here the state of each
                  // will persist between displaymodes.
                  // a new defaultValue will create a new menu component with
                  // the new changed option set as new defaultvalue

                  if (MenuComponent.name === "LabelConfig") {
                    defaultVal = menuData.trackModel.name;
                  } else if (MenuComponent.name === "MaxRowsConfig") {
                    defaultVal = Number(menuData.configOptions.maxRows);
                  } else if (
                    MenuComponent.name === "AnnotationDisplayModeConfig"
                  ) {
                    defaultVal = menuData.configOptions.displayMode;
                  } else if (MenuComponent.name === "HiddenPixelsConfig") {
                    defaultVal = menuData.configOptions.hiddenPixels;
                  }
                  return (
                    <MenuComponent
                      key={index}
                      optionsObjects={[menuData.configOptions]}
                      defaultValue={defaultVal}
                      onOptionSet={menuData.onConfigChange}
                    />
                  );
                })}
                <RemoveOption
                  onClick={menuData.handleDelete}
                  numTracks={menuData.trackIdx}
                />
              </div>
            </OutsideClickDetector>
          </div>
        )}
      </Popper>
    </Manager>,
    document.body
  );
}

export default trackConfigMenu;
