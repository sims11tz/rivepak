import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
export declare class CanvasTextObject extends CanvasPixiShapeObj {
    private _textField;
    constructor(canvasDef: CanvasObjectDef);
    InitPixiObject(): void;
    DrawVectors(): void;
    SetText(text: string): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
