import { CanvasRiveObj } from "./CanvasRiveObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
class BaseRivePhysicsObject extends CanvasPhysicsMixin(CanvasRiveObj) {
}
export class RivePhysicsObject extends BaseRivePhysicsObject {
    constructor(riveDef, artboard) {
        super(riveDef, artboard);
    }
    InitRiveObject() {
        console.log('%c RivePhsysicsObj.InitRiveObj()  CALL SUPER!!!!', 'color:#00FF88');
        super.InitRiveObject();
        console.log('%c RivePhsysicsObj.InitRiveObj() > 1 CALL InitPHYSICS', 'color:#00FF88');
        this.InitPhysics();
        console.log('%c RivePhsysicsObj.InitRiveObj() > 2 ALL DONE', 'color:#00FF88');
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
        super.Dispose();
        CanvasRiveObj.prototype.Dispose.call(this);
    }
}
