import * as PIXI from "pixi.js";
import { CanvasObjectDef } from "../components/rive/CanvasObj";
export declare enum PIXI_OBJECT_TYPE {
    GRAPHICS = "GRAPHICS",
    TEXTURE = "TEXTURE"
}
export interface PixiObjectDef extends CanvasObjectDef {
    type: PIXI_OBJECT_TYPE;
}
export default class PixiController {
    static myInstance: PixiController;
    static get(): PixiController;
    private _pixiInstance;
    get Pixi(): PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>;
    init(width?: number, height?: number): Promise<void>;
    dispose(): void;
}
