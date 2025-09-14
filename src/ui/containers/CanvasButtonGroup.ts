/**
 * Canvas Button Group - Group of buttons with exclusive selection option
 */

import { CanvasFlexContainer, FlexContainerConfig } from "./CanvasFlexContainer";
import { CanvasButtonObj, ButtonConfig } from "../components/CanvasButtonObj";
import { UIEventBus } from "../base/UIEventBus";
import { UIEventType, ChangeCallback } from "../base/UIEventTypes";

export interface ButtonGroupConfig extends FlexContainerConfig
{
	buttons:ButtonConfig[];
	exclusive?:boolean; // Radio-like behavior
	allowDeselect?:boolean; // Allow deselecting in exclusive mode
	selectedIndex?:number;
	selectedValue?:any;
	onSelectionChange?:ChangeCallback<any>;
}

export class CanvasButtonGroup extends CanvasFlexContainer
{
	private _groupConfig:ButtonGroupConfig;
	private _buttons:CanvasButtonObj[] = [];
	private _exclusive:boolean;
	private _allowDeselect:boolean;
	private _selectedIndex:number = -1;
	
	constructor(config:ButtonGroupConfig)
	{
		// Set default layout for button group
		config.direction = config.direction || 'row';
		config.gap = config.gap !== undefined ? config.gap : 10;
		
		super(config);
		this._groupConfig = config;
		this._exclusive = config.exclusive || false;
		this._allowDeselect = config.allowDeselect || false;
		
		// Create buttons
		this.createButtons();
		
		// Set initial selection
		if(config.selectedIndex !== undefined)
		{
			this.setSelectedIndex(config.selectedIndex);
		}
		else if(config.selectedValue !== undefined)
		{
			this.setSelectedValue(config.selectedValue);
		}
	}
	
	private createButtons():void
	{
		for(let i = 0; i < this._groupConfig.buttons.length; i++)
		{
			const buttonConfig = this._groupConfig.buttons[i];
			
			// Set toggle mode for exclusive groups
			if(this._exclusive)
			{
				buttonConfig.toggle = true;
			}
			
			// Create button with click handler
			const originalOnClick = buttonConfig.onClick;
			buttonConfig.onClick = (btn) =>
			{
				this.handleButtonClick(i, btn as CanvasButtonObj);
				originalOnClick?.(btn);
			};
			
			// Create button
			const button = new CanvasButtonObj(buttonConfig);
			this._buttons.push(button);
			
			// Add to container
			this.addChildren(button);
		}
	}
	
	private handleButtonClick(index:number, button:CanvasButtonObj):void
	{
		if(this._exclusive)
		{
			const wasSelected = this._selectedIndex === index;
			
			if(wasSelected && !this._allowDeselect)
			{
				// Don't allow deselecting in exclusive mode unless explicitly allowed
				button.setSelected(true);
				return;
			}
			
			// Deselect all other buttons
			for(let i = 0; i < this._buttons.length; i++)
			{
				if(i !== index)
				{
					this._buttons[i].setSelected(false);
				}
			}
			
			// Update selected index
			if(wasSelected && this._allowDeselect)
			{
				this._selectedIndex = -1;
				button.setSelected(false);
			}
			else
			{
				this._selectedIndex = index;
				button.setSelected(true);
			}
			
			// Emit selection change event
			const selectedValue = this._selectedIndex >= 0 ? 
			                     this._buttons[this._selectedIndex].getValue() : 
			                     null;
			
			UIEventBus.emit(UIEventBus.createEvent(
				UIEventType.SELECTION_CHANGE,
				this,
				selectedValue,
				null
			));
			
			this._groupConfig.onSelectionChange?.(selectedValue, this);
		}
	}
	
	/**
	 * Get selected button
	 */
	public getSelectedButton():CanvasButtonObj | null
	{
		if(this._selectedIndex >= 0 && this._selectedIndex < this._buttons.length)
		{
			return this._buttons[this._selectedIndex];
		}
		return null;
	}
	
	/**
	 * Get selected index
	 */
	public getSelectedIndex():number
	{
		return this._selectedIndex;
	}
	
	/**
	 * Set selected index
	 */
	public setSelectedIndex(index:number):void
	{
		if(index < 0 || index >= this._buttons.length)
		{
			// Clear selection
			this._selectedIndex = -1;
			for(const button of this._buttons)
			{
				button.setSelected(false);
			}
		}
		else
		{
			// Set selection
			this._selectedIndex = index;
			for(let i = 0; i < this._buttons.length; i++)
			{
				this._buttons[i].setSelected(i === index);
			}
		}
		
		// Emit event
		const selectedValue = this.getValue();
		UIEventBus.emit(UIEventBus.createEvent(
			UIEventType.SELECTION_CHANGE,
			this,
			selectedValue,
			null
		));
		
		this._groupConfig.onSelectionChange?.(selectedValue, this);
	}
	
	/**
	 * Get selected value
	 */
	public getValue():any
	{
		const selectedButton = this.getSelectedButton();
		return selectedButton ? selectedButton.getValue() : null;
	}
	
	/**
	 * Set selected value
	 */
	public setSelectedValue(value:any):void
	{
		for(let i = 0; i < this._buttons.length; i++)
		{
			if(this._buttons[i].getValue() === value)
			{
				this.setSelectedIndex(i);
				return;
			}
		}
		
		// Value not found, clear selection
		this.setSelectedIndex(-1);
	}
	
	/**
	 * Get all selected values (for non-exclusive groups)
	 */
	public getSelectedValues():any[]
	{
		const values:any[] = [];
		
		for(const button of this._buttons)
		{
			if(button.getSelected())
			{
				values.push(button.getValue());
			}
		}
		
		return values;
	}
	
	/**
	 * Enable/disable specific button
	 */
	public setButtonEnabled(index:number, enabled:boolean):void
	{
		if(index >= 0 && index < this._buttons.length)
		{
			this._buttons[index].setEnabled(enabled);
		}
	}
	
	/**
	 * Enable/disable all buttons
	 */
	public setAllButtonsEnabled(enabled:boolean):void
	{
		for(const button of this._buttons)
		{
			button.setEnabled(enabled);
		}
	}
	
	/**
	 * Add a new button
	 */
	public addButton(config:ButtonConfig):void
	{
		// Set toggle mode for exclusive groups
		if(this._exclusive)
		{
			config.toggle = true;
		}
		
		// Create button with click handler
		const index = this._buttons.length;
		const originalOnClick = config.onClick;
		config.onClick = (btn) =>
		{
			this.handleButtonClick(index, btn as CanvasButtonObj);
			originalOnClick?.(btn);
		};
		
		// Create and add button
		const button = new CanvasButtonObj(config);
		this._buttons.push(button);
		this.addChildren(button);
	}
	
	/**
	 * Remove a button
	 */
	public removeButton(index:number):void
	{
		if(index >= 0 && index < this._buttons.length)
		{
			const button = this._buttons[index];
			this._buttons.splice(index, 1);
			this.removeChild(button);
			button.Dispose();
			
			// Adjust selected index if needed
			if(this._selectedIndex === index)
			{
				this._selectedIndex = -1;
			}
			else if(this._selectedIndex > index)
			{
				this._selectedIndex--;
			}
		}
	}
	
	/**
	 * Clear all buttons
	 */
	public clearButtons():void
	{
		for(const button of this._buttons)
		{
			this.removeChild(button);
			button.Dispose();
		}
		
		this._buttons = [];
		this._selectedIndex = -1;
	}
	
	/**
	 * Validate (for required groups)
	 */
	public validate():boolean
	{
		if(this._required && this._exclusive)
		{
			const hasSelection = this._selectedIndex >= 0;
			this._isValid = hasSelection;
			this._validationMessage = hasSelection ? '' : 'Please select an option';
			
			UIEventBus.emit(UIEventBus.createEvent(
				this._isValid ? UIEventType.VALID : UIEventType.INVALID,
				this,
				this._isValid,
				!this._isValid,
				{ message: this._validationMessage }
			));
			
			return this._isValid;
		}
		
		return true;
	}
}