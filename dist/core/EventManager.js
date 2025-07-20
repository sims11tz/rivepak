export class EventManager {
    constructor(resourceManager) {
        this.eventHandlers = new Map();
        this.domListeners = new WeakMap();
        this.resourceManager = resourceManager;
    }
    /**
     * Subscribe to a custom event
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        const handlers = this.eventHandlers.get(event);
        handlers.add(handler);
        // Return unsubscribe function
        return () => {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.eventHandlers.delete(event);
            }
        };
    }
    /**
     * Subscribe to an event that fires only once
     */
    once(event, handler) {
        const wrappedHandler = (data) => {
            handler(data);
            unsubscribe();
        };
        const unsubscribe = this.on(event, wrappedHandler);
        return unsubscribe;
    }
    /**
     * Emit a custom event
     */
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (!handlers)
            return;
        // Create a copy to avoid issues if handlers modify the set
        const handlersCopy = Array.from(handlers);
        handlersCopy.forEach(handler => {
            try {
                handler(data);
            }
            catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
    /**
     * Remove all handlers for a specific event
     */
    off(event) {
        this.eventHandlers.delete(event);
    }
    /**
     * Add a DOM event listener with automatic cleanup
     */
    addDOMListener(target, event, handler, options) {
        // Track the listener for this target
        if (!this.domListeners.has(target)) {
            this.domListeners.set(target, new Map());
        }
        const targetListeners = this.domListeners.get(target);
        if (!targetListeners.has(event)) {
            targetListeners.set(event, new Set());
        }
        targetListeners.get(event).add(handler);
        // Register with ResourceManager for automatic cleanup
        return this.resourceManager.registerEventListener(target, event, handler, options);
    }
    /**
     * Remove all DOM listeners for a specific target
     */
    removeAllDOMListeners(target) {
        const targetListeners = this.domListeners.get(target);
        if (!targetListeners)
            return;
        targetListeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                target.removeEventListener(event, handler);
            });
        });
        this.domListeners.delete(target);
    }
    /**
     * Create a scoped event manager for a specific component/context
     */
    createScope() {
        return new ScopedEventManager(this, this.resourceManager);
    }
    /**
     * Clear all event handlers
     */
    clear() {
        this.eventHandlers.clear();
        // DOM listeners are managed by ResourceManager
    }
    /**
     * Get the number of registered event types
     */
    getEventCount() {
        return this.eventHandlers.size;
    }
    /**
     * Get the number of handlers for a specific event
     */
    getHandlerCount(event) {
        var _a;
        return ((_a = this.eventHandlers.get(event)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    }
}
/**
 * ScopedEventManager - Automatically cleans up all events when disposed
 * Useful for component-level event management
 */
export class ScopedEventManager {
    constructor(eventManager, resourceManager) {
        this.unsubscribers = [];
        this.disposed = false;
        this.eventManager = eventManager;
        this.resourceManager = resourceManager;
    }
    on(event, handler) {
        if (this.disposed) {
            throw new Error('ScopedEventManager has been disposed');
        }
        const unsubscribe = this.eventManager.on(event, handler);
        this.unsubscribers.push(unsubscribe);
    }
    once(event, handler) {
        if (this.disposed) {
            throw new Error('ScopedEventManager has been disposed');
        }
        const unsubscribe = this.eventManager.once(event, handler);
        this.unsubscribers.push(unsubscribe);
    }
    emit(event, data) {
        if (this.disposed) {
            throw new Error('ScopedEventManager has been disposed');
        }
        this.eventManager.emit(event, data);
    }
    addDOMListener(target, event, handler, options) {
        if (this.disposed) {
            throw new Error('ScopedEventManager has been disposed');
        }
        const unsubscribe = this.eventManager.addDOMListener(target, event, handler, options);
        this.unsubscribers.push(unsubscribe);
    }
    dispose() {
        if (this.disposed)
            return;
        // Unsubscribe all events
        this.unsubscribers.forEach(unsubscribe => {
            try {
                unsubscribe();
            }
            catch (error) {
                console.error('Error during event cleanup:', error);
            }
        });
        this.unsubscribers = [];
        this.disposed = true;
    }
}
