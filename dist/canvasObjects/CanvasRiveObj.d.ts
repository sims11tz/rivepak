/// <reference types="matter-js" />
import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance, ViewModelInstance } from "@rive-app/webgl2-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { BaseCanvasObj } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export declare enum RIVEBUS_COMMON_APP_TO_RIVE_EVENTS {
    BUTTON_CLICK_EVENT = "BUTTON_CLICK_EVENT",
    REQUEST_TRANSITION_IN = "REQUEST_TRANSITION_IN",
    REQUEST_TRANSITION_OUT = "REQUEST_TRANSITION_OUT"
}
export declare enum RIVE_COMMON_ENUMS {
    DEBUG_IN_EDITOR = "DEBUG_IN_EDITOR",
    VISIBLE = "VISIBLE",
    BUTTON_CLICK_FX_COLOR = "BUTTON_CLICK_FX_COLOR",
    BUTTON_STATE = "BUTTON_STATE",
    SIZE = "SIZE"
}
export declare enum RIVEBUS_COMMON_RIVE_TO_APP_EVENTS {
    EVENT_TRANSITION_IN_STARTED = "EVENT_TRANSITION_IN_STARTED",
    EVENT_TRANSITION_IN_COMPLETED = "EVENT_TRANSITION_IN_COMPLETED",
    EVENT_TRANSITION_OUT_STARTED = "EVENT_TRANSITION_OUT_STARTED",
    EVENT_TRANSITION_OUT_COMPLETED = "EVENT_TRANSITION_OUT_COMPLETED"
}
export declare enum RIVE_COMMON_VISIBLE {
    TRUE = "TRUE",
    FALSE = "FALSE"
}
export declare enum RIVE_COMMON_ACTIVE {
    TRUE = "TRUE",
    FALSE = "FALSE"
}
export declare enum RIVE_COMMON_SELECTED {
    TRUE = "TRUE",
    FALSE = "FALSE"
}
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
    private _layoutFit;
    private _layoutAlignment;
    private _actionQueue;
    private _actionQueueProcessedThisFrame;
    _triggerCallbacks: Map<string, ((event: any) => void)[]>;
    protected _triggerCache: Map<string, any>;
    private _triggersNeedingInitialClear;
    private _triggerUnsubscribeFunctions;
    /**
     * Subscribe to a Rive event by name
     * @param eventName The name of the Rive event to listen for
     * @param callback Function to call when the event fires
     * @returns Unsubscribe function
     */
    OnRiveTrigger(eventName: string, callback: (event: any) => void, required?: boolean): (() => void) | null;
    /**
     * Resolves a wildcard trigger pattern to multiple concrete triggers
     * Example: "/ColorSlot*VM/TRIGGER" → [ColorSlot1VM/TRIGGER, ColorSlot2VM/TRIGGER, ...]
     * NOTE: Uses strict matching - no fallback searches. Only matches exact ViewModel names.
     */
    private _resolveWildcardTriggers;
    /**
     * Strict ViewModel property resolver - only looks in registered VMs and nested VMs
     * Does NOT fall back to searching all ViewModels
     * Used by wildcard resolution to prevent false matches
     */
    private _resolveViewModelPropertyStrict;
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
    protected _viewModelProperty<T = any>(path: string, propertyType: 'trigger' | 'enum' | 'color' | 'number' | 'string' | 'boolean' | 'list' | 'image' | 'artboard' | 'viewModel', required?: boolean): T | null;
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
    TransitionOut(): void;
    /**
     * Remove all event listeners for a specific event name
     */
    ClearRiveEventListeners(eventName: string): void;
    /**
     * Remove all event listeners
     */
    ClearAllRiveEventListeners(): void;
    /**
     * Override SetParent to manage interactive graphics lifecycle
     */
    SetParent(parent: BaseCanvasObj | null): void;
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
    get layoutFit(): any;
    set layoutFit(value: any);
    get layoutAlignment(): any;
    set layoutAlignment(value: any);
    /**
     * Set both layout fit and alignment in one call
     * @example obj.SetLayout(obj.Rive.Fit.cover, obj.Rive.Alignment.center)
     */
    SetLayout(fit: any, alignment: any): void;
    /**
     * Convenience getter for Rive's Fit options
     * @example obj.RiveFit.contain, obj.RiveFit.cover, obj.RiveFit.fill, etc.
     */
    get RiveFit(): any;
    /**
     * Convenience getter for Rive's Alignment options
     * @example obj.RiveAlignment.center, obj.RiveAlignment.topLeft, etc.
     */
    get RiveAlignment(): any;
    constructor(riveDef: RiveObjectDef, artboard: Artboard);
    private _lastMousePos;
    private _lastMouseDown;
    private _entityObj;
    private dumpWasmObject;
    /**
     * Override InitVisuals to create interactive graphics when object is added to engine
     */
    InitVisuals(): void;
    InitRiveObject(): void;
    private _initRiveObjectVisuals;
    private _initRiveObjectStates;
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
    private _customOncePerCheck;
    private _ranOncePerCheck;
    Update(time: number, frameCount: number, onceSecond: boolean, onceMinute: boolean): void;
    SetText(text: string): void;
    /**
     * Change the scale mode at runtime
     * @param scaleMode - The new scale mode to apply
     * @param scaleBounds - Optional new bounds (if not provided, uses existing scaleBounds from defObj)

    public SetScaleMode(scaleMode:OBJECT_SCALE_MODE, scaleBounds?:{width:number; height:number}): void
    {
        // Update defObj
        this.defObj.scaleMode = scaleMode;
        if(scaleBounds)
        {
            this.defObj.scaleBounds = scaleBounds;
        }

        // Recalculate dimensions
        const artboardWidth = this.artboard.width;
        const artboardHeight = this.artboard.height;
        const aspectRatio = artboardWidth / artboardHeight;

        if(scaleMode !== OBJECT_SCALE_MODE.MANUAL && this.defObj.scaleBounds)
        {
            const bounds = this.defObj.scaleBounds;
            const boundsAspectRatio = bounds.width / bounds.height;

            switch(scaleMode)
            {
                case OBJECT_SCALE_MODE.STRETCH:
                    this.width = bounds.width;
                    this.height = bounds.height;
                    this.xScale = this.width / artboardWidth;
                    this.yScale = this.height / artboardHeight;
                    break;

                case OBJECT_SCALE_MODE.FIT:
                    if(aspectRatio > boundsAspectRatio)
                    {
                        this.width = bounds.width;
                        this.height = this.width / aspectRatio;
                    }
                    else
                    {
                        this.height = bounds.height;
                        this.width = this.height * aspectRatio;
                    }
                    this.xScale = this.width / artboardWidth;
                    this.yScale = this.height / artboardHeight;
                    break;

                case OBJECT_SCALE_MODE.FILL:
                    if(aspectRatio > boundsAspectRatio)
                    {
                        this.height = bounds.height;
                        this.width = this.height * aspectRatio;
                    }
                    else
                    {
                        this.width = bounds.width;
                        this.height = this.width / aspectRatio;
                    }
                    this.xScale = this.width / artboardWidth;
                    this.yScale = this.height / artboardHeight;
                    break;
            }
        }
        else
        {
            // MANUAL mode - reset to defObj values or defaults
            this.xScale = this.defObj.xScale ?? 1;
            this.yScale = this.defObj.yScale ?? 1;
            this.width = artboardWidth * this.xScale;
            this.height = artboardHeight * this.yScale;
        }

        // Update entity obj for interactive objects
        if(this._entityObj)
        {
            this.updateEntityObj();
        }

        // Reapply resolution scale if it's set
        if(this._resolutionScale !== -1)
        {
            this.ApplyResolutionScale(this._resolutionScale, '*');
        }
    }
*/
    private _textLabel;
    private drawTextLabel;
    private _interactiveGraphics;
    private _needsInteractive;
    private initInteractive;
    private destroyInteractive;
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
