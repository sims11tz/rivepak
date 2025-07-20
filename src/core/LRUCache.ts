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

export class LRUCache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private accessOrder: string[] = [];
	private totalSize = 0;
	private readonly options: Required<CacheOptions>;

	constructor(options: CacheOptions = {}) {
		this.options = {
			maxEntries: options.maxEntries || 100,
			maxSizeBytes: options.maxSizeBytes || 100 * 1024 * 1024, // 100MB default
			ttlMs: options.ttlMs || 0, // 0 = no TTL
			onEvict: options.onEvict || (() => {})
		};
	}

	/**
	 * Get a value from the cache
	 */
	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) {
			return undefined;
		}

		// Check TTL
		if (this.options.ttlMs > 0) {
			const age = Date.now() - entry.timestamp;
			if (age > this.options.ttlMs) {
				this.delete(key);
				return undefined;
			}
		}

		// Update access order and stats
		this.updateAccessOrder(key);
		entry.lastAccessed = Date.now();
		entry.hits++;

		return entry.value;
	}

	/**
	 * Set a value in the cache
	 */
	set(key: string, value: T, sizeBytes: number = 0): void {
		// Remove existing entry if present
		if (this.cache.has(key)) {
			this.delete(key);
		}

		// Check if this entry would exceed size limit
		if (sizeBytes > this.options.maxSizeBytes) {
			console.warn(`Cache entry ${key} exceeds max size limit`);
			return;
		}

		// Evict entries until we have space
		while (
			(this.cache.size >= this.options.maxEntries ||
			 this.totalSize + sizeBytes > this.options.maxSizeBytes) &&
			this.accessOrder.length > 0
		) {
			const lru = this.accessOrder[0];
			this.delete(lru);
		}

		// Add new entry
		const entry: CacheEntry<T> = {
			value,
			size: sizeBytes,
			timestamp: Date.now(),
			lastAccessed: Date.now(),
			hits: 0
		};

		this.cache.set(key, entry);
		this.accessOrder.push(key);
		this.totalSize += sizeBytes;
	}

	/**
	 * Check if a key exists in the cache
	 */
	has(key: string): boolean {
		const entry = this.cache.get(key);
		if (!entry) {
			return false;
		}

		// Check TTL
		if (this.options.ttlMs > 0) {
			const age = Date.now() - entry.timestamp;
			if (age > this.options.ttlMs) {
				this.delete(key);
				return false;
			}
		}

		return true;
	}

	/**
	 * Delete a key from the cache
	 */
	delete(key: string): boolean {
		const entry = this.cache.get(key);
		if (!entry) {
			return false;
		}

		// Call eviction callback
		this.options.onEvict(key, entry);

		// Remove from cache
		this.cache.delete(key);

		// Remove from access order
		const index = this.accessOrder.indexOf(key);
		if (index !== -1) {
			this.accessOrder.splice(index, 1);
		}

		// Update total size
		this.totalSize -= entry.size;

		return true;
	}

	/**
	 * Clear all entries from the cache
	 */
	clear(): void {
		// Call eviction callback for all entries
		this.cache.forEach((entry, key) => {
			this.options.onEvict(key, entry);
		});

		this.cache.clear();
		this.accessOrder = [];
		this.totalSize = 0;
	}

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
	} {
		let totalHits = 0;
		let oldestTimestamp = Date.now();

		this.cache.forEach(entry => {
			totalHits += entry.hits;
			if (entry.timestamp < oldestTimestamp) {
				oldestTimestamp = entry.timestamp;
			}
		});

		const entries = this.cache.size;
		const avgHitsPerEntry = entries > 0 ? totalHits / entries : 0;
		const oldestEntryAge = entries > 0 ? Date.now() - oldestTimestamp : 0;

		return {
			entries,
			totalSizeBytes: this.totalSize,
			maxEntries: this.options.maxEntries,
			maxSizeBytes: this.options.maxSizeBytes,
			hitRate: 0, // Would need to track misses to calculate
			avgHitsPerEntry,
			oldestEntryAge
		};
	}

	/**
	 * Get all keys in the cache
	 */
	keys(): string[] {
		return Array.from(this.cache.keys());
	}

	/**
	 * Get the size of the cache
	 */
	get size(): number {
		return this.cache.size;
	}

	/**
	 * Get the total size in bytes
	 */
	get sizeBytes(): number {
		return this.totalSize;
	}

	/**
	 * Update access order for LRU tracking
	 */
	private updateAccessOrder(key: string): void {
		const index = this.accessOrder.indexOf(key);
		if (index !== -1) {
			// Remove from current position
			this.accessOrder.splice(index, 1);
		}
		// Add to end (most recently used)
		this.accessOrder.push(key);
	}

	/**
	 * Prune expired entries
	 */
	prune(): number {
		if (this.options.ttlMs <= 0) {
			return 0;
		}

		const now = Date.now();
		let pruned = 0;

		const keysToDelete: string[] = [];
		this.cache.forEach((entry, key) => {
			const age = now - entry.timestamp;
			if (age > this.options.ttlMs) {
				keysToDelete.push(key);
			}
		});

		keysToDelete.forEach(key => {
			this.delete(key);
			pruned++;
		});

		return pruned;
	}
}
