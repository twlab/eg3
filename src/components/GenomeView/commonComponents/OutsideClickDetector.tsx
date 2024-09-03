import { PureComponent, RefObject } from "react";

interface OutsideClickDetectorProps {
  onOutsideClick?: (event: MouseEvent) => void;
  innerRef?: (node: Node) => void;
}

class OutsideClickDetector extends PureComponent<OutsideClickDetectorProps> {
  private node: Node | null = null;

  componentDidMount() {
    document.addEventListener("mousedown", this.detectOutsideClick);
  }

  handleRef = (node: Node) => {
    this.node = node;
    if (this.props.innerRef) {
      this.props.innerRef(node);
    }
  };

  detectOutsideClick = (event: any) => {
    if (
      this.node &&
      !this.node.contains(event.target as Node) &&
      this.props.onOutsideClick
    ) {
      this.props.onOutsideClick(event);
    }
  };

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.detectOutsideClick);
  }

  render() {
    const { onOutsideClick, ...otherProps } = this.props;
    return (
      <div
        style={{ position: "relative", zIndex: 0 }}
        {...otherProps}
        ref={this.handleRef}
      />
    );
  }
}

export default OutsideClickDetector;
