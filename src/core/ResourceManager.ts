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

export enum ResourceType {
	CANVAS = 'canvas',
	WEBGL_CONTEXT = 'webgl_context',
	EVENT_LISTENER = 'event_listener',
	ANIMATION_FRAME = 'animation_frame',
	RIVE_FILE = 'rive_file',
	RIVE_ARTBOARD = 'rive_artboard',
	RIVE_ANIMATION = 'rive_animation',
	PIXI_APPLICATION = 'pixi_application',
	PIXI_GRAPHICS = 'pixi_graphics',
	PIXI_TEXT = 'pixi_text',
	MATTER_BODY = 'matter_body',
	MATTER_ENGINE = 'matter_engine',
	GENERIC = 'generic'
}

export class ResourceManager implements Disposable {
	private resources = new Map<string, Resource>();
	private typeIndex = new Map<ResourceType, Set<string>>();
	private disposed = false;
	private readonly maxResourcesPerType = new Map<ResourceType, number>([
		[ResourceType.RIVE_FILE, 50],
		[ResourceType.RIVE_ARTBOARD, 100],
		[ResourceType.PIXI_GRAPHICS, 500],
		[ResourceType.MATTER_BODY, 1000]
	]);

	constructor() {
		// Initialize type index
		Object.values(ResourceType).forEach(type => {
			this.typeIndex.set(type as ResourceType, new Set());
		});
	}

	/**
	 * Register a resource for tracking
	 */
	register<T>(
		id: string,
		type: ResourceType,
		resource: T,
		dispose?: () => void
	): T {
		if (this.disposed) {
			throw new Error('ResourceManager has been disposed');
		}

		// Check resource limits
		const typeResources = this.typeIndex.get(type)!;
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
	registerEventListener(
		target: EventTarget,
		event: string,
		handler: EventListener,
		options?: AddEventListenerOptions
	): () => void {
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
	registerAnimationFrame(
		callback: FrameRequestCallback,
		customRAF?: (callback: FrameRequestCallback) => number,
		customCAF?: (id: number) => void
	): () => void {
		const raf = customRAF || window.requestAnimationFrame.bind(window);
		const caf = customCAF || window.cancelAnimationFrame.bind(window);

		let frameId: number | null = null;
		let cancelled = false;

		const wrappedCallback: FrameRequestCallback = (time) => {
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
	unregister(id: string): void {
		const resource = this.resources.get(id);
		if (!resource) return;

		// Call dispose if provided
		if (resource.dispose) {
			try {
				resource.dispose();
			} catch (error) {
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
	get<T>(id: string): T | undefined {
		const resource = this.resources.get(id);
		return resource?.resource as T;
	}

	/**
	 * Get all resources of a specific type
	 */
	getByType<T>(type: ResourceType): T[] {
		const ids = this.typeIndex.get(type);
		if (!ids) return [];

		return Array.from(ids)
			.map(id => this.resources.get(id)?.resource as T)
			.filter(Boolean);
	}

	/**
	 * Get resource count by type
	 */
	getCountByType(type: ResourceType): number {
		return this.typeIndex.get(type)?.size || 0;
	}

	/**
	 * Get total resource count
	 */
	getTotalCount(): number {
		return this.resources.size;
	}

	/**
	 * Get resource statistics
	 */
	getStats(): Record<ResourceType, number> {
		const stats: Partial<Record<ResourceType, number>> = {};

		this.typeIndex.forEach((ids, type) => {
			stats[type] = ids.size;
		});

		return stats as Record<ResourceType, number>;
	}

	/**
	 * Dispose all resources of a specific type
	 */
	disposeByType(type: ResourceType): void {
		const ids = this.typeIndex.get(type);
		if (!ids) return;

		// Create a copy to avoid modification during iteration
		const idsToDispose = Array.from(ids);
		idsToDispose.forEach(id => this.unregister(id));
	}

	/**
	 * Dispose all resources
	 */
	dispose(): void {
		if (this.disposed) return;

		// Dispose in reverse order of typical creation
		const disposeOrder: ResourceType[] = [
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
	isDisposed(): boolean {
		return this.disposed;
	}
}
