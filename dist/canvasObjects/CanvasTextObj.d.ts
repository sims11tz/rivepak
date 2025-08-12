import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
export declare class CanvasTextObject extends CanvasPixiShapeObj {
    constructor(canvasDef: CanvasObjectDef);
    private _text;
    DrawVectors(): void;
    SetText(text: string): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
