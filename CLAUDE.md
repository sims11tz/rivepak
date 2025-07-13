# RivePak - Canvas Engine Framework

## Overview

RivePak is a TypeScript library that integrates HTML canvas, Pixi.js, Rive, and Matter.js into a unified visual system. It provides a powerful framework for creating interactive canvas applications with vector animations (Rive), raster graphics (Pixi), and physics simulation (Matter.js).

## Architecture

### Core Technologies Integration

- **Rive**: Handles vector animations and interactive state machines
- **Pixi.js**: Provides additional graphics rendering capabilities
- **Matter.js**: Adds physics simulation (optional)
- **Canvas**: Dual-canvas system with Rive on bottom layer, Pixi on top

### Key Components

#### 1. CanvasEngine (Singleton)
The main orchestrator that manages all subsystems:
- Located in: `src/CanvasEngine.tsx`
- Manages initialization, update loops, and coordination between controllers
- Handles canvas setup and resolution scaling

#### 2. Controllers

**RiveController** (`src/controllers/RiveController.tsx`)
- Manages Rive runtime, renderer, and artboards
- Handles Rive file loading and caching
- Updates Rive animations and state machines
- Processes interactive Rive objects

**PixiController** (`src/controllers/PixiController.tsx`)
- Manages Pixi.js application and stage
- Renders on overlay canvas
- Handles Pixi object updates

**PhysicsController** (`src/controllers/PhysicsController.tsx`)
- Manages Matter.js engine
- Optional physics simulation
- Configurable walls/boundaries
- Debug visualization support

#### 3. Object System

Base class hierarchy:
```
CanvasObj (abstract)
├── CanvasRiveObj
│   ├── Basic Rive animations
│   └── Physics-enabled Rive objects (via mixin)
└── CanvasPixiShapeObj
    ├── Basic Pixi graphics
    └── Physics-enabled Pixi objects (via mixin)
```

Physics capabilities added via `CanvasPhysicsMixin` in `src/objs/CanvasPhysicsMixin.tsx`

#### 4. React Integration

**UseCanvasEngineHook** (`src/hooks/useCanvasEngine.tsx`)
Primary React hook that provides:
- Canvas component (`RivePakCanvas`)
- Object management functions
- State control methods
- Event handlers

### File Structure

```
src/
├── index.ts                    # Main exports
├── CanvasEngine.tsx           # Core engine singleton
├── controllers/               # Subsystem controllers
│   ├── PixiController.tsx
│   ├── PhysicsController.tsx
│   └── RiveController.tsx
├── objs/                      # Object classes
│   ├── CanvasObj.tsx         # Base class
│   ├── CanvasRiveObj.tsx     # Rive objects
│   ├── CanvasPixiShapeObj.tsx # Pixi objects
│   └── CanvasPhysicsMixin.tsx # Physics mixin
├── hooks/                     # React hooks
│   └── useCanvasEngine.tsx
├── types.tsx                  # TypeScript definitions
└── utils/                     # Utility functions
```

### Key Features

1. **Dual Canvas System**: Rive canvas with Pixi overlay for maximum flexibility
2. **Resolution Scaling**: Automatic handling of different screen sizes
3. **Physics Integration**: Optional Matter.js physics with debug visualization
4. **Interactive Objects**: Mouse/pointer tracking for both Rive and Pixi objects
5. **Z-index Management**: Proper depth sorting for rendering order
6. **Event System**: PubSub pattern for decoupled communication
7. **Performance Optimized**: Frame skipping logic and efficient update cycles

### Usage Example

```typescript
import { UseCanvasEngineHook } from '@sims11tz/rivpak';

function MyCanvas()
{
  const {
    RivePakCanvas,
    addCanvasObjects,
    ToggleRunState,
    // ... other methods
  } = UseCanvasEngineHook(
    {
      physicsEnabled: true,
      physicsWalls: true,
      debugMode: false,
      autoScale: true
    },
    async (engine) => {
      // Initialize your scene
      await addCanvasObjects([
        // Your canvas objects
      ]);
    }
  );

  return <RivePakCanvas />;
}
```

### Development

- **Build**: `npm run build` - Compiles TypeScript to dist/
- **Local Dev**: Uses `yalc` for local package development
- **Package**: Published to GitHub Package Registry as `@sims11tz/rivpak`

### Design Patterns

1. **Singleton Pattern**: Controllers are singletons for global access
2. **Mixin Pattern**: Physics behavior added via TypeScript mixins
3. **Observer Pattern**: PubSub for event handling
4. **Component Pattern**: Objects composed of various capabilities
5. **Factory Pattern**: Object creation abstracted through controller methods

### Performance Considerations

- Uses Rive's animation frame for unified update loop
- Frame skipping to maintain consistent timing
- Object caching for Rive files
- Efficient batch updates for physics bodies
- Resolution-aware rendering

### Future Extensibility

The architecture supports:
- Additional object types via inheritance
- New controllers for other libraries
- Custom mixins for new behaviors
- Plugin system through the controller pattern
