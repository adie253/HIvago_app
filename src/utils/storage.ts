import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageMock {
    private cache: Record<string, string> = {};
    private prefix: string;

    constructor(prefix: string = '') {
        this.prefix = prefix;
    }

    public populate(key: string, value: string) {
        this.cache[key] = value;
    }

    public getItem(key: string): string | null {
        return this.cache[key] || null;
    }

    public setItem(key: string, value: string): void {
        this.cache[key] = value;
        const fullKey = this.prefix + key;
        (AsyncStorage as any).setItem(fullKey, value).catch((err: any) => {
            console.error(`[StorageMock] Failed to set ${fullKey}`, err);
        });
    }

    public removeItem(key: string): void {
        delete this.cache[key];
        const fullKey = this.prefix + key;
        (AsyncStorage as any).removeItem(fullKey).catch((err: any) => {
            console.error(`[StorageMock] Failed to remove ${fullKey}`, err);
        });
    }

    public clear(): void {
        const keysToRemove = Object.keys(this.cache);
        this.cache = {};
        Promise.all(
            keysToRemove.map(key => (AsyncStorage as any).removeItem(this.prefix + key))
        ).catch((err: any) => {
            console.error(`[StorageMock] Failed to clear storage`, err);
        });
    }

    // Custom helper to dump current cache
    public getCache() {
        return this.cache;
    }
}

export const localStorageMock = new StorageMock('local_');
export const sessionStorageMock = new StorageMock('session_');

// Expose mock globally
export const initStorage = async (): Promise<void> => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const localKeys = allKeys.filter(k => k.startsWith('local_'));
        const sessionKeys = allKeys.filter(k => k.startsWith('session_'));

        if (localKeys.length > 0) {
            const localPairs = await (AsyncStorage as any).multiGet(localKeys);
            localPairs.forEach(([fullKey, value]: [string, string | null]) => {
                if (fullKey && value !== null) {
                    const key = fullKey.substring(6); // remove 'local_'
                    localStorageMock.populate(key, value);
                }
            });
        }

        if (sessionKeys.length > 0) {
            const sessionPairs = await (AsyncStorage as any).multiGet(sessionKeys);
            sessionPairs.forEach(([fullKey, value]: [string, string | null]) => {
                if (fullKey && value !== null) {
                    const key = fullKey.substring(8); // remove 'session_'
                    sessionStorageMock.populate(key, value);
                }
            });
        }
        
        console.log('[Storage] Initialized and preloaded successfully.');
    } catch (e) {
        console.error('[Storage] Failed to preload AsyncStorage into synchronous cache', e);
    }
};

// Bind to global namespace if not already defined (e.g., on native mobile platforms)
try {
    if (typeof (globalThis as any).localStorage === 'undefined') {
        (globalThis as any).localStorage = localStorageMock;
    }
} catch (e) {
    console.warn('[Storage] Could not set global localStorage:', e);
}

try {
    if (typeof (globalThis as any).sessionStorage === 'undefined') {
        (globalThis as any).sessionStorage = sessionStorageMock;
    }
} catch (e) {
    console.warn('[Storage] Could not set global sessionStorage:', e);
}

