import { PIXI_LAYER, PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { BaseCanvasObj } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export class CanvasPixiShapeDrawFunctions {
    static DrawRectangle(graphics, def) {
        var _a, _b, _c, _d, _e, _f;
        graphics.rect(0, 0, (_a = def.width) !== null && _a !== void 0 ? _a : 0, (_b = def.height) !== null && _b !== void 0 ? _b : 0);
        graphics.fill({ color: (_c = def.bgColor) !== null && _c !== void 0 ? _c : 0x6cf4f6, alpha: (_d = def.bgAlpha) !== null && _d !== void 0 ? _d : 1 });
        graphics.stroke({ width: (_e = def.borderWidth) !== null && _e !== void 0 ? _e : 6, color: (_f = def.borderColor) !== null && _f !== void 0 ? _f : 0x5b7d62 });
    }
    static DrawCircle(graphics, def) {
        var _a, _b, _c, _d, _e, _f;
        const radius = Math.min((_a = def.width) !== null && _a !== void 0 ? _a : 100, (_b = def.height) !== null && _b !== void 0 ? _b : 100) / 2;
        graphics.circle(radius, radius, radius);
        graphics.fill({ color: (_c = def.bgColor) !== null && _c !== void 0 ? _c : 0xff6b6b, alpha: (_d = def.bgAlpha) !== null && _d !== void 0 ? _d : 1 });
        graphics.stroke({ width: (_e = def.borderWidth) !== null && _e !== void 0 ? _e : 4, color: (_f = def.borderColor) !== null && _f !== void 0 ? _f : 0x4ecdc4 });
    }
    static DrawEllipse(graphics, def) {
        var _a, _b, _c, _d, _e, _f;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        graphics.ellipse(width / 2, height / 2, width / 2, height / 2);
        graphics.fill({ color: (_c = def.bgColor) !== null && _c !== void 0 ? _c : 0x95e77e, alpha: (_d = def.bgAlpha) !== null && _d !== void 0 ? _d : 1 });
        graphics.stroke({ width: (_e = def.borderWidth) !== null && _e !== void 0 ? _e : 3, color: (_f = def.borderColor) !== null && _f !== void 0 ? _f : 0x2d6a4f });
    }
    static DrawRoundedRect(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g;
        const cornerRadius = (_a = def.cornerRadius) !== null && _a !== void 0 ? _a : 15;
        graphics.roundRect(0, 0, (_b = def.width) !== null && _b !== void 0 ? _b : 100, (_c = def.height) !== null && _c !== void 0 ? _c : 100, cornerRadius);
        graphics.fill({ color: (_d = def.bgColor) !== null && _d !== void 0 ? _d : 0x7209b7, alpha: (_e = def.bgAlpha) !== null && _e !== void 0 ? _e : 1 });
        graphics.stroke({ width: (_f = def.borderWidth) !== null && _f !== void 0 ? _f : 4, color: (_g = def.borderColor) !== null && _g !== void 0 ? _g : 0xf72585 });
    }
    static DrawStar(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const points = (_a = def.starPoints) !== null && _a !== void 0 ? _a : 5;
        const outerRadius = Math.min((_b = def.width) !== null && _b !== void 0 ? _b : 100, (_c = def.height) !== null && _c !== void 0 ? _c : 100) / 2;
        const innerRadius = outerRadius * ((_d = def.starInnerRadiusRatio) !== null && _d !== void 0 ? _d : 0.5);
        const cx = ((_e = def.width) !== null && _e !== void 0 ? _e : 100) / 2;
        const cy = ((_f = def.height) !== null && _f !== void 0 ? _f : 100) / 2;
        graphics.star(cx, cy, points, outerRadius, innerRadius);
        graphics.fill({ color: (_g = def.bgColor) !== null && _g !== void 0 ? _g : 0xffd60a, alpha: (_h = def.bgAlpha) !== null && _h !== void 0 ? _h : 1 });
        graphics.stroke({ width: (_j = def.borderWidth) !== null && _j !== void 0 ? _j : 3, color: (_k = def.borderColor) !== null && _k !== void 0 ? _k : 0x003566 });
    }
    static DrawPolygon(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const sides = (_a = def.polygonSides) !== null && _a !== void 0 ? _a : 6;
        const radius = Math.min((_b = def.width) !== null && _b !== void 0 ? _b : 100, (_c = def.height) !== null && _c !== void 0 ? _c : 100) / 2;
        const cx = ((_d = def.width) !== null && _d !== void 0 ? _d : 100) / 2;
        const cy = ((_e = def.height) !== null && _e !== void 0 ? _e : 100) / 2;
        graphics.regularPoly(cx, cy, radius, sides);
        graphics.fill({ color: (_f = def.bgColor) !== null && _f !== void 0 ? _f : 0x06ffa5, alpha: (_g = def.bgAlpha) !== null && _g !== void 0 ? _g : 1 });
        graphics.stroke({ width: (_h = def.borderWidth) !== null && _h !== void 0 ? _h : 4, color: (_j = def.borderColor) !== null && _j !== void 0 ? _j : 0x7b2cbf });
    }
    static DrawTriangle(graphics, def) {
        var _a, _b, _c, _d, _e, _f;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        graphics.poly([
            width / 2, 0,
            0, height,
            width, height // bottom right
        ]);
        graphics.fill({ color: (_c = def.bgColor) !== null && _c !== void 0 ? _c : 0xff006e, alpha: (_d = def.bgAlpha) !== null && _d !== void 0 ? _d : 1 });
        graphics.stroke({ width: (_e = def.borderWidth) !== null && _e !== void 0 ? _e : 3, color: (_f = def.borderColor) !== null && _f !== void 0 ? _f : 0x8338ec });
    }
    static DrawHeart(graphics, def) {
        var _a, _b, _c, _d, _e, _f;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        const scale = Math.min(width, height) / 100;
        // Heart shape using bezier curves
        graphics.moveTo(50 * scale, 25 * scale);
        graphics.bezierCurveTo(50 * scale, 12.5 * scale, 35 * scale, 0, 20 * scale, 0);
        graphics.bezierCurveTo(0, 0, 0, 17.5 * scale, 0, 17.5 * scale);
        graphics.bezierCurveTo(0, 31.25 * scale, 20 * scale, 56.25 * scale, 50 * scale, 87.5 * scale);
        graphics.bezierCurveTo(80 * scale, 56.25 * scale, 100 * scale, 31.25 * scale, 100 * scale, 17.5 * scale);
        graphics.bezierCurveTo(100 * scale, 17.5 * scale, 100 * scale, 0, 80 * scale, 0);
        graphics.bezierCurveTo(65 * scale, 0, 50 * scale, 12.5 * scale, 50 * scale, 25 * scale);
        graphics.fill({ color: (_c = def.bgColor) !== null && _c !== void 0 ? _c : 0xe63946, alpha: (_d = def.bgAlpha) !== null && _d !== void 0 ? _d : 1 });
        graphics.stroke({ width: (_e = def.borderWidth) !== null && _e !== void 0 ? _e : 3, color: (_f = def.borderColor) !== null && _f !== void 0 ? _f : 0x2d3436 });
    }
    static DrawArrow(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        const arrowHeadSize = (_c = def.arrowHeadSize) !== null && _c !== void 0 ? _c : 0.3; // percentage of width
        // Arrow shaft
        graphics.rect(0, height * 0.35, width * (1 - arrowHeadSize), height * 0.3);
        // Arrow head (triangle)
        graphics.poly([
            width * (1 - arrowHeadSize), height * 0.2,
            width, height * 0.5,
            width * (1 - arrowHeadSize), height * 0.8
        ]);
        graphics.fill({ color: (_d = def.bgColor) !== null && _d !== void 0 ? _d : 0x00b4d8, alpha: (_e = def.bgAlpha) !== null && _e !== void 0 ? _e : 1 });
        graphics.stroke({ width: (_f = def.borderWidth) !== null && _f !== void 0 ? _f : 3, color: (_g = def.borderColor) !== null && _g !== void 0 ? _g : 0x03045e });
    }
    static DrawCross(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        const thickness = (_c = def.crossThickness) !== null && _c !== void 0 ? _c : 0.3;
        // Vertical bar
        graphics.rect(width * (0.5 - thickness / 2), 0, width * thickness, height);
        // Horizontal bar
        graphics.rect(0, height * (0.5 - thickness / 2), width, height * thickness);
        graphics.fill({ color: (_d = def.bgColor) !== null && _d !== void 0 ? _d : 0xf4a261, alpha: (_e = def.bgAlpha) !== null && _e !== void 0 ? _e : 1 });
        graphics.stroke({ width: (_f = def.borderWidth) !== null && _f !== void 0 ? _f : 2, color: (_g = def.borderColor) !== null && _g !== void 0 ? _g : 0x264653 });
    }
    static DrawGradientRect(graphics, def) {
        var _a, _b, _c, _d, _e, _f;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        const gradientFrom = (_c = def.gradientFrom) !== null && _c !== void 0 ? _c : 0xff0080;
        const gradientTo = (_d = def.gradientTo) !== null && _d !== void 0 ? _d : 0x7928ca;
        // Create gradient fill
        const fill = new PIXI.FillGradient(0, 0, width, 0);
        fill.addColorStop(0, gradientFrom);
        fill.addColorStop(1, gradientTo);
        graphics.rect(0, 0, width, height);
        graphics.fill(fill);
        graphics.stroke({ width: (_e = def.borderWidth) !== null && _e !== void 0 ? _e : 3, color: (_f = def.borderColor) !== null && _f !== void 0 ? _f : 0xffffff });
    }
    static DrawBurst(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const spikes = (_a = def.burstSpikes) !== null && _a !== void 0 ? _a : 8;
        const outerRadius = Math.min((_b = def.width) !== null && _b !== void 0 ? _b : 100, (_c = def.height) !== null && _c !== void 0 ? _c : 100) / 2;
        const innerRadius = outerRadius * ((_d = def.burstInnerRadiusRatio) !== null && _d !== void 0 ? _d : 0.5);
        const cx = ((_e = def.width) !== null && _e !== void 0 ? _e : 100) / 2;
        const cy = ((_f = def.height) !== null && _f !== void 0 ? _f : 100) / 2;
        const points = [];
        const step = (Math.PI * 2) / spikes;
        for (let i = 0; i < spikes; i++) {
            // Outer point
            let angle = i * step - Math.PI / 2;
            points.push(cx + Math.cos(angle) * outerRadius);
            points.push(cy + Math.sin(angle) * outerRadius);
            // Inner point
            angle += step / 2;
            points.push(cx + Math.cos(angle) * innerRadius);
            points.push(cy + Math.sin(angle) * innerRadius);
        }
        graphics.poly(points);
        graphics.fill({ color: (_g = def.bgColor) !== null && _g !== void 0 ? _g : 0xffbe0b, alpha: (_h = def.bgAlpha) !== null && _h !== void 0 ? _h : 1 });
        graphics.stroke({ width: (_j = def.borderWidth) !== null && _j !== void 0 ? _j : 3, color: (_k = def.borderColor) !== null && _k !== void 0 ? _k : 0xfb5607 });
    }
    static DrawDiamond(graphics, def) {
        var _a, _b, _c, _d, _e, _f;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        graphics.poly([
            width / 2, 0,
            width, height / 2,
            width / 2, height,
            0, height / 2 // left
        ]);
        graphics.fill({ color: (_c = def.bgColor) !== null && _c !== void 0 ? _c : 0x00f5ff, alpha: (_d = def.bgAlpha) !== null && _d !== void 0 ? _d : 1 });
        graphics.stroke({ width: (_e = def.borderWidth) !== null && _e !== void 0 ? _e : 4, color: (_f = def.borderColor) !== null && _f !== void 0 ? _f : 0x8b008b });
    }
    static DrawSpeechBubble(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : 100;
        const height = (_b = def.height) !== null && _b !== void 0 ? _b : 100;
        const tailSize = (_c = def.tailSize) !== null && _c !== void 0 ? _c : 20;
        const cornerRadius = (_d = def.cornerRadius) !== null && _d !== void 0 ? _d : 10;
        // Main bubble
        graphics.roundRect(0, 0, width, height * 0.8, cornerRadius);
        // Tail
        graphics.poly([
            width * 0.3, height * 0.8,
            width * 0.4, height * 0.8,
            width * 0.35, height
        ]);
        graphics.fill({ color: (_e = def.bgColor) !== null && _e !== void 0 ? _e : 0xffffff, alpha: (_f = def.bgAlpha) !== null && _f !== void 0 ? _f : 1 });
        graphics.stroke({ width: (_g = def.borderWidth) !== null && _g !== void 0 ? _g : 2, color: (_h = def.borderColor) !== null && _h !== void 0 ? _h : 0x000000 });
    }
    static DrawGear(graphics, def) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const teeth = (_a = def.gearTeeth) !== null && _a !== void 0 ? _a : 8;
        const outerRadius = Math.min((_b = def.width) !== null && _b !== void 0 ? _b : 100, (_c = def.height) !== null && _c !== void 0 ? _c : 100) / 2;
        const innerRadius = outerRadius * 0.6;
        const toothHeight = outerRadius * 0.3;
        const cx = ((_d = def.width) !== null && _d !== void 0 ? _d : 100) / 2;
        const cy = ((_e = def.height) !== null && _e !== void 0 ? _e : 100) / 2;
        const points = [];
        const step = (Math.PI * 2) / (teeth * 2);
        for (let i = 0; i < teeth * 2; i++) {
            const angle = i * step;
            const radius = i % 2 === 0 ? outerRadius : outerRadius - toothHeight;
            points.push(cx + Math.cos(angle) * radius);
            points.push(cy + Math.sin(angle) * radius);
        }
        graphics.poly(points);
        graphics.fill({ color: (_f = def.bgColor) !== null && _f !== void 0 ? _f : 0x6c757d, alpha: (_g = def.bgAlpha) !== null && _g !== void 0 ? _g : 1 });
        graphics.stroke({ width: (_h = def.borderWidth) !== null && _h !== void 0 ? _h : 2, color: (_j = def.borderColor) !== null && _j !== void 0 ? _j : 0x343a40 });
        // Center hole
        graphics.circle(cx, cy, innerRadius * 0.5);
        graphics.cut();
    }
    static DrawRandomShape(graphics, def) {
        const shapes = [
            CanvasPixiShapeDrawFunctions.DrawCircle,
            CanvasPixiShapeDrawFunctions.DrawStar,
            CanvasPixiShapeDrawFunctions.DrawPolygon,
            CanvasPixiShapeDrawFunctions.DrawHeart,
            CanvasPixiShapeDrawFunctions.DrawDiamond,
            CanvasPixiShapeDrawFunctions.DrawBurst
        ];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        randomShape(graphics, def);
    }
}
export class CanvasPixiShapeObj extends BaseCanvasObj {
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
        // Use render coordinates for initial positioning (handles parenting automatically)
        this._graphics.x = this.renderX;
        this._graphics.y = this.renderY;
        this._graphics.scale.set(this.renderXScale, this.renderYScale);
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
            console.log('%c CanvasPixiShapeOBJ.DrawVectors3', 'color:#ee661c; font-weight:bold;');
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
        // Use render coordinates (automatically handles parent transforms)
        if (((_a = CanvasEngine.get().EngineSettings) === null || _a === void 0 ? void 0 : _a.autoScale) && (this._graphics || (this._debug && this._debugGraphics))) {
            transformedX = this.renderX * CanvasEngine.get().CurrentCanvasScale;
            transformedY = this.renderY * CanvasEngine.get().CurrentCanvasScale;
            xScale = CanvasEngine.get().CurrentCanvasScale * this.renderXScale;
            yScale = CanvasEngine.get().CurrentCanvasScale * this.renderYScale;
        }
        else {
            transformedX = this.renderX;
            transformedY = this.renderY;
            xScale = this.renderXScale;
            yScale = this.renderYScale;
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
        console.log("🖱️ PixiShapeObject clicked!", this.label);
        if (this._defObj.clickFunction) {
            console.log("PixiShapeObject: yes call function");
            this._defObj.clickFunction(this);
        }
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
