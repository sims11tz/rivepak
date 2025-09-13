import * as PIXI from "pixi.js";

import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./_baseCanvasObj";

export class PixiGraphicsObject extends CanvasPixiShapeObj
{
	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
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

		super.Update(time,frameCount,onceSecond);
	}

	public Dispose(): void
	{
		super.Dispose();
	}
}
