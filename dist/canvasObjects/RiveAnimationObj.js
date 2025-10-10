import { CanvasRiveObj } from "./CanvasRiveObj";
export class RiveAnimationObject extends CanvasRiveObj {
    constructor(riveDef, artboard) {
        super(riveDef, artboard);
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
