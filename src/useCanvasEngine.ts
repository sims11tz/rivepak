import { Renderer } from "@rive-app/webgl-advanced";
import { PhysicsController } from "./controllers/PhysicsController";
import { PixiController } from "./controllers/PixiController";
import { RiveInstance } from "./canvasObjects/CanvasRiveObj";
import { useEffect, useRef } from "react";
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
	constructor(
		public usePhysics: boolean = false,
		public width: number = 800,
		public height: number = 500
	) {}
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

	public async init(canvasSettings: CanvasSettingsDef, onInitComplete?: () => void)
	{
		if (!this.canvasRef) throw new Error("canvasRef not set");

		this.runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
		if (this.runStateLabel) this.runStateLabel.innerText = this.runState;

		const canvas = this.canvasRef;
		canvas.width = canvasSettings.width;
		canvas.height = canvasSettings.height;

		await RiveController.get().init(canvas);

		const riveInstance = RiveController.get().Rive;
		this.rive = riveInstance;
		this.riveInstance = riveInstance;
		const riveRenderer: Renderer = RiveController.get().Renderer;

		let riveFps = 0;
		riveInstance.enableFPSCounter((rFps) => (riveFps = Math.round(rFps)));

		if (canvasSettings.usePhysics) PhysicsController.get().init(canvas, this.debugContainerRef!, true);

		let lastTime = 0;
		let accumulatedTime = 0;
		let skipsPerSecond = 0;
		let iterationCount = 0;
		let frameCount = 0;
		let lastLogTime = performance.now();
		const spinnerFrames = [' -- ', ' \\', ' | ', ' / ', ' -- ', ' \\', ' | ', ' / '];
		let spinnerIdx = 0;

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

			if (accumulatedTime < 0.02)
			{
				skipsPerSecond++;
				this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
				return;
			}

			elapsedTimeSec = accumulatedTime;
			accumulatedTime = 0;

			const onceSecond = time - lastLogTime > 1000;
			if (onceSecond)
			{
				if (this.fpsLabel) this.fpsLabel.innerText = `FPS=${riveFps}:${iterationCount}, Skips=${skipsPerSecond}`;
				skipsPerSecond = 0;
				iterationCount = 0;
				lastLogTime = time;
				if (this.fpsSpinner) this.fpsSpinner.innerText = spinnerFrames[spinnerIdx];
				spinnerIdx = (spinnerIdx + 1) % spinnerFrames.length;
			}

			if (canvasSettings.usePhysics)
				PhysicsController.get().update(elapsedTimeSec, frameCount, onceSecond);

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

	public dispose()
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

	public addCanvasObjects(objs: CanvasObj | CanvasObj[], group = "main")
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

	public setRefs({
		canvasRef,
		pixiCanvasRef,
		debugContainerRef,
		runStateLabel,
		fpsLabel,
		fpsSpinner
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

export function useCanvasEngineHook(canvasSettings: CanvasSettingsDef, onInit?: () => void) {
	const canvasRef = useRef<HTMLCanvasElement>(null!);
	const pixiCanvasRef = useRef<HTMLCanvasElement>(null!);
	const debugContainerRef = useRef<HTMLDivElement>(null!);
	const runStateLabel = useRef<HTMLDivElement>(null!);
	const fpsLabel = useRef<HTMLDivElement>(null!);
	const fpsSpinner = useRef<HTMLDivElement>(null!);

	useEffect(() => {
		const engine = CanvasEngine.get();
		engine.setRefs({
			canvasRef: canvasRef.current!,
			pixiCanvasRef: pixiCanvasRef.current!,
			debugContainerRef: debugContainerRef.current!,
			runStateLabel: runStateLabel.current!,
			fpsLabel: fpsLabel.current!,
			fpsSpinner: fpsSpinner.current!,
		});
		engine.init(canvasSettings, onInit);
		return () => engine.dispose();
	}, []);

	return {
		canvasRef,
		pixiCanvasRef,
		debugContainerRef,
		runStateLabel,
		fpsLabel,
		fpsSpinner,
		addCanvasObjects: CanvasEngine.get().addCanvasObjects.bind(CanvasEngine.get()),
		canvasObjectsRef: { current: CanvasEngine.get().canvasObjects },
		fps: fpsLabel,
	};
}
