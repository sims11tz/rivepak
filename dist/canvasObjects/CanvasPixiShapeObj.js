import { PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { CanvasObj } from "./CanvasObj";
import * as PIXI from "pixi.js";
export class CanvasPixiShapeObj extends CanvasObj {
    constructor(canvasDef) {
        super(canvasDef);
        this._graphics = null;
        this.InitPixiObject();
    }
    InitPixiObject() {
        var _a, _b, _c, _d, _e, _f;
        // ✅ Create a new PIXI Graphics object
        this._graphics = new PIXI.Graphics();
        PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._graphics);
        //const texture = await PIXI.Assets.load('https://pixijs.com/assets/bunny.png');
        //const bunny = new PIXI.Sprite(texture);
        //PixiController.get().Pixi.stage.addChild(bunny);
        //bunny.anchor.set(0.5);
        this.width = (_a = this.defObj.width) !== null && _a !== void 0 ? _a : 100;
        this.height = (_b = this.defObj.height) !== null && _b !== void 0 ? _b : 100;
        this.xScale = (_c = this.defObj.xScale) !== null && _c !== void 0 ? _c : 1;
        this.yScale = (_d = this.defObj.yScale) !== null && _d !== void 0 ? _d : 1;
        this.DrawVectors();
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
        this.UpdateBaseProps();
    }
    DrawVectors() {
        if (this._graphics === null)
            return;
        this._graphics.rect(0, 0, this.width, this.height);
        this._graphics.fill({ color: 0x650a5a, alpha: 0.3 });
        this._graphics.stroke({ width: 2, color: 0xfeeb77 });
    }
    Update(time, frameCount, onceSecond) {
        var _a;
        if (this.enabled === false)
            return;
        if (this._graphics) {
            if ((_a = CanvasEngine.get().EngineSettings) === null || _a === void 0 ? void 0 : _a.autoScale) {
                let transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
                let transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
                this._graphics.x = transformedX;
                this._graphics.y = transformedY;
                this._graphics.scale.set(CanvasEngine.get().CurrentCanvasScale * this.xScale, CanvasEngine.get().CurrentCanvasScale * this.yScale);
            }
            else {
                this._graphics.x = this.x;
                this._graphics.y = this.y;
                this._graphics.scale.set(this.xScale, this.yScale);
            }
        }
    }
    onClick(event) {
        //console.log("🖱️ PixiShapeObject clicked!", this.label);
    }
    // ✅ Hover event handler
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
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._graphics);
            this._graphics.destroy();
            this._graphics = null;
        }
        super.Dispose();
    }
}
