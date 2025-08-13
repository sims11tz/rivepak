import { CanvasObj } from "./CanvasObj";
export class CanvasContainerObj extends CanvasObj {
    constructor(canvasDef) {
        super(canvasDef);
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
    }
    Dispose() {
        super.Dispose();
    }
}
