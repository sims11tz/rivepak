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
export declare class RenderOptimizer {
    private viewport;
    private stats;
    private cullMargin;
    private enableCulling;
    private enableDepthSort;
    constructor(config?: {
        cullMargin?: number;
        enableCulling?: boolean;
        enableDepthSort?: boolean;
    });
    /**
     * Update the viewport dimensions
     */
    setViewport(viewport: Partial<Viewport>): void;
    /**
     * Get current viewport
     */
    getViewport(): Viewport;
    /**
     * Check if bounds intersect with viewport
     */
    isInViewport(bounds: Bounds): boolean;
    /**
     * Cull objects based on viewport visibility
     */
    cullObjects<T extends Renderable>(objects: T[]): T[];
    /**
     * Create a spatial index for efficient culling of large object counts
     */
    createSpatialIndex<T extends Renderable>(objects: T[], cellSize?: number): SpatialIndex<T>;
    /**
     * Get render statistics
     */
    getStats(): RenderStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Set culling enabled/disabled
     */
    setCullingEnabled(enabled: boolean): void;
    /**
     * Set depth sorting enabled/disabled
     */
    setDepthSortEnabled(enabled: boolean): void;
}
/**
 * SpatialIndex - Grid-based spatial indexing for efficient culling
 * Useful when dealing with thousands of objects
 */
export declare class SpatialIndex<T extends Renderable> {
    private grid;
    private cellSize;
    private objects;
    constructor(objects: T[], cellSize?: number);
    /**
     * Rebuild the spatial index
     */
    rebuild(): void;
    /**
     * Query objects within viewport
     */
    query(viewport: Bounds): T[];
    /**
     * Get grid cells that intersect with bounds
     */
    private getCellsForBounds;
    /**
     * Check if two bounds intersect
     */
    private boundsIntersect;
    /**
     * Update an object's position in the index
     */
    updateObject(obj: T, oldBounds: Bounds): void;
}
