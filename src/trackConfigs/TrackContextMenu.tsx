export function MenuTitle(props) {
  const text =
    props.title !== undefined
      ? props.title
      : `${props.numTracks} tracks selected`;
  return <div style={{ paddingLeft: 5, fontWeight: "bold" }}>{text}</div>;
}

export function RemoveOption(props) {
  return (
    <div
      onClick={() => props.onClick(props.numTracks)}
      className="TrackContextMenu-item TrackContextMenu-hoverable-item-danger"
    >
      {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}❌{" "}
      {props.numTracks >= 0 ? "Remove" : `Remove ${props.numTracks} tracks`}
    </div>
  );
}
