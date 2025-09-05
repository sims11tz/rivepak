import { PIXI_LAYER, PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
import * as PIXI from "pixi.js";

export class CanvasPixiShapeObj extends CanvasObj
{
	protected _graphics: PIXI.Graphics | null = null;
	protected _debugGraphics: PIXI.Graphics | null = null;

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);

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

		this.UpdateBaseProps();

		this.DrawVectors();
	}

	public DrawVectors():void
	{
		if(this._graphics === null) return;
		if(this._debug && this._debugGraphics)
		{

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
		//console.log("🖱️ PixiShapeObject clicked!", this.label);
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
