import { PIXI_LAYER, PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
import * as PIXI from "pixi.js";

export class CanvasPixiShapeObj extends CanvasObj
{
	protected _graphics: PIXI.Graphics | null = null;

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);

		this.InitPixiObject();
	}

	public InitPixiObject(): void
	{
		// ✅ Create a new PIXI Graphics object
		this._graphics = new PIXI.Graphics();
		PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._graphics);

		//const texture = await PIXI.Assets.load('https://pixijs.com/assets/bunny.png');
		//const bunny = new PIXI.Sprite(texture);
		//PixiController.get().Pixi.stage.addChild(bunny);
		//bunny.anchor.set(0.5);

		this.width = this.defObj.width ?? 100;
		this.height = this.defObj.height ?? 100;
		this.xScale = this.defObj.xScale ?? 1;
		this.yScale = this.defObj.yScale ?? 1;

		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

		this._graphics.x = this.x;
		this._graphics.y = this.y;
		this._graphics.scale.set(this.xScale, this.yScale);

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

		//this._graphics.clear();
		//this._graphics.rect(0, 0, this.width, this.height);
		//this._graphics.fill({color: 0x650a5a, alpha: 0.15});
		//this._graphics.stroke({ width: 2, color: 0xfeeb77, alpha: 0.15 });
	}

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;

		if (this._graphics)
		{
			if(CanvasEngine.get().EngineSettings?.autoScale)
			{
				let transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
				let transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;

				this._graphics.x = transformedX;
				this._graphics.y = transformedY;

				this._graphics.scale.set(CanvasEngine.get().CurrentCanvasScale * this.xScale, CanvasEngine.get().CurrentCanvasScale * this.yScale);
			}
			else
			{
				this._graphics.x = this.x;
				this._graphics.y = this.y;
				this._graphics.scale.set(this.xScale, this.yScale);
			}
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
		if (this._graphics)
		{
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._graphics);
			this._graphics.destroy();
			this._graphics = null;
		}

		super.Dispose();
	}
}
