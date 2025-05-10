import { CanvasRiveObj } from "./CanvasRiveObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
class BaseRivePhysicsObject extends CanvasPhysicsMixin(CanvasRiveObj) {
}
export class RivePhysicsObject extends BaseRivePhysicsObject {
    constructor(riveDef, artboard) {
        super(riveDef, artboard);
        this.initRiveObject();
        this.InitPhysics();
    }
    initRiveObject() {
        super.initRiveObject();
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        if (this._body) {
            this.x = this._body.position.x;
            this.y = this._body.position.y;
        }
        CanvasRiveObj.prototype.Update.call(this, time, frameCount, onceSecond);
    }
}
