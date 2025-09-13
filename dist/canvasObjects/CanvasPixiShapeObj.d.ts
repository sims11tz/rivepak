import { BaseCanvasObj, CanvasObjectDef } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export declare class CanvasPixiShapeDrawFunctions {
    static DrawRectangle(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
}
export declare class CanvasPixiShapeObj extends BaseCanvasObj {
    protected _graphics: PIXI.Graphics | null;
    protected _debugGraphics: PIXI.Graphics | null;
    constructor(canvasDef: CanvasObjectDef);
    InitPixiObject(): void;
    DrawVectors(): void;
    private _ranFirstUpdate;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    protected onClick(event: PIXI.FederatedPointerEvent): void;
    private onHover;
    private onHoverOut;
    Dispose(): void;
}
