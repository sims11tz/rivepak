import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
export declare class TextObject extends CanvasPixiShapeObj {
    constructor(canvasDef: CanvasObjectDef);
    DrawVectors(): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
