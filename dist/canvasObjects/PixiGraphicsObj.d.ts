import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./_baseCanvasObj";
export declare class PixiGraphicsObject extends CanvasPixiShapeObj {
    private _continuousRedraw;
    constructor(canvasDef: CanvasObjectDef);
    /**
     * Enable or disable continuous redraw each frame
     * Useful for debug visualizations or animated graphics
     */
    SetContinuousRedraw(enabled: boolean): void;
    /**
     * Force a redraw of the graphics
     */
    Redraw(): void;
    DrawVectors(): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
