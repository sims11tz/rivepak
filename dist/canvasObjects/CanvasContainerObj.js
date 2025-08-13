import { CanvasObj } from "./CanvasObj";
export class CanvasContainerObj extends CanvasObj {
    constructor(canvasDef) {
        super(canvasDef);
        this.children = [];
        this.InitContainer();
    }
    InitContainer() {
    }
    AddChild(child) {
        child.SetParent(this);
        this.children.push(child);
    }
    RemoveChild(child) {
        child.SetParent(null);
        this.children = this.children.filter(c => c !== child);
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        //Update the x and y of children to be relative to my x and y... and scale and width and all that shit.. or i guess x and y and scale.
    }
    Dispose() {
        super.Dispose();
    }
}
