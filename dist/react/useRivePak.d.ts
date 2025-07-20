import React from 'react';
import { CanvasEngine, CanvasSettingsDef, CANVAS_ENGINE_RUN_STATE } from '../useCanvasEngine';
import { CanvasObj } from '../canvasObjects/CanvasObj';
import { RiveObjectsSet } from '../controllers/RiveController';
export interface RivePakHookOptions extends Partial<CanvasSettingsDef> {
    onInit?: (engine: CanvasEngine) => void | Promise<void>;
    onError?: (error: Error) => void;
    enableOptimizations?: boolean;
    enableErrorBoundary?: boolean;
}
export interface RivePakHookResult {
    RivePakCanvas: () => JSX.Element;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    pixiCanvasRef: React.RefObject<HTMLCanvasElement>;
    debugContainerRef: React.RefObject<HTMLDivElement>;
    isInitialized: boolean;
    isLoading: boolean;
    error: Error | null;
    runState: CANVAS_ENGINE_RUN_STATE;
    toggleRunState: () => void;
    setRunState: (state: CANVAS_ENGINE_RUN_STATE) => void;
    addCanvasObjects: (objs: CanvasObj | CanvasObj[] | RiveObjectsSet, group?: string) => void;
    removeCanvasObjects: (objs: CanvasObj | CanvasObj[], group?: string) => void;
    fps: number;
    renderStats: {
        totalObjects: number;
        visibleObjects: number;
        culledObjects: number;
    };
}
export declare function useRivePak(options?: RivePakHookOptions): RivePakHookResult;
