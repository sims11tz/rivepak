import { BaseCanvasObj, CanvasObjectDef } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export declare class CanvasPixiShapeDrawFunctions {
    static DrawRectangle(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawCircle(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawEllipse(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawRoundedRect(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawStar(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawPolygon(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawTriangle(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawHeart(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawArrow(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawCross(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawGradientRect(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawBurst(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawDiamond(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawSpeechBubble(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawGear(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
    static DrawRandomShape(graphics: PIXI.Graphics, def: CanvasObjectDef): void;
}
export declare class CanvasPixiShapeObj extends BaseCanvasObj {
    protected _graphics: PIXI.Graphics | null;
    protected _debugGraphics: PIXI.Graphics | null;
    constructor(canvasDef: CanvasObjectDef);
    InitVisuals(): void;
    InitPixiObject(): void;
    get visible(): boolean;
    set visible(value: boolean);
    DrawVectors(): void;
    private _ranFirstUpdate;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    protected onClick(event: PIXI.FederatedPointerEvent): void;
    private onHover;
    private onHoverOut;
    Dispose(): void;
}
