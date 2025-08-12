import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
export class TextObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
    }
    DrawVectors() {
        console.log("==---");
        console.log("=====-----");
        console.log("Drawing text object vectors!!");
        console.log("=====-----");
        console.log("==---");
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
