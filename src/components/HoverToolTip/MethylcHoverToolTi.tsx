import { FC, useEffect, useState } from 'react';
import Tooltip from './Tooltip';
interface TooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  content: string;
}
interface TooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  content: string;
}
function MethylcToolTip(props) {
  const [toolTip, setToolTip] = useState(<></>);
  function showTooltip(event) {
    const contents = props.content;
    if (!contents) {
      closeTooltip();
      return;
    }

    setToolTip(
      <Tooltip
        pageX={event.pageX}
        pageY={pageY}
        onClose={closeTooltip}
        ignoreMouse={true}
      >
        {contents}
      </Tooltip>
    );
  }

  function closeTooltip() {
    setToolTip(<></>);
  }
  return (
    <div onMouseMove={showTooltip} onMouseLeave={closeTooltip} {...otherProps}>
      {toolTip}
    </div>
  );
}
export default MethylcToolTip;
