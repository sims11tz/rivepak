/**
 * Base UI Component for all RivePak UI elements
 */

import * as PIXI from "pixi.js";
import { BaseCanvasObj, CanvasObjectDef } from "../../canvasObjects/_baseCanvasObj";
import { PIXI_LAYER, PixiController } from "../../controllers/PixiController";
import { UITheme, UIThemeManager } from "./UITheme";
import { UIEventBus } from "./UIEventBus";
import { UIEventType, ChangeCallback, InteractionCallback } from "./UIEventTypes";
import { CanvasEngine } from "../../useCanvasEngine";

export interface UIComponentConfig extends CanvasObjectDef
{
	// Base properties
	enabled?:boolean;
	visible?:boolean;
	theme?:string | UITheme;
	
	// Validation
	required?:boolean;
	validationMessage?:string;
	
	// Callbacks
	onChange?:ChangeCallback;
	onDown?:InteractionCallback;
	onUp?:InteractionCallback;
	onPress?:InteractionCallback;
	onRelease?:InteractionCallback;
	onOver?:InteractionCallback;
	onOut?:InteractionCallback;
	onFocus?:InteractionCallback;
	onBlur?:InteractionCallback;
	
	// Animation
	animated?:boolean;
	animationDuration?:number;
}

export abstract class BaseUIComponent extends BaseCanvasObj
{
	protected _container:PIXI.Container;
	protected _graphics:PIXI.Graphics;
	protected _theme:UITheme;
	protected _config:UIComponentConfig;
	
	// State
	protected _enabled:boolean = true;
	protected _visible:boolean = true;
	protected _focused:boolean = false;
	protected _hovered:boolean = false;
	protected _pressed:boolean = false;
	protected _value:any = null;
	
	// Validation
	protected _required:boolean = false;
	protected _isValid:boolean = true;
	protected _validationMessage:string = '';
	
	// Animation
	protected _animated:boolean = true;
	protected _animationDuration:number = 200;
	protected _animationStartTime:number = 0;
	protected _animating:boolean = false;
	
	// Callbacks
	protected _onChange?:ChangeCallback;
	protected _onDown?:InteractionCallback;
	protected _onUp?:InteractionCallback;
	protected _onPress?:InteractionCallback;
	protected _onRelease?:InteractionCallback;
	protected _onOver?:InteractionCallback;
	protected _onOut?:InteractionCallback;
	protected _onFocus?:InteractionCallback;
	protected _onBlur?:InteractionCallback;
	
	constructor(config:UIComponentConfig)
	{
		super(config);
		this._config = config;
		
		// Set theme
		if(typeof config.theme === 'string')
		{
			this._theme = UIThemeManager.GetTheme(config.theme) || UIThemeManager.Current;
		}
		else if(config.theme)
		{
			this._theme = config.theme;
		}
		else
		{
			this._theme = UIThemeManager.Current;
		}
		
		// Initialize state
		this._enabled = config.enabled !== false;
		this._visible = config.visible !== false;
		this._required = config.required || false;
		this._animated = config.animated !== false;
		this._animationDuration = config.animationDuration || this._theme.animation.duration;
		
		// Set callbacks
		this._onChange = config.onChange;
		this._onDown = config.onDown;
		this._onUp = config.onUp;
		this._onPress = config.onPress;
		this._onRelease = config.onRelease;
		this._onOver = config.onOver;
		this._onOut = config.onOut;
		this._onFocus = config.onFocus;
		this._onBlur = config.onBlur;
		
		// Create PIXI container and graphics
		this._container = new PIXI.Container();
		this._graphics = new PIXI.Graphics();
		this._container.addChild(this._graphics);
		
		// Add to PIXI stage
		const pixiLayer = config.pixiLayer || PIXI_LAYER.ABOVE;
		PixiController.get().GetPixiInstance(pixiLayer).stage.addChild(this._container);
		
		// Set position and size
		this.x = config.x || 0;
		this.y = config.y || 0;
		this.width = config.width || 100;
		this.height = config.height || 40;
		
		// Initialize component
		this.InitComponent();
		
		// Setup interaction
		if(this._enabled)
		{
			this.SetupInteraction();
		}
		
		// Initial render
		this.Render();
	}
	
	/**
	 * Initialize the component - override in subclasses
	 */
	protected abstract InitComponent():void;
	
	/**
	 * Render the component - override in subclasses
	 */
	protected abstract Render():void;
	
	/**
	 * Setup interaction handlers
	 */
	protected SetupInteraction():void
	{
		this._container.eventMode = 'static';
		this._container.cursor = 'pointer';
		
		// Mouse/touch events
		this._container.on('pointerdown', this.HandlePointerDown, this);
		this._container.on('pointerup', this.HandlePointerUp, this);
		this._container.on('pointerupoutside', this.HandlePointerUp, this);
		this._container.on('pointerover', this.HandlePointerOver, this);
		this._container.on('pointerout', this.HandlePointerOut, this);
	}
	
	/**
	 * Remove interaction handlers
	 */
	protected RemoveInteraction():void
	{
		this._container.eventMode = 'none';
		this._container.cursor = 'default';
		
		this._container.off('pointerdown', this.HandlePointerDown, this);
		this._container.off('pointerup', this.HandlePointerUp, this);
		this._container.off('pointerupoutside', this.HandlePointerUp, this);
		this._container.off('pointerover', this.HandlePointerOver, this);
		this._container.off('pointerout', this.HandlePointerOut, this);
	}
	
	/**
	 * Handle pointer down
	 */
	protected HandlePointerDown = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;
		
		this._pressed = true;
		this.Render();
		
		// Emit events
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.DOWN, this));
		this._onDown?.(this);
		this._onPress?.(this);
	}
	
	/**
	 * Handle pointer up
	 */
	protected HandlePointerUp = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;
		
		const wasPressed = this._pressed;
		this._pressed = false;
		this.Render();
		
		if(wasPressed)
		{
			// Emit events
			UIEventBus.emit(UIEventBus.createEvent(UIEventType.UP, this));
			UIEventBus.emit(UIEventBus.createEvent(UIEventType.CLICK, this));
			this._onUp?.(this);
			this._onRelease?.(this);
		}
	}
	
	/**
	 * Handle pointer over
	 */
	protected HandlePointerOver = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;
		
		this._hovered = true;
		this.Render();
		
		// Emit events
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.OVER, this));
		this._onOver?.(this);
	}
	
	/**
	 * Handle pointer out
	 */
	protected HandlePointerOut = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;
		
		this._hovered = false;
		this._pressed = false;
		this.Render();
		
		// Emit events
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.OUT, this));
		this._onOut?.(this);
	}
	
	/**
	 * Get component value
	 */
	public getValue():any
	{
		return this._value;
	}
	
	/**
	 * Set component value
	 */
	public setValue(value:any):void
	{
		const previousValue = this._value;
		this._value = value;
		
		// Emit change event
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.CHANGE, this, value, previousValue));
		this._onChange?.(value, this);
		
		// Re-render
		this.Render();
	}
	
	/**
	 * Enable/disable component
	 */
	public setEnabled(enabled:boolean):void
	{
		this._enabled = enabled;
		
		if(enabled)
		{
			this.SetupInteraction();
			UIEventBus.emit(UIEventBus.createEvent(UIEventType.ENABLE, this));
		}
		else
		{
			this.RemoveInteraction();
			UIEventBus.emit(UIEventBus.createEvent(UIEventType.DISABLE, this));
		}
		
		this.Render();
	}
	
	/**
	 * Show/hide component
	 */
	public setVisible(visible:boolean):void
	{
		this._visible = visible;
		this._container.visible = visible;
		
		UIEventBus.emit(UIEventBus.createEvent(
			visible ? UIEventType.SHOW : UIEventType.HIDE,
			this
		));
	}
	
	/**
	 * Validate component
	 */
	public validate():boolean
	{
		if(this._required)
		{
			const value = this.getValue();
			
			if(value === null || value === undefined || value === '' || 
			   (typeof value === 'string' && value.trim() === ''))
			{
				this._isValid = false;
				this._validationMessage = 'This field is required';
			}
			else
			{
				this._isValid = true;
				this._validationMessage = '';
			}
		}
		else
		{
			this._isValid = true;
			this._validationMessage = '';
		}
		
		// Emit validation event
		UIEventBus.emit(UIEventBus.createEvent(
			this._isValid ? UIEventType.VALID : UIEventType.INVALID,
			this,
			this._isValid,
			!this._isValid,
			{ message: this._validationMessage }
		));
		
		this.Render();
		return this._isValid;
	}
	
	/**
	 * Update component - called by CanvasEngine
	 */
	public Update(time:number, frameCount:number, onceSecond:boolean):void
	{
		if(!this._visible) return;
		
		// Handle animations
		if(this._animating)
		{
			const elapsed = Date.now() - this._animationStartTime;
			const progress = Math.min(elapsed / this._animationDuration, 1);
			
			this.UpdateAnimation(progress);
			
			if(progress >= 1)
			{
				this._animating = false;
				UIEventBus.emit(UIEventBus.createEvent(UIEventType.ANIMATION_END, this));
			}
		}
		
		// Update container position
		if(CanvasEngine.get().EngineSettings?.autoScale)
		{
			const scale = CanvasEngine.get().CurrentCanvasScale;
			this._container.x = this.x * scale;
			this._container.y = this.y * scale;
			this._container.scale.set(scale, scale);
		}
		else
		{
			this._container.x = this.x;
			this._container.y = this.y;
		}
	}
	
	/**
	 * Update animation - override in subclasses for custom animations
	 */
	protected UpdateAnimation(progress:number):void
	{
		// Default: no animation
	}
	
	/**
	 * Get the PIXI container for this component
	 */
	public getContainer():PIXI.Container
	{
		return this._container;
	}

	/**
	 * Start an animation
	 */
	protected StartAnimation():void
	{
		if(this._animated)
		{
			this._animating = true;
			this._animationStartTime = Date.now();
			UIEventBus.emit(UIEventBus.createEvent(UIEventType.ANIMATION_START, this));
		}
	}
	
	/**
	 * Set theme
	 */
	public setTheme(theme:string | UITheme):void
	{
		if(typeof theme === 'string')
		{
			this._theme = UIThemeManager.GetTheme(theme) || UIThemeManager.Current;
		}
		else
		{
			this._theme = theme;
		}
		
		this.Render();
	}
	
	/**
	 * Get current state color based on interaction state
	 */
	protected getStateColor(baseColor:number, hoverColor:number, activeColor:number):number
	{
		if(this._pressed) return activeColor;
		if(this._hovered) return hoverColor;
		return baseColor;
	}
	
	/**
	 * Dispose component
	 */
	public Dispose():void
	{
		// Remove interaction
		this.RemoveInteraction();
		
		// Clear event listeners
		UIEventBus.clearComponentListeners(this);
		
		// Remove from PIXI stage
		if(this._container.parent)
		{
			this._container.parent.removeChild(this._container);
		}
		
		// Destroy PIXI objects
		this._graphics.destroy();
		this._container.destroy();
		
		// Call parent dispose
		super.Dispose();
	}
}