/**
 * Utility functions for managing localStorage and monitoring storage usage
 */

/**
 * Get the approximate size of data stored in localStorage in KB
 */
export function getStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return (total / 1024).toFixed(2) as unknown as number;
}

/**
 * Get detailed storage breakdown by key
 */
export function getStorageBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            const size = (localStorage[key].length + key.length) / 1024;
            breakdown[key] = parseFloat(size.toFixed(2));
        }
    }
    return breakdown;
}

/**
 * Check if we're approaching storage limits (typically 5-10MB for localStorage)
 */
export function isStorageNearLimit(thresholdKB: number = 8000): boolean {
    return getStorageSize() > thresholdKB;
}

/**
 * Clear old session data while preserving settings
 */
export function clearOldSessions(): void {
    const settingsKeys = ['settings', 'darkTheme', 'user-preferences'];
    const toPreserve: Record<string, string> = {};

    // Preserve specific keys
    settingsKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            toPreserve[key] = value;
        }
    });

    // Clear everything
    localStorage.clear();

    // Restore preserved items
    Object.entries(toPreserve).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
}

/**
 * Log storage usage information to console
 */
export function logStorageInfo(): void {
    console.group('📊 LocalStorage Usage');
    console.log(`Total Size: ${getStorageSize()} KB`);
    console.log('Breakdown by key:');
    const breakdown = getStorageBreakdown();
    Object.entries(breakdown)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, size]) => {
            console.log(`  ${key}: ${size} KB`);
        });
    console.groupEnd();
}

/** Total characters localStorage holds for this origin, keys included. */
export function getLocalStorageUsage(): number {
    let total = 0;
    for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return total;
}

const STORAGE_PROBE_KEY = "__eg-storage-probe__";

/**
 * Whether localStorage still has `fraction` of its capacity free.
 *
 * Nothing reports the localStorage quota: it varies by browser, and
 * `navigator.storage.estimate()` measures the whole origin rather than this one
 * store. So this measures it the only way that is actually reliable — by
 * attempting a write of the size in question and seeing whether it lands.
 *
 * If usage sat at exactly `1 - fraction` of capacity, the free space left would
 * be `usage * fraction / (1 - fraction)`, so writing that much is precisely the
 * test for "have I passed that mark yet?". The probe is always removed again,
 * whether or not it fit.
 */
export function hasStorageHeadroom(fraction: number): boolean {
    if (typeof localStorage === "undefined") return true;
    if (fraction <= 0) return true;
    if (fraction >= 1) return false;

    const usage = getLocalStorageUsage();
    if (usage <= 0) return true;

    const probeSize = Math.ceil((usage * fraction) / (1 - fraction));
    try {
        localStorage.setItem(STORAGE_PROBE_KEY, "x".repeat(probeSize));
        return true;
    } catch {
        return false;
    } finally {
        try {
            localStorage.removeItem(STORAGE_PROBE_KEY);
        } catch {
            // Nothing to undo if even the removal fails.
        }
    }
}

/**
 * Approximate the number of characters `value` occupies once serialized.
 *
 * localStorage bills in UTF-16 code units, and `JSON.stringify(...).length`
 * counts exactly those, so this is the right unit to compare sizes in. Values
 * that cannot be serialized (circular refs) count as 0 rather than throwing —
 * the result only ever feeds a size heuristic.
 */
export function getSerializedSize(value: unknown): number {
    try {
        return JSON.stringify(value)?.length ?? 0;
    } catch {
        return 0;
    }
}
