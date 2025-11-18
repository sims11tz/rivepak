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
        //public get CanvasContainer() { return this._canvasContainer!; }
        this._initialized = false;
    }
    static get() { if (PixiController.myInstance == null) {
        PixiController.myInstance = new PixiController();
    } return this.myInstance; }
    get PixiAbove() { return this._pixiInstanceAbove; }
    get PixiBelow() { return this._pixiInstanceBelow; }
    GetPixiInstance(layer = PIXI_LAYER.ABOVE) {
        if (layer === PIXI_LAYER.ABOVE || layer == undefined)
            return this.PixiAbove;
        if (layer === PIXI_LAYER.BELOW)
            return this.PixiBelow;
        return this.PixiAbove;
    }
    Init(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pixiInstanceAbove)
                this.Dispose();
            this._canvasContainer = document.getElementById('pixiCanvasContainer');
            let oldCanvasAbove = document.getElementById('pixiCanvasAbove');
            if (oldCanvasAbove)
                oldCanvasAbove.remove();
            let oldCanvasBelow = document.getElementById('pixiCanvasBelow');
            if (oldCanvasBelow)
                oldCanvasBelow.remove();
            this._CanvasAbove = document.createElement('canvas');
            this._CanvasAbove.id = 'pixiCanvasAbove';
            this._CanvasAbove.style.position = 'absolute';
            this._CanvasAbove.style.border = '0';
            this._CanvasAbove.style.top = '0';
            this._CanvasAbove.style.left = '0';
            this._CanvasAbove.style.zIndex = '3';
            //this._CanvasAbove.width = width || 800;
            //this._CanvasAbove.height = height || 500;
            this._canvasContainer.appendChild(this._CanvasAbove);
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            this._pixiInstanceAbove = new PIXI.Application();
            yield this._pixiInstanceAbove.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: this._CanvasAbove,
                antialias: true,
                resolution: dpr,
                autoDensity: true,
                powerPreference: 'high-performance',
            });
            this._pixiInstanceAbove.ticker.autoStart = false;
            this._pixiInstanceAbove.ticker.stop();
            this._pixiInstanceAbove.stage.eventMode = 'static';
            this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
            // Enable sortableChildren so zIndex works
            this._pixiInstanceAbove.stage.sortableChildren = true;
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
            this._CanvasBelow = document.createElement('canvas');
            this._CanvasBelow.id = 'pixiCanvasBelow';
            this._CanvasBelow.style.position = 'absolute';
            this._CanvasBelow.style.top = '0';
            this._CanvasBelow.style.left = '0';
            this._CanvasBelow.style.zIndex = '1';
            //this._CanvasBelow.width = width || 800;
            //this._CanvasBelow.height = height || 500;
            this._canvasContainer.appendChild(this._CanvasBelow);
            this._pixiInstanceBelow = new PIXI.Application();
            yield this._pixiInstanceBelow.init({
                width: width || 800,
                height: height || 500,
                backgroundAlpha: 0,
                canvas: this._CanvasBelow,
                antialias: true,
                resolution: dpr,
                autoDensity: true,
                powerPreference: 'high-performance',
            });
            this._pixiInstanceBelow.ticker.autoStart = false;
            this._pixiInstanceBelow.ticker.stop();
            this._pixiInstanceBelow.stage.eventMode = 'static';
            // Enable sortableChildren so zIndex works
            this._pixiInstanceBelow.stage.sortableChildren = true;
            this._initialized = true;
        });
    }
    Update(time, frameCount, onceSecond, onceMinute) {
        if (!this._initialized)
            return;
        if (this._pixiInstanceAbove && this._pixiInstanceAbove.render) {
            this._pixiInstanceAbove.render();
        }
        if (this._pixiInstanceBelow && this._pixiInstanceBelow.render) {
            this._pixiInstanceBelow.render();
        }
    }
    SetSize(width, height, dprIn = -1) {
        if (!this._initialized)
            return;
        const dpr = dprIn > 0 ? dprIn : Math.max(1, window.devicePixelRatio || 1);
        this._canvasContainer && (this._canvasContainer.style.width = `${width}px`);
        this._canvasContainer && (this._canvasContainer.style.height = `${height}px`);
        //console.log('%c PixiController SetSize -- width:'+width+', height:'+height,'color:#00FF88; font-weight:bold;');
        if (this._pixiInstanceAbove) {
            this._pixiInstanceAbove.renderer.resolution = dpr;
            this._pixiInstanceAbove.renderer.resize(width, height);
            this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
        }
        if (this._pixiInstanceBelow) {
            this._pixiInstanceBelow.renderer.resolution = dpr;
            this._pixiInstanceBelow.renderer.resize(width, height);
        }
    }
    Dispose() {
        try {
            this._initialized = false;
            if (this._pixiInstanceAbove) {
                try {
                    // Remove event listeners BEFORE destroying to prevent memory leaks
                    this._pixiInstanceAbove.stage.off('pointermove');
                    this._pixiInstanceAbove.stage.off('pointerdown');
                    this._pixiInstanceAbove.stage.off('pointerup');
                    this._pixiInstanceAbove.stage.removeAllListeners();
                    // Stop ticker
                    this._pixiInstanceAbove.ticker.stop();
                    // Remove all children from stage
                    this._pixiInstanceAbove.stage.removeChildren();
                    this._pixiInstanceAbove.stage.interactive = false;
                    // CRITICAL: Destroy the application (includes renderer destruction)
                    // The destroy() method handles renderer cleanup internally
                    this._pixiInstanceAbove.destroy(true, {
                        children: true,
                        texture: true,
                        textureSource: true,
                    });
                }
                catch (error) {
                    console.warn("PixiController - Failed to destroy Above Pixi application:", error);
                }
                this._pixiInstanceAbove = null;
            }
            if (this._pixiInstanceBelow) {
                try {
                    // Remove any listeners if added in future
                    this._pixiInstanceBelow.stage.removeAllListeners();
                    // Stop ticker
                    this._pixiInstanceBelow.ticker.stop();
                    // Remove all children from stage
                    this._pixiInstanceBelow.stage.removeChildren();
                    this._pixiInstanceBelow.stage.interactive = false;
                    // CRITICAL: Destroy the application (includes renderer destruction)
                    // The destroy() method handles renderer cleanup internally
                    this._pixiInstanceBelow.destroy(true, {
                        children: true,
                        texture: true,
                        textureSource: true,
                    });
                }
                catch (error) {
                    console.warn("PixiController - Failed to destroy Below Pixi application:", error);
                }
                this._pixiInstanceBelow = null;
            }
            // Clear canvas references
            this._CanvasAbove = null;
            this._CanvasBelow = null;
            this._canvasContainer = null;
        }
        catch (error) {
            console.error("PixiController - Error cleaning up Pixi Renderer:", error);
        }
    }
    Debug(opts) {
        const { layer = "BOTH", maxDepth = 6, includeBounds = true, includeWorldTransform = true, includeEventMode = true, includeHitArea = false, includeVisibility = true, includeZIndex = true, includeTextureInfo = true, filter, } = opts !== null && opts !== void 0 ? opts : {};
        const dumpApp = (app, tag) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
            if (!app) {
                console.warn(`[Pixi.Debug] No app for ${tag}`);
                return;
            }
            const r = app.renderer;
            const cssW = (_d = (_b = (_a = app.canvas) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : (_c = app.view) === null || _c === void 0 ? void 0 : _c.width) !== null && _d !== void 0 ? _d : 0; // v8: canvas (view is deprecated)
            const cssH = (_h = (_f = (_e = app.canvas) === null || _e === void 0 ? void 0 : _e.height) !== null && _f !== void 0 ? _f : (_g = app.view) === null || _g === void 0 ? void 0 : _g.height) !== null && _h !== void 0 ? _h : 0;
            const info = {
                tag,
                view: { cssW, cssH },
                canvas: { pxW: (_k = (_j = app.canvas) === null || _j === void 0 ? void 0 : _j.width) !== null && _k !== void 0 ? _k : 0, pxH: (_m = (_l = app.canvas) === null || _l === void 0 ? void 0 : _l.height) !== null && _m !== void 0 ? _m : 0 },
                resolution: (_o = r.resolution) !== null && _o !== void 0 ? _o : (window.devicePixelRatio || 1),
                type: ((_p = r.context) === null || _p === void 0 ? void 0 : _p.webGLVersion) ? `WebGL${r.context.webGLVersion}` : "Canvas",
                autoDensity: (_r = (_q = r.options) === null || _q === void 0 ? void 0 : _q.autoDensity) !== null && _r !== void 0 ? _r : r.autoDensity,
                stageChildren: (_u = (_t = (_s = app.stage) === null || _s === void 0 ? void 0 : _s.children) === null || _t === void 0 ? void 0 : _t.length) !== null && _u !== void 0 ? _u : 0,
            };
            console.groupCollapsed(`%c[Pixi.Debug] ${tag} — ${info.type} @${info.resolution} ` +
                `(css ${info.view.cssW}×${info.view.cssH}, canvas ${info.canvas.pxW}×${info.canvas.pxH}) — children:${info.stageChildren}`, "color:#00E0A4;font-weight:600;");
            console.log("Renderer:", info);
            const seen = new WeakSet();
            const typeOf = (d) => {
                var _a, _b;
                if (PIXI.Text && d instanceof PIXI.Text)
                    return "Text";
                if (PIXI.Sprite && d instanceof PIXI.Sprite)
                    return "Sprite";
                if (PIXI.Graphics && d instanceof PIXI.Graphics)
                    return "Graphics";
                if (PIXI.Container && d instanceof PIXI.Container)
                    return "Container";
                return (_b = (_a = d.constructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "DisplayObject";
            };
            const texInfo = (d) => {
                var _a, _b, _c, _d;
                try {
                    if (d.texture && d.texture.baseTexture) {
                        const bt = d.texture.baseTexture;
                        const src = (bt.resource && (bt.resource.url || bt.resource.src)) ||
                            ((_b = (_a = bt.resource) === null || _a === void 0 ? void 0 : _a.orig) === null || _b === void 0 ? void 0 : _b.src) ||
                            ((_d = (_c = bt.resource) === null || _c === void 0 ? void 0 : _c.image) === null || _d === void 0 ? void 0 : _d.currentSrc) ||
                            undefined;
                        return {
                            texW: d.texture.width, texH: d.texture.height,
                            baseW: bt.width, baseH: bt.height,
                            src,
                        };
                    }
                }
                catch (_e) { }
                return undefined;
            };
            const hitInfo = (d) => {
                var _a, _b;
                if (!includeHitArea)
                    return undefined;
                try {
                    const ha = d.hitArea;
                    if (!ha)
                        return undefined;
                    const ctor = (_b = (_a = ha === null || ha === void 0 ? void 0 : ha.constructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "HitArea";
                    const parts = [ctor];
                    if ("x" in ha && "y" in ha)
                        parts.push(`x=${ha.x},y=${ha.y}`);
                    if ("width" in ha && "height" in ha)
                        parts.push(`w=${ha.width},h=${ha.height}`);
                    if ("radius" in ha)
                        parts.push(`r=${ha.radius}`);
                    return parts.join(" ");
                }
                catch (_c) {
                    return undefined;
                }
            };
            const boundsInfo = (d) => {
                if (!includeBounds)
                    return undefined;
                try {
                    const b = d.getBounds(true);
                    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
                }
                catch (_a) {
                    return undefined;
                }
            };
            const wtInfo = (d) => {
                if (!includeWorldTransform)
                    return undefined;
                try {
                    const wt = d.worldTransform;
                    if (!wt)
                        return undefined;
                    const { a, b, c, d: matrixD, tx, ty } = wt;
                    return { a: +a.toFixed(3), b: +b.toFixed(3), c: +c.toFixed(3), d: +matrixD.toFixed(3), tx: +tx.toFixed(1), ty: +ty.toFixed(1) };
                }
                catch (_a) {
                    return undefined;
                }
            };
            const line = (prefix, d) => {
                var _a;
                const t = typeOf(d);
                const parts = [];
                // v8: use label (not name)
                const label = (_a = d.label) !== null && _a !== void 0 ? _a : "";
                parts.push(`${prefix}${t}${label ? `("${label}")` : ""}`);
                if (includeVisibility)
                    parts.push(`vis=${d.visible !== false}`);
                if (includeZIndex && d.zIndex != null)
                    parts.push(`z=${d.zIndex}`);
                if (d.alpha != null && d.alpha !== 1)
                    parts.push(`alpha=${d.alpha}`);
                if (d.renderable === false)
                    parts.push(`renderable=false`);
                if (includeEventMode && d.eventMode)
                    parts.push(`evt=${d.eventMode}`);
                if (d.width != null && d.height != null) {
                    parts.push(`w×h=${Math.round(d.width)}×${Math.round(d.height)}`);
                }
                const b = boundsInfo(d);
                if (b)
                    parts.push(`bounds=[${b.x},${b.y},${b.w},${b.h}]`);
                const wt = wtInfo(d);
                if (wt)
                    parts.push(`WT=[a:${wt.a},b:${wt.b},c:${wt.c},d:${wt.d},tx:${wt.tx},ty:${wt.ty}]`);
                const hi = hitInfo(d);
                if (hi)
                    parts.push(`hit:${hi}`);
                const ti = includeTextureInfo ? texInfo(d) : undefined;
                if (ti)
                    parts.push(`tex=${ti.texW}×${ti.texH} base=${ti.baseW}×${ti.baseH}${ti.src ? ` src:${ti.src}` : ""}`);
                return parts.join("  •  ");
            };
            const traverse = (node, depth, prefix) => {
                if (!node || seen.has(node) || depth > maxDepth)
                    return;
                seen.add(node);
                if (!filter || filter(node)) {
                    const kids = Array.isArray(node.children) ? node.children : [];
                    const hasKids = kids.length > 0;
                    if (hasKids) {
                        console.groupCollapsed(`%c${line(prefix, node)}  •  children:${kids.length}`, "color:#9EE8FF");
                        for (let i = 0; i < kids.length; i++) {
                            traverse(kids[i], depth + 1, prefix + (depth === 0 ? "" : "  "));
                        }
                        console.groupEnd();
                    }
                    else {
                        // don’t collapse leaves; easier to see lone nodes
                        console.log(`%c${line(prefix, node)}  •  children:0`, "color:#9EE8FF");
                    }
                }
            };
            traverse(app.stage, 0, "");
            // extra explicit heads-up when there are no children
            if (info.stageChildren === 0) {
                console.warn(`[Pixi.Debug] ${tag} stage has 0 children. Are you adding to this layer’s stage?`);
            }
            console.groupEnd();
        };
        try {
            if (layer === "BOTH") {
                if (this._pixiInstanceBelow)
                    dumpApp(this._pixiInstanceBelow, "BELOW");
                if (this._pixiInstanceAbove)
                    dumpApp(this._pixiInstanceAbove, "ABOVE");
            }
            else {
                dumpApp(this.GetPixiInstance(layer), layer);
            }
        }
        catch (e) {
            console.warn("[Pixi.Debug] error:", e);
        }
    }
}
