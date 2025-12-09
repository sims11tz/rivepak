import * as PIXI from "pixi.js";

import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./_baseCanvasObj";

export class PixiGraphicsObject extends CanvasPixiShapeObj
{
	// Flag to enable continuous redraw each frame (for dynamic/animated graphics)
	private _continuousRedraw:boolean = false;

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
	}

	/**
	 * Enable or disable continuous redraw each frame
	 * Useful for debug visualizations or animated graphics
	 */
	public SetContinuousRedraw(enabled:boolean):void
	{
		this._continuousRedraw = enabled;
	}

	/**
	 * Force a redraw of the graphics
	 */
	public Redraw():void
	{
		this.DrawVectors();
	}

	public DrawVectors():void
	{
		if(this._graphics === null) return;

		if(this._defObj!.drawFunction)
		{
			this._defObj!.drawFunction(this._graphics, this._defObj!);
		}

		super.DrawVectors();
	}

	public Update(time:number,frameCount:number,onceSecond:boolean)
	{
		if(this.enabled === false) return;

		// If continuous redraw is enabled, call DrawVectors every frame
		if(this._continuousRedraw)
		{
			this.DrawVectors();
		}

		super.Update(time,frameCount,onceSecond);
	}

	public Dispose(): void
	{
		super.Dispose();
	}
}
