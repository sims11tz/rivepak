import { PIXI_LAYER, PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { CanvasObj } from "./CanvasObj";
import * as PIXI from "pixi.js";
export class CanvasPixiShapeObj extends CanvasObj {
    constructor(canvasDef) {
        super(canvasDef);
        this._graphics = null;
        this._debugGraphics = null;
        this._ranFirstUpdate = false;
        this.InitPixiObject();
    }
    InitPixiObject() {
        var _a, _b, _c, _d, _e, _f;
        if (this._debug) {
            this._debugGraphics = new PIXI.Graphics();
            PixiController.get().GetPixiInstance(PIXI_LAYER.ABOVE).stage.addChild(this._debugGraphics);
        }
        this._graphics = new PIXI.Graphics();
        PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._graphics);
        this.width = (_a = this.defObj.width) !== null && _a !== void 0 ? _a : 100;
        this.height = (_b = this.defObj.height) !== null && _b !== void 0 ? _b : 100;
        this.xScale = (_c = this.defObj.xScale) !== null && _c !== void 0 ? _c : 1;
        this.yScale = (_d = this.defObj.yScale) !== null && _d !== void 0 ? _d : 1;
        this.x = (_e = this.defObj.x) !== null && _e !== void 0 ? _e : Math.random() * RiveController.get().Canvas.width;
        this.y = (_f = this.defObj.y) !== null && _f !== void 0 ? _f : Math.random() * RiveController.get().Canvas.height;
        this._graphics.x = this.x;
        this._graphics.y = this.y;
        this._graphics.scale.set(this.xScale, this.yScale);
        this._graphics.eventMode = "static";
        if (this.defObj.interactive) {
            this._graphics.cursor = "pointer";
            this._graphics.on("pointerdown", this.onClick, this);
            this._graphics.on("pointerover", this.onHover, this);
            this._graphics.on("pointerout", this.onHoverOut, this);
        }
        if (this.centerGlobally) {
            this.x = CanvasEngine.get().width / 2;
            this.y = CanvasEngine.get().height / 2;
        }
        if (this.centerGlobally || this.centerLocally) {
            this.x -= (this.width / 2);
            this.y -= (this.height / 2);
        }
        this.UpdateBaseProps();
        this.DrawVectors();
    }
    DrawVectors() {
        if (this._graphics === null)
            return;
        if (this._debug && this._debugGraphics) {
            this._debugGraphics.clear();
            this._debugGraphics.rect(0, 0, this.width, this.height);
            this._debugGraphics.fill({ color: 0x650a5a, alpha: 0.75 });
            this._debugGraphics.stroke({ width: 2, color: 0xfeeb77, alpha: 0.95 });
        }
    }
    Update(time, frameCount, onceSecond) {
        var _a;
        if (this.enabled === false)
            return;
        if (!this._ranFirstUpdate) {
            this._ranFirstUpdate = true;
            this.DrawVectors();
        }
        let transformedX = 0;
        let xScale = 0;
        let transformedY = 0;
        let yScale = 0;
        if (((_a = CanvasEngine.get().EngineSettings) === null || _a === void 0 ? void 0 : _a.autoScale) && (this._graphics || (this._debug && this._debugGraphics))) {
            transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
            transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
            xScale = CanvasEngine.get().CurrentCanvasScale * this.xScale;
            yScale = CanvasEngine.get().CurrentCanvasScale * this.yScale;
        }
        else {
            transformedX = this.x;
            transformedY = this.y;
            xScale = this.xScale;
            yScale = this.yScale;
        }
        if (this._graphics) {
            this._graphics.x = transformedX;
            this._graphics.y = transformedY;
            this._graphics.scale.set(xScale, yScale);
        }
        if (this._debug && this._debugGraphics) {
            this._debugGraphics.x = transformedX;
            this._debugGraphics.y = transformedY;
            this._debugGraphics.scale.set(xScale, yScale);
        }
    }
    onClick(event) {
        //console.log("🖱️ PixiShapeObject clicked!", this.label);
    }
    onHover() {
        if (this._graphics) {
            this._graphics.tint = 0x00ff00;
        }
    }
    onHoverOut() {
        if (this._graphics) {
            this._graphics.tint = 0xffffff;
        }
    }
    Dispose() {
        if (this._graphics) {
            // Remove event listeners BEFORE destroying to prevent memory leaks
            if (this.defObj.interactive) {
                this._graphics.off("pointerdown", this.onClick, this);
                this._graphics.off("pointerover", this.onHover, this);
                this._graphics.off("pointerout", this.onHoverOut, this);
            }
            // Remove all listeners just in case
            this._graphics.removeAllListeners();
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._graphics);
            this._graphics.destroy();
            this._graphics = null;
        }
        if (this._debugGraphics) {
            // Clean up debug graphics listeners if any
            this._debugGraphics.removeAllListeners();
            PixiController.get().GetPixiInstance(PIXI_LAYER.ABOVE).stage.removeChild(this._debugGraphics);
            this._debugGraphics.destroy();
            this._debugGraphics = null;
        }
        super.Dispose();
    }
}
