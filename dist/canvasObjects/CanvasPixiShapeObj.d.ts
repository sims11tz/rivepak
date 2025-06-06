import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
import * as PIXI from "pixi.js";
export declare class CanvasPixiShapeObj extends CanvasObj {
    private _graphics;
    constructor(canvasDef: CanvasObjectDef);
    InitPixiObject(): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    protected onClick(event: PIXI.FederatedPointerEvent): void;
    private onHover;
    private onHoverOut;
    Dispose(): void;
}
