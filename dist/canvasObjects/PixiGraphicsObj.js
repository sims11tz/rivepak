import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
export class PixiGraphicsObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
    }
    DrawVectors() {
        if (this._graphics === null)
            return;
        if (this._defObj.drawFunction) {
            this._defObj.drawFunction(this._graphics, this._defObj);
        }
        super.DrawVectors();
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        super.Dispose();
    }
}
