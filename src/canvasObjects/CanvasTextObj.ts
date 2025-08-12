import * as PIXI from "pixi.js";

import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
import { CanvasEngine } from "../useCanvasEngine";
import { PixiController } from "../controllers/PixiController";

export class CanvasTextObject extends CanvasPixiShapeObj
{
	private _textField!:PIXI.Text | null;

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
	}

	public override InitPixiObject(): void
	{
		this.width = this.defObj.width ?? 100;
		this.height = this.defObj.height ?? 100;
		this.xScale = this.defObj.xScale ?? 1;
		this.yScale = this.defObj.yScale ?? 1;

		this.x = this.defObj.x ?? 0;
		this.y = this.defObj.y ?? 0;

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

		const scaledWidth = this.width * this.xScale;
		const scaledHeight = this.height * this.yScale;
		this._objBoundsReuse.minX = this.x;
		this._objBoundsReuse.minY = this.y;
		this._objBoundsReuse.maxX = this.x + scaledWidth;
		this._objBoundsReuse.maxY = this.y + scaledHeight;

		super.InitPixiObject();
	}

	public override DrawVectors():void
	{
		if(this._textField && this._textField.text === this.defObj.text)
		{
			return;
		}

		if(this._textField)
		{
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textField);
			this._textField.destroy();
			this._textField = null;
		}

		if(this.defObj.text && this.defObj.text.length > 0)
		{
			const style = new PIXI.TextStyle({
				fontFamily: "Verdana",
				fontSize: 64,
				fill: "#ffcc00",
				stroke: "#000000",
				dropShadow: true,
				align: "center",
				fontWeight: "bold",
			});
			this._textField = new PIXI.Text({text:this.defObj.text, style:style});
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

	public SetText(text: string): void
	{
		this.defObj.text = text;
		this.DrawVectors();
	}

	public Update(time:number,frameCount:number,onceSecond:boolean)
	{
		if(this.enabled === false) return;

		if(this._textField)
		{
			if(CanvasEngine.get().EngineSettings?.autoScale)
			{
				//if(onceSecond) console.log('>>>>>>> -AUTOscaleAUTO- '+CanvasEngine.get().CurrentCanvasScale);
				let transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
				let transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
				//if(onceSecond) console.log('>>>>>>> -AUTOscaleAUTO-Tx '+transformedX);
				//if(onceSecond) console.log('>>>>>>> -AUTOscaleAUTO-Ty '+transformedY);

				this._textField.x = transformedX;
				this._textField.y = transformedY;

				this._textField.scale.set(CanvasEngine.get().CurrentCanvasScale * this.xScale, CanvasEngine.get().CurrentCanvasScale * this.yScale);
			}
			else
			{
				//if(onceSecond) console.log('>>>>>>> - no autoscale ---- <<<<<<<');
				this._textField.x = this.x;
				this._textField.y = this.y;
				this._textField.scale.set(this.xScale, this.yScale);
			}
		}
		else
		{
			//if(onceSecond) console.log("Text >4> There is no text field :S ");
		}

		super.Update(time, frameCount, onceSecond);
	}

	public Dispose(): void
	{
		if (this._textField)
		{
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textField);
			this._textField.destroy();
			this._textField = null;
		}

		super.Dispose();
	}
}
