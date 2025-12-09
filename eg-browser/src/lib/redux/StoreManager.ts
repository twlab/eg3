import {
  AppStore,
  AppPersistor,
  getOrCreateStore,
  clearStoreCacheEntry,
  StoreConfig,
} from "./createStore";

/**
 * Manager for multiple store instances.
 * Useful when you need to programmatically control multiple App instances.
 */
export class StoreManager {
  private stores: Map<
    string,
    { store: AppStore; persistor: AppPersistor | null }
  > = new Map();

  /**
   * Create or retrieve a store instance by ID
   */
  getOrCreateStore(storeId: string, config?: Omit<StoreConfig, "storeId">) {
    if (!this.stores.has(storeId)) {
      const { store, persistor } = getOrCreateStore({
        ...config,
        storeId,
      });
      this.stores.set(storeId, { store, persistor });
    }
    return this.stores.get(storeId)!;
  }

  /**
   * Get an existing store by ID
   */
  getStore(storeId: string) {
    return this.stores.get(storeId);
  }

  /**
   * Check if a store exists
   */
  hasStore(storeId: string) {
    return this.stores.has(storeId);
  }

  /**
   * Remove a store and optionally clean up its persisted state
   */
  removeStore(storeId: string, cleanupPersistence = true) {
    const storeData = this.stores.get(storeId);

    if (storeData) {
      // Purge the persistor if it exists
      if (storeData.persistor && cleanupPersistence) {
        storeData.persistor.purge();
        // Also remove from localStorage directly as backup
        try {
          localStorage.removeItem(`persist:${storeId}`);
        } catch (error) {
          console.error(`Failed to clean up storage for ${storeId}:`, error);
        }
      }

      this.stores.delete(storeId);

      // Also clear from the global store cache
      clearStoreCacheEntry({ storeId });
    }
  }

  /**
   * Get all active store IDs
   */
  getStoreIds() {
    return Array.from(this.stores.keys());
  }

  /**
   * Get the count of active stores
   */
  getStoreCount() {
    return this.stores.size;
  }

  /**
   * Remove all stores and optionally clean up their persisted state
   */
  clearAll(cleanupPersistence = true) {
    const storeIds = this.getStoreIds();
    storeIds.forEach((id) => this.removeStore(id, cleanupPersistence));
  }

  /**
   * Clean up orphaned localStorage entries that don't correspond to active stores
   */
  cleanupOrphanedStorage() {
    try {
      const keys = Object.keys(localStorage);
      const persistKeys = keys.filter((key) => key.startsWith("persist:"));

      persistKeys.forEach((key) => {
        const storeId = key.replace("persist:", "");
        if (!this.stores.has(storeId)) {
          console.log(`Cleaning up orphaned storage for: ${storeId}`);
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to cleanup orphaned storage:", error);
    }
  }
}

/**
 * Global store manager instance (optional - you can create your own)
 */
export const globalStoreManager = new StoreManager();
