import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./_baseCanvasObj";
export declare class PixiGraphicsObject extends CanvasPixiShapeObj {
    constructor(canvasDef: CanvasObjectDef);
    DrawVectors(): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
