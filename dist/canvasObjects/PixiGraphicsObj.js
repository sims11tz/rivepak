import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
export class PixiGraphicsObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
        // Flag to enable continuous redraw each frame (for dynamic/animated graphics)
        this._continuousRedraw = false;
    }
    /**
     * Enable or disable continuous redraw each frame
     * Useful for debug visualizations or animated graphics
     */
    SetContinuousRedraw(enabled) {
        this._continuousRedraw = enabled;
    }
    /**
     * Force a redraw of the graphics
     */
    Redraw() {
        this.DrawVectors();
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
        // If continuous redraw is enabled, call DrawVectors every frame
        if (this._continuousRedraw) {
            this.DrawVectors();
        }
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        super.Dispose();
    }
}
