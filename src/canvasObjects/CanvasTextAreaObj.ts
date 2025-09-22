import * as PIXI from "pixi.js";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasTextObject } from "./CanvasTextObj";
import { CanvasObjectDef } from "./_baseCanvasObj";
import { CanvasEngine } from "../useCanvasEngine";
import { PixiController } from "../controllers/PixiController";

export interface TextAreaBackgroundOptions {
	enabled:boolean;
	fill?:number | string | number[] | string[];  // Single color, gradient array
	alpha?:number;
	borderRadius?:number;
	borderWidth?:number;
	borderColor?:number | string;
	borderAlpha?:number;
	padding?:number;
	gradientType?:'linear' | 'radial';
	gradientStops?:Array<{offset:number; color:number | string}>;
	shadowBlur?:number;
	shadowColor?:number | string;
	shadowDistance?:number;
	shadowAngle?:number;
	shadowAlpha?:number;
}

export interface CanvasTextAreaDef extends CanvasObjectDef {
	lines?:string[];
	lineHeight?:number;
	maxLines?:number;
	background?:TextAreaBackgroundOptions;
	textStyle?:Partial<PIXI.TextStyleOptions>;
	lineSpacing?:number;
}

export class CanvasTextAreaObj extends CanvasPixiShapeObj
{
	private _textLines:CanvasTextObject[] | null = null;
	private _backgroundGraphics:PIXI.Graphics | null = null;
	private _lines:string[] | null = null;
	private _lineHeight:number=0;
	private _maxLines:number=0;
	private _lineSpacing:number=0;
	private _background:TextAreaBackgroundOptions | null = null;
	private _textStyle:Partial<PIXI.TextStyleOptions> | null = null;
	private _lastLinesHash:string | null = null;

	constructor(canvasDef:CanvasTextAreaDef)
	{
		console.log('%c **  ', "color:#00FF00; font-weight:bold;");
		console.log('%c ** CanvasTextAreaObj() ', "color:#00FF00; font-weight:bold;");
		console.log('%c ** CanvasTextAreaObj() canvasDef=', "color:#00FF00; font-weight:bold;", canvasDef);

		super(canvasDef);
	}

	private get canvasTextAreaDef():CanvasTextAreaDef
	{
		return this.defObj as CanvasTextAreaDef;
	}

	/**
	 * Override InitVisuals instead of InitPixiObject
	 * This ensures proper initialization after constructor chain completes
	 */
	public override InitVisuals():void
	{
		console.log('%c ** CanvasTextAreaObj.InitVisuals() ** START ** ', "color:#00FF00; font-weight:bold;");

		// Initialize our properties
		this._textLines = [];
		this._backgroundGraphics = null;
		this._lines = this.canvasTextAreaDef.lines || [];
		this._lineHeight = this.canvasTextAreaDef.lineHeight || 24;
		this._maxLines = this.canvasTextAreaDef.maxLines || 10;
		this._lineSpacing = this.canvasTextAreaDef.lineSpacing || 10;
		this._textStyle = this.canvasTextAreaDef.textStyle || {};

		console.log('%c ** CanvasTextAreaObj.InitVisuals() 1 ', "color:#00FF00; font-weight:bold;");

		this._background = this.canvasTextAreaDef.background || {
			enabled:false
		};

		console.log('%c ** CanvasTextAreaObj().InitVisuals() 2  this._background=', "color:#00FF00; font-weight:bold;", this._background);

		// Set up dimensions and position
		this.width = this.canvasTextAreaDef.width ?? 400;
		this.height = this.canvasTextAreaDef.height ?? (this._maxLines * (this._lineHeight + this._lineSpacing));
		this.xScale = this.canvasTextAreaDef.xScale ?? 1;
		this.yScale = this.canvasTextAreaDef.yScale ?? 1;

		console.log('%c ** CanvasTextAreaObj().InitVisuals() 3 ', "color:#00FF00; font-weight:bold;" );

		this.x = this.canvasTextAreaDef.x ?? 0;
		this.y = this.canvasTextAreaDef.y ?? 0;

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

		console.log('%c ** CanvasTextAreaObj().InitVisuals() 4 ', "color:#00FF00; font-weight:bold;" );

		const scaledWidth = this.width * this.xScale;
		const scaledHeight = this.height * this.yScale;
		this._objBoundsReuse.minX = this.x;
		this._objBoundsReuse.minY = this.y;
		this._objBoundsReuse.maxX = this.x + scaledWidth;
		this._objBoundsReuse.maxY = this.y + scaledHeight;

		console.log('%c ** CanvasTextAreaObj().InitVisuals() 5 ', "color:#00FF00; font-weight:bold;");

		// Call parent initialization (which will call InitPixiObject)
		super.InitVisuals();

		console.log('%c ** CanvasTextAreaObj().InitVisuals() 6 ', "color:#00FF00; font-weight:bold;");

		// Create background and text lines after parent init
		this.createBackground();
		this.createTextLines();

		console.log('%c ** CanvasTextAreaObj.InitVisuals() ** END ** ', "color:#00FF00; font-weight:bold;");
	}

	private createBackground():void
	{
		const debug = false;
		if(debug) console.log('%c ** CTAO :: createBackground() ** ', "color:#00FF00; font-weight:bold;");
		if(!this._background || !this._background.enabled) return;

		if(debug) console.log('%c ** CTAO :: createBackground() ** 1', "color:#00FF00; font-weight:bold;");
		if(this._backgroundGraphics)
		{
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._backgroundGraphics);
			this._backgroundGraphics.destroy();
		}

		this._backgroundGraphics = new PIXI.Graphics();

		if(debug) console.log('%c ** CTAO :: createBackground() ** 2', "color:#00FF00; font-weight:bold;");
		const padding = this._background.padding || 0;
		const x = this.x - padding;
		const y = this.y - padding;
		const width = this.width + (padding * 2);
		const height = this.height + (padding * 2);
		const radius = this._background.borderRadius || 0;

		// Add shadow if enabled
		if(this._background.shadowBlur || this._background.shadowDistance)
		{
			if(debug) console.log('%c ** CTAO :: createBackground() ** 3', "color:#00FF00; font-weight:bold;");
			const shadowGraphics = new PIXI.Graphics();
			const shadowColor = this._background.shadowColor || 0x000000;
			const shadowAlpha = this._background.shadowAlpha || 0.5;
			const shadowDistance = this._background.shadowDistance || 5;
			const shadowAngle = this._background.shadowAngle || Math.PI / 4;

			const shadowX = x + Math.cos(shadowAngle) * shadowDistance;
			const shadowY = y + Math.sin(shadowAngle) * shadowDistance;

			shadowGraphics.alpha = shadowAlpha;

			if(radius > 0)
			{
				shadowGraphics.roundRect(shadowX, shadowY, width, height, radius);
			}
			else
			{
				shadowGraphics.rect(shadowX, shadowY, width, height);
			}
			shadowGraphics.fill(shadowColor);

			// Apply blur filter if specified
			if(this._background.shadowBlur && this._background.shadowBlur > 0)
			{
				const blurFilter = new PIXI.BlurFilter({
					strength: this._background.shadowBlur,
					quality: 4
				});
				shadowGraphics.filters = [blurFilter];
			}

			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(shadowGraphics);
		}

		// Draw border if specified
		if(this._background.borderWidth && this._background.borderWidth > 0)
		{
			if(debug) console.log('%c ** CTAO :: createBackground() ** 4', "color:#00FF00; font-weight:bold;");
			const borderColor = this._background.borderColor || 0x000000;
			const borderAlpha = this._background.borderAlpha || 1;

			this._backgroundGraphics.stroke({
				color: borderColor,
				width: this._background.borderWidth,
				alpha: borderAlpha
			});
		}

		// Draw fill
		if(this._background.fill)
		{
			if(debug) console.log('%c ** CTAO :: createBackground() ** 5', "color:#00FF00; font-weight:bold;");
			if(Array.isArray(this._background.fill) && this._background.fill.length > 1)
			{
				// For gradients in PIXI v8, we'll use the first and last colors
				// and create a simple blend. Full gradient support would require
				// creating a canvas texture or using a shader
				const colors = this._background.fill as (number | string)[];
				const firstColor = typeof colors[0] === 'string' ? colors[0] : colors[0];

				// For now, use the first color as a solid fill
				// TODO: Implement proper gradient support with canvas texture
				this._backgroundGraphics.fill(firstColor);
			}
			else
			{
				// Solid fill
				const fillColor = Array.isArray(this._background.fill)
					? this._background.fill[0]
					: this._background.fill;

				this._backgroundGraphics.fill(fillColor);
			}
		}

		if(debug) console.log('%c ** CTAO :: createBackground() ** 6', "color:#00FF00; font-weight:bold;");

		// Draw the shape
		if(radius > 0)
		{
			if(debug) console.log('%c ** CTAO :: createBackground() ** 7', "color:#00FF00; font-weight:bold;");
			this._backgroundGraphics.roundRect(x, y, width, height, radius);
		}
		else
		{
			if(debug) console.log('%c ** CTAO :: createBackground() ** 8', "color:#00FF00; font-weight:bold;");
			this._backgroundGraphics.rect(x, y, width, height);
		}

		this._backgroundGraphics.fill();

		// Set alpha
		this._backgroundGraphics.alpha = this._background.alpha || 1;

		if(debug) console.log('%c ** CTAO :: createBackground() ** 9 alpha : '+this._backgroundGraphics.alpha, "color:#00FF00; font-weight:bold;");

		// Add to stage
		PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._backgroundGraphics);
	}


	private createTextLines():void
	{
		console.log('%c ** CTAO :: createTextLines() ** 1', "color:#00FF00; font-weight:bold;");
		if(this._textLines === null)
		{
			console.log('%c ** CTAO :: createTextLines() ** NOOOOOOOO', "color:#00FF00; font-weight:bold;");
			return;
		}

		// Clear existing text lines
		this.clearTextLines();

		const padding = this._background?.padding || 0;

		console.log('%c ** CTAO :: createTextLines() ** 2 - '+this._maxLines, "color:#00FF00; font-weight:bold;");
		// Create new text lines
		for(let i = 0; i < this._maxLines; i++)
		{
			const textLine = new CanvasTextObject({
				label: `${this.defObj.label}_Line${i}`,
				text: 'LINE :: ' + i,
				width: this.width,
				height: this._lineHeight,
				x: this.x + padding,
				y: this.y + padding + (i * (this._lineHeight + this._lineSpacing)),
				textStyle: this._textStyle,
				textAlign: this.defObj.textAlign,
				verticalAlign: 'top',
				visible: true,
				pixiLayer: this.defObj.pixiLayer
			} as CanvasObjectDef);

			this._textLines.push(textLine);
			console.log('%c ** CTAO :: createTextLines() ** 3 - '+i, "color:#00FF00; font-weight:bold;");
			CanvasEngine.get().AddCanvasObjects(textLine);
		}

		console.log('%c ** CTAO :: createTextLines() ** 4 - this._textLines=', "color:#00FF00; font-weight:bold;",this._textLines);
	}

	private clearTextLines():void
	{
		console.log('%c ** CTAO :: clearTextLines() ** 1', "color:#00FF00; font-weight:bold;");
		if(this._textLines && this._textLines.length > 0)
		{
			for(const line of this._textLines)
			{
				CanvasEngine.get().RemoveCanvasObjects(line);
				line.Dispose();
			}
		}
		this._textLines = [];
	}

	public SetLines(lines:string[]):void
	{
		// Create a simple hash of the lines to check if content changed
		const newLinesHash = lines.join('|||');

		// Skip update if content hasn't changed
		if(newLinesHash === this._lastLinesHash)
		{
			return;
		}

		console.log('%c ** CTAO :: SetLines() ** 1 newLinesHash = ', "color:#00FF00; font-weight:bold;",newLinesHash);
		console.log('%c ** CTAO :: SetLines() ** 1 this._lastLinesHash = ', "color:#00FF00; font-weight:bold;",this._lastLinesHash);

		this._lastLinesHash = newLinesHash;
		this._lines = lines;
		this.updateTextLines();
	}

	public AddLine(line:string):void
	{
		if(this._lines === null)
		{
			console.log('%c ** CTAO :: AddLine() ** NOOOOOOOO', "color:#00FF00; font-weight:bold;");
			return;
		}

		this._lines.push(line);

		// Keep only the most recent lines if we exceed maxLines
		if(this._lines.length > this._maxLines)
		{
			this._lines = this._lines.slice(-this._maxLines);
		}

		// Update hash after modifying lines
		this._lastLinesHash = this._lines.join('|||');
		this.updateTextLines();
	}

	public ClearLines():void
	{
		this._lines = [];
		this._lastLinesHash = '';
		this.updateTextLines();
	}

	private updateTextLines():void
	{
		console.log('%c ** CTAO :: updateTextLines() ** 1', "color:#00FF00; font-weight:bold;");
		console.log('%c ** CTAO :: updateTextLines() **    >this._textLines=', "color:#00FF00; font-weight:bold;",this._textLines);
		console.log('%c ** CTAO :: updateTextLines() **        >this._lines=', "color:#00FF00; font-weight:bold;",this._lines);

		if(this._lines === null || this._textLines === null)
		{
			console.log('%c ** CTAO :: updateTextLines() ** NOOOOOOOO', "color:#00FF00; font-weight:bold;");
			if(this._lines === null)
			{
				console.log('%c ** CTAO :: updateTextLines() ** NOOOOOOOO _lines', "color:#00FF00; font-weight:bold;");
			}

			if(this._textLines === null)
			{
				console.log('%c ** CTAO :: updateTextLines() ** NOOOOOOOO _textLines', "color:#00FF00; font-weight:bold;");
			}

			return;
		}

		console.log('%c ** CTAO :: updateTextLines() ** 2', "color:#00FF00; font-weight:bold;");

		for(let i = 0; i < this._textLines.length; i++)
		{
			if(i < this._lines.length)
			{
				this._textLines[i].SetText(this._lines[i]);
				this._textLines[i].visible = true;
			}
			else
			{
				this._textLines[i].SetText('');
				this._textLines[i].visible = false;
			}
		}
	}

	public SetTextStyle(style:Partial<PIXI.TextStyleOptions>):void
	{
		if(this._textLines === null)
		{
			console.log('%c ** CTAO :: SetTextStyle() ** NOOOOOOOO', "color:#00FF00; font-weight:bold;");
			return;
		}

		this._textStyle = { ...this._textStyle, ...style };

		for(const line of this._textLines)
		{
			line.SetTextStyle(style);
		}
	}

	public SetBackground(options:TextAreaBackgroundOptions):void
	{
		this._background = { ...this._background, ...options };
		this.createBackground();
	}

	public ToggleVisibility():void
	{
		if(this._textLines === null || this._lines === null)
		{
			console.log('%c ** CTAO :: ToggleVisibility() ** NOOOOOOOO', "color:#00FF00; font-weight:bold;");
			return;
		}

		const newVisibility = !this.visible;
		this.visible = newVisibility;

		for(const line of this._textLines)
		{
			line.visible = newVisibility && (this._lines.indexOf(line.Text) !== -1);
		}

		if(this._backgroundGraphics)
		{
			this._backgroundGraphics.visible = newVisibility;
		}
	}

	public override Update(time:number, frameCount:number, onceSecond:boolean):void
	{
		if(this.enabled === false) return;

		if(onceSecond) console.log('%c ** CTAO :: Update() ** 1', "color:#00FF00; font-weight:bold;");

		// Update background position if needed
		if(this._backgroundGraphics && this._background && CanvasEngine.get().EngineSettings?.autoScale)
		{
			if(onceSecond) console.log('%c ** CTAO :: Update() ** 2', "color:#00FF00; font-weight:bold;");
			const scale = CanvasEngine.get().CurrentCanvasScale;
			const padding = this._background.padding || 0;

			this._backgroundGraphics.x = (this.renderX - padding) * scale;
			this._backgroundGraphics.y = (this.renderY - padding) * scale;
			this._backgroundGraphics.scale.set(scale * this.renderXScale, scale * this.renderYScale);
			if(onceSecond) console.log('%c ** CTAO :: Update() ** 2 - '+this._backgroundGraphics.x+','+this._backgroundGraphics.y, "color:#00FF00; font-weight:bold;");
		}
		else
		{
			if(onceSecond) console.log('%c ** CTAO :: Update() ** 3', "color:#00FF00; font-weight:bold;");
		}

		super.Update(time, frameCount, onceSecond);
	}

	public override Dispose():void
	{
		this.clearTextLines();

		if(this._backgroundGraphics)
		{
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._backgroundGraphics);
			this._backgroundGraphics.destroy();
			this._backgroundGraphics = null;
		}

		super.Dispose();
	}
}
