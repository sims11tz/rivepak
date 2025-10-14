/// <reference types="matter-js" />
import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance, ViewModelInstance } from "@rive-app/webgl2-advanced";
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
export declare enum RIVE_CURSOR_TYPES {
    DEFAULT = "default",
    POINTER = "pointer",
    GRAB = "grab",
    CROSSHAIR = "crosshair",
    NOT_ALLOWED = "not-allowed",
    N_RESIZE = "n-resize",
    EW_RESIZE = "ew-resize",
    NESW_RESIZE = "nesw-resize"
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
    private _vmEnumQueue;
    private _vmEnumQueueProcessedThisFrame;
    private _eventCallbacks;
    /**
     * Subscribe to a Rive event by name
     * @param eventName The name of the Rive event to listen for
     * @param callback Function to call when the event fires
     * @returns Unsubscribe function
     */
    OnRiveEvent(eventName: string, callback: (event: any) => void): () => void;
    /**
     * Remove all event listeners for a specific event name
     */
    ClearRiveEventListeners(eventName: string): void;
    /**
     * Remove all event listeners
     */
    ClearAllRiveEventListeners(): void;
    SetViewModelInstance(vmi: ViewModelInstance | null): void;
    get ViewModelInstance(): ViewModelInstance | null;
    /**
     * Queue a ViewModel enum change to be applied in the next frame.
     * This ensures State Machines process changes one per frame in sequence.
     * @param path - The path to the enum property (e.g., "POD_TYPE")
     * @param value - The string value to set (e.g., "SPACE")
     */
    QueueViewModelEnumChange(path: string, value: string): void;
    /**
     * Process the next queued ViewModel enum change (called once per frame in Update)
     */
    private _processVMEnumQueue;
    private _riveObjDef;
    get riveObjDef(): RiveObjectDef;
    private _artboardName;
    get artboardName(): string;
    private _filePath;
    get filePath(): string;
    protected _baseRiveVMPath: string;
    get baseRiveVMPath(): string;
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
    private _currentRiveCursor;
    get CurrentCursor(): RIVE_CURSOR_TYPES;
    set CurrentCursor(cursor: RIVE_CURSOR_TYPES);
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
