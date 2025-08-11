import { Artboard, Renderer } from "@rive-app/webgl-advanced";
import { CanvasRiveObj } from "../canvasObjects/CanvasRiveObj";
import { CanvasObjectDef, CanvasObjectEntity } from "../canvasObjects/CanvasObj";
import * as PIXI from "pixi.js";
export declare enum RIVE_OBJECT_TYPE {
    ANIMATION = "ANIMATION",
    PHYSICS = "PHYSICS"
}
export interface RiveObjectDef extends CanvasObjectDef {
    filePath: string;
    objectType: RIVE_OBJECT_TYPE;
    artboardName: string;
    id?: string;
    onClickCallback?: (event: MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj: CanvasRiveObj) => void;
    onHoverCallback?: (sourceObj: CanvasRiveObj) => void;
    onHoverOutCallback?: (sourceObj: CanvasRiveObj) => void;
    classType?: new (def: RiveObjectDef, artboard: Artboard) => CanvasRiveObj;
}
export declare class RiveObjectsSet {
    objects: CanvasRiveObj[];
    constructor({ objects }: {
        objects: CanvasRiveObj[];
    });
    GetObjectByIdx(idx: number): CanvasRiveObj | null;
    GetObjectById(id: string): CanvasRiveObj | null;
    GetObjectByArtboardName(artboardByName: string): CanvasRiveObj | null;
    GetObjectByFilePath(filePath: string): CanvasRiveObj | null;
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
    private _canvasGlobalBounds;
    get CanvasBounds(): DOMRect;
    get CanvasGlobalBounds(): DOMRect;
    private _riveObjectsSet;
    get RiveObjectsSet(): RiveObjectsSet;
    private _initCalled;
    private _cache;
    Init(canvas: HTMLCanvasElement): Promise<void>;
    SetSize(width: number, height: number): void;
    CreateRiveObj(riveObjDefs: RiveObjectDef | RiveObjectDef[]): Promise<RiveObjectsSet>;
    private getVMForArtboard;
    private makeVMI;
    private loadRiveFiles;
    private _mousePos;
    private _mouseGlobalPos;
    private _mouseDown;
    SetMousePos(x: number, y: number): void;
    SetMouseGlobalPos: (e: MouseEvent) => void;
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
    WindowToArtboard(entity: CanvasObjectEntity, interactiveCheck?: boolean): {
        x: number;
        y: number;
    };
    Dispose(): void;
}
