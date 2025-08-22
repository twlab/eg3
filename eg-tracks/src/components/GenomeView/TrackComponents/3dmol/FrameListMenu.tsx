import React from "react";

export const FrameListMenu = (props) => {
  const { frameList } = props;
  if (!frameList.length) return null;
  return (
    <div className="FrameListMenu">
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "8px",
          background: "#ffffff",
        }}
      >
        <ol
          style={{
            margin: 0,
            paddingLeft: "20px",
            fontSize: "12px",
            color: "#374151",
          }}
        >
          {frameList.map((frame, index) => {
            return (
              <li
                key={index}
                style={{
                  padding: "4px 0",
                  borderBottom:
                    index < frameList.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                <span style={{ fontWeight: "500" }}>{frame}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

FrameListMenu.defaultProps = {
  frameList: [],
};
