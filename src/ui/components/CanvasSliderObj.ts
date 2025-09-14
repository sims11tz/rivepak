/**
 * Canvas Slider Component
 */

import * as PIXI from "pixi.js";
import { BaseUIComponent, UIComponentConfig } from "../base/BaseUIComponent";
import { UIEventBus } from "../base/UIEventBus";
import { UIEventType, ChangeCallback } from "../base/UIEventTypes";

export interface SliderConfig extends UIComponentConfig
{
	min:number;
	max:number;
	value?:number;
	step?:number;
	orientation?:'horizontal' | 'vertical';
	showValue?:boolean;
	showTicks?:boolean;
	tickInterval?:number;
	valueFormatter?:(value:number) => string;
	onSlideStart?:() => void;
	onSlideEnd?:() => void;
}

export class CanvasSliderObj extends BaseUIComponent
{
	private _sliderConfig:SliderConfig;
	private _min:number;
	private _max:number;
	private _step:number;
	private _orientation:'horizontal' | 'vertical';
	private _showValue:boolean;
	private _valueText:PIXI.Text | null = null;
	
	// Graphics elements
	private _track:PIXI.Graphics;
	private _fill:PIXI.Graphics;
	private _thumb:PIXI.Graphics;
	
	// Dragging state
	private _isDragging:boolean = false;
	private _dragStartX:number = 0;
	private _dragStartY:number = 0;
	private _dragStartValue:number = 0;
	
	// Thumb animation
	private _thumbScale:number = 1;
	private _targetThumbScale:number = 1;
	
	constructor(config:SliderConfig)
	{
		// Set default dimensions based on orientation
		if(!config.width || !config.height)
		{
			if(config.orientation === 'vertical')
			{
				config.width = config.width || 40;
				config.height = config.height || 200;
			}
			else
			{
				config.width = config.width || 200;
				config.height = config.height || 40;
			}
		}
		
		super(config);
		this._sliderConfig = config;
		this._min = config.min;
		this._max = config.max;
		this._step = config.step || 1;
		this._orientation = config.orientation || 'horizontal';
		this._showValue = config.showValue || false;
		this._value = config.value !== undefined ? 
		              Math.max(this._min, Math.min(this._max, config.value)) : 
		              this._min;
		
		// Create graphics
		this._track = new PIXI.Graphics();
		this._fill = new PIXI.Graphics();
		this._thumb = new PIXI.Graphics();
		
		this._container.addChild(this._track);
		this._container.addChild(this._fill);
		this._container.addChild(this._thumb);
	}
	
	protected InitComponent():void
	{
		// Create value text if needed
		if(this._showValue)
		{
			this._valueText = new PIXI.Text({
				text: this.formatValue(this._value),
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.sizeSmall,
					fill: this._theme.colors.text,
					align: 'center'
				}
			});
			this._valueText.anchor.set(0.5, 0.5);
			this._container.addChild(this._valueText);
		}
		
		// Setup thumb interaction
		this._thumb.eventMode = 'static';
		this._thumb.cursor = 'pointer';
		this._thumb.on('pointerdown', this.HandleThumbDown, this);
		
		// Setup global pointer events for dragging
		const stage = this._container.parent as PIXI.Container;
		if(stage)
		{
			stage.eventMode = 'static';
			stage.on('pointermove', this.HandlePointerMove, this);
			stage.on('pointerup', this.HandlePointerUpGlobal, this);
			stage.on('pointerupoutside', this.HandlePointerUpGlobal, this);
		}
	}
	
	protected Render():void
	{
		const isHorizontal = this._orientation === 'horizontal';
		const trackThickness = isHorizontal ? this.height * 0.25 : this.width * 0.25;
		const thumbRadius = Math.min(this.width, this.height) * 0.4;
		
		// Clear all graphics
		this._track.clear();
		this._fill.clear();
		this._thumb.clear();
		
		// Calculate positions
		const percentage = (this._value - this._min) / (this._max - this._min);
		let thumbX:number, thumbY:number;
		
		if(isHorizontal)
		{
			const trackY = (this.height - trackThickness) / 2;
			
			// Draw track
			this._track.beginFill(this._theme.colors.border);
			this._track.drawRoundedRect(0, trackY, this.width, trackThickness, trackThickness / 2);
			this._track.endFill();
			
			// Draw fill
			const fillWidth = this.width * percentage;
			if(fillWidth > 0)
			{
				this._fill.beginFill(this._theme.colors.primary);
				this._fill.drawRoundedRect(0, trackY, fillWidth, trackThickness, trackThickness / 2);
				this._fill.endFill();
			}
			
			// Calculate thumb position
			thumbX = percentage * this.width;
			thumbY = this.height / 2;
		}
		else // vertical
		{
			const trackX = (this.width - trackThickness) / 2;
			
			// Draw track
			this._track.beginFill(this._theme.colors.border);
			this._track.drawRoundedRect(trackX, 0, trackThickness, this.height, trackThickness / 2);
			this._track.endFill();
			
			// Draw fill (from bottom up)
			const fillHeight = this.height * percentage;
			if(fillHeight > 0)
			{
				this._fill.beginFill(this._theme.colors.primary);
				this._fill.drawRoundedRect(
					trackX, 
					this.height - fillHeight, 
					trackThickness, 
					fillHeight, 
					trackThickness / 2
				);
				this._fill.endFill();
			}
			
			// Calculate thumb position
			thumbX = this.width / 2;
			thumbY = this.height - (percentage * this.height);
		}
		
		// Draw thumb
		const thumbColor = this._isDragging ? this._theme.colors.primaryActive :
		                   this._hovered ? this._theme.colors.primaryHover :
		                   this._theme.colors.primary;
		
		this._thumb.beginFill(0xFFFFFF);
		this._thumb.lineStyle(2, thumbColor);
		this._thumb.drawCircle(0, 0, thumbRadius);
		this._thumb.endFill();
		
		// Add shadow to thumb
		const shadow = new PIXI.Graphics();
		shadow.beginFill(0x000000, 0.2);
		shadow.drawCircle(2, 2, thumbRadius);
		shadow.endFill();
		this._thumb.addChildAt(shadow, 0);
		
		// Position thumb
		this._thumb.x = thumbX;
		this._thumb.y = thumbY;
		this._thumb.scale.set(this._thumbScale);
		
		// Set thumb hit area
		this._thumb.hitArea = new PIXI.Circle(0, 0, thumbRadius * 1.5);
		
		// Update value text
		if(this._valueText)
		{
			this._valueText.text = this.formatValue(this._value);
			
			if(isHorizontal)
			{
				this._valueText.x = this.width / 2;
				this._valueText.y = -10;
			}
			else
			{
				this._valueText.x = this.width + 15;
				this._valueText.y = this.height / 2;
			}
		}
		
		// Set container alpha for disabled state
		this._container.alpha = this._enabled ? 1.0 : 0.5;
	}
	
	private HandleThumbDown = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;
		
		this._isDragging = true;
		this._dragStartX = event.globalX;
		this._dragStartY = event.globalY;
		this._dragStartValue = this._value;
		
		// Start drag animation
		this._targetThumbScale = 1.2;
		this.StartAnimation();
		
		// Emit slide start event
		this._sliderConfig.onSlideStart?.();
		
		event.stopPropagation();
	}
	
	private HandlePointerMove = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._isDragging || !this._enabled) return;
		
		const isHorizontal = this._orientation === 'horizontal';
		let delta:number;
		let range:number;
		
		if(isHorizontal)
		{
			delta = event.globalX - this._dragStartX;
			range = this.width;
		}
		else
		{
			delta = -(event.globalY - this._dragStartY); // Invert for vertical
			range = this.height;
		}
		
		// Calculate new value
		const percentChange = delta / range;
		const valueChange = percentChange * (this._max - this._min);
		let newValue = this._dragStartValue + valueChange;
		
		// Apply step
		if(this._step > 0)
		{
			newValue = Math.round(newValue / this._step) * this._step;
		}
		
		// Clamp value
		newValue = Math.max(this._min, Math.min(this._max, newValue));
		
		// Update value if changed
		if(newValue !== this._value)
		{
			this.setValue(newValue);
		}
	}
	
	protected HandlePointerUpGlobal = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._isDragging) return;
		
		this._isDragging = false;
		
		// End drag animation
		this._targetThumbScale = 1.0;
		this.StartAnimation();
		
		// Emit slide end event
		this._sliderConfig.onSlideEnd?.();
		
		this.Render();
	}
	
	protected HandlePointerDown = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled || this._isDragging) return;
		
		// Calculate value from click position
		const localPos = this._container.toLocal(event.global);
		const isHorizontal = this._orientation === 'horizontal';
		let percentage:number;
		
		if(isHorizontal)
		{
			percentage = localPos.x / this.width;
		}
		else
		{
			percentage = 1 - (localPos.y / this.height); // Invert for vertical
		}
		
		// Calculate and set new value
		percentage = Math.max(0, Math.min(1, percentage));
		let newValue = this._min + (percentage * (this._max - this._min));
		
		// Apply step
		if(this._step > 0)
		{
			newValue = Math.round(newValue / this._step) * this._step;
		}
		
		// Update value
		this.setValue(newValue);
		
		// Start click animation
		this._targetThumbScale = 0.9;
		this.StartAnimation();
		setTimeout(() => {
			this._targetThumbScale = 1.0;
			this.StartAnimation();
		}, 100);
		
		super.HandlePointerDown(event);
	}
	
	protected UpdateAnimation(progress:number):void
	{
		// Easing function (ease-out-cubic)
		const eased = 1 - Math.pow(1 - progress, 3);
		
		// Update thumb scale
		const scaleDiff = this._targetThumbScale - this._thumbScale;
		this._thumbScale += scaleDiff * eased;
		
		// Apply scale
		if(this._thumb)
		{
			this._thumb.scale.set(this._thumbScale);
		}
	}
	
	private formatValue(value:number):string
	{
		if(this._sliderConfig.valueFormatter)
		{
			return this._sliderConfig.valueFormatter(value);
		}
		
		// Default formatting
		if(this._step >= 1)
		{
			return Math.round(value).toString();
		}
		else
		{
			const decimals = this._step.toString().split('.')[1]?.length || 1;
			return value.toFixed(decimals);
		}
	}
	
	/**
	 * Override setValue to handle slider-specific logic
	 */
	public setValue(value:number):void
	{
		// Clamp value
		value = Math.max(this._min, Math.min(this._max, value));
		
		// Apply step
		if(this._step > 0)
		{
			value = Math.round(value / this._step) * this._step;
		}
		
		if(value !== this._value)
		{
			const previousValue = this._value;
			this._value = value;
			
			// Emit change event
			UIEventBus.emit(UIEventBus.createEvent(UIEventType.CHANGE, this, value, previousValue));
			this._onChange?.(value, this);
			
			// Re-render
			this.Render();
		}
	}
	
	/**
	 * Get slider percentage (0-1)
	 */
	public getPercentage():number
	{
		return (this._value - this._min) / (this._max - this._min);
	}
	
	/**
	 * Set slider by percentage (0-1)
	 */
	public setPercentage(percentage:number):void
	{
		percentage = Math.max(0, Math.min(1, percentage));
		const value = this._min + (percentage * (this._max - this._min));
		this.setValue(value);
	}
	
	/**
	 * Dispose
	 */
	public Dispose():void
	{
		// Remove thumb event listeners
		if(this._thumb)
		{
			this._thumb.off('pointerdown', this.HandleThumbDown, this);
		}
		
		// Remove stage event listeners
		const stage = this._container.parent as PIXI.Container;
		if(stage)
		{
			stage.off('pointermove', this.HandlePointerMove, this);
			stage.off('pointerup', this.HandlePointerUp, this);
			stage.off('pointerupoutside', this.HandlePointerUp, this);
		}
		
		super.Dispose();
	}
}