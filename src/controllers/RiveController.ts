import RiveCanvas, { File as RiveFile, Artboard, Renderer, ViewModel, ViewModelInstance } from "@rive-app/webgl-advanced";
import { RiveAnimationObject } from "../canvasObjects/RiveAnimationObj";
import { CanvasRiveObj } from "../canvasObjects/CanvasRiveObj";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";
import { CanvasObjectDef, CanvasObjectEntity } from "../canvasObjects/CanvasObj";
import { CanvasEngine } from "../useCanvasEngine";
import * as PIXI from "pixi.js";

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
	private _canvasGlobalBounds:DOMRect | null = null;
	public get CanvasBounds() { return this._canvasBounds!; }
	public get CanvasGlobalBounds() { return this._canvasBounds!; }

	private _riveObjectsSet:RiveObjectsSet | null = null;
	public get RiveObjectsSet() { return this._riveObjectsSet!; }

	private _initCalled: boolean = false;
	private _cache: Map<string, Uint8Array> = new Map();

	public async Init(canvas: HTMLCanvasElement)
	{
		if (this._initCalled) { return; }
		this._initCalled = true;

		try
		{
			this._riveInstance = await RiveCanvas({ locateFile: (file) => `/rive/${file}` });
			this._riveRenderer = this._riveInstance.makeRenderer(canvas);
			this._canvas = canvas;
			this._canvasBounds = this._canvas.getBoundingClientRect();
			console.log("🚀 Rive Renderer Type:", this._riveRenderer?.constructor.name);

			//const dpr = window.devicePixelRatio || 1;
			//canvas.width = canvas.clientWidth * dpr;
			//canvas.height = canvas.clientHeight * dpr;

			//// If your renderer supports setBounds or setDevicePixelRatio, do it:
			//this._riveRenderer!.align(
			//	0, 0, canvas.clientWidth, canvas.clientHeight,
			//	this._riveInstance.Fit.contain,
			//	this._riveInstance.Alignment.center
			//);
			//this._riveRenderer!.setDevicePixelRatio(dpr);

			window.addEventListener("mousemove", this.SetMouseGlobalPos);
		} catch (error) { console.error("Failed to initialize Rive:", error); }
	}

	public SetSize(width: number, height: number)
	{
		this._canvas?.setAttribute("width", `${width}`);
		this._canvas?.setAttribute("height", `${height}`);

		this._canvasBounds = this._canvas!.getBoundingClientRect();
	}

	public async CreateRiveObj(riveObjDefs:RiveObjectDef | RiveObjectDef[]):Promise<RiveObjectsSet>
	{
		const debug = false;

		const defs:RiveObjectDef[] = [];
		if(Array.isArray(riveObjDefs))
		{
			riveObjDefs.forEach(def => { for (let i = 0; i < (def.count ?? 1); i++) defs.push(def); });
		}
		else
		{
			for (let i = 0; i < (riveObjDefs.count ?? 1); i++) defs.push(riveObjDefs);
		}

		const filePaths = defs.map((def) => def.filePath);
		const loadPromise = new Promise<{ filename: string; riveFile: RiveFile | null }[]>((resolve) => this.loadRiveFiles(filePaths, resolve) );

		const loadedFiles = await loadPromise;
		const riveFileMap = new Map<string, RiveFile | null>();
		loadedFiles.forEach(({ filename, riveFile }) => { riveFileMap.set(filename, riveFile); });

		const riveObjects = defs.map((def) =>
		{
			const riveFile = riveFileMap.get(def.filePath);
			if (!riveFile)
			{
				console.error(`Failed to create Rive object for ${def.filePath}`);
				return null;
			}

			if(debug)
			{
				//console.log("......RIVE CONTROLLER");
				//console.log("ArtboardCount:", riveFile.artboardCount());
				//console.log("enums:", riveFile.enums());
			}

			let artboard = riveFile.artboardByName(def.artboardName) || riveFile.artboardByIndex(0);
			if (!artboard)
			{
				console.error(`Artboard not found in ${def.filePath}`);
				return null;
			}
			artboard.devicePixelRatioUsed = window.devicePixelRatio;

			let canvasRiveObj: CanvasRiveObj | null = null;
			if (def.classType)
			{
				canvasRiveObj = new def.classType(def, artboard);
			}
			else
			{
				switch (def.objectType)
				{
					case RIVE_OBJECT_TYPE.ANIMATION: canvasRiveObj = new RiveAnimationObject(def, artboard); break;
					case RIVE_OBJECT_TYPE.PHYSICS: canvasRiveObj = new RivePhysicsObject(def, artboard); break;
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

			if(riveFile.viewModelCount() > 0)
			{
				const vmName = undefined;
				const vm = this.getVMForArtboard(riveFile, artboard, vmName);
				if(debug) console.log('%c vm :','color:#00FF88', vm);
				let vmi:ViewModelInstance | null = null;

				if(vm)
				{
					if(debug)
					{
						console.log('%c ','color:#C586C0');
						console.log('%c lets get vmi :','color:#C586C0');
						console.log('%c vmName:','color:#C586C0', vm.name);
						console.log('%c getInstanceNames('+vm.instanceCount+') :','color:#C586C0',vm.getInstanceNames());
						console.log('%c getProperties('+vm.propertyCount+') :','color:#C586C0',vm.getProperties());
					}
					vmi = this.makeVMI(vm, artboard);
					if(debug) console.log('%c vmi :','color:#C586C0', vmi);
					if(vmi && typeof artboard.bindViewModelInstance === "function")
					{
						artboard.bindViewModelInstance(vmi);
						if(debug) console.log("Bound ViewModelInstance. Properties:", vmi.getProperties?.().map((p:any)=>p.name));
					}
				}

				if(vmi)
				{
					if(debug) console.log('%c HAS VMI:'+vmi.artboard.name,'color:#C586C0');
					canvasRiveObj?.SetViewModelInstance(vmi);
				}
				else
				{
					if(debug) console.log('%c no VMI !','color:#C586C0');
				}
			}

			return canvasRiveObj;
		})
		.filter((obj): obj is CanvasRiveObj => obj !== null);

		this._riveObjectsSet = new RiveObjectsSet({ objects: riveObjects });

		return this._riveObjectsSet;
	}

	private getVMForArtboard(file: RiveFile, artboard: Artboard, name?: string): ViewModel | null
	{
		// try a named VM first (optional)
		if (name && typeof file.viewModelByName === "function")
		{
			const vm = file.viewModelByName(name);
			if (vm) return vm;
		}

		// prefer the artboard's default VM from the editor
		if (typeof file.defaultArtboardViewModel === "function")
		{
			const vm = file.defaultArtboardViewModel(artboard);
			if (vm) return vm;
		}
		// fallback to first VM in file
		if (typeof file.viewModelCount === "function" && file.viewModelCount() > 0)
		{
			return file.viewModelByIndex?.(0) ?? null;
		}

		return null;
	}

	private makeVMI(vm:ViewModel, artboard:Artboard, vmName:string=""):ViewModelInstance | null
	{
		if(vmName != "") return vm?.instanceByName(vmName);

		return vm?.defaultInstance?.()
			?? vm?.instance?.()
			?? null;
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
		window.removeEventListener("mousemove", this.SetMouseGlobalPos);
		try
		{
			this._riveInstance!.cleanup();
		}
		catch (error)
		{
			//console.log("RiveController - Error cleaning up Rive Renderer:", error);
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
