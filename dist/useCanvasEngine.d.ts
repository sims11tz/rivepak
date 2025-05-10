import { RiveInstance } from "./canvasObjects/CanvasRiveObj";
import React, { JSX } from "react";
import { CanvasObj } from "./canvasObjects/CanvasObj";
export declare enum CANVAS_ENGINE_RUN_STATE {
    STOPPED = "STOPPED",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED"
}
export declare class CanvasSettingsDef {
    usePhysics?: boolean;
    width?: number;
    height?: number;
    autoScale?: boolean;
    debugMode?: boolean;
    constructor({ usePhysics, width, height, autoScale, debugMode, }: {
        usePhysics?: boolean | undefined;
        width?: number | undefined;
        height?: number | undefined;
        autoScale?: boolean | undefined;
        debugMode?: boolean | undefined;
    });
}
export declare class CanvasEngine {
    private static _instance;
    static get(): CanvasEngine;
    canvasContainerRef: HTMLDivElement | null;
    canvasAreaRef: HTMLDivElement | null;
    canvasRef: HTMLCanvasElement | null;
    pixiCanvasRef: HTMLCanvasElement | null;
    debugContainerRef: HTMLDivElement | null;
    runStateLabel: HTMLDivElement | null;
    fpsLabel: HTMLDivElement | null;
    fpsSpinner: HTMLDivElement | null;
    rive: RiveInstance | null;
    canvasObjects: Map<string, CanvasObj[]>;
    private animationFrameId;
    private riveInstance;
    private runState;
    private engine;
    get EngineSettings(): CanvasSettingsDef | null;
    private _canvasSettings;
    private _canvasWidth;
    get width(): number;
    private _canvasHeight;
    get height(): number;
    Init(canvasSettings: CanvasSettingsDef, onInitComplete?: () => void): Promise<void>;
    ToggleRunState(): void;
    SetRunState(state: CANVAS_ENGINE_RUN_STATE): void;
    private fpsValue;
    private fpsCallback?;
    SetFpsCallback(cb: (fps: string) => void): void;
    GetFPS(): string;
    AddCanvasObjects(objs: CanvasObj | CanvasObj[], group?: string): void;
    private updateZIndex;
    private _resizeDebounceTimeout;
    ResizeWindowEvent: () => void;
    private _currentCanvasScale;
    get CurrentCanvasScale(): number;
    ResizeCanvasToWindow: () => void;
    Dispose(): void;
    SetRefs({ canvasContainerRef, canvasAreaRef, canvasRef, pixiCanvasRef, debugContainerRef, runStateLabel, fpsLabel, fpsSpinner, }: {
        canvasContainerRef: HTMLDivElement;
        canvasAreaRef: HTMLDivElement;
        canvasRef: HTMLCanvasElement;
        pixiCanvasRef?: HTMLCanvasElement;
        debugContainerRef?: HTMLDivElement;
        runStateLabel?: HTMLDivElement;
        fpsLabel?: HTMLDivElement;
        fpsSpinner?: HTMLDivElement;
    }): void;
}
export declare function UseCanvasEngineHook(settings?: Partial<ConstructorParameters<typeof CanvasSettingsDef>[0]>, onInit?: () => void): {
    RivePakCanvas: () => JSX.Element | null;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    pixiCanvasRef: React.RefObject<HTMLCanvasElement>;
    canvasObjects: Map<string, CanvasObj[]>;
    debugContainerRef: React.RefObject<HTMLDivElement>;
    addCanvasObjects: (objs: CanvasObj | CanvasObj[], group?: string) => void;
    fpsRef: React.RefObject<HTMLDivElement>;
    runStateLabel: React.RefObject<HTMLDivElement>;
    ToggleRunState: () => void;
    SetRunState: (state: CANVAS_ENGINE_RUN_STATE) => void;
};
