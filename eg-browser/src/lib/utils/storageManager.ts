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
