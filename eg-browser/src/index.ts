import { GenomeViewer } from "wuepgg3-track";

export { default as GenomeHub } from "./App";
export type { AppProps } from "./App";
export { GenomeViewer };

// Export store creation utilities for advanced use cases
export {
  createAppStore,
  getOrCreateStore,
  clearStoreCacheEntry,
  clearAllStoreCaches,
} from "./lib/redux/createStore";
export type {
  StoreConfig,
  AppStore,
  AppPersistor,
  RootState,
  AppDispatch,
} from "./lib/redux/createStore";
export { default as AppProvider } from "./lib/redux/AppProvider";
export type { AppProviderProps } from "./lib/redux/AppProvider";

// Export store manager for programmatic control of multiple instances
export { StoreManager, globalStoreManager } from "./lib/redux/StoreManager";

// Export browser selectors and actions
export {
  selectCurrentSession,
  selectCurrentSessionId,
  selectSessions,
  selectSessionById,
  selectCanUndo,
  selectCanRedo,
  createSession,
  updateSession,
  updateCurrentSession,
  addTracks,
  setCurrentSession,
  deleteSession,
  upsertSession,
  clearAllSessions,
} from "./lib/redux/slices/browserSlice";
export type { BrowserSession, uuid } from "./lib/redux/slices/browserSlice";
