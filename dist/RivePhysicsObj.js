import CanvasRiveObj from "./CanvasRiveObj";
import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
class BaseRivePhysicsObject extends CanvasPhysicsMixin(CanvasRiveObj) {
}
export default class RivePhysicsObject extends BaseRivePhysicsObject {
    constructor(riveDef, artboard) {
        super(riveDef, artboard);
        this.initRiveObject();
        this.initPhysics();
    }
    initRiveObject() {
        super.initRiveObject();
    }
    update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        if (this._body) {
            this.x = this._body.position.x;
            this.y = this._body.position.y;
        }
        //call super
        CanvasRiveObj.prototype.update.call(this, time, frameCount, onceSecond);
    }
}
