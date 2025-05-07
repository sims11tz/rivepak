import { PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasObj } from "./CanvasObj";
import * as PIXI from "pixi.js";
export class CanvasPixiShapeObj extends CanvasObj {
    constructor(canvasDef) {
        super(canvasDef);
        this._graphics = null;
        this.initPixiObject();
    }
    initPixiObject() {
        var _a, _b, _c, _d;
        // ✅ Create a new PIXI Graphics object
        this._graphics = new PIXI.Graphics();
        PixiController.get().Pixi.stage.addChild(this._graphics);
        //const texture = await PIXI.Assets.load('https://pixijs.com/assets/bunny.png');
        //const bunny = new PIXI.Sprite(texture);
        //PixiController.get().Pixi.stage.addChild(bunny);
        //bunny.anchor.set(0.5);
        this.width = (_a = this.defObj.width) !== null && _a !== void 0 ? _a : 100;
        this.height = (_b = this.defObj.height) !== null && _b !== void 0 ? _b : 100;
        this._graphics.rect(-(this.width / 2), -(this.height / 2), this.width, this.height);
        this._graphics.fill({ color: 0x650a5a, alpha: 0.3 });
        this._graphics.stroke({ width: 2, color: 0xfeeb77 });
        this.x = (_c = this.defObj.x) !== null && _c !== void 0 ? _c : Math.random() * RiveController.get().Canvas.width;
        this.y = (_d = this.defObj.y) !== null && _d !== void 0 ? _d : Math.random() * RiveController.get().Canvas.height;
        this._graphics.x = this.x;
        this._graphics.y = this.y;
        this._graphics.eventMode = "static";
        this._graphics.cursor = "pointer";
        this._graphics.on("pointerdown", this.onClick, this);
        this._graphics.on("pointerover", this.onHover, this);
        this._graphics.on("pointerout", this.onHoverOut, this);
    }
    update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        //if(onceSecond) console.log("PixiShapeObject update",frameCount);
        if (this._graphics) {
            this._graphics.x = this.x;
            this._graphics.y = this.y;
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
    dispose() {
        super.dispose();
        if (this._graphics) {
            PixiController.get().Pixi.stage.removeChild(this._graphics);
            this._graphics.destroy();
            this._graphics = null;
        }
    }
}
