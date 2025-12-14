var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RiveAnimationObject } from "../canvasObjects/RiveAnimationObj";
import { RIVE_COMMON_ENUMS, RIVE_DEBUG_IN_EDITOR } from "../canvasObjects/CanvasRiveObj";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";
import { CanvasEngine } from "../useCanvasEngine";
import RivePakUtils from "../RivePakUtils";
import { getRendererInfo, loadRiveModule } from "../utils/RendererFactory";
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
    GetObjectByLabel(label) {
        if (!this.objects) {
            return null;
        }
        const objs = this.objects.find((o) => o.label === label);
        return objs || null;
    }
}
export class RiveController {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._riveInstance = null;
        this._riveRenderer = null;
        this._canvas = null;
        this._canvasBounds = null;
        this._canvasGlobalBounds = null;
        this._riveObjectsSet = null;
        this._initCalled = false;
        this._cache = new Map();
        this._loadingPromises = new Map();
        this._disposed = false;
        // --- RENDERER TYPE TRACKING ---
        this._activeRendererType = "webgl2";
        // --- WASM SOURCE TOGGLE (ADDED) ---
        this._wasmSource = "local";
        this._wasmLocalBase = "/rive/"; // where you serve rive.wasm locally
        this._wasmCdnBase = "https://unpkg.com/@rive-app/webgl2-advanced@2.32.0/dist/";
        //private _wasmCdnBase  = "https://cdn.jsdelivr.net/npm/@rive-app/webgl2-advanced/";
        //private _wasmCdnBase  = "https://cdn.jsdelivr.net/npm/@rive-app/webgl2@2.32.0/rive.wasm"
        //private _wasmCdnBase  = "https://unpkg.com/@rive-app/webgl2-advanced";
        this._wasmCustomBase = null;
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
    get ActiveRendererType() { return this._activeRendererType; }
    get RendererInfo() { return getRendererInfo(); }
    /**
     * Configure where to load the Rive WASM from.
     * Call before Init().
     *  - source: "local" | "cdn" | "custom"
     *  - customBase: required if source === "custom" (e.g. "https://cdn.example.com/rive/")
     */
    ConfigureWasm(source, customBase) {
        this._wasmSource = source;
        if (source === "custom") {
            if (!customBase)
                throw new Error("ConfigureWasm('custom', customBase) requires a customBase URL");
            // ensure trailing slash
            this._wasmCustomBase = customBase.endsWith("/") ? customBase : `${customBase}/`;
        }
    }
    _getWasmUrl(file) {
        var _a;
        switch (this._wasmSource) {
            case "cdn": return this._wasmCdnBase;
            case "custom": return ((_a = this._wasmCustomBase) !== null && _a !== void 0 ? _a : this._wasmLocalBase) + file;
            default: return this._wasmLocalBase + file; // "local"
        }
    }
    // --- END WASM TOGGLE ---
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
                    console.log('WASM source:', this._wasmSource, 'base:', this._wasmSource === "custom" ? this._wasmCustomBase : (this._wasmSource === "cdn" ? this._wasmCdnBase : this._wasmLocalBase));
                }
                // *** DYNAMIC RENDERER LOADING - WebGL2 on desktop, Canvas on mobile ***
                const { default: RiveCanvasInit, type: rendererType } = yield loadRiveModule();
                this._activeRendererType = rendererType;
                console.log(`[RiveController] 🎨 Using ${rendererType.toUpperCase()} renderer (mobile: ${getRendererInfo().isMobile})`);
                this._riveInstance = yield RiveCanvasInit({
                    locateFile: (file) => this._getWasmUrl(file),
                });
                this._riveRenderer = this._riveInstance.makeRenderer(canvas, true);
                const isProbablyWebGL = typeof this._riveRenderer.clear === 'function' && typeof this._riveRenderer.flush === 'function' && true;
                if (debugLoadingWASM) {
                    console.log('isProbablyWebGL :', isProbablyWebGL);
                    console.log('Rive name (minified):', (_b = (_a = this._riveRenderer) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name);
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
                canvas.addEventListener("webglcontextlost", (e) => {
                    console.warn("🧯 WebGL context lost", e);
                    e.preventDefault();
                });
                canvas.addEventListener("webglcontextrestored", () => {
                    console.log("🔁 WebGL context restored");
                });
                // Optional: verify the bytes we actually fetched (handy when flipping sources)
                if (debugLoadingWASM) {
                    const wasmBytes = yield this.fetchAndHash(this._getWasmUrl('rive.wasm'));
                    console.log('########## wasmBytes.length :', wasmBytes.length);
                }
                window.addEventListener("mousemove", this.SetMouseGlobalPos);
            }
            catch (error) {
                console.error("Failed to initialize Rive:", error);
            }
        });
    }
    SetSize(width, height, dprIn = -1) {
        if (!this._canvas || this._disposed)
            return;
        this._canvas.style.width = `${width}px`;
        this._canvas.style.height = `${height}px`;
        let dpr = dprIn > 0 ? dprIn : Math.max(1, window.devicePixelRatio || 1);
        let w = Math.max(1, Math.floor(width * dpr));
        let h = Math.max(1, Math.floor(height * dpr));
        if (this._canvas.width !== w || this._canvas.height !== h || this._canvas.width === 0 || this._canvas.height === 0) {
            this._canvas.width = w;
            this._canvas.height = h;
        }
        //console.log('%c RiveController SetSize -- width:'+this._canvas.width+', height:'+this._canvas.height,'color:#00FF88; font-weight:bold;');
        this._canvasBounds = this._canvas.getBoundingClientRect();
    }
    CreateRiveObj(riveObjDefs) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let debug = false;
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
                //>>DEBUG TARGETTED
                //debug = (def.label == "SpaceTugOfWarBG") ? true : false;
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
                artboard.devicePixelRatioUsed = window.devicePixelRatio;
                let canvasRiveObj = null;
                if (def.classType) {
                    canvasRiveObj = new def.classType(def, artboard);
                }
                else {
                    switch (def.objectType) {
                        case RIVE_OBJECT_TYPE.ANIMATION:
                            canvasRiveObj = new RiveAnimationObject(def, artboard);
                            break;
                        case RIVE_OBJECT_TYPE.PHYSICS:
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
                    console.log('%c ...... should we do step 1? :', 'color:#00FF88', riveFile.viewModelCount());
                }
                // Track bound ViewModel instances to prevent duplicate binding
                const boundVMIs = new Set();
                if (riveFile.viewModelCount && riveFile.viewModelCount() > 0) {
                    for (let vmIndex = 0; vmIndex < riveFile.viewModelCount(); vmIndex++) {
                        const vm = riveFile.viewModelByIndex(vmIndex);
                        if (!vm)
                            continue;
                        const vmName = vm.name;
                        if (debug)
                            console.log(`📝 Processing ViewModel[${vmIndex}]: "${vmName}"`);
                        let instanceName = undefined;
                        try {
                            const instanceNames = RivePakUtils._isFn(vm, "getInstanceNames") ? vm.getInstanceNames() : null;
                            if (instanceNames && Array.isArray(instanceNames) && instanceNames.length > 0) {
                                instanceName = instanceNames[0];
                                if (debug)
                                    console.log(`  Using VM instance name: "${instanceName}"`);
                            }
                        }
                        catch (_a) { }
                        let targetArtboard = artboard;
                        if (debug)
                            console.log('-----------------------------------------------');
                        if (debug)
                            console.log('>>MakeBestVMI... vm:', vm);
                        if (debug)
                            console.log('>>MakeBestVMI... targetArtboard:', targetArtboard);
                        if (debug)
                            console.log('>>MakeBestVMI... instanceName:', instanceName);
                        const vmi = RivePakUtils.MakeBestVMI(vm, targetArtboard, instanceName);
                        if (vmi) {
                            if (debug)
                                console.log(`  ✅ Registered ViewModel: "${vmName}"`);
                            if (debug) {
                                console.log('def.primaryVMName :', def.primaryVMName);
                                console.log(' vmName :', vmName);
                                console.log('vmIndex :', vmIndex);
                            }
                            // Determine if this is the primary ViewModel
                            const isPrimary = (def.primaryVMName && vmName === def.primaryVMName) || (!def.primaryVMName && vmIndex === 0);
                            // IMPORTANT: Only bind PRIMARY ViewModel to artboard!
                            // Binding multiple VMs to the same artboard overwrites the previous binding,
                            // breaking the primary VM. Secondary VMs should only bind to state machine.
                            if (isPrimary) {
                                if (debug)
                                    console.log(`  🌟 "${vmName}" is PRIMARY ViewModel`);
                                canvasRiveObj === null || canvasRiveObj === void 0 ? void 0 : canvasRiveObj.RegisterViewModel(vmName, vmi);
                                if (typeof targetArtboard.bindViewModelInstance === "function") {
                                    boundVMIs.add(vmName);
                                    targetArtboard.bindViewModelInstance(vmi);
                                    if (debug) {
                                        console.log(`  🔗 Bound "${vmName}" to artboard "${targetArtboard.name}"`);
                                    }
                                }
                                canvasRiveObj === null || canvasRiveObj === void 0 ? void 0 : canvasRiveObj.SetViewModelInstance(vmi);
                            }
                            else {
                                if (debug)
                                    console.log(`  ⏭️ "${vmName}" is SECONDARY - skipping artboard bind (will bind to SM later)`);
                            }
                        }
                        else {
                            if (debug)
                                console.warn(`  ❌ Failed to create ViewModelInstance for "${vmName}"`);
                        }
                    }
                }
                else {
                    if (debug)
                        console.log('%c no view model count... ZERO !', 'color:#C586C0');
                }
                canvasRiveObj.InitRiveObject();
                if (riveFile.viewModelCount && riveFile.viewModelCount() > 0) {
                    const sm = canvasRiveObj === null || canvasRiveObj === void 0 ? void 0 : canvasRiveObj._stateMachine;
                    if (debug) {
                        console.log(`🔍 Checking State Machine for ViewModel binding:`);
                        console.log(`  State Machine exists: ${!!sm}`);
                        console.log(`  State Machine name: ${sm === null || sm === void 0 ? void 0 : sm.name}`);
                        console.log(`  bindViewModelInstance exists: ${typeof (sm === null || sm === void 0 ? void 0 : sm.bindViewModelInstance) === "function"}`);
                        console.log(`  Artboard stateMachineCount: ${artboard.stateMachineCount()}`);
                    }
                    if (sm && typeof sm.bindViewModelInstance === "function") {
                        if (debug) {
                            console.warn(`🔗 Binding`);
                            console.log(`🔗 Binding ${riveFile.viewModelCount()} ViewModel(s) to State Machine: "${sm.name}"`);
                        }
                        // Helper function to recursively bind nested viewModels
                        const bindNestedViewModels = (parentVMI, parentPath = '') => {
                            /*
                                                    if(!parentVMI) return;
                            
                                                    try
                                                    {
                                                        let propCount = parentVMI.propertyCount;
                                                        const props = parentVMI.getProperties();
                                                        if(propCount == undefined) propCount = props.length;
                                                        if(debug) console.log('propCount :', propCount);
                                                        if(debug) console.log('props :', props);
                            
                                                        for(let i = 0; i < propCount; i++)
                                                        {
                                                            const prop = props[i];
                                                            if(debug) console.log('props<'+i+'>...',prop);
                                                            if(!prop)
                                                            {
                                                                if(debug) console.log('props:COCK-BLOCK');
                                                                continue;
                                                            }
                            
                                                            try
                                                            {
                                                                if(debug) console.log('props--<1>--prop.name:'+prop.name);
                                                                const nestedVMI:ViewModelInstance = parentVMI.viewModel(prop.name);
                                                                if(nestedVMI)
                                                                {
                                                                    if(debug) console.log('props--<2>--');
                                                                    const nestedPath = parentPath ? `${parentPath}/${prop.name}` : prop.name;
                                                                    if(debug) console.log(`  🔗 Binding nested ViewModel: "${nestedPath}"`);
                                                                    if(debug) console.log('props--<3>--');
                            
                                                                    // Check if already bound (prevents duplicate binding)
                                                                    console.log(' 🔗 CHECK THE BINDING 2 : <'+prop.name+'> ',boundVMIs);
                                                                    if(!boundVMIs.has(prop.name))
                                                                    {
                                                                        try
                                                                        {
                            
                                                                            console.log('propname:'+prop.name);
                                                                            console.log('viewModel.name:'+nestedVMI.viewModel.name);
                                                                            console.log('artboard.name:'+nestedVMI.artboard.name);
                                                                            console.log('viewModel:',nestedVMI);
                                                                            sm.bindViewModelInstance(nestedVMI);
                                                                            boundVMIs.add(prop.name);
                                                                            //if(debug)
                            
                                                                            console.warn(`  ✅ Bound nested "${nestedPath}" to State Machine successfully`);
                                                                        }
                                                                        catch(e)
                                                                        {
                                                                            console.error(`  ❌ Failed to bind nested "${nestedPath}" to State Machine:`, e);
                                                                        }
                                                                    }
                                                                    else
                                                                    {
                                                                        //if(debug)
                                                                            console.log(`  ⏭️  Skipped nested "${nestedPath}" - already bound to State Machine`);
                                                                    }
                            
                                                                    if(debug) console.log('props--<5...> RECURSE?--');
                                                                    // Recursively bind any viewModels nested within this one
                                                                    bindNestedViewModels(nestedVMI, nestedPath);
                                                                }
                                                            }
                                                            catch(e)
                                                            {
                                                                // Not a viewModel property, continue
                                                                if(debug) console.log('props--<6.... CATCH!.');
                                                            }
                                                            if(debug) console.log('props--<.jjjsadjfjasdfjasdfjasdjfasjdasjdfjasdfjasdfj');
                                                        }
                                                    }
                                                    catch(e)
                                                    {
                                                        // Error accessing properties
                                                        if(debug) console.log('props--<7.... CATCH!.');
                                                    }
                                                        */
                        };
                        if (debug)
                            console.log('props--<8.... BINDING BINDING.. THE ROOT BITCHES.');
                        for (let vmIndex = 0; vmIndex < riveFile.viewModelCount(); vmIndex++) {
                            if (debug)
                                console.log(`🔗 Binding 1 ${vmIndex}`);
                            const vm = riveFile.viewModelByIndex(vmIndex);
                            if (debug)
                                console.log(`🔗 Binding 2`);
                            if (!vm)
                                continue;
                            if (debug)
                                console.log(`🔗 Binding 3`);
                            const vmName = vm.name;
                            if (debug)
                                console.log(`🔗 Binding 4: ${vmName}`);
                            const vmi = canvasRiveObj === null || canvasRiveObj === void 0 ? void 0 : canvasRiveObj.GetViewModel(vmName);
                            if (debug)
                                console.log('🔗 Binding 5', vmi);
                            if (vmi) {
                                if (debug)
                                    console.log(`🔗 Binding 6`);
                                // Check if already bound (prevents duplicate binding for library components)
                                if (debug)
                                    console.log(' 🔗 CHECK THE BINDING : <' + vmName + '> ', boundVMIs);
                                if (!boundVMIs.has(vmName)) {
                                    try {
                                        sm.bindViewModelInstance(vmi);
                                        boundVMIs.add(vmName);
                                        if (debug) {
                                            console.log(`  ✅ Bound "${vmName}" to State Machine successfully`);
                                            console.log('viewModel:', vmi);
                                            console.log('viewModel.name:' + vmi.viewModel.name);
                                            console.log('artboard.name:' + vmi.artboard.name);
                                        }
                                    }
                                    catch (e) {
                                        console.error(`  ❌ Failed to bind "${vmName}" to State Machine:`, e);
                                    }
                                }
                                else {
                                    if (debug) {
                                        console.log(`  ⏭️  Skipped "${vmName}" - already bound to State Machine`);
                                        console.log('viewModel:', vmi);
                                        console.log('viewModel.name:' + vmi.viewModel.name);
                                        console.log('artboard.name:' + vmi.artboard.name);
                                    }
                                }
                                if (vmi.enum(RIVE_COMMON_ENUMS.DEBUG_IN_EDITOR)) {
                                    try {
                                        vmi.enum(RIVE_COMMON_ENUMS.DEBUG_IN_EDITOR).value = RIVE_DEBUG_IN_EDITOR.FALSE;
                                        //vmi!.enum(RIVE_COMMON_ENUMS.DEBUG_IN_EDITOR).value = 'FALSE';
                                    }
                                    catch (e) {
                                        console.error('ERR setting DEBUG_IN_EDITOR ', e);
                                    }
                                }
                                // After binding the root viewModel, also bind any nested viewModels
                                // NOTE: This was disabled because it broke library components.
                                // Re-enabling to test with local nested artboards (FishTank_FrontPanel)
                                if (debug)
                                    console.log(`🔗 Searching for nested ViewModels in "${vmName}"`);
                                bindNestedViewModels(vmi, vmName);
                            }
                            else {
                                if (debug)
                                    console.warn(`  ⚠️ Could not get ViewModel "${vmName}" for binding`);
                            }
                            if (debug)
                                console.log(`🔗 Binding 7`);
                        }
                    }
                    else {
                        if (debug)
                            console.warn(`  ❌ No State Machine found or bindViewModelInstance not available`);
                        if (debug && artboard.stateMachineCount() === 0) {
                            console.warn(`  ⚠️ Artboard has NO state machines! ViewModels won't work without a state machine.`);
                        }
                    }
                    if (debug)
                        console.log(`🔗 Binding 10`);
                }
                return canvasRiveObj;
            })
                .filter((obj) => obj !== null);
            this._riveObjectsSet = new RiveObjectsSet({ objects: riveObjects });
            return this._riveObjectsSet;
        });
    }
    fetchWithRetry(url, maxRetries = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = performance.now();
            if (this._debug)
                console.log(`[RiveLoader] 🔄 Starting fetch: ${url}`);
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const attemptStart = performance.now();
                    if (this._debug)
                        console.log(`[RiveLoader] 📡 Attempt ${attempt + 1}/${maxRetries} for ${url}`);
                    const response = yield fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const bytes = yield response.arrayBuffer();
                    const uint8Array = new Uint8Array(bytes);
                    const elapsed = (performance.now() - attemptStart).toFixed(0);
                    const sizeMB = (bytes.byteLength / (1024 * 1024)).toFixed(2);
                    if (this._debug)
                        console.log(`[RiveLoader] ✅ Fetched ${url} (${sizeMB}MB) in ${elapsed}ms`);
                    return uint8Array;
                }
                catch (error) {
                    const elapsed = (performance.now() - startTime).toFixed(0);
                    console.warn(`[RiveLoader] ⚠️ Attempt ${attempt + 1}/${maxRetries} failed for ${url} after ${elapsed}ms`, error);
                    if (attempt === maxRetries - 1) {
                        console.error(`[RiveLoader] ❌ All ${maxRetries} attempts failed for ${url}`);
                        throw error;
                    }
                    const backoffMs = Math.pow(2, attempt) * 1000;
                    console.log(`[RiveLoader] ⏳ Waiting ${backoffMs}ms before retry...`);
                    yield new Promise(r => setTimeout(r, backoffMs));
                }
            }
            throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
        });
    }
    loadRiveFiles(filenames, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const originalFiles = Array.isArray(filenames) ? filenames : [filenames];
            const uniqueFilesToLoad = Array.from(new Set(originalFiles));
            const uniqueLoadedFiles = new Map();
            if (this._debug)
                console.log(`[RiveLoader] 📦 loadRiveFiles called with ${originalFiles.length} files (${uniqueFilesToLoad.length} unique)`);
            yield Promise.all(uniqueFilesToLoad.map((filePath) => __awaiter(this, void 0, void 0, function* () {
                const fileName = filePath.split('/').pop();
                try {
                    // Check cache first
                    if (this._cache.has(filePath)) {
                        if (this._debug)
                            console.log(`[RiveLoader] 💾 Cache HIT for ${fileName}`);
                        const parseStart = performance.now();
                        const riveFile = yield this._riveInstance.load(this._cache.get(filePath));
                        const parseTime = (performance.now() - parseStart).toFixed(0);
                        if (this._debug)
                            console.log(`[RiveLoader] ✅ Parsed ${fileName} from cache in ${parseTime}ms`);
                        uniqueLoadedFiles.set(filePath, riveFile);
                        return;
                    }
                    // Check if already loading (prevent race condition / duplicate fetches)
                    if (this._loadingPromises.has(filePath)) {
                        if (this._debug)
                            console.log(`[RiveLoader] ⏳ Waiting for in-flight fetch: ${fileName}`);
                        const waitStart = performance.now();
                        const uint8Array = yield this._loadingPromises.get(filePath);
                        const waitTime = (performance.now() - waitStart).toFixed(0);
                        if (this._debug)
                            console.log(`[RiveLoader] 🔗 Got in-flight result for ${fileName} after ${waitTime}ms wait`);
                        const parseStart = performance.now();
                        const riveFile = yield this._riveInstance.load(uint8Array);
                        const parseTime = (performance.now() - parseStart).toFixed(0);
                        if (this._debug)
                            console.log(`[RiveLoader] ✅ Parsed ${fileName} in ${parseTime}ms`);
                        uniqueLoadedFiles.set(filePath, riveFile);
                        return;
                    }
                    // Start loading with retry logic
                    if (this._debug)
                        console.log(`[RiveLoader] 🆕 No cache, starting fresh fetch: ${fileName}`);
                    const loadPromise = this.fetchWithRetry(filePath);
                    this._loadingPromises.set(filePath, loadPromise);
                    const uint8Array = yield loadPromise;
                    this._cache.set(filePath, uint8Array);
                    this._loadingPromises.delete(filePath);
                    const parseStart = performance.now();
                    const riveFile = yield this._riveInstance.load(uint8Array);
                    const parseTime = (performance.now() - parseStart).toFixed(0);
                    if (this._debug)
                        console.log(`[RiveLoader] ✅ Parsed ${fileName} in ${parseTime}ms`);
                    uniqueLoadedFiles.set(filePath, riveFile);
                }
                catch (error) {
                    console.error(`[RiveLoader] ❌ Failed to load ${fileName}:`, error);
                    this._loadingPromises.delete(filePath);
                    uniqueLoadedFiles.set(filePath, null);
                }
            })));
            const successCount = Array.from(uniqueLoadedFiles.values()).filter(f => f !== null).length;
            const failCount = uniqueLoadedFiles.size - successCount;
            if (this._debug)
                console.log(`[RiveLoader] 📊 Load complete: ${successCount} success, ${failCount} failed`);
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
    /**
     * Load a Rive file and return info about all its artboards.
     * Useful for exploring what artboards exist in a file.
     * @param filePath - Path to the .riv file
     * @param dumpToConsole - If true, also logs the info to console
     * @returns Array of ArtboardInfo objects
     */
    GetArtboardsFromFile(filePath, dumpToConsole = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._riveInstance) {
                console.error("RiveController not initialized - call Init() first");
                return [];
            }
            try {
                const bytes = yield this.fetchWithRetry(filePath);
                const riveFile = yield this._riveInstance.load(bytes);
                if (dumpToConsole) {
                    console.log(`%c 🎨 Artboards in "${filePath}":`, "color:#00FF88; font-weight:bold;");
                    RivePakUtils.DumpArtboards(riveFile);
                }
                const artboards = RivePakUtils.GetArtboards(riveFile);
                // Also try to dump nested artboards for the first one (usually the main artboard)
                if (dumpToConsole && artboards.length > 0) {
                    const mainArtboard = riveFile.artboardByIndex(0);
                    if (mainArtboard) {
                        RivePakUtils.DumpNestedArtboards(mainArtboard);
                    }
                }
                return artboards;
            }
            catch (error) {
                console.error(`Failed to get artboards from ${filePath}:`, error);
                return [];
            }
        });
    }
    /**
     * Get info about a specific artboard by name from a file.
     * Also attempts to enumerate any nested artboards/components.
     * @param filePath - Path to the .riv file
     * @param artboardName - Name of the artboard to inspect
     */
    InspectArtboard(filePath, artboardName) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._riveInstance) {
                console.error("RiveController not initialized - call Init() first");
                return;
            }
            try {
                const bytes = yield this.fetchWithRetry(filePath);
                const riveFile = yield this._riveInstance.load(bytes);
                const artboard = riveFile.artboardByName(artboardName);
                if (!artboard) {
                    console.error(`Artboard "${artboardName}" not found in ${filePath}`);
                    RivePakUtils.DumpArtboards(riveFile);
                    return;
                }
                console.log(`%c 🔍 Inspecting artboard "${artboardName}" from "${filePath}":`, "color:#00FF88; font-weight:bold;");
                console.log(`  Size: ${artboard.width}x${artboard.height}`);
                console.log(`  Animations: ${(_b = (_a = artboard.animationCount) === null || _a === void 0 ? void 0 : _a.call(artboard)) !== null && _b !== void 0 ? _b : 0}`);
                console.log(`  State Machines: ${(_d = (_c = artboard.stateMachineCount) === null || _c === void 0 ? void 0 : _c.call(artboard)) !== null && _d !== void 0 ? _d : 0}`);
                // Dump nested artboards
                RivePakUtils.DumpNestedArtboards(artboard);
                // Also dump ViewModels for this file
                RivePakUtils.DumpRiveDiagnostics(riveFile, artboard, null, null);
            }
            catch (error) {
                console.error(`Failed to inspect artboard from ${filePath}:`, error);
            }
        });
    }
    Dispose() {
        //console.warn('%c RiveController Dispose -- CLEAN UP TIME!','color:#FF4444; font-weight:bold;');
        this._disposed = true;
        window.removeEventListener("mousemove", this.SetMouseGlobalPos);
        if (this._canvas) {
            this._canvas.removeEventListener("webglcontextlost", () => { });
            this._canvas.removeEventListener("webglcontextrestored", () => { });
        }
        if (this._riveRenderer) {
            try {
                this._riveRenderer.delete();
            }
            catch (error) {
                console.warn("RiveController - Error destroying Rive renderer:", error);
            }
        }
        if (this._riveInstance) {
            try {
                if (typeof this._riveInstance.cleanup === 'function') {
                    this._riveInstance.cleanup();
                }
            }
            catch (error) {
                console.warn("RiveController - Error cleaning up Rive instance:", error);
            }
        }
        if (this._unsubscribeResize !== null) {
            this._unsubscribeResize();
            this._unsubscribeResize = null;
        }
        this._riveObjectsSet = null;
        this._riveRenderer = null;
        this._canvas = null;
        this._canvasBounds = null;
        this._canvasGlobalBounds = null;
        this._cache.clear();
        this._riveInstance = null;
        this._initCalled = false;
        this._mousePos = { x: 0, y: 0 };
        this._mouseGlobalPos = { x: 0, y: 0 };
        this._mouseDown = false;
    }
}
