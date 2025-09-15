import { CanvasRiveObj } from "./CanvasRiveObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
class BaseRivePhysicsObject extends CanvasPhysicsMixin(CanvasRiveObj) {
}
export class RivePhysicsObject extends BaseRivePhysicsObject {
    constructor(riveDef, artboard) {
        super(riveDef, artboard);
    }
    InitRiveObject() {
        super.InitRiveObject();
        this.InitPhysics();
    }
    ApplyResolutionScale(scale, property = "") {
        CanvasRiveObj.prototype.ApplyResolutionScale.call(this, scale, property);
        super.ApplyResolutionScale(scale, property);
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        CanvasRiveObj.prototype.Update.call(this, time, frameCount, onceSecond);
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        CanvasRiveObj.prototype.Dispose.call(this);
        super.Dispose();
    }
}
