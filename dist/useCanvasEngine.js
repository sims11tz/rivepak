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
import { PixiController, PIXI_LAYER } from "./controllers/PixiController";
import { useEffect, useRef } from "react";
import { GlobalUIDGenerator } from "./canvasObjects/_baseCanvasObj";
import { RiveController, RiveObjectsSet } from "./controllers/RiveController";
import Matter from "matter-js";
import { CanvasEngineResizePubSub, CanvasEngineStartResizePubSub } from "./CanvasEngineEventBus";
import { RiveTimelineController } from "./canvasObjects/RiveTimelineController";
export var CANVAS_ENGINE_RUN_STATE;
(function (CANVAS_ENGINE_RUN_STATE) {
    CANVAS_ENGINE_RUN_STATE["STOPPED"] = "STOPPED";
    CANVAS_ENGINE_RUN_STATE["RUNNING"] = "RUNNING";
    CANVAS_ENGINE_RUN_STATE["PAUSED"] = "PAUSED";
})(CANVAS_ENGINE_RUN_STATE || (CANVAS_ENGINE_RUN_STATE = {}));
export var CANVAS_SCALE_MODE;
(function (CANVAS_SCALE_MODE) {
    CANVAS_SCALE_MODE["LETTERBOX"] = "LETTERBOX";
    CANVAS_SCALE_MODE["FILL"] = "FILL"; // Fills parent container completely
})(CANVAS_SCALE_MODE || (CANVAS_SCALE_MODE = {}));
export class ResizeCanvasObj {
    constructor(width, height, scale, margin, canvasRef = null) {
        this._disposed = false;
        this.canvasRef = null;
        this.width = width;
        this.height = height;
        this.fullWidth = width;
        this.fullHeight = height;
        this.scale = scale;
        this.margin = margin;
        this.canvasRef = canvasRef;
    }
}
export class CanvasSettingsDef {
    constructor({ physicsEnabled = false, physicsWalls = false, width = 800, height = 500, autoScale = false, scaleMode = CANVAS_SCALE_MODE.LETTERBOX, debugMode = false, borderWidth = 1, borderColor = "black", backgroundColor = "transparent", targetScaleElementId = "routesContainer" }) {
        this.physicsEnabled = physicsEnabled;
        this.physicsWalls = physicsWalls;
        this.width = width;
        this.height = height;
        this.autoScale = autoScale;
        this.scaleMode = scaleMode;
        this.debugMode = debugMode;
        this.borderWidth = borderWidth;
        this.borderColor = borderColor;
        this.backgroundColor = backgroundColor;
        this.targetScaleElementId = targetScaleElementId;
    }
}
export class CanvasEngine {
    constructor() {
        this.canvasContainerRef = null;
        this.canvasAreaRef = null;
        this.canvasRef = null;
        this.pixiCanvasRefAbove = null;
        this.pixiCanvasRefBelow = null;
        this.debugContainerRef = null;
        this.runStateLabel = null;
        this.fpsLabel = null;
        this.fpsSpinner = null;
        this._rive = null;
        this._canvasObjects = new Map();
        this._riveTimelineControllers = [];
        this._animationFrameId = null;
        this._riveInstance = null;
        this._runState = CANVAS_ENGINE_RUN_STATE.STOPPED;
        this._engine = null;
        this._canvasSettings = null;
        this._canvasWidth = 0;
        this._canvasHeight = 0;
        this.updateListeners = new Set();
        this.fpsValue = 0;
        this._resizeDebounceTimeout = null;
        this.ResizeWindowEvent = () => {
            if (this._resizeDebounceTimeout !== null) {
                clearTimeout(this._resizeDebounceTimeout);
            }
            this._runState = CANVAS_ENGINE_RUN_STATE.PAUSED;
            CanvasEngineStartResizePubSub.Publish({});
            this._resizeDebounceTimeout = window.setTimeout(() => {
                this.ResizeCanvasToWindow();
                this._resizeDebounceTimeout = null;
                this._runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
            }, 250);
        };
        this._currentCanvasScale = -1;
        this._currentFullCanvasScale = -1;
        this.ResizeCanvasToWindow = () => {
            if (!this._canvasSettings || !this._canvasSettings.width || !this._canvasSettings.height)
                return;
            const debug = false;
            if (this._disposed)
                return;
            if (debug)
                console.log('%c ');
            if (debug)
                console.log('%c ___________________________________________________');
            if (debug)
                console.log('%c _ResizeCanvasToWindow _____________________________');
            const targetEl = document.getElementById(this._canvasSettings.targetScaleElementId || 'routesContainer');
            const newTargetBounds = targetEl.getBoundingClientRect();
            const fullEl = document.getElementById('routesContainer');
            const newFullBounds = fullEl.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            if (debug)
                console.log('%c UCE>>ResizeCanToWin  this._canvasSettings.width = ' + this._canvasSettings.width);
            if (debug)
                console.log('%c UCE>>ResizeCanToWin this._canvasSettings.height = ' + this._canvasSettings.height);
            if (debug)
                console.log('%c ');
            if (debug)
                console.log('%c UCE>>ResizeCanToWin  newTargetBounds.width = ' + newTargetBounds.width);
            if (debug)
                console.log('%c UCE>>ResizeCanToWin newTargetBounds.height = ' + newTargetBounds.height);
            if (debug)
                console.log('%c ');
            if (debug)
                console.log('%c UCE>>ResizeCanToWin  newFullBounds.width = ' + newFullBounds.width);
            if (debug)
                console.log('%c UCE>>ResizeCanToWin newFullBounds.height = ' + newFullBounds.height);
            if (debug)
                console.log('%c ');
            const scaleMode = this._canvasSettings.scaleMode || CANVAS_SCALE_MODE.LETTERBOX;
            let newTargetWidth;
            let newTargetHeight;
            let newFullWidth;
            let newFullHeight;
            let horizMargin;
            let vertMargin;
            if (scaleMode === CANVAS_SCALE_MODE.FILL) {
                // FILL mode - fill the entire parent container
                newTargetWidth = Math.floor(newTargetBounds.width);
                newTargetHeight = Math.floor(newTargetBounds.height);
                newFullWidth = Math.floor(newFullBounds.width);
                newFullHeight = Math.floor(newFullBounds.height);
                // Calculate scale based on container size
                this._currentCanvasScale = Math.min(newTargetWidth / this._canvasSettings.width, newTargetHeight / this._canvasSettings.height);
                this._currentFullCanvasScale = Math.min(newFullWidth / this._canvasSettings.width, newFullHeight / this._canvasSettings.height);
                // No margins in fill mode
                horizMargin = 0;
                vertMargin = 0;
            }
            else {
                // LETTERBOX mode - maintain aspect ratio with margins (default behavior)
                this._currentCanvasScale = Math.min(newTargetBounds.width / this._canvasSettings.width, newTargetBounds.height / this._canvasSettings.height);
                this._currentFullCanvasScale = Math.min(newFullBounds.width / this._canvasSettings.width, newFullBounds.height / this._canvasSettings.height);
                newTargetWidth = Math.floor(this._canvasSettings.width * this._currentCanvasScale);
                newTargetHeight = Math.floor(this._canvasSettings.height * this._currentCanvasScale);
                newFullWidth = Math.floor(newFullBounds.width * this._currentCanvasScale);
                newFullHeight = Math.floor(newFullBounds.height * this._currentCanvasScale);
                horizMargin = 0;
                vertMargin = (newTargetBounds.height - newTargetHeight) / 2;
                if (vertMargin < 10) {
                    vertMargin = 0;
                }
            }
            if (debug)
                console.log('%c UCE>>ResizeCanToWin scaleMode=' + scaleMode, 'color:#e84542; font-weight:bold;');
            if (debug)
                console.log('%c UCE>>ResizeCanToWin newTargetWidth=' + newTargetWidth + ', newTargetHeight=' + newTargetHeight, 'color:#e84542; font-weight:bold;');
            if (debug)
                console.log('%c UCE>>ResizeCanToWin newFullWidth=' + newFullWidth + ', newFullHeight=' + newFullHeight, 'color:#e84542; font-weight:bold;');
            this.canvasContainerRef.style.width = `${newTargetWidth}px`;
            this.canvasContainerRef.style.height = `${newTargetHeight}px`;
            this.canvasContainerRef.style.margin = `${vertMargin}px ${horizMargin}px`;
            if (debug)
                console.log('%c UCE>>ResizeCanToWin this.canvasContainerRef!.style.w=' + this.canvasContainerRef.style.width + ',.h=' + this.canvasContainerRef.style.height + ', this.canvasContainerRef!.style.h=' + this.canvasContainerRef.style.height, 'color:#483ac0; font-weight:bold;');
            if (debug)
                console.log('%cCE.resize() FULL>>>>>>', 'color:#00FF00; font-weight:bold;', newTargetWidth, newTargetHeight, 'scale:', this._currentCanvasScale.toFixed(3), 'dpr:', dpr);
            if (debug)
                console.log('%cCE.resize() TARGET>>>>', 'color:#00FF00; font-weight:bold;', newTargetWidth, newTargetHeight, 'scale:', this._currentCanvasScale.toFixed(3), 'dpr:', dpr);
            // Notify Rive of resize
            RiveController.get().SetSize(newTargetWidth, newTargetHeight, dpr);
            PixiController.get().SetSize(newTargetWidth, newTargetHeight, dpr);
            PhysicsController.get().SetSize(newTargetWidth, newTargetHeight, dpr);
            // Apply canvas scale to all objects
            this._canvasObjects.forEach((group) => {
                group.forEach((obj) => {
                    obj.ApplyResolutionScale(this._currentCanvasScale);
                });
            });
            CanvasEngineResizePubSub.Publish({ width: newTargetWidth, height: newTargetHeight, fullWidth: newFullWidth, fullHeight: newFullHeight, scale: this._currentCanvasScale, margin: `${vertMargin}px ${horizMargin}px`, canvasRef: this.canvasRef });
        };
        this._disposed = false;
    }
    static get() { if (!CanvasEngine._instance)
        CanvasEngine._instance = new CanvasEngine(); return CanvasEngine._instance; }
    get RiveInstance() { return this._rive; }
    get CanvasObjects() { return this._canvasObjects; }
    get RiveTimelineControllers() { return this._riveTimelineControllers; }
    get Rive() { return this._riveInstance; }
    get EngineSettings() { return this._canvasSettings; }
    get width() { return this._canvasWidth; }
    get height() { return this._canvasHeight; }
    AddUpdateListener(listener) {
        this.updateListeners.add(listener);
    }
    RemoveUpdateListener(listener) {
        this.updateListeners.delete(listener);
    }
    Init(canvasSettings, onInitComplete) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.canvasRef)
                throw new Error("canvasRef not set");
            this._disposed = false;
            const debug = false;
            if (this._animationFrameId && this._riveInstance) {
                this._riveInstance.cancelAnimationFrame(this._animationFrameId);
                this._animationFrameId = null;
            }
            if (debug) {
                console.log('%c ', 'color:#483ac0; font-weight:bold;');
                console.log('%c __ UseCanvasEngine.init() ___________________', 'color:#483ac0; font-weight:bold;');
            }
            GlobalUIDGenerator.clear();
            this._canvasSettings = canvasSettings;
            this._runState = CANVAS_ENGINE_RUN_STATE.RUNNING;
            if (this.runStateLabel) {
                this.runStateLabel.innerText = this._runState;
            }
            const canvas = this.canvasRef;
            this._currentCanvasScale = -1;
            //this._canvasWidth = canvas.width = canvasSettings.width ?? 800;
            //this._canvasHeight = canvas.height = canvasSettings.height ?? 500;
            this._canvasWidth = (_a = canvasSettings.width) !== null && _a !== void 0 ? _a : 800;
            this._canvasHeight = (_b = canvasSettings.height) !== null && _b !== void 0 ? _b : 500;
            if (debug)
                console.log('%c UCE>> w=' + this._canvasWidth + ', h=' + this._canvasHeight, 'color:#483ac0; font-weight:bold;');
            PixiController.get().Init(this._canvasWidth, this._canvasHeight);
            yield RiveController.get().Init(canvas);
            const riveInstance = RiveController.get().Rive;
            this._riveInstance = riveInstance;
            const riveRenderer = RiveController.get().Renderer;
            let riveFps = 0;
            yield riveInstance.enableFPSCounter((rFps) => {
                riveFps = Math.round(rFps);
                //this.fpsValue = riveFps;
                //if (this.fpsCallback) this.fpsCallback(this.fpsValue);
            });
            if (canvasSettings.physicsEnabled)
                PhysicsController.get().Init(canvas, canvasSettings.physicsWalls, this.debugContainerRef, canvasSettings.debugMode);
            let oncePerLogged = false;
            let lastTime = 0;
            let accumulatedTime = 0;
            let skipsPerSecond = 0;
            let iterationCount = 0;
            let frameCount = 0;
            let lastLogTime = performance.now();
            let lastLogTimeLong = performance.now();
            const spinnerFrames = [' -- ', ' \\', ' | ', ' / ', ' -- ', ' \\', ' | ', ' / '];
            let spinnerIdx = 0;
            const MIN_TIME_STEP = 0.010;
            //const MIN_TIME_STEP = 0.012;
            //const MIN_TIME_STEP = 0.00012;
            if (canvasSettings.debugMode == null || !canvasSettings.debugMode) {
            }
            let inFrame = false;
            let firstFrameRan = false;
            const updateLoop = (time) => {
                if (inFrame)
                    console.warn('updateLoop re-entered same frame');
                inFrame = true;
                if (!firstFrameRan) {
                    firstFrameRan = true;
                    if (onInitComplete)
                        onInitComplete();
                }
                if (this._runState !== CANVAS_ENGINE_RUN_STATE.RUNNING) {
                    lastTime = time;
                    inFrame = false;
                    if (!this._disposed)
                        this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
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
                    inFrame = false;
                    if (!this._disposed)
                        this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
                    //console.log(`Skipping frame ${numSkips}/${numNoSkips} - elapsedTime=${elapsedTimeSec.toFixed(4)}, accumulatedTime=${accumulatedTime.toFixed(4)}`);
                    return;
                }
                elapsedTimeSec = accumulatedTime;
                accumulatedTime = 0;
                let onceSecond = (time - lastLogTime > 1000);
                if (onceSecond) {
                    if (this.fpsCallback) {
                        spinnerIdx = (spinnerIdx + 1) % spinnerFrames.length;
                        this.fpsCallback(`${spinnerFrames[spinnerIdx]} FPS=${riveFps}:${iterationCount}, Skips=${skipsPerSecond}`);
                    }
                    skipsPerSecond = 0;
                    iterationCount = 0;
                    lastLogTime = time;
                }
                let onceMinute = (time - lastLogTimeLong > 10000); //60000
                if (onceMinute) {
                    lastLogTimeLong = time;
                }
                if (!oncePerLogged) {
                    oncePerLogged = true;
                    onceSecond = onceMinute = true;
                }
                this.updateListeners.forEach((listener) => {
                    listener(time, elapsedTimeSec, frameCount, onceSecond, onceMinute);
                });
                if (canvasSettings.physicsEnabled)
                    PhysicsController.get().Update(elapsedTimeSec, frameCount, onceSecond, onceMinute);
                riveRenderer.clear();
                this._canvasObjects.forEach((objects) => {
                    objects.forEach((obj) => {
                        if (obj.render) {
                            obj.Update(elapsedTimeSec, frameCount, onceSecond, onceMinute);
                        }
                    });
                });
                riveRenderer.flush();
                PixiController.get().Update(elapsedTimeSec, frameCount, onceSecond, onceMinute);
                inFrame = false;
                if (!this._disposed)
                    this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
            };
            inFrame = false;
            if (!this._disposed)
                this._animationFrameId = riveInstance.requestAnimationFrame(updateLoop);
            //if (onInitComplete) onInitComplete();
            window.removeEventListener("resize", this.ResizeWindowEvent);
            if (canvasSettings.autoScale) {
                window.addEventListener("resize", this.ResizeWindowEvent);
                this.ResizeCanvasToWindow();
            }
            setTimeout(() => this.ResizeCanvasToWindow(), 1000);
            const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
            (_c = mq.addEventListener) === null || _c === void 0 ? void 0 : _c.call(mq, 'change', this.ResizeWindowEvent);
        });
    }
    get RunState() { return this._runState; }
    ToggleRunState() {
        this.SetRunState(this._runState === CANVAS_ENGINE_RUN_STATE.RUNNING ? CANVAS_ENGINE_RUN_STATE.STOPPED : CANVAS_ENGINE_RUN_STATE.RUNNING);
    }
    SetRunState(state) {
        this._runState = state;
        if (this.runStateLabel) {
            this.runStateLabel.innerText = this._runState;
        }
    }
    SetFpsCallback(cb) {
        this.fpsCallback = cb;
    }
    GetFPS() {
        return this.fpsValue.toString();
    }
    GetTimelineController(animationMetaData) {
        return this._riveTimelineControllers.find(controller => controller.AnimationMetaDataId === animationMetaData.uuid) || null;
    }
    CreateTimelineController(animationMetaData) {
        animationMetaData.isTimelineControlled = true;
        const timelineController = new RiveTimelineController(animationMetaData.uuid, animationMetaData.animation, animationMetaData.duration, animationMetaData.name);
        this._riveTimelineControllers.push(timelineController);
        return timelineController;
    }
    DestroyTimelineController(animationMetaData) {
        for (let i = 0; i < this._riveTimelineControllers.length; i++) {
            if (this._riveTimelineControllers[i].AnimationMetaDataId === animationMetaData.uuid) {
                this._riveTimelineControllers.splice(i, 1);
                break;
            }
        }
    }
    AddCanvasObjects(objs, group = "main") {
        var _a, _b, _c, _d;
        var _e;
        let add = [];
        if (objs instanceof RiveObjectsSet)
            add = (_a = objs.objects) !== null && _a !== void 0 ? _a : [];
        else if (Array.isArray(objs))
            add = objs;
        else
            add = [objs];
        if (!this._canvasObjects.has(group))
            this._canvasObjects.set(group, []);
        const dest = this._canvasObjects.get(group);
        // Find max z from objects that were auto-assigned (have _autoAssignedZ flag)
        // This prevents explicitly-set high z values from polluting the auto-assignment counter
        let maxAutoZ = 0;
        for (const o of dest) {
            if (o._autoAssignedZ && ((_b = o.z) !== null && _b !== void 0 ? _b : 0) > maxAutoZ) {
                maxAutoZ = (_c = o.z) !== null && _c !== void 0 ? _c : 0;
            }
        }
        for (const obj of add) {
            obj.OnZIndexChanged = this.updateZIndex.bind(this);
            obj.OnDispose = this.removeObjectFromTracking.bind(this);
            for (const [g, arr] of this._canvasObjects) {
                const i = arr.indexOf(obj);
                if (i !== -1) {
                    arr.splice(i, 1);
                    if (arr.length === 0)
                        this._canvasObjects.delete(g);
                    break;
                }
            }
            const idx = dest.indexOf(obj);
            if (idx !== -1) {
                dest.splice(idx, 1);
            }
            else {
                (_d = (_e = obj)._inited) !== null && _d !== void 0 ? _d : (_e._inited = false);
                if (!obj._inited) {
                    // Check if the object has a specific z value in its defObj
                    const hasExplicitZ = obj.defObj.z !== undefined && obj.defObj.z !== null;
                    obj.InitVisuals();
                    obj._inited = true;
                    // Only auto-assign z if no explicit z was defined in defObj
                    if (!hasExplicitZ) {
                        obj.z = ++maxAutoZ;
                        // Mark that this z was auto-assigned so we can track it
                        obj._autoAssignedZ = true;
                    }
                }
            }
            dest.push(obj);
        }
        dest.sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
        return objs;
    }
    RemoveCanvasObjects(objs, group = "main") {
        const groupArray = this._canvasObjects.get(group);
        if (!groupArray) {
            return;
        }
        const objsToRemove = Array.isArray(objs) ? objs : [objs];
        //console.log(`Removing ${objsToRemove.length} object(s) from group "${group}"`);
        for (const obj of objsToRemove) {
            // Safety check: skip if obj is null/undefined
            if (!obj)
                continue;
            const index = groupArray.indexOf(obj);
            if (index !== -1) {
                groupArray.splice(index, 1);
                obj.Dispose();
            }
            else if (obj.group != group) {
                const myGroupArray = this._canvasObjects.get(obj.group);
                if (myGroupArray) {
                    const index = myGroupArray.indexOf(obj);
                    if (index !== -1) {
                        myGroupArray.splice(index, 1);
                        obj.Dispose();
                    }
                }
            }
        }
        if (groupArray.length === 0) {
            this._canvasObjects.delete(group);
        }
    }
    updateZIndex(canvasObj, newZIndex) {
        var _a;
        if (canvasObj.z === newZIndex)
            return;
        const group = (_a = canvasObj.group) !== null && _a !== void 0 ? _a : "main";
        const groupArray = this._canvasObjects.get(group);
        if (!groupArray)
            return;
        const index = groupArray.indexOf(canvasObj);
        if (index !== -1) {
            groupArray.splice(index, 1);
            groupArray.push(canvasObj);
            groupArray.sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
        }
    }
    /**
     * Removes an object from the engine's tracking without calling Dispose again
     * This is called by BaseCanvasObj.Dispose() via the OnDispose callback
     */
    removeObjectFromTracking(canvasObj) {
        var _a;
        const group = (_a = canvasObj.group) !== null && _a !== void 0 ? _a : "main";
        const groupArray = this._canvasObjects.get(group);
        if (!groupArray)
            return;
        const index = groupArray.indexOf(canvasObj);
        if (index !== -1) {
            groupArray.splice(index, 1);
            // Clean up empty group
            if (groupArray.length === 0) {
                this._canvasObjects.delete(group);
            }
        }
    }
    get CurrentCanvasScale() { return this._currentCanvasScale; }
    DebugLogLayering() {
        console.log('%c ===== Canvas Objects Layering Debug =====', 'color:#00FF00; font-weight:bold;');
        // Get PIXI stages
        const pixiAbove = PixiController.get().GetPixiInstance(PIXI_LAYER.ABOVE);
        const pixiBelow = PixiController.get().GetPixiInstance(PIXI_LAYER.BELOW);
        // Log all canvas objects by group
        this._canvasObjects.forEach((objects, group) => {
            console.log(`%c Group: ${group} (${objects.length} objects)`, 'color:#FFD700; font-weight:bold;');
            // Sort by z for display
            const sorted = [...objects].sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
            sorted.forEach(obj => {
                var _a, _b, _c;
                const info = {
                    label: obj.label,
                    type: obj.constructor.name,
                    stateZ: obj.z,
                    visible: obj.visible,
                };
                // Try to get PIXI zIndex for different object types
                if (obj._textField) {
                    // CanvasTextObject
                    info.pixiZIndex = obj._textField.zIndex;
                    info.pixiLayer = obj.defObj.pixiLayer || 'ABOVE';
                }
                else if (obj._graphics) {
                    // CanvasPixiShapeObj
                    info.pixiZIndex = obj._graphics.zIndex;
                    info.pixiLayer = obj.defObj.pixiLayer || 'ABOVE';
                }
                else if (obj._backgroundGraphics) {
                    // CanvasTextAreaObj background
                    info.bgPixiZIndex = (_a = obj._backgroundGraphics) === null || _a === void 0 ? void 0 : _a.zIndex;
                    info.shadowPixiZIndex = (_b = obj._shadowGraphics) === null || _b === void 0 ? void 0 : _b.zIndex;
                    info.pixiLayer = obj.defObj.pixiLayer || 'ABOVE';
                }
                else if (obj._interactiveGraphics) {
                    // CanvasRiveObj
                    info.interactiveZIndex = (_c = obj._interactiveGraphics) === null || _c === void 0 ? void 0 : _c.zIndex;
                    info.pixiLayer = obj.defObj.pixiLayer || 'ABOVE';
                }
                // Check if it's a container with children
                if (obj.children && obj.children.length > 0) {
                    info.childrenCount = obj.children.length;
                }
                console.log(`  ${obj.label}:`, info);
            });
        });
        // Log PIXI stage children counts
        console.log('%c ===== PIXI Stage Info =====', 'color:#00FFFF; font-weight:bold;');
        console.log(`PIXI ABOVE Stage children: ${pixiAbove.stage.children.length}`);
        console.log(`PIXI BELOW Stage children: ${pixiBelow.stage.children.length}`);
        // Show first few children of each stage with their zIndex
        console.log('PIXI ABOVE Stage children (first 10):');
        pixiAbove.stage.children.slice(0, 50).forEach((child, i) => {
            console.log(`  [${i}] zIndex: ${child.zIndex}, type: ${child.constructor.name} text: ${child.text} `);
        });
        console.log('PIXI BELOW Stage children (first 10):');
        pixiBelow.stage.children.slice(0, 10).forEach((child, i) => {
            console.log(`  [${i}] zIndex: ${child.zIndex}, type: ${child.constructor.name}`);
        });
        console.log('%c ===== End Debug =====', 'color:#00FF00; font-weight:bold;');
    }
    DebugLog(summaryOnly = false) {
        var _a, _b;
        console.log('%c ============== CanvasEngine.Debug ============', 'color:#7050a8; font-weight:bold;');
        // Summary counts
        let totalObjects = 0;
        let totalGroups = 0;
        let totalChildren = 0;
        let totalAnimations = 0;
        let totalStateMachines = 0;
        let totalTextObjects = 0;
        let totalRiveObjects = 0;
        let totalPixiObjects = 0;
        let totalPhysicsBodies = 0;
        this._canvasObjects.forEach((objects) => {
            totalGroups++;
            totalObjects += objects.length;
            objects.forEach((obj) => {
                // Count children
                if (obj.children) {
                    totalChildren += obj.children.length;
                }
                // Count animations
                if (obj._animations) {
                    totalAnimations += obj._animations.length;
                }
                // Count state machines
                if (obj._stateMachine) {
                    totalStateMachines++;
                }
                // Count object types
                if (obj._textField) {
                    totalTextObjects++;
                }
                else if (obj._artboard) {
                    totalRiveObjects++;
                }
                else if (obj._graphics) {
                    totalPixiObjects++;
                }
                // Count physics bodies
                if (obj._body) {
                    totalPhysicsBodies++;
                }
            });
        });
        console.log(`%c ┌─ Summary`, 'color:#b19cd9; font-weight:bold;');
        console.log(`%c │ ├─ Groups: ${totalGroups}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Total Objects: ${totalObjects}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Children: ${totalChildren}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Text Objects: ${totalTextObjects}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Rive Objects: ${totalRiveObjects}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Pixi Objects: ${totalPixiObjects}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Animations: ${totalAnimations}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ State Machines: ${totalStateMachines}`, 'color:#b19cd9;');
        console.log(`%c │ └─ Physics Bodies: ${totalPhysicsBodies}`, 'color:#b19cd9;');
        console.log('%c', 'color:#7050a8;');
        console.log('%c', 'color:#7050a8;', this._canvasObjects);
        console.log('%c', 'color:#7050a8;');
        // If summary only, skip detailed output
        if (summaryOnly) {
            // Engine state info
            console.log('%c ┌─ Engine State', 'color:#9370db; font-weight:bold;');
            console.log(`%c │ ├─ Run State: ${this._runState}`, 'color:#b19cd9;');
            console.log(`%c │ ├─ Canvas Size: ${this._canvasWidth}x${this._canvasHeight}`, 'color:#b19cd9;');
            console.log(`%c │ ├─ Current Scale: ${this._currentCanvasScale.toFixed(3)}`, 'color:#b19cd9;');
            console.log(`%c │ ├─ Physics Enabled: ${((_a = this._canvasSettings) === null || _a === void 0 ? void 0 : _a.physicsEnabled) || false}`, 'color:#b19cd9;');
            console.log(`%c │ └─ Update Listeners: ${this.updateListeners.size}`, 'color:#b19cd9;');
            console.log('%c', 'color:#7050a8;');
            console.log('%c ============== End Debug ============', 'color:#7050a8; font-weight:bold;');
            console.log('%c', 'color:#7050a8; font-weight:bold;');
            return;
        }
        // Iterate through each group
        this._canvasObjects.forEach((objects, group) => {
            console.log(`%c ┌─ Group: "${group}" (${objects.length} objects)`, 'color:#9370db; font-weight:bold;');
            // Sort by z-index for display
            const sorted = [...objects].sort((a, b) => { var _a, _b; return ((_a = a.z) !== null && _a !== void 0 ? _a : 0) - ((_b = b.z) !== null && _b !== void 0 ? _b : 0); });
            sorted.forEach((obj, objIndex) => {
                var _a, _b, _c;
                const isLast = objIndex === sorted.length - 1;
                const prefix = isLast ? '└─' : '├─';
                // Gather basic info
                const info = {
                    uuid: obj.uuid,
                    label: obj.label,
                    type: obj.constructor.name,
                    z: obj.z,
                    x: Math.round(obj.x),
                    y: Math.round(obj.y),
                    width: Math.round(obj.width),
                    height: Math.round(obj.height),
                    visible: obj.visible,
                    enabled: obj.enabled,
                };
                // Check for parent
                if (obj.parent) {
                    info.parent = obj.parent.label;
                }
                // Check for specific object types and their states
                if (obj._textField) {
                    // CanvasTextObject
                    info.text = ((_a = obj._textField.text) === null || _a === void 0 ? void 0 : _a.substring(0, 30)) + (((_b = obj._textField.text) === null || _b === void 0 ? void 0 : _b.length) > 30 ? '...' : '');
                    info.pixiLayer = obj.defObj.pixiLayer || 'ABOVE';
                }
                else if (obj._graphics) {
                    // CanvasPixiShapeObj
                    info.pixiLayer = obj.defObj.pixiLayer || 'ABOVE';
                    info.bgColor = obj.defObj.bgColor;
                }
                else if (obj._artboard) {
                    // CanvasRiveObj
                    info.filePath = obj.defObj.filePath;
                    info.artboardName = obj._artboard.name;
                    info.stateMachine = (_c = obj._stateMachine) === null || _c === void 0 ? void 0 : _c.name;
                }
                // Check for physics body
                if (obj._body) {
                    info.hasPhysics = true;
                    info.bodyPosition = `(${Math.round(obj._body.position.x)}, ${Math.round(obj._body.position.y)})`;
                }
                // Log the object
                console.log(`%c │ ${prefix} [${objIndex}] ${info.type}`, 'color:#b19cd9; font-weight:bold;', info);
                // Check for children
                if (obj.children && obj.children.length > 0) {
                    const children = obj.children;
                    console.log(`%c │   │ ▸ Children: ${children.length}`, 'color:#d8bfd8;');
                    children.forEach((child, childIndex) => {
                        var _a, _b;
                        const childIsLast = childIndex === children.length - 1;
                        const childPrefix = childIsLast ? '└─' : '├─';
                        const childInfo = {
                            label: child.label || child.uuid,
                            type: child.constructor.name,
                            z: child.z,
                            x: Math.round(child.x || 0),
                            y: Math.round(child.y || 0),
                            visible: child.visible,
                        };
                        // Check if child is a text object
                        if (child._textField) {
                            childInfo.text = ((_a = child._textField.text) === null || _a === void 0 ? void 0 : _a.substring(0, 20)) + (((_b = child._textField.text) === null || _b === void 0 ? void 0 : _b.length) > 20 ? '...' : '');
                        }
                        console.log(`%c │   │   ${childPrefix} [${childIndex}]`, 'color:#dda0dd;', childInfo);
                    });
                }
                // Check for Rive animations
                if (obj._animations && obj._animations.length > 0) {
                    console.log(`%c │   │ ▸ Animations: ${obj._animations.length}`, 'color:#d8bfd8;');
                    obj._animations.forEach((anim, animIndex) => {
                        var _a, _b;
                        console.log(`%c │   │   ├─ [${animIndex}] ${anim.name || 'unnamed'}`, 'color:#dda0dd;', {
                            playing: (_a = anim.instance) === null || _a === void 0 ? void 0 : _a.isPlaying,
                            looping: (_b = anim.instance) === null || _b === void 0 ? void 0 : _b.loopValue,
                        });
                    });
                }
                // Check for Rive state machine
                if (obj._stateMachine) {
                    const sm = obj._stateMachine;
                    console.log(`%c │   │ ▸ State Machine: ${sm.name}`, 'color:#d8bfd8;');
                    // Show inputs
                    if (sm.inputCount > 0) {
                        console.log(`%c │   │   ▸ Inputs: ${sm.inputCount}`, 'color:#e6c9e6;');
                        for (let i = 0; i < sm.inputCount; i++) {
                            const input = sm.input(i);
                            console.log(`%c │   │     ├─ ${input.name}: ${input.value}`, 'color:#f0e6f0;');
                        }
                    }
                }
            });
            console.log('%c │', 'color:#9370db;');
        });
        // Engine state info
        console.log('%c ┌─ Engine State', 'color:#9370db; font-weight:bold;');
        console.log(`%c │ ├─ Run State: ${this._runState}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Canvas Size: ${this._canvasWidth}x${this._canvasHeight}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Current Scale: ${this._currentCanvasScale.toFixed(3)}`, 'color:#b19cd9;');
        console.log(`%c │ ├─ Physics Enabled: ${((_b = this._canvasSettings) === null || _b === void 0 ? void 0 : _b.physicsEnabled) || false}`, 'color:#b19cd9;');
        console.log(`%c │ └─ Update Listeners: ${this.updateListeners.size}`, 'color:#b19cd9;');
        console.log('%c', 'color:#7050a8;');
        console.log('%c ===== End Debug =====', 'color:#7050a8; font-weight:bold;');
        console.log('%c <=--- ', 'color:#7050a8; font-weight:bold;');
        console.log('%c', 'color:#7050a8; font-weight:bold;');
    }
    Dispose() {
        this._disposed = true;
        this._runState = CANVAS_ENGINE_RUN_STATE.STOPPED;
        if (this._engine) {
            Matter.Events.off(this._engine, "collisionStart");
            Matter.World.clear(this._engine.world, false);
            Matter.Engine.clear(this._engine);
        }
        this._canvasObjects.forEach((objs) => objs.forEach((o) => o.Dispose()));
        this._canvasObjects.clear();
        if (this._animationFrameId && this._riveInstance) {
            this._riveInstance.cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        RiveController.get().Dispose();
        PixiController.get().Dispose();
        window.removeEventListener("resize", this.ResizeWindowEvent);
        if (this._resizeDebounceTimeout !== null) {
            clearTimeout(this._resizeDebounceTimeout);
            this._resizeDebounceTimeout = null;
        }
        if (this.updateListeners != null)
            this.updateListeners.clear();
        if (this._riveInstance)
            this._riveInstance = null;
        if (this._engine)
            this._engine = null;
    }
    SetRefs({ canvasContainerRef, canvasAreaRef, canvasRef, pixiCanvasRefAbove, pixiCanvasRefBelow, debugContainerRef, runStateLabel, fpsLabel, fpsSpinner, }) {
        this.canvasContainerRef = canvasContainerRef;
        this.canvasAreaRef = canvasAreaRef;
        this.canvasRef = canvasRef;
        this.pixiCanvasRefAbove = pixiCanvasRefAbove || null;
        this.pixiCanvasRefBelow = pixiCanvasRefBelow || null;
        this.debugContainerRef = debugContainerRef || null;
        this.runStateLabel = runStateLabel || null;
        this.fpsLabel = fpsLabel || null;
        this.fpsSpinner = fpsSpinner || null;
    }
}
export function UseCanvasEngineHook(settings = {}, onInit) {
    const canvasSettings = new CanvasSettingsDef(settings);
    const canvasRef = useRef(null);
    const canvasAreaRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const pixiCanvasRefAbove = useRef(null);
    const pixiCanvasRefBelow = useRef(null);
    const debugContainerRef = useRef(null);
    const runStateLabel = useRef(null);
    const fpsSpinner = useRef(null);
    const fpsRef = useRef(null);
    const ToggleRunState = () => CanvasEngine.get().ToggleRunState();
    const SetRunState = (state) => CanvasEngine.get().SetRunState(state);
    const RunState = () => CanvasEngine.get().RunState;
    const canvasJSXRef = useRef(null);
    if (!canvasJSXRef.current) {
        canvasJSXRef.current = (_jsxs("div", Object.assign({ id: "canvasArea", ref: canvasAreaRef }, { children: [_jsxs("div", Object.assign({ id: "debugTools", className: "debugTools", style: { display: canvasSettings.debugMode ? "flex" : "none", position: "absolute", zIndex: "99999", bottom: "2px", left: "10px", gap: "10px", marginBottom: "10px", alignItems: "center", justifyContent: "center" } }, { children: [_jsx("button", Object.assign({ onClick: ToggleRunState }, { children: _jsx("span", { ref: runStateLabel }) })), _jsxs("div", Object.assign({ className: "fpsContainer", style: { display: "flex", flexDirection: "row", justifyContent: "space-around" } }, { children: [_jsx("span", { className: "fpsSpinner", style: { display: "flex", maxWidth: "15px", minWidth: "15px", width: "15px" }, ref: fpsSpinner }), _jsx("span", { ref: fpsRef })] }))] })), _jsxs("div", Object.assign({ id: "canvasContainer", ref: canvasContainerRef, style: { position: "relative", borderTop: `${canvasSettings.borderWidth}px solid ${canvasSettings.borderColor}`, borderBottom: `${canvasSettings.borderWidth}px solid ${canvasSettings.borderColor}`, backgroundColor: canvasSettings.backgroundColor, width: "100%", height: "100%", margin: "0 auto", overflow: "hidden" } }, { children: [_jsxs("div", Object.assign({ id: "pixiCanvasContainer" /*style={{ position: "absolute", top: 0, left: 0 }}*/ }, { children: [_jsx("canvas", { id: "pixiCanvasAbove", ref: pixiCanvasRefAbove, style: { position: "absolute", top: 0, left: 0, zIndex: 3 } }), _jsx("canvas", { id: "riveCanvas", ref: canvasRef, style: { border: "1px solid black", position: "absolute", zIndex: 2 } }), _jsx("canvas", { id: "pixiCanvasBelow", ref: pixiCanvasRefBelow, style: { position: "absolute", top: 0, left: 0, zIndex: 1 } })] })), canvasSettings.debugMode && _jsx("div", { ref: debugContainerRef, style: { position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: 0.25, } })] }))] })));
    }
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
                canvasAreaRef: canvasAreaRef.current,
                canvasRef: canvasRef.current,
                pixiCanvasRefAbove: pixiCanvasRefAbove.current,
                pixiCanvasRefBelow: pixiCanvasRefBelow.current,
                debugContainerRef: debugContainerRef.current,
                runStateLabel: runStateLabel.current,
                fpsLabel: fpsRef.current,
                fpsSpinner: fpsSpinner.current,
            });
            engine.Init(canvasSettings, onInit);
        });
        return () => {
            hasEngineInitialized.current = false;
            CanvasEngine.get().Dispose();
        };
    }, []);
    return {
        RivePakCanvas: () => canvasJSXRef.current,
        canvasRef,
        pixiCanvasRefAbove,
        pixiCanvasRefBelow,
        debugContainerRef,
        canvasObjects: CanvasEngine.get().CanvasObjects,
        addCanvasObjects: CanvasEngine.get().AddCanvasObjects.bind(CanvasEngine.get()),
        ToggleRunState,
        SetRunState,
        RunState,
        runStateLabel,
        fpsRef: fpsRef
    };
}
