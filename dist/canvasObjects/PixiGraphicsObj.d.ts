import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
export declare class PixiGraphicsObject extends CanvasPixiShapeObj {
    constructor(canvasDef: CanvasObjectDef);
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
