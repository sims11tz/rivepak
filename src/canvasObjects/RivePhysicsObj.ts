import { Artboard } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasRiveObj } from "./CanvasRiveObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";

class BaseRivePhysicsObject extends CanvasPhysicsMixin(CanvasRiveObj) {}

export class RivePhysicsObject extends BaseRivePhysicsObject
{
	constructor(riveDef:RiveObjectDef, artboard:Artboard)
	{
		super(riveDef, artboard);
	}

	public override InitRiveObject()
	{
		super.InitRiveObject();
		this.InitPhysics();
	}

	public ApplyResolutionScale(scale:number, property:string="")
	{
		CanvasRiveObj.prototype.ApplyResolutionScale.call(this, scale, property);
		super.ApplyResolutionScale(scale, property);
	}

	public Update(time: number, frameCount: number, onceSecond: boolean)
	{
		if (this.enabled === false) return;

		CanvasRiveObj.prototype.Update.call(this, time, frameCount, onceSecond);
		super.Update(time, frameCount, onceSecond);
	}

	public Dispose(): void
	{
		super.Dispose();
		CanvasRiveObj.prototype.Dispose.call(this);
	}
}
