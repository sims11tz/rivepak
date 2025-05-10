import { Artboard } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasRiveObj } from "./CanvasRiveObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";

class BaseRivePhysicsObject extends CanvasPhysicsMixin(CanvasRiveObj) {}

export class RivePhysicsObject extends BaseRivePhysicsObject
{
	constructor(riveDef: RiveObjectDef, artboard: Artboard)
	{
		super(riveDef, artboard);
		this.initRiveObject();
		this.InitPhysics();
	}

	protected initRiveObject()
	{
		super.initRiveObject();
	}

	public Update(time: number, frameCount: number, onceSecond: boolean)
	{
		if (this.enabled === false) return;

		if (this._body)
		{
			this.x = this._body.position.x;
			this.y = this._body.position.y;
		}

		CanvasRiveObj.prototype.Update.call(this, time, frameCount, onceSecond);
	}
}
