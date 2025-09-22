import { PIXI_LAYER, PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { BaseCanvasObj, CanvasObjectDef } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";

export class CanvasPixiShapeDrawFunctions
{
	public static DrawRectangle(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		graphics.rect(0, 0, def.width ?? 0, def.height ?? 0);
		graphics.fill({color: def.bgColor ?? 0x6cf4f6, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 6, color: def.borderColor ?? 0x5b7d62});
	}

	public static DrawCircle(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const radius = Math.min(def.width ?? 100, def.height ?? 100) / 2;
		graphics.circle(radius, radius, radius);
		graphics.fill({color: def.bgColor ?? 0xff6b6b, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 4, color: def.borderColor ?? 0x4ecdc4});
	}

	public static DrawEllipse(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;
		graphics.ellipse(width/2, height/2, width/2, height/2);
		graphics.fill({color: def.bgColor ?? 0x95e77e, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 3, color: def.borderColor ?? 0x2d6a4f});
	}

	public static DrawRoundedRect(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const cornerRadius = def.cornerRadius ?? 15;
		graphics.roundRect(0, 0, def.width ?? 100, def.height ?? 100, cornerRadius);
		graphics.fill({color: def.bgColor ?? 0x7209b7, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 4, color: def.borderColor ?? 0xf72585});
	}

	public static DrawStar(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const points = def.starPoints ?? 5;
		const outerRadius = Math.min(def.width ?? 100, def.height ?? 100) / 2;
		const innerRadius = outerRadius * (def.starInnerRadiusRatio ?? 0.5);
		const cx = (def.width ?? 100) / 2;
		const cy = (def.height ?? 100) / 2;

		graphics.star(cx, cy, points, outerRadius, innerRadius);
		graphics.fill({color: def.bgColor ?? 0xffd60a, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 3, color: def.borderColor ?? 0x003566});
	}

	public static DrawPolygon(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const sides = def.polygonSides ?? 6;
		const radius = Math.min(def.width ?? 100, def.height ?? 100) / 2;
		const cx = (def.width ?? 100) / 2;
		const cy = (def.height ?? 100) / 2;

		graphics.regularPoly(cx, cy, radius, sides);
		graphics.fill({color: def.bgColor ?? 0x06ffa5, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 4, color: def.borderColor ?? 0x7b2cbf});
	}

	public static DrawTriangle(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;

		graphics.poly([
			width/2, 0,      // top point
			0, height,       // bottom left
			width, height    // bottom right
		]);
		graphics.fill({color: def.bgColor ?? 0xff006e, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 3, color: def.borderColor ?? 0x8338ec});
	}

	public static DrawHeart(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;
		const scale = Math.min(width, height) / 100;

		// Heart shape using bezier curves
		graphics.moveTo(50 * scale, 25 * scale);
		graphics.bezierCurveTo(50 * scale, 12.5 * scale, 35 * scale, 0, 20 * scale, 0);
		graphics.bezierCurveTo(0, 0, 0, 17.5 * scale, 0, 17.5 * scale);
		graphics.bezierCurveTo(0, 31.25 * scale, 20 * scale, 56.25 * scale, 50 * scale, 87.5 * scale);
		graphics.bezierCurveTo(80 * scale, 56.25 * scale, 100 * scale, 31.25 * scale, 100 * scale, 17.5 * scale);
		graphics.bezierCurveTo(100 * scale, 17.5 * scale, 100 * scale, 0, 80 * scale, 0);
		graphics.bezierCurveTo(65 * scale, 0, 50 * scale, 12.5 * scale, 50 * scale, 25 * scale);

		graphics.fill({color: def.bgColor ?? 0xe63946, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 3, color: def.borderColor ?? 0x2d3436});
	}

	public static DrawArrow(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;
		const arrowHeadSize = def.arrowHeadSize ?? 0.3; // percentage of width

		// Arrow shaft
		graphics.rect(0, height * 0.35, width * (1 - arrowHeadSize), height * 0.3);

		// Arrow head (triangle)
		graphics.poly([
			width * (1 - arrowHeadSize), height * 0.2,
			width, height * 0.5,
			width * (1 - arrowHeadSize), height * 0.8
		]);

		graphics.fill({color: def.bgColor ?? 0x00b4d8, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 3, color: def.borderColor ?? 0x03045e});
	}

	public static DrawCross(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;
		const thickness = def.crossThickness ?? 0.3;

		// Vertical bar
		graphics.rect(width * (0.5 - thickness/2), 0, width * thickness, height);
		// Horizontal bar
		graphics.rect(0, height * (0.5 - thickness/2), width, height * thickness);

		graphics.fill({color: def.bgColor ?? 0xf4a261, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 2, color: def.borderColor ?? 0x264653});
	}

	public static DrawGradientRect(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;
		const gradientFrom = def.gradientFrom ?? 0xff0080;
		const gradientTo = def.gradientTo ?? 0x7928ca;

		// Create gradient fill
		const fill = new PIXI.FillGradient(0, 0, width, 0);
		fill.addColorStop(0, gradientFrom);
		fill.addColorStop(1, gradientTo);

		graphics.rect(0, 0, width, height);
		graphics.fill(fill);
		graphics.stroke({width: def.borderWidth ?? 3, color: def.borderColor ?? 0xffffff});
	}

	public static DrawBurst(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const spikes = def.burstSpikes ?? 8;
		const outerRadius = Math.min(def.width ?? 100, def.height ?? 100) / 2;
		const innerRadius = outerRadius * (def.burstInnerRadiusRatio ?? 0.5);
		const cx = (def.width ?? 100) / 2;
		const cy = (def.height ?? 100) / 2;

		const points:number[] = [];
		const step = (Math.PI * 2) / spikes;

		for(let i = 0; i < spikes; i++)
		{
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
		graphics.fill({color: def.bgColor ?? 0xffbe0b, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 3, color: def.borderColor ?? 0xfb5607});
	}

	public static DrawDiamond(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;

		graphics.poly([
			width/2, 0,      // top
			width, height/2, // right
			width/2, height, // bottom
			0, height/2      // left
		]);
		graphics.fill({color: def.bgColor ?? 0x00f5ff, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 4, color: def.borderColor ?? 0x8b008b});
	}

	public static DrawSpeechBubble(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const width = def.width ?? 100;
		const height = def.height ?? 100;
		const tailSize = def.tailSize ?? 20;
		const cornerRadius = def.cornerRadius ?? 10;

		// Main bubble
		graphics.roundRect(0, 0, width, height * 0.8, cornerRadius);

		// Tail
		graphics.poly([
			width * 0.3, height * 0.8,
			width * 0.4, height * 0.8,
			width * 0.35, height
		]);

		graphics.fill({color: def.bgColor ?? 0xffffff, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 2, color: def.borderColor ?? 0x000000});
	}

	public static DrawGear(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
		const teeth = def.gearTeeth ?? 8;
		const outerRadius = Math.min(def.width ?? 100, def.height ?? 100) / 2;
		const innerRadius = outerRadius * 0.6;
		const toothHeight = outerRadius * 0.3;
		const cx = (def.width ?? 100) / 2;
		const cy = (def.height ?? 100) / 2;

		const points:number[] = [];
		const step = (Math.PI * 2) / (teeth * 2);

		for(let i = 0; i < teeth * 2; i++)
		{
			const angle = i * step;
			const radius = i % 2 === 0 ? outerRadius : outerRadius - toothHeight;
			points.push(cx + Math.cos(angle) * radius);
			points.push(cy + Math.sin(angle) * radius);
		}

		graphics.poly(points);
		graphics.fill({color: def.bgColor ?? 0x6c757d, alpha: def.bgAlpha ?? 1});
		graphics.stroke({width: def.borderWidth ?? 2, color: def.borderColor ?? 0x343a40});

		// Center hole
		graphics.circle(cx, cy, innerRadius * 0.5);
		graphics.cut();
	}

	public static DrawRandomShape(graphics:PIXI.Graphics, def:CanvasObjectDef)
	{
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

export class CanvasPixiShapeObj extends BaseCanvasObj
{
	protected _graphics:PIXI.Graphics | null = null;
	protected _debugGraphics:PIXI.Graphics | null = null;

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
	}

	public override InitVisuals():void
	{
		super.InitVisuals();
		this.InitPixiObject();
	}

	public InitPixiObject(): void
	{
		if(this._debug)
		{
			this._debugGraphics = new PIXI.Graphics();
			PixiController.get().GetPixiInstance(PIXI_LAYER.ABOVE).stage.addChild(this._debugGraphics);
		}

		this._graphics = new PIXI.Graphics();
		PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._graphics);

		this.width = this.defObj.width ?? 100;
		this.height = this.defObj.height ?? 100;
		this.xScale = this.defObj.xScale ?? 1;
		this.yScale = this.defObj.yScale ?? 1;

		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

		// Use render coordinates for initial positioning (handles parenting automatically)
		this._graphics.x = this.renderX;
		this._graphics.y = this.renderY;
		this._graphics.scale.set(this.renderXScale, this.renderYScale);

		this._graphics.eventMode = "static";

		if(this.defObj.interactive)
		{
			this._graphics.cursor = "pointer";

			this._graphics.on("pointerdown", this.onClick, this);
			this._graphics.on("pointerover", this.onHover, this);
			this._graphics.on("pointerout", this.onHoverOut, this);
		}

		if(this.centerGlobally)
		{
			this.x = CanvasEngine.get().width / 2;
			this.y = CanvasEngine.get().height / 2;
		}

		if(this.centerGlobally || this.centerLocally)
		{
			this.x -= (this.width / 2);
			this.y -= (this.height / 2);
		}


		this.DrawVectors();

		this.UpdateBaseProps();
	}

	public override get visible():boolean
	{
		return super.visible;
	}
	public override set visible(value:boolean)
	{
		//console.log(' SET SET ST SET SET SET CanvasPixiShapeObj['+this._uuid+'].visible = '+value);
		if(value)
		{
			if(this._graphics) this._graphics.visible = true;
		}
		else
		{
			if(this._graphics) this._graphics.visible = false;
		}

		super.visible = value;
	}

	public DrawVectors():void
	{
		if(this._graphics === null) return;
		if(this._debug && this._debugGraphics)
		{
			console.log('%c CanvasPixiShapeOBJ.DrawVectors3', 'color:#ee661c; font-weight:bold;');
			this._debugGraphics.clear();
			this._debugGraphics.rect(0, 0, this.width, this.height);
			this._debugGraphics.fill({color: 0x650a5a, alpha: 0.75});
			this._debugGraphics.stroke({ width: 2, color: 0xfeeb77, alpha: 0.95 });
		}
	}

	private _ranFirstUpdate = false;
	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;

		if(!this._ranFirstUpdate)
		{
			this._ranFirstUpdate = true;
			this.DrawVectors();
		}

		let transformedX = 0;
		let xScale = 0;
		let transformedY = 0;
		let yScale = 0;

		// Use render coordinates (automatically handles parent transforms)
		if(CanvasEngine.get().EngineSettings?.autoScale && (this._graphics || (this._debug && this._debugGraphics)))
		{
			transformedX = this.renderX * CanvasEngine.get().CurrentCanvasScale;
			transformedY = this.renderY * CanvasEngine.get().CurrentCanvasScale;
			xScale = CanvasEngine.get().CurrentCanvasScale * this.renderXScale;
			yScale = CanvasEngine.get().CurrentCanvasScale * this.renderYScale;
		}
		else
		{
			transformedX = this.renderX;
			transformedY = this.renderY;
			xScale = this.renderXScale;
			yScale = this.renderYScale;
		}

		if(this._graphics)
		{
			this._graphics.x = transformedX;
			this._graphics.y = transformedY;
			this._graphics.scale.set(xScale, yScale);
		}

		if(this._debug && this._debugGraphics)
		{
			this._debugGraphics.x = transformedX;
			this._debugGraphics.y = transformedY;
			this._debugGraphics.scale.set(xScale, yScale);
		}
	}

	protected onClick(event: PIXI.FederatedPointerEvent)
	{
		console.log("🖱️ PixiShapeObject clicked!", this.label);
		if(this._defObj!.clickFunction)
		{
			console.log("PixiShapeObject: yes call function");
			this._defObj!.clickFunction(this);
		}
	}

	private onHover()
	{
		if (this._graphics)
		{
			this._graphics.tint = 0x00ff00;
		}
	}

	private onHoverOut()
	{
		if (this._graphics)
		{
			this._graphics.tint = 0xffffff;
		}
	}

	public Dispose(): void
	{
		if(this._graphics)
		{
			// Remove event listeners BEFORE destroying to prevent memory leaks
			if(this.defObj.interactive)
			{
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

		if(this._debugGraphics)
		{
			// Clean up debug graphics listeners if any
			this._debugGraphics.removeAllListeners();

			PixiController.get().GetPixiInstance(PIXI_LAYER.ABOVE).stage.removeChild(this._debugGraphics);
			this._debugGraphics.destroy();
			this._debugGraphics = null;
		}

		super.Dispose();
	}
}
