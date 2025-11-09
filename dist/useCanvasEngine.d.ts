import { AnimationMetadata, RiveInstance } from "./canvasObjects/CanvasRiveObj";
import React, { JSX } from "react";
import { BaseCanvasObj } from "./canvasObjects/_baseCanvasObj";
import { RiveObjectsSet } from "./controllers/RiveController";
import { RiveTimelineController } from "./canvasObjects/RiveTimelineController";
export declare enum CANVAS_ENGINE_RUN_STATE {
    STOPPED = "STOPPED",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED"
}
export declare class ResizeCanvasObj {
    private _disposed;
    width: number;
    height: number;
    scale: number;
    margin: string;
    canvasRef: HTMLCanvasElement | null;
    fullWidth: number;
    fullHeight: number;
    constructor(width: number, height: number, scale: number, margin: string, canvasRef?: HTMLCanvasElement | null);
}
export declare class CanvasSettingsDef {
    physicsEnabled?: boolean;
    physicsWalls?: boolean;
    width?: number;
    height?: number;
    autoScale?: boolean;
    debugMode?: boolean;
    borderWidth?: number;
    borderColor?: string;
    targetScaleElementId?: string;
    constructor({ physicsEnabled, physicsWalls, width, height, autoScale, debugMode, borderWidth, borderColor, targetScaleElementId }: {
        physicsEnabled?: boolean | undefined;
        physicsWalls?: boolean | undefined;
        width?: number | undefined;
        height?: number | undefined;
        autoScale?: boolean | undefined;
        debugMode?: boolean | undefined;
        borderWidth?: number | undefined;
        borderColor?: string | undefined;
        targetScaleElementId?: string | undefined;
    });
}
export declare class CanvasEngine {
    private static _instance;
    static get(): CanvasEngine;
    canvasContainerRef: HTMLDivElement | null;
    canvasAreaRef: HTMLDivElement | null;
    canvasRef: HTMLCanvasElement | null;
    pixiCanvasRefAbove: HTMLCanvasElement | null;
    pixiCanvasRefBelow: HTMLCanvasElement | null;
    debugContainerRef: HTMLDivElement | null;
    runStateLabel: HTMLDivElement | null;
    fpsLabel: HTMLDivElement | null;
    fpsSpinner: HTMLDivElement | null;
    private _rive;
    get RiveInstance(): RiveInstance | null;
    private _canvasObjects;
    get CanvasObjects(): Map<string, BaseCanvasObj[]>;
    private _riveTimelineControllers;
    get RiveTimelineControllers(): RiveTimelineController[];
    private _animationFrameId;
    private _riveInstance;
    get Rive(): RiveInstance | null;
    private _runState;
    private _engine;
    get EngineSettings(): CanvasSettingsDef | null;
    private _canvasSettings;
    private _canvasWidth;
    get width(): number;
    private _canvasHeight;
    get height(): number;
    private updateListeners;
    AddUpdateListener(listener: (t: number, dt: number, frameCount: number, oncePerSecond: boolean) => void): void;
    RemoveUpdateListener(listener: (t: number, dt: number, frameCount: number, oncePerSecond: boolean) => void): void;
    Init(canvasSettings: CanvasSettingsDef, onInitComplete?: () => void): Promise<void>;
    get RunState(): CANVAS_ENGINE_RUN_STATE;
    ToggleRunState(): void;
    SetRunState(state: CANVAS_ENGINE_RUN_STATE): void;
    private fpsValue;
    private fpsCallback?;
    SetFpsCallback(cb: (fps: string) => void): void;
    GetFPS(): string;
    GetTimelineController(animationMetaData: AnimationMetadata): RiveTimelineController | null;
    CreateTimelineController(animationMetaData: AnimationMetadata): RiveTimelineController;
    DestroyTimelineController(animationMetaData: AnimationMetadata): void;
    AddCanvasObjects(objs: BaseCanvasObj | BaseCanvasObj[] | RiveObjectsSet, group?: string): BaseCanvasObj | BaseCanvasObj[] | RiveObjectsSet;
    RemoveCanvasObjects(objs: BaseCanvasObj | BaseCanvasObj[], group?: string): void;
    private updateZIndex;
    /**
     * Removes an object from the engine's tracking without calling Dispose again
     * This is called by BaseCanvasObj.Dispose() via the OnDispose callback
     */
    private removeObjectFromTracking;
    private _resizeDebounceTimeout;
    ResizeWindowEvent: () => void;
    private _currentCanvasScale;
    private _currentFullCanvasScale;
    get CurrentCanvasScale(): number;
    ResizeCanvasToWindow: () => void;
    DebugLogLayering(): void;
    DebugLog(summaryOnly?: boolean): void;
    private _disposed;
    Dispose(): void;
    SetRefs({ canvasContainerRef, canvasAreaRef, canvasRef, pixiCanvasRefAbove, pixiCanvasRefBelow, debugContainerRef, runStateLabel, fpsLabel, fpsSpinner, }: {
        canvasContainerRef: HTMLDivElement;
        canvasAreaRef: HTMLDivElement;
        canvasRef: HTMLCanvasElement;
        pixiCanvasRefAbove?: HTMLCanvasElement;
        pixiCanvasRefBelow?: HTMLCanvasElement;
        debugContainerRef?: HTMLDivElement;
        runStateLabel?: HTMLDivElement;
        fpsLabel?: HTMLDivElement;
        fpsSpinner?: HTMLDivElement;
    }): void;
}
export declare function UseCanvasEngineHook(settings?: Partial<ConstructorParameters<typeof CanvasSettingsDef>[0]>, onInit?: () => void): {
    RivePakCanvas: () => JSX.Element | null;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    pixiCanvasRefAbove: React.RefObject<HTMLCanvasElement>;
    pixiCanvasRefBelow: React.RefObject<HTMLCanvasElement>;
    canvasObjects: Map<string, BaseCanvasObj[]>;
    debugContainerRef: React.RefObject<HTMLDivElement>;
    addCanvasObjects: (objs: BaseCanvasObj | BaseCanvasObj[] | RiveObjectsSet, group?: string) => void;
    fpsRef: React.RefObject<HTMLDivElement>;
    runStateLabel: React.RefObject<HTMLDivElement>;
    ToggleRunState: () => void;
    SetRunState: (state: CANVAS_ENGINE_RUN_STATE) => void;
    RunState: () => CANVAS_ENGINE_RUN_STATE;
};
