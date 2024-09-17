import ReactDOM from "react-dom";
import { Manager, Reference, Popper } from "react-popper";
import {
  MenuTitle,
  RemoveOption,
} from "../../../../trackConfigs/TrackContextMenu";

import getBigData from "../../getRemoteData/bigSource";
import getTabixData from "../../getRemoteData/tabixSource";
import OutsideClickDetector from "../OutsideClickDetector";

const trackConfigMenu: { [key: string]: any } = {
  refGene: function refGeneConfigMenu(data: any) {
    console.log(data);
    return <ConfigMenuComponent menuData={data} />;
  },
  gencodeV39: function refGeneConfigMenu(data: any) {
    console.log(data);
    return <ConfigMenuComponent menuData={data} />;
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
  genomealign: function genomeAlignFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getTabixData(loci, options, url);
  },
};
function ConfigMenuComponent(props) {
  let menuData = props.menuData;
  console.log(menuData);
  return ReactDOM.createPortal(
    <Manager key={`${menuData.id}`}>
      <Reference>
        {({ ref }) => (
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: menuData.pageX,
              top: Math.max(0, menuData.pageY - 300),
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
              <div className="TrackContextMenu-body">
                <MenuTitle
                  title={menuData.trackModel.getDisplayLabel()}
                  numTracks={menuData.trackIdx}
                />
                {menuData.items.map((MenuComponent, index) => (
                  <MenuComponent
                    key={index}
                    optionsObjects={[menuData.configOptions]}
                    defaultValue={
                      index !== 2 && index !== 7
                        ? index !== 0
                          ? menuData.configOptions.displayMode
                          : menuData.trackModel.name
                        : 0
                    }
                    onOptionSet={menuData.onConfigChange}
                  />
                ))}
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
