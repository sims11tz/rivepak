import { Artboard } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasRiveObj } from "./CanvasRiveObj";

export class RiveAnimationObject extends CanvasRiveObj
{
	constructor(riveDef:RiveObjectDef,artboard:Artboard)
	{
		super(riveDef,artboard);

		this.initRiveObject();
	}

	protected initRiveObject()
	{
		super.initRiveObject();
	}

	public update(time:number,frameCount:number,onceSecond:boolean)
	{
		if(this.enabled === false) return;

		super.update(time,frameCount,onceSecond);
	}
}
