import { Renderer } from "@rive-app/webgl-advanced";
import { PhysicsController } from "./controllers/PhysicsController";
import { PixiController } from "./controllers/PixiController";
import { RiveInstance } from "./canvasObjects/CanvasRiveObj";
import React, { JSX, useEffect, useRef } from "react";
import { CanvasObj } from "./canvasObjects/CanvasObj";
import { RiveController, RiveObjectsSet } from "./controllers/RiveController";
import Matter from "matter-js";
import { CanvasEngineResizePubSub, CanvasEngineStartResizePubSub } from "./CanvasEngineEventBus";

export enum CANVAS_ENGINE_RUN_STATE
{
	STOPPED = "STOPPED",
	RUNNING = "RUNNING",
	PAUSED = "PAUSED",
}

export class ResizeCanvasObj
{
	public width:number;
	public height:number;
	public scale:number;
	public margin:string;
	public canvasRef: HTMLCanvasElement | null = null;

	constructor(width:number, height:number, scale:number, margin:string, canvasRef: HTMLCanvasElement | null = null)
	{
		this.width = width;
		this.height = height;
		this.scale = scale;
		this.margin = margin;
		this.canvasRef = canvasRef;
	}
}

export class CanvasSettingsDef
{
	public physicsEnabled?:boolean;
	public physicsWalls?:boolean;
	public width?:number;
	public height?:number;
	public autoScale?:boolean;
	public debugMode?:boolean;

	constructor({
		physicsEnabled=false,
		physicsWalls=false,
		width=800,
		height=500,
		autoScale=false,
		debugMode=false,
	}) {
		this.physicsEnabled = physicsEnabled;
		this.physicsWalls = physicsWalls;
		this.width = width;
		this.height = height;
		this.autoScale = autoScale;
		this.debugMode = debugMode;
	}
}

export class CanvasEngine
{
	private static _instance:CanvasEngine; static get():CanvasEngine { if (!CanvasEngine._instance) CanvasEngine._instance = new CanvasEngine(); return CanvasEngine._instance; }

	public canvasContainerRef:HTMLDivElement | null = null;
	public canvasAreaRef:HTMLDivElement | null = null;
	public canvasRef:HTMLCanvasElement | null = null;
	public pixiCanvasRefTop:HTMLCanvasElement | null = null;
	public pixiCanvasRefBottom:HTMLCanvasElement | null = null;
	public debugContainerRef:HTMLDivElement | null = null;
	public runStateLabel:HTMLDivElement | null = null;
	public fpsLabel:HTMLDivElement | null = null;
	public fpsSpinner:HTMLDivElement | null = null;

	public rive:RiveInstance | null = null;
	public canvasObjects:Map<string, CanvasObj[]> = new Map();

	private animationFrameId:number | null = null;
	private riveInstance:RiveInstance | null = null;
	private runState:CANVAS_ENGINE_RUN_STATE = CANVAS_ENGINE_RUN_STATE.STOPPED;
	private engine:Matter.Engine | null = null;
	public get EngineSettings():CanvasSettingsDef | null { return this._canvasSettings; }
	private _canvasSettings:CanvasSettingsDef | null = null;

	private _canvasWidth:number = 0;
	public get width():number { return this._canvasWidth; }
	private _canvasHeight:number = 0;
	public get height():number { return this._canvasHeight; }

	private updateListeners:Set<(t:number, dt:number, frameCount:number, oncePerSecond:boolean) => void> = new Set();
	public AddUpdateListener(listener:(t:number, dt:number, frameCount:number, oncePerSecond:boolean) => void)
	{
		this.updateListeners.add(listener);
	}

	public RemoveUpdateListener(listener:(t:number, dt:number, frameCount:number, oncePerSecond:boolean) => void)
	{
		this.updateListeners.delete(listener);
	}

	public async Init(canvasSettings:CanvasSettingsDef, onInitComplete?:() => void)
	{
		if (!this.canvasRef) throw new Error("canvasRef not set");

		this._canvasSettings = canvasSettings;

		this.runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
		if (this.runStateLabel) { this.runStateLabel.innerText = this.runState; }

		const canvas = this.canvasRef;
		this._currentCanvasScale = -1;
		this._canvasWidth = canvas.width = canvasSettings.width ?? 800;
		this._canvasHeight = canvas.height = canvasSettings.height ?? 500;

		PixiController.get().Init(this._canvasWidth, this._canvasHeight);

		await RiveController.get().Init(canvas);
		const riveInstance = RiveController.get().Rive;
		//riveInstance.resizeDrawingSurfaceToCanvas?.();

		this.rive = riveInstance;
		this.riveInstance = riveInstance;
		const riveRenderer: Renderer = RiveController.get().Renderer;

		let riveFps = 0;
		await riveInstance.enableFPSCounter((rFps) => {
			riveFps = Math.round(rFps);
			//this.fpsValue = riveFps;
			//if (this.fpsCallback) this.fpsCallback(this.fpsValue);
		});

		if(canvasSettings.physicsEnabled) PhysicsController.get().Init(canvas, canvasSettings.physicsWalls, this.debugContainerRef!, canvasSettings.debugMode);

		let lastTime = 0;
		let accumulatedTime = 0;
		let skipsPerSecond = 0;
		let iterationCount = 0;
		let frameCount = 0;
		let lastLogTime = performance.now();
		const spinnerFrames = [' -- ', ' \\', ' | ', ' / ', ' -- ', ' \\', ' | ', ' / '];
		let spinnerIdx = 0;
		const MIN_TIME_STEP = 0.010;
		//const MIN_TIME_STEP = 0.012;
		//const MIN_TIME_STEP = 0.00012;

		if(canvasSettings.debugMode == null || !canvasSettings.debugMode)
		{

		}

		const updateLoop = (time:number) =>
		{
			if (this.runState !== CANVAS_ENGINE_RUN_STATE.RUNNING)
			{
				lastTime = time;
				this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
				return;
			}

			iterationCount++;
			frameCount++;

			if (!lastTime) lastTime = time;
			let elapsedTimeSec = (time - lastTime) / 1000;
			lastTime = time;
			accumulatedTime += elapsedTimeSec;

			if (accumulatedTime < MIN_TIME_STEP)
			{
				skipsPerSecond++;
				this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
				//console.log(`Skipping frame ${numSkips}/${numNoSkips} - elapsedTime=${elapsedTimeSec.toFixed(4)}, accumulatedTime=${accumulatedTime.toFixed(4)}`);
				return;
			}

			elapsedTimeSec = accumulatedTime;
			accumulatedTime = 0;

			const onceSecond = time - lastLogTime > 1000;
			if (onceSecond)
			{
				if (this.fpsCallback)
				{
					spinnerIdx = (spinnerIdx + 1) % spinnerFrames.length;
					this.fpsCallback(`${spinnerFrames[spinnerIdx]} FPS=${riveFps}:${iterationCount}, Skips=${skipsPerSecond}`);
				}
				skipsPerSecond = 0;
				iterationCount = 0;
				lastLogTime = time;
			}

			this.updateListeners.forEach((listener) =>
			{
				listener(time, elapsedTimeSec, frameCount, onceSecond);
			});

			if (canvasSettings.physicsEnabled) PhysicsController.get().Update(elapsedTimeSec, frameCount, onceSecond);

			riveRenderer.clear();

			this.canvasObjects.forEach((objects) =>
			{
				objects.forEach((obj) =>
				{
					obj.Update(elapsedTimeSec, frameCount, onceSecond);
				});
			});
			riveRenderer.flush();

			this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
		};

		this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
		if (onInitComplete) onInitComplete();

		window.removeEventListener("resize", this.ResizeWindowEvent);

		if(canvasSettings.autoScale)
		{
			window.addEventListener("resize", this.ResizeWindowEvent);
			this.ResizeCanvasToWindow();
		}

		setTimeout(() => this.ResizeCanvasToWindow(), 1000);
	}

	public get RunState():CANVAS_ENGINE_RUN_STATE { return this.runState; }

	public ToggleRunState()
	{
		this.SetRunState( this.runState === CANVAS_ENGINE_RUN_STATE.RUNNING ? CANVAS_ENGINE_RUN_STATE.STOPPED : CANVAS_ENGINE_RUN_STATE.RUNNING );
	}

	public SetRunState(state: CANVAS_ENGINE_RUN_STATE)
	{
		this.runState = state;
		if (this.runStateLabel)
		{
			this.runStateLabel.innerText = this.runState;
		}
	}

	private fpsValue: number = 0;
	private fpsCallback?: (fps: string) => void;

	public SetFpsCallback(cb: (fps: string) => void)
	{
		this.fpsCallback = cb;
	}

	public GetFPS(): string
	{
		return this.fpsValue.toString();
	}

	public AddCanvasObjects(objs: CanvasObj | CanvasObj[] | RiveObjectsSet, group = "main")
	{
		let cObjs: CanvasObj[] = [];

		if (objs instanceof RiveObjectsSet)
		{
			cObjs = objs.objects ?? [];
		}
		else if (Array.isArray(objs))
		{
			cObjs = objs;
		}
		else
		{
			cObjs = [objs];
		}

		if (!this.canvasObjects.has(group)) this.canvasObjects.set(group, []);

		const groupArray = this.canvasObjects.get(group)!;
		cObjs.forEach((obj) => (obj.OnZIndexChanged = this.updateZIndex.bind(this)));
		groupArray.push(...cObjs);
		groupArray.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
	}

	public RemoveCanvasObjects(objs: CanvasObj | CanvasObj[], group = "main")
	{
		const groupArray = this.canvasObjects.get(group);
		if (!groupArray) return;

		const objsToRemove = Array.isArray(objs) ? objs : [objs];

		for (const obj of objsToRemove)
		{
			const index = groupArray.indexOf(obj);
			if (index !== -1)
			{
				groupArray.splice(index, 1);
				obj.Dispose();
			}
		}

		if (groupArray.length === 0)
		{
			this.canvasObjects.delete(group);
		}
	}

	private updateZIndex(canvasObj: CanvasObj, newZIndex: number)
	{
		if (canvasObj.z === newZIndex) return;

		const group = canvasObj.group ?? "main";
		const groupArray = this.canvasObjects.get(group);
		if (!groupArray) return;

		const index = groupArray.indexOf(canvasObj);
		if (index !== -1)
		{
			groupArray.splice(index, 1);
			groupArray.push(canvasObj);
			groupArray.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
		}
	}

	private _resizeDebounceTimeout: number | null = null;
	public ResizeWindowEvent = (): void =>
	{
		if (this._resizeDebounceTimeout !== null)
		{
			clearTimeout(this._resizeDebounceTimeout);
		}

		this.runState = CANVAS_ENGINE_RUN_STATE.PAUSED;
		CanvasEngineStartResizePubSub.Publish({});
		this._resizeDebounceTimeout = window.setTimeout(() =>
		{
			this.ResizeCanvasToWindow();
			this._resizeDebounceTimeout = null;
			this.runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
		}, 250);
	}

	private _currentCanvasScale: number = -1;
	public get CurrentCanvasScale(): number { return this._currentCanvasScale; }
	public ResizeCanvasToWindow = (): void =>
	{
		if (!this._canvasSettings || !this._canvasSettings.width || !this._canvasSettings.height) return;

		const el = document.getElementById("routesContainer") as HTMLDivElement;
		const newBounds = el.getBoundingClientRect();

		const dpr = window.devicePixelRatio || 1;

		this._currentCanvasScale = Math.min(newBounds.width / this._canvasSettings.width!, newBounds.height / this._canvasSettings.height!);

		let newWidth = Math.floor(this._canvasSettings.width! * this._currentCanvasScale)-4;
		let newHeight = Math.floor(this._canvasSettings.height! * this._currentCanvasScale)-4;

		let horizMargin = 0;
		let vertMargin = (newBounds.height - newHeight) / 2;
		if(vertMargin < 10)
		{
			vertMargin = 0;

		}

		if(newWidth > this._canvasSettings.width || newHeight > this._canvasSettings.height)
		{
			//console.log("SNAP DEEEzzzz nuts");
			//vertMargin = 0;
			//newWidth = this._canvasSettings.width-10;
			//newHeight = this._canvasSettings.height-10;
		}

		this.canvasContainerRef!.style.width = `${newWidth}px`;
		this.canvasContainerRef!.style.height = `${newHeight}px`;
		this.canvasContainerRef!.style.margin = `${vertMargin}px ${horizMargin}px`;

		// Notify Rive of resize
		RiveController.get().SetSize(newWidth, newHeight);
		PixiController.get().SetSize(newWidth, newHeight);
		PhysicsController.get().SetSize(newWidth, newHeight);

		// Apply canvas scale to all objects
		this.canvasObjects.forEach((group) =>
		{
			group.forEach((obj) =>
			{
				obj.ApplyResolutionScale(this._currentCanvasScale);
			});
		});

		CanvasEngineResizePubSub.Publish({width:newWidth, height:newHeight, scale:this._currentCanvasScale, margin:`${vertMargin}px ${horizMargin}px`, canvasRef:this.canvasRef} as ResizeCanvasObj);
	}

	public Dispose()
	{
		this.runState = CANVAS_ENGINE_RUN_STATE.STOPPED;

		if (this.engine)
		{
			Matter.Events.off(this.engine, "collisionStart");
			Matter.World.clear(this.engine.world, false);
			Matter.Engine.clear(this.engine);
		}

		this.canvasObjects.forEach((objs) => objs.forEach((o) => o.Dispose()));
		this.canvasObjects.clear();

		if (this.animationFrameId && this.riveInstance)
		{
			this.riveInstance.cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		RiveController.get().Dispose();
		PixiController.get().Dispose();

		window.removeEventListener("resize", this.ResizeWindowEvent);
		if (this._resizeDebounceTimeout !== null)
		{
			clearTimeout(this._resizeDebounceTimeout);
			this._resizeDebounceTimeout = null;
		}

		if(this.updateListeners != null) this.updateListeners.clear();

		if (this.rive) this.rive = null;
		if (this.engine) this.engine = null;
	}

	public SetRefs({
		canvasContainerRef,
		canvasAreaRef,
		canvasRef,
		pixiCanvasRefTop,
		pixiCanvasRefBottom,
		debugContainerRef,
		runStateLabel,
		fpsLabel,
		fpsSpinner,
	}: {
		canvasContainerRef: HTMLDivElement;
		canvasAreaRef: HTMLDivElement;
		canvasRef: HTMLCanvasElement;
		pixiCanvasRefTop?: HTMLCanvasElement;
		pixiCanvasRefBottom?: HTMLCanvasElement;
		debugContainerRef?: HTMLDivElement;
		runStateLabel?: HTMLDivElement;
		fpsLabel?: HTMLDivElement;
		fpsSpinner?: HTMLDivElement;
	}) {
		this.canvasContainerRef = canvasContainerRef;
		this.canvasAreaRef = canvasAreaRef;
		this.canvasRef = canvasRef;
		this.pixiCanvasRefTop = pixiCanvasRefTop || null;
		this.pixiCanvasRefBottom = pixiCanvasRefBottom || null;
		this.debugContainerRef = debugContainerRef || null;
		this.runStateLabel = runStateLabel || null;
		this.fpsLabel = fpsLabel || null;
		this.fpsSpinner = fpsSpinner || null;
	}
}

export function UseCanvasEngineHook(
	settings: Partial<ConstructorParameters<typeof CanvasSettingsDef>[0]> = {},
	onInit?: () => void
): {
	RivePakCanvas:() => JSX.Element | null;
	canvasRef:React.RefObject<HTMLCanvasElement>;
	pixiCanvasRefTop:React.RefObject<HTMLCanvasElement>;
	pixiCanvasRefBottom:React.RefObject<HTMLCanvasElement>;
	canvasObjects:Map<string, CanvasObj[]>;
	debugContainerRef:React.RefObject<HTMLDivElement>;
	addCanvasObjects:(objs: CanvasObj | CanvasObj[] | RiveObjectsSet, group?: string) => void;
	fpsRef:React.RefObject<HTMLDivElement>;
	runStateLabel:React.RefObject<HTMLDivElement>;
	ToggleRunState:() => void;
	SetRunState:(state: CANVAS_ENGINE_RUN_STATE) => void;
	RunState:() => CANVAS_ENGINE_RUN_STATE;
} {
	const canvasSettings = new CanvasSettingsDef(settings);
	const canvasRef = useRef<HTMLCanvasElement>(null!);
	const canvasAreaRef = useRef<HTMLDivElement>(null!);
	const canvasContainerRef = useRef<HTMLDivElement>(null!);
	const pixiCanvasRefTop = useRef<HTMLCanvasElement>(null!);
	const pixiCanvasRefBottom = useRef<HTMLCanvasElement>(null!);
	const debugContainerRef = useRef<HTMLDivElement>(null!);
	const runStateLabel = useRef<HTMLDivElement>(null!);
	const fpsSpinner = useRef<HTMLDivElement>(null!);
	const fpsRef = useRef<HTMLDivElement>(null!);
	const ToggleRunState = () => CanvasEngine.get().ToggleRunState();
	const SetRunState = (state: CANVAS_ENGINE_RUN_STATE) => CanvasEngine.get().SetRunState(state);
	const RunState = () => CanvasEngine.get().RunState;

	const canvasJSXRef = useRef<JSX.Element | null>(null);

	if (!canvasJSXRef.current)
	{
		canvasJSXRef.current = (
			<div id="canvasArea" ref={canvasAreaRef}>
				<div id="debugTools" className="debugTools" style={{ display: canvasSettings.debugMode ? "flex" : "none", position:"absolute", zIndex:"99999", bottom:"2px", left:"10px", gap: "10px", marginBottom:"10px", alignItems: "center", justifyContent: "center" }}>
					<button onClick={ToggleRunState}><span ref={runStateLabel}></span></button>
					<div className="fpsContainer" style={{ display: "flex", flexDirection: "row", justifyContent: "space-around" }}>
						<span className="fpsSpinner" style={{display: "flex", maxWidth: "15px", minWidth: "15px", width: "15px"}} ref={fpsSpinner}></span><span ref={fpsRef}></span>
					</div>
				</div>
				<div ref={canvasContainerRef} style={{ position: "relative" }}>
					<canvas id="riveCanvas" ref={canvasRef} style={{ border: "1px solid black", position:"absolute", zIndex: 2}} />
					<div id="pixiCanvasContainer"  /*style={{ position: "absolute", top: 0, left: 0 }}*/ >
						<canvas id="pixiCanvasTop" ref={pixiCanvasRefTop} style={{ position: "absolute", top: 0, left: 0, zIndex:3 }} />
						<canvas id="pixiCanvasBottom" ref={pixiCanvasRefBottom} style={{ position: "absolute", top: 0, left: 0, zIndex:1 }} />
					</div>
					{ canvasSettings.debugMode && <div ref={debugContainerRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: 0.25, }} /> }
				</div>
			</div>
		);
	}

	const hasEngineInitialized = useRef(false);
	useEffect(() => {
		const engine = CanvasEngine.get();

		if (hasEngineInitialized.current) { console.log("⚠️ CanvasEngine already initialized, skipping Init()"); return; }
		hasEngineInitialized.current = true;

		requestAnimationFrame(() => {
			if (!canvasRef.current) {
				console.warn(
					"[RivePak] canvasRef is still null after mount. Did you forget to render CanvasView or call SetRefs?"
				);
				return;
			}

			engine.SetFpsCallback((fps) => {
				fpsRef.current!.innerText = `${fps}`;
			});

			engine.SetRefs({
				canvasContainerRef: canvasContainerRef.current!,
				canvasAreaRef: canvasAreaRef.current!,
				canvasRef: canvasRef.current!,
				pixiCanvasRefTop: pixiCanvasRefTop.current!,
				pixiCanvasRefBottom: pixiCanvasRefBottom.current!,
				debugContainerRef: debugContainerRef.current!,
				runStateLabel: runStateLabel.current!,
				fpsLabel: fpsRef.current!,
				fpsSpinner: fpsSpinner.current!,
			});

			engine.Init(canvasSettings, onInit);
		});

		return () =>
		{
			hasEngineInitialized.current = false;
			CanvasEngine.get().Dispose();
		};
	}, []);

	return {
		RivePakCanvas: () => canvasJSXRef.current,
		canvasRef,
		pixiCanvasRefTop,
		pixiCanvasRefBottom,
		debugContainerRef,
		canvasObjects: CanvasEngine.get().canvasObjects,
		addCanvasObjects: CanvasEngine.get().AddCanvasObjects.bind(CanvasEngine.get()),
		ToggleRunState,
		SetRunState,
		RunState,
		runStateLabel,
		fpsRef:fpsRef
	};
}
