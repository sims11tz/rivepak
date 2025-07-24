import * as PIXI from "pixi.js";
import { CanvasObjectDef } from "../canvasObjects/CanvasObj";
import { RiveController } from "./RiveController";

export enum PIXI_OBJECT_TYPE
{
	GRAPHICS = "GRAPHICS",
	TEXTURE = "TEXTURE",
}

export interface PixiObjectDef extends CanvasObjectDef
{
	type: PIXI_OBJECT_TYPE;
}

export class PixiController
{
	static myInstance: PixiController; static get() { if (PixiController.myInstance == null) { PixiController.myInstance = new PixiController(); } return this.myInstance; }

	private _pixiInstance: PIXI.Application | null = null;
	public get Pixi() { return this._pixiInstance!; }

	private _canvas: HTMLCanvasElement | null = null;
	//public get Canvas() { return this._canvas!; }

	private _canvasContainer: HTMLDivElement | null = null;
	//public get CanvasContainer() { return this._canvasContainer!; }

	public async Init(width?:number, height?:number)
	{
		if (this._pixiInstance) this.Dispose();

		let oldCanvas = document.getElementById('pixiCanvas');
		this._canvasContainer = document.getElementById('pixiCanvasContainer') as HTMLDivElement;

		if (oldCanvas) oldCanvas.remove();

		this._canvas = document.createElement('canvas');
		this._canvas.id = 'pixiCanvas';
		this._canvas.width = width || 800;
		this._canvas.height = height || 500;

		this._canvasContainer.appendChild(this._canvas); // Add to the same parent

		this._pixiInstance = new PIXI.Application();

		await this._pixiInstance.init({
			width: width || 800,
			height: height || 500,
			backgroundAlpha: 0,
			canvas: this._canvas,
		});

		this._pixiInstance.stage.eventMode = 'static';
		this._pixiInstance.stage.hitArea = this._pixiInstance.renderer.screen;

		this._pixiInstance.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) =>
		{
			const canvasBounds = this._canvas!.getBoundingClientRect();
			const x = e.clientX - canvasBounds.left;
			const y = e.clientY - canvasBounds.top;
			RiveController.get().SetMousePos(x, y);
		});

		this._pixiInstance.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) =>
		{
			RiveController.get().SetMouseDown(true);
		});

		this._pixiInstance.stage.on('pointerup', (e: PIXI.FederatedPointerEvent) =>
		{
			RiveController.get().SetMouseDown(false);
		});
	}

	public SetSize(width: number, height: number)
	{
		if (!this._pixiInstance || !this._pixiInstance.renderer) return;

		this._pixiInstance.renderer.resize(width, height);
		this._pixiInstance.stage.hitArea = this._pixiInstance.renderer.screen;

		this._canvasContainer?.setAttribute("width", `${width}`);
		this._canvasContainer?.setAttribute("height", `${height}`);

		this._canvas?.setAttribute("width", `${width}`);
		this._canvas?.setAttribute("height", `${height}`);
	}

	public Dispose()
	{
		try
		{
			if (!this._pixiInstance) return;

			this._pixiInstance.ticker.stop();

			this._pixiInstance.stage.removeChildren();
			this._pixiInstance.stage.destroy({ children: true, texture: true});

			this._pixiInstance.stage.interactive = false;
			this._pixiInstance.stage.removeAllListeners();

			try
			{
				this._pixiInstance.destroy(true);
			}
			catch (error)
			{
				console.warn("PixiController - Failed to destroy Pixi application:", error);
			}

			this._pixiInstance = null;
		}
		catch (error)
		{
			console.error("PixiController - Error cleaning up Pixi Renderer:", error);
		}
	}
}
