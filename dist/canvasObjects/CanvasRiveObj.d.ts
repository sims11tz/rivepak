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
export type RiveActionQueueItem = {
    type: 'enum';
    path: string;
    value: string;
} | {
    type: 'trigger';
    inputName: string;
} | {
    type: 'boolean';
    inputName: string;
    value: boolean;
} | {
    type: 'number';
    inputName: string;
    value: number;
};
export declare class CanvasRiveObj extends BaseCanvasObj {
    private _artboard;
    protected _renderer: Renderer;
    protected _riveInstance: Awaited<ReturnType<typeof RiveCanvas>>;
    protected _animations: AnimationMetadata[];
    protected _stateMachine: StateMachineInstance | null;
    protected _inputs: Map<string, SMIInput>;
    protected _viewModels: Map<string, ViewModelInstance>;
    protected _viewModelInstance: ViewModelInstance | null;
    private _actionQueue;
    private _actionQueueProcessedThisFrame;
    _triggerCallbacks: Map<string, ((event: any) => void)[]>;
    protected _triggerCache: Map<string, any>;
    /**
     * Subscribe to a Rive event by name
     * @param eventName The name of the Rive event to listen for
     * @param callback Function to call when the event fires
     * @returns Unsubscribe function
     */
    OnRiveTrigger(eventName: string, callback: (event: any) => void): () => void;
    /**
     * Resolves a wildcard trigger pattern to multiple concrete triggers
     * Example: "/ColorSlot*VM/TRIGGER" → [ColorSlot1VM/TRIGGER, ColorSlot2VM/TRIGGER, ...]
     */
    private _resolveWildcardTriggers;
    /**
     * Recursively searches for a nested ViewModel by name within a parent ViewModel
     * @param parentVMI - The parent ViewModelInstance to search within
     * @param targetName - The name of the nested ViewModel to find
     * @returns The found ViewModelInstance or null
     */
    private _findNestedViewModel;
    /**
     * Generic resolver for ViewModel properties (trigger, enum, color, number, etc.)
     * Supports:
     * - "PROPERTY_NAME" -> looks in this._viewModelInstance
     * - "/PROPERTY_NAME" -> looks in this._viewModelInstance
     * - "/viewModelName/PROPERTY_NAME" -> looks in this._viewModels.get(viewModelName) or nested
     * - Falls back to searching all viewModels
     *
     * @param path - The path to the property (e.g., "MY_TRIGGER", "/nested/MY_COLOR")
     * @param propertyType - The type of property to resolve ('trigger', 'enum', 'color', 'number', etc.)
     * @returns The resolved property or null
     */
    protected _resolveViewModelProperty<T = any>(path: string, propertyType: 'trigger' | 'enum' | 'color' | 'number' | 'string' | 'boolean' | 'list' | 'image' | 'artboard' | 'viewModel'): T | null;
    /**
     * Legacy trigger resolver - now uses the generic resolver
     * @deprecated Use _resolveViewModelProperty instead
     */
    /**
     * Remove all event listeners for a specific event name
     */
    ClearRiveTriggerListeners(eventName: string): void;
    /**
     * Remove all event listeners
     */
    ClearAllRiveTriggerListeners(): void;
    private _eventCallbacks;
    /**
     * Subscribe to a Rive event by name
     * @param eventName The name of the Rive event to listen for
     * @param callback Function to call when the event fires
     * @returns Unsubscribe function
     */
    OnRiveEventDeprecated(eventName: string, callback: (event: any) => void): () => void;
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
     * Check if a specific ViewModel exists by name
     * @param vmName - The name of the ViewModel to check
     * @returns true if the ViewModel exists, false otherwise
     */
    HasViewModel(vmName: string): boolean;
    /**
     * Get a specific ViewModel by name
     * @param vmName - The name of the ViewModel to retrieve
     * @returns The ViewModelInstance or null if not found
     */
    GetViewModel(vmName: string): ViewModelInstance | null;
    /**
     * Register a ViewModel by name
     * @param vmName - The name to register the ViewModel under
     * @param vmi - The ViewModelInstance to register
     */
    RegisterViewModel(vmName: string, vmi: ViewModelInstance): void;
    /**
     * Queue a ViewModel enum change to be applied in the next frame.
     * This ensures State Machines process changes one per frame in sequence.
     * @param path - The path to the enum property (e.g., "POD_TYPE")
     * @param value - The string value to set (e.g., "SPACE")
     */
    QueueViewModelEnumChange(path: string, value: string): void;
    /**
     * Queue an input trigger to be fired in the next available frame.
     * This ensures State Machines process triggers one per frame in sequence.
     * @param inputName - The name of the trigger input (e.g., "FADE_IN_EVENT")
     */
    QueueInputTrigger(inputName: string): void;
    /**
     * Queue an input boolean change to be applied in the next available frame.
     * @param inputName - The name of the boolean input
     * @param value - The boolean value to set
     */
    QueueInputBoolean(inputName: string, value: boolean): void;
    /**
     * Queue an input number change to be applied in the next available frame.
     * @param inputName - The name of the number input
     * @param value - The number value to set
     */
    QueueInputNumber(inputName: string, value: number): void;
    /**
     * Process the next queued action (ViewModel enum change or input action) - called once per frame in Update
     */
    private _processActionQueue;
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
