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
    Update(time, frameCount, onceSecond, onceMinute) {
        if (this.enabled === false)
            return;
        CanvasRiveObj.prototype.Update.call(this, time, frameCount, onceSecond, onceMinute);
        super.Update(time, frameCount, onceSecond, onceMinute);
    }
    Dispose() {
        super.Dispose();
        CanvasRiveObj.prototype.Dispose.call(this);
    }
}
