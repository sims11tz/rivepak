import { CanvasPhysicsMixin } from "./CanvasPhysicsMixin";
import CanvasPixiShapeObj from "./CanvasPixiShapeObj";
class BaseShapePhysicsObj extends CanvasPhysicsMixin(CanvasPixiShapeObj) {
}
export default class PixiShapePhysicsObj extends BaseShapePhysicsObj {
    constructor(canvasDef) {
        super(canvasDef);
        this.initPhysics();
    }
    update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        if (this._body) {
            this.x = this._body.position.x;
            this.y = this._body.position.y;
            if (onceSecond) {
                //console.log("🎉 ShapePhysicsObj "+frameCount+"  "+this.x+"/"+this.y);
            }
        }
        CanvasPixiShapeObj.prototype.update.call(this, time, frameCount, onceSecond);
    }
    dispose() {
        super.dispose();
        CanvasPixiShapeObj.prototype.dispose.call(this);
    }
}
