/**
 * ResourceManager - Centralized resource tracking and lifecycle management
 * Prevents memory leaks by tracking all resources and ensuring proper cleanup
 */
export interface Disposable {
    dispose(): void;
}
export interface Resource {
    id: string;
    type: ResourceType;
    resource: any;
    dispose?: () => void;
    metadata?: Record<string, any>;
}
export declare enum ResourceType {
    CANVAS = "canvas",
    WEBGL_CONTEXT = "webgl_context",
    EVENT_LISTENER = "event_listener",
    ANIMATION_FRAME = "animation_frame",
    RIVE_FILE = "rive_file",
    RIVE_ARTBOARD = "rive_artboard",
    RIVE_ANIMATION = "rive_animation",
    PIXI_APPLICATION = "pixi_application",
    PIXI_GRAPHICS = "pixi_graphics",
    PIXI_TEXT = "pixi_text",
    MATTER_BODY = "matter_body",
    MATTER_ENGINE = "matter_engine",
    GENERIC = "generic"
}
export declare class ResourceManager implements Disposable {
    private resources;
    private typeIndex;
    private disposed;
    private readonly maxResourcesPerType;
    constructor();
    /**
     * Register a resource for tracking
     */
    register<T>(id: string, type: ResourceType, resource: T, dispose?: () => void): T;
    /**
     * Register an event listener with automatic cleanup
     */
    registerEventListener(target: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions): () => void;
    /**
     * Register an animation frame with automatic cleanup
     */
    registerAnimationFrame(callback: FrameRequestCallback, customRAF?: (callback: FrameRequestCallback) => number, customCAF?: (id: number) => void): () => void;
    /**
     * Unregister and dispose a resource
     */
    unregister(id: string): void;
    /**
     * Get a resource by ID
     */
    get<T>(id: string): T | undefined;
    /**
     * Get all resources of a specific type
     */
    getByType<T>(type: ResourceType): T[];
    /**
     * Get resource count by type
     */
    getCountByType(type: ResourceType): number;
    /**
     * Get total resource count
     */
    getTotalCount(): number;
    /**
     * Get resource statistics
     */
    getStats(): Record<ResourceType, number>;
    /**
     * Dispose all resources of a specific type
     */
    disposeByType(type: ResourceType): void;
    /**
     * Dispose all resources
     */
    dispose(): void;
    /**
     * Check if the manager has been disposed
     */
    isDisposed(): boolean;
}
