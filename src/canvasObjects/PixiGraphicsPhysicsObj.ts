import { CanvasObjectDef } from "./CanvasObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";

class BaseShapePhysicsObj extends CanvasPhysicsMixin(CanvasPixiShapeObj) {}

export class PixiShapePhysicsObj extends BaseShapePhysicsObj
{
	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);

		this.InitPhysics();
	}

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;

		if (this._body)
		{
			this.x = this._body.position.x-(this.width/2);
			this.y = this._body.position.y-(this.height/2);

			//if(onceSecond)
			//{
			//	console.log("🎉 ShapePhysicsObj "+frameCount+"  "+this.x+"/"+this.y);
			//}
		}

		CanvasPixiShapeObj.prototype.Update.call(this, time, frameCount, onceSecond);
	}

	public Dispose(): void
	{
		super.Dispose();
		CanvasPixiShapeObj.prototype.Dispose.call(this);
	}
}
