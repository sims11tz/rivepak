import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
class BaseShapePhysicsObj extends CanvasPhysicsMixin(CanvasPixiShapeObj) {
}
export class PixiShapePhysicsObj extends BaseShapePhysicsObj {
    constructor(canvasDef) {
        super(canvasDef);
        this.InitPhysics();
    }
    ApplyResolutionScale(scale, property = "") {
        CanvasPixiShapeObj.prototype.ApplyResolutionScale.call(this, scale, property);
        super.ApplyResolutionScale(scale, property);
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        CanvasPixiShapeObj.prototype.Update.call(this, time, frameCount, onceSecond);
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        CanvasPixiShapeObj.prototype.Dispose.call(this);
        super.Dispose();
    }
}
