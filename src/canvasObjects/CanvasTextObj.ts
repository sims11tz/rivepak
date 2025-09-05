import * as PIXI from "pixi.js";

import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
import { CanvasEngine } from "../useCanvasEngine";
import { PixiController } from "../controllers/PixiController";

export class CanvasTextObject extends CanvasPixiShapeObj
{
	private _textField!: PIXI.Text | null;

	private _typewriterIndex!:number;
	private _typewriterTimer!:number;
	private _fullText!:string;
	private _fadeStartTime!:number;
	private _pulseTime!:number;

	private _alignmentOffsetX!:number;
	private _alignmentOffsetY!:number;

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);

		if(this.defObj.typewriterEffect && this.defObj.text)
		{
			this._fullText = this.defObj.text;
			this._typewriterIndex = 0;
			this._typewriterTimer = 0;
		}

		if(this.defObj.fadeInDuration)
		{
			this._fadeStartTime = Date.now();
		}
	}

	public override InitPixiObject(): void
	{
		//this._debug = true;

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
	private migrateStrokeStyle(style: any): any
	{
		// Check if style has old stroke format
		if('strokeThickness' in style || (style.stroke && typeof style.stroke !== 'object'))
		{
			const newStyle = { ...style };

			// Convert old stroke format to new format
			if(style.stroke || style.strokeThickness)
			{
				newStyle.stroke = {
					color: style.stroke || 0x000000,
					width: style.strokeThickness || 0,
					alpha: 1
				};

				// Remove old properties
				delete newStyle.strokeThickness;
				if(typeof style.stroke !== 'object')
				{
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
	private createTextStyle(): PIXI.TextStyle
	{
		const defaultStyle: Partial<PIXI.TextStyleOptions> = {
			fontFamily: "Arial, Helvetica, sans-serif",
			fontSize: 24,
			fill: 0xffffff,
			align: this.defObj.textAlign || 'left',
			wordWrap: this.defObj.wordWrap ?? false,
			wordWrapWidth: this.defObj.wordWrapWidth ?? this.width,
			breakWords: this.defObj.breakWords ?? false,
			letterSpacing: this.defObj.letterSpacing ?? 0,
			lineHeight: this.defObj.lineHeight,
			padding: this.defObj.padding ?? 0,
			trim: this.defObj.trimText ?? false,
		};

		if(this.defObj.textShadow)
		{
			defaultStyle.dropShadow = {
				color: this.defObj.textShadowColor ?? 0x000000,
				blur: this.defObj.textShadowBlur ?? 4,
				angle: this.defObj.textShadowAngle ?? Math.PI / 6,
				distance: this.defObj.textShadowDistance ?? 5,
				alpha: this.defObj.textShadowAlpha ?? 1
			};
		}

		let finalStyle = this.defObj.textStyle ? { ...defaultStyle, ...this.defObj.textStyle } : defaultStyle;
		finalStyle = this.migrateStrokeStyle(finalStyle);

		return new PIXI.TextStyle(finalStyle);
	}

	private calculateAlignmentOffsets(): void
	{
		if(!this._textField) return;

		const textBounds = this._textField.getLocalBounds();
		const containerWidth = this.defObj.maxWidth ?? this.width;
		const containerHeight = this.defObj.maxHeight ?? this.height;

		switch(this.defObj.textAlign)
		{
			case 'center': this._alignmentOffsetX = (containerWidth - textBounds.width) / 2; break;
			case 'right': this._alignmentOffsetX = containerWidth - textBounds.width; break;
			case 'justify':
			case 'left':
			default: this._alignmentOffsetX = 0; break;
		}

		switch(this.defObj.verticalAlign)
		{
			case 'middle': this._alignmentOffsetY = (containerHeight - textBounds.height) / 2; break;
			case 'bottom': this._alignmentOffsetY = containerHeight - textBounds.height; break;
			case 'top':
			default: this._alignmentOffsetY = 0; break;
		}
	}

	public override DrawVectors(): void
	{
		if(this._textField && this._textField.text === this.getCurrentDisplayText() && !this.hasStyleChanged())
		{
			return;
		}
		this._styleDirty = false;

		if(this._textField)
		{
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textField);
			this._textField.destroy();
			this._textField = null;
		}

		const displayText = this.getCurrentDisplayText();
		if(displayText && displayText.length > 0)
		{
			const style = this.createTextStyle();
			this._textField = new PIXI.Text({text:displayText, style:style});

			if(this.defObj.interactive)
			{
				this._textField.interactive = true;
				this._textField.eventMode = 'static';
				this._textField.cursor = 'pointer';

				this._textField.on('pointerdown', this.onTextClick, this);
				this._textField.on('pointerover', this.onTextHover, this);
				this._textField.on('pointerout', this.onTextHoverOut, this);
			}
			else
			{
				this._textField.interactive = false;
				this._textField.eventMode = 'none';
			}

			if(this.defObj.resolution)
			{
				this._textField.resolution = this.defObj.resolution;
			}

			this.calculateAlignmentOffsets();
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._textField);

			this.updateTextTransform();
		}

		super.DrawVectors();
	}

	private updateTextTransform(): void
	{
		if(!this._textField) return;

		const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
		const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;

		this._textField.scale.set(combinedScaleX, combinedScaleY);
		this._textField.x = this._objBoundsReuse.minX + this._alignmentOffsetX * combinedScaleX;
		this._textField.y = this._objBoundsReuse.minY + this._alignmentOffsetY * combinedScaleY;
	}

	private getCurrentDisplayText(): string
	{
		if(!this.defObj.text) return "";

		if(this.defObj.typewriterEffect)
		{
			return this._fullText.substring(0, this._typewriterIndex);
		}

		return this.defObj.text;
	}

	private _styleDirty = false;
	private hasStyleChanged(): boolean
	{
		return this._styleDirty;
	}

	public SetText(text:string): void
	{
		this.defObj.text = text;

		if(this.defObj.typewriterEffect)
		{
			this._fullText = text;
			this._typewriterIndex = 0;
			this._typewriterTimer = 0;
		}

		this.DrawVectors();
	}

	public SetTextStyle(style: Partial<PIXI.TextStyleOptions>): void
	{
		this._styleDirty = true;
		this.defObj.textStyle = { ...this.defObj.textStyle, ...style };
		this.DrawVectors();
	}

	public SetAlignment(horizontal?: 'left' | 'center' | 'right' | 'justify', vertical?: 'top' | 'middle' | 'bottom'): void
	{
		if(horizontal) this.defObj.textAlign = horizontal;
		if(vertical) this.defObj.verticalAlign = vertical;

		this.calculateAlignmentOffsets();
		this.updateTextTransform();
	}

	public StartTypewriter(speed?: number): void
	{
		this.defObj.typewriterEffect = true;
		this.defObj.typewriterSpeed = speed ?? 10;
		this._fullText = this.defObj.text ?? "";
		this._typewriterIndex = 0;
		this._typewriterTimer = 0;
	}

	public StopTypewriter(): void
	{
		this.defObj.typewriterEffect = false;
		this._typewriterIndex = this._fullText.length;
		this.DrawVectors();
	}

	private onTextClick(event: PIXI.FederatedPointerEvent): void
	{
		console.log("Text clicked:", this.defObj.text);
	}

	private onTextHover(): void
	{
		if(!this._textField) return;

		this._textField.alpha = 0.8;
		this._textField.scale.set(
			this._textField.scale.x * 1.05,
			this._textField.scale.y * 1.05
		);
	}

	private onTextHoverOut(): void
	{
		if(!this._textField) return;

		// Remove hover effect
		this._textField.alpha = 1;
		const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
		const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;
		this._textField.scale.set(combinedScaleX, combinedScaleY);
	}

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;
		const debug = false;

		if(debug) console.log('CanvasTextObj.Update() >');
		if(this.defObj.typewriterEffect && this._typewriterIndex < this._fullText.length)
		{
			if(debug) console.log('CanvasTextObj.Update() >1> typewriter');
			const speed = this.defObj.typewriterSpeed ?? 10;
			this._typewriterTimer += 16; // Assume 60fps, ~16ms per frame

			const msPerChar = 1000 / speed;
			if(this._typewriterTimer >= msPerChar)
			{
				this._typewriterIndex++;
				this._typewriterTimer = 0;

				if(this._textField)
				{
					this._textField.text = this.getCurrentDisplayText();
				}
			}
		}

		if(this.defObj.fadeInDuration && this._textField)
		{
			if(debug) console.log('CanvasTextObj.Update() >2> fade in effect ');
			const elapsed = Date.now() - this._fadeStartTime;
			const progress = Math.min(elapsed / this.defObj.fadeInDuration, 1);
			this._textField.alpha = progress;
		}

		if(this.defObj.pulseText && this._textField)
		{
			if(debug) console.log('CanvasTextObj.Update() >3> pulse ');
			this._pulseTime += 16;
			const pulseSpeed = this.defObj.pulseSpeed ?? 1;
			const scale = 1 + Math.sin(this._pulseTime * 0.001 * pulseSpeed) * 0.05;

			const baseScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
			const baseScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;

			this._textField.scale.set(baseScaleX * scale, baseScaleY * scale);
		}

		if(this._textField)
		{
			if(debug) console.log('CanvasTextObj.Update() >4> has textfield do stuff ');
			// Use render coordinates (automatically handles parent transforms)
			if(CanvasEngine.get().EngineSettings?.autoScale)
			{
				if(debug) if(onceSecond) console.log('CanvasTextObj.Update() >5> autoscale ');
				let transformedX = this.renderX * CanvasEngine.get().CurrentCanvasScale;
				let transformedY = this.renderY * CanvasEngine.get().CurrentCanvasScale;

				this._textField.x = transformedX + this._alignmentOffsetX * CanvasEngine.get().CurrentCanvasScale;
				this._textField.y = transformedY + this._alignmentOffsetY * CanvasEngine.get().CurrentCanvasScale;

				if(!this.defObj.pulseText)
				{
					if(debug) console.log('CanvasTextObj.Update() >6>  ');
					this._textField.scale.set(
						CanvasEngine.get().CurrentCanvasScale * this.renderXScale,
						CanvasEngine.get().CurrentCanvasScale * this.renderYScale
					);
				}
			}
			else
			{
				if(debug) console.log('CanvasTextObj.Update() >7>  ');
				this._textField.x = this.renderX + this._alignmentOffsetX;
				this._textField.y = this.renderY + this._alignmentOffsetY;

				if(!this.defObj.pulseText)
				{
					if(debug) console.log('CanvasTextObj.Update() >8>  ');
					this._textField.scale.set(this.renderXScale, this.renderYScale);
				}
			}
		}

		super.Update(time, frameCount, onceSecond);
	}

	public Dispose(): void
	{
		if(this._textField)
		{
			// Remove event listeners if interactive
			if(this.defObj.interactive)
			{
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
