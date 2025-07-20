var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CanvasEngine, CanvasSettingsDef, CANVAS_ENGINE_RUN_STATE } from '../useCanvasEngine';
import { ResourceManager } from '../core/ResourceManager';
import { EventManager } from '../core/EventManager';
import { RenderOptimizer } from '../core/RenderOptimizer';
import { DependencyContainer, ServiceTokens } from '../core/DependencyContainer';
import { ErrorBoundary } from './ErrorBoundary';
export function useRivePak(options = {}) {
    // State
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [runState, setRunStateInternal] = useState(CANVAS_ENGINE_RUN_STATE.STOPPED);
    const [fps, setFps] = useState(0);
    const [renderStats, setRenderStats] = useState({
        totalObjects: 0,
        visibleObjects: 0,
        culledObjects: 0
    });
    // Refs
    const canvasRef = useRef(null);
    const pixiCanvasRef = useRef(null);
    const canvasAreaRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const debugContainerRef = useRef(null);
    const runStateLabelRef = useRef(null);
    const fpsSpinnerRef = useRef(null);
    const fpsRef = useRef(null);
    // Services
    const containerRef = useRef(null);
    const engineRef = useRef(null);
    const resourceManagerRef = useRef(null);
    const eventManagerRef = useRef(null);
    const renderOptimizerRef = useRef(null);
    // Settings
    const canvasSettings = useMemo(() => new CanvasSettingsDef(options), []);
    // Initialize services
    useEffect(() => {
        if (containerRef.current)
            return;
        const container = new DependencyContainer();
        // Register services
        container.registerSingleton(ServiceTokens.ResourceManager, () => new ResourceManager());
        container.registerSingleton(ServiceTokens.EventManager, (c) => new EventManager(c.resolve(ServiceTokens.ResourceManager)));
        container.registerSingleton(ServiceTokens.RenderOptimizer, () => {
            var _a;
            return new RenderOptimizer({
                enableCulling: (_a = options.enableOptimizations) !== null && _a !== void 0 ? _a : true
            });
        });
        containerRef.current = container;
        resourceManagerRef.current = container.resolve(ServiceTokens.ResourceManager);
        eventManagerRef.current = container.resolve(ServiceTokens.EventManager);
        renderOptimizerRef.current = container.resolve(ServiceTokens.RenderOptimizer);
        return () => {
            // Cleanup will happen in the main effect
        };
    }, []);
    // Initialize engine
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || isInitialized)
            return;
        let cancelled = false;
        const initEngine = () => __awaiter(this, void 0, void 0, function* () {
            try {
                setIsLoading(true);
                setError(null);
                const engine = CanvasEngine.get();
                engineRef.current = engine;
                // Set refs
                engine.SetRefs({
                    canvasContainerRef: canvasContainerRef.current,
                    canvasAreaRef: canvasAreaRef.current,
                    canvasRef: canvasRef.current,
                    pixiCanvasRef: pixiCanvasRef.current,
                    debugContainerRef: debugContainerRef.current,
                    runStateLabel: runStateLabelRef.current,
                    fpsLabel: fpsRef.current,
                    fpsSpinner: fpsSpinnerRef.current,
                });
                // Set FPS callback
                engine.SetFpsCallback((fpsString) => {
                    if (!cancelled) {
                        const match = fpsString.match(/FPS=(\d+)/);
                        if (match) {
                            setFps(parseInt(match[1], 10));
                        }
                    }
                });
                // Initialize with resource management
                yield engine.Init(canvasSettings, () => __awaiter(this, void 0, void 0, function* () {
                    if (cancelled)
                        return;
                    // Call user's onInit
                    if (options.onInit) {
                        yield options.onInit(engine);
                    }
                    setIsInitialized(true);
                }));
                // Set up render stats updates
                if (renderOptimizerRef.current && options.enableOptimizations) {
                    engine.AddUpdateListener(() => {
                        const stats = renderOptimizerRef.current.getStats();
                        setRenderStats({
                            totalObjects: stats.totalObjects,
                            visibleObjects: stats.visibleObjects,
                            culledObjects: stats.culledObjects
                        });
                    });
                }
                // Subscribe to run state changes
                const unsubscribe = eventManagerRef.current.on('runStateChanged', (state) => {
                    setRunStateInternal(state);
                });
                return unsubscribe;
            }
            catch (err) {
                if (!cancelled) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setError(error);
                    if (options.onError) {
                        options.onError(error);
                    }
                }
            }
            finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        });
        const unsubscribe = initEngine();
        return () => {
            cancelled = true;
            // Cleanup
            if (engineRef.current) {
                engineRef.current.Dispose();
                engineRef.current = null;
            }
            // Dispose all services
            if (containerRef.current) {
                containerRef.current.dispose().then(() => {
                    containerRef.current = null;
                    resourceManagerRef.current = null;
                    eventManagerRef.current = null;
                    renderOptimizerRef.current = null;
                });
            }
            setIsInitialized(false);
        };
    }, [canvasSettings, options.onInit, options.onError, options.enableOptimizations]);
    // Engine control methods
    const toggleRunState = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.ToggleRunState();
        }
    }, []);
    const setRunState = useCallback((state) => {
        if (engineRef.current) {
            engineRef.current.SetRunState(state);
        }
    }, []);
    const addCanvasObjects = useCallback((objs, group) => {
        if (engineRef.current) {
            engineRef.current.AddCanvasObjects(objs, group);
        }
    }, []);
    const removeCanvasObjects = useCallback((objs, group) => {
        if (engineRef.current) {
            engineRef.current.RemoveCanvasObjects(objs, group);
        }
    }, []);
    // Canvas component
    const RivePakCanvas = useCallback(() => {
        const canvas = (_jsxs("div", Object.assign({ ref: canvasAreaRef, id: "canvasArea", style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: '#303644',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            } }, { children: [_jsxs("div", Object.assign({ ref: canvasContainerRef, id: "canvasContainer", style: {
                        position: 'relative',
                        width: canvasSettings.width,
                        height: canvasSettings.height
                    } }, { children: [_jsx("canvas", { ref: canvasRef, id: "riveCanvas", width: canvasSettings.width, height: canvasSettings.height, style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                backgroundColor: 'transparent'
                            } }), _jsx("canvas", { ref: pixiCanvasRef, id: "pixiCanvas", width: canvasSettings.width, height: canvasSettings.height, style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                pointerEvents: 'none',
                                backgroundColor: 'transparent'
                            } })] })), canvasSettings.debugMode && (_jsxs("div", Object.assign({ style: {
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        color: 'white',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '10px',
                        borderRadius: '4px'
                    } }, { children: [_jsxs("div", { children: ["State: ", _jsx("span", Object.assign({ ref: runStateLabelRef }, { children: runState }))] }), _jsxs("div", { children: ["FPS: ", _jsx("span", Object.assign({ ref: fpsRef }, { children: fps }))] }), options.enableOptimizations && (_jsxs(_Fragment, { children: [_jsxs("div", { children: ["Objects: ", renderStats.visibleObjects, "/", renderStats.totalObjects] }), _jsxs("div", { children: ["Culled: ", renderStats.culledObjects] })] }))] }))), _jsx("div", { ref: debugContainerRef, id: "debugPhysicsContainer", style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                    } }), isLoading && (_jsx("div", Object.assign({ style: {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: '20px'
                    } }, { children: "Loading..." })))] })));
        if (options.enableErrorBoundary !== false) {
            return (_jsx(ErrorBoundary, Object.assign({ onError: options.onError, fallback: (error) => (_jsxs("div", Object.assign({ style: {
                        padding: '20px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        color: '#721c24'
                    } }, { children: [_jsx("h3", { children: "Canvas Error" }), _jsx("p", { children: error.message })] }))) }, { children: canvas })));
        }
        return canvas;
    }, [canvasSettings, runState, fps, renderStats, isLoading, options]);
    return {
        // Canvas component
        RivePakCanvas,
        // Canvas refs
        canvasRef,
        pixiCanvasRef,
        debugContainerRef,
        // Engine state
        isInitialized,
        isLoading,
        error,
        runState,
        // Engine controls
        toggleRunState,
        setRunState,
        addCanvasObjects,
        removeCanvasObjects,
        // Stats
        fps,
        renderStats
    };
}
