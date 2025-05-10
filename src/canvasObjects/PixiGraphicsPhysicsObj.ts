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

	public update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;

		if (this._body)
		{
			this.x = this._body.position.x;
			this.y = this._body.position.y;

			if(onceSecond)
			{
				//console.log("🎉 ShapePhysicsObj "+frameCount+"  "+this.x+"/"+this.y);
			}
		}

		CanvasPixiShapeObj.prototype.Update.call(this, time, frameCount, onceSecond);
	}

	public dispose(): void
	{
		super.Dispose();
		CanvasPixiShapeObj.prototype.Dispose.call(this);
	}
}
