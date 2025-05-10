import { PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
import * as PIXI from "pixi.js";

export class CanvasPixiShapeObj extends CanvasObj
{
	private _graphics: PIXI.Graphics | null = null;

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);

		this.InitPixiObject();
	}

	public InitPixiObject(): void
	{
		// ✅ Create a new PIXI Graphics object
		this._graphics = new PIXI.Graphics();
		PixiController.get().Pixi.stage.addChild(this._graphics);

		//const texture = await PIXI.Assets.load('https://pixijs.com/assets/bunny.png');
		//const bunny = new PIXI.Sprite(texture);
		//PixiController.get().Pixi.stage.addChild(bunny);
		//bunny.anchor.set(0.5);

		this.width = this.defObj.width ?? 100;
		this.height = this.defObj.height ?? 100;

		this._graphics.rect(0, 0, this.width, this.height);
		this._graphics.fill({color: 0x650a5a, alpha: 0.3});
		this._graphics.stroke({ width: 2, color: 0xfeeb77 });

		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

		this._graphics.x = this.x;
		this._graphics.y = this.y;

		this._graphics.eventMode = "static";
		this._graphics.cursor = "pointer";

		this._graphics.on("pointerdown", this.onClick, this);
		this._graphics.on("pointerover", this.onHover, this);
		this._graphics.on("pointerout", this.onHoverOut, this);

		this.UpdateBaseProps();
	}

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;

		//if(onceSecond) console.log("PixiShapeObject update",frameCount);

		if (this._graphics)
		{
			this._graphics.x = this.x;
			this._graphics.y = this.y;
		}
	}

	protected onClick(event: PIXI.FederatedPointerEvent)
	{
		//console.log("🖱️ PixiShapeObject clicked!", this.label);
	}

	// ✅ Hover event handler
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
		super.Dispose();

		if (this._graphics)
		{
			PixiController.get().Pixi.stage.removeChild(this._graphics);
			this._graphics.destroy();
			this._graphics = null;
		}
	}
}
