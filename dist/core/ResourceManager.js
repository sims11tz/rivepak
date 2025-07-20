/**
 * ResourceManager - Centralized resource tracking and lifecycle management
 * Prevents memory leaks by tracking all resources and ensuring proper cleanup
 */
export var ResourceType;
(function (ResourceType) {
    ResourceType["CANVAS"] = "canvas";
    ResourceType["WEBGL_CONTEXT"] = "webgl_context";
    ResourceType["EVENT_LISTENER"] = "event_listener";
    ResourceType["ANIMATION_FRAME"] = "animation_frame";
    ResourceType["RIVE_FILE"] = "rive_file";
    ResourceType["RIVE_ARTBOARD"] = "rive_artboard";
    ResourceType["RIVE_ANIMATION"] = "rive_animation";
    ResourceType["PIXI_APPLICATION"] = "pixi_application";
    ResourceType["PIXI_GRAPHICS"] = "pixi_graphics";
    ResourceType["PIXI_TEXT"] = "pixi_text";
    ResourceType["MATTER_BODY"] = "matter_body";
    ResourceType["MATTER_ENGINE"] = "matter_engine";
    ResourceType["GENERIC"] = "generic";
})(ResourceType || (ResourceType = {}));
export class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.typeIndex = new Map();
        this.disposed = false;
        this.maxResourcesPerType = new Map([
            [ResourceType.RIVE_FILE, 50],
            [ResourceType.RIVE_ARTBOARD, 100],
            [ResourceType.PIXI_GRAPHICS, 500],
            [ResourceType.MATTER_BODY, 1000]
        ]);
        // Initialize type index
        Object.values(ResourceType).forEach(type => {
            this.typeIndex.set(type, new Set());
        });
    }
    /**
     * Register a resource for tracking
     */
    register(id, type, resource, dispose) {
        if (this.disposed) {
            throw new Error('ResourceManager has been disposed');
        }
        // Check resource limits
        const typeResources = this.typeIndex.get(type);
        const maxResources = this.maxResourcesPerType.get(type);
        if (maxResources && typeResources.size >= maxResources) {
            console.warn(`Resource limit reached for type ${type}. Consider cleaning up unused resources.`);
            // Optionally implement LRU eviction here
        }
        // Clean up existing resource with same ID if exists
        if (this.resources.has(id)) {
            this.unregister(id);
        }
        this.resources.set(id, {
            id,
            type,
            resource,
            dispose
        });
        typeResources.add(id);
        return resource;
    }
    /**
     * Register an event listener with automatic cleanup
     */
    registerEventListener(target, event, handler, options) {
        const id = `event_${Date.now()}_${Math.random()}`;
        target.addEventListener(event, handler, options);
        const dispose = () => {
            target.removeEventListener(event, handler, options);
        };
        this.register(id, ResourceType.EVENT_LISTENER, { target, event, handler }, dispose);
        // Return unsubscribe function
        return () => this.unregister(id);
    }
    /**
     * Register an animation frame with automatic cleanup
     */
    registerAnimationFrame(callback, customRAF, customCAF) {
        const raf = customRAF || window.requestAnimationFrame.bind(window);
        const caf = customCAF || window.cancelAnimationFrame.bind(window);
        let frameId = null;
        let cancelled = false;
        const wrappedCallback = (time) => {
            if (!cancelled) {
                callback(time);
                frameId = raf(wrappedCallback);
            }
        };
        frameId = raf(wrappedCallback);
        const id = `raf_${Date.now()}_${Math.random()}`;
        const dispose = () => {
            cancelled = true;
            if (frameId !== null) {
                caf(frameId);
            }
        };
        this.register(id, ResourceType.ANIMATION_FRAME, { frameId, callback }, dispose);
        // Return cancel function
        return () => {
            this.unregister(id);
        };
    }
    /**
     * Unregister and dispose a resource
     */
    unregister(id) {
        const resource = this.resources.get(id);
        if (!resource)
            return;
        // Call dispose if provided
        if (resource.dispose) {
            try {
                resource.dispose();
            }
            catch (error) {
                console.error(`Error disposing resource ${id}:`, error);
            }
        }
        // Remove from type index
        const typeResources = this.typeIndex.get(resource.type);
        if (typeResources) {
            typeResources.delete(id);
        }
        // Remove from resources
        this.resources.delete(id);
    }
    /**
     * Get a resource by ID
     */
    get(id) {
        const resource = this.resources.get(id);
        return resource === null || resource === void 0 ? void 0 : resource.resource;
    }
    /**
     * Get all resources of a specific type
     */
    getByType(type) {
        const ids = this.typeIndex.get(type);
        if (!ids)
            return [];
        return Array.from(ids)
            .map(id => { var _a; return (_a = this.resources.get(id)) === null || _a === void 0 ? void 0 : _a.resource; })
            .filter(Boolean);
    }
    /**
     * Get resource count by type
     */
    getCountByType(type) {
        var _a;
        return ((_a = this.typeIndex.get(type)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    }
    /**
     * Get total resource count
     */
    getTotalCount() {
        return this.resources.size;
    }
    /**
     * Get resource statistics
     */
    getStats() {
        const stats = {};
        this.typeIndex.forEach((ids, type) => {
            stats[type] = ids.size;
        });
        return stats;
    }
    /**
     * Dispose all resources of a specific type
     */
    disposeByType(type) {
        const ids = this.typeIndex.get(type);
        if (!ids)
            return;
        // Create a copy to avoid modification during iteration
        const idsToDispose = Array.from(ids);
        idsToDispose.forEach(id => this.unregister(id));
    }
    /**
     * Dispose all resources
     */
    dispose() {
        if (this.disposed)
            return;
        // Dispose in reverse order of typical creation
        const disposeOrder = [
            ResourceType.ANIMATION_FRAME,
            ResourceType.EVENT_LISTENER,
            ResourceType.PIXI_TEXT,
            ResourceType.PIXI_GRAPHICS,
            ResourceType.MATTER_BODY,
            ResourceType.RIVE_ANIMATION,
            ResourceType.RIVE_ARTBOARD,
            ResourceType.RIVE_FILE,
            ResourceType.PIXI_APPLICATION,
            ResourceType.MATTER_ENGINE,
            ResourceType.WEBGL_CONTEXT,
            ResourceType.CANVAS,
            ResourceType.GENERIC
        ];
        disposeOrder.forEach(type => this.disposeByType(type));
        // Clear all remaining resources
        this.resources.clear();
        this.typeIndex.clear();
        this.disposed = true;
    }
    /**
     * Check if the manager has been disposed
     */
    isDisposed() {
        return this.disposed;
    }
}
