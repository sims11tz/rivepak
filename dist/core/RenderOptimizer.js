/**
 * RenderOptimizer - Implements viewport culling and render optimizations
 * Improves performance by only rendering visible objects
 */
export class RenderOptimizer {
    constructor(config) {
        var _a, _b, _c;
        this.viewport = {
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            scale: 1
        };
        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0,
            renderTime: 0,
            cullTime: 0
        };
        this.cullMargin = 50; // Pixels of margin outside viewport
        this.enableCulling = true;
        this.enableDepthSort = true;
        if (config) {
            this.cullMargin = (_a = config.cullMargin) !== null && _a !== void 0 ? _a : this.cullMargin;
            this.enableCulling = (_b = config.enableCulling) !== null && _b !== void 0 ? _b : this.enableCulling;
            this.enableDepthSort = (_c = config.enableDepthSort) !== null && _c !== void 0 ? _c : this.enableDepthSort;
        }
    }
    /**
     * Update the viewport dimensions
     */
    setViewport(viewport) {
        this.viewport = Object.assign(Object.assign({}, this.viewport), viewport);
    }
    /**
     * Get current viewport
     */
    getViewport() {
        return Object.assign({}, this.viewport);
    }
    /**
     * Check if bounds intersect with viewport
     */
    isInViewport(bounds) {
        if (!this.enableCulling)
            return true;
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
        return !(objRight < vpLeft ||
            objLeft > vpRight ||
            objBottom < vpTop ||
            objTop > vpBottom);
    }
    /**
     * Cull objects based on viewport visibility
     */
    cullObjects(objects) {
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
            visibleObjects.sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
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
    createSpatialIndex(objects, cellSize = 100) {
        return new SpatialIndex(objects, cellSize);
    }
    /**
     * Get render statistics
     */
    getStats() {
        return Object.assign({}, this.stats);
    }
    /**
     * Reset statistics
     */
    resetStats() {
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
    setCullingEnabled(enabled) {
        this.enableCulling = enabled;
    }
    /**
     * Set depth sorting enabled/disabled
     */
    setDepthSortEnabled(enabled) {
        this.enableDepthSort = enabled;
    }
}
/**
 * SpatialIndex - Grid-based spatial indexing for efficient culling
 * Useful when dealing with thousands of objects
 */
export class SpatialIndex {
    constructor(objects, cellSize = 100) {
        this.grid = new Map();
        this.objects = objects;
        this.cellSize = cellSize;
        this.rebuild();
    }
    /**
     * Rebuild the spatial index
     */
    rebuild() {
        this.grid.clear();
        for (const obj of this.objects) {
            const cells = this.getCellsForBounds(obj.bounds);
            for (const cell of cells) {
                if (!this.grid.has(cell)) {
                    this.grid.set(cell, []);
                }
                this.grid.get(cell).push(obj);
            }
        }
    }
    /**
     * Query objects within viewport
     */
    query(viewport) {
        const cells = this.getCellsForBounds(viewport);
        const candidates = new Set();
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
    getCellsForBounds(bounds) {
        const cells = [];
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
    boundsIntersect(a, b) {
        return !(a.x + a.width < b.x ||
            b.x + b.width < a.x ||
            a.y + a.height < b.y ||
            b.y + b.height < a.y);
    }
    /**
     * Update an object's position in the index
     */
    updateObject(obj, oldBounds) {
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
            this.grid.get(cell).push(obj);
        }
    }
}
