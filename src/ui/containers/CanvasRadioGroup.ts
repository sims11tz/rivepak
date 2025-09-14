/**
 * Canvas Radio Group - Manages exclusive selection of radio buttons
 */

import { CanvasFlexContainer, FlexContainerConfig } from "./CanvasFlexContainer";
import { CanvasRadioObj, RadioConfig } from "../components/CanvasRadioObj";
import { UIEventBus } from "../base/UIEventBus";
import { UIEventType, ChangeCallback } from "../base/UIEventTypes";

export interface RadioGroupConfig extends FlexContainerConfig
{
	options:RadioConfig[];
	selectedIndex?:number;
	selectedValue?:any;
	groupName?:string;
	onSelectionChange?:ChangeCallback<any>;
}

export class CanvasRadioGroup extends CanvasFlexContainer
{
	private _groupConfig:RadioGroupConfig;
	private _radios:CanvasRadioObj[] = [];
	private _selectedIndex:number = -1;
	private _groupName:string;
	
	constructor(config:RadioGroupConfig)
	{
		// Set default layout for radio group (vertical by default)
		config.direction = config.direction || 'column';
		config.gap = config.gap !== undefined ? config.gap : 8;
		config.align = config.align || 'start';
		
		super(config);
		this._groupConfig = config;
		this._groupName = config.groupName || `radio-group-${Date.now()}`;
		
		// Create radio buttons
		this.createRadios();
		
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
	
	private createRadios():void
	{
		for(let i = 0; i < this._groupConfig.options.length; i++)
		{
			const radioConfig = this._groupConfig.options[i];
			
			// Set group name
			radioConfig.groupName = this._groupName;
			
			// Create radio with change handler
			const originalOnChange = radioConfig.onChange;
			radioConfig.onChange = (checked, radio) =>
			{
				if(checked)
				{
					this.handleRadioSelect(i, radio as CanvasRadioObj);
				}
				originalOnChange?.(checked, radio);
			};
			
			// Create radio button
			const radio = new CanvasRadioObj(radioConfig);
			this._radios.push(radio);
			
			// Add to container
			this.addChildren(radio);
		}
	}
	
	private handleRadioSelect(index:number, radio:CanvasRadioObj):void
	{
		// Deselect all other radios
		for(let i = 0; i < this._radios.length; i++)
		{
			if(i !== index && this._radios[i].getChecked())
			{
				this._radios[i].setChecked(false);
			}
		}
		
		// Update selected index
		const previousIndex = this._selectedIndex;
		this._selectedIndex = index;
		
		// Ensure the selected radio is checked
		if(!radio.getChecked())
		{
			radio.setChecked(true);
		}
		
		// Emit selection change event
		const selectedValue = radio.getValue();
		const previousValue = previousIndex >= 0 ? this._radios[previousIndex].getValue() : null;
		
		UIEventBus.emit(UIEventBus.createEvent(
			UIEventType.SELECTION_CHANGE,
			this,
			selectedValue,
			previousValue
		));
		
		this._groupConfig.onSelectionChange?.(selectedValue, this);
	}
	
	/**
	 * Get selected radio
	 */
	public getSelectedRadio():CanvasRadioObj | null
	{
		if(this._selectedIndex >= 0 && this._selectedIndex < this._radios.length)
		{
			return this._radios[this._selectedIndex];
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
		if(index < 0 || index >= this._radios.length)
		{
			// Clear selection
			this._selectedIndex = -1;
			for(const radio of this._radios)
			{
				radio.setChecked(false);
			}
		}
		else
		{
			// Set selection
			this._selectedIndex = index;
			for(let i = 0; i < this._radios.length; i++)
			{
				this._radios[i].setChecked(i === index);
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
		const selectedRadio = this.getSelectedRadio();
		return selectedRadio ? selectedRadio.getValue() : null;
	}
	
	/**
	 * Set selected value
	 */
	public setSelectedValue(value:any):void
	{
		for(let i = 0; i < this._radios.length; i++)
		{
			if(this._radios[i].getValue() === value)
			{
				this.setSelectedIndex(i);
				return;
			}
		}
		
		// Value not found, clear selection
		this.setSelectedIndex(-1);
	}
	
	/**
	 * Enable/disable specific radio
	 */
	public setRadioEnabled(index:number, enabled:boolean):void
	{
		if(index >= 0 && index < this._radios.length)
		{
			this._radios[index].setEnabled(enabled);
		}
	}
	
	/**
	 * Enable/disable all radios
	 */
	public setAllRadiosEnabled(enabled:boolean):void
	{
		for(const radio of this._radios)
		{
			radio.setEnabled(enabled);
		}
	}
	
	/**
	 * Add a new radio option
	 */
	public addOption(config:RadioConfig):void
	{
		// Set group name
		config.groupName = this._groupName;
		
		// Create radio with change handler
		const index = this._radios.length;
		const originalOnChange = config.onChange;
		config.onChange = (checked, radio) =>
		{
			if(checked)
			{
				this.handleRadioSelect(index, radio as CanvasRadioObj);
			}
			originalOnChange?.(checked, radio);
		};
		
		// Create and add radio
		const radio = new CanvasRadioObj(config);
		this._radios.push(radio);
		this.addChildren(radio);
	}
	
	/**
	 * Remove a radio option
	 */
	public removeOption(index:number):void
	{
		if(index >= 0 && index < this._radios.length)
		{
			const radio = this._radios[index];
			this._radios.splice(index, 1);
			this.removeChild(radio);
			radio.Dispose();
			
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
	 * Clear all options
	 */
	public clearOptions():void
	{
		for(const radio of this._radios)
		{
			this.removeChild(radio);
			radio.Dispose();
		}
		
		this._radios = [];
		this._selectedIndex = -1;
	}
	
	/**
	 * Validate (required groups must have selection)
	 */
	public validate():boolean
	{
		if(this._required)
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