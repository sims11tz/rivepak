var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    constructor({ usePhysics = false, width = 800, height = 500, autoScale = false, debugMode = false, }) {
        this.usePhysics = usePhysics;
        this.width = width;
        this.height = height;
        this.autoScale = autoScale;
        this.debugMode = debugMode;
    }
}
export class CanvasEngine {
    constructor() {
        this.canvasContainerRef = null;
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
        this._canvasSettings = null;
        this._canvasWidth = 0;
        this._canvasHeight = 0;
        this.fpsValue = 0;
        this._resizeDebounceTimeout = null;
        this.ResizeWindowEvent = () => {
            if (this._resizeDebounceTimeout !== null) {
                clearTimeout(this._resizeDebounceTimeout);
            }
            this.runState = CANVAS_ENGINE_RUN_STATE.PAUSED;
            this._resizeDebounceTimeout = window.setTimeout(() => {
                this.ResizeCanvasToWindow();
                this._resizeDebounceTimeout = null;
                this.runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
            }, 250);
        };
        this._currentCanvasScale = 1;
        this.ResizeCanvasToWindow = () => {
            var _a, _b;
            console.log("CanvasEngine - ResizeCanvasToWindow()");
            //const canvas = this.canvasRef;
            //const pixiCanvas = this.pixiCanvasRef;
            if (!this._canvasSettings || !this._canvasSettings.width || !this._canvasSettings.height)
                return;
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!! RESIZE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ");
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            this._currentCanvasScale = Math.min(screenWidth / this._canvasSettings.width, screenHeight / this._canvasSettings.height);
            const newWidth = Math.floor(this._canvasSettings.width * this._currentCanvasScale);
            const newHeight = Math.floor(this._canvasSettings.height * this._currentCanvasScale);
            // 🧠 Buffer (actual pixel size) for crispness
            //canvas.width = newWidth * dpr;
            //canvas.height = newHeight * dpr;
            const horizMargin = (screenWidth - newWidth) / 2;
            const vertMargin = (screenHeight - newHeight) / 2;
            this.canvasContainerRef.style.width = `${screenWidth}px`;
            this.canvasContainerRef.style.height = `${screenHeight}px`;
            this.canvasContainerRef.style.margin = `${vertMargin}px ${horizMargin}px`;
            // 📐 Update Rive's WebGL viewport (optional but safe)
            //const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
            //if (gl)
            //{
            //	console.log("GL STUFF");
            //	gl.viewport(0, 0, canvas.width, canvas.height);
            //}
            console.log("CanvasEngine - ResizeCanvasToWindow() newWidth=", newWidth, "newHeight=", newHeight);
            // Notify Rive of resize
            (_a = RiveController.get().Canvas) === null || _a === void 0 ? void 0 : _a.setAttribute("width", `${newWidth}`);
            (_b = RiveController.get().Canvas) === null || _b === void 0 ? void 0 : _b.setAttribute("height", `${newHeight}`);
            PixiController.get().SetSize(newWidth, newHeight);
            console.log("CanvasEngine - ResizeCanvasToWindow() : CURR-SCALE => " + this._currentCanvasScale);
            // Apply canvas scale to all objects
            //this.canvasObjects.forEach((group) =>
            //{
            //	group.forEach((obj) =>
            //	{
            //		obj.ApplyResolutionScale(this._currentCanvasScale);
            //	});
            //});
        };
    }
    static get() { if (!CanvasEngine._instance)
        CanvasEngine._instance = new CanvasEngine(); return CanvasEngine._instance; }
    get EngineSettings() { return this._canvasSettings; }
    get width() { return this._canvasWidth; }
    get height() { return this._canvasHeight; }
    Init(canvasSettings, onInitComplete) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            //console.log("CanvasEngine - Initializing...... canvasSettings=",canvasSettings);
            if (!this.canvasRef)
                throw new Error("canvasRef not set");
            this._canvasSettings = canvasSettings;
            this.runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
            if (this.runStateLabel) {
                this.runStateLabel.innerText = this.runState;
            }
            const canvas = this.canvasRef;
            this._canvasWidth = canvas.width = (_a = canvasSettings.width) !== null && _a !== void 0 ? _a : 800;
            this._canvasHeight = canvas.height = (_b = canvasSettings.height) !== null && _b !== void 0 ? _b : 500;
            console.log("!! SET DAT SHIT BITCH !!");
            PixiController.get().Init(this._canvasWidth, this._canvasHeight);
            yield RiveController.get().Init(canvas);
            const riveInstance = RiveController.get().Rive;
            //riveInstance.resizeDrawingSurfaceToCanvas?.();
            this.rive = riveInstance;
            this.riveInstance = riveInstance;
            const riveRenderer = RiveController.get().Renderer;
            let riveFps = 0;
            yield riveInstance.enableFPSCounter((rFps) => {
                riveFps = Math.round(rFps);
                //this.fpsValue = riveFps;
                //if (this.fpsCallback) this.fpsCallback(this.fpsValue);
            });
            if (canvasSettings.usePhysics)
                PhysicsController.get().Init(canvas, this.debugContainerRef, canvasSettings.debugMode);
            let lastTime = 0;
            let accumulatedTime = 0;
            let skipsPerSecond = 0;
            let iterationCount = 0;
            let frameCount = 0;
            let lastLogTime = performance.now();
            const spinnerFrames = [' -- ', ' \\', ' | ', ' / ', ' -- ', ' \\', ' | ', ' / '];
            let spinnerIdx = 0;
            const MIN_TIME_STEP = 0.012;
            if (canvasSettings.debugMode == null || !canvasSettings.debugMode) {
            }
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
                if (accumulatedTime < MIN_TIME_STEP) {
                    skipsPerSecond++;
                    this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
                    //console.log(`Skipping frame ${numSkips}/${numNoSkips} - elapsedTime=${elapsedTimeSec.toFixed(4)}, accumulatedTime=${accumulatedTime.toFixed(4)}`);
                    return;
                }
                elapsedTimeSec = accumulatedTime;
                accumulatedTime = 0;
                const onceSecond = time - lastLogTime > 1000;
                if (onceSecond) {
                    if (this.fpsCallback) {
                        spinnerIdx = (spinnerIdx + 1) % spinnerFrames.length;
                        this.fpsCallback(`${spinnerFrames[spinnerIdx]} FPS=${riveFps}:${iterationCount}, Skips=${skipsPerSecond}`);
                    }
                    skipsPerSecond = 0;
                    iterationCount = 0;
                    lastLogTime = time;
                }
                if (canvasSettings.usePhysics)
                    PhysicsController.get().Update(elapsedTimeSec, frameCount, onceSecond);
                riveRenderer.clear();
                this.canvasObjects.forEach((objects) => objects.forEach((obj) => obj.Update(elapsedTimeSec, frameCount, onceSecond)));
                riveRenderer.flush();
                this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
            };
            this.animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
            if (onInitComplete)
                onInitComplete();
            window.removeEventListener("resize", this.ResizeWindowEvent);
            if (canvasSettings.autoScale) {
                window.addEventListener("resize", this.ResizeWindowEvent);
                this.ResizeCanvasToWindow();
            }
        });
    }
    ToggleRunState() {
        this.SetRunState(this.runState === CANVAS_ENGINE_RUN_STATE.RUNNING ? CANVAS_ENGINE_RUN_STATE.STOPPED : CANVAS_ENGINE_RUN_STATE.RUNNING);
    }
    SetRunState(state) {
        this.runState = state;
        if (this.runStateLabel) {
            this.runStateLabel.innerText = this.runState;
        }
    }
    SetFpsCallback(cb) {
        this.fpsCallback = cb;
    }
    GetFPS() {
        return this.fpsValue.toString();
    }
    AddCanvasObjects(objs, group = "main") {
        const cObjs = Array.isArray(objs) ? objs : [objs];
        if (!this.canvasObjects.has(group))
            this.canvasObjects.set(group, []);
        const groupArray = this.canvasObjects.get(group);
        cObjs.forEach((obj) => (obj.OnZIndexChanged = this.updateZIndex.bind(this)));
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
    get CurrentCanvasScale() { return this._currentCanvasScale; }
    Dispose() {
        this.runState = CANVAS_ENGINE_RUN_STATE.STOPPED;
        if (this.engine) {
            Matter.Events.off(this.engine, "collisionStart");
            Matter.World.clear(this.engine.world, false);
            Matter.Engine.clear(this.engine);
        }
        this.canvasObjects.forEach((objs) => objs.forEach((o) => o.Dispose()));
        this.canvasObjects.clear();
        if (this.animationFrameId && this.riveInstance) {
            this.riveInstance.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        RiveController.get().Dispose();
        PixiController.get().Dispose();
        window.removeEventListener("resize", this.ResizeWindowEvent);
        if (this._resizeDebounceTimeout !== null) {
            clearTimeout(this._resizeDebounceTimeout);
            this._resizeDebounceTimeout = null;
        }
        if (this.rive)
            this.rive = null;
        if (this.engine)
            this.engine = null;
    }
    SetRefs({ canvasContainerRef, canvasRef, pixiCanvasRef, debugContainerRef, runStateLabel, fpsLabel, fpsSpinner, }) {
        this.canvasContainerRef = canvasContainerRef;
        this.canvasRef = canvasRef;
        this.pixiCanvasRef = pixiCanvasRef || null;
        this.debugContainerRef = debugContainerRef || null;
        this.runStateLabel = runStateLabel || null;
        this.fpsLabel = fpsLabel || null;
        this.fpsSpinner = fpsSpinner || null;
    }
}
export function UseCanvasEngineHook(settings = {}, onInit) {
    const canvasSettings = new CanvasSettingsDef(settings);
    const canvasRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const pixiCanvasRef = useRef(null);
    const debugContainerRef = useRef(null);
    const runStateLabel = useRef(null);
    const fpsSpinner = useRef(null);
    const fpsRef = useRef(null);
    const ToggleRunState = () => CanvasEngine.get().ToggleRunState();
    const SetRunState = (state) => CanvasEngine.get().SetRunState(state);
    const canvasJSXRef = useRef(null);
    if (!canvasJSXRef.current) {
        canvasJSXRef.current = (_jsxs("div", { children: [_jsxs("div", Object.assign({ id: "debugTools", className: "debugTools", style: { display: canvasSettings.debugMode ? "flex" : "none", gap: "10px", marginBottom: "10px", width: "100%", alignItems: "center", justifyContent: "center" } }, { children: [_jsx("button", Object.assign({ onClick: ToggleRunState }, { children: _jsx("span", { ref: runStateLabel }) })), _jsxs("div", Object.assign({ className: "fpsContainer", style: { display: "flex", flexDirection: "row", justifyContent: "space-around" } }, { children: [_jsx("span", { className: "fpsSpinner", style: { display: "flex", maxWidth: "15px", minWidth: "15px", width: "15px" }, ref: fpsSpinner }), _jsx("span", { ref: fpsRef })] }))] })), _jsxs("div", Object.assign({ ref: canvasContainerRef, style: { position: "relative" } }, { children: [_jsx("canvas", { id: "riveCanvas", ref: canvasRef, style: { border: "1px solid black" } }), _jsx("div", Object.assign({ id: "pixiCanvasContainer", style: { position: "absolute", top: 0, left: 0, zIndex: 2 } }, { children: _jsx("canvas", { id: "pixiCanvas", ref: pixiCanvasRef }) })), canvasSettings.debugMode && _jsx("div", { ref: debugContainerRef, style: { position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: 0.25, } })] }))] }));
    }
    console.log("...........CUNT CHECK1........");
    const hasEngineInitialized = useRef(false);
    useEffect(() => {
        const engine = CanvasEngine.get();
        if (hasEngineInitialized.current) {
            console.log("⚠️ CanvasEngine already initialized, skipping Init()");
            return;
        }
        hasEngineInitialized.current = true;
        requestAnimationFrame(() => {
            if (!canvasRef.current) {
                console.warn("[RivePak] canvasRef is still null after mount. Did you forget to render CanvasView or call SetRefs?");
                return;
            }
            engine.SetFpsCallback((fps) => {
                fpsRef.current.innerText = `${fps}`;
            });
            engine.SetRefs({
                canvasContainerRef: canvasContainerRef.current,
                canvasRef: canvasRef.current,
                pixiCanvasRef: pixiCanvasRef.current,
                debugContainerRef: debugContainerRef.current,
                runStateLabel: runStateLabel.current,
                fpsLabel: fpsRef.current,
                fpsSpinner: fpsSpinner.current,
            });
            engine.Init(canvasSettings, onInit);
        });
        return () => {
            CanvasEngine.get().Dispose();
        };
    }, []);
    console.log("...........CUNT CHECK2........");
    return {
        RivePakCanvas: () => canvasJSXRef.current,
        canvasRef,
        pixiCanvasRef,
        debugContainerRef,
        canvasObjects: CanvasEngine.get().canvasObjects,
        addCanvasObjects: CanvasEngine.get().AddCanvasObjects.bind(CanvasEngine.get()),
        ToggleRunState,
        SetRunState,
        runStateLabel,
        fpsRef: fpsRef
    };
}
