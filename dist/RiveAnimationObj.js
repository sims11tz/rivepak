import CanvasRiveObj from "./CanvasRiveObj";
export default class RiveAnimationObject extends CanvasRiveObj {
    constructor(riveDef, artboard) {
        super(riveDef, artboard);
        this.initRiveObject();
    }
    initRiveObject() {
        super.initRiveObject();
    }
    update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        super.update(time, frameCount, onceSecond);
    }
}
