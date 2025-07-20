/**
 * RenderOptimizer - Implements viewport culling and render optimizations
 * Improves performance by only rendering visible objects
 */

export interface Bounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Renderable {
	id: string;
	bounds: Bounds;
	visible: boolean;
	enabled: boolean;
	z?: number;
}

export interface Viewport {
	x: number;
	y: number;
	width: number;
	height: number;
	scale: number;
}

export interface RenderStats {
	totalObjects: number;
	visibleObjects: number;
	culledObjects: number;
	renderTime: number;
	cullTime: number;
}

export class RenderOptimizer {
	private viewport: Viewport = {
		x: 0,
		y: 0,
		width: 800,
		height: 600,
		scale: 1
	};

	private stats: RenderStats = {
		totalObjects: 0,
		visibleObjects: 0,
		culledObjects: 0,
		renderTime: 0,
		cullTime: 0
	};

	private cullMargin = 50; // Pixels of margin outside viewport
	private enableCulling = true;
	private enableDepthSort = true;

	constructor(config?: {
		cullMargin?: number;
		enableCulling?: boolean;
		enableDepthSort?: boolean;
	}) {
		if (config) {
			this.cullMargin = config.cullMargin ?? this.cullMargin;
			this.enableCulling = config.enableCulling ?? this.enableCulling;
			this.enableDepthSort = config.enableDepthSort ?? this.enableDepthSort;
		}
	}

	/**
	 * Update the viewport dimensions
	 */
	setViewport(viewport: Partial<Viewport>): void {
		this.viewport = { ...this.viewport, ...viewport };
	}

	/**
	 * Get current viewport
	 */
	getViewport(): Viewport {
		return { ...this.viewport };
	}

	/**
	 * Check if bounds intersect with viewport
	 */
	isInViewport(bounds: Bounds): boolean {
		if (!this.enableCulling) return true;

		const margin = this.cullMargin;
		const vp = this.viewport;

		// Expanded viewport bounds for culling
		const vpLeft = vp.x - margin;
		const vpRight = vp.x + vp.width + margin;
		const vpTop = vp.y - margin;
		const vpBottom = vp.y + vp.height + margin;

		// Object bounds
		const objLeft = bounds.x;
		const objRight = bounds.x + bounds.width;
		const objTop = bounds.y;
		const objBottom = bounds.y + bounds.height;

		// Check intersection
		return !(
			objRight < vpLeft ||
			objLeft > vpRight ||
			objBottom < vpTop ||
			objTop > vpBottom
		);
	}

	/**
	 * Cull objects based on viewport visibility
	 */
	cullObjects<T extends Renderable>(objects: T[]): T[] {
		const startTime = performance.now();

		// Filter enabled objects
		let visibleObjects = objects.filter(obj => obj.enabled);

		// Update stats
		this.stats.totalObjects = objects.length;

		if (this.enableCulling) {
			// Perform viewport culling
			visibleObjects = visibleObjects.filter(obj => {
				const inViewport = this.isInViewport(obj.bounds);
				obj.visible = inViewport;
				return inViewport;
			});
		}

		// Sort by depth if enabled
		if (this.enableDepthSort) {
			visibleObjects.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
		}

		// Update stats
		this.stats.visibleObjects = visibleObjects.length;
		this.stats.culledObjects = this.stats.totalObjects - this.stats.visibleObjects;
		this.stats.cullTime = performance.now() - startTime;

		return visibleObjects;
	}

	/**
	 * Create a spatial index for efficient culling of large object counts
	 */
	createSpatialIndex<T extends Renderable>(
		objects: T[],
		cellSize: number = 100
	): SpatialIndex<T> {
		return new SpatialIndex(objects, cellSize);
	}

	/**
	 * Get render statistics
	 */
	getStats(): RenderStats {
		return { ...this.stats };
	}

	/**
	 * Reset statistics
	 */
	resetStats(): void {
		this.stats = {
			totalObjects: 0,
			visibleObjects: 0,
			culledObjects: 0,
			renderTime: 0,
			cullTime: 0
		};
	}

	/**
	 * Set culling enabled/disabled
	 */
	setCullingEnabled(enabled: boolean): void {
		this.enableCulling = enabled;
	}

	/**
	 * Set depth sorting enabled/disabled
	 */
	setDepthSortEnabled(enabled: boolean): void {
		this.enableDepthSort = enabled;
	}
}

/**
 * SpatialIndex - Grid-based spatial indexing for efficient culling
 * Useful when dealing with thousands of objects
 */
export class SpatialIndex<T extends Renderable> {
	private grid: Map<string, T[]> = new Map();
	private cellSize: number;
	private objects: T[];

	constructor(objects: T[], cellSize: number = 100) {
		this.objects = objects;
		this.cellSize = cellSize;
		this.rebuild();
	}

	/**
	 * Rebuild the spatial index
	 */
	rebuild(): void {
		this.grid.clear();

		for (const obj of this.objects) {
			const cells = this.getCellsForBounds(obj.bounds);
			for (const cell of cells) {
				if (!this.grid.has(cell)) {
					this.grid.set(cell, []);
				}
				this.grid.get(cell)!.push(obj);
			}
		}
	}

	/**
	 * Query objects within viewport
	 */
	query(viewport: Bounds): T[] {
		const cells = this.getCellsForBounds(viewport);
		const candidates = new Set<T>();

		for (const cell of cells) {
			const objects = this.grid.get(cell);
			if (objects) {
				objects.forEach(obj => candidates.add(obj));
			}
		}

		// Final bounds check on candidates
		return Array.from(candidates).filter(obj => {
			return this.boundsIntersect(obj.bounds, viewport);
		});
	}

	/**
	 * Get grid cells that intersect with bounds
	 */
	private getCellsForBounds(bounds: Bounds): string[] {
		const cells: string[] = [];

		const minX = Math.floor(bounds.x / this.cellSize);
		const maxX = Math.floor((bounds.x + bounds.width) / this.cellSize);
		const minY = Math.floor(bounds.y / this.cellSize);
		const maxY = Math.floor((bounds.y + bounds.height) / this.cellSize);

		for (let x = minX; x <= maxX; x++) {
			for (let y = minY; y <= maxY; y++) {
				cells.push(`${x},${y}`);
			}
		}

		return cells;
	}

	/**
	 * Check if two bounds intersect
	 */
	private boundsIntersect(a: Bounds, b: Bounds): boolean {
		return !(
			a.x + a.width < b.x ||
			b.x + b.width < a.x ||
			a.y + a.height < b.y ||
			b.y + b.height < a.y
		);
	}

	/**
	 * Update an object's position in the index
	 */
	updateObject(obj: T, oldBounds: Bounds): void {
		// Remove from old cells
		const oldCells = this.getCellsForBounds(oldBounds);
		for (const cell of oldCells) {
			const objects = this.grid.get(cell);
			if (objects) {
				const index = objects.indexOf(obj);
				if (index !== -1) {
					objects.splice(index, 1);
					if (objects.length === 0) {
						this.grid.delete(cell);
					}
				}
			}
		}

		// Add to new cells
		const newCells = this.getCellsForBounds(obj.bounds);
		for (const cell of newCells) {
			if (!this.grid.has(cell)) {
				this.grid.set(cell, []);
			}
			this.grid.get(cell)!.push(obj);
		}
	}
}
