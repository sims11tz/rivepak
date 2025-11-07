import { Renderer } from "@rive-app/webgl2-advanced";
import { PhysicsController } from "./controllers/PhysicsController";
import { PixiController, PIXI_LAYER } from "./controllers/PixiController";
import { AnimationMetadata, RiveInstance } from "./canvasObjects/CanvasRiveObj";
import React, { JSX, useEffect, useRef } from "react";
import { BaseCanvasObj, GlobalUIDGenerator } from "./canvasObjects/_baseCanvasObj";
import { RiveController, RiveObjectsSet } from "./controllers/RiveController";
import Matter from "matter-js";
import { CanvasEngineResizePubSub, CanvasEngineStartResizePubSub } from "./CanvasEngineEventBus";
import { RiveTimelineController } from "./canvasObjects/RiveTimelineController";

export enum CANVAS_ENGINE_RUN_STATE
{
	STOPPED = "STOPPED",
	RUNNING = "RUNNING",
	PAUSED = "PAUSED",
}

export class ResizeCanvasObj
{
	private _disposed = false;
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
	public borderWidth?:number;
	public borderColor?:string;

	constructor({
		physicsEnabled=false,
		physicsWalls=false,
		width=800,
		height=500,
		autoScale=false,
		debugMode=false,
		borderWidth=1,
		borderColor="black",
	}) {
		this.physicsEnabled = physicsEnabled;
		this.physicsWalls = physicsWalls;
		this.width = width;
		this.height = height;
		this.autoScale = autoScale;
		this.debugMode = debugMode;
		this.borderWidth = borderWidth;
		this.borderColor = borderColor;
	}
}

export class CanvasEngine
{
	private static _instance:CanvasEngine; static get():CanvasEngine { if (!CanvasEngine._instance) CanvasEngine._instance = new CanvasEngine(); return CanvasEngine._instance; }

	public canvasContainerRef:HTMLDivElement | null = null;
	public canvasAreaRef:HTMLDivElement | null = null;
	public canvasRef:HTMLCanvasElement | null = null;
	public pixiCanvasRefAbove:HTMLCanvasElement | null = null;
	public pixiCanvasRefBelow:HTMLCanvasElement | null = null;
	public debugContainerRef:HTMLDivElement | null = null;
	public runStateLabel:HTMLDivElement | null = null;
	public fpsLabel:HTMLDivElement | null = null;
	public fpsSpinner:HTMLDivElement | null = null;

	private _rive:RiveInstance | null = null;
	public get RiveInstance():RiveInstance | null { return this._rive; }

	private _canvasObjects: Map<string, BaseCanvasObj[]> = new Map();
	public get CanvasObjects(): Map<string, BaseCanvasObj[]> { return this._canvasObjects;}

	private _riveTimelineControllers:RiveTimelineController[] = [];
	public get RiveTimelineControllers():RiveTimelineController[] { return this._riveTimelineControllers; }

	private _animationFrameId:number | null = null;
	private _riveInstance:RiveInstance | null = null;
	public get Rive():RiveInstance | null { return this._riveInstance; }
	private _runState:CANVAS_ENGINE_RUN_STATE = CANVAS_ENGINE_RUN_STATE.STOPPED;
	private _engine:Matter.Engine | null = null;
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

		const debug = true;

		if (this._animationFrameId && this._riveInstance)
		{
			this._riveInstance.cancelAnimationFrame(this._animationFrameId);
			this._animationFrameId = null;
		}

		if(debug)
		{
			console.log('%c ', 'color:#483ac0; font-weight:bold;');
			console.log('%c __ UseCanvasEngine.init() ___________________', 'color:#483ac0; font-weight:bold;');
		}

		GlobalUIDGenerator.clear();

		this._canvasSettings = canvasSettings;

		this._runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
		if (this.runStateLabel) { this.runStateLabel.innerText = this._runState; }

		const canvas = this.canvasRef;
		this._currentCanvasScale = -1;
		//this._canvasWidth = canvas.width = canvasSettings.width ?? 800;
		//this._canvasHeight = canvas.height = canvasSettings.height ?? 500;
		this._canvasWidth = canvasSettings.width ?? 800;
		this._canvasHeight = canvasSettings.height ?? 500;

		if(debug) console.log('%c UCE>> w='+this._canvasWidth+', h='+this._canvasHeight, 'color:#483ac0; font-weight:bold;');

		PixiController.get().Init(this._canvasWidth, this._canvasHeight);

		await RiveController.get().Init(canvas);
		const riveInstance = RiveController.get().Rive;

		this._riveInstance = riveInstance;
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

		let inFrame = false;
		let firstFrameRan = false;
		const updateLoop = (time:number) =>
		{
			if(inFrame) console.warn('updateLoop re-entered same frame');
			inFrame = true;

			if(!firstFrameRan)
			{
				firstFrameRan = true;

				if (onInitComplete) onInitComplete();
			}

			if(this._runState !== CANVAS_ENGINE_RUN_STATE.RUNNING)
			{
				lastTime = time;
				inFrame = false;
				this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
				return;
			}

			iterationCount++;
			frameCount++;

			if(!lastTime) lastTime = time;
			let elapsedTimeSec = (time - lastTime) / 1000;
			lastTime = time;
			accumulatedTime += elapsedTimeSec;

			if(accumulatedTime < MIN_TIME_STEP)
			{
				skipsPerSecond++;
				inFrame = false;
				this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
				//console.log(`Skipping frame ${numSkips}/${numNoSkips} - elapsedTime=${elapsedTimeSec.toFixed(4)}, accumulatedTime=${accumulatedTime.toFixed(4)}`);
				return;
			}

			elapsedTimeSec = accumulatedTime;
			accumulatedTime = 0;

			const onceSecond = time - lastLogTime > 1000;
			if(onceSecond)
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

			this._canvasObjects.forEach((objects) =>
			{
				objects.forEach((obj) =>
				{
					if(obj.render)
					{
						obj.Update(elapsedTimeSec, frameCount, onceSecond);
					}
				});
			});

			riveRenderer.flush();

			PixiController.get().Update(elapsedTimeSec, frameCount, onceSecond);

			inFrame = false;
			this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
		};

		inFrame = false;
		this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
		//if (onInitComplete) onInitComplete();

		window.removeEventListener("resize", this.ResizeWindowEvent);

		if(canvasSettings.autoScale)
		{
			window.addEventListener("resize", this.ResizeWindowEvent);
			this.ResizeCanvasToWindow();
		}
		setTimeout(() => this.ResizeCanvasToWindow(), 1000);

		const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
		mq.addEventListener?.('change', this.ResizeWindowEvent);
	}

	public get RunState():CANVAS_ENGINE_RUN_STATE { return this._runState; }

	public ToggleRunState()
	{
		this.SetRunState( this._runState === CANVAS_ENGINE_RUN_STATE.RUNNING ? CANVAS_ENGINE_RUN_STATE.STOPPED : CANVAS_ENGINE_RUN_STATE.RUNNING );
	}

	public SetRunState(state: CANVAS_ENGINE_RUN_STATE)
	{
		this._runState = state;
		if (this.runStateLabel)
		{
			this.runStateLabel.innerText = this._runState;
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

	public GetTimelineController(animationMetaData:AnimationMetadata):RiveTimelineController | null
	{
		return this._riveTimelineControllers.find(controller => controller.AnimationMetaDataId === animationMetaData.uuid) || null;
	}

	public CreateTimelineController(animationMetaData:AnimationMetadata):RiveTimelineController
	{
		animationMetaData.isTimelineControlled = true;

		const timelineController = new RiveTimelineController(
			animationMetaData.uuid,
			animationMetaData.animation,
			animationMetaData.duration,
			animationMetaData.name
		);
		this._riveTimelineControllers.push(timelineController);
		return timelineController;
	}

	public DestroyTimelineController(animationMetaData:AnimationMetadata)
	{
		for (let i = 0; i < this._riveTimelineControllers.length; i++)
		{
			if (this._riveTimelineControllers[i].AnimationMetaDataId === animationMetaData.uuid)
			{
				this._riveTimelineControllers.splice(i, 1);
				break;
			}
		}
	}

	public AddCanvasObjects(objs:BaseCanvasObj | BaseCanvasObj[] | RiveObjectsSet, group = "main"):BaseCanvasObj | BaseCanvasObj[] | RiveObjectsSet
	{
		let add:BaseCanvasObj[] = [];
		if (objs instanceof RiveObjectsSet) add = objs.objects ?? [];
		else if (Array.isArray(objs)) add = objs;
		else add = [objs];

		if (!this._canvasObjects.has(group)) this._canvasObjects.set(group, []);
		const dest = this._canvasObjects.get(group)!;

		// Find max z from objects that were auto-assigned (have _autoAssignedZ flag)
		// This prevents explicitly-set high z values from polluting the auto-assignment counter
		let maxAutoZ = 0;
		for (const o of dest) {
			if ((o as any)._autoAssignedZ && (o.z ?? 0) > maxAutoZ) {
				maxAutoZ = o.z ?? 0;
			}
		}

		for (const obj of add)
		{
			obj.OnZIndexChanged = this.updateZIndex.bind(this);
			obj.OnDispose = this.removeObjectFromTracking.bind(this);

			for (const [g, arr] of this._canvasObjects) {
				const i = arr.indexOf(obj);
				if (i !== -1) {
					arr.splice(i, 1);
					if (arr.length === 0) this._canvasObjects.delete(g);
					break;
				}
			}

			const idx = dest.indexOf(obj);
			if (idx !== -1)
			{
				dest.splice(idx, 1);
			}
			else
			{
				(obj as any)._inited ??= false;
				if (!(obj as any)._inited)
				{
					// Check if the object has a specific z value in its defObj
					const hasExplicitZ = obj.defObj.z !== undefined && obj.defObj.z !== null;

					obj.InitVisuals();
					(obj as any)._inited = true;

					// Only auto-assign z if no explicit z was defined in defObj
					if (!hasExplicitZ) {
						obj.z = ++maxAutoZ;
						// Mark that this z was auto-assigned so we can track it
						(obj as any)._autoAssignedZ = true;
					}
				}
			}

			dest.push(obj);
		}

		dest.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

		return objs;
	}

	public RemoveCanvasObjects(objs:BaseCanvasObj | BaseCanvasObj[], group = "main")
	{
		const groupArray = this._canvasObjects.get(group);
		if (!groupArray)
		{
			return;
		}

		const objsToRemove = Array.isArray(objs) ? objs : [objs];

		//console.log(`Removing ${objsToRemove.length} object(s) from group "${group}"`);

		for (const obj of objsToRemove)
		{
			// Safety check: skip if obj is null/undefined
			if(!obj) continue;

			const index = groupArray.indexOf(obj);
			if (index !== -1)
			{
				groupArray.splice(index, 1);
				obj.Dispose();
			}
			else if(obj.group != group)
			{
				const myGroupArray = this._canvasObjects.get(obj.group);
				if(myGroupArray)
				{
					const index = myGroupArray.indexOf(obj);
					if (index !== -1)
					{
						myGroupArray.splice(index, 1);
						obj.Dispose();
					}
				}
			}
		}

		if (groupArray.length === 0)
		{
			this._canvasObjects.delete(group);
		}
	}

	private updateZIndex(canvasObj:BaseCanvasObj, newZIndex:number)
	{
		if (canvasObj.z === newZIndex) return;

		const group = canvasObj.group ?? "main";
		const groupArray = this._canvasObjects.get(group);
		if (!groupArray) return;

		const index = groupArray.indexOf(canvasObj);
		if (index !== -1)
		{
			groupArray.splice(index, 1);
			groupArray.push(canvasObj);
			groupArray.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
		}
	}

	/**
	 * Removes an object from the engine's tracking without calling Dispose again
	 * This is called by BaseCanvasObj.Dispose() via the OnDispose callback
	 */
	private removeObjectFromTracking(canvasObj:BaseCanvasObj):void
	{
		const group = canvasObj.group ?? "main";
		const groupArray = this._canvasObjects.get(group);

		if (!groupArray) return;

		const index = groupArray.indexOf(canvasObj);
		if (index !== -1)
		{
			groupArray.splice(index, 1);

			// Clean up empty group
			if (groupArray.length === 0)
			{
				this._canvasObjects.delete(group);
			}
		}
	}

	private _resizeDebounceTimeout:number | null = null;
	public ResizeWindowEvent = (): void =>
	{
		if (this._resizeDebounceTimeout !== null)
		{
			clearTimeout(this._resizeDebounceTimeout);
		}

		this._runState = CANVAS_ENGINE_RUN_STATE.PAUSED;
		CanvasEngineStartResizePubSub.Publish({});
		this._resizeDebounceTimeout = window.setTimeout(() =>
		{
			this.ResizeCanvasToWindow();
			this._resizeDebounceTimeout = null;
			this._runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
		}, 250);
	}

	private _currentCanvasScale:number = -1;
	public get CurrentCanvasScale(): number { return this._currentCanvasScale; }
	public ResizeCanvasToWindow = (): void =>
	{
		if (!this._canvasSettings || !this._canvasSettings.width || !this._canvasSettings.height) return;
		const debug = true;

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

		if(debug) console.log('%c UCE>>ResizeCanToWin newWidth='+newWidth+', newHeight='+newHeight, 'color:#483ac0; font-weight:bold;');

		//if(newWidth > this._canvasSettings.width || newHeight > this._canvasSettings.height)
		//
			//console.log("SNAP DEEEzzzz nuts");
			//vertMargin = 0;
			//newWidth = this._canvasSettings.width-10;
			//newHeight = this._canvasSettings.height-10;
		//}

		this.canvasContainerRef!.style.width = `${newWidth}px`;
		this.canvasContainerRef!.style.height = `${newHeight}px`;
		this.canvasContainerRef!.style.margin = `${vertMargin}px ${horizMargin}px`;

		if(debug) console.log('%c UCE>>ResizeCanToWin this.canvasContainerRef!.style.w='+this.canvasContainerRef!.style.width+',.h='+this.canvasContainerRef!.style.height+', this.canvasContainerRef!.style.h='+this.canvasContainerRef!.style.height, 'color:#483ac0; font-weight:bold;');

		if(debug) console.log('%cCE.resize() ', 'color:#00FF00; font-weight:bold;', newWidth, newHeight, 'scale:', this._currentCanvasScale.toFixed(3), 'dpr:', dpr);

		// Notify Rive of resize
		RiveController.get().SetSize(newWidth, newHeight, dpr);
		PixiController.get().SetSize(newWidth, newHeight, dpr);
		PhysicsController.get().SetSize(newWidth, newHeight, dpr);

		// Apply canvas scale to all objects
		this._canvasObjects.forEach((group) =>
		{
			group.forEach((obj) =>
			{
				obj.ApplyResolutionScale(this._currentCanvasScale);
			});
		});

		CanvasEngineResizePubSub.Publish({width:newWidth, height:newHeight, scale:this._currentCanvasScale, margin:`${vertMargin}px ${horizMargin}px`, canvasRef:this.canvasRef} as ResizeCanvasObj);
	}

	public DebugLogLayering():void
	{
		console.log('%c ===== Canvas Objects Layering Debug =====', 'color:#00FF00; font-weight:bold;');

		// Get PIXI stages
		const pixiAbove = PixiController.get().GetPixiInstance(PIXI_LAYER.ABOVE);
		const pixiBelow = PixiController.get().GetPixiInstance(PIXI_LAYER.BELOW);

		// Log all canvas objects by group
		this._canvasObjects.forEach((objects, group) => {
			console.log(`%c Group: ${group} (${objects.length} objects)`, 'color:#FFD700; font-weight:bold;');

			// Sort by z for display
			const sorted = [...objects].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

			sorted.forEach(obj => {
				const info:any = {
					label: obj.label,
					type: obj.constructor.name,
					stateZ: obj.z,
					visible: obj.visible,
				};

				// Try to get PIXI zIndex for different object types
				if((obj as any)._textField) {
					// CanvasTextObject
					info.pixiZIndex = (obj as any)._textField.zIndex;
					info.pixiLayer = (obj.defObj as any).pixiLayer || 'ABOVE';
				}
				else if((obj as any)._graphics) {
					// CanvasPixiShapeObj
					info.pixiZIndex = (obj as any)._graphics.zIndex;
					info.pixiLayer = (obj.defObj as any).pixiLayer || 'ABOVE';
				}
				else if((obj as any)._backgroundGraphics) {
					// CanvasTextAreaObj background
					info.bgPixiZIndex = (obj as any)._backgroundGraphics?.zIndex;
					info.shadowPixiZIndex = (obj as any)._shadowGraphics?.zIndex;
					info.pixiLayer = (obj.defObj as any).pixiLayer || 'ABOVE';
				}
				else if((obj as any)._interactiveGraphics) {
					// CanvasRiveObj
					info.interactiveZIndex = (obj as any)._interactiveGraphics?.zIndex;
					info.pixiLayer = (obj.defObj as any).pixiLayer || 'ABOVE';
				}

				// Check if it's a container with children
				if((obj as any).children && (obj as any).children.length > 0) {
					info.childrenCount = (obj as any).children.length;
				}

				console.log(`  ${obj.label}:`, info);
			});
		});

		// Log PIXI stage children counts
		console.log('%c ===== PIXI Stage Info =====', 'color:#00FFFF; font-weight:bold;');
		console.log(`PIXI ABOVE Stage children: ${pixiAbove.stage.children.length}`);
		console.log(`PIXI BELOW Stage children: ${pixiBelow.stage.children.length}`);

		// Show first few children of each stage with their zIndex
		console.log('PIXI ABOVE Stage children (first 10):');
		pixiAbove.stage.children.slice(0, 50).forEach((child:any, i) => {
			console.log(`  [${i}] zIndex: ${child.zIndex}, type: ${child.constructor.name} text: ${(child as any).text} `);
		});

		console.log('PIXI BELOW Stage children (first 10):');
		pixiBelow.stage.children.slice(0, 10).forEach((child:any, i) => {
			console.log(`  [${i}] zIndex: ${child.zIndex}, type: ${child.constructor.name}`);
		});

		console.log('%c ===== End Debug =====', 'color:#00FF00; font-weight:bold;');
	}

	public DebugLog(summaryOnly:boolean = false):void
	{
		console.log('%c ============== CanvasEngine.Debug ============', 'color:#7050a8; font-weight:bold;');

		// Summary counts
		let totalObjects = 0;
		let totalGroups = 0;
		let totalChildren = 0;
		let totalAnimations = 0;
		let totalStateMachines = 0;
		let totalTextObjects = 0;
		let totalRiveObjects = 0;
		let totalPixiObjects = 0;
		let totalPhysicsBodies = 0;

		this._canvasObjects.forEach((objects) => {
			totalGroups++;
			totalObjects += objects.length;
			objects.forEach((obj) => {
				// Count children
				if((obj as any).children) {
					totalChildren += (obj as any).children.length;
				}

				// Count animations
				if((obj as any)._animations) {
					totalAnimations += (obj as any)._animations.length;
				}

				// Count state machines
				if((obj as any)._stateMachine) {
					totalStateMachines++;
				}

				// Count object types
				if((obj as any)._textField) {
					totalTextObjects++;
				}
				else if((obj as any)._artboard) {
					totalRiveObjects++;
				}
				else if((obj as any)._graphics) {
					totalPixiObjects++;
				}

				// Count physics bodies
				if(obj._body) {
					totalPhysicsBodies++;
				}
			});
		});

		console.log(`%c ┌─ Summary`, 'color:#b19cd9; font-weight:bold;');
		console.log(`%c │ ├─ Groups: ${totalGroups}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Total Objects: ${totalObjects}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Children: ${totalChildren}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Text Objects: ${totalTextObjects}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Rive Objects: ${totalRiveObjects}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Pixi Objects: ${totalPixiObjects}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Animations: ${totalAnimations}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ State Machines: ${totalStateMachines}`, 'color:#b19cd9;');
		console.log(`%c │ └─ Physics Bodies: ${totalPhysicsBodies}`, 'color:#b19cd9;');
		console.log('%c', 'color:#7050a8;');

		// If summary only, skip detailed output
		if(summaryOnly)
		{
			// Engine state info
			console.log('%c ┌─ Engine State', 'color:#9370db; font-weight:bold;');
			console.log(`%c │ ├─ Run State: ${this._runState}`, 'color:#b19cd9;');
			console.log(`%c │ ├─ Canvas Size: ${this._canvasWidth}x${this._canvasHeight}`, 'color:#b19cd9;');
			console.log(`%c │ ├─ Current Scale: ${this._currentCanvasScale.toFixed(3)}`, 'color:#b19cd9;');
			console.log(`%c │ ├─ Physics Enabled: ${this._canvasSettings?.physicsEnabled || false}`, 'color:#b19cd9;');
			console.log(`%c │ └─ Update Listeners: ${this.updateListeners.size}`, 'color:#b19cd9;');

			console.log('%c', 'color:#7050a8;');
			console.log('%c ============== End Debug ============', 'color:#7050a8; font-weight:bold;');
			console.log('%c', 'color:#7050a8; font-weight:bold;');
			return;
		}

		// Iterate through each group
		this._canvasObjects.forEach((objects, group) => {
			console.log(`%c ┌─ Group: "${group}" (${objects.length} objects)`, 'color:#9370db; font-weight:bold;');

			// Sort by z-index for display
			const sorted = [...objects].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

			sorted.forEach((obj, objIndex) => {
				const isLast = objIndex === sorted.length - 1;
				const prefix = isLast ? '└─' : '├─';

				// Gather basic info
				const info:any = {
					uuid: obj.uuid,
					label: obj.label,
					type: obj.constructor.name,
					z: obj.z,
					x: Math.round(obj.x),
					y: Math.round(obj.y),
					width: Math.round(obj.width),
					height: Math.round(obj.height),
					visible: obj.visible,
					enabled: obj.enabled,
				};

				// Check for parent
				if(obj.parent) {
					info.parent = obj.parent.label;
				}

				// Check for specific object types and their states
				if((obj as any)._textField) {
					// CanvasTextObject
					info.text = (obj as any)._textField.text?.substring(0, 30) + ((obj as any)._textField.text?.length > 30 ? '...' : '');
					info.pixiLayer = (obj.defObj as any).pixiLayer || 'ABOVE';
				}
				else if((obj as any)._graphics) {
					// CanvasPixiShapeObj
					info.pixiLayer = (obj.defObj as any).pixiLayer || 'ABOVE';
					info.bgColor = (obj.defObj as any).bgColor;
				}
				else if((obj as any)._artboard) {
					// CanvasRiveObj
					info.filePath = (obj.defObj as any).filePath;
					info.artboardName = (obj as any)._artboard.name;
					info.stateMachine = (obj as any)._stateMachine?.name;
				}

				// Check for physics body
				if(obj._body) {
					info.hasPhysics = true;
					info.bodyPosition = `(${Math.round(obj._body.position.x)}, ${Math.round(obj._body.position.y)})`;
				}

				// Log the object
				console.log(`%c │ ${prefix} [${objIndex}] ${info.type}`, 'color:#b19cd9; font-weight:bold;', info);

				// Check for children
				if((obj as any).children && (obj as any).children.length > 0) {
					const children = (obj as any).children;
					console.log(`%c │   │ ▸ Children: ${children.length}`, 'color:#d8bfd8;');

					children.forEach((child:any, childIndex:number) => {
						const childIsLast = childIndex === children.length - 1;
						const childPrefix = childIsLast ? '└─' : '├─';

						const childInfo:any = {
							label: child.label || child.uuid,
							type: child.constructor.name,
							z: child.z,
							x: Math.round(child.x || 0),
							y: Math.round(child.y || 0),
							visible: child.visible,
						};

						// Check if child is a text object
						if((child as any)._textField) {
							childInfo.text = (child as any)._textField.text?.substring(0, 20) + ((child as any)._textField.text?.length > 20 ? '...' : '');
						}

						console.log(`%c │   │   ${childPrefix} [${childIndex}]`, 'color:#dda0dd;', childInfo);
					});
				}

				// Check for Rive animations
				if((obj as any)._animations && (obj as any)._animations.length > 0) {
					console.log(`%c │   │ ▸ Animations: ${(obj as any)._animations.length}`, 'color:#d8bfd8;');
					(obj as any)._animations.forEach((anim:any, animIndex:number) => {
						console.log(`%c │   │   ├─ [${animIndex}] ${anim.name || 'unnamed'}`, 'color:#dda0dd;', {
							playing: anim.instance?.isPlaying,
							looping: anim.instance?.loopValue,
						});
					});
				}

				// Check for Rive state machine
				if((obj as any)._stateMachine) {
					const sm = (obj as any)._stateMachine;
					console.log(`%c │   │ ▸ State Machine: ${sm.name}`, 'color:#d8bfd8;');

					// Show inputs
					if(sm.inputCount > 0) {
						console.log(`%c │   │   ▸ Inputs: ${sm.inputCount}`, 'color:#e6c9e6;');
						for(let i = 0; i < sm.inputCount; i++) {
							const input = sm.input(i);
							console.log(`%c │   │     ├─ ${input.name}: ${input.value}`, 'color:#f0e6f0;');
						}
					}
				}
			});

			console.log('%c │', 'color:#9370db;');
		});

		// Engine state info
		console.log('%c ┌─ Engine State', 'color:#9370db; font-weight:bold;');
		console.log(`%c │ ├─ Run State: ${this._runState}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Canvas Size: ${this._canvasWidth}x${this._canvasHeight}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Current Scale: ${this._currentCanvasScale.toFixed(3)}`, 'color:#b19cd9;');
		console.log(`%c │ ├─ Physics Enabled: ${this._canvasSettings?.physicsEnabled || false}`, 'color:#b19cd9;');
		console.log(`%c │ └─ Update Listeners: ${this.updateListeners.size}`, 'color:#b19cd9;');

		console.log('%c', 'color:#7050a8;');
		console.log('%c ===== End Debug =====', 'color:#7050a8; font-weight:bold;');
		console.log('%c <=--- ', 'color:#7050a8; font-weight:bold;');
		console.log('%c', 'color:#7050a8; font-weight:bold;');
	}

	public Dispose()
	{
		this._runState = CANVAS_ENGINE_RUN_STATE.STOPPED;
		if (this._engine)
		{

			Matter.Events.off(this._engine, "collisionStart");
			Matter.World.clear(this._engine.world, false);
			Matter.Engine.clear(this._engine);
		}

		this._canvasObjects.forEach((objs) => objs.forEach((o) => o.Dispose()));
		this._canvasObjects.clear();

		if (this._animationFrameId && this._riveInstance)
		{
			this._riveInstance.cancelAnimationFrame(this._animationFrameId);
			this._animationFrameId = null;
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

		if (this._riveInstance) this._riveInstance = null;
		if (this._engine) this._engine = null;
	}

	public SetRefs({
		canvasContainerRef,
		canvasAreaRef,
		canvasRef,
		pixiCanvasRefAbove,
		pixiCanvasRefBelow,
		debugContainerRef,
		runStateLabel,
		fpsLabel,
		fpsSpinner,
	}: {
		canvasContainerRef: HTMLDivElement;
		canvasAreaRef: HTMLDivElement;
		canvasRef: HTMLCanvasElement;
		pixiCanvasRefAbove?: HTMLCanvasElement;
		pixiCanvasRefBelow?: HTMLCanvasElement;
		debugContainerRef?: HTMLDivElement;
		runStateLabel?: HTMLDivElement;
		fpsLabel?: HTMLDivElement;
		fpsSpinner?: HTMLDivElement;
	}) {
		this.canvasContainerRef = canvasContainerRef;
		this.canvasAreaRef = canvasAreaRef;
		this.canvasRef = canvasRef;
		this.pixiCanvasRefAbove = pixiCanvasRefAbove || null;
		this.pixiCanvasRefBelow = pixiCanvasRefBelow || null;
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
	pixiCanvasRefAbove:React.RefObject<HTMLCanvasElement>;
	pixiCanvasRefBelow:React.RefObject<HTMLCanvasElement>;
	canvasObjects:Map<string, BaseCanvasObj[]>;
	debugContainerRef:React.RefObject<HTMLDivElement>;
	addCanvasObjects:(objs: BaseCanvasObj | BaseCanvasObj[] | RiveObjectsSet, group?: string) => void;
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
	const pixiCanvasRefAbove = useRef<HTMLCanvasElement>(null!);
	const pixiCanvasRefBelow = useRef<HTMLCanvasElement>(null!);
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
				<div id="canvasContainer" ref={canvasContainerRef} style={{ position: "relative", borderTop: `${canvasSettings.borderWidth}px solid ${canvasSettings.borderColor}`, borderBottom: `${canvasSettings.borderWidth}px solid ${canvasSettings.borderColor}`, width: "100%", height: "100%", margin: "0 auto", overflow: "hidden" }}>
					<div id="pixiCanvasContainer"  /*style={{ position: "absolute", top: 0, left: 0 }}*/ >
						<canvas id="pixiCanvasAbove" ref={pixiCanvasRefAbove} style={{ position: "absolute", top: 0, left: 0, zIndex:3 }} />
						<canvas id="riveCanvas" ref={canvasRef} style={{ border: "1px solid black", position:"absolute", zIndex: 2}} />
						<canvas id="pixiCanvasBelow" ref={pixiCanvasRefBelow} style={{ position: "absolute", top: 0, left: 0, zIndex:1 }} />
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
				canvasContainerRef:canvasContainerRef.current!,
				canvasAreaRef:canvasAreaRef.current!,
				canvasRef:canvasRef.current!,
				pixiCanvasRefAbove:pixiCanvasRefAbove.current!,
				pixiCanvasRefBelow:pixiCanvasRefBelow.current!,
				debugContainerRef:debugContainerRef.current!,
				runStateLabel:runStateLabel.current!,
				fpsLabel:fpsRef.current!,
				fpsSpinner:fpsSpinner.current!,
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
		pixiCanvasRefAbove,
		pixiCanvasRefBelow,
		debugContainerRef,
		canvasObjects: CanvasEngine.get().CanvasObjects,
		addCanvasObjects: CanvasEngine.get().AddCanvasObjects.bind(CanvasEngine.get()),
		ToggleRunState,
		SetRunState,
		RunState,
		runStateLabel,
		fpsRef:fpsRef
	};
}
