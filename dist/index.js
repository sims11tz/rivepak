/**
 * RivePak - A powerful canvas engine framework combining Rive, Pixi.js, and Matter.js
 *
 * @packageDocumentation
 */
// Import types we need for the createRivePak function
import { useRivePak as _useRivePak } from './react/useRivePak';
// Core exports
export { ResourceManager, ResourceType } from './core/ResourceManager';
export { EventManager, ScopedEventManager } from './core/EventManager';
export { LRUCache } from './core/LRUCache';
export { RenderOptimizer, SpatialIndex } from './core/RenderOptimizer';
export { DependencyContainer, ServiceTokens } from './core/DependencyContainer';
// React exports
export { useRivePak } from './react/useRivePak';
export { ErrorBoundary, useErrorHandler, withErrorBoundary } from './react/ErrorBoundary';
// Canvas engine exports
export { CanvasEngine, CANVAS_ENGINE_RUN_STATE, CanvasSettingsDef, ResizeCanvasObj } from './useCanvasEngine';
export { UseCanvasEngineHook } from './useCanvasEngine'; // Legacy hook for backwards compatibility
// Canvas objects
export { CanvasObj } from './canvasObjects/CanvasObj';
export { CanvasRiveObj } from './canvasObjects/CanvasRiveObj';
export { CanvasPixiShapeObj } from './canvasObjects/CanvasPixiShapeObj';
export { RiveAnimationObject } from './canvasObjects/RiveAnimationObj';
export { RivePhysicsObject } from './canvasObjects/RivePhysicsObj';
export { PixiShapePhysicsObj } from './canvasObjects/PixiGraphicsPhysicsObj';
export { PixiGraphicsObject } from './canvasObjects/PixiGraphicsObj';
// Controllers
export { RiveController, RiveObjectsSet, RIVE_OBJECT_TYPE } from './controllers/RiveController';
export { PixiController, PIXI_OBJECT_TYPE } from './controllers/PixiController';
export { PhysicsController } from './controllers/PhysicsController';
// Event bus
export { CanvasEngineResizePubSub, CanvasEngineStartResizePubSub } from './CanvasEngineEventBus';
/**
 * Main entry point for creating a RivePak instance
 *
 * @example
 * ```tsx
 * import { createRivePak } from '@sims11tz/rivepak';
 *
 * const rivepak = createRivePak({
 *   width: 800,
 *   height: 600,
 *   physicsEnabled: true,
 *   debugMode: false
 * });
 *
 * // In your React component
 * function MyCanvas() {
 *   const { RivePakCanvas, addCanvasObjects } = rivepak.useHook({
 *     onInit: async (engine) => {
 *       // Initialize your scene
 *     }
 *   });
 *
 *   return <RivePakCanvas />;
 * }
 * ```
 */
export function createRivePak(defaultSettings) {
    return {
        useHook: (options) => _useRivePak(Object.assign(Object.assign({}, defaultSettings), options)),
        // Add more methods as needed
    };
}
// Default export for convenience
export default createRivePak;
