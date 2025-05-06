var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import RiveController from "../../controllers/RiveController";
import PhysicsController from "../../controllers/PhysicsController";
import { CUSTOM_CLIENT_EVENTS } from "../../dataTypes/ClientDataTypes";
import PixiController from "../../controllers/PixiController";
export var CANVAS_ENGINE_RUN_STATE;
(function (CANVAS_ENGINE_RUN_STATE) {
    CANVAS_ENGINE_RUN_STATE["STOPPED"] = "STOPPED";
    CANVAS_ENGINE_RUN_STATE["RUNNING"] = "RUNNING";
    CANVAS_ENGINE_RUN_STATE["PAUSED"] = "PAUSED";
})(CANVAS_ENGINE_RUN_STATE || (CANVAS_ENGINE_RUN_STATE = {}));
export class CanvasSettingsDef {
    constructor({ usePhysics, width = 800, height = 500 }) { this.usePhysics = usePhysics; this.width = width; this.height = height; }
}
const useCanvasEngine = (canvasSettings, onInitComplete) => {
    const debug = false;
    if (debug) {
        console.clear();
        console.log("______________________________________________________");
        console.log("__useCanvasEngine__ STARTING UP !");
    }
    const canvasRef = useRef(null);
    const pixiCanvasRef = useRef(null);
    const debugContainerRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const [rive, setRive] = useState(null);
    const [pixiApp, setPixiApp] = useState(null);
    const riveInstanceRef = useRef(null);
    const canvasObjectsRef = useRef(new Map());
    const engineRef = useRef(null);
    const fps = useRef(null);
    const fpsSpinner = useRef(null);
    const runState = useRef(CANVAS_ENGINE_RUN_STATE.STOPPED);
    const runStateLabel = useRef(null);
    const onToggleRunStateEvent = (event) => {
        if (runState.current === CANVAS_ENGINE_RUN_STATE.RUNNING) {
            runState.current = CANVAS_ENGINE_RUN_STATE.PAUSED;
        }
        else if (runState.current === CANVAS_ENGINE_RUN_STATE.PAUSED) {
            runState.current = CANVAS_ENGINE_RUN_STATE.RUNNING;
        }
        runStateLabel.current.innerText = runState.current.toString();
    };
    const updateZIndex = (canvasObj, newZIndex) => {
        var _a;
        if (canvasObj.z === newZIndex)
            return;
        const group = (_a = canvasObj.group) !== null && _a !== void 0 ? _a : "main";
        const groupArray = canvasObjectsRef.current.get(group);
        if (!groupArray)
            return;
        const index = groupArray.indexOf(canvasObj);
        if (index !== -1) {
            groupArray.splice(index, 1);
            groupArray.push(canvasObj);
            groupArray.sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
        }
    };
    const addCanvasObjects = (canvasObjs, group = "main") => {
        const cObjs = Array.isArray(canvasObjs) ? canvasObjs : [canvasObjs];
        if (!canvasObjectsRef.current.has(group)) {
            canvasObjectsRef.current.set(group, []);
        }
        const groupArray = canvasObjectsRef.current.get(group);
        cObjs.forEach((obj) => { obj.onZIndexChanged = updateZIndex; });
        groupArray.push(...cObjs);
        groupArray.sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
    };
    const setupRive = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (!canvasRef.current)
            return;
        runState.current = CANVAS_ENGINE_RUN_STATE.RUNNING;
        runStateLabel.current.innerText = runState.current.toString();
        window.addEventListener(CUSTOM_CLIENT_EVENTS.CANVAS_ENGINE_TOGGLE_RUN_STATE_EVENT, onToggleRunStateEvent);
        const canvas = canvasRef.current;
        canvas.width = (_a = canvasSettings.width) !== null && _a !== void 0 ? _a : 800;
        canvas.height = (_b = canvasSettings.height) !== null && _b !== void 0 ? _b : 500;
        yield RiveController.get().init(canvas);
        const riveInstance = RiveController.get().Rive;
        setRive(riveInstance);
        riveInstanceRef.current = riveInstance;
        let riveFps = 0;
        riveInstance.enableFPSCounter((rFps) => { riveFps = Math.round(rFps); });
        if (canvasSettings.usePhysics)
            PhysicsController.get().init(canvas, debugContainerRef.current, true);
        let lastTime = 0;
        let iterationCount = 0;
        let frameCount = 0;
        let lastLogTime = performance.now();
        const spinnerFrames = [" -- ", " \\ ", " | ", " / ", " -- ", " \\", " | ", " / "];
        let spinnerIdx = 0;
        const riveRenderer = RiveController.get().Renderer;
        //const MIN_TIME_STEP = 0.012;
        const MIN_TIME_STEP = 0.020;
        let accumulatedTime = 0;
        let skipsPerSecond = 0;
        const updateLoop = (time) => {
            if (runState.current !== CANVAS_ENGINE_RUN_STATE.RUNNING) {
                lastTime = time;
                animationFrameIdRef.current = riveInstance.requestAnimationFrame(updateLoop);
                return;
            }
            iterationCount++;
            frameCount++;
            if (!lastTime)
                lastTime = time;
            let elapsedTimeSec = (time - lastTime) / 1000;
            lastTime = time;
            // ✅ Accumulate skipped time properly
            accumulatedTime += elapsedTimeSec;
            if (accumulatedTime < MIN_TIME_STEP) {
                skipsPerSecond++;
                animationFrameIdRef.current = riveInstance.requestAnimationFrame(updateLoop);
                //console.log(`Skipping frame ${numSkips}/${numNoSkips} - elapsedTime=${elapsedTimeSec.toFixed(4)}, accumulatedTime=${accumulatedTime.toFixed(4)}`);
                return;
            }
            // ✅ If enough time has passed, use the accumulated time and reset it
            elapsedTimeSec = accumulatedTime;
            accumulatedTime = 0;
            let onceSecond = false;
            if (time - lastLogTime > 1000) {
                onceSecond = true;
                if (fps.current) {
                    fps.current.innerText = `FPS=${riveFps}:${iterationCount}, Skips=${skipsPerSecond}`;
                }
                skipsPerSecond = 0;
                iterationCount = 0;
                lastLogTime = time;
                if (fpsSpinner.current) {
                    fpsSpinner.current.innerText = spinnerFrames[spinnerIdx];
                }
                spinnerIdx = (spinnerIdx + 1) % spinnerFrames.length;
            }
            if (canvasSettings.usePhysics)
                PhysicsController.get().update(elapsedTimeSec, frameCount, onceSecond);
            riveRenderer.clear();
            canvasObjectsRef.current.forEach((objects) => {
                objects.forEach((canvasObj) => {
                    canvasObj.update(elapsedTimeSec, frameCount, onceSecond);
                });
            });
            riveRenderer.flush();
            animationFrameIdRef.current = riveInstance.requestAnimationFrame(updateLoop);
        };
        animationFrameIdRef.current = riveInstance.requestAnimationFrame(updateLoop);
        if (onInitComplete)
            onInitComplete();
    });
    const setupPixi = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!pixiCanvasRef.current)
            return;
        PixiController.get().init(canvasSettings.width, canvasSettings.height);
    });
    useEffect(() => {
        setupRive();
        setupPixi();
        const canvas = canvasRef.current;
        return () => {
            window.removeEventListener(CUSTOM_CLIENT_EVENTS.CANVAS_ENGINE_TOGGLE_RUN_STATE_EVENT, onToggleRunStateEvent);
            runState.current = CANVAS_ENGINE_RUN_STATE.STOPPED;
            if (engineRef.current) {
                Matter.Events.off(engineRef.current, "collisionStart");
                Matter.World.clear(engineRef.current.world, false);
                Matter.Engine.clear(engineRef.current);
            }
            canvasObjectsRef.current.forEach((objects) => {
                objects.forEach((canvasObj) => {
                    canvasObj.dispose();
                });
            });
            if (canvasObjectsRef.current) {
                canvasObjectsRef.current.clear();
            }
            if (animationFrameIdRef.current) {
                riveInstanceRef.current.cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            RiveController.get().dispose();
            setRive(null);
            PixiController.get().dispose();
            if (canvasSettings.usePhysics)
                PhysicsController.get().dispose();
        };
    }, []);
    return {
        canvasRef, pixiCanvasRef, debugContainerRef, rive, fps, fpsSpinner, canvasObjectsRef, runStateLabel,
        addCanvasObjects
    };
};
export default useCanvasEngine;
