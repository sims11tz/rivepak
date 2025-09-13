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
		console.log('%c PixiGraphicsObject.DrawVectors', 'color:#ee661c; font-weight:bold;');
		if(this._graphics === null) return;

		console.log('%c PixiGraphicsObject.DrawVectors 1> yes', 'color:#ee661c; font-weight:bold;');
		if(this._defObj!.drawFunction)
		{
			console.log('%c PixiGraphicsObject.DrawVectors 2>', 'color:#ee661c; font-weight:bold;');
			this._defObj!.drawFunction(this._graphics, this._defObj!);
		}

		console.log('%c PixiGraphicsObject.DrawVectors 3>', 'color:#ee661c; font-weight:bold;');
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
