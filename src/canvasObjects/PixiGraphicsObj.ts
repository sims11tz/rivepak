import * as PIXI from "pixi.js";

import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";

export class PixiGraphicsObject extends CanvasPixiShapeObj
{
	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
	}

	public update(time:number,frameCount:number,onceSecond:boolean)
	{
		if(this.enabled === false) return;

		super.update(time,frameCount,onceSecond);
	}

	public dispose(): void
	{
		super.dispose();
	}
}
