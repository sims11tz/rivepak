import CanvasPixiShapeObj from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
export default class PixiGraphicsObject extends CanvasPixiShapeObj {
    constructor(canvasDef: CanvasObjectDef);
    update(time: number, frameCount: number, onceSecond: boolean): void;
    dispose(): void;
}
