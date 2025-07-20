import { ResourceManager } from './ResourceManager';
/**
 * EventManager - Centralized event handling with automatic cleanup
 * Prevents memory leaks from orphaned event listeners
 */
export type EventHandler<T = any> = (data: T) => void;
export type UnsubscribeFn = () => void;
export interface EventSubscription {
    event: string;
    handler: EventHandler;
    once?: boolean;
}
export declare class EventManager {
    private eventHandlers;
    private resourceManager;
    private domListeners;
    constructor(resourceManager: ResourceManager);
    /**
     * Subscribe to a custom event
     */
    on<T = any>(event: string, handler: EventHandler<T>): UnsubscribeFn;
    /**
     * Subscribe to an event that fires only once
     */
    once<T = any>(event: string, handler: EventHandler<T>): UnsubscribeFn;
    /**
     * Emit a custom event
     */
    emit<T = any>(event: string, data?: T): void;
    /**
     * Remove all handlers for a specific event
     */
    off(event: string): void;
    /**
     * Add a DOM event listener with automatic cleanup
     */
    addDOMListener(target: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions): UnsubscribeFn;
    /**
     * Remove all DOM listeners for a specific target
     */
    removeAllDOMListeners(target: EventTarget): void;
    /**
     * Create a scoped event manager for a specific component/context
     */
    createScope(): ScopedEventManager;
    /**
     * Clear all event handlers
     */
    clear(): void;
    /**
     * Get the number of registered event types
     */
    getEventCount(): number;
    /**
     * Get the number of handlers for a specific event
     */
    getHandlerCount(event: string): number;
}
/**
 * ScopedEventManager - Automatically cleans up all events when disposed
 * Useful for component-level event management
 */
export declare class ScopedEventManager {
    private unsubscribers;
    private eventManager;
    private resourceManager;
    private disposed;
    constructor(eventManager: EventManager, resourceManager: ResourceManager);
    on<T = any>(event: string, handler: EventHandler<T>): void;
    once<T = any>(event: string, handler: EventHandler<T>): void;
    emit<T = any>(event: string, data?: T): void;
    addDOMListener(target: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions): void;
    dispose(): void;
}
