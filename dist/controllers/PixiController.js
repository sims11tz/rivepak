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
export class PixiController {
    constructor() {
        this._pixiInstance = null;
        this._canvas = null;
        //public get Canvas() { return this._canvas!; }
        this._canvasContainer = null;
    }
    static get() { if (PixiController.myInstance == null) {
        PixiController.myInstance = new PixiController();
    } return this.myInstance; }
    get Pixi() { return this._pixiInstance; }
    //public get CanvasContainer() { return this._canvasContainer!; }
    Init(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pixiInstance)
                this.Dispose();
            let oldCanvas = document.getElementById('pixiCanvas');
            this._canvasContainer = document.getElementById('pixiCanvasContainer');
            if (oldCanvas)
                oldCanvas.remove();
            this._canvas = document.createElement('canvas');
            this._canvas.id = 'pixiCanvas';
            this._canvas.width = width || 800;
            this._canvas.height = height || 500;
            this._canvasContainer.appendChild(this._canvas); // Add to the same parent
            this._pixiInstance = new PIXI.Application();
            yield this._pixiInstance.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: this._canvas,
            });
            this._pixiInstance.stage.eventMode = 'static';
            this._pixiInstance.stage.hitArea = this._pixiInstance.renderer.screen;
            this._pixiInstance.stage.on('pointermove', (e) => {
                const canvasBounds = this._canvas.getBoundingClientRect();
                const x = e.clientX - canvasBounds.left;
                const y = e.clientY - canvasBounds.top;
                RiveController.get().SetMousePos(x, y);
            });
            this._pixiInstance.stage.on('pointerdown', (e) => {
                RiveController.get().SetMouseDown(true);
            });
            this._pixiInstance.stage.on('pointerup', (e) => {
                RiveController.get().SetMouseDown(false);
            });
        });
    }
    SetSize(width, height) {
        var _a, _b, _c, _d;
        if (!this._pixiInstance || !this._pixiInstance.renderer) {
            console.warn("PixiController.SetSize --- COCK BLOCK");
            return;
        }
        console.log("PixiController.SetSize --- " + width + ":" + height);
        this._pixiInstance.renderer.resize(width, height);
        this._pixiInstance.stage.hitArea = this._pixiInstance.renderer.screen;
        (_a = this._canvasContainer) === null || _a === void 0 ? void 0 : _a.setAttribute("width", `${width}`);
        (_b = this._canvasContainer) === null || _b === void 0 ? void 0 : _b.setAttribute("height", `${height}`);
        //this._canvasContainer?.setAttribute("margin", `${vertMargin}px ${horizMargin}px`);
        (_c = this._canvas) === null || _c === void 0 ? void 0 : _c.setAttribute("width", `${width}`);
        (_d = this._canvas) === null || _d === void 0 ? void 0 : _d.setAttribute("height", `${height}`);
        //this._canvasContainer?.setAttribute("margin", `${vertMargin}px ${horizMargin}px`);
    }
    Dispose() {
        try {
            if (!this._pixiInstance)
                return;
            this._pixiInstance.ticker.stop();
            this._pixiInstance.stage.removeChildren();
            this._pixiInstance.stage.destroy({ children: true, texture: true });
            this._pixiInstance.stage.interactive = false;
            this._pixiInstance.stage.removeAllListeners();
            try {
                this._pixiInstance.destroy(true);
            }
            catch (error) {
                console.warn("PixiController - Failed to destroy Pixi application:", error);
            }
            this._pixiInstance = null;
        }
        catch (error) {
            console.error("PixiController - Error cleaning up Pixi Renderer:", error);
        }
    }
}
