/**
 * Canvas Text Input Component
 */

import * as PIXI from "pixi.js";
import { BaseUIComponent, UIComponentConfig } from "../base/BaseUIComponent";
import { UIEventBus } from "../base/UIEventBus";
import { UIEventType } from "../base/UIEventTypes";

export interface TextInputConfig extends UIComponentConfig
{
	placeholder?:string;
	value?:string;
	type?:'text' | 'password' | 'email' | 'number';
	maxLength?:number;
	pattern?:RegExp;
	multiline?:boolean;
	rows?:number;
	readOnly?:boolean;
	clearable?:boolean;
	prefix?:string;
	suffix?:string;
	autoFocus?:boolean;
	selectOnFocus?:boolean;
	validateOnBlur?:boolean;
	validateOnChange?:boolean;
}

export class CanvasTextInputObj extends BaseUIComponent
{
	private _inputConfig:TextInputConfig;
	private _type:string;
	private _placeholder:string;
	private _maxLength:number;
	private _pattern:RegExp | null;
	private _multiline:boolean;
	private _readOnly:boolean;
	
	private _text:PIXI.Text | null = null;
	private _placeholderText:PIXI.Text | null = null;
	private _prefixText:PIXI.Text | null = null;
	private _suffixText:PIXI.Text | null = null;
	private _cursor:PIXI.Graphics;
	private _selection:PIXI.Graphics;
	private _clearButton:PIXI.Container | null = null;
	
	// Text editing state
	private _cursorPosition:number = 0;
	private _selectionStart:number = -1;
	private _selectionEnd:number = -1;
	private _cursorVisible:boolean = true;
	private _cursorBlinkTimer:number = 0;
	
	// Hidden HTML input for keyboard capture
	private _hiddenInput:HTMLInputElement | null = null;
	
	constructor(config:TextInputConfig)
	{
		// Set default dimensions
		if(!config.width) config.width = 200;
		if(!config.height) config.height = config.multiline ? 100 : 40;
		
		super(config);
		this._inputConfig = config;
		this._type = config.type || 'text';
		this._placeholder = config.placeholder || '';
		this._value = config.value || '';
		this._maxLength = config.maxLength || 0;
		this._pattern = config.pattern || null;
		this._multiline = config.multiline || false;
		this._readOnly = config.readOnly || false;
		
		this._cursor = new PIXI.Graphics();
		this._selection = new PIXI.Graphics();
		
		this._container.addChild(this._selection);
		this._container.addChild(this._cursor);
	}
	
	protected InitComponent():void
	{
		// Create placeholder text
		if(this._placeholder)
		{
			this._placeholderText = new PIXI.Text({
				text: this._placeholder,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.size,
					fill: this._theme.colors.textDisabled,
					align: 'left'
				}
			});
			this._placeholderText.x = this._theme.spacing.small;
			this._placeholderText.y = (this.height - this._placeholderText.height) / 2;
			this._container.addChild(this._placeholderText);
		}
		
		// Create main text
		this._text = new PIXI.Text({
			text: this.getDisplayValue(),
			style: {
				fontFamily: this._theme.fonts.family,
				fontSize: this._theme.fonts.size,
				fill: this._theme.colors.text,
				align: 'left',
				wordWrap: this._multiline,
				wordWrapWidth: this.width - (this._theme.spacing.small * 2)
			}
		});
		this._text.x = this._theme.spacing.small;
		this._text.y = (this.height - this._text.height) / 2;
		this._container.addChild(this._text);
		
		// Create prefix/suffix if provided
		if(this._inputConfig.prefix)
		{
			this._prefixText = new PIXI.Text({
				text: this._inputConfig.prefix,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.size,
					fill: this._theme.colors.textSecondary,
					align: 'left'
				}
			});
			this._prefixText.x = this._theme.spacing.small;
			this._prefixText.y = (this.height - this._prefixText.height) / 2;
			this._container.addChild(this._prefixText);
			
			// Adjust main text position
			if(this._text)
			{
				this._text.x = this._prefixText.x + this._prefixText.width + 4;
			}
		}
		
		if(this._inputConfig.suffix)
		{
			this._suffixText = new PIXI.Text({
				text: this._inputConfig.suffix,
				style: {
					fontFamily: this._theme.fonts.family,
					fontSize: this._theme.fonts.size,
					fill: this._theme.colors.textSecondary,
					align: 'right'
				}
			});
			this._suffixText.x = this.width - this._suffixText.width - this._theme.spacing.small;
			this._suffixText.y = (this.height - this._suffixText.height) / 2;
			this._container.addChild(this._suffixText);
		}
		
		// Create clear button if clearable
		if(this._inputConfig.clearable && !this._readOnly)
		{
			this._clearButton = new PIXI.Container();
			const clearGraphics = new PIXI.Graphics();
			
			// Draw X icon
			clearGraphics.lineStyle(2, this._theme.colors.textSecondary);
			clearGraphics.moveTo(-4, -4);
			clearGraphics.lineTo(4, 4);
			clearGraphics.moveTo(4, -4);
			clearGraphics.lineTo(-4, 4);
			
			this._clearButton.addChild(clearGraphics);
			this._clearButton.x = this.width - 20;
			this._clearButton.y = this.height / 2;
			this._clearButton.eventMode = 'static';
			this._clearButton.cursor = 'pointer';
			this._clearButton.on('pointerdown', this.HandleClearClick, this);
			this._clearButton.visible = this._value.length > 0;
			
			this._container.addChild(this._clearButton);
		}
		
		// Create hidden HTML input for keyboard capture
		if(!this._readOnly)
		{
			this.createHiddenInput();
		}
		
		// Set interactive
		this._container.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);
		
		// Auto focus if requested
		if(this._inputConfig.autoFocus)
		{
			this.focus();
		}
	}
	
	private createHiddenInput():void
	{
		if(typeof document !== 'undefined')
		{
			this._hiddenInput = document.createElement('input');
			this._hiddenInput.type = this._type === 'password' ? 'password' : 'text';
			this._hiddenInput.style.position = 'absolute';
			this._hiddenInput.style.left = '-9999px';
			this._hiddenInput.style.opacity = '0';
			this._hiddenInput.style.pointerEvents = 'none';
			
			if(this._maxLength > 0)
			{
				this._hiddenInput.maxLength = this._maxLength;
			}
			
			this._hiddenInput.value = this._value;
			
			// Add event listeners
			this._hiddenInput.addEventListener('input', this.HandleHTMLInput);
			this._hiddenInput.addEventListener('keydown', this.HandleKeyDown);
			this._hiddenInput.addEventListener('blur', this.HandleHTMLBlur);
			
			document.body.appendChild(this._hiddenInput);
		}
	}
	
	protected Render():void
	{
		this._graphics.clear();
		
		// Get colors based on state
		const bgColor = this._focused ? 
		                this._theme.colors.surfaceHover :
		                this._theme.colors.surface;
		
		const borderColor = !this._isValid ? this._theme.colors.error :
		                    this._focused ? this._theme.colors.primary :
		                    this._hovered ? this._theme.colors.borderHover :
		                    this._theme.colors.border;
		
		// Draw background
		this._graphics.beginFill(bgColor);
		this._graphics.lineStyle(2, borderColor);
		this._graphics.drawRoundedRect(0, 0, this.width, this.height, this._theme.borderRadius);
		this._graphics.endFill();
		
		// Update text visibility
		if(this._text)
		{
			this._text.text = this.getDisplayValue();
			this._text.visible = this._value.length > 0;
		}
		
		if(this._placeholderText)
		{
			this._placeholderText.visible = this._value.length === 0 && !this._focused;
		}
		
		// Draw cursor if focused
		this._cursor.clear();
		if(this._focused && !this._readOnly && this._cursorVisible)
		{
			const cursorX = this.getCursorX();
			const cursorY = this._theme.spacing.small;
			const cursorHeight = this.height - (this._theme.spacing.small * 2);
			
			this._cursor.lineStyle(2, this._theme.colors.primary);
			this._cursor.moveTo(cursorX, cursorY);
			this._cursor.lineTo(cursorX, cursorY + cursorHeight);
		}
		
		// Draw selection
		this._selection.clear();
		if(this._selectionStart >= 0 && this._selectionEnd >= 0 && this._selectionStart !== this._selectionEnd)
		{
			const startX = this.getCharacterX(Math.min(this._selectionStart, this._selectionEnd));
			const endX = this.getCharacterX(Math.max(this._selectionStart, this._selectionEnd));
			
			this._selection.beginFill(this._theme.colors.primary, 0.3);
			this._selection.drawRect(
				startX,
				this._theme.spacing.small,
				endX - startX,
				this.height - (this._theme.spacing.small * 2)
			);
			this._selection.endFill();
		}
		
		// Update clear button visibility
		if(this._clearButton)
		{
			this._clearButton.visible = this._value.length > 0 && !this._readOnly;
		}
		
		// Set container alpha for disabled state
		this._container.alpha = this._enabled ? 1.0 : 0.5;
	}
	
	private getDisplayValue():string
	{
		if(this._type === 'password')
		{
			return '•'.repeat(this._value.length);
		}
		return this._value;
	}
	
	private getCursorX():number
	{
		return this.getCharacterX(this._cursorPosition);
	}
	
	private getCharacterX(index:number):number
	{
		if(!this._text || index === 0) return this._theme.spacing.small;
		
		const displayValue = this.getDisplayValue();
		const substring = displayValue.substring(0, Math.min(index, displayValue.length));
		
		// Create temporary text to measure
		const tempText = new PIXI.Text({
			text: substring,
			style: this._text.style
		});
		
		const width = tempText.width;
		tempText.destroy();
		
		return this._theme.spacing.small + width;
	}
	
	protected HandlePointerDown = (event:PIXI.FederatedPointerEvent):void =>
	{
		super.HandlePointerDown(event);
		
		if(!this._enabled || this._readOnly) return;
		
		// Focus the input
		this.focus();
		
		// Calculate cursor position from click
		const localPos = this._container.toLocal(event.global);
		this.setCursorFromPosition(localPos.x);
	}
	
	private setCursorFromPosition(x:number):void
	{
		// Simple implementation - could be improved with character-by-character measurement
		const textX = this._theme.spacing.small;
		const relativeX = Math.max(0, x - textX);
		
		if(!this._text || this._value.length === 0)
		{
			this._cursorPosition = 0;
			return;
		}
		
		// Estimate position based on average character width
		const avgCharWidth = this._text.width / this._value.length;
		this._cursorPosition = Math.min(
			this._value.length,
			Math.round(relativeX / avgCharWidth)
		);
		
		this.Render();
	}
	
	private HandleHTMLInput = (event:Event):void =>
	{
		if(!this._hiddenInput) return;
		
		const newValue = this._hiddenInput.value;
		
		// Validate length
		if(this._maxLength > 0 && newValue.length > this._maxLength)
		{
			this._hiddenInput.value = this._value;
			return;
		}
		
		// Validate pattern if provided
		if(this._pattern && !this._pattern.test(newValue))
		{
			this._hiddenInput.value = this._value;
			return;
		}
		
		// Update value
		const previousValue = this._value;
		this._value = newValue;
		this._cursorPosition = this._hiddenInput.selectionStart || 0;
		
		// Emit change event
		UIEventBus.emit(UIEventBus.createEvent(
			UIEventType.CHANGE,
			this,
			this._value,
			previousValue
		));
		
		this._onChange?.(this._value, this);
		
		// Validate if configured
		if(this._inputConfig.validateOnChange)
		{
			this.validate();
		}
		
		this.Render();
	}
	
	private HandleKeyDown = (event:KeyboardEvent):void =>
	{
		// Handle special keys
		switch(event.key)
		{
			case 'Enter':
				if(!this._multiline)
				{
					UIEventBus.emit(UIEventBus.createEvent(
						UIEventType.SUBMIT,
						this,
						this._value
					));
					this.blur();
				}
				break;
			
			case 'Escape':
				this.blur();
				break;
		}
	}
	
	private HandleHTMLBlur = ():void =>
	{
		this.blur();
	}
	
	private HandleClearClick = ():void =>
	{
		if(this._readOnly) return;
		
		const previousValue = this._value;
		this._value = '';
		this._cursorPosition = 0;
		
		if(this._hiddenInput)
		{
			this._hiddenInput.value = '';
		}
		
		// Emit change event
		UIEventBus.emit(UIEventBus.createEvent(
			UIEventType.CHANGE,
			this,
			this._value,
			previousValue
		));
		
		this._onChange?.(this._value, this);
		
		this.Render();
		this.focus();
	}
	
	/**
	 * Focus the input
	 */
	public focus():void
	{
		if(this._focused || !this._enabled || this._readOnly) return;
		
		this._focused = true;
		
		// Focus hidden input
		if(this._hiddenInput)
		{
			this._hiddenInput.focus();
			
			if(this._inputConfig.selectOnFocus)
			{
				this._hiddenInput.select();
				this._selectionStart = 0;
				this._selectionEnd = this._value.length;
			}
		}
		
		// Start cursor blink
		this._cursorVisible = true;
		
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.FOCUS, this));
		this._onFocus?.(this);
		
		this.Render();
	}
	
	/**
	 * Blur the input
	 */
	public blur():void
	{
		if(!this._focused) return;
		
		this._focused = false;
		
		// Blur hidden input
		if(this._hiddenInput)
		{
			this._hiddenInput.blur();
		}
		
		// Clear selection
		this._selectionStart = -1;
		this._selectionEnd = -1;
		
		// Validate if configured
		if(this._inputConfig.validateOnBlur)
		{
			this.validate();
		}
		
		UIEventBus.emit(UIEventBus.createEvent(UIEventType.BLUR, this));
		this._onBlur?.(this);
		
		this.Render();
	}
	
	/**
	 * Update animation
	 */
	public Update(time:number, frameCount:number, onceSecond:boolean):void
	{
		super.Update(time, frameCount, onceSecond);
		
		// Blink cursor
		if(this._focused && !this._readOnly)
		{
			this._cursorBlinkTimer += 1;
			if(this._cursorBlinkTimer >= 30) // ~0.5 seconds at 60fps
			{
				this._cursorVisible = !this._cursorVisible;
				this._cursorBlinkTimer = 0;
				this.Render();
			}
		}
	}
	
	/**
	 * Validate input
	 */
	public validate():boolean
	{
		// Check required
		if(this._required && this._value.length === 0)
		{
			this._isValid = false;
			this._validationMessage = 'This field is required';
		}
		// Check pattern
		else if(this._pattern && !this._pattern.test(this._value))
		{
			this._isValid = false;
			this._validationMessage = 'Invalid format';
		}
		// Check email
		else if(this._type === 'email' && this._value.length > 0)
		{
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if(!emailPattern.test(this._value))
			{
				this._isValid = false;
				this._validationMessage = 'Invalid email address';
			}
			else
			{
				this._isValid = true;
				this._validationMessage = '';
			}
		}
		// Check number
		else if(this._type === 'number' && this._value.length > 0)
		{
			if(isNaN(Number(this._value)))
			{
				this._isValid = false;
				this._validationMessage = 'Must be a number';
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
	 * Set value
	 */
	public setValue(value:string):void
	{
		const previousValue = this._value;
		this._value = value;
		this._cursorPosition = value.length;
		
		if(this._hiddenInput)
		{
			this._hiddenInput.value = value;
		}
		
		UIEventBus.emit(UIEventBus.createEvent(
			UIEventType.CHANGE,
			this,
			this._value,
			previousValue
		));
		
		this._onChange?.(this._value, this);
		
		this.Render();
	}
	
	/**
	 * Clear input
	 */
	public clear():void
	{
		this.setValue('');
	}
	
	/**
	 * Dispose
	 */
	public Dispose():void
	{
		// Remove hidden input
		if(this._hiddenInput)
		{
			this._hiddenInput.removeEventListener('input', this.HandleHTMLInput);
			this._hiddenInput.removeEventListener('keydown', this.HandleKeyDown);
			this._hiddenInput.removeEventListener('blur', this.HandleHTMLBlur);
			
			if(this._hiddenInput.parentNode)
			{
				this._hiddenInput.parentNode.removeChild(this._hiddenInput);
			}
			
			this._hiddenInput = null;
		}
		
		// Remove clear button listeners
		if(this._clearButton)
		{
			this._clearButton.off('pointerdown', this.HandleClearClick, this);
		}
		
		super.Dispose();
	}
}