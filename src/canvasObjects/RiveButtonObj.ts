import { Artboard } from "@rive-app/webgl2-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { RiveAnimationObject } from "./RiveAnimationObj";
import * as PIXI from "pixi.js";
import RivePakUtils from "../RivePakUtils";

export enum RIVE_BUTTON_STATES
{
	UP = "UP",
	OVER = "OVER",
	OUT = "OUT",
	UNSELECTED = "UNSELECTED",
	SELECTED = "SELECTED",
	DISABLED = "DISABLED",
	DISABLED_OVER = "DISABLED_OVER",
	DISABLED_OVER_OUT = "DISABLED_OVER_OUT",
}

export enum RIVE_BUTTON_MODES
{
	BUTTON = "BUTTON",
	TOGGLE = "TOGGLE",
}

export type RiveColorARGB = [number, number, number, number];

export interface RiveButtonColors
{
	BUTTON_COLOR?:RiveColorARGB;
	BUTTON_HOVER_COLOR?:RiveColorARGB;
	BUTTON_SELECTED_COLOR?:RiveColorARGB;
	BUTTON_DISABLED_COLOR?:RiveColorARGB;
	BUTTON_BORDER_COLOR?:RiveColorARGB;
	BUTTON_BORDER_HOVER_COLOR?:RiveColorARGB;
	BUTTON_CLICK_FX_COLOR?:RiveColorARGB;
	BACKDROP_COLOR?:RiveColorARGB;
	BACKDROP_BORDER_COLOR?:RiveColorARGB;
	BACKDROP_BORDER_HOVER_COLOR?:RiveColorARGB;
	BACKDROP_HOVER_COLOR?:RiveColorARGB;
	BACKDROP_SELECTED_COLOR?:RiveColorARGB;
	BACKDROP_DISABLED_COLOR?:RiveColorARGB;
}
export class RiveButtonObject extends RiveAnimationObject
{
	private _debugButton = false;

	private _buttonMode:RIVE_BUTTON_MODES = RIVE_BUTTON_MODES.BUTTON;
	public get RiveButtonMode():RIVE_BUTTON_MODES { return this._buttonMode; }

	constructor(riveDef:RiveObjectDef,artboard:Artboard)
	{
		super(riveDef,artboard);
	}

	public Update(time:number,frameCount:number,onceSecond:boolean)
	{
		if(this.enabled === false) return;

		super.Update(time,frameCount,onceSecond);
	}

	public InitRiveButton(buttonMode:RIVE_BUTTON_MODES = RIVE_BUTTON_MODES.BUTTON, colorsObj?:RiveButtonColors)
	{
		if(this._debugButton) console.log(' InitRiveButton('+buttonMode+') ',colorsObj);

		if(colorsObj === undefined)
		{
			colorsObj = {
		 		BACKDROP_COLOR: RivePakUtils.HexToArgb('#f42020ff'),
				BACKDROP_BORDER_COLOR: RivePakUtils.HexToArgb('#000000ff'),
				BACKDROP_BORDER_HOVER_COLOR: RivePakUtils.HexToArgb('#4d0083ff'),
				BACKDROP_HOVER_COLOR: RivePakUtils.HexToArgb('#1fd11cff'),
				BACKDROP_SELECTED_COLOR: RivePakUtils.HexToArgb('#ffffffff'),
				BACKDROP_DISABLED_COLOR: RivePakUtils.HexToArgb('#000000ff'),
				BUTTON_CLICK_FX_COLOR: RivePakUtils.HexToArgb('#f6ff00ff')
			} as RiveButtonColors;
		}

		this._buttonMode = buttonMode;

		if(colorsObj && this.ViewModelInstance)
		{
			for(const [key, value] of Object.entries(colorsObj) as [string, RiveColorARGB | undefined][])
			{
				if(value !== undefined)
				{
					const [a, r, g, b] = value;
					const colorInput = this.ViewModelInstance.color(`${this.baseRiveVMPath}${key}`);
					if(colorInput)
					{
						colorInput.argb(a, r, g, b);
					}
				}
			}
		}
	}

	protected _riveButtonEnabled:boolean = true;
	public DisableButton()
	{
		if(this._riveButtonEnabled)
		{
			this._riveButtonEnabled = false;
			this.QueueViewModelEnumChange('BUTTON_STATE', RIVE_BUTTON_STATES.UP);
			this.QueueViewModelEnumChange('BUTTON_STATE', RIVE_BUTTON_STATES.DISABLED);
		}
	}

	public EnableButton()
	{
		if(!this._riveButtonEnabled)
		{
			this._riveButtonEnabled = true;
			this.QueueViewModelEnumChange('BUTTON_STATE', RIVE_BUTTON_STATES.DISABLED);
			this.QueueViewModelEnumChange('BUTTON_STATE', RIVE_BUTTON_STATES.UP);
		}
	}

	private setButtonState(state:RIVE_BUTTON_STATES)
	{
		if(this._debugButton) console.log(' setButtonState('+this._buttonMode+'):', state);
		this.ViewModelInstance!.enum(`${this.baseRiveVMPath}BUTTON_STATE`).value = state;
	}
	//BUTTON_CLICK_FX_COLOR

	protected onClick(event:MouseEvent | PointerEvent | PIXI.PixiTouch)
	{
		if(this._debugButton) console.log('%c onClick('+this._buttonMode+') - this._buttonMode:'+this._buttonMode+',  this.baseRiveVMPath:'+this.baseRiveVMPath, 'color: blue;');

		//this.InputByName("BUTTON_CLICK_EVENT")!.asTrigger().fire();

		if(this.ViewModelInstance && this._riveButtonEnabled)
		{
			if(this._buttonMode === RIVE_BUTTON_MODES.BUTTON)
			{
				if(this._debugButton) console.log('%c onClick('+this._buttonMode+') - BUTTON CLICK!', 'color: red;');
				this.InputByName("BUTTON_CLICK_EVENT")!.asTrigger().fire();
			}
			else if(this._buttonMode === RIVE_BUTTON_MODES.TOGGLE)
			{
				if(this.ViewModelInstance.enum(`${this.baseRiveVMPath}BUTTON_STATE`).value === RIVE_BUTTON_STATES.SELECTED)
				{
					if(this._debugButton) console.log('%c onClick('+this._buttonMode+') - UnSelect!', 'color: red;');
					this.setButtonState(RIVE_BUTTON_STATES.UNSELECTED);
				}
				else
				{
					if(this._debugButton) console.log('%c onClick('+this._buttonMode+') - SELECT!', 'color: red;');
					this.setButtonState(RIVE_BUTTON_STATES.SELECTED);
				}
			}
		}

		super.onClick(event);
	}

	protected onHover()
	{
		if(this.ViewModelInstance!.enum(`${this.baseRiveVMPath}BUTTON_STATE`).value !== RIVE_BUTTON_STATES.SELECTED)
		{
			if(this._riveButtonEnabled)
			{
				if(this._debugButton) console.log('%c onHover('+this._buttonMode+') - Pod Type OVER', 'color: green;');
				this.setButtonState(RIVE_BUTTON_STATES.OVER);
			}
			else
			{
				if(this._debugButton) console.log('%c onHover('+this._buttonMode+') - Pod Type DISABLED OVER', 'color: green;');
				this.setButtonState(RIVE_BUTTON_STATES.DISABLED_OVER);
			}
		}

		super.onHover();
	}

	protected onHoverOut()
	{
		if(this.ViewModelInstance!.enum(`${this.baseRiveVMPath}BUTTON_STATE`).value === RIVE_BUTTON_STATES.SELECTED)
		{
			this.setButtonState(RIVE_BUTTON_STATES.SELECTED);
		}
		else
		{
			if(this._riveButtonEnabled)
			{
				if(this._debugButton)  console.log('%c onHoverOut('+this._buttonMode+') - Pod Type OUT', 'color: green;');
				this.setButtonState(RIVE_BUTTON_STATES.OUT);
			}
			else
			{
				if(this._debugButton) console.log('%c onHoverOut('+this._buttonMode+') - Pod Type DISABLED', 'color: green;');
				this.setButtonState(RIVE_BUTTON_STATES.DISABLED);
			}
		}

		super.onHoverOut();
	}

	public Dispose(): void
	{
		super.Dispose();
	}
}
