/**
 * Canvas Joystick Component
 * A simple virtual joystick for touch/mouse input
 */

import * as PIXI from "pixi.js";
import { BaseUIComponent, UIComponentConfig } from "../base/BaseUIComponent";
import { UIEventBus } from "../base/UIEventBus";
import { UIEventType } from "../base/UIEventTypes";

export interface JoystickConfig extends UIComponentConfig
{
	/** Outer circle radius (default: 50) */
	outerRadius?:number;
	/** Inner thumb radius (default: 20) */
	innerRadius?:number;
	/** Outer circle color */
	outerColor?:number;
	/** Outer circle alpha */
	outerAlpha?:number;
	/** Inner thumb color */
	innerColor?:number;
	/** Inner thumb alpha */
	innerAlpha?:number;
	/** Border color */
	borderColor?:number;
	/** Border width */
	borderWidth?:number;
	/** Called continuously while dragging with normalized x,y (-1 to 1) */
	onMove?:(x:number, y:number) => void;
	/** Called when joystick is released */
	onRelease?:() => void;
	/** Whether to snap back to center on release (default: true) */
	snapBack?:boolean;
	/** Dead zone radius as percentage (0-1, default: 0.1) */
	deadZone?:number;
}

export interface JoystickValue
{
	x:number;
	y:number;
	angle:number;
	distance:number;
}

export class CanvasJoystickObj extends BaseUIComponent
{
	private _joystickConfig!:JoystickConfig;
	private _outerRadius!:number;
	private _innerRadius!:number;
	private _outerColor!:number;
	private _outerAlpha!:number;
	private _innerColor!:number;
	private _innerAlpha!:number;
	private _borderColor!:number;
	private _borderWidth!:number;
	private _snapBack!:boolean;
	private _deadZone!:number;

	// Graphics elements
	private _outerCircle!:PIXI.Graphics;
	private _innerCircle!:PIXI.Graphics;

	// State
	private _isDragging:boolean = false;
	private _thumbX:number = 0;
	private _thumbY:number = 0;
	private _normalizedX:number = 0;
	private _normalizedY:number = 0;

	// Callbacks
	private _onMove?:(x:number, y:number) => void;
	private _onJoystickRelease?:() => void;

	constructor(config:JoystickConfig)
	{
		// Set default size based on outer radius
		const outerRadius = config.outerRadius || 50;
		config.width = config.width || outerRadius * 2;
		config.height = config.height || outerRadius * 2;

		super(config);
	}

	protected InitComponent():void
	{
		const config = this._config as JoystickConfig;
		this._joystickConfig = config;

		// Setup properties
		this._outerRadius = config.outerRadius || 50;
		this._innerRadius = config.innerRadius || 20;
		this._outerColor = config.outerColor ?? 0x333333;
		this._outerAlpha = config.outerAlpha ?? 0.5;
		this._innerColor = config.innerColor ?? 0x666666;
		this._innerAlpha = config.innerAlpha ?? 0.8;
		this._borderColor = config.borderColor ?? 0xFFFFFF;
		this._borderWidth = config.borderWidth ?? 2;
		this._snapBack = config.snapBack !== false;
		this._deadZone = config.deadZone ?? 0.1;

		// Callbacks
		this._onMove = config.onMove;
		this._onJoystickRelease = config.onRelease;

		// Create graphics
		this._outerCircle = new PIXI.Graphics();
		this._innerCircle = new PIXI.Graphics();

		this._container.addChild(this._outerCircle);
		this._container.addChild(this._innerCircle);

		// Set up hit area for the full joystick area
		this._container.hitArea = new PIXI.Circle(this._outerRadius, this._outerRadius, this._outerRadius);

		// Add global pointer move/up listeners for drag tracking outside bounds
		this.setupGlobalListeners();

		// Defer interaction setup until after constructor chain completes
		// This ensures our arrow function handlers are properly assigned
		// (arrow function class properties aren't assigned until after parent constructor)
		Promise.resolve().then(() =>
		{
			// Remove base class handlers (which point to parent's arrow functions)
			this.RemoveInteraction();
			// Re-add with our correct handlers
			this.SetupInteraction();
		});
	}

	private setupGlobalListeners():void
	{
		// Use window-level events for global tracking
		window.addEventListener('pointermove', this.handleGlobalPointerMove);
		window.addEventListener('pointerup', this.handleGlobalPointerUp);
	}

	private removeGlobalListeners():void
	{
		window.removeEventListener('pointermove', this.handleGlobalPointerMove);
		window.removeEventListener('pointerup', this.handleGlobalPointerUp);
	}

	private handleGlobalPointerMove = (event:PointerEvent):void =>
	{
		if(!this._isDragging || !this._enabled) return;

		console.log('%c Joystick global move:', 'color:#00FFFF;', event.clientX, event.clientY);
		this.updateThumbPositionFromGlobal(event.clientX, event.clientY);
	}

	private handleGlobalPointerUp = (event:PointerEvent):void =>
	{
		if(!this._isDragging) return;

		this.doJoystickRelease();
	}

	private doJoystickRelease():void
	{
		console.log('%c Joystick released!', 'color:#FFFF00; font-weight:bold;');
		this._isDragging = false;
		this._pressed = false;

		if(this._snapBack)
		{
			// Reset thumb to center
			this._thumbX = 0;
			this._thumbY = 0;
			this._normalizedX = 0;
			this._normalizedY = 0;

			this.Render();

			// Emit release with zero values
			this._onMove?.(0, 0);
		}

		// Emit release event
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.RELEASE, this));
		this._onJoystickRelease?.();
	}

	private updateThumbPositionFromGlobal(clientX:number, clientY:number):void
	{
		// Convert client coordinates to local container coordinates
		// Get the container's global position
		const globalPos = this._container.getGlobalPosition();
		console.log('%c Joystick globalPos:', 'color:#AAFFAA;', globalPos.x, globalPos.y);

		// Calculate local position relative to container center
		const localX = clientX - globalPos.x;
		const localY = clientY - globalPos.y;

		// Calculate offset from center
		const centerX = this._outerRadius;
		const centerY = this._outerRadius;
		let deltaX = localX - centerX;
		let deltaY = localY - centerY;

		// Calculate distance from center
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const maxDistance = this._outerRadius - this._innerRadius * 0.5;

		// Clamp to outer radius
		if(distance > maxDistance)
		{
			const scale = maxDistance / distance;
			deltaX *= scale;
			deltaY *= scale;
		}

		// Update thumb position
		this._thumbX = deltaX;
		this._thumbY = deltaY;

		// Calculate normalized values (-1 to 1)
		const normalizedDistance = Math.min(distance / maxDistance, 1);
		this._normalizedX = deltaX / maxDistance;
		this._normalizedY = deltaY / maxDistance;

		// Apply dead zone
		if(normalizedDistance < this._deadZone)
		{
			this._normalizedX = 0;
			this._normalizedY = 0;
		}

		// Update value
		const previousValue = this._value;
		this._value = {
			x: this._normalizedX,
			y: this._normalizedY,
			angle: Math.atan2(deltaY, deltaX),
			distance: normalizedDistance
		} as JoystickValue;

		// Re-render
		this.Render();

		// Emit change event
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.CHANGE, this, this._value, previousValue));
		this._onChange?.(this._value, this);

		// Call onMove callback
		this._onMove?.(this._normalizedX, this._normalizedY);
	}

	protected Render():void
	{
		// Clear and draw outer circle
		this._outerCircle.clear();
		this._outerCircle.circle(this._outerRadius, this._outerRadius, this._outerRadius);
		this._outerCircle.fill({ color: this._outerColor, alpha: this._outerAlpha });
		this._outerCircle.stroke({ width: this._borderWidth, color: this._borderColor, alpha: 0.5 });

		// Clear and draw inner circle (thumb) at current position
		this._innerCircle.clear();
		const thumbCenterX = this._outerRadius + this._thumbX;
		const thumbCenterY = this._outerRadius + this._thumbY;
		this._innerCircle.circle(thumbCenterX, thumbCenterY, this._innerRadius);
		this._innerCircle.fill({ color: this._innerColor, alpha: this._innerAlpha });
		this._innerCircle.stroke({ width: this._borderWidth, color: this._borderColor, alpha: 0.8 });

		// Apply disabled state
		this._container.alpha = this._enabled ? 1.0 : 0.4;
	}

	// Override base class arrow function handlers
	// These are arrow functions to match the base class pattern
	protected HandlePointerDown = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;

		console.log('%c Joystick HandlePointerDown!', 'color:#00FF00; font-weight:bold;');
		this._isDragging = true;
		this._pressed = true;

		// Update thumb position
		this.updateThumbPosition(event);

		// Emit press event
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.PRESS, this));
		this._onPress?.(this);
	}

	protected HandlePointerUp = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._isDragging) return;

		this.doJoystickRelease();
	}

	protected HandlePointerOver = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;
		this._hovered = true;
	}

	protected HandlePointerOut = (event:PIXI.FederatedPointerEvent):void =>
	{
		if(!this._enabled) return;
		this._hovered = false;
		// Don't release on pointer out - we want to track dragging outside bounds
	}

	private updateThumbPosition(event:PIXI.FederatedPointerEvent):void
	{
		// Get local position relative to container
		const localPos = this._container.toLocal(event.global);

		// Calculate offset from center
		const centerX = this._outerRadius;
		const centerY = this._outerRadius;
		let deltaX = localPos.x - centerX;
		let deltaY = localPos.y - centerY;

		// Calculate distance from center
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const maxDistance = this._outerRadius - this._innerRadius * 0.5;

		// Clamp to outer radius
		if(distance > maxDistance)
		{
			const scale = maxDistance / distance;
			deltaX *= scale;
			deltaY *= scale;
		}

		// Update thumb position
		this._thumbX = deltaX;
		this._thumbY = deltaY;

		// Calculate normalized values (-1 to 1)
		const normalizedDistance = Math.min(distance / maxDistance, 1);
		this._normalizedX = deltaX / maxDistance;
		this._normalizedY = deltaY / maxDistance;

		// Apply dead zone
		if(normalizedDistance < this._deadZone)
		{
			this._normalizedX = 0;
			this._normalizedY = 0;
		}

		// Update value
		const previousValue = this._value;
		this._value = {
			x: this._normalizedX,
			y: this._normalizedY,
			angle: Math.atan2(deltaY, deltaX),
			distance: normalizedDistance
		} as JoystickValue;

		// Re-render
		this.Render();

		// Emit change event
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.CHANGE, this, this._value, previousValue));
		this._onChange?.(this._value, this);

		// Call onMove callback
		this._onMove?.(this._normalizedX, this._normalizedY);
	}

	/**
	 * Get current joystick value
	 */
	public getValue():JoystickValue
	{
		return this._value || { x: 0, y: 0, angle: 0, distance: 0 };
	}

	/**
	 * Get normalized X value (-1 to 1)
	 */
	public getX():number
	{
		return this._normalizedX;
	}

	/**
	 * Get normalized Y value (-1 to 1)
	 */
	public getY():number
	{
		return this._normalizedY;
	}

	/**
	 * Check if joystick is currently being dragged
	 */
	public isDragging():boolean
	{
		return this._isDragging;
	}

	/**
	 * Reset joystick to center position
	 */
	public reset():void
	{
		this._thumbX = 0;
		this._thumbY = 0;
		this._normalizedX = 0;
		this._normalizedY = 0;
		this._isDragging = false;

		this.Render();
	}

	/**
	 * Set outer circle color
	 */
	public setOuterColor(color:number, alpha?:number):void
	{
		this._outerColor = color;
		if(alpha !== undefined) this._outerAlpha = alpha;
		this.Render();
	}

	/**
	 * Set inner thumb color
	 */
	public setInnerColor(color:number, alpha?:number):void
	{
		this._innerColor = color;
		if(alpha !== undefined) this._innerAlpha = alpha;
		this.Render();
	}

	public Dispose():void
	{
		this.removeGlobalListeners();
		this._outerCircle.destroy();
		this._innerCircle.destroy();
		super.Dispose();
	}
}
