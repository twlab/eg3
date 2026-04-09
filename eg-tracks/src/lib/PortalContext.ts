import { createContext } from "react";

/**
 * Provides a DOM element to use as the React portal target.
 * Set this to the root layout container so portals (e.g. config menus)
 * are scoped to the package root rather than document.body.
 */
const PortalContext = createContext<HTMLElement | null>(null);

export default PortalContext;
