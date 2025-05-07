import { Artboard, Renderer } from "@rive-app/webgl-advanced";
import { CanvasRiveObj } from "../canvasObjects/CanvasRiveObj";
import { CanvasObjectDef, CanvasObjectEntity } from "../canvasObjects/CanvasObj";
export declare enum RIVE_OBJECT_TYPE {
    ANIMATION = "ANIMATION",
    PHYSICS = "PHYSICS"
}
export interface RiveObjectDef extends CanvasObjectDef {
    filePath: string;
    objectType: RIVE_OBJECT_TYPE;
    artboardName: string;
    classType?: new (def: RiveObjectDef, artboard: Artboard) => CanvasRiveObj;
}
export declare class RiveController {
    static myInstance: RiveController;
    static get(): RiveController;
    private _riveInstance;
    get Rive(): import("@rive-app/webgl-advanced").RiveCanvas;
    private _riveRenderer;
    get Renderer(): Renderer;
    private _canvas;
    get Canvas(): HTMLCanvasElement;
    private _canvasBounds;
    get CanvasBounds(): DOMRect;
    private _initCalled;
    private _cache;
    init(canvas: HTMLCanvasElement): Promise<void>;
    CreateRiveObj(riveObjDefs: RiveObjectDef | RiveObjectDef[]): Promise<CanvasRiveObj[]>;
    private loadRiveFiles;
    private _mousePos;
    private _mouseDown;
    SetMousePos(x: number, y: number): void;
    get MousePos(): {
        x: number;
        y: number;
    };
    SetMouseDown(down: boolean): void;
    get MouseDown(): boolean;
    CanvasToArtboard(entity: CanvasObjectEntity, interactiveCheck?: boolean): {
        x: number;
        y: number;
    };
    dispose(): void;
}
