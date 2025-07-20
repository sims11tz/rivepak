/**
 * RivePak - A powerful canvas engine framework combining Rive, Pixi.js, and Matter.js
 *
 * @packageDocumentation
 */
import { type RivePakHookOptions as _RivePakHookOptions } from './react/useRivePak';
import { CanvasSettingsDef as _CanvasSettingsDef } from './useCanvasEngine';
export { ResourceManager, ResourceType } from './core/ResourceManager';
export { EventManager, ScopedEventManager } from './core/EventManager';
export { LRUCache } from './core/LRUCache';
export { RenderOptimizer, SpatialIndex } from './core/RenderOptimizer';
export { DependencyContainer, ServiceTokens } from './core/DependencyContainer';
export { useRivePak, type RivePakHookOptions, type RivePakHookResult } from './react/useRivePak';
export { ErrorBoundary, useErrorHandler, withErrorBoundary } from './react/ErrorBoundary';
export { CanvasEngine, CANVAS_ENGINE_RUN_STATE, CanvasSettingsDef, ResizeCanvasObj } from './useCanvasEngine';
export { UseCanvasEngineHook } from './useCanvasEngine';
export { CanvasObj } from './canvasObjects/CanvasObj';
export { CanvasRiveObj } from './canvasObjects/CanvasRiveObj';
export { CanvasPixiShapeObj } from './canvasObjects/CanvasPixiShapeObj';
export { RiveAnimationObject } from './canvasObjects/RiveAnimationObj';
export { RivePhysicsObject } from './canvasObjects/RivePhysicsObj';
export { PixiShapePhysicsObj } from './canvasObjects/PixiGraphicsPhysicsObj';
export { PixiGraphicsObject } from './canvasObjects/PixiGraphicsObj';
export { RiveController, RiveObjectsSet, RIVE_OBJECT_TYPE } from './controllers/RiveController';
export { PixiController, PIXI_OBJECT_TYPE } from './controllers/PixiController';
export { PhysicsController } from './controllers/PhysicsController';
export type { CanvasObjectDef, CanvasObjectEntity } from './canvasObjects/CanvasObj';
export type { RiveObjectDef } from './controllers/RiveController';
export type { PixiObjectDef } from './controllers/PixiController';
export type { RivePakBody, PhysicsConfig, CollisionEventData } from './types/physics.types';
export { CanvasEngineResizePubSub, CanvasEngineStartResizePubSub } from './CanvasEngineEventBus';
export type { Artboard, File as RiveFile, LinearAnimationInstance, StateMachineInstance, SMIInput, Renderer as RiveRenderer } from '@rive-app/webgl-advanced';
export type { Application as PixiApplication, Graphics as PixiGraphics, Text as PixiText, Container as PixiContainer } from 'pixi.js';
export type { Engine as MatterEngine, Body as MatterBody, World as MatterWorld, Vector as MatterVector } from 'matter-js';
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
export declare function createRivePak(defaultSettings?: Partial<_CanvasSettingsDef>): {
    useHook: (options?: _RivePakHookOptions) => import("./react/useRivePak").RivePakHookResult;
};
export default createRivePak;
