/**
 * Canvas Modal Component
 */

import * as PIXI from "pixi.js";
import { BaseUIComponent, UIComponentConfig } from "../base/BaseUIComponent";
import { CanvasButtonObj, ButtonConfig } from "./CanvasButtonObj";
import { CanvasFlexContainer } from "../containers/CanvasFlexContainer";
import { UIEventBus } from "../base/UIEventBus";
import { UIEventType } from "../base/UIEventTypes";

// Simple wrapper component for text content
class TextWrapperComponent extends BaseUIComponent
{
	private _textObject:PIXI.Text;

	constructor(config:UIComponentConfig & { textObject:PIXI.Text })
	{
		super(config);
		this._textObject = config.textObject;
	}

	protected InitComponent():void
	{
		this._container.addChild(this._textObject);
	}

	protected Render():void
	{
		// No additional rendering needed for text wrapper
	}
}

export interface ModalConfig extends UIComponentConfig
{
	title?:string;
	content:string | BaseUIComponent | BaseUIComponent[];
	showCloseButton?:boolean;
	showOverlay?:boolean;
	closeOnOverlayClick?:boolean;
	closeOnEscape?:boolean;
	buttons?:ButtonConfig[];
	modalWidth?:number;
	modalHeight?:number;
	centered?:boolean;
	animateIn?:boolean;
	animateOut?:boolean;
	onOpen?:() => void;
	onClose?:() => void;
	onConfirm?:() => void;
	onCancel?:() => void;
}

export class CanvasModalObj extends BaseUIComponent
{
	private _modalConfig:ModalConfig;
	private _isOpen:boolean = false;
	
	// Modal elements
	private _overlay:PIXI.Graphics;
	private _modalContainer:PIXI.Container;
	private _modalBg:PIXI.Graphics;
	private _titleBar:PIXI.Container;
	private _titleText:PIXI.Text | null = null;
	private _closeButton:PIXI.Container | null = null;
	private _contentContainer:CanvasFlexContainer;
	private _buttonContainer:CanvasFlexContainer | null = null;
	private _buttons:CanvasButtonObj[] = [];
	
	// Animation
	private _overlayAlpha:number = 0;
	private _targetOverlayAlpha:number = 0;
	private _modalScale:number = 0.9;
	private _targetModalScale:number = 0.9;
	private _modalAlpha:number = 0;
	private _targetModalAlpha:number = 0;
	
	constructor(config:ModalConfig)
	{
		// Modal takes full screen by default
		if(!config.width) config.width = 800;
		if(!config.height) config.height = 600;
		
		super(config);
		this._modalConfig = config;
		
		// Create overlay
		this._overlay = new PIXI.Graphics();
		if(config.showOverlay !== false)
		{
			this._container.addChild(this._overlay);
		}
		
		// Create modal container
		this._modalContainer = new PIXI.Container();
		this._modalBg = new PIXI.Graphics();
		this._titleBar = new PIXI.Container();
		
		this._modalContainer.addChild(this._modalBg);
		this._modalContainer.addChild(this._titleBar);
		
		// Create content container
		this._contentContainer = new CanvasFlexContainer({
			x: this._theme.spacing.medium,
			y: config.title ? 60 : this._theme.spacing.medium,
			width: (config.modalWidth || 400) - (this._theme.spacing.medium * 2),
			height: (config.modalHeight || 300) - 
			        (config.title ? 60 : this._theme.spacing.medium) - 
			        (config.buttons ? 60 : this._theme.spacing.medium),
			direction: 'column',
			gap: this._theme.spacing.small
		});
		
		this._modalContainer.addChild(this._contentContainer.getContainer());
		this._container.addChild(this._modalContainer);
		
		// Initially hidden
		this._container.visible = false;
	}
	
	protected InitComponent():void
	{
		const modalWidth = this._modalConfig.modalWidth || 400;
		const modalHeight = this._modalConfig.modalHeight || 300;
		
		// Setup overlay interaction
		if(this._modalConfig.showOverlay !== false)
		{
			this._overlay.eventMode = 'static';
			
			if(this._modalConfig.closeOnOverlayClick !== false)
			{
				this._overlay.cursor = 'pointer';
				this._overlay.on('pointerdown', this.handleOverlayClick, this);
			}
		}
		
		// Create title if provided
		if(this._modalConfig.title)
		{
			this._titleText = new PIXI.Text({
				text: this._modalConfig.title,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.sizeLarge,
					fill: this._theme.colors.text,
					fontWeight: 'bold'
				}
			});
			
			this._titleText.x = this._theme.spacing.medium;
			this._titleText.y = this._theme.spacing.medium;
			this._titleBar.addChild(this._titleText);
		}
		
		// Create close button
		if(this._modalConfig.showCloseButton !== false)
		{
			this._closeButton = new PIXI.Container();
			const closeGraphics = new PIXI.Graphics();
			
			// Draw X icon
			closeGraphics.lineStyle(2, this._theme.colors.text);
			closeGraphics.moveTo(-6, -6);
			closeGraphics.lineTo(6, 6);
			closeGraphics.moveTo(6, -6);
			closeGraphics.lineTo(-6, 6);
			
			// Draw circle background
			const bg = new PIXI.Graphics();
			bg.beginFill(this._theme.colors.surface, 0.01);
			bg.drawCircle(0, 0, 12);
			bg.endFill();
			
			this._closeButton.addChild(bg);
			this._closeButton.addChild(closeGraphics);
			this._closeButton.x = modalWidth - 30;
			this._closeButton.y = 30;
			this._closeButton.eventMode = 'static';
			this._closeButton.cursor = 'pointer';
			this._closeButton.on('pointerdown', this.handleCloseClick, this);
			this._closeButton.on('pointerover', () => {
				closeGraphics.clear();
				closeGraphics.lineStyle(2, this._theme.colors.error);
				closeGraphics.moveTo(-6, -6);
				closeGraphics.lineTo(6, 6);
				closeGraphics.moveTo(6, -6);
				closeGraphics.lineTo(-6, 6);
			});
			this._closeButton.on('pointerout', () => {
				closeGraphics.clear();
				closeGraphics.lineStyle(2, this._theme.colors.text);
				closeGraphics.moveTo(-6, -6);
				closeGraphics.lineTo(6, 6);
				closeGraphics.moveTo(6, -6);
				closeGraphics.lineTo(-6, 6);
			});
			
			this._modalContainer.addChild(this._closeButton);
		}
		
		// Add content
		if(typeof this._modalConfig.content === 'string')
		{
			const contentText = new PIXI.Text({
				text: this._modalConfig.content,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.size,
					fill: this._theme.colors.text,
					wordWrap: true,
					wordWrapWidth: modalWidth - (this._theme.spacing.medium * 2)
				}
			});
			
			const wrapper = new TextWrapperComponent({
				x: 0,
				y: 0,
				width: modalWidth - (this._theme.spacing.medium * 2),
				height: contentText.height,
				textObject: contentText
			});
			
			this._contentContainer.addChildren(wrapper);
		}
		else if(Array.isArray(this._modalConfig.content))
		{
			this._contentContainer.addChildren(...this._modalConfig.content);
		}
		else if(this._modalConfig.content)
		{
			this._contentContainer.addChildren(this._modalConfig.content);
		}
		
		// Create buttons if provided
		if(this._modalConfig.buttons && this._modalConfig.buttons.length > 0)
		{
			this._buttonContainer = new CanvasFlexContainer({
				x: this._theme.spacing.medium,
				y: modalHeight - 60,
				width: modalWidth - (this._theme.spacing.medium * 2),
				height: 40,
				direction: 'row',
				justify: 'end',
				gap: this._theme.spacing.small
			});
			
			for(const buttonConfig of this._modalConfig.buttons)
			{
				const button = new CanvasButtonObj({
					...buttonConfig,
					width: buttonConfig.width || 80,
					height: buttonConfig.height || 32
				});
				
				this._buttons.push(button);
				this._buttonContainer.addChildren(button);
			}
			
			this._modalContainer.addChild(this._buttonContainer.getContainer());
		}
		
		// Position modal
		if(this._modalConfig.centered !== false)
		{
			this.centerModal();
		}
		
		// Setup keyboard listeners
		if(this._modalConfig.closeOnEscape !== false && typeof document !== 'undefined')
		{
			document.addEventListener('keydown', this.handleKeyDown);
		}
	}
	
	private centerModal():void
	{
		const modalWidth = this._modalConfig.modalWidth || 400;
		const modalHeight = this._modalConfig.modalHeight || 300;
		
		// Get stage dimensions
		const stageWidth = this.width;
		const stageHeight = this.height;
		
		// Center the modal
		this._modalContainer.x = (stageWidth - modalWidth) / 2;
		this._modalContainer.y = (stageHeight - modalHeight) / 2;
		
		// Set pivot for scaling animation
		this._modalContainer.pivot.set(modalWidth / 2, modalHeight / 2);
		this._modalContainer.x += modalWidth / 2;
		this._modalContainer.y += modalHeight / 2;
	}
	
	protected Render():void
	{
		const modalWidth = this._modalConfig.modalWidth || 400;
		const modalHeight = this._modalConfig.modalHeight || 300;
		
		// Draw overlay
		if(this._modalConfig.showOverlay !== false)
		{
			this._overlay.clear();
			this._overlay.beginFill(0x000000, 0.5);
			this._overlay.drawRect(0, 0, this.width, this.height);
			this._overlay.endFill();
			this._overlay.alpha = this._overlayAlpha;
		}
		
		// Draw modal background
		this._modalBg.clear();
		
		// Shadow
		this._modalBg.beginFill(0x000000, 0.3);
		this._modalBg.drawRoundedRect(
			4, 4,
			modalWidth,
			modalHeight,
			this._theme.borderRadius
		);
		this._modalBg.endFill();
		
		// Main background
		this._modalBg.beginFill(this._theme.colors.surface);
		this._modalBg.lineStyle(2, this._theme.colors.border);
		this._modalBg.drawRoundedRect(
			0, 0,
			modalWidth,
			modalHeight,
			this._theme.borderRadius
		);
		this._modalBg.endFill();
		
		// Draw title bar separator
		if(this._modalConfig.title)
		{
			this._modalBg.lineStyle(1, this._theme.colors.border);
			this._modalBg.moveTo(0, 50);
			this._modalBg.lineTo(modalWidth, 50);
		}
		
		// Draw button bar separator
		if(this._modalConfig.buttons && this._modalConfig.buttons.length > 0)
		{
			this._modalBg.lineStyle(1, this._theme.colors.border);
			this._modalBg.moveTo(0, modalHeight - 60);
			this._modalBg.lineTo(modalWidth, modalHeight - 60);
		}
		
		// Apply animation values
		this._modalContainer.alpha = this._modalAlpha;
		this._modalContainer.scale.set(this._modalScale);
	}
	
	private handleOverlayClick = ():void =>
	{
		if(this._modalConfig.closeOnOverlayClick !== false)
		{
			this.close();
		}
	}
	
	private handleCloseClick = ():void =>
	{
		this.close();
		this._modalConfig.onCancel?.();
	}
	
	private handleKeyDown = (event:KeyboardEvent):void =>
	{
		if(event.key === 'Escape' && this._isOpen)
		{
			this.close();
		}
	}
	
	protected UpdateAnimation(progress:number):void
	{
		// Easing function
		const eased = 1 - Math.pow(1 - progress, 3);
		
		// Update overlay alpha
		const overlayDiff = this._targetOverlayAlpha - this._overlayAlpha;
		this._overlayAlpha += overlayDiff * eased;
		
		// Update modal alpha
		const alphaDiff = this._targetModalAlpha - this._modalAlpha;
		this._modalAlpha += alphaDiff * eased;
		
		// Update modal scale
		const scaleDiff = this._targetModalScale - this._modalScale;
		this._modalScale += scaleDiff * eased;
		
		// Update visibility
		this._container.visible = this._modalAlpha > 0.01 || this._overlayAlpha > 0.01;
		
		this.Render();
	}
	
	/**
	 * Open modal
	 */
	public open():void
	{
		if(this._isOpen) return;
		
		this._isOpen = true;
		this._container.visible = true;
		
		// Set animation targets
		if(this._modalConfig.animateIn !== false)
		{
			this._targetOverlayAlpha = 1;
			this._targetModalAlpha = 1;
			this._targetModalScale = 1;
			this.StartAnimation();
		}
		else
		{
			this._overlayAlpha = 1;
			this._modalAlpha = 1;
			this._modalScale = 1;
			this.Render();
		}
		
		// Make sure modal is on top
		if(this._container.parent)
		{
			this._container.parent.setChildIndex(
				this._container,
				this._container.parent.children.length - 1
			);
		}
		
		// Emit events
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.OPEN, this));
		this._modalConfig.onOpen?.();
	}
	
	/**
	 * Close modal
	 */
	public close():void
	{
		if(!this._isOpen) return;
		
		this._isOpen = false;
		
		// Set animation targets
		if(this._modalConfig.animateOut !== false)
		{
			this._targetOverlayAlpha = 0;
			this._targetModalAlpha = 0;
			this._targetModalScale = 0.9;
			this.StartAnimation();
		}
		else
		{
			this._overlayAlpha = 0;
			this._modalAlpha = 0;
			this._modalScale = 0.9;
			this._container.visible = false;
			this.Render();
		}
		
		// Emit events
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.CLOSE, this));
		this._modalConfig.onClose?.();
	}
	
	/**
	 * Toggle modal
	 */
	public toggle():void
	{
		if(this._isOpen)
		{
			this.close();
		}
		else
		{
			this.open();
		}
	}
	
	/**
	 * Confirm and close
	 */
	public confirm():void
	{
		this._modalConfig.onConfirm?.();
		this.close();
	}
	
	/**
	 * Cancel and close
	 */
	public cancel():void
	{
		this._modalConfig.onCancel?.();
		this.close();
	}
	
	/**
	 * Set title
	 */
	public setTitle(title:string):void
	{
		if(this._titleText)
		{
			this._titleText.text = title;
		}
	}
	
	/**
	 * Set content
	 */
	public setContent(content:string | BaseUIComponent | BaseUIComponent[]):void
	{
		// Clear existing content
		this._contentContainer.removeAllChildren();
		
		// Add new content
		if(typeof content === 'string')
		{
			const contentText = new PIXI.Text({
				text: content,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.size,
					fill: this._theme.colors.text,
					wordWrap: true,
					wordWrapWidth: (this._modalConfig.modalWidth || 400) - (this._theme.spacing.medium * 2)
				}
			});
			
			const wrapper = new TextWrapperComponent({
				x: 0,
				y: 0,
				width: (this._modalConfig.modalWidth || 400) - (this._theme.spacing.medium * 2),
				height: contentText.height,
				textObject: contentText
			});
			
			this._contentContainer.addChildren(wrapper);
		}
		else if(Array.isArray(content))
		{
			this._contentContainer.addChildren(...content);
		}
		else
		{
			this._contentContainer.addChildren(content);
		}
	}
	
	/**
	 * Get button by index
	 */
	public getButton(index:number):CanvasButtonObj | null
	{
		return this._buttons[index] || null;
	}
	
	/**
	 * Dispose
	 */
	public Dispose():void
	{
		// Remove keyboard listener
		if(typeof document !== 'undefined')
		{
			document.removeEventListener('keydown', this.handleKeyDown);
		}
		
		// Remove event listeners
		if(this._overlay)
		{
			this._overlay.off('pointerdown', this.handleOverlayClick, this);
		}
		
		if(this._closeButton)
		{
			this._closeButton.off('pointerdown', this.handleCloseClick, this);
		}
		
		// Dispose buttons
		for(const button of this._buttons)
		{
			button.Dispose();
		}
		
		// Dispose containers
		if(this._buttonContainer)
		{
			this._buttonContainer.Dispose();
		}
		
		this._contentContainer.Dispose();
		
		super.Dispose();
	}
}