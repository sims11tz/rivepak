import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
import * as PIXI from "pixi.js";
export declare class CanvasPixiShapeObj extends CanvasObj {
    protected _graphics: PIXI.Graphics | null;
    protected _debugGraphics: PIXI.Graphics | null;
    constructor(canvasDef: CanvasObjectDef);
    InitPixiObject(): void;
    DrawVectors(): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    protected onClick(event: PIXI.FederatedPointerEvent): void;
    private onHover;
    private onHoverOut;
    Dispose(): void;
}
