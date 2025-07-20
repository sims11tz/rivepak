import { ResourceManager, ResourceType } from './ResourceManager';

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

export class EventManager {
	private eventHandlers = new Map<string, Set<EventHandler>>();
	private resourceManager: ResourceManager;
	private domListeners = new WeakMap<EventTarget, Map<string, Set<EventListener>>>();

	constructor(resourceManager: ResourceManager) {
		this.resourceManager = resourceManager;
	}

	/**
	 * Subscribe to a custom event
	 */
	on<T = any>(event: string, handler: EventHandler<T>): UnsubscribeFn {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, new Set());
		}

		const handlers = this.eventHandlers.get(event)!;
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
	once<T = any>(event: string, handler: EventHandler<T>): UnsubscribeFn {
		const wrappedHandler: EventHandler<T> = (data) => {
			handler(data);
			unsubscribe();
		};

		const unsubscribe = this.on(event, wrappedHandler);
		return unsubscribe;
	}

	/**
	 * Emit a custom event
	 */
	emit<T = any>(event: string, data?: T): void {
		const handlers = this.eventHandlers.get(event);
		if (!handlers) return;

		// Create a copy to avoid issues if handlers modify the set
		const handlersCopy = Array.from(handlers);
		handlersCopy.forEach(handler => {
			try {
				handler(data);
			} catch (error) {
				console.error(`Error in event handler for ${event}:`, error);
			}
		});
	}

	/**
	 * Remove all handlers for a specific event
	 */
	off(event: string): void {
		this.eventHandlers.delete(event);
	}

	/**
	 * Add a DOM event listener with automatic cleanup
	 */
	addDOMListener(
		target: EventTarget,
		event: string,
		handler: EventListener,
		options?: AddEventListenerOptions
	): UnsubscribeFn {
		// Track the listener for this target
		if (!this.domListeners.has(target)) {
			this.domListeners.set(target, new Map());
		}

		const targetListeners = this.domListeners.get(target)!;
		if (!targetListeners.has(event)) {
			targetListeners.set(event, new Set());
		}

		targetListeners.get(event)!.add(handler);

		// Register with ResourceManager for automatic cleanup
		return this.resourceManager.registerEventListener(target, event, handler, options);
	}

	/**
	 * Remove all DOM listeners for a specific target
	 */
	removeAllDOMListeners(target: EventTarget): void {
		const targetListeners = this.domListeners.get(target);
		if (!targetListeners) return;

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
	createScope(): ScopedEventManager {
		return new ScopedEventManager(this, this.resourceManager);
	}

	/**
	 * Clear all event handlers
	 */
	clear(): void {
		this.eventHandlers.clear();
		// DOM listeners are managed by ResourceManager
	}

	/**
	 * Get the number of registered event types
	 */
	getEventCount(): number {
		return this.eventHandlers.size;
	}

	/**
	 * Get the number of handlers for a specific event
	 */
	getHandlerCount(event: string): number {
		return this.eventHandlers.get(event)?.size || 0;
	}
}

/**
 * ScopedEventManager - Automatically cleans up all events when disposed
 * Useful for component-level event management
 */
export class ScopedEventManager {
	private unsubscribers: UnsubscribeFn[] = [];
	private eventManager: EventManager;
	private resourceManager: ResourceManager;
	private disposed = false;

	constructor(eventManager: EventManager, resourceManager: ResourceManager) {
		this.eventManager = eventManager;
		this.resourceManager = resourceManager;
	}

	on<T = any>(event: string, handler: EventHandler<T>): void {
		if (this.disposed) {
			throw new Error('ScopedEventManager has been disposed');
		}

		const unsubscribe = this.eventManager.on(event, handler);
		this.unsubscribers.push(unsubscribe);
	}

	once<T = any>(event: string, handler: EventHandler<T>): void {
		if (this.disposed) {
			throw new Error('ScopedEventManager has been disposed');
		}

		const unsubscribe = this.eventManager.once(event, handler);
		this.unsubscribers.push(unsubscribe);
	}

	emit<T = any>(event: string, data?: T): void {
		if (this.disposed) {
			throw new Error('ScopedEventManager has been disposed');
		}

		this.eventManager.emit(event, data);
	}

	addDOMListener(
		target: EventTarget,
		event: string,
		handler: EventListener,
		options?: AddEventListenerOptions
	): void {
		if (this.disposed) {
			throw new Error('ScopedEventManager has been disposed');
		}

		const unsubscribe = this.eventManager.addDOMListener(target, event, handler, options);
		this.unsubscribers.push(unsubscribe);
	}

	dispose(): void {
		if (this.disposed) return;

		// Unsubscribe all events
		this.unsubscribers.forEach(unsubscribe => {
			try {
				unsubscribe();
			} catch (error) {
				console.error('Error during event cleanup:', error);
			}
		});

		this.unsubscribers = [];
		this.disposed = true;
	}
}
