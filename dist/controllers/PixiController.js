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
    }
    static get() { if (PixiController.myInstance == null) {
        PixiController.myInstance = new PixiController();
    } return this.myInstance; }
    get PixiAbove() { return this._pixiInstanceAbove; }
    get PixiBelow() { return this._pixiInstanceBelow; }
    GetPixiInstance(layer = PIXI_LAYER.ABOVE) {
        if (layer === PIXI_LAYER.ABOVE)
            return this.PixiAbove;
        if (layer === PIXI_LAYER.BELOW)
            return this.PixiBelow;
        return this.PixiAbove;
    }
    //public get CanvasContainer() { return this._canvasContainer!; }
    Init(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pixiInstanceAbove)
                this.Dispose();
            let oldCanvasAbove = document.getElementById('pixiCanvasAbove');
            let oldCanvasBelow = document.getElementById('pixiCanvasBelow');
            this._canvasContainer = document.getElementById('pixiCanvasContainer');
            if (oldCanvasAbove)
                oldCanvasAbove.remove();
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
            this._CanvasBelow = document.createElement('canvas');
            this._CanvasBelow.id = 'pixiCanvasBelow';
            this._CanvasBelow.style.position = 'absolute';
            this._CanvasBelow.style.top = '0';
            this._CanvasBelow.style.left = '0';
            this._CanvasBelow.style.zIndex = '1';
            this._CanvasBelow.width = width || 800;
            this._CanvasBelow.height = height || 500;
            this._canvasContainer.appendChild(this._CanvasAbove);
            this._canvasContainer.appendChild(this._CanvasBelow);
            this._pixiInstanceAbove = new PIXI.Application();
            yield this._pixiInstanceAbove.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: this._CanvasAbove,
            });
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
            this._pixiInstanceBelow = new PIXI.Application();
            yield this._pixiInstanceBelow.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: this._CanvasBelow,
            });
            this._pixiInstanceAbove.stage.eventMode = 'static';
        });
    }
    SetSize(width, height) {
        var _a, _b, _c, _d;
        if (!this._pixiInstanceAbove || !this._pixiInstanceAbove.renderer)
            return;
        this._pixiInstanceAbove.renderer.resize(width, height);
        this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
        if (this._pixiInstanceBelow)
            this._pixiInstanceBelow.renderer.resize(width, height);
        (_a = this._canvasContainer) === null || _a === void 0 ? void 0 : _a.setAttribute("width", `${width}`);
        (_b = this._canvasContainer) === null || _b === void 0 ? void 0 : _b.setAttribute("height", `${height}`);
        (_c = this._CanvasAbove) === null || _c === void 0 ? void 0 : _c.setAttribute("width", `${width}`);
        (_d = this._CanvasAbove) === null || _d === void 0 ? void 0 : _d.setAttribute("height", `${height}`);
    }
    Dispose() {
        try {
            if (this._pixiInstanceAbove) {
                this._pixiInstanceAbove.ticker.stop();
                this._pixiInstanceAbove.stage.removeChildren();
                this._pixiInstanceAbove.stage.destroy({ children: true, texture: true });
                this._pixiInstanceAbove.stage.interactive = false;
                this._pixiInstanceAbove.stage.removeAllListeners();
                try {
                    this._pixiInstanceAbove.destroy(true);
                }
                catch (error) {
                    console.warn("PixiController - Failed to destroy Pixi application:", error);
                }
                this._pixiInstanceAbove = null;
            }
            if (this._pixiInstanceBelow) {
                this._pixiInstanceBelow.ticker.stop();
                this._pixiInstanceBelow.stage.removeChildren();
                this._pixiInstanceBelow.stage.destroy({ children: true, texture: true });
                this._pixiInstanceBelow.stage.interactive = false;
                this._pixiInstanceBelow.stage.removeAllListeners();
                try {
                    this._pixiInstanceBelow.destroy(true);
                }
                catch (error) {
                    console.warn("PixiController - Failed to destroy Pixi application:", error);
                }
                this._pixiInstanceBelow = null;
            }
        }
        catch (error) {
            console.error("PixiController - Error cleaning up Pixi Renderer:", error);
        }
    }
}
