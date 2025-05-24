/// <reference types="matter-js" />
import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance } from "@rive-app/canvas-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasObj } from "./CanvasObj";
import * as PIXI from "pixi.js";
export type RiveInstance = Awaited<ReturnType<typeof RiveCanvas>>;
export interface RiveArtboardBundle {
    id: number;
    entityObj: EntityObj;
    artboard: Artboard;
    animations: LinearAnimationInstance[];
    stateMachine: StateMachineInstance | null;
    inputs: Map<string, SMIInput>;
}
export interface EntityObj {
    width: number;
    height: number;
    body: Matter.Body | null;
}
export declare class CanvasRiveObj extends CanvasObj {
    private _artboard;
    protected _renderer: Renderer;
    protected _riveInstance: Awaited<ReturnType<typeof RiveCanvas>>;
    protected _animations: LinearAnimationInstance[];
    protected _stateMachine: StateMachineInstance | null;
    protected _inputs: Map<string, SMIInput>;
    private _objBoundsReuse;
    private _riveObjDef;
    get riveObjDef(): RiveObjectDef;
    constructor(riveDef: RiveObjectDef, artboard: Artboard);
    private _lastMousePos;
    private _lastMouseDown;
    private _entityObj;
    protected initRiveObject(): void;
    updateEntityObj(): void;
    InputByName(name: string): SMIInput | null;
    RandomInput(): SMIInput | null;
    RandomInputByName(searchTerm: string): SMIInput | null;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    private _interactiveGraphics;
    private initInteractive;
    protected onClick(event: MouseEvent | PointerEvent | PIXI.PixiTouch): void;
    protected onHover(): void;
    protected onHoverOut(): void;
    Dispose(): void;
    protected get Rive(): Awaited<ReturnType<typeof RiveCanvas>>;
    protected get Renderer(): Renderer;
    get artboard(): Artboard;
}
