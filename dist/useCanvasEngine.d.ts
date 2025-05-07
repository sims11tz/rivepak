import { RiveInstance } from "./canvasObjects/CanvasRiveObj";
import { JSX } from "react";
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
    debugMode?: boolean;
    constructor({ usePhysics, width, height, debugMode, }: {
        usePhysics?: boolean | undefined;
        width?: number | undefined;
        height?: number | undefined;
        debugMode?: boolean | undefined;
    });
}
export declare class CanvasEngine {
    private static _instance;
    static get(): CanvasEngine;
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
    Init(canvasSettings: CanvasSettingsDef, onInitComplete?: () => void): Promise<void>;
    ToggleRunState(): void;
    SetRunState(state: CANVAS_ENGINE_RUN_STATE): void;
    private fpsValue;
    private fpsCallback?;
    setFpsCallback(cb: (fps: string) => void): void;
    getFPS(): string;
    Dispose(): void;
    AddCanvasObjects(objs: CanvasObj | CanvasObj[], group?: string): void;
    private updateZIndex;
    SetRefs({ canvasRef, pixiCanvasRef, debugContainerRef, runStateLabel, fpsLabel, fpsSpinner, }: {
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
    ToggleRunState: () => void;
    SetRunState: (state: CANVAS_ENGINE_RUN_STATE) => void;
    fpsRef: React.RefObject<HTMLDivElement>;
    runStateLabel: React.RefObject<HTMLDivElement>;
};
