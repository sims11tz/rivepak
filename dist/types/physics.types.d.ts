import Matter from 'matter-js';
import { CanvasObj } from '../canvasObjects/CanvasObj';
/**
 * Type-safe physics type definitions
 * Eliminates the need for 'any' type assertions in physics code
 */
export interface RivePakBody extends Matter.Body {
    plugin: {
        rivepak: {
            object: CanvasObj | null;
            isWall?: boolean;
            metadata?: Record<string, any>;
        };
    };
}
export declare function isRivePakBody(body: Matter.Body): body is RivePakBody;
export declare function isWallBody(body: Matter.Body): boolean;
export declare function getCanvasObject(body: Matter.Body): CanvasObj | null;
export interface PhysicsConfig {
    enabled: boolean;
    walls: boolean;
    gravity: {
        x: number;
        y: number;
    };
    debug: boolean;
    wallOptions?: WallOptions;
}
export interface WallOptions {
    isStatic: boolean;
    restitution: number;
    friction: number;
    frictionStatic: number;
    frictionAir: number;
    wallThickness: number;
}
export declare const DEFAULT_WALL_OPTIONS: WallOptions;
export interface RivePakBodyOptions extends Matter.IBodyDefinition {
    rivepakObject?: CanvasObj;
    isWall?: boolean;
}
export declare function createRivePakBody(x: number, y: number, width: number, height: number, options?: RivePakBodyOptions): RivePakBody;
export interface CollisionEventData {
    bodyA: RivePakBody;
    bodyB: RivePakBody;
    objectA: CanvasObj | null;
    objectB: CanvasObj | null;
    impactForce: number;
    collision: Matter.Collision;
}
export declare function extractCollisionData(pair: Matter.Pair): CollisionEventData | null;
