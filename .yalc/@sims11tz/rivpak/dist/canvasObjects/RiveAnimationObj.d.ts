import { Artboard } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasRiveObj } from "./CanvasRiveObj";
export declare class RiveAnimationObject extends CanvasRiveObj {
    constructor(riveDef: RiveObjectDef, artboard: Artboard);
    protected initRiveObject(): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
