import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
export declare class CanvasContainerObj extends CanvasObj {
    children: CanvasObj[];
    constructor(canvasDef: CanvasObjectDef);
    protected InitContainer(): void;
    AddChild(child: CanvasObj): void;
    RemoveChild(child: CanvasObj): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
