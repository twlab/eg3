export const OpacityThickness = (props) => {
  const { onUpdate, opacity, thickness, highlightStyle } = props;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          line opacity:
        </span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={opacity}
          onChange={(e) =>
            onUpdate("lineOpacity", Number.parseFloat(e.target.value || "0"))
          }
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "4px",
            padding: "4px",
            width: "60px",
            fontSize: "14px",
          }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          thickness/radius:
        </span>
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={thickness}
          onChange={(e) =>
            onUpdate(
              "cartoonThickness",
              Number.parseFloat(e.target.value || "0")
            )
          }
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "4px",
            padding: "4px",
            width: "60px",
            fontSize: "14px",
          }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          paint style:
        </span>
        <select
          value={highlightStyle}
          onChange={(e) => onUpdate("highlightStyle", e.target.value)}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "4px",
            padding: "4px",
            fontSize: "14px",
            minWidth: "80px",
          }}
        >
          <option value="cartoon">cartoon</option>
          <option value="sphere">sphere</option>
          {/* <option value="cross">cross</option> */}
          {/* <option value="line">line</option> */}
        </select>
      </label>
    </div>
  );
};

OpacityThickness.defaultProps = {};
