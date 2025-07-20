import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CanvasEngine, CanvasSettingsDef, CANVAS_ENGINE_RUN_STATE, ResizeCanvasObj } from '../useCanvasEngine';
import { CanvasObj } from '../canvasObjects/CanvasObj';
import { RiveObjectsSet } from '../controllers/RiveController';
import { ResourceManager } from '../core/ResourceManager';
import { EventManager } from '../core/EventManager';
import { RenderOptimizer } from '../core/RenderOptimizer';
import { DependencyContainer, ServiceTokens } from '../core/DependencyContainer';
import { ErrorBoundary } from './ErrorBoundary';

export interface RivePakHookOptions extends Partial<CanvasSettingsDef> {
	onInit?: (engine: CanvasEngine) => void | Promise<void>;
	onError?: (error: Error) => void;
	enableOptimizations?: boolean;
	enableErrorBoundary?: boolean;
}

export interface RivePakHookResult {
	// Canvas component
	RivePakCanvas: () => JSX.Element;

	// Canvas refs
	canvasRef: React.RefObject<HTMLCanvasElement>;
	pixiCanvasRef: React.RefObject<HTMLCanvasElement>;
	debugContainerRef: React.RefObject<HTMLDivElement>;

	// Engine state
	isInitialized: boolean;
	isLoading: boolean;
	error: Error | null;
	runState: CANVAS_ENGINE_RUN_STATE;

	// Engine controls
	toggleRunState: () => void;
	setRunState: (state: CANVAS_ENGINE_RUN_STATE) => void;
	addCanvasObjects: (objs: CanvasObj | CanvasObj[] | RiveObjectsSet, group?: string) => void;
	removeCanvasObjects: (objs: CanvasObj | CanvasObj[], group?: string) => void;

	// Stats
	fps: number;
	renderStats: {
		totalObjects: number;
		visibleObjects: number;
		culledObjects: number;
	};
}

export function useRivePak(options: RivePakHookOptions = {}): RivePakHookResult {
	// State
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [runState, setRunStateInternal] = useState<CANVAS_ENGINE_RUN_STATE>(CANVAS_ENGINE_RUN_STATE.STOPPED);
	const [fps, setFps] = useState(0);
	const [renderStats, setRenderStats] = useState({
		totalObjects: 0,
		visibleObjects: 0,
		culledObjects: 0
	});

	// Refs
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
	const canvasAreaRef = useRef<HTMLDivElement>(null);
	const canvasContainerRef = useRef<HTMLDivElement>(null);
	const debugContainerRef = useRef<HTMLDivElement>(null);
	const runStateLabelRef = useRef<HTMLDivElement>(null);
	const fpsSpinnerRef = useRef<HTMLDivElement>(null);
	const fpsRef = useRef<HTMLDivElement>(null);

	// Services
	const containerRef = useRef<DependencyContainer | null>(null);
	const engineRef = useRef<CanvasEngine | null>(null);
	const resourceManagerRef = useRef<ResourceManager | null>(null);
	const eventManagerRef = useRef<EventManager | null>(null);
	const renderOptimizerRef = useRef<RenderOptimizer | null>(null);

	// Settings
	const canvasSettings = useMemo(() => new CanvasSettingsDef(options), []);

	// Initialize services
	useEffect(() => {
		if (containerRef.current) return;

		const container = new DependencyContainer();

		// Register services
		container.registerSingleton(ServiceTokens.ResourceManager, () => new ResourceManager());
		container.registerSingleton(ServiceTokens.EventManager, (c) =>
			new EventManager(c.resolve(ServiceTokens.ResourceManager))
		);
		container.registerSingleton(ServiceTokens.RenderOptimizer, () =>
			new RenderOptimizer({
				enableCulling: options.enableOptimizations ?? true
			})
		);

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
		if (!canvasRef.current || !containerRef.current || isInitialized) return;

		let cancelled = false;

		const initEngine = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const engine = CanvasEngine.get();
				engineRef.current = engine;

				// Set refs
				engine.SetRefs({
					canvasContainerRef: canvasContainerRef.current!,
					canvasAreaRef: canvasAreaRef.current!,
					canvasRef: canvasRef.current!,
					pixiCanvasRef: pixiCanvasRef.current!,
					debugContainerRef: debugContainerRef.current!,
					runStateLabel: runStateLabelRef.current!,
					fpsLabel: fpsRef.current!,
					fpsSpinner: fpsSpinnerRef.current!,
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
				await engine.Init(canvasSettings, async () => {
					if (cancelled) return;

					// Call user's onInit
					if (options.onInit) {
						await options.onInit(engine);
					}

					setIsInitialized(true);
				});

				// Set up render stats updates
				if (renderOptimizerRef.current && options.enableOptimizations) {
					engine.AddUpdateListener(() => {
						const stats = renderOptimizerRef.current!.getStats();
						setRenderStats({
							totalObjects: stats.totalObjects,
							visibleObjects: stats.visibleObjects,
							culledObjects: stats.culledObjects
						});
					});
				}

				// Subscribe to run state changes
				const unsubscribe = eventManagerRef.current!.on('runStateChanged', (state: CANVAS_ENGINE_RUN_STATE) => {
					setRunStateInternal(state);
				});

				return unsubscribe;

			} catch (err) {
				if (!cancelled) {
					const error = err instanceof Error ? err : new Error(String(err));
					setError(error);
					if (options.onError) {
						options.onError(error);
					}
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

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

	const setRunState = useCallback((state: CANVAS_ENGINE_RUN_STATE) => {
		if (engineRef.current) {
			engineRef.current.SetRunState(state);
		}
	}, []);

	const addCanvasObjects = useCallback((
		objs: CanvasObj | CanvasObj[] | RiveObjectsSet,
		group?: string
	) => {
		if (engineRef.current) {
			engineRef.current.AddCanvasObjects(objs, group);
		}
	}, []);

	const removeCanvasObjects = useCallback((
		objs: CanvasObj | CanvasObj[],
		group?: string
	) => {
		if (engineRef.current) {
			engineRef.current.RemoveCanvasObjects(objs, group);
		}
	}, []);

	// Canvas component
	const RivePakCanvas = useCallback(() => {
		const canvas = (
			<div
				ref={canvasAreaRef}
				id="canvasArea"
				style={{
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					height: '100%',
					backgroundColor: '#303644',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
					overflow: 'hidden'
				}}
			>
				<div
					ref={canvasContainerRef}
					id="canvasContainer"
					style={{
						position: 'relative',
						width: canvasSettings.width,
						height: canvasSettings.height
					}}
				>
					<canvas
						ref={canvasRef}
						id="riveCanvas"
						width={canvasSettings.width}
						height={canvasSettings.height}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							backgroundColor: 'transparent'
						}}
					/>
					<canvas
						ref={pixiCanvasRef}
						id="pixiCanvas"
						width={canvasSettings.width}
						height={canvasSettings.height}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							pointerEvents: 'none',
							backgroundColor: 'transparent'
						}}
					/>
				</div>

				{canvasSettings.debugMode && (
					<div style={{
						position: 'absolute',
						top: 10,
						left: 10,
						color: 'white',
						fontFamily: 'monospace',
						fontSize: '12px',
						backgroundColor: 'rgba(0,0,0,0.5)',
						padding: '10px',
						borderRadius: '4px'
					}}>
						<div>State: <span ref={runStateLabelRef}>{runState}</span></div>
						<div>FPS: <span ref={fpsRef}>{fps}</span></div>
						{options.enableOptimizations && (
							<>
								<div>Objects: {renderStats.visibleObjects}/{renderStats.totalObjects}</div>
								<div>Culled: {renderStats.culledObjects}</div>
							</>
						)}
					</div>
				)}

				<div
					ref={debugContainerRef}
					id="debugPhysicsContainer"
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						pointerEvents: 'none'
					}}
				/>

				{isLoading && (
					<div style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						color: 'white',
						fontSize: '20px'
					}}>
						Loading...
					</div>
				)}
			</div>
		);

		if (options.enableErrorBoundary !== false) {
			return (
				<ErrorBoundary
					onError={options.onError}
					fallback={(error) => (
						<div style={{
							padding: '20px',
							backgroundColor: '#f8d7da',
							border: '1px solid #f5c6cb',
							borderRadius: '4px',
							color: '#721c24'
						}}>
							<h3>Canvas Error</h3>
							<p>{error.message}</p>
						</div>
					)}
				>
					{canvas}
				</ErrorBoundary>
			);
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
