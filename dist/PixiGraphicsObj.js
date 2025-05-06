import CanvasPixiShapeObj from "./CanvasPixiShapeObj";
export default class PixiGraphicsObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
    }
    update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        super.update(time, frameCount, onceSecond);
    }
    dispose() {
        super.dispose();
    }
}
