import { RiveInstance } from "./canvasObjects/CanvasRiveObj";
import { CanvasObj } from "./canvasObjects/CanvasObj";
export declare enum CANVAS_ENGINE_RUN_STATE {
    STOPPED = "STOPPED",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    SLOW_MOTION = "SLOW_MOTION",
    FAST_FORWARD = "FAST_FORWARD"
}
export declare class CanvasSettingsDef {
    usePhysics: boolean;
    width: number;
    height: number;
    constructor(usePhysics?: boolean, width?: number, height?: number);
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
    init(canvasSettings: CanvasSettingsDef, onInitComplete?: () => void): Promise<void>;
    dispose(): void;
    addCanvasObjects(objs: CanvasObj | CanvasObj[], group?: string): void;
    private updateZIndex;
    setRefs({ canvasRef, pixiCanvasRef, debugContainerRef, runStateLabel, fpsLabel, fpsSpinner }: {
        canvasRef: HTMLCanvasElement;
        pixiCanvasRef?: HTMLCanvasElement;
        debugContainerRef?: HTMLDivElement;
        runStateLabel?: HTMLDivElement;
        fpsLabel?: HTMLDivElement;
        fpsSpinner?: HTMLDivElement;
    }): void;
}
export declare function useCanvasEngineHook(canvasSettings: CanvasSettingsDef, onInit?: () => void): {
    canvasRef: import("react").RefObject<HTMLCanvasElement>;
    pixiCanvasRef: import("react").RefObject<HTMLCanvasElement>;
    debugContainerRef: import("react").RefObject<HTMLDivElement>;
    runStateLabel: import("react").RefObject<HTMLDivElement>;
    fpsLabel: import("react").RefObject<HTMLDivElement>;
    fpsSpinner: import("react").RefObject<HTMLDivElement>;
    addCanvasObjects: (objs: CanvasObj | CanvasObj[], group?: string) => void;
    canvasObjectsRef: {
        current: Map<string, CanvasObj[]>;
    };
    fps: import("react").RefObject<HTMLDivElement>;
};
