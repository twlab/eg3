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
