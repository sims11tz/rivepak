import { CanvasRiveObj } from "./CanvasRiveObj";
export class RiveAnimationObject extends CanvasRiveObj {
    constructor(riveDef, artboard) {
        super(riveDef, artboard);
        this.initRiveObject();
    }
    initRiveObject() {
        super.initRiveObject();
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        console.log("RiveAnimationObject Dispose called :: ", this.defObj);
        super.Dispose();
    }
}
