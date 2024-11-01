import React from "react";

interface TabsProps {
  selected: number;
  onSelect: (index: number, label: string) => void;
  children: React.ReactNode;
  headerStyle?: React.CSSProperties;
  activeHeaderStyle?: React.CSSProperties;
}

interface TabProps {
  label: string;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
  selected,
  onSelect,
  children,
  headerStyle,
  activeHeaderStyle,
}) => {
  return (
    <div>
      <ul className="nav nav-tabs">
        {React.Children.map(
          children,
          (child, index) =>
            React.isValidElement<TabProps>(child) && (
              <li
                key={index}
                className={`nav-item ${index === selected ? "active" : ""}`}
                onClick={() => onSelect(index, child.props.label)}
                style={
                  index === selected
                    ? { ...headerStyle, ...activeHeaderStyle }
                    : headerStyle
                }
              >
                <a className="nav-link" href="#" style={{ cursor: "pointer" }}>
                  {child.props.label}
                </a>
              </li>
            )
        )}
      </ul>
      <div className="tab-content">
        {React.Children.map(children, (child, index) =>
          index === selected && React.isValidElement<TabProps>(child) ? (
            <div className="tab-pane active">{child.props.children}</div>
          ) : null
        )}
      </div>
    </div>
  );
};

const Tab: React.FC<TabProps> = ({ children }) => <>{children}</>;

export { Tabs, Tab };
