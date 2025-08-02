import * as PIXI from "pixi.js";
import { CanvasObjectDef } from "../canvasObjects/CanvasObj";
export declare enum PIXI_OBJECT_TYPE {
    GRAPHICS = "GRAPHICS",
    TEXTURE = "TEXTURE"
}
export declare enum PIXI_LAYER {
    ABOVE = "ABOVE",
    BELOW = "BELOW"
}
export interface PixiObjectDef extends CanvasObjectDef {
    type: PIXI_OBJECT_TYPE;
}
export declare class PixiController {
    static myInstance: PixiController;
    static get(): PixiController;
    private _pixiInstanceAbove;
    get PixiAbove(): PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>;
    private _pixiInstanceBelow;
    get PixiBelow(): PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>;
    GetPixiInstance(layer?: PIXI_LAYER): PIXI.Application;
    private _CanvasAbove;
    private _CanvasBelow;
    private _canvasContainer;
    Init(width?: number, height?: number): Promise<void>;
    SetSize(width: number, height: number): void;
    Dispose(): void;
}
