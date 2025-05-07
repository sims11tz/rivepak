import { Renderer } from "@rive-app/webgl-advanced";
import { PhysicsController } from "./controllers/PhysicsController";
import { PixiController } from "./controllers/PixiController";
import { RiveInstance } from "./canvasObjects/CanvasRiveObj";
import { JSX, useEffect, useRef, useState } from "react";
import { CanvasObj } from "./canvasObjects/CanvasObj";
import { RiveController } from "./controllers/RiveController";
import Matter from "matter-js";

export enum CANVAS_ENGINE_RUN_STATE
{
	STOPPED = "STOPPED",
	RUNNING = "RUNNING",
	PAUSED = "PAUSED",
}

export class CanvasSettingsDef
{
	public usePhysics?:boolean;
	public width?:number;
	public height?:number;
	public debugMode?:boolean;

	constructor({
		usePhysics=false,
		width=800,
		height=500,
		debugMode=false,
	}) {
		this.usePhysics = usePhysics;
		this.width = width;
		this.height = height;
		this.debugMode = debugMode;
	}
}

export class CanvasEngine
{
	private static _instance: CanvasEngine; static get(): CanvasEngine { if (!CanvasEngine._instance) CanvasEngine._instance = new CanvasEngine(); return CanvasEngine._instance; }

	public canvasRef: HTMLCanvasElement | null = null;
	public pixiCanvasRef: HTMLCanvasElement | null = null;
	public debugContainerRef: HTMLDivElement | null = null;
	public runStateLabel: HTMLDivElement | null = null;
	public fpsLabel: HTMLDivElement | null = null;
	public fpsSpinner: HTMLDivElement | null = null;

	public rive: RiveInstance | null = null;
	public canvasObjects: Map<string, CanvasObj[]> = new Map();

	private animationFrameId: number | null = null;
	private riveInstance: RiveInstance | null = null;
	private runState: CANVAS_ENGINE_RUN_STATE = CANVAS_ENGINE_RUN_STATE.STOPPED;
	private engine: Matter.Engine | null = null;

	public async Init(canvasSettings:CanvasSettingsDef, onInitComplete?:() => void)
	{
		console.log("CanvasEngine - Initializing...... canvasSettings=",canvasSettings);
		if (!this.canvasRef) throw new Error("canvasRef not set");

		this.runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
		if (this.runStateLabel)
		{
			console.log("CanvasEngine - Setting runStateLabel to RUNNING");
			this.runStateLabel.innerText = this.runState;
		}
		else
		{
			console.warn("CanvasEngine - runStateLabel not set");
		}

		const canvas = this.canvasRef;
		canvas.width = canvasSettings.width ?? 800;
		canvas.height = canvasSettings.height ?? 500;

		PixiController.get().init(canvasSettings.width, canvasSettings.height);

		await RiveController.get().init(canvas);

		const riveInstance = RiveController.get().Rive;
		this.rive = riveInstance;
		this.riveInstance = riveInstance;
		const riveRenderer: Renderer = RiveController.get().Renderer;

		let riveFps = 0;
		await riveInstance.enableFPSCounter((rFps) => {
			riveFps = Math.round(rFps);
			//this.fpsValue = riveFps;
			//if (this.fpsCallback) this.fpsCallback(this.fpsValue);
		});

		if(canvasSettings.usePhysics) PhysicsController.get().init(canvas, this.debugContainerRef!, canvasSettings.debugMode);

		let lastTime = 0;
		let accumulatedTime = 0;
		let skipsPerSecond = 0;
		let iterationCount = 0;
		let frameCount = 0;
		let lastLogTime = performance.now();
		const spinnerFrames = [' -- ', ' \\', ' | ', ' / ', ' -- ', ' \\', ' | ', ' / '];
		let spinnerIdx = 0;
		const MIN_TIME_STEP = 0.012;

		if(canvasSettings.debugMode == null || !canvasSettings.debugMode)
		{

		}

		const updateLoop = (time: number) =>
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

			if (canvasSettings.usePhysics) PhysicsController.get().update(elapsedTimeSec, frameCount, onceSecond);

			riveRenderer.clear();

			this.canvasObjects.forEach((objects) =>
				objects.forEach((obj) => obj.update(elapsedTimeSec, frameCount, onceSecond))
			);
			riveRenderer.flush();

			this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
		};

		this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
		if (onInitComplete) onInitComplete();
	}

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

	public setFpsCallback(cb: (fps: string) => void) {
		this.fpsCallback = cb;
	}

	public getFPS(): string {
		return this.fpsValue.toString();
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

		this.canvasObjects.forEach((objs) => objs.forEach((o) => o.dispose()));
		this.canvasObjects.clear();

		if (this.animationFrameId && this.riveInstance)
		{
			this.riveInstance.cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		RiveController.get().dispose();
		PixiController.get().dispose();

		if (this.rive) this.rive = null;
		if (this.engine) this.engine = null;
	}

	public AddCanvasObjects(objs: CanvasObj | CanvasObj[], group = "main")
	{
		const cObjs = Array.isArray(objs) ? objs : [objs];
		if (!this.canvasObjects.has(group)) this.canvasObjects.set(group, []);

		const groupArray = this.canvasObjects.get(group)!;
		cObjs.forEach((obj) => (obj.onZIndexChanged = this.updateZIndex.bind(this)));
		groupArray.push(...cObjs);
		groupArray.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
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

	public SetRefs({
		canvasRef,
		pixiCanvasRef,
		debugContainerRef,
		runStateLabel,
		fpsLabel,
		fpsSpinner,
	}: {
		canvasRef: HTMLCanvasElement;
		pixiCanvasRef?: HTMLCanvasElement;
		debugContainerRef?: HTMLDivElement;
		runStateLabel?: HTMLDivElement;
		fpsLabel?: HTMLDivElement;
		fpsSpinner?: HTMLDivElement;
	}) {
		this.canvasRef = canvasRef;
		this.pixiCanvasRef = pixiCanvasRef || null;
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
	pixiCanvasRef:React.RefObject<HTMLCanvasElement>;
	canvasObjects:Map<string, CanvasObj[]>;
	debugContainerRef:React.RefObject<HTMLDivElement>;
	addCanvasObjects:(objs: CanvasObj | CanvasObj[], group?: string) => void;
	ToggleRunState:() => void;
	SetRunState:(state: CANVAS_ENGINE_RUN_STATE) => void;
	fpsRef:React.RefObject<HTMLDivElement>;
	runStateLabel:React.RefObject<HTMLDivElement>;
} {
	const canvasSettings = new CanvasSettingsDef(settings);
	const canvasRef = useRef<HTMLCanvasElement>(null!);
	const pixiCanvasRef = useRef<HTMLCanvasElement>(null!);
	const debugContainerRef = useRef<HTMLDivElement>(null!);
	const runStateLabel = useRef<HTMLDivElement>(null!);
	const fpsSpinner = useRef<HTMLDivElement>(null!);
	const fpsRef = useRef<HTMLDivElement>(null!);
	const ToggleRunState = () => CanvasEngine.get().ToggleRunState();
	const SetRunState = (state: CANVAS_ENGINE_RUN_STATE) => CanvasEngine.get().SetRunState(state);

	const RivePakCanvas = () => {
		//if(canvasRef.current) return canvasRef.current;

		return (
			<div>
				<div id="debugTools" className="debugTools" style={{
					display: canvasSettings.debugMode ? "flex" : "none",
					gap: "10px",
					marginBottom:"10px",
					width: "100%",
					alignItems: "center",
					justifyContent: "center"
				 }}>
					<button onClick={ToggleRunState}><span ref={runStateLabel}></span></button>
					<div className="fpsContainer" style={{ display: "flex", flexDirection: "row", justifyContent: "space-around" }}>
						<span className="fpsSpinner" style={{display: "flex", maxWidth: "15px", minWidth: "15px", width: "15px"}} ref={fpsSpinner}></span><span ref={fpsRef}></span>
					</div>
				</div>
				<div style={{ position: "relative" }}>
					<canvas id="riveCanvas" ref={canvasRef} style={{ border: "1px solid black" }} />
					<div id="pixiCanvasContainer" style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}>
						<canvas id="pixiCanvas" ref={pixiCanvasRef} />
					</div>
					<div
						ref={debugContainerRef}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							pointerEvents: "none",
							opacity: 0.25,
						}}
					/>
				</div>
			</div>
		);
	};

	useEffect(() => {
		const engine = CanvasEngine.get();

		requestAnimationFrame(() => {
			if (!canvasRef.current) {
				console.warn(
					"[RivePak] canvasRef is still null after mount. Did you forget to render CanvasView or call SetRefs?"
				);
				return;
			}

			engine.setFpsCallback((fps) => {
				fpsRef.current!.innerText = `${fps}`;
			});

			engine.SetRefs({
				canvasRef: canvasRef.current!,
				pixiCanvasRef: pixiCanvasRef.current!,
				debugContainerRef: debugContainerRef.current!,
				runStateLabel: runStateLabel.current!,
				fpsLabel: fpsRef.current!,
				fpsSpinner: fpsSpinner.current!,
			});

			engine.Init(canvasSettings, onInit);
		});

		return () => CanvasEngine.get().Dispose();
	}, []);

	return {
		RivePakCanvas,
		canvasRef,
		pixiCanvasRef,
		debugContainerRef,
		canvasObjects: CanvasEngine.get().canvasObjects,
		addCanvasObjects: CanvasEngine.get().AddCanvasObjects.bind(CanvasEngine.get()),
		ToggleRunState,
		SetRunState,
		runStateLabel,
		fpsRef:fpsRef
	};
}
