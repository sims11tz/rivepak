import RiveCanvas, { File as RiveFile, Artboard, Renderer } from "@rive-app/webgl-advanced";
import { RiveAnimationObject } from "../canvasObjects/RiveAnimationObj";
import { CanvasRiveObj } from "../canvasObjects/CanvasRiveObj";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";
import { CanvasObjectDef, CanvasObjectEntity } from "../canvasObjects/CanvasObj";
import { CanvasEngine } from "../useCanvasEngine";

export enum RIVE_OBJECT_TYPE
{
	ANIMATION = "ANIMATION",
	PHYSICS = "PHYSICS",
}

export interface RiveObjectDef extends CanvasObjectDef
{
	filePath: string;
	objectType: RIVE_OBJECT_TYPE;
	artboardName: string;
	classType?: new (def: RiveObjectDef, artboard: Artboard) => CanvasRiveObj;
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

			window.addEventListener("mousemove", this.SetMouseGlobalPos);


		} catch (error) { console.error("Failed to initialize Rive:", error); }
	}

	public async CreateRiveObj(riveObjDefs: RiveObjectDef | RiveObjectDef[]): Promise<CanvasRiveObj[]>
	{
		const defs: RiveObjectDef[] = [];
		if (Array.isArray(riveObjDefs))
		{
			riveObjDefs.forEach(def => { for (let i = 0; i < (def.count ?? 1); i++) defs.push(def); });
		}
		else
		{
			for (let i = 0; i < (riveObjDefs.count ?? 1); i++) defs.push(riveObjDefs);
		}

		const filePaths = defs.map((def) => def.filePath);
		const loadPromise = new Promise<{ filename: string; riveFile: RiveFile | null }[]>((resolve) =>
			this.loadRiveFiles(filePaths, resolve)
		);

		const loadedFiles = await loadPromise;

		const riveFileMap = new Map<string, RiveFile | null>();
		loadedFiles.forEach(({ filename, riveFile }) => {
			riveFileMap.set(filename, riveFile);
		});

		const riveObjects = defs.map((def) =>
		{
			const riveFile = riveFileMap.get(def.filePath);
			if (!riveFile) { console.error(`Failed to create Rive object for ${def.filePath}, file did not load.`); return null; }

		//debug name artboards
			//for (let x = 0; x < riveFile.artboardCount(); x++) { const artboard = riveFile.artboardByIndex(x); if (artboard) { console.log(`Artboard ${x}:`, artboard.name); } }

			let artboard: Artboard | null = riveFile.artboardByName(def.artboardName);
			if(artboard) artboard.devicePixelRatioUsed = window.devicePixelRatio;
			if (!artboard)
			{
				if(riveFile.artboardCount() > 0)
				{
					artboard = riveFile.artboardByIndex(0);
					if (!artboard)
					{
						console.error(`Artboard ${def.artboardName} not found in ${def.filePath}`); return null;
					}
				}
			}

			let canvasRiveObj: CanvasRiveObj | null = null;
			if(def.classType)
			{
				canvasRiveObj = new def.classType(def, artboard);
			}
			else
			{
				switch (def.objectType)
				{
					case RIVE_OBJECT_TYPE.ANIMATION: canvasRiveObj = new RiveAnimationObject(def,artboard);
					case RIVE_OBJECT_TYPE.PHYSICS: canvasRiveObj = new RivePhysicsObject(def,artboard);
				}
			}

			canvasRiveObj?.ApplyResolutionScale(CanvasEngine.get().CurrentCanvasScale);

			return canvasRiveObj;
		});

		return riveObjects.filter(Boolean) as CanvasRiveObj[];
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

	public CanvasToArtboard(entity: CanvasObjectEntity, interactiveCheck:boolean=false): { x: number, y: number }
	{
		const width = entity.width ?? 1;
		const height = entity.height ?? 1;

		const canvasX = this._mousePos.x;
		const canvasY = this._mousePos.y;

		const objLeft = (entity.x ?? 0) - (width / 2);
		const objTop = (entity.y ?? 0) - (height / 2);

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

		return { x: artboardX, y: artboardY };
	}

	public WindowToArtboard(entity: CanvasObjectEntity, interactiveCheck:boolean=false): { x: number, y: number }
	{
		const width = entity.width ?? 1;
		const height = entity.height ?? 1;

		const objLeft = (entity.x ?? 0) - (width / 2);
		const objTop = (entity.y ?? 0) - (height / 2);

		// Get absolute window mouse position
		const mouseX = this._mouseGlobalPos.x;
		const mouseY = this._mouseGlobalPos.y;

		// Get canvas bounds relative to the screen
		if (!this._canvasGlobalBounds && this._canvas) {
			this._canvasGlobalBounds = this._canvas.getBoundingClientRect();
		}

		const offsetX = this._canvasGlobalBounds?.left ?? 0;
		const offsetY = this._canvasGlobalBounds?.top ?? 0;

		const canvasX = mouseX - offsetX;
		const canvasY = mouseY - offsetY;

		// Convert to local entity space
		const localX = canvasX - objLeft;
		const localY = canvasY - objTop;

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
		console.log("RiveController - Dispose !!!!!!! ");

		window.removeEventListener("mousemove", this.SetMouseGlobalPos);

		try
		{
			this._riveInstance!.cleanup();
		}
		catch (error)
		{
			//console.log("RiveController - Error cleaning up Rive Renderer:", error);
		}

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
