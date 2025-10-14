import * as PIXI from "pixi.js";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasEngine } from "../useCanvasEngine";
import { PixiController } from "../controllers/PixiController";
export class CanvasTextObject extends CanvasPixiShapeObj {
    constructor(canvasDef) {
        super(canvasDef);
        this._styleDirty = false;
        if (this.defObj.typewriterEffect && this.defObj.text) {
            this._fullText = this.defObj.text;
            this._typewriterIndex = 0;
            this._typewriterTimer = 0;
        }
        if (this.defObj.fadeInDuration) {
            this._fadeStartTime = Date.now();
        }
    }
    // Override z setter to update text field zIndex
    get z() {
        return super.z;
    }
    set z(value) {
        super.z = value;
        // Update the text field's zIndex when z changes
        if (this._textField) {
            this._textField.zIndex = value;
        }
    }
    InitPixiObject() {
        //this._debug = true;
        var _a, _b, _c, _d, _e, _f;
        this.width = (_a = this.defObj.width) !== null && _a !== void 0 ? _a : 100;
        this.height = (_b = this.defObj.height) !== null && _b !== void 0 ? _b : 100;
        this.xScale = (_c = this.defObj.xScale) !== null && _c !== void 0 ? _c : 1;
        this.yScale = (_d = this.defObj.yScale) !== null && _d !== void 0 ? _d : 1;
        this.y = (_e = this.defObj.y) !== null && _e !== void 0 ? _e : 0;
        this.z = (_f = this.defObj.z) !== null && _f !== void 0 ? _f : 0;
        if (this.centerGlobally) {
            this.x = CanvasEngine.get().width / 2;
            this.y = CanvasEngine.get().height / 2;
        }
        if (this.centerGlobally || this.centerLocally) {
            this.x -= (this.width / 2);
            this.y -= (this.height / 2);
        }
        const scaledWidth = this.width * this.xScale;
        const scaledHeight = this.height * this.yScale;
        this._objBoundsReuse.minX = this.x;
        this._objBoundsReuse.minY = this.y;
        this._objBoundsReuse.maxX = this.x + scaledWidth;
        this._objBoundsReuse.maxY = this.y + scaledHeight;
        //console.log('%c CanvasTextObj x='+this.x+' y='+this.y+' w='+this.width+' h='+this.height,'color:#FFA500; font-weight:bold;');
        super.InitPixiObject();
    }
    /**
     * Migrates old PIXI v7 stroke format to v8 format
     */
    migrateStrokeStyle(style) {
        // Check if style has old stroke format
        if ('strokeThickness' in style || (style.stroke && typeof style.stroke !== 'object')) {
            const newStyle = Object.assign({}, style);
            // Convert old stroke format to new format
            if (style.stroke || style.strokeThickness) {
                newStyle.stroke = {
                    color: style.stroke || 0x000000,
                    width: style.strokeThickness || 0,
                    alpha: 1
                };
                // Remove old properties
                delete newStyle.strokeThickness;
                if (typeof style.stroke !== 'object') {
                    delete newStyle.stroke;
                    newStyle.stroke = {
                        color: style.stroke || 0x000000,
                        width: style.strokeThickness || 0,
                        alpha: 1
                    };
                }
            }
            return newStyle;
        }
        return style;
    }
    //textAlign verticalAlign
    createTextStyle() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const defaultStyle = {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 24,
            fill: 0xffffff,
            align: this.defObj.textAlign || 'left',
            wordWrap: (_a = this.defObj.wordWrap) !== null && _a !== void 0 ? _a : false,
            wordWrapWidth: (_b = this.defObj.wordWrapWidth) !== null && _b !== void 0 ? _b : this.width,
            breakWords: (_c = this.defObj.breakWords) !== null && _c !== void 0 ? _c : false,
            letterSpacing: (_d = this.defObj.letterSpacing) !== null && _d !== void 0 ? _d : 0,
            lineHeight: this.defObj.lineHeight,
            padding: (_e = this.defObj.padding) !== null && _e !== void 0 ? _e : 0,
            trim: (_f = this.defObj.trimText) !== null && _f !== void 0 ? _f : false,
        };
        if (this.defObj.textShadow) {
            defaultStyle.dropShadow = {
                color: (_g = this.defObj.textShadowColor) !== null && _g !== void 0 ? _g : 0x000000,
                blur: (_h = this.defObj.textShadowBlur) !== null && _h !== void 0 ? _h : 4,
                angle: (_j = this.defObj.textShadowAngle) !== null && _j !== void 0 ? _j : Math.PI / 6,
                distance: (_k = this.defObj.textShadowDistance) !== null && _k !== void 0 ? _k : 5,
                alpha: (_l = this.defObj.textShadowAlpha) !== null && _l !== void 0 ? _l : 1
            };
        }
        let finalStyle = this.defObj.textStyle ? Object.assign(Object.assign({}, defaultStyle), this.defObj.textStyle) : defaultStyle;
        finalStyle = this.migrateStrokeStyle(finalStyle);
        return new PIXI.TextStyle(finalStyle);
    }
    calculateAlignmentOffsets() {
        var _a, _b;
        if (!this._textField)
            return;
        const textBounds = this._textField.getLocalBounds();
        const containerWidth = (_a = this.defObj.maxWidth) !== null && _a !== void 0 ? _a : this.width;
        const containerHeight = (_b = this.defObj.maxHeight) !== null && _b !== void 0 ? _b : this.height;
        switch (this.defObj.textAlign) {
            case 'center':
                this._alignmentOffsetX = (containerWidth - textBounds.width) / 2;
                break;
            case 'right':
                this._alignmentOffsetX = containerWidth - textBounds.width;
                break;
            case 'justify':
            case 'left':
            default:
                this._alignmentOffsetX = 0;
                break;
        }
        switch (this.defObj.verticalAlign) {
            case 'middle':
                this._alignmentOffsetY = (containerHeight - textBounds.height) / 2;
                break;
            case 'bottom':
                this._alignmentOffsetY = containerHeight - textBounds.height;
                break;
            case 'top':
            default:
                this._alignmentOffsetY = 0;
                break;
        }
    }
    get visible() {
        return super.visible;
    }
    set visible(value) {
        if (value) {
            if (this._textField)
                this._textField.visible = true;
        }
        else {
            if (this._textField)
                this._textField.visible = false;
        }
        super.visible = value;
    }
    DrawVectors() {
        if (this._textField && this._textField.text === this.getCurrentDisplayText() && !this.hasStyleChanged()) {
            return;
        }
        this._styleDirty = false;
        if (this._textField) {
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textField);
            this._textField.destroy();
            this._textField = null;
        }
        const displayText = this.getCurrentDisplayText();
        if (displayText && displayText.length > 0) {
            const style = this.createTextStyle();
            this._textField = new PIXI.Text({ text: displayText, style: style });
            this._textField.zIndex = this.z;
            if (this.defObj.interactive) {
                this._textField.interactive = true;
                this._textField.eventMode = 'static';
                this._textField.cursor = 'pointer';
                this._textField.on('pointerdown', this.onTextClick, this);
                this._textField.on('pointerover', this.onTextHover, this);
                this._textField.on('pointerout', this.onTextHoverOut, this);
            }
            else {
                this._textField.interactive = false;
                this._textField.eventMode = 'none';
            }
            if (this.defObj.resolution) {
                this._textField.resolution = this.defObj.resolution;
            }
            this.calculateAlignmentOffsets();
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._textField);
            // Update width/height based on actual rendered text bounds
            this.updateDimensionsFromText();
            this.updateTextTransform();
        }
        super.DrawVectors();
    }
    updateTextTransform() {
        if (!this._textField)
            return;
        const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
        const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
        this._textField.scale.set(combinedScaleX, combinedScaleY);
        this._textField.x = this._objBoundsReuse.minX + this._alignmentOffsetX * combinedScaleX;
        this._textField.y = this._objBoundsReuse.minY + this._alignmentOffsetY * combinedScaleY;
    }
    /**
     * Updates the width and height of this object based on the actual rendered text bounds
     * Only updates if no explicit width/height was provided in defObj
     */
    updateDimensionsFromText() {
        if (!this._textField)
            return;
        // Only auto-update dimensions if they weren't explicitly set
        const hasExplicitWidth = this.defObj.width !== undefined;
        const hasExplicitHeight = this.defObj.height !== undefined;
        if (!hasExplicitWidth || !hasExplicitHeight) {
            const bounds = this._textField.getLocalBounds();
            if (!hasExplicitWidth) {
                this.width = bounds.width;
            }
            if (!hasExplicitHeight) {
                this.height = bounds.height;
            }
            // Update bounds cache
            const scaledWidth = this.width * this.xScale;
            const scaledHeight = this.height * this.yScale;
            this._objBoundsReuse.maxX = this._objBoundsReuse.minX + scaledWidth;
            this._objBoundsReuse.maxY = this._objBoundsReuse.minY + scaledHeight;
        }
    }
    getCurrentDisplayText() {
        if (!this.defObj.text)
            return "";
        if (this.defObj.typewriterEffect) {
            return this._fullText.substring(0, this._typewriterIndex);
        }
        return this.defObj.text;
    }
    hasStyleChanged() {
        return this._styleDirty;
    }
    set Text(value) {
        this.SetText(value);
    }
    get Text() {
        var _a;
        return (_a = this.defObj.text) !== null && _a !== void 0 ? _a : '';
    }
    SetText(text) {
        this.defObj.text = text;
        if (this.defObj.typewriterEffect) {
            this._fullText = text;
            this._typewriterIndex = 0;
            this._typewriterTimer = 0;
        }
        this.DrawVectors();
    }
    SetTextStyle(style) {
        this._styleDirty = true;
        this.defObj.textStyle = Object.assign(Object.assign({}, this.defObj.textStyle), style);
        this.DrawVectors();
    }
    SetAlignment(horizontal, vertical) {
        if (horizontal)
            this.defObj.textAlign = horizontal;
        if (vertical)
            this.defObj.verticalAlign = vertical;
        this.calculateAlignmentOffsets();
        this.updateTextTransform();
    }
    StartTypewriter(speed) {
        var _a;
        this.defObj.typewriterEffect = true;
        this.defObj.typewriterSpeed = speed !== null && speed !== void 0 ? speed : 10;
        this._fullText = (_a = this.defObj.text) !== null && _a !== void 0 ? _a : "";
        this._typewriterIndex = 0;
        this._typewriterTimer = 0;
    }
    StopTypewriter() {
        this.defObj.typewriterEffect = false;
        this._typewriterIndex = this._fullText.length;
        this.DrawVectors();
    }
    /**
     * Gets the measured width of the text field after content and style are applied
     * @returns The actual rendered width of the text, or 0 if no text field exists
     */
    GetMeasuredTextWidth() {
        if (!this._textField)
            return 0;
        // Get the local bounds of the text object
        const bounds = this._textField.getLocalBounds();
        return bounds.width;
    }
    /**
     * Gets the measured height of the text field after content and style are applied
     * @returns The actual rendered height of the text, or 0 if no text field exists
     */
    GetMeasuredTextHeight() {
        if (!this._textField)
            return 0;
        // Get the local bounds of the text object
        const bounds = this._textField.getLocalBounds();
        return bounds.height;
    }
    /**
     * Gets both measured dimensions of the text field
     * @returns Object with width and height, or {width: 0, height: 0} if no text field
     */
    GetMeasuredTextDimensions() {
        if (!this._textField)
            return { width: 0, height: 0 };
        const bounds = this._textField.getLocalBounds();
        return {
            width: bounds.width,
            height: bounds.height
        };
    }
    /**
     * Gets the full bounds of the text field including any padding/stroke
     * @returns Bounds object with x, y, width, height or null if no text field
     */
    GetTextBounds() {
        if (!this._textField)
            return null;
        const bounds = this._textField.getLocalBounds();
        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    }
    onTextClick(_event) {
        //console.log("Text clicked:", this.defObj.text);
        if (this._defObj.clickFunction) {
            //console.log("Text clicked: yes call function");
            this._defObj.clickFunction(this);
        }
    }
    onTextHover() {
        if (!this._textField)
            return;
        this._textField.alpha = 0.8;
        this._textField.scale.set(this._textField.scale.x * 1.05, this._textField.scale.y * 1.05);
    }
    onTextHoverOut() {
        if (!this._textField)
            return;
        // Remove hover effect
        this._textField.alpha = 1;
        const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
        const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
        this._textField.scale.set(combinedScaleX, combinedScaleY);
    }
    Update(time, frameCount, onceSecond) {
        var _a, _b, _c;
        if (this.enabled === false)
            return;
        const debug = false;
        if (debug)
            console.log('CanvasTextObj.Update() >');
        if (this.defObj.typewriterEffect && this._typewriterIndex < this._fullText.length) {
            if (debug)
                console.log('CanvasTextObj.Update() >1> typewriter');
            const speed = (_a = this.defObj.typewriterSpeed) !== null && _a !== void 0 ? _a : 10;
            this._typewriterTimer += 16; // Assume 60fps, ~16ms per frame
            const msPerChar = 1000 / speed;
            if (this._typewriterTimer >= msPerChar) {
                this._typewriterIndex++;
                this._typewriterTimer = 0;
                if (this._textField) {
                    this._textField.text = this.getCurrentDisplayText();
                }
            }
        }
        if (this.defObj.fadeInDuration && this._textField) {
            if (debug)
                console.log('CanvasTextObj.Update() >2> fade in effect ');
            const elapsed = Date.now() - this._fadeStartTime;
            const progress = Math.min(elapsed / this.defObj.fadeInDuration, 1);
            this._textField.alpha = progress;
        }
        if (this.defObj.pulseText && this._textField) {
            if (debug)
                console.log('CanvasTextObj.Update() >3> pulse ');
            this._pulseTime += 16;
            const pulseSpeed = (_b = this.defObj.pulseSpeed) !== null && _b !== void 0 ? _b : 1;
            const scale = 1 + Math.sin(this._pulseTime * 0.001 * pulseSpeed) * 0.05;
            const baseScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
            const baseScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
            this._textField.scale.set(baseScaleX * scale, baseScaleY * scale);
        }
        if (this._textField) {
            //if(debug || true) console.log('CanvasTextObj.Update('+frameCount+') >4> has textfield do stuff ');
            // Use render coordinates (automatically handles parent transforms)
            if ((_c = CanvasEngine.get().EngineSettings) === null || _c === void 0 ? void 0 : _c.autoScale) {
                //if(debug) if(onceSecond)
                //console.log('CanvasTextObj.Update('+frameCount+') >5> autoscale - '+this._textField.text);
                let transformedX = this.renderX * CanvasEngine.get().CurrentCanvasScale;
                let transformedY = this.renderY * CanvasEngine.get().CurrentCanvasScale;
                this._textField.x = Math.round(transformedX + this._alignmentOffsetX * CanvasEngine.get().CurrentCanvasScale);
                this._textField.y = Math.round(transformedY + this._alignmentOffsetY * CanvasEngine.get().CurrentCanvasScale);
                //console.log('CanvasTextObj.Update('+frameCount+') >5> autoscale transformedX='+transformedX+' transformedY='+transformedY+'  renderX='+this.renderX+' renderY='+this.renderY);
                //console.log('CanvasTextObj.Update('+frameCount+') >5> autoscale this._textField.x='+this._textField.x+' this._textField.y='+this._textField.y);
                if (!this.defObj.pulseText) {
                    if (debug)
                        console.log('CanvasTextObj.Update(' + frameCount + ') >6>  ');
                    this._textField.scale.set(CanvasEngine.get().CurrentCanvasScale * this.renderXScale, CanvasEngine.get().CurrentCanvasScale * this.renderYScale);
                    //console.log('CanvasTextObj.Update('+frameCount+') >5> autoscale SCaLE : '+this._textField.scale.x+' '+this._textField.scale.y+' renderXScale='+this.renderXScale+' renderYScale='+this.renderYScale);
                }
            }
            else {
                if (debug)
                    console.log('CanvasTextObj.Update(' + frameCount + ') >7>  ');
                this._textField.x = this.renderX + this._alignmentOffsetX;
                this._textField.y = this.renderY + this._alignmentOffsetY;
                if (!this.defObj.pulseText) {
                    //if(debug) console.log('CanvasTextObj.Update('+frameCount+') >8>  ');
                    this._textField.scale.set(this.renderXScale, this.renderYScale);
                }
            }
        }
        super.Update(time, frameCount, onceSecond);
    }
    Dispose() {
        if (this._textField) {
            // Remove event listeners if interactive
            if (this.defObj.interactive) {
                this._textField.off('pointerdown', this.onTextClick, this);
                this._textField.off('pointerover', this.onTextHover, this);
                this._textField.off('pointerout', this.onTextHoverOut, this);
            }
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textField);
            this._textField.destroy();
            this._textField = null;
        }
        super.Dispose();
    }
}
