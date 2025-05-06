import CanvasObj from "./CanvasObj";
export declare enum CANVAS_ENGINE_RUN_STATE {
    STOPPED = "STOPPED",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED"
}
export declare class CanvasSettingsDef {
    usePhysics?: boolean;
    width?: number;
    height?: number;
    constructor({ usePhysics, width, height }: {
        usePhysics?: boolean;
        width?: number;
        height?: number;
    });
}
declare const useCanvasEngine: (canvasSettings: CanvasSettingsDef, onInitComplete?: () => void) => {
    canvasRef: any;
    pixiCanvasRef: any;
    debugContainerRef: any;
    rive: any;
    fps: any;
    fpsSpinner: any;
    canvasObjectsRef: any;
    runStateLabel: any;
    addCanvasObjects: (canvasObjs: CanvasObj | CanvasObj[], group?: string) => void;
};
export default useCanvasEngine;
