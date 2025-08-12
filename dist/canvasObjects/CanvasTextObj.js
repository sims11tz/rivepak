import * as PIXI from "pixi.js";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { PIXI_LAYER, PixiController } from "../controllers/PixiController";
export class CanvasTextObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
        this._text = null;
    }
    DrawVectors() {
        var _a;
        console.log("==---");
        console.log("=====-----");
        console.log("Drawing text object vectors!!");
        console.log("this.defObj.text:", this.defObj.text);
        super.DrawVectors();
        if (this._text) {
            this._text.destroy();
            this._text = null;
            console.warn('WARN DESTROY TEXT');
        }
        if (this.defObj.text && this.defObj.text.length > 0) {
            console.log("draw some text please");
            const style = new PIXI.TextStyle({
                fontFamily: "Verdana",
                fontSize: 64,
                fill: "#ffcc00",
                stroke: "#000000",
                dropShadow: true,
                align: "center",
                fontWeight: "bold",
            });
            this._text = new PIXI.Text({ text: this.defObj.text, style: style });
            this._text.interactive = false;
            this._text.eventMode = 'none';
            const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
            const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
            this._text.scale.set(combinedScaleX, combinedScaleY);
            this._text.x = this._objBoundsReuse.minX;
            this._text.y = this._objBoundsReuse.maxY - (this._text.height * combinedScaleY) - 5;
            console.log("test.... : " + this._text.text);
            console.log("test.... x: " + this._text.x);
            console.log("test.... y: " + this._text.y);
            console.log("test.... width: " + this._text.width);
            console.log("test.... height: " + this._text.height);
            console.log("test.... combinedScaleX: " + combinedScaleX);
            console.log("test.... combinedScaleY: " + combinedScaleY);
            PixiController.get().GetPixiInstance((_a = this.defObj.pixiLayer) !== null && _a !== void 0 ? _a : PIXI_LAYER.ABOVE).stage.addChild(this._text);
        }
    }
    SetText(text) {
        console.log('SSSSSSSEEeeeeeeT text ::::::::: ' + text);
        this.defObj.text = text;
        this.DrawVectors();
    }
    Update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        const scaledWidth = this.width * this.xScale;
        const scaledHeight = this.height * this.yScale;
        if (onceSecond)
            console.log('CanvasTextObj.update');
        if (this._resolutionScale !== -1) {
            this._objBoundsReuse.minX = this._transformedX;
            this._objBoundsReuse.minY = this._transformedY;
            this._objBoundsReuse.maxX = this._transformedX + (scaledWidth * this._resolutionScale);
            this._objBoundsReuse.maxY = this._transformedY + (scaledHeight * this._resolutionScale);
        }
        else {
            this._objBoundsReuse.minX = this.x;
            this._objBoundsReuse.minY = this.y;
            this._objBoundsReuse.maxX = this.x + scaledWidth;
            this._objBoundsReuse.maxY = this.y + scaledHeight;
        }
        if (onceSecond)
            console.log('CanvasTextObj this._objBoundsReuse.minX:' + this._objBoundsReuse.minX);
        if (onceSecond)
            console.log('CanvasTextObj this._objBoundsReuse.minY:' + this._objBoundsReuse.minY);
        if (onceSecond)
            console.log('CanvasTextObj this._objBoundsReuse.maxX:' + this._objBoundsReuse.maxX);
        if (onceSecond)
            console.log('CanvasTextObj this._objBoundsReuse.maxY:' + this._objBoundsReuse.maxY);
        if (this._text) {
            const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
            const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
            this._text.x = this._objBoundsReuse.minX;
            this._text.y = this._objBoundsReuse.maxY - (this._text.height * combinedScaleY) - 5;
            if (onceSecond)
                console.log('CanvasTextObj this._text.x:' + this._text.x);
            if (onceSecond)
                console.log('CanvasTextObj this._text.y:' + this._text.y);
            if (this._text.scale.x !== combinedScaleX || this._text.scale.y !== combinedScaleY) {
                this._text.scale.set(combinedScaleX, combinedScaleY);
                if (onceSecond)
                    console.log('CanvasTextObj this._text.scale:' + this._text.scale);
            }
        }
        else {
            if (onceSecond)
                console.log('CanvasTextObj NO TEXT OBJ:---', this._text);
        }
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        super.Dispose();
    }
}
