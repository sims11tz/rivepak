import { RiveController } from "../controllers/RiveController";
import { BaseCanvasObj, GlobalUIDGenerator } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
import { PixiController } from "../controllers/PixiController";
import { CanvasEngine } from "../useCanvasEngine";
export class AnimationMetadata {
    get uuid() { return this._uuid; }
    constructor(artboard, animation, index, name, duration, autoPlay = true) {
        var _a, _b;
        this.autoPlay = true;
        this.isTimelineControlled = false;
        this._uuid = GlobalUIDGenerator.generateUID();
        this.artboard = artboard;
        this.animation = animation;
        this.index = index;
        this.name = name;
        this.duration = duration;
        this.speed = (_a = animation.speed) !== null && _a !== void 0 ? _a : 1;
        this.fps = (_b = animation.fps) !== null && _b !== void 0 ? _b : 60;
        this.autoPlay = autoPlay;
        this.isTimelineControlled = false;
    }
}
export var RIVE_CURSOR_TYPES;
(function (RIVE_CURSOR_TYPES) {
    RIVE_CURSOR_TYPES["DEFAULT"] = "default";
    RIVE_CURSOR_TYPES["POINTER"] = "pointer";
    RIVE_CURSOR_TYPES["GRAB"] = "grab";
    RIVE_CURSOR_TYPES["CROSSHAIR"] = "crosshair";
    RIVE_CURSOR_TYPES["NOT_ALLOWED"] = "not-allowed";
    RIVE_CURSOR_TYPES["N_RESIZE"] = "n-resize";
    RIVE_CURSOR_TYPES["EW_RESIZE"] = "ew-resize";
    RIVE_CURSOR_TYPES["NESW_RESIZE"] = "nesw-resize";
})(RIVE_CURSOR_TYPES || (RIVE_CURSOR_TYPES = {}));
export class CanvasRiveObj extends BaseCanvasObj {
    /**
     * Subscribe to a Rive event by name
     * @param eventName The name of the Rive event to listen for
     * @param callback Function to call when the event fires
     * @returns Unsubscribe function
     */
    OnRiveEvent(eventName, callback) {
        if (!this._eventCallbacks.has(eventName)) {
            this._eventCallbacks.set(eventName, []);
        }
        this._eventCallbacks.get(eventName).push(callback);
        // Return unsubscribe function
        return () => {
            const callbacks = this._eventCallbacks.get(eventName);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }
    /**
     * Remove all event listeners for a specific event name
     */
    ClearRiveEventListeners(eventName) {
        this._eventCallbacks.delete(eventName);
    }
    /**
     * Remove all event listeners
     */
    ClearAllRiveEventListeners() {
        this._eventCallbacks.clear();
    }
    SetViewModelInstance(vmi) {
        var _a;
        console.error('SetViewModelInstanceq called for ' + this._label);
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        const debug = true;
        if (debug) {
            console.log(`📝 SetViewModelInstance called for "${this._label}"`);
            console.log(`   VMI is null?`, vmi === null);
            console.log(`   State Machine exists?`, !!this._stateMachine);
            console.log(`   State Machine name:`, (_a = this._stateMachine) === null || _a === void 0 ? void 0 : _a.name);
        }
        this._viewModelInstance = vmi;
        // CRITICAL: Bind VMI to State Machine if it exists
        // The State Machine needs the VMI bound to react to ViewModel changes
        if (vmi && this._stateMachine && typeof this._stateMachine.bindViewModelInstance === "function") {
            if (debug)
                console.log(`🔗 Binding VMI to State Machine "${this._stateMachine.name}" for object "${this._label}"`);
            this._stateMachine.bindViewModelInstance(vmi);
            if (debug)
                console.log(`✅ VMI successfully bound to State Machine!`);
        }
        else {
            if (debug)
                console.log(`❌ Cannot bind VMI to State Machine:`);
            if (!vmi)
                console.log(`   - VMI is null`);
            if (debug && !this._stateMachine)
                console.log(`   - State Machine is null`);
            if (this._stateMachine && typeof this._stateMachine.bindViewModelInstance !== "function")
                if (debug)
                    console.log(`   - bindViewModelInstance is not a function`);
        }
    }
    get ViewModelInstance() {
        return this._viewModelInstance;
    }
    /**
     * Check if a specific ViewModel exists by name
     * @param vmName - The name of the ViewModel to check
     * @returns true if the ViewModel exists, false otherwise
     */
    HasViewModel(vmName) {
        return this._viewModels.has(vmName);
    }
    /**
     * Get a specific ViewModel by name
     * @param vmName - The name of the ViewModel to retrieve
     * @returns The ViewModelInstance or null if not found
     */
    GetViewModel(vmName) {
        var _a;
        return (_a = this._viewModels.get(vmName)) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Register a ViewModel by name
     * @param vmName - The name to register the ViewModel under
     * @param vmi - The ViewModelInstance to register
     */
    RegisterViewModel(vmName, vmi) {
        this._viewModels.set(vmName, vmi);
    }
    /**
     * Queue a ViewModel enum change to be applied in the next frame.
     * This ensures State Machines process changes one per frame in sequence.
     * @param path - The path to the enum property (e.g., "POD_TYPE")
     * @param value - The string value to set (e.g., "SPACE")
     */
    QueueViewModelEnumChange(path, value) {
        console.log('%c QueueViewModelEnumChange path=' + path + ', value=' + value, 'color: #ffc400; font-weight: bold;');
        if (!this._viewModelInstance) {
            console.warn(`QueueViewModelEnumChange: No ViewModelInstance available for "${this._label}"`);
            return;
        }
        this._vmEnumQueue.push({ path, value });
        console.log(`📋 Queued enum change: ${path} = ${value} (queue length: ${this._vmEnumQueue.length})`);
    }
    /**
     * Process the next queued ViewModel enum change (called once per frame in Update)
     */
    _processVMEnumQueue() {
        if (this._vmEnumQueue.length === 0 || !this._viewModelInstance)
            return;
        // Only process one change per frame
        if (this._vmEnumQueueProcessedThisFrame)
            return;
        const change = this._vmEnumQueue.shift();
        if (change) {
            try {
                this._viewModelInstance.enum(change.path).value = change.value;
                //console.log(`✅ Applied queued enum change: ${change.path} = ${change.value} (${this._vmEnumQueue.length} remaining)`);
            }
            catch (error) {
                console.error(`❌ Failed to apply queued enum change: ${change.path} = ${change.value}`, error);
            }
            this._vmEnumQueueProcessedThisFrame = true;
        }
    }
    get riveObjDef() { return this._riveObjDef; }
    get artboardName() { return this._artboardName; }
    get filePath() { return this._filePath; }
    get baseRiveVMPath() { return this._baseRiveVMPath; }
    constructor(riveDef, artboard) {
        var _a, _b;
        super(riveDef);
        this._stateMachine = null;
        this._inputs = new Map();
        this._viewModels = new Map();
        this._viewModelInstance = null;
        this._vmEnumQueue = [];
        this._vmEnumQueueProcessedThisFrame = false;
        // Event subscription system
        this._eventCallbacks = new Map();
        this._artboardName = "";
        this._filePath = "";
        this._baseRiveVMPath = "";
        this._lastMousePos = { x: -1, y: -1 };
        this._lastMouseDown = false;
        this._entityObj = null;
        this._textLabel = null;
        this._interactiveGraphics = null;
        this._currentRiveCursor = RIVE_CURSOR_TYPES.DEFAULT;
        this._riveObjDef = riveDef;
        if (this._riveObjDef.id != undefined && this._riveObjDef.id != "") {
            this._id = this._riveObjDef.id;
        }
        this._artboardName = (_a = this._riveObjDef.artboardName) !== null && _a !== void 0 ? _a : "";
        this._filePath = (_b = this._riveObjDef.filePath) !== null && _b !== void 0 ? _b : "";
        this._renderer = RiveController.get().Renderer;
        this._riveInstance = RiveController.get().Rive;
        this._artboard = artboard;
        this._animations = [];
    }
    // Inspect all props/methods on a WASM-wrapped object (e.g., a Rive Node)
    dumpWasmObject(obj) {
        var _a, _b;
        const seen = new Set();
        let level = 0;
        let proto = obj;
        while (proto && proto !== Object.prototype) {
            const ctorName = (_b = (_a = proto.constructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '(anonymous proto)';
            const keys = Reflect.ownKeys(proto);
            console.groupCollapsed(`[[proto level ${level}]] ${ctorName} — ${keys.length} keys`);
            for (const k of keys) {
                if (k === 'constructor')
                    continue;
                const desc = Object.getOwnPropertyDescriptor(proto, k);
                if (!desc)
                    continue;
                let kind = 'field';
                let arity = '';
                if (desc.get || desc.set) {
                    kind = `accessor${desc.get ? '(get' : ''}${desc.set ? '/set)' : ')'}`;
                }
                else if (typeof desc.value === 'function') {
                    kind = 'method';
                    arity = `/${desc.value.length}`; // param count
                }
                const tag = `${String(k)}@${level}`;
                if (seen.has(tag))
                    continue;
                seen.add(tag);
                console.log(kind.padEnd(12), String(k), arity);
            }
            console.groupEnd();
            proto = Object.getPrototypeOf(proto);
            level++;
        }
    }
    InitRiveObject() {
        var _a, _b, _c, _d, _e, _f, _g;
        if (this._debugLogs) {
            console.log("");
            console.log('%c ___________________ INIT RIVE OBJECT ________________________', 'color:#00FFFF');
            console.log('%c Artboard Name: ' + this.artboard.name, 'color:#00FFFF');
            console.log(" artboard: ", this.artboard);
            console.log(" filePath: ", this.filePath);
            console.log('%c Artboard Width: ' + this.artboard.width, 'color:#00FFFF');
            console.log('%c Artboard Height: ' + this.artboard.height, 'color:#00FFFF');
        }
        this.x = (_a = this.defObj.x) !== null && _a !== void 0 ? _a : Math.random() * RiveController.get().Canvas.width;
        this.y = (_b = this.defObj.y) !== null && _b !== void 0 ? _b : Math.random() * RiveController.get().Canvas.height;
        if (this._debugLogs)
            console.log('%c InitRiveObject x:' + this.x + ', y:' + this.y, 'color:#00FFFF');
        const artboardWidth = this.artboard.width;
        const artboardHeight = this.artboard.height;
        const aspectRatio = artboardWidth / artboardHeight;
        if (this.defObj.width && this.defObj.height) {
            // CASE 1: Fully specified
            this.width = this.defObj.width;
            this.height = this.defObj.height;
            this.xScale = this.width / artboardWidth;
            this.yScale = this.height / artboardHeight;
        }
        else if (this.defObj.constrainProportions && this.defObj.width && !this.defObj.height) {
            // CASE 2: width specified, calculate height
            this.width = this.defObj.width;
            this.height = this.defObj.width / aspectRatio;
            this.xScale = this.width / artboardWidth;
            this.yScale = this.height / artboardHeight;
        }
        else if (this.defObj.constrainProportions && this.defObj.height && !this.defObj.width) {
            // CASE 3: height specified, calculate width
            this.height = this.defObj.height;
            this.width = this.defObj.height * aspectRatio;
            this.xScale = this.width / artboardWidth;
            this.yScale = this.height / artboardHeight;
        }
        else {
            // CASE 4: fallback to xScale/yScale or defaults
            this.width = artboardWidth;
            this.height = artboardHeight;
            this.xScale = (_c = this.defObj.xScale) !== null && _c !== void 0 ? _c : 1;
            if (this.xScale > 0)
                this.width = artboardWidth * this.xScale;
            this.yScale = (_d = this.defObj.yScale) !== null && _d !== void 0 ? _d : 1;
            if (this.yScale > 0)
                this.height = artboardHeight * this.yScale;
        }
        if (this._debugLogs) {
            console.log('%c CanvasRiveObj .. ALL done : x=' + this.x + ',y=' + this.y + ',w=' + this.width + ',h=' + this.height + ',xScale=' + this.xScale + ',yScale=' + this.yScale, 'color:#00FFFF');
        }
        if (this.centerGlobally) {
            this.x = CanvasEngine.get().width / 2;
            this.y = CanvasEngine.get().height / 2;
        }
        if (this.centerGlobally || this.centerLocally) {
            this.x -= (this.width / 2);
            this.y -= (this.height / 2);
        }
        if (this.defObj.onClickCallback)
            this._onClickCallback = this.defObj.onClickCallback;
        if (this.defObj.onHoverCallback)
            this._onHoverCallback = this.defObj.onHoverCallback;
        if (this.defObj.onHoverOutCallback)
            this._onHoverOutCallback = this.defObj.onHoverOutCallback;
        if (this._debugLogs) {
            console.log("<" + this._label + "> CanvasRiveObj ---   position :: " + this.x + " - " + this.y + " ");
            console.log("<" + this._label + "> CanvasRiveObj --- dimensions :: " + this.width + "x" + this.height + " --- scale::" + this.xScale + "x" + this.yScale);
            console.log("<" + this._label + "> CanvasRiveObj ---   artboard :: " + this.artboard.width + "x" + this.artboard.height);
            //console.log("");
            console.log(" UPDATE BASE PROPS >>> " + this._label + " --- " + this.width + "x" + this.height + " --- " + this.xScale + "x" + this.yScale);
        }
        //this.UpdateBaseProps();
        if (this.defObj.interactive)
            this.initInteractive();
        if (this.defObj.text && this.defObj.text.length > 0)
            this.drawTextLabel();
        if (this._debugLogs) {
            //console.log("Artboard Bounds: ", this.artboard.bounds);
            //console.log("Artboard State Machine Count: "+this.artboard.stateMachineCount());
            console.log("Artboard Animation Count: " + this.artboard.animationCount());
        }
        this._animations = [];
        for (let j = 0; j < this.artboard.animationCount(); j++) {
            const animationDefinition = this.artboard.animationByIndex(j);
            //if(this._debugLogs) console.log("Animation["+j+"]: ________ "+animationDefinition.name+" loopValue:"+animationDefinition.loopValue);
            const animation = new this.Rive.LinearAnimationInstance(animationDefinition, this.artboard);
            const animDef = animationDefinition;
            if (this._debugLogs) {
                // Debug: Log all duration-related properties
                //console.log(`Animation[${j}] "${animationDefinition.name}" duration investigation:`);
                //console.log(`  - animDef.duration: ${animDef.duration}`);
                //console.log(`  - animDef.durationSeconds: ${animDef.durationSeconds}`);
                //console.log(`  - animDef.durationFrames: ${animDef.durationFrames}`);
                //console.log(`  - animDef.workEnd: ${animDef.workEnd}`);
                //console.log(`  - animDef.workStart: ${animDef.workStart}`);
                //console.log(`  - animDef.fps: ${animDef.fps ?? 60}`);
            }
            // Check if we're getting frames instead of seconds
            let duration = (_f = (_e = animDef.durationSeconds) !== null && _e !== void 0 ? _e : animDef.duration) !== null && _f !== void 0 ? _f : 0;
            const fps = (_g = animDef.fps) !== null && _g !== void 0 ? _g : 60;
            // If duration seems to be in frames (e.g., 600 frames for 10 seconds at 60fps)
            // Check if the duration value is suspiciously large (likely frames)
            if (animDef.workEnd && animDef.workEnd > 100) {
                // workEnd appears to be in frames, convert to seconds
                duration = animDef.workEnd / fps;
                if (this._debugLogs)
                    console.log(`  - Converting workEnd from frames (${animDef.workEnd}) to seconds: ${duration}s`);
            }
            else if (duration > 100) {
                // If duration is suspiciously large, it might be in frames
                if (this._debugLogs)
                    console.log(`  - Duration seems to be in frames (${duration}), converting to seconds...`);
                duration = duration / fps;
            }
            //console.log(`  - FINAL duration: ${duration} seconds (${duration * fps} frames)`);
            //if(this._debugLogs) console.log("Animation["+j+"]: "+animationDefinition.name+" -- duration:"+duration+" -- fps:"+(animDef.fps ?? 60));
            const metadata = new AnimationMetadata(this.artboard, animation, j, animationDefinition.name, duration);
            this._animations.push(metadata);
        }
        if (this._debugLogs)
            console.log("Animations Loaded : " + this._animations.length);
        const smCount = this.artboard.stateMachineCount();
        if (this._debugLogs)
            console.log(`🎰 Artboard "${this.artboard.name}" has ${smCount} State Machine(s)`);
        this._stateMachine = smCount > 0 ? new this.Rive.StateMachineInstance(this.artboard.stateMachineByIndex(0), this.artboard) : null;
        this._inputs = new Map();
        if (this._stateMachine) {
            if (this._debugLogs) {
                console.log(`✅ State Machine "${this._stateMachine.name}" created successfully`);
                console.log("Has State Machine<" + this._stateMachine.inputCount() + ">: " + this._stateMachine.name);
                console.log("Has State Machine<" + this._stateMachine.inputCount() + ">: " + this._stateMachine.stateChangedCount());
            }
            for (let j = 0; j < this._stateMachine.inputCount(); j++) {
                const input = this._stateMachine.input(j);
                this._inputs.set(input.name, input);
                //if(this._debugLogs) console.log("Input["+j+"]: "+input.name+" -- "+input.type+" -- "+input.value);
            }
            console.warn('HERE HER EHER EH ERHERHER HER HER HER EHR EHR EHR EH RHE RHE RHE RH EHR EHR EHR');
            // CRITICAL: Bind VMI to State Machine if VMI was set before the State Machine was created
            // This handles the timing issue where SetViewModelInstance() is called during super() before the SM exists
            if (this._viewModelInstance && typeof this._stateMachine.bindViewModelInstance === "function") {
                console.warn(' YES YES YES YES YES YES YES YES YES YES ');
                if (this._debugLogs)
                    console.log(`🔗 [Constructor] Binding VMI to State Machine "${this._stateMachine.name}" for "${this._label}"`);
                this._stateMachine.bindViewModelInstance(this._viewModelInstance);
                if (this._debugLogs)
                    console.log('✅ [Constructor] VMI successfully bound to State Machine! :: ' + this._viewModelInstance);
            }
            else {
                console.warn(' NO NO NO NO -----');
            }
        }
        else {
            if (this._debugLogs)
                console.log(`❌ No State Machine found in artboard "${this.artboard.name}"`);
        }
        // IMPORTANT: Discover and register ViewModels from nested artboards
        console.error('⭐⭐⭐⭐⭐ CALLING _discoverNestedViewModels() for: ' + this._label);
        this._discoverNestedViewModels();
        console.error('⭐⭐⭐⭐⭐ FINISHED _discoverNestedViewModels() for: ' + this._label);
        //if(this._viewModelInstance)
        //{
        //	this._readVMFlags();
        //}
        this._entityObj = { x: this.x, y: this.y, width: this.width, height: this.height, xScale: this.xScale, yScale: this.yScale, riveInteractiveLocalOnly: this.defObj.riveInteractiveLocalOnly };
        this.ApplyResolutionScale(this._resolutionScale, '*');
    }
    /**
     * Discover and register ViewModels from nested artboards.
     * This walks through all nested artboards, finds their ViewModels,
     * and binds them to their respective state machines.
     */
    _discoverNestedViewModels() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const debug = true;
        if (debug)
            console.log(`🔍 [${this._label}] Discovering nested ViewModels...`);
        try {
            // Access the artboard's internal structure to find nested artboards
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const artboardAny = this.artboard;
            // Try to get object count
            const objectCount = (_a = artboardAny.objectCount) === null || _a === void 0 ? void 0 : _a.call(artboardAny);
            if (objectCount !== undefined && objectCount > 0) {
                if (debug)
                    console.log(`   Found ${objectCount} objects in artboard "${this.artboard.name}"`);
                for (let i = 0; i < objectCount; i++) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const obj = (_b = artboardAny.object) === null || _b === void 0 ? void 0 : _b.call(artboardAny, i);
                    if (!obj)
                        continue;
                    if (debug)
                        console.log(`   Object[${i}]: name="${obj.name}", type="${(_c = obj.constructor) === null || _c === void 0 ? void 0 : _c.name}"`);
                    // Check if this is a nested artboard
                    // In Rive, nested artboards are typically NestedArtboard objects
                    if (((_d = obj.constructor) === null || _d === void 0 ? void 0 : _d.name) === 'NestedArtboard' || obj.artboard !== undefined) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const nestedArtboard = obj.artboard;
                        if (nestedArtboard) {
                            if (debug)
                                console.log(`   ✨ Found nested artboard: "${nestedArtboard.name}"`);
                            // Check if the nested artboard has ViewModels
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const viewModelCount = (_f = (_e = nestedArtboard).viewModelCount) === null || _f === void 0 ? void 0 : _f.call(_e);
                            if (viewModelCount && viewModelCount > 0) {
                                if (debug)
                                    console.log(`      Nested artboard has ${viewModelCount} ViewModel(s)`);
                                for (let vmIdx = 0; vmIdx < viewModelCount; vmIdx++) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const vmDef = (_h = (_g = nestedArtboard).viewModel) === null || _h === void 0 ? void 0 : _h.call(_g, vmIdx);
                                    if (vmDef) {
                                        const vmName = vmDef.name;
                                        if (debug)
                                            console.log(`      📝 Found ViewModel: "${vmName}"`);
                                        // Create a ViewModel instance for this nested artboard's ViewModel
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const ViewModelInstanceCtor = this.Rive.ViewModelInstance;
                                        if (ViewModelInstanceCtor) {
                                            const vmi = new ViewModelInstanceCtor(vmDef, nestedArtboard);
                                            if (vmi) {
                                                // Register it
                                                this.RegisterViewModel(vmName, vmi);
                                                if (debug)
                                                    console.log(`      ✅ Registered ViewModel "${vmName}"`);
                                                // Check if the nested artboard has a state machine
                                                const smCount = (_j = nestedArtboard.stateMachineCount) === null || _j === void 0 ? void 0 : _j.call(nestedArtboard);
                                                if (smCount && smCount > 0) {
                                                    // Get the first state machine
                                                    const smDef = nestedArtboard.stateMachineByIndex(0);
                                                    const sm = new this.Rive.StateMachineInstance(smDef, nestedArtboard);
                                                    if (sm && typeof sm.bindViewModelInstance === "function") {
                                                        if (debug)
                                                            console.log(`      🔗 Binding ViewModel "${vmName}" to nested state machine "${sm.name}"`);
                                                        sm.bindViewModelInstance(vmi);
                                                        if (debug)
                                                            console.log(`      ✅ Successfully bound!`);
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            console.warn(`      ⚠️ ViewModelInstance constructor not found in Rive runtime`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (debug)
                    console.log(`   No objects found or objectCount() not available`);
            }
        }
        catch (error) {
            console.error(`❌ Error discovering nested ViewModels:`, error);
        }
        if (debug)
            console.log(`🏁 [${this._label}] Nested ViewModel discovery complete. Total ViewModels: ${this._viewModels.size}`);
    }
    //private _autoplayVM = new Map<string, boolean>();
    //private _readVMFlags()
    //{
    //	this._autoplayVM.clear();
    //	const vmi:ViewModelInstance | null = this._viewModelInstance;
    //	if(vmi)
    //	{
    //		const props = vmi?.getProperties?.() ?? [];
    //		for (const p of props)
    //		{
    //			if (p?.name?.startsWith('auto.'))
    //			{
    //				const animName = p.name.slice(15);
    //				this._autoplayVM.set(animName, !!(p as any).value);
    //			}
    //		}
    //	}
    //}
    updateEntityObj() {
        this._entityObj.x = this.x;
        this._entityObj.y = this.y;
        this._entityObj.width = this.width;
        this._entityObj.height = this.height;
        this._entityObj.xScale = this.xScale;
        this._entityObj.yScale = this.yScale;
        this._entityObj.riveInteractiveLocalOnly = this.defObj.riveInteractiveLocalOnly;
        this._entityObj.resolutionScale = this._resolutionScale;
    }
    InputByName(name) {
        if (this._inputs.has(name)) {
            return this._inputs.get(name);
        }
        else {
            console.warn("Input not found: " + name);
            return null;
        }
    }
    RandomInput() {
        const randomIndex = Math.floor(Math.random() * this._inputs.size);
        return Array.from(this._inputs.values())[randomIndex];
    }
    RandomInputByName(searchTerm) {
        const matchingInputs = [];
        this._inputs.forEach((input) => {
            if (input.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                matchingInputs.push(input);
            }
        });
        if (matchingInputs.length === 0) {
            console.warn(`No matching inputs found for: ${searchTerm}`);
            return null;
        }
        const randomIndex = Math.floor(Math.random() * matchingInputs.length);
        return matchingInputs[randomIndex];
    }
    GetAnimationByName(name) {
        const found = this._animations.find(animMeta => animMeta.name === name);
        return found || null;
    }
    GetAnimationByIndex(index) {
        if (index >= 0 && index < this._animations.length) {
            return this._animations[index];
        }
        return null;
    }
    GetAnimationsByNamePattern(searchTerm) {
        return this._animations.filter(animMeta => animMeta.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    GetAllAnimations() {
        return [...this._animations];
    }
    PlayAnimationByName(name) {
        const animMeta = this.GetAnimationByName(name);
        if (animMeta) {
            animMeta.animation.advance(0);
            animMeta.animation.apply(1);
            return true;
        }
        console.warn(`Animation not found: ${name}`);
        return false;
    }
    SetAnimationAutoPlay(name, autoPlay) {
        const animMeta = this.GetAnimationByName(name);
        if (animMeta) {
            animMeta.autoPlay = autoPlay;
            return true;
        }
        console.warn(`Animation not found: ${name}`);
        return false;
    }
    SetAllAnimationsAutoPlay(autoPlay) {
        this._animations.forEach(animMeta => {
            animMeta.autoPlay = autoPlay;
        });
    }
    DisableAutoPlayForAnimations(names) {
        names.forEach(name => {
            this.SetAnimationAutoPlay(name, false);
        });
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false || this.visible === false || this._disposed)
            return;
        // Reset the queue processing flag at the start of each frame
        this._vmEnumQueueProcessedThisFrame = false;
        // Process one queued ViewModel enum change per frame (if any)
        this._processVMEnumQueue();
        // IMPORTANT: Advance the artboard FIRST before processing animations and state machines
        // This ensures nested artboards and their state machines are updated with any ViewModel changes
        if (!this._disposed) {
            this.artboard.advance(time);
        }
        // Process animations - skip if timeline controlled or autoPlay is false
        for (let i = 0; i < this._animations.length; i++) {
            const animationMeta = this._animations[i];
            if (!animationMeta.isTimelineControlled) {
                if (animationMeta.autoPlay) {
                    if (onceSecond) {
                        //console.log('YES Update('+time+' me : '+this._riveObjDef.artboardName+'-'+animationMeta.name+')');
                    }
                    animationMeta.animation.advance(time);
                    animationMeta.animation.apply(1);
                }
            }
            else {
                const timelineController = CanvasEngine.get().GetTimelineController(animationMeta);
                if (timelineController) {
                    timelineController.Update(time, frameCount, onceSecond);
                }
            }
        }
        if (this._stateMachine) {
            this._stateMachine.advance(time);
            // Check for events and trigger callbacks
            const eventCount = this._stateMachine.reportedEventCount();
            if (!this._disposed && eventCount > 0) {
                for (let i = 0; i < eventCount; i++) {
                    const event = this._stateMachine.reportedEventAt(i);
                    if (event != undefined) {
                        // Trigger any subscribed callbacks for this event
                        const callbacks = this._eventCallbacks.get(event.name);
                        if (callbacks && callbacks.length > 0) {
                            callbacks.forEach(callback => callback(event));
                        }
                    }
                }
            }
            // Skip state change checks if we're not using them
            //const stateChangeCount = this._stateMachine.stateChangedCount();
            //if(!this._disposed && stateChangeCount > 0)
            //{
            //	for(let x = 0; x < stateChangeCount; x++)
            //	{
            //		const stateChange = this._stateMachine.stateChangedNameByIndex(x);
            //		if (stateChange != undefined)
            //		{
            //			console.log('RIVE STATE CHANGE<'+x+'>: ', stateChange);
            //		}
            //	}
            //}
            if (!this._disposed && this.defObj.riveInteractive) {
                this.updateEntityObj();
                const artboardMoveSpace = RiveController.get().WindowToArtboard(this._entityObj);
                const mouseDown = RiveController.get().MouseDown;
                // Cache comparison values
                const mousePosChanged = (this._lastMousePos.x !== artboardMoveSpace.x || this._lastMousePos.y !== artboardMoveSpace.y);
                const mouseDownChanged = (this._lastMouseDown !== mouseDown);
                if (mouseDownChanged) {
                    const artBoardInteractionSpace = RiveController.get().CanvasToArtboard(this._entityObj, true);
                    if (mouseDown) {
                        //console.log('CanvasRiveObj<'+this._label+'>: '+this._stateMachine?.name+' -- mouseDown @ ');
                        //console.log('CanvasRiveObj<'+this._label+'>: DOWN ', artboardMoveSpace.x, artboardMoveSpace.y, ' -- interaction space: ', artBoardInteractionSpace.x, artBoardInteractionSpace.y);
                        //this._stateMachine.pointerDown(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
                        this._stateMachine.pointerDown(artboardMoveSpace.x, artboardMoveSpace.y);
                    }
                    else {
                        //this._stateMachine.pointerUp(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
                        this._stateMachine.pointerUp(artboardMoveSpace.x, artboardMoveSpace.y);
                    }
                }
                if (mousePosChanged) {
                    //console.log("Rive Interaction<"+this._label+">: MOVE ", artboardMoveSpace.x, artboardMoveSpace.y);
                    this._stateMachine.pointerMove(artboardMoveSpace.x, artboardMoveSpace.y);
                }
                this._lastMousePos.x = artboardMoveSpace.x;
                this._lastMousePos.y = artboardMoveSpace.y;
                this._lastMouseDown = mouseDown;
            }
        }
        // Render the artboard
        if (!this._disposed) {
            const scaledWidth = this.artboard.width * this.xScale;
            const scaledHeight = this.artboard.height * this.yScale;
            // Get DPR to account for high-res backing store
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            if (this._resolutionScale !== -1) {
                // Bounds for Rive renderer need to be in canvas pixels (with DPR)
                this._objBoundsReuse.minX = Math.round(this._transformedX * dpr);
                this._objBoundsReuse.minY = Math.round(this._transformedY * dpr);
                this._objBoundsReuse.maxX = Math.round((this._transformedX + (scaledWidth * this._resolutionScale)) * dpr);
                this._objBoundsReuse.maxY = Math.round((this._transformedY + (scaledHeight * this._resolutionScale)) * dpr);
            }
            else {
                this._objBoundsReuse.minX = Math.round(this.x * dpr);
                this._objBoundsReuse.minY = Math.round(this.y * dpr);
                this._objBoundsReuse.maxX = Math.round((this.x + scaledWidth) * dpr);
                this._objBoundsReuse.maxY = Math.round((this.y + scaledHeight) * dpr);
            }
            this.Renderer.save();
            this.Renderer.align(this.Rive.Fit.contain, this.Rive.Alignment.topLeft, this._objBoundsReuse, this.artboard.bounds);
            if (this._interactiveGraphics) {
                // Pixi uses CSS pixels, but _objBoundsReuse is in canvas pixels (with DPR)
                // So divide by DPR to convert back to CSS coordinates for Pixi
                const dpr = Math.max(1, window.devicePixelRatio || 1);
                this._interactiveGraphics.x = this._objBoundsReuse.minX / dpr;
                this._interactiveGraphics.y = this._objBoundsReuse.minY / dpr;
                this._interactiveGraphics.width = (this._objBoundsReuse.maxX - this._objBoundsReuse.minX) / dpr;
                this._interactiveGraphics.height = (this._objBoundsReuse.maxY - this._objBoundsReuse.minY) / dpr;
            }
            if (this._textLabel) {
                // Cache resolution scale check
                const resScale = this._resolutionScale !== -1 ? this._resolutionScale : 1;
                const combinedScaleX = resScale * this.xScale;
                const combinedScaleY = resScale * this.yScale;
                this._textLabel.x = this._objBoundsReuse.minX;
                this._textLabel.y = this._objBoundsReuse.maxY - (this._textLabel.height * combinedScaleY) - 5;
                // Only update scale if it changed
                if (this._textLabel.scale.x !== combinedScaleX || this._textLabel.scale.y !== combinedScaleY) {
                    this._textLabel.scale.set(combinedScaleX, combinedScaleY);
                }
            }
            this.artboard.draw(this.Renderer);
            this.Renderer.restore();
        }
    }
    SetText(text) {
        this.defObj.text = text;
        this.drawTextLabel();
    }
    drawTextLabel() {
        if (this._textLabel) {
            this._textLabel.destroy();
            this._textLabel = null;
        }
        if (this.defObj.text && this.defObj.text.length > 0) {
            const style = new PIXI.TextStyle({
                fontFamily: "Verdana",
                fontSize: 32,
                fill: "#ffcc00",
                stroke: "#000000",
                dropShadow: true,
                align: "center",
                fontWeight: "bold",
            });
            this._textLabel = new PIXI.Text({ text: this.defObj.text, style: style });
            this._textLabel.interactive = false;
            this._textLabel.eventMode = 'none';
            const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
            const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
            this._textLabel.scale.set(combinedScaleX, combinedScaleY);
            this._textLabel.x = this._objBoundsReuse.minX;
            this._textLabel.y = this._objBoundsReuse.maxY - (this._textLabel.height * combinedScaleY) - 5;
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._textLabel);
        }
    }
    initInteractive() {
        //console.log("   INIT INTERACTIVE RIVE OBJECT -- "+this._label);
        this._interactiveGraphics = new PIXI.Graphics();
        PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._interactiveGraphics);
        this._interactiveGraphics.rect(0, 0, this.width, this.height);
        this._interactiveGraphics.fill({ color: 0x650a5a, alpha: 0 });
        this._interactiveGraphics.stroke({ width: 1, color: 0xfeeb77, alpha: 0 });
        this._interactiveGraphics.x = this.x;
        this._interactiveGraphics.y = this.y;
        this._interactiveGraphics.eventMode = "static";
        this.CurrentCursor = RIVE_CURSOR_TYPES.POINTER;
        this._interactiveGraphics.on("pointerdown", this.onClick, this);
        this._interactiveGraphics.on("pointerover", this.onHover, this);
        this._interactiveGraphics.on("pointerout", this.onHoverOut, this);
    }
    get CurrentCursor() {
        return this._currentRiveCursor;
    }
    set CurrentCursor(cursor) {
        if (this._interactiveGraphics) {
            if (this._currentRiveCursor === cursor)
                return;
            this._currentRiveCursor = cursor;
            this._interactiveGraphics.cursor = cursor.toString();
        }
    }
    SetEventHandlers({ onClick, onHover, onHoverOut, }) {
        this._onClickCallback = onClick;
        this._onHoverCallback = onHover;
        this._onHoverOutCallback = onHoverOut;
    }
    onClick(event) {
        var _a;
        if (this._onClickCallback) {
            (_a = this._onClickCallback) === null || _a === void 0 ? void 0 : _a.call(this, event, this);
        }
        if (this._defObj.clickFunction) {
            this._defObj.clickFunction(this);
        }
    }
    onHover() {
        var _a;
        if (this._interactiveGraphics) {
            this._interactiveGraphics.tint = 0x00ff00;
        }
        if (this._onHoverCallback)
            (_a = this._onHoverCallback) === null || _a === void 0 ? void 0 : _a.call(this, this);
    }
    onHoverOut() {
        var _a;
        if (this._interactiveGraphics) {
            this._interactiveGraphics.tint = 0xffffff;
        }
        if (this._onHoverOutCallback)
            (_a = this._onHoverOutCallback) === null || _a === void 0 ? void 0 : _a.call(this, this);
    }
    Dispose() {
        this._disposed = true;
        const debug = false;
        if (debug) {
            console.log('');
            console.log('Canvas rive obj dispose');
        }
        // Clean up Rive resources properly
        if (this._animations) {
            if (debug)
                console.log('dispose animations : ' + this._animations.length);
            this._animations.forEach((animationMeta) => {
                try {
                    if (debug)
                        console.log('dispose animation : ' + animationMeta.name + ',  isTimelineControlled:' + animationMeta.isTimelineControlled);
                    if (animationMeta.isTimelineControlled) {
                        if (debug)
                            console.log('OMG timeline controlled meta shit... lets destroy it');
                        CanvasEngine.get().DestroyTimelineController(animationMeta);
                    }
                    animationMeta.animation.delete();
                }
                catch (e) {
                    console.warn("Failed to delete animation:", e);
                }
            });
            this._animations = [];
        }
        else {
            if (debug)
                console.log('dispose NO animation... THERE IS NO ANIMATION ');
        }
        if (this._vmEnumQueue) {
            this._vmEnumQueue = [];
        }
        if (this._stateMachine) {
            try {
                this._stateMachine.delete();
            }
            catch (e) {
                console.warn("Failed to delete state machine:", e);
            }
            this._stateMachine = null;
        }
        // Properly null out references instead of forcing undefined
        this._renderer = null;
        this._artboard = null;
        this._riveInstance = null;
        // Clean up interactive graphics with proper event removal
        if (this._interactiveGraphics) {
            // Remove specific event listeners
            this._interactiveGraphics.off("pointerdown", this.onClick, this);
            this._interactiveGraphics.off("pointerover", this.onHover, this);
            this._interactiveGraphics.off("pointerout", this.onHoverOut, this);
            // Remove all listeners just in case
            this._interactiveGraphics.removeAllListeners();
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._interactiveGraphics);
            this._interactiveGraphics.destroy();
            this._interactiveGraphics = null;
        }
        // Clean up text label
        if (this._textLabel) {
            this._textLabel.removeAllListeners();
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textLabel);
            this._textLabel.destroy();
            this._textLabel = null;
        }
        // Clear callback references to prevent circular references
        this._onClickCallback = undefined;
        this._onHoverCallback = undefined;
        this._onHoverOutCallback = undefined;
        // Clear event callbacks
        this._eventCallbacks.clear();
        // Clear ViewModels
        this._viewModels.clear();
        this._viewModelInstance = null;
        if (debug)
            console.log('canvasriveobj dispose complete call super.......... ');
        super.Dispose();
    }
    get Rive() {
        return this._riveInstance;
    }
    get Renderer() {
        return this._renderer;
    }
    get artboard() {
        return this._artboard;
    }
}
