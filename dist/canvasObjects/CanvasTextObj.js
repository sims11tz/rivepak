import * as PIXI from "pixi.js";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasEngine } from "../useCanvasEngine";
import { PixiController } from "../controllers/PixiController";
export class CanvasTextObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
    }
    InitPixiObject() {
        var _a, _b, _c, _d, _e, _f;
        this.width = (_a = this.defObj.width) !== null && _a !== void 0 ? _a : 100;
        this.height = (_b = this.defObj.height) !== null && _b !== void 0 ? _b : 100;
        this.xScale = (_c = this.defObj.xScale) !== null && _c !== void 0 ? _c : 1;
        this.yScale = (_d = this.defObj.yScale) !== null && _d !== void 0 ? _d : 1;
        this.x = (_e = this.defObj.x) !== null && _e !== void 0 ? _e : 0;
        this.y = (_f = this.defObj.y) !== null && _f !== void 0 ? _f : 0;
        if (this.centerGlobally) {
            this.x = CanvasEngine.get().width / 2;
            this.y = CanvasEngine.get().height / 2;
        }
        if (this.centerGlobally || this.centerLocally) {
            this.x -= (this.width / 2);
            this.y -= (this.height / 2);
        }
        this.UpdateBaseProps();
        const scaledWidth = this.width * this.xScale;
        const scaledHeight = this.height * this.yScale;
        this._objBoundsReuse.minX = this.x;
        this._objBoundsReuse.minY = this.y;
        this._objBoundsReuse.maxX = this.x + scaledWidth;
        this._objBoundsReuse.maxY = this.y + scaledHeight;
        super.InitPixiObject();
    }
    DrawVectors() {
        if (this._textField && this._textField.text === this.defObj.text) {
            return;
        }
        if (this._textField) {
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textField);
            this._textField.destroy();
            this._textField = null;
        }
        if (this.defObj.text && this.defObj.text.length > 0) {
            const style = new PIXI.TextStyle({
                fontFamily: "Verdana",
                fontSize: 64,
                fill: "#ffcc00",
                stroke: "#000000",
                dropShadow: true,
                align: "center",
                fontWeight: "bold",
            });
            this._textField = new PIXI.Text({ text: this.defObj.text, style: style });
            this._textField.interactive = false;
            this._textField.eventMode = 'none';
            //console.log('add the shit.... layer='+this.defObj.pixiLayer);
            //console.log('add the shit.... test='+PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage);
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._textField);
            const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
            const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
            //console.log('.    combinedScaleX='+combinedScaleX);
            //console.log('.    combinedScaleY='+combinedScaleY);
            this._textField.scale.set(combinedScaleX, combinedScaleY);
            this._textField.x = this._objBoundsReuse.minX;
            this._textField.y = this._objBoundsReuse.maxY - (this._textField.height * combinedScaleY) - 5;
            //console.log('.    this._textField.x='+this._textField.x);
            //console.log('.    this._textField.y='+this._textField.y);
        }
        super.DrawVectors();
    }
    SetText(text) {
        this.defObj.text = text;
        this.DrawVectors();
    }
    Update(time, frameCount, onceSecond) {
        var _a;
        if (this.enabled === false)
            return;
        if (this._textField) {
            if ((_a = CanvasEngine.get().EngineSettings) === null || _a === void 0 ? void 0 : _a.autoScale) {
                //if(onceSecond) console.log('>>>>>>> -AUTOscaleAUTO- '+CanvasEngine.get().CurrentCanvasScale);
                let transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
                let transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
                //if(onceSecond) console.log('>>>>>>> -AUTOscaleAUTO-Tx '+transformedX);
                //if(onceSecond) console.log('>>>>>>> -AUTOscaleAUTO-Ty '+transformedY);
                this._textField.x = transformedX;
                this._textField.y = transformedY;
                this._textField.scale.set(CanvasEngine.get().CurrentCanvasScale * this.xScale, CanvasEngine.get().CurrentCanvasScale * this.yScale);
            }
            else {
                //if(onceSecond) console.log('>>>>>>> - no autoscale ---- <<<<<<<');
                this._textField.x = this.x;
                this._textField.y = this.y;
                this._textField.scale.set(this.xScale, this.yScale);
            }
        }
        else {
            //if(onceSecond) console.log("Text >4> There is no text field :S ");
        }
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        if (this._textField) {
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textField);
            this._textField.destroy();
            this._textField = null;
        }
        super.Dispose();
    }
}
