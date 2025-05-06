import { Artboard } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../../controllers/RiveController";
import CanvasRiveObj from "./CanvasRiveObj";
export default class RiveAnimationObject extends CanvasRiveObj {
    constructor(riveDef: RiveObjectDef, artboard: Artboard);
    protected initRiveObject(): void;
    update(time: number, frameCount: number, onceSecond: boolean): void;
}
