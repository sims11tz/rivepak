# RivePak - Canvas Engine Framework

# IMPORTANT RULES! ALWAYS FOLLOW THESE RULES! #
 - Ignore the /dist folder. This is not used and all of the code are .ts files.
 - Do not generate .js files when working on the codebase.
 - Do not consider .js files as code that will be run, only typescript is used in this codebase
 - Do not create new .js files and if you find any don't consider them and do not modify them

## Overview

RivePak is a TypeScript library that integrates HTML canvas, Pixi.js, Rive, and Matter.js into a unified visual system. It provides a powerful framework for creating interactive canvas applications with vector animations (Rive), raster graphics (Pixi), and physics simulation (Matter.js).

## Recent Major Improvements

### 1. **Memory Management & Resource Tracking**
- **ResourceManager**: Centralized resource tracking prevents memory leaks
- **LRU Cache**: Automatic eviction of old Rive files with size/TTL limits
- **Event Manager**: Automatic cleanup of event listeners
- **WeakMap Usage**: Prevents circular references

### 2. **Performance Optimizations**
- **Viewport Culling**: Only renders visible objects
- **Spatial Indexing**: Grid-based culling for thousands of objects
- **Render Optimizer**: Batching and dirty rectangle tracking
- **Frame Skipping**: Maintains consistent timing under load

### 3. **Type Safety**
- **No More 'any' Types**: Proper TypeScript interfaces throughout
- **Type Guards**: Runtime validation for critical paths
- **Physics Types**: Type-safe Matter.js integration
- **Strict Null Checks**: No more non-null assertions

### 4. **Modern Architecture**
- **Dependency Injection**: Replaced singletons with DI container
- **Error Boundaries**: React error handling with fallbacks
- **Modular Design**: Clear separation of concerns
- **Clean API Surface**: Simple, intuitive public API

## Architecture

### Core Technologies Integration

- **Rive**: Handles vector animations and interactive state machines
- **Pixi.js**: Provides additional graphics rendering capabilities
- **Matter.js**: Adds physics simulation (optional)
- **Canvas**: Dual-canvas system with Rive on bottom layer, Pixi on top

### New Core Components

#### 1. ResourceManager (`src/core/ResourceManager.ts`)
Tracks all resources (canvases, WebGL contexts, event listeners, etc.) and ensures proper cleanup:
```typescript
const resourceManager = new ResourceManager();
resourceManager.register('my_resource', ResourceType.CANVAS, canvas);
// Automatic cleanup on dispose
```

#### 2. EventManager (`src/core/EventManager.ts`)
Centralized event handling with automatic cleanup:
```typescript
const eventManager = new EventManager(resourceManager);
const unsubscribe = eventManager.addDOMListener(window, 'resize', handler);
// No memory leaks!
```

#### 3. LRUCache (`src/core/LRUCache.ts`)
Prevents unbounded memory growth:
```typescript
const cache = new LRUCache<Uint8Array>({
    maxEntries: 50,
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    ttlMs: 30 * 60 * 1000 // 30 minutes
});
```

#### 4. RenderOptimizer (`src/core/RenderOptimizer.ts`)
Viewport culling and render optimizations:
```typescript
const optimizer = new RenderOptimizer();
const visibleObjects = optimizer.cullObjects(allObjects);
// Only renders what's visible!
```

#### 5. DependencyContainer (`src/core/DependencyContainer.ts`)
Modern dependency injection:
```typescript
container.registerSingleton(ServiceTokens.ResourceManager, () => new ResourceManager());
const resourceManager = container.resolve(ServiceTokens.ResourceManager);
```

### Improved React Integration

#### useRivePak Hook (`src/react/useRivePak.tsx`)
New primary React hook with automatic cleanup:
```typescript
const {
    RivePakCanvas,
    addCanvasObjects,
    isInitialized,
    error,
    fps,
    renderStats
} = useRivePak({
    width: 800,
    height: 600,
    physicsEnabled: true,
    enableOptimizations: true,
    onInit: async (engine) => {
        // Initialize your scene
    }
});
```

#### Error Boundaries (`src/react/ErrorBoundary.tsx`)
Graceful error handling:
```typescript
<ErrorBoundary fallback={(error) => <ErrorDisplay error={error} />}>
    <RivePakCanvas />
</ErrorBoundary>
```

### Type-Safe Physics

#### Physics Types (`src/types/physics.types.ts`)
No more `any` types for physics:
```typescript
interface RivePakBody extends Matter.Body {
    plugin: {
        rivepak: {
            object: CanvasObj | null;
            isWall?: boolean;
        };
    };
}
```

### File Structure

```
src/
├── core/                      # Core infrastructure
│   ├── ResourceManager.ts     # Resource lifecycle management
│   ├── EventManager.ts        # Event handling with cleanup
│   ├── LRUCache.ts           # Memory-bounded caching
│   ├── RenderOptimizer.ts    # Viewport culling & optimization
│   └── DependencyContainer.ts # Dependency injection
├── react/                     # React integration
│   ├── useRivePak.tsx        # Main React hook
│   └── ErrorBoundary.tsx     # Error handling component
├── types/                     # TypeScript type definitions
│   └── physics.types.ts      # Type-safe physics
├── controllers/               # Subsystem controllers
│   ├── PixiController.ts
│   ├── PhysicsController.ts
│   └── RiveController.ts
├── canvasObjects/            # Object classes
│   ├── CanvasObj.ts
│   ├── CanvasRiveObj.ts
│   └── CanvasPixiShapeObj.ts
├── hooks/                    # Legacy React hooks
│   └── useCanvasEngine.tsx
└── index.ts                  # Public API exports
```

### Usage Example

```typescript
import { createRivePak } from '@sims11tz/rivepak';

// Create instance with default settings
const rivepak = createRivePak({
    width: 1024,
    height: 768,
    physicsEnabled: true,
    debugMode: false
});

// In your React component
function MyCanvas() {
    const {
        RivePakCanvas,
        addCanvasObjects,
        isInitialized,
        error,
        fps,
        renderStats
    } = rivepak.useHook({
        enableOptimizations: true,
        onInit: async (engine) => {
            // Create your objects
            const objects = await createMyObjects();
            await addCanvasObjects(objects);
        },
        onError: (error) => {
            console.error('Canvas error:', error);
        }
    });

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <RivePakCanvas />
            {isInitialized && (
                <div>
                    FPS: {fps} | 
                    Objects: {renderStats.visibleObjects}/{renderStats.totalObjects}
                </div>
            )}
        </div>
    );
}
```

### Key Features

1. **Automatic Resource Management**: All resources tracked and cleaned up automatically
2. **Memory Leak Prevention**: Event listeners, animation frames, and resources properly disposed
3. **Performance Optimized**: Viewport culling, spatial indexing, and render batching
4. **Type Safe**: Full TypeScript support with no `any` types
5. **Error Resilient**: Error boundaries and comprehensive error handling
6. **Modern API**: Clean, intuitive API with React hooks
7. **Dependency Injection**: Testable architecture with DI container
8. **Production Ready**: Built for large-scale applications

### Performance Considerations

- **Viewport Culling**: Automatically skips rendering of off-screen objects
- **Spatial Indexing**: Efficient culling for thousands of objects
- **Resource Limits**: Automatic cache eviction prevents memory bloat
- **Frame Skipping**: Maintains consistent timing under heavy load
- **Batch Operations**: Reduces draw calls for better performance

### Best Practices

1. **Always use the new hooks**: `useRivePak` instead of `UseCanvasEngineHook`
2. **Enable optimizations**: Set `enableOptimizations: true` for production
3. **Handle errors**: Provide `onError` callbacks
4. **Monitor performance**: Use `renderStats` to track performance
5. **Dispose properly**: The hook handles cleanup automatically

### Migration from Old API

```typescript
// Old way
const { RivePakCanvas } = UseCanvasEngineHook(settings, onInit);

// New way
const { RivePakCanvas } = useRivePak({
    ...settings,
    onInit,
    enableOptimizations: true,
    enableErrorBoundary: true
});
```

### Future Extensibility

The new architecture supports:
- Additional renderers via the DI container
- Custom resource types in ResourceManager
- Plugin system through dependency injection
- Extended physics engines beyond Matter.js
- Custom render pipelines via RenderOptimizer

This refactored library is now production-ready with proper memory management, type safety, and performance optimizations suitable for large-scale applications.