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
export declare class DependencyContainer {
    private services;
    private resolving;
    /**
     * Register a singleton service
     */
    registerSingleton<T>(token: string | symbol, factory: Factory<T> | Constructor<T>): void;
    /**
     * Register a transient service (new instance each time)
     */
    registerTransient<T>(token: string | symbol, factory: Factory<T> | Constructor<T>): void;
    /**
     * Register a service
     */
    private register;
    /**
     * Resolve a service
     */
    resolve<T>(token: string | symbol): T;
    /**
     * Check if a service is registered
     */
    has(token: string | symbol): boolean;
    /**
     * Clear a specific service instance (for testing)
     */
    clearInstance(token: string | symbol): void;
    /**
     * Clear all service instances
     */
    clearAllInstances(): void;
    /**
     * Dispose all singleton instances that implement Disposable
     */
    dispose(): Promise<void>;
    /**
     * Create a child container with inherited services
     */
    createChild(): DependencyContainer;
    /**
     * Resolve constructor arguments (basic implementation)
     */
    private resolveConstructorArgs;
}
export declare const ServiceTokens: {
    readonly ResourceManager: symbol;
    readonly EventManager: symbol;
    readonly RenderOptimizer: symbol;
    readonly RiveController: symbol;
    readonly PixiController: symbol;
    readonly PhysicsController: symbol;
    readonly CanvasEngine: symbol;
};
export type ServiceType<T extends keyof typeof ServiceTokens> = T extends 'ResourceManager' ? import('./ResourceManager').ResourceManager : T extends 'EventManager' ? import('./EventManager').EventManager : T extends 'RenderOptimizer' ? import('./RenderOptimizer').RenderOptimizer : T extends 'RiveController' ? import('../controllers/RiveController').RiveController : T extends 'PixiController' ? import('../controllers/PixiController').PixiController : T extends 'PhysicsController' ? import('../controllers/PhysicsController').PhysicsController : T extends 'CanvasEngine' ? import('../useCanvasEngine').CanvasEngine : never;
