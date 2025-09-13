import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
export class PixiGraphicsObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
    }
    DrawVectors() {
        console.log('%c PixiGraphicsObject.DrawVectors', 'color:#ee661c; font-weight:bold;');
        if (this._graphics === null)
            return;
        console.log('%c PixiGraphicsObject.DrawVectors 1> yes', 'color:#ee661c; font-weight:bold;');
        if (this._defObj.drawFunction) {
            console.log('%c PixiGraphicsObject.DrawVectors 2>', 'color:#ee661c; font-weight:bold;');
            this._defObj.drawFunction(this._graphics, this._defObj);
        }
        console.log('%c PixiGraphicsObject.DrawVectors 3>', 'color:#ee661c; font-weight:bold;');
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
