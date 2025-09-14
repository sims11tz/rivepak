/**
 * UI Event Types for RivePak UI Components
 */

export enum UIEventType
{
	// Value change events
	CHANGE = 'ui:change',
	INPUT = 'ui:input',
	
	// Interaction events
	CLICK = 'ui:click',
	DOWN = 'ui:down',
	UP = 'ui:up',
	PRESS = 'ui:press',
	RELEASE = 'ui:release',
	OVER = 'ui:over',
	OUT = 'ui:out',
	
	// Focus events
	FOCUS = 'ui:focus',
	BLUR = 'ui:blur',
	
	// Selection events
	SELECT = 'ui:select',
	DESELECT = 'ui:deselect',
	
	// Completion events
	COMPLETE = 'ui:complete',
	SUBMIT = 'ui:submit',
	
	// Group events
	SELECTION_CHANGE = 'ui:selection_change',
	
	// Modal events
	OPEN = 'ui:open',
	CLOSE = 'ui:close',
	
	// Validation events
	VALID = 'ui:valid',
	INVALID = 'ui:invalid',
	
	// State events
	ENABLE = 'ui:enable',
	DISABLE = 'ui:disable',
	SHOW = 'ui:show',
	HIDE = 'ui:hide',
	
	// Animation events
	ANIMATION_START = 'ui:animation_start',
	ANIMATION_END = 'ui:animation_end'
}

export interface UIEvent<T = any>
{
	type:UIEventType;
	target:any; // Will be BaseUIComponent
	value?:T;
	previousValue?:T;
	data?:any;
	timestamp:number;
}

export interface UIEventHandler<T = any>
{
	(event:UIEvent<T>):void;
}

// Common callback types
export type ChangeCallback<T = any> = (value:T, component:any) => void;
export type InteractionCallback = (component:any) => void;
export type ValidationCallback = (isValid:boolean, errors:string[]) => void;