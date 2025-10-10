import RiveCanvas, { File as RiveFile, Artboard, Renderer, ViewModel, ViewModelInstance } from "@rive-app/webgl2-advanced";
import { RiveAnimationObject } from "../canvasObjects/RiveAnimationObj";
import { CanvasRiveObj } from "../canvasObjects/CanvasRiveObj";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";
import { CanvasObjectDef, CanvasObjectEntity } from "../canvasObjects/_baseCanvasObj";
import { CanvasEngine, ResizeCanvasObj } from "../useCanvasEngine";
import * as PIXI from "pixi.js";
import { CanvasEngineResizePubSub } from "../CanvasEngineEventBus";
import RivePakUtils from "../RivePakUtils";

export enum RIVE_OBJECT_TYPE
{
	ANIMATION = "ANIMATION",
	PHYSICS = "PHYSICS",
}

export interface RiveObjectDef extends CanvasObjectDef
{
	filePath:string;
	objectType:RIVE_OBJECT_TYPE;
	artboardName:string;
	id?:string;
	onClickCallback?:(event: MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj:CanvasRiveObj) => void;
	onHoverCallback?:(sourceObj:CanvasRiveObj) => void;
	onHoverOutCallback?:(sourceObj:CanvasRiveObj) => void;
	classType?: new (def:RiveObjectDef, artboard:Artboard) => CanvasRiveObj;
}

export class RiveObjectsSet
{
	public objects:CanvasRiveObj[];

	constructor({
		objects
	}: {
		objects:CanvasRiveObj[];
	}) {
		this.objects = objects;
	}

	public GetObjectByIdx(idx:number): CanvasRiveObj | null
	{
		if (!this.objects || idx < 0 || idx >= this.objects.length) { return null; }
		return this.objects[idx];
	}

	public GetObjectById(id:string):CanvasRiveObj | null
	{
		if (!this.objects) { return null; }
		const objs = this.objects.find((o) => o.id === id);
		return objs || null;
	}

	public GetObjectByArtboardName(artboardByName:string):CanvasRiveObj | null
	{
		if (!this.objects) { return null; }
		const objs = this.objects.find((o) => o.artboardName === artboardByName);
		return objs || null;
	}

	public GetObjectByFilePath(filePath:string):CanvasRiveObj | null
	{
		if (!this.objects) { return null; }
		const objs = this.objects.find((o) => o.filePath === filePath);
		return objs || null;
	}
}

export class RiveController
{
	static myInstance: RiveController; static get() { if (RiveController.myInstance == null) { RiveController.myInstance = new RiveController(); } return this.myInstance; }

	private _riveInstance: Awaited<ReturnType<typeof RiveCanvas>> | null = null;
	public get Rive() { return this._riveInstance!; }

	private _riveRenderer:Renderer | null = null;
	public get Renderer() { return this._riveRenderer!; }

	private _canvas:HTMLCanvasElement | null = null;
	public get Canvas() { return this._canvas!; }
	private _canvasBounds:DOMRect | null = null;
	public get CanvasBounds() { return this._canvasBounds!; }
	private _canvasGlobalBounds:DOMRect | null = null;
	public get CanvasGlobalBounds() { return this._canvasGlobalBounds!; }

	private _riveObjectsSet:RiveObjectsSet | null = null;
	public get RiveObjectsSet() { return this._riveObjectsSet!; }

	private _initCalled: boolean = false;
	private _cache: Map<string, Uint8Array> = new Map();

	private _disposed:boolean = false;

	private async fetchAndHash(url: string): Promise<Uint8Array>
	{
		const res = await fetch(url, { cache: "no-store" });
		const bytes = new Uint8Array(await res.arrayBuffer());
		// SHA-256
		const digest = await crypto.subtle.digest("SHA-256", bytes);
		const hashHex = [...new Uint8Array(digest)]
			.map(b => b.toString(16).padStart(2, "0"))
			.join("");
		console.log("🔎 RIVE.WASM URL:", res.url);
		console.log("🔎 RIVE.WASM SHA-256:", hashHex);
		return bytes;
	}

	private _debug:boolean = false;

	private _unsubscribeResize: (() => void) | null = null;
	public async Init(canvas:HTMLCanvasElement)
	{
		if (this._initCalled) { return; }
		this._initCalled = true;
		this._disposed = false; // Reset disposed flag on re-init

		try
		{
			const debugLoadingWASM = this._debug || false;
			if(debugLoadingWASM)
			{
				console.log('');
				console.log('..<RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE>..');
			}

			this._riveInstance = await RiveCanvas({ locateFile: (file) => `/rive/${file}` });
			this._riveRenderer = this._riveInstance.makeRenderer(canvas, true);

			const isProbablyWebGL = typeof (this._riveRenderer as any).clear === 'function' && typeof (this._riveRenderer as any).flush === 'function' && true;
			if(debugLoadingWASM)
			{
				console.log('isProbablyWebGL :', isProbablyWebGL); // true/false is fine
				console.log('Rive name (minified):', this._riveRenderer?.constructor?.name); // "a" is fine
			}

			this._canvas = canvas;
			this._canvasBounds = this._canvas.getBoundingClientRect();
			if(debugLoadingWASM)
			{
				console.log("🚀 Rive Renderer Type:", this._riveRenderer?.constructor.name);

				const gl = (this._riveRenderer as any)?.gl as WebGL2RenderingContext | WebGLRenderingContext | undefined;
				if(gl)
				{
					console.log("✅ WebGL active");
					console.log("GL VERSION:", gl.getParameter(gl.VERSION));
					console.log("GLSL:", gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
					console.log("GPU VENDOR:", gl.getParameter(gl.VENDOR));
					console.log("GPU RENDERER:", gl.getParameter(gl.RENDERER));
					console.log("MAX_TEXTURE_SIZE:", gl.getParameter(gl.MAX_TEXTURE_SIZE));
					console.log("ANTIALIAS:", gl.getContextAttributes()?.antialias);
				} else console.warn("⚠️ No GL on renderer; if feathers look boxy you’re on a fallback/canvas path.");
			}

//resizeDrawingSurfaceToCanvas
			canvas.addEventListener("webglcontextlost", (e) => {
				console.warn("🧯 WebGL context lost", e);
				e.preventDefault();
			});
			canvas.addEventListener("webglcontextrestored", () => {
				console.log("🔁 WebGL context restored");
			});

			if(debugLoadingWASM)
			{
				const wasmBytes = await this.fetchAndHash('/rive/rive.wasm');
				console.log('########## wasmBytes.length :', wasmBytes.length);
			}

			//const resyncDpr = () =>
			//{
			//	const dpr = Math.max(1, window.devicePixelRatio || 1);
			//	const cssW = this._canvas!.clientWidth;
			//	const cssH = this._canvas!.clientHeight;

			//	// Only update if changed to avoid extra reallocs
			//	const w = Math.max(1, Math.floor(cssW * dpr));
			//	const h = Math.max(1, Math.floor(cssH * dpr));
			//	if(this._canvas!.width !== w || this._canvas!.height !== h)
			//	{
			//		this._canvas!.width  = w;
			//		this._canvas!.height = h;
			//		(this._riveRenderer as any)?.setDevicePixelRatio?.(dpr);
			//		console.log(' **** resyncDpr() Appply dpr : '+dpr+'   canvas size: '+w+'x'+h);
			//	}
			//};

			//resyncDpr();
			//this._unsubscribeResize = CanvasEngineResizePubSub.Subscribe(resyncDpr);

			// react to zoom/DPR changes
			//const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
			//mq.addEventListener?.('change', resyncDpr);
			//this._unsubscribeResize = CanvasEngineResizePubSub.Subscribe(resyncDpr);


			window.addEventListener("mousemove", this.SetMouseGlobalPos);
		} catch (error) { console.error("Failed to initialize Rive:", error); }
	}

	//public SetSize(width:number, height:number, dprIn:number=-1)
	//{
	//	if(this._canvas != null && !this._disposed)
	//	{
	//		this._canvas?.setAttribute("width", `${width}`);
	//		this._canvas?.setAttribute("height", `${height}`);

	//		const dpr = dprIn > 0 ? dprIn : Math.max(1, window.devicePixelRatio || 1);
	//		(this._riveRenderer as any)?.setDevicePixelRatio?.(dpr);
	//		this._canvasBounds = this._canvas!.getBoundingClientRect();
	//	}
	//}

	public SetSize(width:number, height:number, dprIn:number=-1)
	{
		if (!this._canvas || this._disposed) return;

		// CSS size (layout)
		this._canvas.style.width  = `${width}px`;
		this._canvas.style.height = `${height}px`;

		let dpr = dprIn > 0 ? dprIn : Math.max(1, window.devicePixelRatio || 1);

		// Backing store = CSS × DPR for crisp rendering
		let w = Math.max(1, Math.floor(width * dpr));
		let h = Math.max(1, Math.floor(height * dpr));

		// Always set size if canvas is uninitialized (width/height = 0) or if dimensions changed
		if (this._canvas.width !== w || this._canvas.height !== h || this._canvas.width === 0 || this._canvas.height === 0)
		{
			this._canvas.width = w;
			this._canvas.height = h;

			// Don't call setDevicePixelRatio - backing store already has DPR baked in
			// Rive will auto-detect from canvas.width vs canvas.style.width ratio

			//console.log('%cRC.resize(*) ', 'color:#dc9d67; font-weight:bold;', 'CSS:', width, height, 'ATTR:', w, h, 'DPR:', dpr, '(no setDevicePixelRatio call)');
		}
		this._canvasBounds = this._canvas.getBoundingClientRect();
	}

	public async CreateRiveObj(riveObjDefs:RiveObjectDef | RiveObjectDef[]):Promise<RiveObjectsSet>
	{
		const debug = this._debug || false;
		if(debug) console.log('%c RiveController: CreateRiveObj() ','color:#00FF88');

		const defs:RiveObjectDef[] = [];
		if(Array.isArray(riveObjDefs))
		{
			riveObjDefs.forEach(def => { for (let i = 0; i < (def.count ?? 1); i++) defs.push(def); });
		}
		else
		{
			for (let i = 0; i < (riveObjDefs.count ?? 1); i++) defs.push(riveObjDefs);
		}
		if(debug) console.log('%c RiveController: CreateRiveObj() defs:','color:#00FF88', defs);

		const filePaths = defs.map((def) => def.filePath);
		const loadPromise = new Promise<{ filename: string; riveFile: RiveFile | null }[]>((resolve) => this.loadRiveFiles(filePaths, resolve) );

		const loadedFiles = await loadPromise;
		const riveFileMap = new Map<string, RiveFile | null>();
		loadedFiles.forEach(({ filename, riveFile }) => { riveFileMap.set(filename, riveFile); });

		const riveObjects = defs.map((def) =>
		{
			const riveFile = riveFileMap.get(def.filePath);
			if(!riveFile)
			{
				console.error(`Failed to create Rive object for ${def.filePath}`);
				return null;
			}

			if(debug)
			{
				console.log("......RIVE CONTROLLER... "+def.artboardName+" -- "+def.filePath);
				console.log("ArtboardCount:", riveFile.artboardCount());
				console.log("enums:", riveFile.enums());

				console.log("artboards:", riveFile.artboardCount());
				for (let i = 0; i < riveFile.artboardCount(); i++)
				{
					const artboard = riveFile.artboardByIndex(i);
					console.log(`Artboard ${i}:`, artboard.name);
				}
			}

			let artboard = riveFile.artboardByName(def.artboardName) || riveFile.artboardByIndex(0);
			if(!artboard)
			{
				console.error(`Artboard not found in ${def.filePath}`);
				return null;
			}
			// Artboard needs to know actual DPR when renderer auto-detects
			artboard.devicePixelRatioUsed = window.devicePixelRatio;


			let canvasRiveObj:CanvasRiveObj | null = null;
			if(def.classType)
			{
				canvasRiveObj = new def.classType(def, artboard);
			}
			else
			{
				switch (def.objectType)
				{
					case RIVE_OBJECT_TYPE.ANIMATION: console.log('creating .ANIMATION'); canvasRiveObj = new RiveAnimationObject(def, artboard); break;
					case RIVE_OBJECT_TYPE.PHYSICS: console.log('creating .PHYSICS'); canvasRiveObj = new RivePhysicsObject(def, artboard); break;
				}
			}

			canvasRiveObj?.ApplyResolutionScale(CanvasEngine.get().CurrentCanvasScale);

			if(debug)
			{
				console.log('');
				console.log('%c RiveController..... VIEW MODEL SHIT !!!! ','color:#00FF88');
				console.log('%c riveFile.enums :','color:#00FF88', riveFile.enums());
				console.log('%c riveFile.viewModelCount :','color:#00FF88', riveFile.viewModelCount());
			}

			if (riveFile.viewModelCount && riveFile.viewModelCount() > 0)
			{
				const vmName = undefined; // keep your override if you want
				const vm = RivePakUtils.PickBestViewModel(riveFile, artboard, vmName);
				let vmi:ViewModelInstance | null = null;

				if(vm)
				{
					if(debug)
					{
						console.log("VM chosen:", vm?.name);
						try
						{
							console.log("VM instance names:", (RivePakUtils._isFn(vm, "getInstanceNames") ? (vm as any).getInstanceNames() : "(n/a)"));
						} catch {}
					}

					// Try to get the first instance name if available
					let instanceName:string | undefined = undefined;
					try
					{
						const instanceNames = RivePakUtils._isFn(vm, "getInstanceNames") ? (vm as any).getInstanceNames() : null;
						if(instanceNames && Array.isArray(instanceNames) && instanceNames.length > 0)
						{
							instanceName = instanceNames[0];
							if(debug) console.log("Using VM instance name:", instanceName);
						}
					} catch {}

					vmi = RivePakUtils.MakeBestVMI(vm, artboard, instanceName);
					if(vmi && typeof (artboard as any).bindViewModelInstance === "function")
					{
						(artboard as any).bindViewModelInstance(vmi);
					}
				}
				//RivePakUtils.DumpRiveDiagnostics(riveFile, artboard, vm, vmi);

				if(vmi)
				{
					canvasRiveObj?.SetViewModelInstance(vmi);

					// CRITICAL FIX: Also bind VMI to State Machine if it exists
					// The state machine needs the VMI bound to react to ViewModel enum changes
					const sm = (canvasRiveObj as any)?._stateMachine;
					if(debug)
					{
						console.log("🎯 Checking State Machine binding...");
						console.log("  State Machine exists?", !!sm);
						console.log("  State Machine name:", sm?.name);
						console.log("  bindViewModelInstance exists?", typeof sm?.bindViewModelInstance === "function");
					}

					if(sm && typeof sm.bindViewModelInstance === "function")
					{
						if(debug) console.log("  ✅ Binding VMI to State Machine:", sm.name);
						sm.bindViewModelInstance(vmi);
						if(debug) console.log("  ✅ VMI bound successfully!");
					}
					else
					{
						if(debug) console.log("  ❌ Cannot bind VMI to State Machine");
					}
				}
			}
			else
			{
				if(debug) console.log('%c no view model count... ZERO !','color:#C586C0');
			}

			canvasRiveObj.InitRiveObject();

			return canvasRiveObj;
		})
		.filter((obj): obj is CanvasRiveObj => obj !== null);

		this._riveObjectsSet = new RiveObjectsSet({ objects: riveObjects });

		return this._riveObjectsSet;
	}

	private getVMForArtboard(file:RiveFile, artboard:Artboard, name?:string): ViewModel | null
	{
		const debug = this._debug || false;
		if(debug) console.log('----%---getVMForArtboard -- file:'+file.defaultArtboard.name+',  artboard:'+artboard.name+'   name:'+name);
		if(name && typeof file.viewModelByName === "function")
		{
			if(debug) console.log('----%---getVMForArtboard 1');
			const vm = file.viewModelByName(name);
			if(vm)
			{
				if(debug) console.log('----%---getVMForArtboard 2');
				return vm;
			}
		}

		if(typeof file.defaultArtboardViewModel === "function")
		{
			if(debug) console.log('----%---getVMForArtboard 3');
			const vm = file.defaultArtboardViewModel(artboard);
			if(vm)
			{
				if(debug) console.log('----%---getVMForArtboard 4');
				return vm;
			}
		}

		if(typeof file.viewModelCount === "function" && file.viewModelCount() > 0)
		{
			if(debug) console.log('----%---getVMForArtboard 5');
			return file.viewModelByIndex?.(0) ?? null;
		}

		if(debug) console.log('----%---getVMForArtboard 6');
		return null;
	}

	private makeVMI(vm:ViewModel, artboard:Artboard, vmName:string=""):ViewModelInstance | null
	{
		if(vmName != "") return vm?.instanceByName(vmName);
		return vm?.defaultInstance?.() ?? vm?.instance?.() ?? null;
	}

	private async loadRiveFiles( filenames: string | string[], callback: (data: Array<{ filename: string; riveFile: RiveFile | null }>, error?: Error) => void)
	{
		const originalFiles = Array.isArray(filenames) ? filenames : [filenames];
		const uniqueFilesToLoad = Array.from(new Set(originalFiles));
		const uniqueLoadedFiles = new Map<string, RiveFile | null>();

		await Promise.all(
			uniqueFilesToLoad.map(async (filePath: string) => {
				try
				{
					if (this._cache.has(filePath))
					{
						const riveFile = await this._riveInstance!.load(this._cache.get(filePath)!);
						uniqueLoadedFiles.set(filePath, riveFile);
						return;
					}

					const response = await fetch(filePath);
					const bytes = await response.arrayBuffer();
					const uint8Array = new Uint8Array(bytes);

					this._cache.set(filePath, uint8Array);

					const riveFile = await this._riveInstance!.load(uint8Array);
					uniqueLoadedFiles.set(filePath, riveFile);
				}
				catch (error)
				{
					console.error(`RiveController - Failed to load ${filePath}`, error);
					uniqueLoadedFiles.set(filePath, null);
				}
			})
		);

		const loadedFiles: Array<{ filename: string; riveFile: RiveFile | null }> = originalFiles.map((filePath) => ({
			filename: filePath,
			riveFile: uniqueLoadedFiles.get(filePath) || null,
		}));

		callback(loadedFiles);
	}

	private _mousePos = { x: 0, y: 0 };
	private _mouseGlobalPos = { x: 0, y: 0 };
	private _mouseDown:boolean = false;
	public SetMousePos(x: number, y: number)
	{
		this._mousePos.x = x;
		this._mousePos.y = y;
	}

	public SetMouseGlobalPos = (e: MouseEvent) =>
	{
		this._mouseGlobalPos.x = e.clientX;
		this._mouseGlobalPos.y = e.clientY;
		this._canvasGlobalBounds = this._canvas?.getBoundingClientRect() ?? null;
	}

	public get MousePos(): { x: number, y: number }
	{
		return this._mousePos;
	}
	public SetMouseDown(down: boolean)
	{
		this._mouseDown = down;
	}
	public get MouseDown(): boolean
	{
		return this._mouseDown;
	}

	public CanvasToArtboard(entity:CanvasObjectEntity, interactiveCheck:boolean=false): { x: number, y: number }
	{
		const width = entity.width ?? 1;
		const height = entity.height ?? 1;

		const canvasX = this._mousePos.x;
		const canvasY = this._mousePos.y;

		const objLeft = (entity.x ?? 0);
		const objTop = (entity.y ?? 0);

		const localX = canvasX - objLeft;
		const localY = canvasY - objTop;

		const normX = localX / width;
		const normY = localY / height;

		let artboardX = normX * (entity.width ?? 1);
		let artboardY = normY * (entity.height ?? 1);

		if(!interactiveCheck && (entity.riveInteractiveLocalOnly == undefined || entity.riveInteractiveLocalOnly == false))
		{
			if(artboardX < 0) artboardX = 1;
			if(artboardY < 0) artboardY = 1;
			if(artboardX > entity.width!) artboardX = entity.width! - 1;
			if(artboardY > entity.height!) artboardY = entity.height! - 1;
		}

		if(entity.xScale !== 0) artboardX /= entity.xScale ?? 1;
		if(entity.yScale !== 0) artboardY /= entity.yScale ?? 1;

		if(entity.resolutionScale != -1)
		{
			artboardX /= entity.resolutionScale!;
			artboardY /= entity.resolutionScale!;
		}

		return { x: artboardX, y: artboardY };
	}

	public WindowToArtboard(entity: CanvasObjectEntity, interactiveCheck:boolean=false): { x: number, y: number }
	{
		const width = entity.width ?? 1;
		const height = entity.height ?? 1;

		const objLeft = (entity.x ?? 0);
		const objTop = (entity.y ?? 0);

		const mouseX = this._mouseGlobalPos.x;
		const mouseY = this._mouseGlobalPos.y;

		if (!this._canvasGlobalBounds && this._canvas)
		{
			this._canvasGlobalBounds = this._canvas.getBoundingClientRect();
		}

		const offsetX = this._canvasGlobalBounds?.left ?? 0;
		const offsetY = this._canvasGlobalBounds?.top ?? 0;

		const canvasX = mouseX - offsetX;
		const canvasY = mouseY - offsetY;

		let localX = 0;
		let localY = 0;

		if(entity.resolutionScale != -1)
		{
			localX = (canvasX / entity.resolutionScale!) - objLeft;
			localY = (canvasY / entity.resolutionScale!) - objTop;
		}
		else
		{
			localX = canvasX - objLeft;
			localY = canvasY - objTop;
		}

		const normX = localX / width;
		const normY = localY / height;

		let artboardX = normX * width;
		let artboardY = normY * height;

		if(!interactiveCheck && (entity.riveInteractiveLocalOnly == undefined || entity.riveInteractiveLocalOnly == false))
		{
			if(artboardX < 0) artboardX = 1;
			if(artboardY < 0) artboardY = 1;
			if(artboardX > entity.width!) artboardX = entity.width! - 1;
			if(artboardY > entity.height!) artboardY = entity.height! - 1;
		}

		if(entity.xScale !== 0) artboardX /= entity.xScale ?? 1;
		if(entity.yScale !== 0) artboardY /= entity.yScale ?? 1;

		return { x: artboardX, y: artboardY };
	}

	public Dispose()
	{
		this._disposed = true;

		window.removeEventListener("mousemove", this.SetMouseGlobalPos);
		try
		{
			this._riveInstance!.cleanup();
		}
		catch (error)
		{
			//console.log("RiveController - Error cleaning up Rive Renderer:", error);
		}

		if (this._unsubscribeResize !== null)
		{
			this._unsubscribeResize();
			this._unsubscribeResize = null;
		}

		this._riveObjectsSet = null
		this._riveRenderer = null;
		this._canvas = null;
		this._canvasBounds = null;
		this._cache.clear();
		this._riveInstance = null;
		this._initCalled = false;
		this._mousePos = { x: 0, y: 0 };
		this._mouseDown = false;
	}
}
