var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import RiveCanvas from "@rive-app/webgl2-advanced";
import { RiveAnimationObject } from "../canvasObjects/RiveAnimationObj";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";
import { CanvasEngine } from "../useCanvasEngine";
import RivePakUtils from "../RivePakUtils";
export var RIVE_OBJECT_TYPE;
(function (RIVE_OBJECT_TYPE) {
    RIVE_OBJECT_TYPE["ANIMATION"] = "ANIMATION";
    RIVE_OBJECT_TYPE["PHYSICS"] = "PHYSICS";
})(RIVE_OBJECT_TYPE || (RIVE_OBJECT_TYPE = {}));
export class RiveObjectsSet {
    constructor({ objects }) {
        this.objects = objects;
    }
    GetObjectByIdx(idx) {
        if (!this.objects || idx < 0 || idx >= this.objects.length) {
            return null;
        }
        return this.objects[idx];
    }
    GetObjectById(id) {
        if (!this.objects) {
            return null;
        }
        const objs = this.objects.find((o) => o.id === id);
        return objs || null;
    }
    GetObjectByArtboardName(artboardByName) {
        if (!this.objects) {
            return null;
        }
        const objs = this.objects.find((o) => o.artboardName === artboardByName);
        return objs || null;
    }
    GetObjectByFilePath(filePath) {
        if (!this.objects) {
            return null;
        }
        const objs = this.objects.find((o) => o.filePath === filePath);
        return objs || null;
    }
}
export class RiveController {
    constructor() {
        this._riveInstance = null;
        this._riveRenderer = null;
        this._canvas = null;
        this._canvasBounds = null;
        this._canvasGlobalBounds = null;
        this._riveObjectsSet = null;
        this._initCalled = false;
        this._cache = new Map();
        this._disposed = false;
        this._debug = false;
        this._unsubscribeResize = null;
        this._mousePos = { x: 0, y: 0 };
        this._mouseGlobalPos = { x: 0, y: 0 };
        this._mouseDown = false;
        this.SetMouseGlobalPos = (e) => {
            var _a, _b;
            this._mouseGlobalPos.x = e.clientX;
            this._mouseGlobalPos.y = e.clientY;
            this._canvasGlobalBounds = (_b = (_a = this._canvas) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect()) !== null && _b !== void 0 ? _b : null;
        };
    }
    static get() { if (RiveController.myInstance == null) {
        RiveController.myInstance = new RiveController();
    } return this.myInstance; }
    get Rive() { return this._riveInstance; }
    get Renderer() { return this._riveRenderer; }
    get Canvas() { return this._canvas; }
    get CanvasBounds() { return this._canvasBounds; }
    get CanvasGlobalBounds() { return this._canvasGlobalBounds; }
    get RiveObjectsSet() { return this._riveObjectsSet; }
    fetchAndHash(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(url, { cache: "no-store" });
            const bytes = new Uint8Array(yield res.arrayBuffer());
            // SHA-256
            const digest = yield crypto.subtle.digest("SHA-256", bytes);
            const hashHex = [...new Uint8Array(digest)]
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
            console.log("🔎 RIVE.WASM URL:", res.url);
            console.log("🔎 RIVE.WASM SHA-256:", hashHex);
            return bytes;
        });
    }
    Init(canvas) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (this._initCalled) {
                return;
            }
            this._initCalled = true;
            this._disposed = false; // Reset disposed flag on re-init
            try {
                const debugLoadingWASM = this._debug || false;
                if (debugLoadingWASM) {
                    console.log('');
                    console.log('..<RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE RIVE>..');
                }
                this._riveInstance = yield RiveCanvas({ locateFile: (file) => `/rive/${file}` });
                this._riveRenderer = this._riveInstance.makeRenderer(canvas, true);
                const isProbablyWebGL = typeof this._riveRenderer.clear === 'function' && typeof this._riveRenderer.flush === 'function' && true;
                if (debugLoadingWASM) {
                    console.log('isProbablyWebGL :', isProbablyWebGL); // true/false is fine
                    console.log('Rive name (minified):', (_b = (_a = this._riveRenderer) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name); // "a" is fine
                }
                this._canvas = canvas;
                this._canvasBounds = this._canvas.getBoundingClientRect();
                if (debugLoadingWASM) {
                    console.log("🚀 Rive Renderer Type:", (_c = this._riveRenderer) === null || _c === void 0 ? void 0 : _c.constructor.name);
                    const gl = (_d = this._riveRenderer) === null || _d === void 0 ? void 0 : _d.gl;
                    if (gl) {
                        console.log("✅ WebGL active");
                        console.log("GL VERSION:", gl.getParameter(gl.VERSION));
                        console.log("GLSL:", gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
                        console.log("GPU VENDOR:", gl.getParameter(gl.VENDOR));
                        console.log("GPU RENDERER:", gl.getParameter(gl.RENDERER));
                        console.log("MAX_TEXTURE_SIZE:", gl.getParameter(gl.MAX_TEXTURE_SIZE));
                        console.log("ANTIALIAS:", (_e = gl.getContextAttributes()) === null || _e === void 0 ? void 0 : _e.antialias);
                    }
                    else
                        console.warn("⚠️ No GL on renderer; if feathers look boxy you’re on a fallback/canvas path.");
                }
                //resizeDrawingSurfaceToCanvas
                canvas.addEventListener("webglcontextlost", (e) => {
                    console.warn("🧯 WebGL context lost", e);
                    e.preventDefault();
                });
                canvas.addEventListener("webglcontextrestored", () => {
                    console.log("🔁 WebGL context restored");
                });
                if (debugLoadingWASM) {
                    const wasmBytes = yield this.fetchAndHash('/rive/rive.wasm');
                    console.log('########## wasmBytes.length :', wasmBytes.length);
                }
                //const resyncDpr = () =>
                //{
                //	const dpr = Math.max(1, window.devicePixelRatio || 1);
                //	const cssW = this._canvas!.clientWidth;
                //	const cssH = this._canvas!.clientHeight;
                //	// Only update if changed to avoid extra reallocs
                //	const w = Math.max(1, Math.floor(cssW * dpr));
                //	const h = Math.max(1, Math.floor(cssH * dpr));
                //	if(this._canvas!.width !== w || this._canvas!.height !== h)
                //	{
                //		this._canvas!.width  = w;
                //		this._canvas!.height = h;
                //		(this._riveRenderer as any)?.setDevicePixelRatio?.(dpr);
                //		console.log(' **** resyncDpr() Appply dpr : '+dpr+'   canvas size: '+w+'x'+h);
                //	}
                //};
                //resyncDpr();
                //this._unsubscribeResize = CanvasEngineResizePubSub.Subscribe(resyncDpr);
                // react to zoom/DPR changes
                //const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
                //mq.addEventListener?.('change', resyncDpr);
                //this._unsubscribeResize = CanvasEngineResizePubSub.Subscribe(resyncDpr);
                window.addEventListener("mousemove", this.SetMouseGlobalPos);
            }
            catch (error) {
                console.error("Failed to initialize Rive:", error);
            }
        });
    }
    //public SetSize(width:number, height:number, dprIn:number=-1)
    //{
    //	if(this._canvas != null && !this._disposed)
    //	{
    //		this._canvas?.setAttribute("width", `${width}`);
    //		this._canvas?.setAttribute("height", `${height}`);
    //		const dpr = dprIn > 0 ? dprIn : Math.max(1, window.devicePixelRatio || 1);
    //		(this._riveRenderer as any)?.setDevicePixelRatio?.(dpr);
    //		this._canvasBounds = this._canvas!.getBoundingClientRect();
    //	}
    //}
    SetSize(width, height, dprIn = -1) {
        if (!this._canvas || this._disposed)
            return;
        // CSS size (layout)
        this._canvas.style.width = `${width}px`;
        this._canvas.style.height = `${height}px`;
        let dpr = dprIn > 0 ? dprIn : Math.max(1, window.devicePixelRatio || 1);
        // Backing store = CSS × DPR for crisp rendering
        let w = Math.max(1, Math.floor(width * dpr));
        let h = Math.max(1, Math.floor(height * dpr));
        // Always set size if canvas is uninitialized (width/height = 0) or if dimensions changed
        if (this._canvas.width !== w || this._canvas.height !== h || this._canvas.width === 0 || this._canvas.height === 0) {
            this._canvas.width = w;
            this._canvas.height = h;
            // Don't call setDevicePixelRatio - backing store already has DPR baked in
            // Rive will auto-detect from canvas.width vs canvas.style.width ratio
            //console.log('%cRC.resize(*) ', 'color:#dc9d67; font-weight:bold;', 'CSS:', width, height, 'ATTR:', w, h, 'DPR:', dpr, '(no setDevicePixelRatio call)');
        }
        this._canvasBounds = this._canvas.getBoundingClientRect();
    }
    CreateRiveObj(riveObjDefs) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            //const debug = this._debug || false;
            const debug = true;
            if (debug)
                console.log('%c RiveController: CreateRiveObj() ', 'color:#00FF88');
            const defs = [];
            if (Array.isArray(riveObjDefs)) {
                riveObjDefs.forEach(def => { var _a; for (let i = 0; i < ((_a = def.count) !== null && _a !== void 0 ? _a : 1); i++)
                    defs.push(def); });
            }
            else {
                for (let i = 0; i < ((_a = riveObjDefs.count) !== null && _a !== void 0 ? _a : 1); i++)
                    defs.push(riveObjDefs);
            }
            if (debug)
                console.log('%c RiveController: CreateRiveObj() defs:', 'color:#00FF88', defs);
            const filePaths = defs.map((def) => def.filePath);
            const loadPromise = new Promise((resolve) => this.loadRiveFiles(filePaths, resolve));
            const loadedFiles = yield loadPromise;
            const riveFileMap = new Map();
            loadedFiles.forEach(({ filename, riveFile }) => { riveFileMap.set(filename, riveFile); });
            const riveObjects = defs.map((def) => {
                const riveFile = riveFileMap.get(def.filePath);
                if (!riveFile) {
                    console.error(`Failed to create Rive object for ${def.filePath}`);
                    return null;
                }
                if (debug) {
                    console.log("......RIVE CONTROLLER... " + def.artboardName + " -- " + def.filePath);
                    console.log("ArtboardCount:", riveFile.artboardCount());
                    console.log("enums:", riveFile.enums());
                    console.log("artboards:", riveFile.artboardCount());
                    for (let i = 0; i < riveFile.artboardCount(); i++) {
                        const artboard = riveFile.artboardByIndex(i);
                        console.log(`Artboard ${i}:`, artboard.name);
                    }
                }
                let artboard = riveFile.artboardByName(def.artboardName) || riveFile.artboardByIndex(0);
                if (!artboard) {
                    console.error(`Artboard not found in ${def.filePath}`);
                    return null;
                }
                // Artboard needs to know actual DPR when renderer auto-detects
                artboard.devicePixelRatioUsed = window.devicePixelRatio;
                let canvasRiveObj = null;
                if (def.classType) {
                    canvasRiveObj = new def.classType(def, artboard);
                }
                else {
                    switch (def.objectType) {
                        case RIVE_OBJECT_TYPE.ANIMATION:
                            console.log('creating .ANIMATION');
                            canvasRiveObj = new RiveAnimationObject(def, artboard);
                            break;
                        case RIVE_OBJECT_TYPE.PHYSICS:
                            console.log('creating .PHYSICS');
                            canvasRiveObj = new RivePhysicsObject(def, artboard);
                            break;
                    }
                }
                canvasRiveObj === null || canvasRiveObj === void 0 ? void 0 : canvasRiveObj.ApplyResolutionScale(CanvasEngine.get().CurrentCanvasScale);
                if (debug) {
                    console.log('');
                    console.log('%c RiveController..... VIEW MODEL SHIT !!!! ', 'color:#00FF88');
                    console.log('%c riveFile.enums :', 'color:#00FF88', riveFile.enums());
                    console.log('%c riveFile.viewModelCount :', 'color:#00FF88', riveFile.viewModelCount());
                }
                if (riveFile.viewModelCount && riveFile.viewModelCount() > 0) {
                    const vmName = undefined; // keep your override if you want
                    const vm = RivePakUtils.PickBestViewModel(riveFile, artboard, vmName);
                    let vmi = null;
                    if (vm) {
                        if (debug) {
                            console.log("VM chosen:", vm === null || vm === void 0 ? void 0 : vm.name);
                            try {
                                console.log("VM instance names:", (RivePakUtils._isFn(vm, "getInstanceNames") ? vm.getInstanceNames() : "(n/a)"));
                            }
                            catch (_a) { }
                        }
                        // Try to get the first instance name if available
                        let instanceName = undefined;
                        try {
                            const instanceNames = RivePakUtils._isFn(vm, "getInstanceNames") ? vm.getInstanceNames() : null;
                            if (instanceNames && Array.isArray(instanceNames) && instanceNames.length > 0) {
                                instanceName = instanceNames[0];
                                if (debug)
                                    console.log("Using VM instance name:", instanceName);
                            }
                        }
                        catch (_b) { }
                        vmi = RivePakUtils.MakeBestVMI(vm, artboard, instanceName);
                        if (vmi && typeof artboard.bindViewModelInstance === "function") {
                            artboard.bindViewModelInstance(vmi);
                        }
                    }
                    //RivePakUtils.DumpRiveDiagnostics(riveFile, artboard, vm, vmi);
                    if (vmi) {
                        canvasRiveObj === null || canvasRiveObj === void 0 ? void 0 : canvasRiveObj.SetViewModelInstance(vmi);
                        // CRITICAL FIX: Also bind VMI to State Machine if it exists
                        // The state machine needs the VMI bound to react to ViewModel enum changes
                        const sm = canvasRiveObj === null || canvasRiveObj === void 0 ? void 0 : canvasRiveObj._stateMachine;
                        if (debug) {
                            console.log("🎯 Checking State Machine binding...");
                            console.log("  State Machine exists?", !!sm);
                            console.log("  State Machine name:", sm === null || sm === void 0 ? void 0 : sm.name);
                            console.log("  bindViewModelInstance exists?", typeof (sm === null || sm === void 0 ? void 0 : sm.bindViewModelInstance) === "function");
                        }
                        if (sm && typeof sm.bindViewModelInstance === "function") {
                            if (debug)
                                console.log("  ✅ Binding VMI to State Machine:", sm.name);
                            sm.bindViewModelInstance(vmi);
                            if (debug)
                                console.log("  ✅ VMI bound successfully!");
                        }
                        else {
                            if (debug)
                                console.log("  ❌ Cannot bind VMI to State Machine");
                        }
                    }
                }
                else {
                    if (debug)
                        console.log('%c no view model count... ZERO !', 'color:#C586C0');
                }
                canvasRiveObj.InitRiveObject();
                return canvasRiveObj;
            })
                .filter((obj) => obj !== null);
            this._riveObjectsSet = new RiveObjectsSet({ objects: riveObjects });
            return this._riveObjectsSet;
        });
    }
    getVMForArtboard(file, artboard, name) {
        var _a, _b;
        const debug = this._debug || false;
        if (debug)
            console.log('----%---getVMForArtboard -- file:' + file.defaultArtboard.name + ',  artboard:' + artboard.name + '   name:' + name);
        if (name && typeof file.viewModelByName === "function") {
            if (debug)
                console.log('----%---getVMForArtboard 1');
            const vm = file.viewModelByName(name);
            if (vm) {
                if (debug)
                    console.log('----%---getVMForArtboard 2');
                return vm;
            }
        }
        if (typeof file.defaultArtboardViewModel === "function") {
            if (debug)
                console.log('----%---getVMForArtboard 3');
            const vm = file.defaultArtboardViewModel(artboard);
            if (vm) {
                if (debug)
                    console.log('----%---getVMForArtboard 4');
                return vm;
            }
        }
        if (typeof file.viewModelCount === "function" && file.viewModelCount() > 0) {
            if (debug)
                console.log('----%---getVMForArtboard 5');
            return (_b = (_a = file.viewModelByIndex) === null || _a === void 0 ? void 0 : _a.call(file, 0)) !== null && _b !== void 0 ? _b : null;
        }
        if (debug)
            console.log('----%---getVMForArtboard 6');
        return null;
    }
    makeVMI(vm, artboard, vmName = "") {
        var _a, _b, _c, _d;
        if (vmName != "")
            return vm === null || vm === void 0 ? void 0 : vm.instanceByName(vmName);
        return (_d = (_b = (_a = vm === null || vm === void 0 ? void 0 : vm.defaultInstance) === null || _a === void 0 ? void 0 : _a.call(vm)) !== null && _b !== void 0 ? _b : (_c = vm === null || vm === void 0 ? void 0 : vm.instance) === null || _c === void 0 ? void 0 : _c.call(vm)) !== null && _d !== void 0 ? _d : null;
    }
    loadRiveFiles(filenames, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const originalFiles = Array.isArray(filenames) ? filenames : [filenames];
            const uniqueFilesToLoad = Array.from(new Set(originalFiles));
            const uniqueLoadedFiles = new Map();
            yield Promise.all(uniqueFilesToLoad.map((filePath) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this._cache.has(filePath)) {
                        const riveFile = yield this._riveInstance.load(this._cache.get(filePath));
                        uniqueLoadedFiles.set(filePath, riveFile);
                        return;
                    }
                    const response = yield fetch(filePath);
                    const bytes = yield response.arrayBuffer();
                    const uint8Array = new Uint8Array(bytes);
                    this._cache.set(filePath, uint8Array);
                    const riveFile = yield this._riveInstance.load(uint8Array);
                    uniqueLoadedFiles.set(filePath, riveFile);
                }
                catch (error) {
                    console.error(`RiveController - Failed to load ${filePath}`, error);
                    uniqueLoadedFiles.set(filePath, null);
                }
            })));
            const loadedFiles = originalFiles.map((filePath) => ({
                filename: filePath,
                riveFile: uniqueLoadedFiles.get(filePath) || null,
            }));
            callback(loadedFiles);
        });
    }
    SetMousePos(x, y) {
        this._mousePos.x = x;
        this._mousePos.y = y;
    }
    get MousePos() {
        return this._mousePos;
    }
    SetMouseDown(down) {
        this._mouseDown = down;
    }
    get MouseDown() {
        return this._mouseDown;
    }
    CanvasToArtboard(entity, interactiveCheck = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const width = (_a = entity.width) !== null && _a !== void 0 ? _a : 1;
        const height = (_b = entity.height) !== null && _b !== void 0 ? _b : 1;
        const canvasX = this._mousePos.x;
        const canvasY = this._mousePos.y;
        const objLeft = ((_c = entity.x) !== null && _c !== void 0 ? _c : 0);
        const objTop = ((_d = entity.y) !== null && _d !== void 0 ? _d : 0);
        const localX = canvasX - objLeft;
        const localY = canvasY - objTop;
        const normX = localX / width;
        const normY = localY / height;
        let artboardX = normX * ((_e = entity.width) !== null && _e !== void 0 ? _e : 1);
        let artboardY = normY * ((_f = entity.height) !== null && _f !== void 0 ? _f : 1);
        if (!interactiveCheck && (entity.riveInteractiveLocalOnly == undefined || entity.riveInteractiveLocalOnly == false)) {
            if (artboardX < 0)
                artboardX = 1;
            if (artboardY < 0)
                artboardY = 1;
            if (artboardX > entity.width)
                artboardX = entity.width - 1;
            if (artboardY > entity.height)
                artboardY = entity.height - 1;
        }
        if (entity.xScale !== 0)
            artboardX /= (_g = entity.xScale) !== null && _g !== void 0 ? _g : 1;
        if (entity.yScale !== 0)
            artboardY /= (_h = entity.yScale) !== null && _h !== void 0 ? _h : 1;
        if (entity.resolutionScale != -1) {
            artboardX /= entity.resolutionScale;
            artboardY /= entity.resolutionScale;
        }
        return { x: artboardX, y: artboardY };
    }
    WindowToArtboard(entity, interactiveCheck = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const width = (_a = entity.width) !== null && _a !== void 0 ? _a : 1;
        const height = (_b = entity.height) !== null && _b !== void 0 ? _b : 1;
        const objLeft = ((_c = entity.x) !== null && _c !== void 0 ? _c : 0);
        const objTop = ((_d = entity.y) !== null && _d !== void 0 ? _d : 0);
        const mouseX = this._mouseGlobalPos.x;
        const mouseY = this._mouseGlobalPos.y;
        if (!this._canvasGlobalBounds && this._canvas) {
            this._canvasGlobalBounds = this._canvas.getBoundingClientRect();
        }
        const offsetX = (_f = (_e = this._canvasGlobalBounds) === null || _e === void 0 ? void 0 : _e.left) !== null && _f !== void 0 ? _f : 0;
        const offsetY = (_h = (_g = this._canvasGlobalBounds) === null || _g === void 0 ? void 0 : _g.top) !== null && _h !== void 0 ? _h : 0;
        const canvasX = mouseX - offsetX;
        const canvasY = mouseY - offsetY;
        let localX = 0;
        let localY = 0;
        if (entity.resolutionScale != -1) {
            localX = (canvasX / entity.resolutionScale) - objLeft;
            localY = (canvasY / entity.resolutionScale) - objTop;
        }
        else {
            localX = canvasX - objLeft;
            localY = canvasY - objTop;
        }
        const normX = localX / width;
        const normY = localY / height;
        let artboardX = normX * width;
        let artboardY = normY * height;
        if (!interactiveCheck && (entity.riveInteractiveLocalOnly == undefined || entity.riveInteractiveLocalOnly == false)) {
            if (artboardX < 0)
                artboardX = 1;
            if (artboardY < 0)
                artboardY = 1;
            if (artboardX > entity.width)
                artboardX = entity.width - 1;
            if (artboardY > entity.height)
                artboardY = entity.height - 1;
        }
        if (entity.xScale !== 0)
            artboardX /= (_j = entity.xScale) !== null && _j !== void 0 ? _j : 1;
        if (entity.yScale !== 0)
            artboardY /= (_k = entity.yScale) !== null && _k !== void 0 ? _k : 1;
        return { x: artboardX, y: artboardY };
    }
    Dispose() {
        this._disposed = true;
        window.removeEventListener("mousemove", this.SetMouseGlobalPos);
        try {
            this._riveInstance.cleanup();
        }
        catch (error) {
            //console.log("RiveController - Error cleaning up Rive Renderer:", error);
        }
        if (this._unsubscribeResize !== null) {
            this._unsubscribeResize();
            this._unsubscribeResize = null;
        }
        this._riveObjectsSet = null;
        this._riveRenderer = null;
        this._canvas = null;
        this._canvasBounds = null;
        this._cache.clear();
        this._riveInstance = null;
        this._initCalled = false;
        this._mousePos = { x: 0, y: 0 };
        this._mouseDown = false;
    }
}
