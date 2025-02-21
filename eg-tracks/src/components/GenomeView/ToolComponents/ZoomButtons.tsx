import ButtonGroup from "./ButtonGroup";

const ZOOMS = [
  { factor: 0.2, text: "+5", title: "Zoom in 5-fold" },
  {
    factor: 0.5,
    text: "+1",
    title: `Zoom in 1-fold (Alt+I)`,
  },
  { factor: 2 / 3, text: "+⅓", title: "Zoom in 1/3-fold" },
  { factor: 4 / 3, text: "-⅓", title: "Zoom out 1/3-fold" },
  {
    factor: 2,
    text: "-1",
    title: `Zoom out 1-fold (Alt+O)`,
  },
  { factor: 5, text: "-5", title: "Zoom out 5-fold" },
];

function ZoomButtons(props) {
  // const zoomOut = factor => {
  //     const newRegion = props.viewRegion.clone().zoom(factor);
  //     props.onNewRegion(...newRegion.getContextCoordinates());
  // };
  const buttons = ZOOMS.map((zoom, index) => (
    <button
      key={index}
      className={`border border-gray-500 p-2 py-2.5 -ml-[1px] first:ml-0 ${index === 0
          ? 'rounded-l-md'
          : index === ZOOMS.length - 1
            ? 'rounded-r-md'
            : ''
        }`}
      title={zoom.title}
      style={{ fontFamily: "monospace" }}
      onClick={() => props.onToolClicked(zoom)}
    >
      {zoom.text}
    </button>
  ));

  return <ButtonGroup buttons={buttons} />;
}

export default ZoomButtons;
