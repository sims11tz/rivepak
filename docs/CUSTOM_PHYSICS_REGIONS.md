# Custom Physics Regions - Feature Request

## Overview

This document describes a proposed feature for RivePak's PhysicsController: the ability to create **custom bounded physics regions** within the canvas, rather than only supporting full-canvas boundary walls.

## Use Case: Aquarium Tank

The CookiesForFish aquarium dashboard had fish swimming inside a tank that was smaller than the full canvas. The tank walls were positioned at specific coordinates within the artboard, not at the canvas edges.

**The problem:** RivePak's current `EnableWalls()` creates walls at the canvas boundaries, but the fish needed to bounce off walls that were _inside_ the canvas at custom positions.

**Previous solution:** The dashboard controller manually created Matter.js walls at specific coordinates, which required:
- Complex coordinate transforms between artboard space and canvas space
- Manual wall body creation and management
- Custom collision detection logic
- ~400+ lines of coordinate transform and physics wall code

## Current API

```typescript
// Current PhysicsController API - walls at canvas edges only
PhysicsController.get().EnableWalls();   // Creates walls at canvas boundaries
PhysicsController.get().DisableWalls();  // Removes canvas boundary walls
PhysicsController.get().wallsEnabled;    // Check if walls are enabled
```

## Proposed API

```typescript
interface BoundedRegion {
	id: string;
	x: number;      // Center X in canvas coords (0,0 = center)
	y: number;      // Center Y in canvas coords
	width: number;  // Region width
	height: number; // Region height
	walls: Matter.Body[];  // The 4 wall bodies
}

// New methods on PhysicsController
class PhysicsController {
	/**
	 * Create a bounded physics region at a specific position
	 * Objects inside this region will bounce off its walls
	 * @param id Unique identifier for this region
	 * @param x Center X position (canvas coords, 0 = center)
	 * @param y Center Y position (canvas coords, 0 = center)
	 * @param width Region width
	 * @param height Region height
	 * @returns The created BoundedRegion
	 */
	CreateBoundedRegion(id: string, x: number, y: number, width: number, height: number): BoundedRegion;

	/**
	 * Update an existing region's position and/or size
	 * Useful for animations or view changes
	 */
	UpdateRegion(id: string, x?: number, y?: number, width?: number, height?: number): void;

	/**
	 * Remove a bounded region and its walls
	 */
	RemoveRegion(id: string): void;

	/**
	 * Get a region by ID
	 */
	GetRegion(id: string): BoundedRegion | null;

	/**
	 * Get all active bounded regions
	 */
	GetAllRegions(): BoundedRegion[];
}
```

## Example Usage

```typescript
// Create an aquarium tank region
const tankRegion = PhysicsController.get().CreateBoundedRegion(
	'aquarium-tank',
	0,     // centered horizontally
	50,    // slightly below center
	600,   // 600px wide
	400    // 400px tall
);

// Later, resize the tank (e.g., zoom animation)
PhysicsController.get().UpdateRegion('aquarium-tank', 0, 0, 800, 600);

// Clean up when done
PhysicsController.get().RemoveRegion('aquarium-tank');
```

## Implementation Notes

### Wall Creation
Each region creates 4 Matter.js static rectangle bodies:
- Top wall: `(x, y - height/2)`
- Bottom wall: `(x, y + height/2)`
- Left wall: `(x - width/2, y)`
- Right wall: `(x + width/2, y)`

### Coordinate System
Uses canvas-centered coordinates (0,0 = center of canvas) to match how RiveAnimationObjects position themselves. This avoids the complex artboard-to-canvas transforms that plagued the original implementation.

### Wall Properties
Should use the same wall options as canvas boundary walls:
```typescript
{
	isStatic: true,
	restitution: 1,      // Bouncy
	friction: 0,
	frictionStatic: 0,
	frictionAir: 0,
	wallThickness: 0.035 // As percentage of region size
}
```

### Tagging
Walls should be tagged with both `isWall: true` and `regionId: string` so they can be identified and managed separately from canvas boundary walls.

## Historical Reference: AQUARIUM_VIEW System

The original CookiesForFish controller had a complex view scaling system that was removed during simplification. Here's what it did for reference:

### View Types
```typescript
enum AQUARIUM_VIEW {
	ON_TABLE = 'on_table',    // Full dashboard with table
	ZOOMED_IN = 'zoomed_in',  // Close-up of tank
	MINI = 'mini'             // Miniaturized view
}
```

### Coordinate Transform Functions
```typescript
// Convert artboard coords (1920x1080) to canvas-centered coords
function tankLocalToCanvasX(localX: number): number {
	const settings = VIEW_SETTINGS[currentView];
	return (localX - ARTBOARD_CENTER_X) * settings.scale + settings.xOffset;
}

function tankLocalToCanvasY(localY: number): number {
	const settings = VIEW_SETTINGS[currentView];
	return (localY - ARTBOARD_CENTER_Y) * settings.scale + settings.yOffset;
}
```

### Tank Bounds (in artboard space)
```typescript
const TANK_BOUNDS = {
	LEFT: 570,
	RIGHT: 1350,
	TOP: 185,
	BOTTOM: 1095
};
```

### Custom Wall Creation (removed code pattern)
```typescript
// This pattern was used to create walls at tank boundaries
const wallOptions = { isStatic: true, restitution: 1, friction: 0 };
const walls = [
	// Top wall
	Matter.Bodies.rectangle(
		(TANK_BOUNDS.LEFT + TANK_BOUNDS.RIGHT) / 2,  // center X
		TANK_BOUNDS.TOP,                              // Y position
		TANK_BOUNDS.RIGHT - TANK_BOUNDS.LEFT,        // width
		wallThickness,
		wallOptions
	),
	// ... similar for other walls
];
Matter.World.add(engine.world, walls);
```

## Benefits of Proposed Feature

1. **Simpler consumer code** - No manual Matter.js wall management
2. **Consistent coordinate system** - Uses canvas coords like everything else
3. **Dynamic regions** - Easy to animate/resize regions
4. **Multiple regions** - Support for multiple bounded areas (e.g., multiple tanks)
5. **Proper cleanup** - Managed lifecycle prevents memory leaks

## Priority

**Medium** - The workaround (using canvas boundary walls and adjusting object spawn positions) works for simple cases. This feature becomes important when:
- You need physics regions that don't match canvas boundaries
- You need multiple independent physics regions
- You need animated/dynamic region boundaries
