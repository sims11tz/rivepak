import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
export declare class CanvasContainerObj extends CanvasObj {
    constructor(canvasDef: CanvasObjectDef);
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
