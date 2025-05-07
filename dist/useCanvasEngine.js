var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PhysicsController } from "./controllers/PhysicsController";
import { PixiController } from "./controllers/PixiController";
import { useEffect, useRef } from "react";
import { RiveController } from "./controllers/RiveController";
import Matter from "matter-js";
export var CANVAS_ENGINE_RUN_STATE;
(function (CANVAS_ENGINE_RUN_STATE) {
    CANVAS_ENGINE_RUN_STATE["STOPPED"] = "STOPPED";
    CANVAS_ENGINE_RUN_STATE["RUNNING"] = "RUNNING";
    CANVAS_ENGINE_RUN_STATE["PAUSED"] = "PAUSED";
})(CANVAS_ENGINE_RUN_STATE || (CANVAS_ENGINE_RUN_STATE = {}));
export class CanvasSettingsDef {
    constructor(usePhysics = false, width = 800, height = 500) {
        this.usePhysics = usePhysics;
        this.width = width;
        this.height = height;
    }
}
export class CanvasEngine {
    constructor() {
        this.canvasRef = null;
        this.pixiCanvasRef = null;
        this.debugContainerRef = null;
        this.runStateLabel = null;
        this.fpsLabel = null;
        this.fpsSpinner = null;
        this.rive = null;
        this.canvasObjects = new Map();
        this.animationFrameId = null;
        this.riveInstance = null;
        this.runState = CANVAS_ENGINE_RUN_STATE.STOPPED;
        this.engine = null;
    }
    static get() { if (!CanvasEngine._instance)
        CanvasEngine._instance = new CanvasEngine(); return CanvasEngine._instance; }
    init(canvasSettings, onInitComplete) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("CanvasEngine - Initializing......");
            if (!this.canvasRef)
                throw new Error("canvasRef not set");
            this.runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
            if (this.runStateLabel)
                this.runStateLabel.innerText = this.runState;
            const canvas = this.canvasRef;
            canvas.width = canvasSettings.width;
            canvas.height = canvasSettings.height;
            yield RiveController.get().init(canvas);
            const riveInstance = RiveController.get().Rive;
            this.rive = riveInstance;
            this.riveInstance = riveInstance;
            const riveRenderer = RiveController.get().Renderer;
            let riveFps = 0;
            riveInstance.enableFPSCounter((rFps) => (riveFps = Math.round(rFps)));
            if (canvasSettings.usePhysics)
                PhysicsController.get().init(canvas, this.debugContainerRef, true);
            let lastTime = 0;
            let accumulatedTime = 0;
            let skipsPerSecond = 0;
            let iterationCount = 0;
            let frameCount = 0;
            let lastLogTime = performance.now();
            const spinnerFrames = [' -- ', ' \\', ' | ', ' / ', ' -- ', ' \\', ' | ', ' / '];
            let spinnerIdx = 0;
            const updateLoop = (time) => {
                if (this.runState !== CANVAS_ENGINE_RUN_STATE.RUNNING) {
                    lastTime = time;
                    this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
                    return;
                }
                iterationCount++;
                frameCount++;
                if (!lastTime)
                    lastTime = time;
                let elapsedTimeSec = (time - lastTime) / 1000;
                lastTime = time;
                accumulatedTime += elapsedTimeSec;
                if (accumulatedTime < 0.02) {
                    skipsPerSecond++;
                    this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
                    return;
                }
                elapsedTimeSec = accumulatedTime;
                accumulatedTime = 0;
                const onceSecond = time - lastLogTime > 1000;
                if (onceSecond) {
                    if (this.fpsLabel)
                        this.fpsLabel.innerText = `FPS=${riveFps}:${iterationCount}, Skips=${skipsPerSecond}`;
                    skipsPerSecond = 0;
                    iterationCount = 0;
                    lastLogTime = time;
                    if (this.fpsSpinner)
                        this.fpsSpinner.innerText = spinnerFrames[spinnerIdx];
                    spinnerIdx = (spinnerIdx + 1) % spinnerFrames.length;
                }
                if (canvasSettings.usePhysics)
                    PhysicsController.get().update(elapsedTimeSec, frameCount, onceSecond);
                riveRenderer.clear();
                this.canvasObjects.forEach((objects) => objects.forEach((obj) => obj.update(elapsedTimeSec, frameCount, onceSecond)));
                riveRenderer.flush();
                this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
            };
            this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
            if (onInitComplete)
                onInitComplete();
        });
    }
    dispose() {
        this.runState = CANVAS_ENGINE_RUN_STATE.STOPPED;
        if (this.engine) {
            Matter.Events.off(this.engine, "collisionStart");
            Matter.World.clear(this.engine.world, false);
            Matter.Engine.clear(this.engine);
        }
        this.canvasObjects.forEach((objs) => objs.forEach((o) => o.dispose()));
        this.canvasObjects.clear();
        if (this.animationFrameId && this.riveInstance) {
            this.riveInstance.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        RiveController.get().dispose();
        PixiController.get().dispose();
        if (this.rive)
            this.rive = null;
        if (this.engine)
            this.engine = null;
    }
    addCanvasObjects(objs, group = "main") {
        const cObjs = Array.isArray(objs) ? objs : [objs];
        if (!this.canvasObjects.has(group))
            this.canvasObjects.set(group, []);
        const groupArray = this.canvasObjects.get(group);
        cObjs.forEach((obj) => (obj.onZIndexChanged = this.updateZIndex.bind(this)));
        groupArray.push(...cObjs);
        groupArray.sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
    }
    updateZIndex(canvasObj, newZIndex) {
        var _a;
        if (canvasObj.z === newZIndex)
            return;
        const group = (_a = canvasObj.group) !== null && _a !== void 0 ? _a : "main";
        const groupArray = this.canvasObjects.get(group);
        if (!groupArray)
            return;
        const index = groupArray.indexOf(canvasObj);
        if (index !== -1) {
            groupArray.splice(index, 1);
            groupArray.push(canvasObj);
            groupArray.sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
        }
    }
    setRefs({ canvasRef, pixiCanvasRef, debugContainerRef, runStateLabel, fpsLabel, fpsSpinner }) {
        this.canvasRef = canvasRef;
        this.pixiCanvasRef = pixiCanvasRef || null;
        this.debugContainerRef = debugContainerRef || null;
        this.runStateLabel = runStateLabel || null;
        this.fpsLabel = fpsLabel || null;
        this.fpsSpinner = fpsSpinner || null;
    }
}
export function useCanvasEngineHook(canvasSettings, onInit) {
    const canvasRef = useRef(null);
    const pixiCanvasRef = useRef(null);
    const debugContainerRef = useRef(null);
    const runStateLabel = useRef(null);
    const fpsLabel = useRef(null);
    const fpsSpinner = useRef(null);
    useEffect(() => {
        console.log("useCanvasEngineHook Initializing Canvas Engine!.!.!");
        const engine = CanvasEngine.get();
        engine.setRefs({
            canvasRef: canvasRef.current,
            pixiCanvasRef: pixiCanvasRef.current,
            debugContainerRef: debugContainerRef.current,
            runStateLabel: runStateLabel.current,
            fpsLabel: fpsLabel.current,
            fpsSpinner: fpsSpinner.current,
        });
        engine.init(canvasSettings, onInit);
        return () => engine.dispose();
    }, []);
    return {
        canvasRef,
        pixiCanvasRef,
        debugContainerRef,
        runStateLabel,
        fpsLabel,
        fpsSpinner,
        addCanvasObjects: CanvasEngine.get().addCanvasObjects.bind(CanvasEngine.get()),
        canvasObjectsRef: { current: CanvasEngine.get().canvasObjects },
        fps: fpsLabel,
    };
}
