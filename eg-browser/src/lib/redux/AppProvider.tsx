import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { getOrCreateStore, StoreConfig } from "./createStore";
import { useMemo } from "react";

export interface AppProviderProps {
  children: React.ReactNode;
  /**
   * Configuration for the Redux store.
   * Pass a unique storeId to create isolated state for each App instance.
   */
  storeConfig?: StoreConfig;
}

/**
 * Provider component that creates an isolated Redux store for each App instance.
 *
 * @example
 * // Single instance (default behavior)
 * <AppProvider>
 *   <RootLayout />
 * </AppProvider>
 *
 * @example
 * // Multiple isolated instances
 * <AppProvider storeConfig={{ storeId: 'genome-hub-1' }}>
 *   <RootLayout />
 * </AppProvider>
 * <AppProvider storeConfig={{ storeId: 'genome-hub-2' }}>
 *   <RootLayout />
 * </AppProvider>
 */
export default function AppProvider({
  children,
  storeConfig,
}: AppProviderProps) {
  // Extract primitive values for stable dependencies
  const storeId = storeConfig?.storeId;
  const enablePersistence = storeConfig?.enablePersistence;

  // Get or create a cached store instance to ensure persistence works across remounts
  const { store, persistor } = useMemo(
    () => getOrCreateStore({ storeId, enablePersistence }),
    [storeId, enablePersistence]
  );

  if (!persistor) {
    // No persistence enabled, use plain Provider
    return <Provider store={store}>{children}</Provider>;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
