var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as PIXI from "pixi.js";
import { RiveController } from "./RiveController";
export var PIXI_OBJECT_TYPE;
(function (PIXI_OBJECT_TYPE) {
    PIXI_OBJECT_TYPE["GRAPHICS"] = "GRAPHICS";
    PIXI_OBJECT_TYPE["TEXTURE"] = "TEXTURE";
})(PIXI_OBJECT_TYPE || (PIXI_OBJECT_TYPE = {}));
export var PIXI_LAYER;
(function (PIXI_LAYER) {
    PIXI_LAYER["ABOVE"] = "ABOVE";
    PIXI_LAYER["BELOW"] = "BELOW";
})(PIXI_LAYER || (PIXI_LAYER = {}));
export class PixiController {
    constructor() {
        this._pixiInstanceAbove = null;
        this._pixiInstanceBelow = null;
        this._CanvasAbove = null;
        this._CanvasBelow = null;
        //public get Canvas() { return this._canvas!; }
        this._canvasContainer = null;
        //public get CanvasContainer() { return this._canvasContainer!; }
        this._initialized = false;
    }
    static get() { if (PixiController.myInstance == null) {
        PixiController.myInstance = new PixiController();
    } return this.myInstance; }
    get PixiAbove() { return this._pixiInstanceAbove; }
    get PixiBelow() { return this._pixiInstanceBelow; }
    GetPixiInstance(layer = PIXI_LAYER.ABOVE) {
        if (layer === PIXI_LAYER.ABOVE || layer == undefined)
            return this.PixiAbove;
        if (layer === PIXI_LAYER.BELOW)
            return this.PixiBelow;
        return this.PixiAbove;
    }
    Init(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pixiInstanceAbove)
                this.Dispose();
            this._canvasContainer = document.getElementById('pixiCanvasContainer');
            let oldCanvasAbove = document.getElementById('pixiCanvasAbove');
            if (oldCanvasAbove)
                oldCanvasAbove.remove();
            let oldCanvasBelow = document.getElementById('pixiCanvasBelow');
            if (oldCanvasBelow)
                oldCanvasBelow.remove();
            this._CanvasAbove = document.createElement('canvas');
            this._CanvasAbove.id = 'pixiCanvasAbove';
            this._CanvasAbove.style.position = 'absolute';
            this._CanvasAbove.style.top = '0';
            this._CanvasAbove.style.left = '0';
            this._CanvasAbove.style.zIndex = '3';
            this._CanvasAbove.width = width || 800;
            this._CanvasAbove.height = height || 500;
            this._canvasContainer.appendChild(this._CanvasAbove);
            this._pixiInstanceAbove = new PIXI.Application();
            yield this._pixiInstanceAbove.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: this._CanvasAbove,
                //resolution: window.devicePixelRatio || 1,
            });
            this._pixiInstanceAbove.ticker.autoStart = false;
            this._pixiInstanceAbove.ticker.stop();
            this._pixiInstanceAbove.stage.eventMode = 'static';
            this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
            this._pixiInstanceAbove.stage.on('pointermove', (e) => {
                const canvasBounds = this._CanvasAbove.getBoundingClientRect();
                const x = e.clientX - canvasBounds.left;
                const y = e.clientY - canvasBounds.top;
                RiveController.get().SetMousePos(x, y);
            });
            this._pixiInstanceAbove.stage.on('pointerdown', (e) => {
                RiveController.get().SetMouseDown(true);
            });
            this._pixiInstanceAbove.stage.on('pointerup', (e) => {
                RiveController.get().SetMouseDown(false);
            });
            this._CanvasBelow = document.createElement('canvas');
            this._CanvasBelow.id = 'pixiCanvasBelow';
            this._CanvasBelow.style.position = 'absolute';
            this._CanvasBelow.style.top = '0';
            this._CanvasBelow.style.left = '0';
            this._CanvasBelow.style.zIndex = '1';
            this._CanvasBelow.width = width || 800;
            this._CanvasBelow.height = height || 500;
            this._canvasContainer.appendChild(this._CanvasBelow);
            this._pixiInstanceBelow = new PIXI.Application();
            yield this._pixiInstanceBelow.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: this._CanvasBelow,
                //resolution: window.devicePixelRatio || 1,
            });
            this._pixiInstanceBelow.ticker.autoStart = false;
            this._pixiInstanceBelow.ticker.stop();
            this._pixiInstanceBelow.stage.eventMode = 'static';
            this._initialized = true;
        });
    }
    Update(time, frameCount, onceSecond) {
        if (!this._initialized)
            return;
        if (this._pixiInstanceAbove && this._pixiInstanceAbove.render) {
            this._pixiInstanceAbove.render();
        }
        if (this._pixiInstanceBelow && this._pixiInstanceBelow.render) {
            this._pixiInstanceBelow.render();
        }
    }
    SetSize(width, height) {
        var _a, _b, _c, _d, _e, _f;
        if (!this._initialized)
            return;
        (_a = this._canvasContainer) === null || _a === void 0 ? void 0 : _a.setAttribute("width", `${width}`);
        (_b = this._canvasContainer) === null || _b === void 0 ? void 0 : _b.setAttribute("height", `${height}`);
        if (this._pixiInstanceAbove) {
            this._pixiInstanceAbove.renderer.resize(width, height);
            this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
        }
        (_c = this._CanvasAbove) === null || _c === void 0 ? void 0 : _c.setAttribute("width", `${width}`);
        (_d = this._CanvasAbove) === null || _d === void 0 ? void 0 : _d.setAttribute("height", `${height}`);
        if (this._pixiInstanceBelow) {
            this._pixiInstanceBelow.renderer.resize(width, height);
        }
        (_e = this._CanvasBelow) === null || _e === void 0 ? void 0 : _e.setAttribute("width", `${width}`);
        (_f = this._CanvasBelow) === null || _f === void 0 ? void 0 : _f.setAttribute("height", `${height}`);
    }
    Dispose() {
        try {
            this._initialized = false;
            if (this._pixiInstanceAbove) {
                try {
                    //this._pixiInstanceAbove.destroy(true); // causing double destroy issues
                    // Remove event listeners BEFORE destroying to prevent memory leaks
                    this._pixiInstanceAbove.stage.off('pointermove');
                    this._pixiInstanceAbove.stage.off('pointerdown');
                    this._pixiInstanceAbove.stage.off('pointerup');
                    this._pixiInstanceAbove.stage.removeAllListeners();
                    this._pixiInstanceAbove.ticker.stop();
                    this._pixiInstanceAbove.stage.removeChildren();
                    this._pixiInstanceAbove.stage.interactive = false;
                    // Destroy stage with options
                    this._pixiInstanceAbove.stage.destroy({ children: true, texture: true, context: true });
                }
                catch (error) {
                    console.warn("PixiController - Failed to destroy Above Pixi application:", error);
                }
                this._pixiInstanceAbove = null;
            }
            if (this._pixiInstanceBelow) {
                try {
                    //this._pixiInstanceBelow.destroy(true); // causing double destroy issues
                    // Remove any listeners if added in future
                    this._pixiInstanceBelow.stage.removeAllListeners();
                    this._pixiInstanceBelow.ticker.stop();
                    this._pixiInstanceBelow.stage.removeChildren();
                    this._pixiInstanceBelow.stage.interactive = false;
                    // Destroy stage with options
                    this._pixiInstanceBelow.stage.destroy({ children: true, texture: true });
                }
                catch (error) {
                    console.warn("PixiController - Failed to destroy Below Pixi application:", error);
                }
                this._pixiInstanceBelow = null;
            }
            // Clear canvas references
            this._CanvasAbove = null;
            this._CanvasBelow = null;
            this._canvasContainer = null;
        }
        catch (error) {
            console.error("PixiController - Error cleaning up Pixi Renderer:", error);
        }
    }
}
