import { CanvasObjectDef } from "./_baseCanvasObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";

class BaseShapePhysicsObj extends CanvasPhysicsMixin(CanvasPixiShapeObj) {}

export class PixiShapePhysicsObj extends BaseShapePhysicsObj
{
	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
	}

	public ApplyResolutionScale(scale:number, property:string="")
	{
		CanvasPixiShapeObj.prototype.ApplyResolutionScale.call(this, scale, property);
		super.ApplyResolutionScale(scale, property);
	}

	public Update(time: number, frameCount: number, onceSecond: boolean):void
	{
		if(this.enabled === false) return;

		CanvasPixiShapeObj.prototype.Update.call(this, time, frameCount, onceSecond);
		super.Update(time, frameCount, onceSecond);
	}

	public Dispose():void
	{
		CanvasPixiShapeObj.prototype.Dispose.call(this);
		super.Dispose();
	}
}
