import * as PIXI from "pixi.js";
import { CanvasObjectDef } from "../canvasObjects/_baseCanvasObj";
import { RiveController } from "./RiveController";

export enum PIXI_OBJECT_TYPE
{
	GRAPHICS = "GRAPHICS",
	TEXTURE = "TEXTURE",
}

export enum PIXI_LAYER
{
	ABOVE = "ABOVE",
	BELOW = "BELOW",
}

export interface PixiObjectDef extends CanvasObjectDef
{
	type: PIXI_OBJECT_TYPE;
}

export class PixiController
{
	static myInstance: PixiController; static get() { if (PixiController.myInstance == null) { PixiController.myInstance = new PixiController(); } return this.myInstance; }

	private _pixiInstanceAbove: PIXI.Application | null = null;
	public get PixiAbove() { return this._pixiInstanceAbove!; }

	private _pixiInstanceBelow: PIXI.Application | null = null;
	public get PixiBelow() { return this._pixiInstanceBelow!; }

	public GetPixiInstance(layer:PIXI_LAYER = PIXI_LAYER.ABOVE):PIXI.Application
	{
		if (layer === PIXI_LAYER.ABOVE || layer == undefined) return this.PixiAbove;
		if (layer === PIXI_LAYER.BELOW) return this.PixiBelow;
		return this.PixiAbove;
	}

	private _CanvasAbove: HTMLCanvasElement | null = null;
	private _CanvasBelow: HTMLCanvasElement | null = null;
	//public get Canvas() { return this._canvas!; }

	private _canvasContainer: HTMLDivElement | null = null;
	//public get CanvasContainer() { return this._canvasContainer!; }

	private _initialized: boolean = false;
	public async Init(width?:number, height?:number)
	{
		if (this._pixiInstanceAbove) this.Dispose();

		this._canvasContainer = document.getElementById('pixiCanvasContainer') as HTMLDivElement;

		let oldCanvasAbove = document.getElementById('pixiCanvasAbove');
		if (oldCanvasAbove) oldCanvasAbove.remove();

		let oldCanvasBelow = document.getElementById('pixiCanvasBelow');
		if (oldCanvasBelow) oldCanvasBelow.remove();

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
		await this._pixiInstanceAbove.init({
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
		this._pixiInstanceAbove.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) =>
		{
			const canvasBounds = this._CanvasAbove!.getBoundingClientRect();
			const x = e.clientX - canvasBounds.left;
			const y = e.clientY - canvasBounds.top;
			RiveController.get().SetMousePos(x, y);
		});
		this._pixiInstanceAbove.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) =>
		{
			RiveController.get().SetMouseDown(true);
		});
		this._pixiInstanceAbove.stage.on('pointerup', (e: PIXI.FederatedPointerEvent) =>
		{
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
		await this._pixiInstanceBelow.init({
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
	}

	public Update(time:number, frameCount:number, onceSecond:boolean, onceMinute:boolean): void
	{
		if(!this._initialized) return;

		if(this._pixiInstanceAbove && this._pixiInstanceAbove.render)
		{
			this._pixiInstanceAbove.render();
		}

		if(this._pixiInstanceBelow && this._pixiInstanceBelow.render)
		{
			this._pixiInstanceBelow.render();
		}
	}

	public SetSize(width: number, height: number, dprIn = -1)
	{
		if (!this._initialized) return;
		const dpr = dprIn > 0 ? dprIn : Math.max(1, window.devicePixelRatio || 1);

		this._canvasContainer && (this._canvasContainer.style.width = `${width}px`);
		this._canvasContainer && (this._canvasContainer.style.height = `${height}px`);

		console.log('%c PixiController SetSize -- width:'+width+', height:'+height,'color:#00FF88; font-weight:bold;');

		if(this._pixiInstanceAbove)
		{
			(this._pixiInstanceAbove.renderer as any).resolution = dpr;
			this._pixiInstanceAbove.renderer.resize(width, height);
			this._pixiInstanceAbove.stage.hitArea = this._pixiInstanceAbove.renderer.screen;
		}

		if(this._pixiInstanceBelow)
		{
			(this._pixiInstanceBelow.renderer as any).resolution = dpr;
			this._pixiInstanceBelow.renderer.resize(width, height);
		}
	}


	public Dispose()
	{
		try
		{
			this._initialized = false;

			if (this._pixiInstanceAbove)
			{
				try
				{
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
				catch (error)
				{
					console.warn("PixiController - Failed to destroy Above Pixi application:", error);
				}

				this._pixiInstanceAbove = null;
			}

			if (this._pixiInstanceBelow)
			{
				try
				{
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
				catch (error)
				{
					console.warn("PixiController - Failed to destroy Below Pixi application:", error);
				}

				this._pixiInstanceBelow = null;
			}

			// Clear canvas references
			this._CanvasAbove = null;
			this._CanvasBelow = null;
			this._canvasContainer = null;

		}
		catch (error)
		{
			console.error("PixiController - Error cleaning up Pixi Renderer:", error);
		}
	}

	public Debug(opts?:
	{
		layer?:PIXI_LAYER | "BOTH";
		maxDepth?:number;
		includeBounds?:boolean;
		includeWorldTransform?:boolean;
		includeEventMode?:boolean;
		includeHitArea?:boolean;
		includeVisibility?:boolean;
		includeZIndex?:boolean;
		includeTextureInfo?:boolean;
		filter?: (d: any) => boolean;
	})
	{
		const {
			layer = "BOTH",
			maxDepth = 6,
			includeBounds = true,
			includeWorldTransform = true,
			includeEventMode = true,
			includeHitArea = false,
			includeVisibility = true,
			includeZIndex = true,
			includeTextureInfo = true,
			filter,
		} = opts ?? {};

		const dumpApp = (app: PIXI.Application, tag: string) =>
		{
			if (!app) { console.warn(`[Pixi.Debug] No app for ${tag}`); return; }

			const r = app.renderer;
			const cssW = app.canvas?.width ?? app.view?.width ?? 0;   // v8: canvas (view is deprecated)
			const cssH = app.canvas?.height ?? app.view?.height ?? 0;

			const info = {
			tag,
			view: { cssW, cssH },
			canvas: { pxW: app.canvas?.width ?? 0, pxH: app.canvas?.height ?? 0 },
			resolution: (r as any).resolution ?? (window.devicePixelRatio || 1),
			type: (r as any).context?.webGLVersion ? `WebGL${(r as any).context.webGLVersion}` : "Canvas",
			autoDensity: (r as any).options?.autoDensity ?? (r as any).autoDensity,
			stageChildren: (app.stage as any)?.children?.length ?? 0,
			};

			console.groupCollapsed(
			`%c[Pixi.Debug] ${tag} — ${info.type} @${info.resolution} ` +
			`(css ${info.view.cssW}×${info.view.cssH}, canvas ${info.canvas.pxW}×${info.canvas.pxH}) — children:${info.stageChildren}`,
			"color:#00E0A4;font-weight:600;",
			);
			console.log("Renderer:", info);

			const seen = new WeakSet<any>();

			const typeOf = (d: any) => {
			if ((PIXI as any).Text && d instanceof (PIXI as any).Text) return "Text";
			if ((PIXI as any).Sprite && d instanceof (PIXI as any).Sprite) return "Sprite";
			if ((PIXI as any).Graphics && d instanceof (PIXI as any).Graphics) return "Graphics";
			if ((PIXI as any).Container && d instanceof (PIXI as any).Container) return "Container";
			return d.constructor?.name ?? "DisplayObject";
			};

			const texInfo = (d: any) =>
			{
				try {
					if (d.texture && d.texture.baseTexture) {
					const bt = d.texture.baseTexture;
					const src =
						(bt.resource && (bt.resource.url || bt.resource.src)) ||
						(bt.resource?.orig?.src) ||
						(bt.resource?.image?.currentSrc) ||
						undefined;
					return {
						texW: d.texture.width, texH: d.texture.height,
						baseW: bt.width, baseH: bt.height,
						src,
					};
					}
				} catch {}
				return undefined;
			};

			const hitInfo = (d: any) =>
			{
				if (!includeHitArea) return undefined;
				try
				{
					const ha = d.hitArea;
					if (!ha) return undefined;
					const ctor = ha?.constructor?.name ?? "HitArea";
					const parts: string[] = [ctor];
					if ("x" in ha && "y" in ha) parts.push(`x=${(ha as any).x},y=${(ha as any).y}`);
					if ("width" in ha && "height" in ha) parts.push(`w=${(ha as any).width},h=${(ha as any).height}`);
					if ("radius" in ha) parts.push(`r=${(ha as any).radius}`);
					return parts.join(" ");
				} catch { return undefined; }
			};

			const boundsInfo = (d: any) => {
			if (!includeBounds) return undefined;
				try
				{
					const b = d.getBounds(true);
					return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
				} catch { return undefined; }
			};

			const wtInfo = (d: any) => {
				if (!includeWorldTransform) return undefined;
				try
				{
					const wt = (d as any).worldTransform;
					if (!wt) return undefined;
					const { a, b, c, d: matrixD, tx, ty } = wt;
					return { a:+a.toFixed(3), b:+b.toFixed(3), c:+c.toFixed(3), d:+matrixD.toFixed(3), tx:+tx.toFixed(1), ty:+ty.toFixed(1) };
				} catch { return undefined; }
			};

			const line = (prefix: string, d: any) =>
			{
				const t = typeOf(d);
				const parts: string[] = [];
				// v8: use label (not name)
				const label = (d as any).label ?? "";
				parts.push(`${prefix}${t}${label ? `("${label}")` : ""}`);
				if (includeVisibility) parts.push(`vis=${(d as any).visible !== false}`);
				if (includeZIndex && (d as any).zIndex != null) parts.push(`z=${(d as any).zIndex}`);
				if ((d as any).alpha != null && (d as any).alpha !== 1) parts.push(`alpha=${(d as any).alpha}`);
				if ((d as any).renderable === false) parts.push(`renderable=false`);
				if (includeEventMode && (d as any).eventMode) parts.push(`evt=${(d as any).eventMode}`);
				if ((d as any).width != null && (d as any).height != null) {
				parts.push(`w×h=${Math.round((d as any).width)}×${Math.round((d as any).height)}`);
				}
				const b = boundsInfo(d); if (b) parts.push(`bounds=[${b.x},${b.y},${b.w},${b.h}]`);
				const wt = wtInfo(d);   if (wt) parts.push(`WT=[a:${wt.a},b:${wt.b},c:${wt.c},d:${wt.d},tx:${wt.tx},ty:${wt.ty}]`);
				const hi = hitInfo(d);  if (hi) parts.push(`hit:${hi}`);
				const ti = includeTextureInfo ? texInfo(d) : undefined; if (ti) parts.push(`tex=${ti.texW}×${ti.texH} base=${ti.baseW}×${ti.baseH}${ti.src ? ` src:${ti.src}` : ""}`);
				return parts.join("  •  ");
			};

			const traverse = (node: any, depth: number, prefix: string) => {
			if (!node || seen.has(node) || depth > maxDepth) return;
			seen.add(node);

			if(!filter || filter(node))
			{
				const kids = Array.isArray((node as any).children) ? (node as any).children as any[] : [];
				const hasKids = kids.length > 0;

				if (hasKids) {
				console.groupCollapsed(`%c${line(prefix, node)}  •  children:${kids.length}`, "color:#9EE8FF");
				for (let i = 0; i < kids.length; i++) {
					traverse(kids[i], depth + 1, prefix + (depth === 0 ? "" : "  "));
				}
				console.groupEnd();
				} else {
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

		try
		{
			if (layer === "BOTH") {
			if (this._pixiInstanceBelow) dumpApp(this._pixiInstanceBelow, "BELOW");
			if (this._pixiInstanceAbove) dumpApp(this._pixiInstanceAbove, "ABOVE");
			} else {
			dumpApp(this.GetPixiInstance(layer), layer);
			}
		}
		catch (e)
		{
			console.warn("[Pixi.Debug] error:", e);
		}
	}
}
