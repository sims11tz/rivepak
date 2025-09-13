/// <reference types="matter-js" />
import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance, ViewModelInstance } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { BaseCanvasObj } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export declare class AnimationMetadata {
    readonly animation: LinearAnimationInstance;
    readonly artboard: Artboard;
    readonly index: number;
    readonly name: string;
    readonly duration: number;
    readonly speed: number;
    readonly fps: number;
    autoPlay: boolean;
    isTimelineControlled: boolean;
    private _uuid;
    get uuid(): string;
    constructor(artboard: Artboard, animation: LinearAnimationInstance, index: number, name: string, duration: number, autoPlay?: boolean);
}
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
export declare class CanvasRiveObj extends BaseCanvasObj {
    private _artboard;
    protected _renderer: Renderer;
    protected _riveInstance: Awaited<ReturnType<typeof RiveCanvas>>;
    protected _animations: AnimationMetadata[];
    protected _stateMachine: StateMachineInstance | null;
    protected _inputs: Map<string, SMIInput>;
    protected _viewModels: Map<string, any>;
    protected _viewModelInstance: ViewModelInstance | null;
    SetViewModelInstance(vmi: ViewModelInstance | null): void;
    get ViewModelInstance(): ViewModelInstance | null;
    private _riveObjDef;
    get riveObjDef(): RiveObjectDef;
    private _artboardName;
    get artboardName(): string;
    private _filePath;
    get filePath(): string;
    constructor(riveDef: RiveObjectDef, artboard: Artboard);
    private _lastMousePos;
    private _lastMouseDown;
    private _entityObj;
    private dumpWasmObject;
    InitRiveObject(): void;
    updateEntityObj(): void;
    InputByName(name: string): SMIInput | null;
    RandomInput(): SMIInput | null;
    RandomInputByName(searchTerm: string): SMIInput | null;
    GetAnimationByName(name: string): AnimationMetadata | null;
    GetAnimationByIndex(index: number): AnimationMetadata | null;
    GetAnimationsByNamePattern(searchTerm: string): AnimationMetadata[];
    GetAllAnimations(): AnimationMetadata[];
    PlayAnimationByName(name: string): boolean;
    SetAnimationAutoPlay(name: string, autoPlay: boolean): boolean;
    SetAllAnimationsAutoPlay(autoPlay: boolean): void;
    DisableAutoPlayForAnimations(names: string[]): void;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    SetText(text: string): void;
    private _textLabel;
    private drawTextLabel;
    private _interactiveGraphics;
    private initInteractive;
    protected _onClickCallback?: (event: MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj: CanvasRiveObj) => void;
    protected _onHoverCallback?: (sourceObj: CanvasRiveObj) => void;
    protected _onHoverOutCallback?: (sourceObj: CanvasRiveObj) => void;
    SetEventHandlers({ onClick, onHover, onHoverOut, }: {
        onClick?: (e: MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj: CanvasRiveObj) => void;
        onHover?: (sourceObj: CanvasRiveObj) => void;
        onHoverOut?: (sourceObj: CanvasRiveObj) => void;
    }): void;
    protected onClick(event: MouseEvent | PointerEvent | PIXI.PixiTouch): void;
    protected onHover(): void;
    protected onHoverOut(): void;
    Dispose(): void;
    protected get Rive(): Awaited<ReturnType<typeof RiveCanvas>>;
    protected get Renderer(): Renderer;
    get artboard(): Artboard;
}
