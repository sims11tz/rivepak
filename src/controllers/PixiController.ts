import * as PIXI from "pixi.js";
import { CanvasObjectDef } from "../canvasObjects/CanvasObj";
import { RiveController } from "./RiveController";

export enum PIXI_OBJECT_TYPE
{
	GRAPHICS = "GRAPHICS",
	TEXTURE = "TEXTURE",
}

export enum PIXI_LAYER
{
	ABOVE = "ABOVE",
	BELOW = "BELOW",
}

export interface PixiObjectDef extends CanvasObjectDef
{
	type: PIXI_OBJECT_TYPE;
}

export class PixiController
{
	static myInstance: PixiController; static get() { if (PixiController.myInstance == null) { PixiController.myInstance = new PixiController(); } return this.myInstance; }

	private _pixiInstanceAbove: PIXI.Application | null = null;
	public get PixiAbove() { return this._pixiInstanceAbove!; }

	private _pixiInstanceBelow: PIXI.Application | null = null;
	public get PixiBelow() { return this._pixiInstanceBelow!; }

	public GetPixiInstance(layer:PIXI_LAYER = PIXI_LAYER.ABOVE):PIXI.Application
	{
		if (layer === PIXI_LAYER.ABOVE) return this.PixiAbove;
		if (layer === PIXI_LAYER.BELOW) return this.PixiBelow;
		return this.PixiAbove;
	}

	private _CanvasAbove: HTMLCanvasElement | null = null;
	private _CanvasBelow: HTMLCanvasElement | null = null;
	//public get Canvas() { return this._canvas!; }

	private _canvasContainer: HTMLDivElement | null = null;
	//public get CanvasContainer() { return this._canvasContainer!; }

	public async Init(width?:number, height?:number)
	{
		if (this._pixiInstanceAbove) this.Dispose();

		let oldCanvasAbove = document.getElementById('pixiCanvasAbove');
		let oldCanvasBelow = document.getElementById('pixiCanvasBelow');
		this._canvasContainer = document.getElementById('pixiCanvasContainer') as HTMLDivElement;

		if (oldCanvasAbove) oldCanvasAbove.remove();
		if (oldCanvasBelow) oldCanvasBelow.remove();

		this._CanvasAbove = document.createElement('canvas');
		this._CanvasAbove.id = 'pixiCanvasAbove';
		this._CanvasAbove.style.position = 'absolute';
		this._CanvasAbove.style.top = '0';
		this._CanvasAbove.style.left = '0';
		this._CanvasAbove.style.zIndex = '3';
		this._CanvasAbove.width = width || 800;
		this._CanvasAbove.height = height || 500;

		this._CanvasBelow = document.createElement('canvas');
		this._CanvasBelow.id = 'pixiCanvasBelow';
		this._CanvasBelow.style.position = 'absolute';
		this._CanvasBelow.style.top = '0';
		this._CanvasBelow.style.left = '0';
		this._CanvasBelow.style.zIndex = '1';
		this._CanvasBelow.width = width || 800;
		this._CanvasBelow.height = height || 500;

		this._canvasContainer.appendChild(this._CanvasAbove);
		this._canvasContainer.appendChild(this._CanvasBelow);

		this._pixiInstanceAbove = new PIXI.Application();
		await this._pixiInstanceAbove.init({
			width: width || 800,
			height: height || 500,
			backgroundAlpha: 0,
			canvas: this._CanvasAbove,
		});
		this._pixiInstanceAbove.stage.eventMode = 'static';
		this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
		this._pixiInstanceAbove.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) =>
		{
			const canvasBounds = this._CanvasAbove!.getBoundingClientRect();
			const x = e.clientX - canvasBounds.left;
			const y = e.clientY - canvasBounds.top;
			RiveController.get().SetMousePos(x, y);
		});
		this._pixiInstanceAbove.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) =>
		{
			RiveController.get().SetMouseDown(true);
		});
		this._pixiInstanceAbove.stage.on('pointerup', (e: PIXI.FederatedPointerEvent) =>
		{
			RiveController.get().SetMouseDown(false);
		});

		this._pixiInstanceBelow = new PIXI.Application();
		await this._pixiInstanceBelow.init({
			width: width || 800,
			height: height || 500,
			backgroundAlpha: 0,
			canvas: this._CanvasBelow,
		});
		this._pixiInstanceAbove.stage.eventMode = 'static';
	}

	public SetSize(width: number, height: number)
	{
		if (!this._pixiInstanceAbove || !this._pixiInstanceAbove.renderer) return;

		this._pixiInstanceAbove.renderer.resize(width, height);
		this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
		if (this._pixiInstanceBelow) this._pixiInstanceBelow.renderer.resize(width, height);

		this._canvasContainer?.setAttribute("width", `${width}`);
		this._canvasContainer?.setAttribute("height", `${height}`);

		this._CanvasAbove?.setAttribute("width", `${width}`);
		this._CanvasAbove?.setAttribute("height", `${height}`);
	}

	public Dispose()
	{
		try
		{
			if (this._pixiInstanceAbove)
			{
				this._pixiInstanceAbove.ticker.stop();
				this._pixiInstanceAbove.stage.removeChildren();
				this._pixiInstanceAbove.stage.destroy({ children: true, texture: true});
				this._pixiInstanceAbove.stage.interactive = false;
				this._pixiInstanceAbove.stage.removeAllListeners();

				try
				{
					this._pixiInstanceAbove.destroy(true);
				}
				catch (error)
				{
					console.warn("PixiController - Failed to destroy Pixi application:", error);
				}

				this._pixiInstanceAbove = null;
			}

			if (this._pixiInstanceBelow)
			{
				this._pixiInstanceBelow.ticker.stop();
				this._pixiInstanceBelow.stage.removeChildren();
				this._pixiInstanceBelow.stage.destroy({ children: true, texture: true});
				this._pixiInstanceBelow.stage.interactive = false;
				this._pixiInstanceBelow.stage.removeAllListeners();

				try
				{
					this._pixiInstanceBelow.destroy(true);
				}
				catch (error)
				{
					console.warn("PixiController - Failed to destroy Pixi application:", error);
				}

				this._pixiInstanceBelow = null;
			}

		}
		catch (error)
		{
			console.error("PixiController - Error cleaning up Pixi Renderer:", error);
		}
	}
}
