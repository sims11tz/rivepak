var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import RiveCanvas from "@rive-app/webgl-advanced";
import { RiveAnimationObject } from "../canvasObjects/RiveAnimationObj";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";
export var RIVE_OBJECT_TYPE;
(function (RIVE_OBJECT_TYPE) {
    RIVE_OBJECT_TYPE["ANIMATION"] = "ANIMATION";
    RIVE_OBJECT_TYPE["PHYSICS"] = "PHYSICS";
})(RIVE_OBJECT_TYPE || (RIVE_OBJECT_TYPE = {}));
export class RiveController {
    constructor() {
        this._riveInstance = null;
        this._riveRenderer = null;
        this._canvas = null;
        this._canvasBounds = null;
        this._canvasGlobalBounds = null;
        this._initCalled = false;
        this._cache = new Map();
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
    get CanvasGlobalBounds() { return this._canvasBounds; }
    init(canvas) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this._initCalled) {
                return;
            }
            this._initCalled = true;
            try {
                this._riveInstance = yield RiveCanvas({ locateFile: (file) => `/rive/${file}` });
                this._riveRenderer = this._riveInstance.makeRenderer(canvas);
                this._canvas = canvas;
                this._canvasBounds = this._canvas.getBoundingClientRect();
                console.log("🚀 Rive Renderer Type:", (_a = this._riveRenderer) === null || _a === void 0 ? void 0 : _a.constructor.name);
                window.addEventListener("mousemove", this.SetMouseGlobalPos);
            }
            catch (error) {
                console.error("Failed to initialize Rive:", error);
            }
        });
    }
    CreateRiveObj(riveObjDefs) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const defs = [];
            if (Array.isArray(riveObjDefs)) {
                riveObjDefs.forEach(def => { var _a; for (let i = 0; i < ((_a = def.count) !== null && _a !== void 0 ? _a : 1); i++)
                    defs.push(def); });
            }
            else {
                for (let i = 0; i < ((_a = riveObjDefs.count) !== null && _a !== void 0 ? _a : 1); i++)
                    defs.push(riveObjDefs);
            }
            const filePaths = defs.map((def) => def.filePath);
            const loadPromise = new Promise((resolve) => this.loadRiveFiles(filePaths, resolve));
            const loadedFiles = yield loadPromise;
            const riveFileMap = new Map();
            loadedFiles.forEach(({ filename, riveFile }) => {
                riveFileMap.set(filename, riveFile);
            });
            const riveObjects = defs.map((def) => {
                const riveFile = riveFileMap.get(def.filePath);
                if (!riveFile) {
                    console.error(`Failed to create Rive object for ${def.filePath}, file did not load.`);
                    return null;
                }
                //debug name artboards
                //for (let x = 0; x < riveFile.artboardCount(); x++) { const artboard = riveFile.artboardByIndex(x); if (artboard) { console.log(`Artboard ${x}:`, artboard.name); } }
                let artboard = riveFile.artboardByName(def.artboardName);
                if (!artboard) {
                    if (riveFile.artboardCount() > 0) {
                        artboard = riveFile.artboardByIndex(0);
                        if (!artboard) {
                            console.error(`Artboard ${def.artboardName} not found in ${def.filePath}`);
                            return null;
                        }
                    }
                }
                if (def.classType) {
                    return new def.classType(def, artboard);
                }
                else {
                    switch (def.objectType) {
                        case RIVE_OBJECT_TYPE.ANIMATION: return new RiveAnimationObject(def, artboard);
                        case RIVE_OBJECT_TYPE.PHYSICS: return new RivePhysicsObject(def, artboard);
                    }
                }
            });
            return riveObjects.filter(Boolean);
        });
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
        const objLeft = ((_c = entity.x) !== null && _c !== void 0 ? _c : 0) - (width / 2);
        const objTop = ((_d = entity.y) !== null && _d !== void 0 ? _d : 0) - (height / 2);
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
        return { x: artboardX, y: artboardY };
    }
    WindowToArtboard(entity, interactiveCheck = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const width = (_a = entity.width) !== null && _a !== void 0 ? _a : 1;
        const height = (_b = entity.height) !== null && _b !== void 0 ? _b : 1;
        const objLeft = ((_c = entity.x) !== null && _c !== void 0 ? _c : 0) - (width / 2);
        const objTop = ((_d = entity.y) !== null && _d !== void 0 ? _d : 0) - (height / 2);
        // Get absolute window mouse position
        const mouseX = this._mouseGlobalPos.x;
        const mouseY = this._mouseGlobalPos.y;
        // Get canvas bounds relative to the screen
        if (!this._canvasGlobalBounds && this._canvas) {
            this._canvasGlobalBounds = this._canvas.getBoundingClientRect();
        }
        const offsetX = (_f = (_e = this._canvasGlobalBounds) === null || _e === void 0 ? void 0 : _e.left) !== null && _f !== void 0 ? _f : 0;
        const offsetY = (_h = (_g = this._canvasGlobalBounds) === null || _g === void 0 ? void 0 : _g.top) !== null && _h !== void 0 ? _h : 0;
        const canvasX = mouseX - offsetX;
        const canvasY = mouseY - offsetY;
        // Convert to local entity space
        const localX = canvasX - objLeft;
        const localY = canvasY - objTop;
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
    dispose() {
        console.log("RiveController - Dispose !!!!!!! ");
        window.removeEventListener("mousemove", this.SetMouseGlobalPos);
        try {
            this._riveInstance.cleanup();
        }
        catch (error) {
            //console.log("RiveController - Error cleaning up Rive Renderer:", error);
        }
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
