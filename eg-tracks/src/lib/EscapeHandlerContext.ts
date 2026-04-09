import { createContext } from "react";

/**

 *  RootLayout calls `current?.()` on Escape.
 */
const EscapeHandlerContext = createContext<React.MutableRefObject<(() => void) | null>>({ current: null });

export default EscapeHandlerContext;
