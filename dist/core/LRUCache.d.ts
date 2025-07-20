/**
 * LRU (Least Recently Used) Cache with size and memory limits
 * Prevents unbounded memory growth from cached resources
 */
export interface CacheEntry<T> {
    value: T;
    size: number;
    timestamp: number;
    lastAccessed: number;
    hits: number;
}
export interface CacheOptions {
    maxEntries?: number;
    maxSizeBytes?: number;
    ttlMs?: number;
    onEvict?: <T>(key: string, entry: CacheEntry<T>) => void;
}
export declare class LRUCache<T> {
    private cache;
    private accessOrder;
    private totalSize;
    private readonly options;
    constructor(options?: CacheOptions);
    /**
     * Get a value from the cache
     */
    get(key: string): T | undefined;
    /**
     * Set a value in the cache
     */
    set(key: string, value: T, sizeBytes?: number): void;
    /**
     * Check if a key exists in the cache
     */
    has(key: string): boolean;
    /**
     * Delete a key from the cache
     */
    delete(key: string): boolean;
    /**
     * Clear all entries from the cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        entries: number;
        totalSizeBytes: number;
        maxEntries: number;
        maxSizeBytes: number;
        hitRate: number;
        avgHitsPerEntry: number;
        oldestEntryAge: number;
    };
    /**
     * Get all keys in the cache
     */
    keys(): string[];
    /**
     * Get the size of the cache
     */
    get size(): number;
    /**
     * Get the total size in bytes
     */
    get sizeBytes(): number;
    /**
     * Update access order for LRU tracking
     */
    private updateAccessOrder;
    /**
     * Prune expired entries
     */
    prune(): number;
}
