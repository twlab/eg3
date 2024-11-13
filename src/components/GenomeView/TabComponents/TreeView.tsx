import React, { ReactNode } from "react";

// Define interfaces for props
interface TreeViewData {
  label: string;
  isExpanded?: boolean;
  children?: TreeViewData[];
}

interface DefaultExpandButtonProps {
  isExpanded: boolean;
  onClick: () => void;
}

interface TreeViewProps {
  data: TreeViewData;
  onNodeToggled?: (node: TreeViewData) => void;
  indent?: number;
  childIndent?: number;
  leafRenderer?: any;
}

// Define a default expand button component
const DefaultExpandButton: React.FC<DefaultExpandButtonProps> = ({
  isExpanded,
  onClick,
}) => {
  if (isExpanded) {
    return (
      <span style={{ marginRight: 5 }} onClick={onClick}>
        ▾
      </span>
    );
  } else {
    return (
      <span
        style={{
          display: "inline-block",
          transform: "rotate(-90deg)",
          marginRight: 5,
          cursor: "pointer",
        }}
        onClick={onClick}
      >
        ▾
      </span>
    );
  }
};

// Define the TreeView functional component
const TreeView: React.FC<TreeViewProps> = ({
  data,
  onNodeToggled,
  indent = 0,
  childIndent = 20,
  leafRenderer,
}) => {
  const renderLeaf = (dataObj: TreeViewData): ReactNode => (
    <div style={{ marginLeft: indent }}>
      {leafRenderer ? leafRenderer(dataObj) : dataObj.label}
    </div>
  );

  const renderSubtree = (childObj: TreeViewData, index: number): ReactNode => (
    <TreeView
      key={index}
      data={childObj}
      onNodeToggled={onNodeToggled}
      indent={childIndent}
      childIndent={childIndent}
      leafRenderer={leafRenderer}
    />
  );

  if (!data.children) {
    return <>{renderLeaf(data)}</>;
  }

  const onClick = onNodeToggled ? () => onNodeToggled(data) : () => {};

  return (
    <div style={{ marginLeft: indent, borderLeft: "1px solid grey" }}>
      <DefaultExpandButton
        isExpanded={data.isExpanded || false}
        onClick={onClick}
      />
      <span style={{ cursor: "pointer" }} onClick={onClick}>
        {" "}
        {data.label}
      </span>
      {data.isExpanded ? data.children.map(renderSubtree) : null}
    </div>
  );
};

export default TreeView;
