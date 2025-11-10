import { Artboard } from "@rive-app/webgl2-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasRiveObj } from "./CanvasRiveObj";

export class RiveAnimationObject extends CanvasRiveObj
{
	constructor(riveDef:RiveObjectDef,artboard:Artboard)
	{
		super(riveDef,artboard);
	}

	public Update(time:number,frameCount:number,onceSecond:boolean,onceMinute:boolean)
	{
		if(this.enabled === false) return;

		super.Update(time,frameCount,onceSecond,onceMinute);
	}

	public Dispose(): void
	{
		super.Dispose();
	}
}
