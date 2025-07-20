import Matter from 'matter-js';
import { CanvasObj } from '../canvasObjects/CanvasObj';

/**
 * Type-safe physics type definitions
 * Eliminates the need for 'any' type assertions in physics code
 */

// Extend Matter.Body to include custom properties
export interface RivePakBody extends Matter.Body {
	plugin: {
		rivepak: {
			object: CanvasObj | null;
			isWall?: boolean;
			metadata?: Record<string, any>;
		};
	};
}

// Type guard to check if a body is a RivePakBody
export function isRivePakBody(body: Matter.Body): body is RivePakBody {
	return body &&
		   typeof body === 'object' &&
		   'plugin' in body &&
		   body.plugin &&
		   typeof body.plugin === 'object' &&
		   'rivepak' in body.plugin;
}

// Type guard to check if a body is a wall
export function isWallBody(body: Matter.Body): boolean {
	return isRivePakBody(body) && body.plugin.rivepak.isWall === true;
}

// Get the canvas object from a physics body
export function getCanvasObject(body: Matter.Body): CanvasObj | null {
	if (isRivePakBody(body)) {
		return body.plugin.rivepak.object;
	}
	return null;
}

// Physics configuration
export interface PhysicsConfig {
	enabled: boolean;
	walls: boolean;
	gravity: { x: number; y: number };
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

// Default wall options
export const DEFAULT_WALL_OPTIONS: WallOptions = {
	isStatic: true,
	restitution: 1,
	friction: 0,
	frictionStatic: 0,
	frictionAir: 0,
	wallThickness: 0.035
};

// Physics body options for RivePak objects
export interface RivePakBodyOptions extends Matter.IBodyDefinition {
	rivepakObject?: CanvasObj;
	isWall?: boolean;
}

// Helper to create a RivePak body
export function createRivePakBody(
	x: number,
	y: number,
	width: number,
	height: number,
	options: RivePakBodyOptions = {}
): RivePakBody {
	const { rivepakObject, isWall, ...matterOptions } = options;

	const body = Matter.Bodies.rectangle(x, y, width, height, {
		...matterOptions,
		plugin: {
			rivepak: {
				object: rivepakObject || null,
				isWall: isWall || false
			}
		}
	}) as RivePakBody;

	return body;
}

// Collision event data
export interface CollisionEventData {
	bodyA: RivePakBody;
	bodyB: RivePakBody;
	objectA: CanvasObj | null;
	objectB: CanvasObj | null;
	impactForce: number;
	collision: Matter.Collision;
}

// Extract collision data from Matter.js event
export function extractCollisionData(pair: Matter.Pair): CollisionEventData | null {
	const bodyA = pair.bodyA as RivePakBody;
	const bodyB = pair.bodyB as RivePakBody;

	if (!isRivePakBody(bodyA) || !isRivePakBody(bodyB)) {
		return null;
	}

	const objectA = getCanvasObject(bodyA);
	const objectB = getCanvasObject(bodyB);

	// Skip if either is a wall (unless we want wall collisions)
	if (isWallBody(bodyA) || isWallBody(bodyB)) {
		return null;
	}

	const impactForce = Matter.Vector.magnitude(pair.collision.penetration);

	return {
		bodyA,
		bodyB,
		objectA,
		objectB,
		impactForce,
		collision: pair.collision
	};
}
