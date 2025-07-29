import { useState, useEffect } from "react";

export const ResolutionList = (props) => {
  const { resolutions, resolution, onUpdateResolution } = props;
  // console.log(props)
  const [reso, setReso] = useState("0");
  useEffect(() => {
    setReso(resolution);
  }, [resolution]);
  if (!resolutions.length) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",

        width: "100%",
      }}
    >
      <select
        value={reso.toString()}
        onChange={(e) => setReso(e.target.value)}
        style={{
          padding: "4px 8px",
          borderRadius: "2px",
          border: "1px solid #ccc",
          fontSize: "14px",
          lineHeight: "1.4",
          margin: "0",
          verticalAlign: "middle",
        }}
      >
        {resolutions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <button
        className="btn btn-primary btn-sm"
        onClick={() => onUpdateResolution(Number.parseInt(reso, 10))}
        style={{
          padding: "4px 12px",
          fontSize: "14px",
          lineHeight: "1.4",
          margin: "0",
          verticalAlign: "middle",
        }}
      >
        Go
      </button>
    </div>
  );
};

ResolutionList.defaultProps = {
  resolutions: [],
  resolution: 0,
  onUpdateResolution: () => {},
};
