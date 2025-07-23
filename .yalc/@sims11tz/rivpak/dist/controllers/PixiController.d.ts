import * as PIXI from "pixi.js";
import { CanvasObjectDef } from "../canvasObjects/CanvasObj";
export declare enum PIXI_OBJECT_TYPE {
    GRAPHICS = "GRAPHICS",
    TEXTURE = "TEXTURE"
}
export interface PixiObjectDef extends CanvasObjectDef {
    type: PIXI_OBJECT_TYPE;
}
export declare class PixiController {
    static myInstance: PixiController;
    static get(): PixiController;
    private _pixiInstance;
    get Pixi(): PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>;
    private _canvas;
    private _canvasContainer;
    Init(width?: number, height?: number): Promise<void>;
    SetSize(width: number, height: number): void;
    Dispose(): void;
}
