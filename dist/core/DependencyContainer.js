/**
 * DependencyContainer - Simple dependency injection container
 * Replaces singleton pattern with proper lifecycle management
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class DependencyContainer {
    constructor() {
        this.services = new Map();
        this.resolving = new Set();
    }
    /**
     * Register a singleton service
     */
    registerSingleton(token, factory) {
        this.register(token, factory, true);
    }
    /**
     * Register a transient service (new instance each time)
     */
    registerTransient(token, factory) {
        this.register(token, factory, false);
    }
    /**
     * Register a service
     */
    register(token, factory, singleton) {
        let factoryFn;
        if (typeof factory === 'function' && factory.prototype) {
            // Constructor function
            factoryFn = (container) => new factory(...this.resolveConstructorArgs(factory, container));
        }
        else {
            // Factory function
            factoryFn = factory;
        }
        this.services.set(token, {
            factory: factoryFn,
            singleton
        });
    }
    /**
     * Resolve a service
     */
    resolve(token) {
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
        }
        finally {
            this.resolving.delete(token);
        }
    }
    /**
     * Check if a service is registered
     */
    has(token) {
        return this.services.has(token);
    }
    /**
     * Clear a specific service instance (for testing)
     */
    clearInstance(token) {
        const descriptor = this.services.get(token);
        if (descriptor) {
            delete descriptor.instance;
        }
    }
    /**
     * Clear all service instances
     */
    clearAllInstances() {
        this.services.forEach(descriptor => {
            delete descriptor.instance;
        });
    }
    /**
     * Dispose all singleton instances that implement Disposable
     */
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            this.services.forEach(descriptor => {
                if (descriptor.singleton && descriptor.instance) {
                    const instance = descriptor.instance;
                    if (typeof instance.dispose === 'function') {
                        disposables.push(Promise.resolve(instance.dispose()).catch(err => {
                            console.error('Error disposing service:', err);
                        }));
                    }
                }
            });
            yield Promise.all(disposables);
            this.clearAllInstances();
        });
    }
    /**
     * Create a child container with inherited services
     */
    createChild() {
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
    resolveConstructorArgs(constructor, container) {
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
};
