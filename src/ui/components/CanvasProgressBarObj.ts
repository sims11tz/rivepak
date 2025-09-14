/**
 * Canvas Progress Bar Component
 */

import * as PIXI from "pixi.js";
import { BaseUIComponent, UIComponentConfig } from "../base/BaseUIComponent";
import { UIEventBus } from "../base/UIEventBus";
import { UIEventType } from "../base/UIEventTypes";

export type ProgressBarType = 'linear' | 'circular';
export type ProgressBarVariant = 'determinate' | 'indeterminate' | 'buffer';

export interface ProgressBarConfig extends UIComponentConfig
{
	type?:ProgressBarType;
	variant?:ProgressBarVariant;
	value?:number;
	bufferValue?:number;
	min?:number;
	max?:number;
	showLabel?:boolean;
	labelFormat?:(value:number, min:number, max:number) => string;
	color?:number | string;
	backgroundColor?:number | string;
	striped?:boolean;
	animated?:boolean;
	thickness?:number;
	rounded?:boolean;
}

export class CanvasProgressBarObj extends BaseUIComponent
{
	private _progressConfig:ProgressBarConfig;
	private _type:ProgressBarType;
	private _variant:ProgressBarVariant;
	private _min:number;
	private _max:number;
	private _bufferValue:number;
	private _showLabel:boolean;
	private _thickness:number;
	private _rounded:boolean;
	private _striped:boolean;
	private _animatedStripes:boolean;
	
	// Graphics elements
	private _progressFill:PIXI.Graphics;
	private _bufferFill:PIXI.Graphics;
	private _labelText:PIXI.Text | null = null;
	private _stripesContainer:PIXI.Container | null = null;
	private _circularProgress:PIXI.Graphics | null = null;
	
	// Animation
	private _displayValue:number = 0;
	private _targetValue:number = 0;
	private _indeterminateOffset:number = 0;
	private _stripeOffset:number = 0;
	
	constructor(config:ProgressBarConfig)
	{
		// Set default dimensions based on type
		if(config.type === 'circular')
		{
			if(!config.width) config.width = 100;
			if(!config.height) config.height = 100;
		}
		else
		{
			if(!config.width) config.width = 200;
			if(!config.height) config.height = config.thickness || 20;
		}
		
		super(config);
		this._progressConfig = config;
		this._type = config.type || 'linear';
		this._variant = config.variant || 'determinate';
		this._min = config.min || 0;
		this._max = config.max || 100;
		this._value = config.value || 0;
		this._bufferValue = config.bufferValue || 0;
		this._showLabel = config.showLabel !== false;
		this._thickness = config.thickness || 20;
		this._rounded = config.rounded !== false;
		this._striped = config.striped || false;
		this._animatedStripes = config.animated || false;
		
		// Set initial animation values
		this._displayValue = this._value;
		this._targetValue = this._value;
		
		// Create graphics
		this._progressFill = new PIXI.Graphics();
		this._bufferFill = new PIXI.Graphics();
		
		if(this._variant === 'buffer')
		{
			this._container.addChild(this._bufferFill);
		}
		this._container.addChild(this._progressFill);
		
		if(this._type === 'circular')
		{
			this._circularProgress = new PIXI.Graphics();
			this._container.addChild(this._circularProgress);
		}
	}
	
	protected InitComponent():void
	{
		// Create label if needed
		if(this._showLabel)
		{
			this._labelText = new PIXI.Text({
				text: this.formatLabel(this._value),
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.sizeSmall,
					fill: this._type === 'circular' ? this._theme.colors.text : 0xFFFFFF,
					align: 'center',
					fontWeight: 'bold'
				}
			});
			
			this._labelText.anchor.set(0.5, 0.5);
			
			if(this._type === 'circular')
			{
				this._labelText.x = this.width / 2;
				this._labelText.y = this.height / 2;
			}
			else
			{
				this._labelText.x = this.width / 2;
				this._labelText.y = this.height / 2;
			}
			
			this._container.addChild(this._labelText);
		}
		
		// Create stripes if enabled
		if(this._striped && this._type === 'linear')
		{
			this.createStripes();
		}
	}
	
	private createStripes():void
	{
		this._stripesContainer = new PIXI.Container();
		
		const stripeWidth = 20;
		const stripeCount = Math.ceil(this.width / stripeWidth) + 2;
		
		for(let i = 0; i < stripeCount; i++)
		{
			const stripe = new PIXI.Graphics();
			stripe.beginFill(0xFFFFFF, 0.2);
			stripe.moveTo(0, 0);
			stripe.lineTo(stripeWidth / 2, 0);
			stripe.lineTo(0, this._thickness);
			stripe.lineTo(-stripeWidth / 2, this._thickness);
			stripe.closePath();
			stripe.endFill();
			
			stripe.x = i * stripeWidth;
			this._stripesContainer.addChild(stripe);
		}
		
		// Create mask for stripes
		const mask = new PIXI.Graphics();
		mask.beginFill(0xFFFFFF);
		mask.drawRect(0, 0, this.width, this._thickness);
		mask.endFill();
		this._stripesContainer.mask = mask;
		
		this._progressFill.addChild(this._stripesContainer);
	}
	
	protected Render():void
	{
		this._graphics.clear();
		this._progressFill.clear();
		this._bufferFill.clear();
		
		const percentage = (this._displayValue - this._min) / (this._max - this._min);
		const bufferPercentage = (this._bufferValue - this._min) / (this._max - this._min);
		
		if(this._type === 'linear')
		{
			this.renderLinearProgress(percentage, bufferPercentage);
		}
		else
		{
			this.renderCircularProgress(percentage);
		}
		
		// Update label
		if(this._labelText)
		{
			this._labelText.text = this.formatLabel(this._displayValue);
			
			// Adjust label color for contrast
			if(this._type === 'linear')
			{
				const fillWidth = this.width * percentage;
				const labelCenter = this.width / 2;
				this._labelText.style.fill = fillWidth > labelCenter ? 0xFFFFFF : this._theme.colors.text;
			}
		}
		
		// Update stripes animation
		if(this._stripesContainer && this._animatedStripes)
		{
			this._stripesContainer.x = -this._stripeOffset;
		}
		
		// Set container alpha for disabled state
		this._container.alpha = this._enabled ? 1.0 : 0.5;
	}
	
	private renderLinearProgress(percentage:number, bufferPercentage:number):void
	{
		const bgColor = this._progressConfig.backgroundColor || this._theme.colors.border;
		const fillColor = this._progressConfig.color || this._theme.colors.primary;
		const radius = this._rounded ? this._thickness / 2 : 0;
		
		// Draw background
		this._graphics.beginFill(bgColor as number);
		if(this._rounded)
		{
			this._graphics.drawRoundedRect(0, 0, this.width, this._thickness, radius);
		}
		else
		{
			this._graphics.drawRect(0, 0, this.width, this._thickness);
		}
		this._graphics.endFill();
		
		// Draw buffer if needed
		if(this._variant === 'buffer' && bufferPercentage > 0)
		{
			this._bufferFill.beginFill(fillColor as number, 0.3);
			const bufferWidth = this.width * bufferPercentage;
			
			if(this._rounded)
			{
				this._bufferFill.drawRoundedRect(0, 0, bufferWidth, this._thickness, radius);
			}
			else
			{
				this._bufferFill.drawRect(0, 0, bufferWidth, this._thickness);
			}
			this._bufferFill.endFill();
		}
		
		// Draw progress fill
		if(this._variant === 'indeterminate')
		{
			// Animated indeterminate progress
			const barWidth = this.width * 0.3;
			const offset = this._indeterminateOffset % (this.width + barWidth);
			
			this._progressFill.beginFill(fillColor as number);
			if(this._rounded)
			{
				this._progressFill.drawRoundedRect(
					offset - barWidth,
					0,
					barWidth,
					this._thickness,
					radius
				);
			}
			else
			{
				this._progressFill.drawRect(
					offset - barWidth,
					0,
					barWidth,
					this._thickness
				);
			}
			this._progressFill.endFill();
			
			// Apply mask to clip at boundaries
			const mask = new PIXI.Graphics();
			mask.beginFill(0xFFFFFF);
			mask.drawRect(0, 0, this.width, this._thickness);
			mask.endFill();
			this._progressFill.mask = mask;
		}
		else if(percentage > 0)
		{
			// Determinate progress
			const fillWidth = this.width * percentage;
			
			this._progressFill.beginFill(fillColor as number);
			if(this._rounded)
			{
				this._progressFill.drawRoundedRect(0, 0, fillWidth, this._thickness, radius);
			}
			else
			{
				this._progressFill.drawRect(0, 0, fillWidth, this._thickness);
			}
			this._progressFill.endFill();
		}
	}
	
	private renderCircularProgress(percentage:number):void
	{
		if(!this._circularProgress) return;
		
		this._circularProgress.clear();
		
		const centerX = this.width / 2;
		const centerY = this.height / 2;
		const radius = Math.min(this.width, this.height) / 2 - this._thickness / 2;
		const bgColor = this._progressConfig.backgroundColor || this._theme.colors.border;
		const fillColor = this._progressConfig.color || this._theme.colors.primary;
		
		// Draw background circle
		this._graphics.clear();
		this._graphics.lineStyle(this._thickness, bgColor as number);
		this._graphics.drawCircle(centerX, centerY, radius);
		
		if(this._variant === 'indeterminate')
		{
			// Animated spinning arc
			const startAngle = this._indeterminateOffset * Math.PI / 180;
			const endAngle = startAngle + Math.PI / 2;
			
			this._circularProgress.lineStyle(this._thickness, fillColor as number);
			this._circularProgress.arc(
				centerX,
				centerY,
				radius,
				startAngle - Math.PI / 2,
				endAngle - Math.PI / 2
			);
		}
		else if(percentage > 0)
		{
			// Determinate arc
			const angle = percentage * Math.PI * 2;
			
			this._circularProgress.lineStyle(this._thickness, fillColor as number);
			this._circularProgress.arc(
				centerX,
				centerY,
				radius,
				-Math.PI / 2,
				angle - Math.PI / 2
			);
		}
	}
	
	private formatLabel(value:number):string
	{
		if(this._progressConfig.labelFormat)
		{
			return this._progressConfig.labelFormat(value, this._min, this._max);
		}
		
		const percentage = ((value - this._min) / (this._max - this._min)) * 100;
		return `${Math.round(percentage)}%`;
	}
	
	protected UpdateAnimation(progress:number):void
	{
		// Easing function
		const eased = 1 - Math.pow(1 - progress, 3);
		
		// Update display value
		const valueDiff = this._targetValue - this._displayValue;
		this._displayValue += valueDiff * eased;
		
		this.Render();
	}
	
	/**
	 * Update animation frame
	 */
	public Update(time:number, frameCount:number, onceSecond:boolean):void
	{
		super.Update(time, frameCount, onceSecond);
		
		// Update indeterminate animation
		if(this._variant === 'indeterminate')
		{
			if(this._type === 'linear')
			{
				this._indeterminateOffset += 2;
			}
			else
			{
				this._indeterminateOffset += 3;
			}
			this.Render();
		}
		
		// Update stripe animation
		if(this._animatedStripes && this._stripesContainer)
		{
			this._stripeOffset += 0.5;
			if(this._stripeOffset > 20)
			{
				this._stripeOffset = 0;
			}
			this.Render();
		}
	}
	
	/**
	 * Set progress value
	 */
	public setValue(value:number):void
	{
		// Clamp value
		value = Math.max(this._min, Math.min(this._max, value));
		
		if(value !== this._value)
		{
			const previousValue = this._value;
			this._value = value;
			this._targetValue = value;
			
			// Start animation
			this.StartAnimation();
			
			// Emit change event
			UIEventBus.emit(UIEventBus.createEvent(
				UIEventType.CHANGE,
				this,
				this._value,
				previousValue
			));
			
			this._onChange?.(this._value, this);
			
			// Check for completion
			if(this._value >= this._max)
			{
				UIEventBus.emit(UIEventBus.createEvent(
					UIEventType.COMPLETE,
					this,
					this._value
				));
			}
		}
	}
	
	/**
	 * Set buffer value
	 */
	public setBufferValue(value:number):void
	{
		// Clamp value
		value = Math.max(this._min, Math.min(this._max, value));
		
		if(value !== this._bufferValue)
		{
			this._bufferValue = value;
			this.Render();
		}
	}
	
	/**
	 * Get percentage
	 */
	public getPercentage():number
	{
		return ((this._value - this._min) / (this._max - this._min)) * 100;
	}
	
	/**
	 * Set percentage
	 */
	public setPercentage(percentage:number):void
	{
		percentage = Math.max(0, Math.min(100, percentage));
		const value = this._min + ((this._max - this._min) * percentage / 100);
		this.setValue(value);
	}
	
	/**
	 * Increment value
	 */
	public increment(amount:number = 1):void
	{
		this.setValue(this._value + amount);
	}
	
	/**
	 * Decrement value
	 */
	public decrement(amount:number = 1):void
	{
		this.setValue(this._value - amount);
	}
	
	/**
	 * Reset to minimum
	 */
	public reset():void
	{
		this.setValue(this._min);
	}
	
	/**
	 * Set to maximum (complete)
	 */
	public complete():void
	{
		this.setValue(this._max);
	}
	
	/**
	 * Set variant
	 */
	public setVariant(variant:ProgressBarVariant):void
	{
		this._variant = variant;
		this.Render();
	}
	
	/**
	 * Toggle animation
	 */
	public setAnimated(animated:boolean):void
	{
		this._animatedStripes = animated;
	}
	
	/**
	 * Set color
	 */
	public setColor(color:number | string):void
	{
		this._progressConfig.color = color;
		this.Render();
	}
	
	/**
	 * Show/hide label
	 */
	public setShowLabel(show:boolean):void
	{
		this._showLabel = show;
		if(this._labelText)
		{
			this._labelText.visible = show;
		}
	}
}