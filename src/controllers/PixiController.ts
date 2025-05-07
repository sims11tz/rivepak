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

	public async init(width?:number, height?:number)
	{
		console.log("PixiController - Initializing Pixi Renderer... 1 ");
		if (this._pixiInstance) this.dispose();

		console.log("PixiController - Initializing Pixi Renderer... 2 ");
		let oldCanvas = document.getElementById('pixiCanvas');

		const parentElement = document.getElementById('pixiCanvasContainer') as HTMLDivElement;

		if (oldCanvas) oldCanvas.remove();

		const newCanvas = document.createElement('canvas');
		newCanvas.id = 'pixiCanvas';
		newCanvas.width = width || 800;
		newCanvas.height = height || 500;

		parentElement.appendChild(newCanvas); // Add to the same parent

		this._pixiInstance = new PIXI.Application();

		await this._pixiInstance.init({
			width: width || 800,
			height: height || 500,
			backgroundAlpha: 0,
			canvas: newCanvas,
		});

		this._pixiInstance.stage.eventMode = 'static';
		this._pixiInstance.stage.hitArea = this._pixiInstance.renderer.screen;

		this._pixiInstance.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) =>
		{
			const canvasBounds = newCanvas.getBoundingClientRect();
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

	public dispose()
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
