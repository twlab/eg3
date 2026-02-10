import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { getOrCreateStore, StoreConfig } from "./createStore";
import { useMemo } from "react";

export interface AppProviderProps {
  children: React.ReactNode;
  storeConfig?: StoreConfig;
}

export default function AppProvider({
  children,
  storeConfig,
}: AppProviderProps) {
  const storeId = storeConfig?.storeId;
  const enablePersistence = storeConfig?.enablePersistence;

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
