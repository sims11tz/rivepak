/**
 * Canvas Tooltip Component
 */

import * as PIXI from "pixi.js";
import { BaseUIComponent, UIComponentConfig } from "../base/BaseUIComponent";

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual';

export interface TooltipConfig extends UIComponentConfig
{
	content:string | PIXI.Container;
	target?:BaseUIComponent | PIXI.Container;
	placement?:TooltipPlacement;
	trigger?:TooltipTrigger;
	delay?:number;
	offset?:number;
	maxWidth?:number;
	showArrow?:boolean;
	autoHide?:boolean;
	hideDelay?:number;
}

export class CanvasTooltipObj extends BaseUIComponent
{
	private _tooltipConfig:TooltipConfig;
	private _content:string | PIXI.Container;
	private _target:BaseUIComponent | PIXI.Container | null;
	private _pixiTarget:PIXI.Container | null = null;
	private _placement:TooltipPlacement;
	private _trigger:TooltipTrigger;
	private _delay:number;
	private _offset:number;
	private _maxWidth:number;
	private _showArrow:boolean;
	
	private _tooltipContainer:PIXI.Container;
	private _tooltipBg:PIXI.Graphics;
	private _tooltipArrow:PIXI.Graphics;
	private _tooltipContent:PIXI.Text | PIXI.Container | null = null;
	
	// State
	private _isShowing:boolean = false;
	private _showTimer:number | null = null;
	private _hideTimer:number | null = null;
	
	// Animation
	private _tooltipAlpha:number = 0;
	private _targetAlpha:number = 0;
	private _tooltipScale:number = 0.9;
	private _targetScale:number = 0.9;
	
	constructor(config:TooltipConfig)
	{
		// Tooltips don't have fixed dimensions initially
		if(!config.width) config.width = 0;
		if(!config.height) config.height = 0;
		
		super(config);
		this._tooltipConfig = config;
		this._content = config.content;
		this._target = config.target || null;
		this._placement = config.placement || 'top';
		this._trigger = config.trigger || 'hover';
		this._delay = config.delay || 500;
		this._offset = config.offset || 8;
		this._maxWidth = config.maxWidth || 300;
		this._showArrow = config.showArrow !== false;
		
		// Create tooltip container
		this._tooltipContainer = new PIXI.Container();
		this._tooltipBg = new PIXI.Graphics();
		this._tooltipArrow = new PIXI.Graphics();
		
		this._tooltipContainer.addChild(this._tooltipBg);
		if(this._showArrow)
		{
			this._tooltipContainer.addChild(this._tooltipArrow);
		}
		
		// Initially hidden
		this._tooltipContainer.visible = false;
		this._tooltipContainer.alpha = 0;
		
		// Don't add to regular container, will be added to stage
		this._container.visible = false;
	}
	
	protected InitComponent():void
	{
		// Create content
		if(typeof this._content === 'string')
		{
			this._tooltipContent = new PIXI.Text({
				text: this._content,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.sizeSmall,
					fill: 0xFFFFFF,
					align: 'left',
					wordWrap: true,
					wordWrapWidth: this._maxWidth - (this._theme.spacing.small * 2)
				}
			});
			this._tooltipContent.x = this._theme.spacing.small;
			this._tooltipContent.y = this._theme.spacing.small;
		}
		else
		{
			this._tooltipContent = this._content;
		}
		
		if(this._tooltipContent)
		{
			this._tooltipContainer.addChild(this._tooltipContent);
		}
		
		// Setup target listeners if provided
		if(this._target)
		{
			this.attachToTarget(this._target);
		}
		
		// Add tooltip to stage when ready
		if(this._container.parent)
		{
			const stage = this.findStage(this._container.parent);
			if(stage)
			{
				stage.addChild(this._tooltipContainer);
			}
		}
	}
	
	private findStage(container:PIXI.Container):PIXI.Container | null
	{
		let current = container;
		while(current.parent)
		{
			current = current.parent as PIXI.Container;
		}
		return current;
	}
	
	private attachToTarget(target:BaseUIComponent | PIXI.Container):void
	{
		this._target = target;
		
		// Get the actual PIXI container to attach events to
		this._pixiTarget = target instanceof BaseUIComponent ? target.getContainer() : target;
		
		// Setup event listeners based on trigger
		switch(this._trigger)
		{
			case 'hover':
				this._pixiTarget.eventMode = 'static';
				this._pixiTarget.on('pointerover', this.handleTargetOver, this);
				this._pixiTarget.on('pointerout', this.handleTargetOut, this);
				break;
			
			case 'click':
				this._pixiTarget.eventMode = 'static';
				this._pixiTarget.cursor = 'pointer';
				this._pixiTarget.on('pointerdown', this.handleTargetClick, this);
				break;
			
			case 'focus':
				if('on' in this._pixiTarget)
				{
					this._pixiTarget.on('focus', this.handleTargetFocus, this);
					this._pixiTarget.on('blur', this.handleTargetBlur, this);
				}
				break;
		}
	}
	
	private handleTargetOver = ():void =>
	{
		this.scheduleShow();
	}
	
	private handleTargetOut = ():void =>
	{
		this.scheduleHide();
	}
	
	private handleTargetClick = ():void =>
	{
		if(this._isShowing)
		{
			this.hide();
		}
		else
		{
			this.show();
		}
	}
	
	private handleTargetFocus = ():void =>
	{
		this.show();
	}
	
	private handleTargetBlur = ():void =>
	{
		this.hide();
	}
	
	private scheduleShow():void
	{
		// Clear any hide timer
		if(this._hideTimer !== null)
		{
			clearTimeout(this._hideTimer);
			this._hideTimer = null;
		}
		
		// Schedule show with delay
		if(!this._isShowing && this._showTimer === null)
		{
			this._showTimer = setTimeout(() => {
				this.show();
				this._showTimer = null;
			}, this._delay) as any;
		}
	}
	
	private scheduleHide():void
	{
		// Clear any show timer
		if(this._showTimer !== null)
		{
			clearTimeout(this._showTimer);
			this._showTimer = null;
		}
		
		// Schedule hide with delay
		if(this._isShowing && this._hideTimer === null)
		{
			const hideDelay = this._tooltipConfig.hideDelay || 200;
			this._hideTimer = setTimeout(() => {
				this.hide();
				this._hideTimer = null;
			}, hideDelay) as any;
		}
	}
	
	protected Render():void
	{
		if(!this._tooltipContent) return;
		
		// Calculate tooltip dimensions
		const contentBounds = this._tooltipContent.getBounds();
		const tooltipWidth = contentBounds.width + (this._theme.spacing.small * 2);
		const tooltipHeight = contentBounds.height + (this._theme.spacing.small * 2);
		
		// Draw background
		this._tooltipBg.clear();
		this._tooltipBg.beginFill(0x2C2C2C);
		this._tooltipBg.drawRoundedRect(0, 0, tooltipWidth, tooltipHeight, 4);
		this._tooltipBg.endFill();
		
		// Draw arrow if enabled
		if(this._showArrow)
		{
			this._tooltipArrow.clear();
			this._tooltipArrow.beginFill(0x2C2C2C);
			
			const arrowSize = 6;
			switch(this._placement)
			{
				case 'top':
					this._tooltipArrow.moveTo(tooltipWidth / 2 - arrowSize, tooltipHeight);
					this._tooltipArrow.lineTo(tooltipWidth / 2, tooltipHeight + arrowSize);
					this._tooltipArrow.lineTo(tooltipWidth / 2 + arrowSize, tooltipHeight);
					break;
				
				case 'bottom':
					this._tooltipArrow.moveTo(tooltipWidth / 2 - arrowSize, 0);
					this._tooltipArrow.lineTo(tooltipWidth / 2, -arrowSize);
					this._tooltipArrow.lineTo(tooltipWidth / 2 + arrowSize, 0);
					break;
				
				case 'left':
					this._tooltipArrow.moveTo(tooltipWidth, tooltipHeight / 2 - arrowSize);
					this._tooltipArrow.lineTo(tooltipWidth + arrowSize, tooltipHeight / 2);
					this._tooltipArrow.lineTo(tooltipWidth, tooltipHeight / 2 + arrowSize);
					break;
				
				case 'right':
					this._tooltipArrow.moveTo(0, tooltipHeight / 2 - arrowSize);
					this._tooltipArrow.lineTo(-arrowSize, tooltipHeight / 2);
					this._tooltipArrow.lineTo(0, tooltipHeight / 2 + arrowSize);
					break;
			}
			
			this._tooltipArrow.endFill();
		}
		
		// Position tooltip relative to target
		if(this._target && this._isShowing)
		{
			this.positionTooltip(tooltipWidth, tooltipHeight);
		}
		
		// Apply animation values
		this._tooltipContainer.alpha = this._tooltipAlpha;
		this._tooltipContainer.scale.set(this._tooltipScale);
	}
	
	private positionTooltip(tooltipWidth:number, tooltipHeight:number):void
	{
		if(!this._target || !this._pixiTarget) return;
		
		const targetBounds = this._pixiTarget.getBounds();
		const arrowOffset = this._showArrow ? 6 : 0;
		let x = 0;
		let y = 0;
		
		// Calculate position based on placement
		switch(this._placement)
		{
			case 'top':
				x = targetBounds.x + (targetBounds.width - tooltipWidth) / 2;
				y = targetBounds.y - tooltipHeight - this._offset - arrowOffset;
				break;
			
			case 'bottom':
				x = targetBounds.x + (targetBounds.width - tooltipWidth) / 2;
				y = targetBounds.y + targetBounds.height + this._offset + arrowOffset;
				break;
			
			case 'left':
				x = targetBounds.x - tooltipWidth - this._offset - arrowOffset;
				y = targetBounds.y + (targetBounds.height - tooltipHeight) / 2;
				break;
			
			case 'right':
				x = targetBounds.x + targetBounds.width + this._offset + arrowOffset;
				y = targetBounds.y + (targetBounds.height - tooltipHeight) / 2;
				break;
			
			case 'auto':
				// Choose best placement based on available space
				// For now, default to top
				x = targetBounds.x + (targetBounds.width - tooltipWidth) / 2;
				y = targetBounds.y - tooltipHeight - this._offset - arrowOffset;
				break;
		}
		
		// Apply position
		this._tooltipContainer.x = x;
		this._tooltipContainer.y = y;
		
		// Set pivot for scaling animation
		this._tooltipContainer.pivot.set(tooltipWidth / 2, tooltipHeight / 2);
		this._tooltipContainer.x += tooltipWidth / 2;
		this._tooltipContainer.y += tooltipHeight / 2;
	}
	
	protected UpdateAnimation(progress:number):void
	{
		// Easing function
		const eased = 1 - Math.pow(1 - progress, 3);
		
		// Update alpha
		const alphaDiff = this._targetAlpha - this._tooltipAlpha;
		this._tooltipAlpha += alphaDiff * eased;
		
		// Update scale
		const scaleDiff = this._targetScale - this._tooltipScale;
		this._tooltipScale += scaleDiff * eased;
		
		// Update visibility
		this._tooltipContainer.visible = this._tooltipAlpha > 0.01;
		
		this.Render();
	}
	
	/**
	 * Show tooltip
	 */
	public show():void
	{
		if(this._isShowing) return;
		
		this._isShowing = true;
		this._targetAlpha = 1;
		this._targetScale = 1;
		
		// Make sure tooltip is on top
		if(this._tooltipContainer.parent)
		{
			this._tooltipContainer.parent.setChildIndex(
				this._tooltipContainer,
				this._tooltipContainer.parent.children.length - 1
			);
		}
		
		this.StartAnimation();
		this.Render();
	}
	
	/**
	 * Hide tooltip
	 */
	public hide():void
	{
		if(!this._isShowing) return;
		
		this._isShowing = false;
		this._targetAlpha = 0;
		this._targetScale = 0.9;
		
		this.StartAnimation();
	}
	
	/**
	 * Toggle tooltip
	 */
	public toggle():void
	{
		if(this._isShowing)
		{
			this.hide();
		}
		else
		{
			this.show();
		}
	}
	
	/**
	 * Update content
	 */
	public setContent(content:string | PIXI.Container):void
	{
		// Remove old content
		if(this._tooltipContent)
		{
			this._tooltipContainer.removeChild(this._tooltipContent);
			if(this._tooltipContent instanceof PIXI.Text)
			{
				this._tooltipContent.destroy();
			}
		}
		
		this._content = content;
		
		// Create new content
		if(typeof content === 'string')
		{
			this._tooltipContent = new PIXI.Text({
				text: content,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.sizeSmall,
					fill: 0xFFFFFF,
					align: 'left',
					wordWrap: true,
					wordWrapWidth: this._maxWidth - (this._theme.spacing.small * 2)
				}
			});
			this._tooltipContent.x = this._theme.spacing.small;
			this._tooltipContent.y = this._theme.spacing.small;
		}
		else
		{
			this._tooltipContent = content;
		}
		
		if(this._tooltipContent)
		{
			this._tooltipContainer.addChild(this._tooltipContent);
		}
		
		this.Render();
	}
	
	/**
	 * Set placement
	 */
	public setPlacement(placement:TooltipPlacement):void
	{
		this._placement = placement;
		if(this._isShowing)
		{
			this.Render();
		}
	}
	
	/**
	 * Attach to target
	 */
	public attachTo(target:BaseUIComponent | PIXI.Container):void
	{
		// Remove old listeners
		if(this._pixiTarget)
		{
			this._pixiTarget.off('pointerover', this.handleTargetOver, this);
			this._pixiTarget.off('pointerout', this.handleTargetOut, this);
			this._pixiTarget.off('pointerdown', this.handleTargetClick, this);
			
			if('off' in this._pixiTarget)
			{
				this._pixiTarget.off('focus', this.handleTargetFocus, this);
				this._pixiTarget.off('blur', this.handleTargetBlur, this);
			}
		}
		
		// Attach to new target
		this.attachToTarget(target);
	}
	
	/**
	 * Dispose
	 */
	public Dispose():void
	{
		// Clear timers
		if(this._showTimer !== null)
		{
			clearTimeout(this._showTimer);
			this._showTimer = null;
		}
		
		if(this._hideTimer !== null)
		{
			clearTimeout(this._hideTimer);
			this._hideTimer = null;
		}
		
		// Remove target listeners
		if(this._pixiTarget)
		{
			this._pixiTarget.off('pointerover', this.handleTargetOver, this);
			this._pixiTarget.off('pointerout', this.handleTargetOut, this);
			this._pixiTarget.off('pointerdown', this.handleTargetClick, this);
			
			if('off' in this._pixiTarget)
			{
				this._pixiTarget.off('focus', this.handleTargetFocus, this);
				this._pixiTarget.off('blur', this.handleTargetBlur, this);
			}
		}
		
		// Remove tooltip from stage
		if(this._tooltipContainer.parent)
		{
			this._tooltipContainer.parent.removeChild(this._tooltipContainer);
		}
		
		// Destroy tooltip container
		this._tooltipContainer.destroy();
		
		super.Dispose();
	}
}