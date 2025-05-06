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
import RiveController from "./RiveController";
export var PIXI_OBJECT_TYPE;
(function (PIXI_OBJECT_TYPE) {
    PIXI_OBJECT_TYPE["GRAPHICS"] = "GRAPHICS";
    PIXI_OBJECT_TYPE["TEXTURE"] = "TEXTURE";
})(PIXI_OBJECT_TYPE || (PIXI_OBJECT_TYPE = {}));
export default class PixiController {
    constructor() {
        this._pixiInstance = null;
    }
    static get() { if (PixiController.myInstance == null) {
        PixiController.myInstance = new PixiController();
    } return this.myInstance; }
    get Pixi() { return this._pixiInstance; }
    init(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pixiInstance)
                this.dispose();
            let oldCanvas = document.getElementById('pixiCanvas');
            const parentElement = document.getElementById('pixiCanvasContainer');
            if (oldCanvas)
                oldCanvas.remove();
            const newCanvas = document.createElement('canvas');
            newCanvas.id = 'pixiCanvas';
            newCanvas.width = width || 800;
            newCanvas.height = height || 500;
            parentElement.appendChild(newCanvas); // Add to the same parent
            this._pixiInstance = new PIXI.Application();
            yield this._pixiInstance.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: newCanvas,
            });
            this._pixiInstance.stage.eventMode = 'static';
            this._pixiInstance.stage.hitArea = this._pixiInstance.renderer.screen;
            this._pixiInstance.stage.on('pointermove', (e) => {
                const canvasBounds = newCanvas.getBoundingClientRect();
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
    dispose() {
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
