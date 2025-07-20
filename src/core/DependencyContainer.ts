/**
 * DependencyContainer - Simple dependency injection container
 * Replaces singleton pattern with proper lifecycle management
 */

export type Factory<T> = (container: DependencyContainer) => T;
export type Constructor<T> = new (...args: any[]) => T;

export interface ServiceDescriptor<T> {
	factory: Factory<T>;
	singleton: boolean;
	instance?: T;
}

export class DependencyContainer {
	private services = new Map<string | symbol, ServiceDescriptor<any>>();
	private resolving = new Set<string | symbol>();

	/**
	 * Register a singleton service
	 */
	registerSingleton<T>(
		token: string | symbol,
		factory: Factory<T> | Constructor<T>
	): void {
		this.register(token, factory, true);
	}

	/**
	 * Register a transient service (new instance each time)
	 */
	registerTransient<T>(
		token: string | symbol,
		factory: Factory<T> | Constructor<T>
	): void {
		this.register(token, factory, false);
	}

	/**
	 * Register a service
	 */
	private register<T>(
		token: string | symbol,
		factory: Factory<T> | Constructor<T>,
		singleton: boolean
	): void {
		let factoryFn: Factory<T>;

		if (typeof factory === 'function' && factory.prototype) {
			// Constructor function
			factoryFn = (container) => new (factory as Constructor<T>)(...this.resolveConstructorArgs(factory as Constructor<T>, container));
		} else {
			// Factory function
			factoryFn = factory as Factory<T>;
		}

		this.services.set(token, {
			factory: factoryFn,
			singleton
		});
	}

	/**
	 * Resolve a service
	 */
	resolve<T>(token: string | symbol): T {
		const descriptor = this.services.get(token);
		if (!descriptor) {
			throw new Error(`Service not registered: ${String(token)}`);
		}

		// Check for circular dependencies
		if (this.resolving.has(token)) {
			throw new Error(`Circular dependency detected: ${String(token)}`);
		}

		// Return existing instance for singletons
		if (descriptor.singleton && descriptor.instance) {
			return descriptor.instance;
		}

		try {
			this.resolving.add(token);
			const instance = descriptor.factory(this);

			if (descriptor.singleton) {
				descriptor.instance = instance;
			}

			return instance;
		} finally {
			this.resolving.delete(token);
		}
	}

	/**
	 * Check if a service is registered
	 */
	has(token: string | symbol): boolean {
		return this.services.has(token);
	}

	/**
	 * Clear a specific service instance (for testing)
	 */
	clearInstance(token: string | symbol): void {
		const descriptor = this.services.get(token);
		if (descriptor) {
			delete descriptor.instance;
		}
	}

	/**
	 * Clear all service instances
	 */
	clearAllInstances(): void {
		this.services.forEach(descriptor => {
			delete descriptor.instance;
		});
	}

	/**
	 * Dispose all singleton instances that implement Disposable
	 */
	async dispose(): Promise<void> {
		const disposables: Promise<void>[] = [];

		this.services.forEach(descriptor => {
			if (descriptor.singleton && descriptor.instance) {
				const instance = descriptor.instance;
				if (typeof instance.dispose === 'function') {
					disposables.push(
						Promise.resolve(instance.dispose()).catch(err => {
							console.error('Error disposing service:', err);
						})
					);
				}
			}
		});

		await Promise.all(disposables);
		this.clearAllInstances();
	}

	/**
	 * Create a child container with inherited services
	 */
	createChild(): DependencyContainer {
		const child = new DependencyContainer();

		// Copy service descriptors (not instances)
		this.services.forEach((descriptor, token) => {
			child.services.set(token, {
				factory: descriptor.factory,
				singleton: descriptor.singleton
			});
		});

		return child;
	}

	/**
	 * Resolve constructor arguments (basic implementation)
	 */
	private resolveConstructorArgs<T>(
		constructor: Constructor<T>,
		container: DependencyContainer
	): any[] {
		// This is a simplified version - in production you'd use reflect-metadata
		// For now, we'll assume constructors have no parameters or handle them manually
		return [];
	}
}

// Service tokens for type-safe dependency injection
export const ServiceTokens = {
	ResourceManager: Symbol('ResourceManager'),
	EventManager: Symbol('EventManager'),
	RenderOptimizer: Symbol('RenderOptimizer'),
	RiveController: Symbol('RiveController'),
	PixiController: Symbol('PixiController'),
	PhysicsController: Symbol('PhysicsController'),
	CanvasEngine: Symbol('CanvasEngine'),
} as const;

// Helper type for extracting service type from token
export type ServiceType<T extends keyof typeof ServiceTokens> =
	T extends 'ResourceManager' ? import('./ResourceManager').ResourceManager :
	T extends 'EventManager' ? import('./EventManager').EventManager :
	T extends 'RenderOptimizer' ? import('./RenderOptimizer').RenderOptimizer :
	T extends 'RiveController' ? import('../controllers/RiveController').RiveController :
	T extends 'PixiController' ? import('../controllers/PixiController').PixiController :
	T extends 'PhysicsController' ? import('../controllers/PhysicsController').PhysicsController :
	T extends 'CanvasEngine' ? import('../useCanvasEngine').CanvasEngine :
	never;
