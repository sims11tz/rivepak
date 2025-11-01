import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance, ViewModelInstance, ViewModelInstanceTrigger } from "@rive-app/webgl2-advanced";
import { RiveController, RiveObjectDef } from "../controllers/RiveController";
import { BaseCanvasObj, CanvasObjectEntity, GlobalUIDGenerator } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
import { PixiController } from "../controllers/PixiController";
import { CanvasEngine } from "../useCanvasEngine";
import { RiveTimelineController } from "./RiveTimelineController";

/* RIVE COMMON ENUMS AND TYPES */
	export enum RIVEBUS_COMMON_APP_TO_RIVE_EVENTS
	{
		BUTTON_CLICK_EVENT = "BUTTON_CLICK_EVENT",
		REQUEST_TRANSITION_IN = "REQUEST_TRANSITION_IN",
		REQUEST_TRANSITION_OUT = "REQUEST_TRANSITION_OUT",
	}

	export enum RIVE_COMMON_ENUMS
	{
		VISIBLE = "VISIBLE",
		BUTTON_CLICK_FX_COLOR = "BUTTON_CLICK_FX_COLOR",
		BUTTON_STATE = "BUTTON_STATE"
	}

	export enum RIVEBUS_COMMON_RIVE_TO_APP_EVENTS
	{
		EVENT_TRANSITION_IN_STARTED = "EVENT_TRANSITION_IN_STARTED",
		EVENT_TRANSITION_IN_COMPLETED = "EVENT_TRANSITION_IN_COMPLETED",
		EVENT_TRANSITION_OUT_STARTED = "EVENT_TRANSITION_OUT_STARTED",
		EVENT_TRANSITION_OUT_COMPLETED = "EVENT_TRANSITION_OUT_COMPLETED"
	}

	export enum RIVE_COMMON_VISIBLE
	{
		TRUE = "TRUE",
		FALSE = "FALSE",
	}

	export enum RIVE_COMMON_ACTIVE
	{
		TRUE = "TRUE",
		FALSE = "FALSE",
	}

	export enum RIVE_COMMON_SELECTED
	{
		TRUE = "TRUE",
		FALSE = "FALSE",
	}
/* RIVE COMMON ENUMS AND TYPES */

export class AnimationMetadata
{
	public readonly animation:LinearAnimationInstance;
	public readonly artboard:Artboard;
	public readonly index:number;
	public readonly name:string;
	public readonly duration:number;
	public readonly speed:number;
	public readonly fps:number;
	public autoPlay:boolean = true;
	public isTimelineControlled:boolean = false;
	private _uuid:string;
	public get uuid():string { return this._uuid; }

	constructor(artboard:Artboard, animation: LinearAnimationInstance, index: number, name: string, duration: number, autoPlay: boolean = true)
	{
		this._uuid = GlobalUIDGenerator.generateUID();

		this.artboard = artboard;
		this.animation = animation;
		this.index = index;
		this.name = name;
		this.duration = duration;
		this.speed = (animation as any).speed ?? 1;
		this.fps = (animation as any).fps ?? 60;
		this.autoPlay = autoPlay;
		this.isTimelineControlled = false;
	}
}

export enum RIVE_CURSOR_TYPES
{
	DEFAULT = 'default',
	POINTER = 'pointer',
	GRAB = 'grab',
	CROSSHAIR = 'crosshair',
	NOT_ALLOWED = 'not-allowed',
	N_RESIZE = 'n-resize',
	EW_RESIZE = 'ew-resize',
	NESW_RESIZE = 'nesw-resize'
}

export type RiveInstance = Awaited<ReturnType<typeof RiveCanvas>>;

export interface RiveArtboardBundle
{
	id:number;
	entityObj:EntityObj;
	artboard:Artboard;
	animations:LinearAnimationInstance[];
	stateMachine:StateMachineInstance | null;
	inputs:Map<string, SMIInput>;
}

export interface EntityObj
{
	width:number;
	height:number;
	body:Matter.Body | null;
}

// Queue action types for Rive operations
export type RiveActionQueueItem =
	| { type:'enum'; path:string; value:string }
	| { type:'trigger'; inputName:string }
	| { type:'boolean'; inputName:string; value:boolean }
	| { type:'number'; inputName:string; value:number };

export class CanvasRiveObj extends BaseCanvasObj
{
	private _artboard:Artboard;
	protected _renderer:Renderer;
	protected _riveInstance: Awaited<ReturnType<typeof RiveCanvas>>;

	protected  _animations:AnimationMetadata[];
	protected _stateMachine:StateMachineInstance | null = null;
	protected _inputs = new Map<string, SMIInput>();

	protected _viewModels = new Map<string, ViewModelInstance>();
	protected _viewModelInstance:ViewModelInstance | null = null;

	// Unified action queue for ViewModel changes and input actions
	private _actionQueue:Array<RiveActionQueueItem> = [];
	private _actionQueueProcessedThisFrame = false;

	// Event subscription syste
	public _triggerCallbacks = new Map<string, ((event:any) => void)[]>();
	// Cache resolved trigger references by eventName for efficient lookup
	// For wildcards, stores array of {trigger, metadata} objects
	protected _triggerCache = new Map<string, any>();
	// Track which triggers need their initial state cleared (to prevent auto-firing on first subscribe)
	private _triggersNeedingInitialClear = new Set<string>();
	// Store all unsubscribe functions for automatic cleanup in Dispose
	private _triggerUnsubscribeFunctions:Array<() => void> = [];

	/**
	 * Subscribe to a Rive event by name
	 * @param eventName The name of the Rive event to listen for
	 * @param callback Function to call when the event fires
	 * @returns Unsubscribe function
	 */
	public OnRiveTrigger(eventName:string, callback:(event:any) => void, required:boolean=true):(() => void) | null
	{
		// Check if this is a wildcard pattern
		const hasWildcard = eventName.includes('*');

		if(!this._triggerCache.has(eventName))
		{
			if(hasWildcard)
			{
				// Resolve wildcard pattern to multiple triggers
				const triggers = this._resolveWildcardTriggers(eventName);
				if(triggers.length > 0)
				{
					this._triggerCache.set(eventName, triggers);
					// Mark this eventName as needing initial clear on next Update
					this._triggersNeedingInitialClear.add(eventName);
					//console.log(`%c  [OnRiveTrigger] Resolved wildcard "${eventName}" to ${triggers.length} trigger(s)`, 'color: #00ffff;');
				}
				else
				{
					if(required) console.warn(`%c  [OnRiveTrigger] Could not find any triggers matching wildcard "${eventName}"`, 'color: #ff0000;');
					return null;
				}
			}
			else
			{
				// Normal single trigger resolution
				const trigger = this._viewModelProperty(eventName, 'trigger', required) as ViewModelInstanceTrigger | null;
				if(trigger)
				{
					//if(debug) console.log('RESOLVED SINGLE TRIGGER...'+eventName);
					this._triggerCache.set(eventName, trigger);
					this._triggersNeedingInitialClear.add(eventName);
				}
				else
				{
					if(required) console.warn(`%c  [OnRiveTrigger] Could not find trigger "${eventName}" to subscribe to`, 'color: #ff0000;');
					return null;
				}
			}
		}

		// Store callback
		if(!this._triggerCallbacks.has(eventName))
		{
			this._triggerCallbacks.set(eventName, []);
		}
		this._triggerCallbacks.get(eventName)!.push(callback);

		// Return unsubscribe function
		const unsubscribe = () =>
		{
			const callbacks = this._triggerCallbacks.get(eventName);
			if(callbacks)
			{
				const index = callbacks.indexOf(callback);
				if(index !== -1)
				{
					callbacks.splice(index, 1);
				}
			}
		};

		// Store unsubscribe function for automatic cleanup in Dispose
		this._triggerUnsubscribeFunctions.push(unsubscribe);

		return unsubscribe;
	}

	/**
	 * Resolves a wildcard trigger pattern to multiple concrete triggers
	 * Example: "/ColorSlot*VM/TRIGGER" → [ColorSlot1VM/TRIGGER, ColorSlot2VM/TRIGGER, ...]
	 * NOTE: Uses strict matching - no fallback searches. Only matches exact ViewModel names.
	 */
	private _resolveWildcardTriggers(wildcardPath:string):Array<{trigger:ViewModelInstanceTrigger; vmName:string; index:number}>
	{
		const results:Array<{trigger:ViewModelInstanceTrigger; vmName:string; index:number}> = [];

		// Parse the wildcard path
		const parts = wildcardPath.split('/').filter(p => p.length > 0);
		if(parts.length !== 2) return results; // Only support "/ViewModelPattern/PropertyName" format

		const [vmPattern, propertyName] = parts;

		// Extract prefix and suffix from pattern (e.g., "ColorSlot*VM" → prefix="ColorSlot", suffix="VM")
		const wildcardIndex = vmPattern.indexOf('*');
		if(wildcardIndex === -1) return results;

		const prefix = vmPattern.substring(0, wildcardIndex);
		const suffix = vmPattern.substring(wildcardIndex + 1);

		// Try numbered ViewModels starting from 1
		for(let i = 1; i <= 100; i++) // Limit to 100 to prevent infinite loop
		{
			const vmName = `${prefix}${i}${suffix}`;

			// Use strict resolution - no fallback searches
			const trigger = this._resolveViewModelPropertyStrict(vmName, propertyName, 'trigger') as ViewModelInstanceTrigger | null;

			if(trigger)
			{
				results.push({trigger, vmName, index:i});
			}
			else
			{
				// Stop when we can't find the next numbered ViewModel
				break;
			}
		}

		return results;
	}

	/**
	 * Strict ViewModel property resolver - only looks in registered VMs and nested VMs
	 * Does NOT fall back to searching all ViewModels
	 * Used by wildcard resolution to prevent false matches
	 */
	private _resolveViewModelPropertyStrict<T = any>(
		viewModelName:string,
		propertyName:string,
		propertyType:'trigger' | 'enum' | 'color' | 'number' | 'string' | 'boolean' | 'list' | 'image' | 'artboard' | 'viewModel'
	):T | null
	{
		// First try registered viewModels
		const vmi = this._viewModels.get(viewModelName);
		if(vmi)
		{
			try
			{
				const property = (vmi as any)[propertyType](propertyName);
				if(property)
				{
					return property;
				}
			}
			catch(e)
			{
				// Property doesn't exist in this viewModel
			}
		}

		// Try to find nested ViewModel by exact name
		const nestedVMI = this._findNestedViewModel(this._viewModelInstance, viewModelName);
		if(nestedVMI)
		{
			try
			{
				const property = (nestedVMI as any)[propertyType](propertyName);
				if(property)
				{
					return property;
				}
			}
			catch(e)
			{
				// Property doesn't exist
			}
		}

		// Also search through all registered viewModels recursively
		for(const [vmName, vmi] of this._viewModels)
		{
			const nestedVMI2 = this._findNestedViewModel(vmi, viewModelName);
			if(nestedVMI2)
			{
				try
				{
					const property = (nestedVMI2 as any)[propertyType](propertyName);
					if(property)
					{
						return property;
					}
				}
				catch(e)
				{
					// Continue searching
				}
			}
		}

		// NOT FOUND - return null (no fallback searching)
		return null;
	}

	/**
	 * Recursively searches for a nested ViewModel by name within a parent ViewModel
	 * @param parentVMI - The parent ViewModelInstance to search within
	 * @param targetName - The name of the nested ViewModel to find
	 * @returns The found ViewModelInstance or null
	 */
	private _findNestedViewModel(parentVMI:ViewModelInstance | null, targetName:string):ViewModelInstance | null
	{
		if(!parentVMI) return null;

		try
		{
			// First try to directly access the target as a viewModel
			try
			{
				const nestedVMI = parentVMI.viewModel(targetName);
				if(nestedVMI)
				{
					return nestedVMI;
				}
			}
			catch(e)
			{
				// Not a direct child viewModel, continue searching
			}

			// Get all properties and recursively search through nested viewModels
			const propCount = parentVMI.propertyCount;
			const properties = parentVMI.getProperties();

			for(let i = 0; i < propCount; i++)
			{
				const prop = properties[i];
				if(prop)
				{
					try
					{
						// Try to get this property as a viewModel
						const nestedVMI = parentVMI.viewModel(prop.name);
						if(nestedVMI)
						{
							// Check if this is the target
							if(prop.name === targetName)
							{
								return nestedVMI;
							}

							// Recursively search this nested VM
							const found = this._findNestedViewModel(nestedVMI, targetName);
							if(found) return found;
						}
					}
					catch(e)
					{
						// Not a viewModel property, continue
					}
				}
			}
		}
		catch(e)
		{
			// Error accessing properties, return null
		}

		return null;
	}

	/**
	 * Generic resolver for ViewModel properties (trigger, enum, color, number, etc.)
	 * Supports:
	 * - "PROPERTY_NAME" -> looks in this._viewModelInstance
	 * - "/PROPERTY_NAME" -> looks in this._viewModelInstance
	 * - "/viewModelName/PROPERTY_NAME" -> looks in this._viewModels.get(viewModelName) or nested
	 * - Falls back to searching all viewModels
	 *
	 * @param path - The path to the property (e.g., "MY_TRIGGER", "/nested/MY_COLOR")
	 * @param propertyType - The type of property to resolve ('trigger', 'enum', 'color', 'number', etc.)
	 * @returns The resolved property or null
	 */
	protected _viewModelProperty<T = any>(path:string, propertyType:'trigger' | 'enum' | 'color' | 'number' | 'string' | 'boolean' | 'list' | 'image' | 'artboard' | 'viewModel',required:boolean=true):T | null
	{
		const debug = false;
		if(debug) console.log(`%c [_viewModelProperty] Resolving ${propertyType} at path "${path}"`, 'color: #1ba014ff;');

		const slashCount = (path.match(/\//g) || []).length;

		// Case 1: No slash or single leading slash (no trailing slash)
		// Try this._viewModelInstance first
		if(slashCount === 0 || (slashCount === 1 && path.startsWith('/') && !path.endsWith('/')))
		{
			if(debug) console.log(`%c [_viewModelProperty] A1 `, 'color: #9687edff;');
			const propertyName = path.startsWith('/') ? path.substring(1) : path;

			if(this._viewModelInstance)
			{
				if(debug) console.log(`%c [_viewModelProperty] A2 `, 'color: #9687edff;');
				try
				{
					const property = (this._viewModelInstance as any)[propertyType](propertyName);
					if(debug) console.log(`%c [_viewModelProperty] A3 `, 'color: #9687edff;');
					if(property)
					{
						if(debug) console.log(`%c [_viewModelProperty] A4 `, 'color: #9687edff;');
						if(debug) console.log(`%c [_viewModelProperty] Found ${propertyType} "${propertyName}" in _viewModelInstance`, 'color: #00ff00;');
						return property;
					}
				}
				catch(e)
				{
					// Property doesn't exist in this viewModel, continue to fallback
					if(debug) console.log(`%c [_viewModelProperty] AERROR `, 'color: #9687edff;');
				}
			}
			else
			{
				if(debug) console.log(`%c [_viewModelProperty] A uhhhh wtf bitch 1 `, 'color: #9687edff;');
			}
		}

		// Case 2: Two or more slashes - parse viewModel path and property name
		if(slashCount >= 2)
		{
			if(debug) console.log(`%c [_viewModelProperty] B1 `, 'color: #9687edff;');
			const parts = path.split('/').filter(p => p.length > 0);
			if(parts.length === 2)
			{
				if(debug) console.log(`%c [_viewModelProperty] B2 `, 'color: #9687edff;');
				const [viewModelName, propertyName] = parts;

				// FIRST: Check if the property exists directly in root _viewModelInstance
				// This handles cases like "/AvatarPODVM/TRIGGER" where AvatarPODVM is the root VM name
				if(this._viewModelInstance)
				{
					if(debug) console.log(`%c [_viewModelProperty] B3 `, 'color: #9687edff;');
					try
					{
						const property = (this._viewModelInstance as any)[propertyType](propertyName);
						if(debug) console.log(`%c [_viewModelProperty] B4 `, 'color: #9687edff;');
						if(property)
						{
							if(debug) console.log(`%c [_viewModelProperty] B5 `, 'color: #9687edff;');
							if(debug) console.log(`%c [_viewModelProperty] Found ${propertyType} "${propertyName}" in root _viewModelInstance (path was "${path}")`, 'color: #00ff00;');
							return property;
						}
					}
					catch(e)
					{
						if(debug) console.log(`%c [_viewModelProperty] Berror `, 'color: #9687edff;');
						// Property doesn't exist in root viewModel, continue searching
					}
				}

				if(debug) console.log(`%c [_viewModelProperty] B6 `, 'color: #9687edff;');
				// SECOND: Try registered viewModels
				const vmi = this._viewModels.get(viewModelName);
				if(vmi)
				{
					if(debug) console.log(`%c [_viewModelProperty] B7 `, 'color: #9687edff;');
					try
					{
						if(debug) console.log(`%c [_viewModelProperty] B8 `, 'color: #9687edff;');
						const property = (vmi as any)[propertyType](propertyName);
						if(property)
						{
							if(debug) console.log(`%c [_viewModelProperty] B9 `, 'color: #9687edff;');
							if(debug) console.log(`%c [_viewModelProperty] Found ${propertyType} "${propertyName}" in registered VM "${viewModelName}"`, 'color: #00ff00;');
							return property;
						}
					}
					catch(e)
					{
						if(debug) console.log(`%c [_viewModelProperty] Berror `, 'color: #9687edff;');
						// Property doesn't exist in this viewModel, continue
					}
				}
				else
				{
					if(debug) console.log(`%c [_viewModelProperty] C1 `, 'color: #9687edff;');
					// ViewModelName not found in _viewModels, search recursively
					if(debug) console.log(`%c [_viewModelProperty] Searching for nested VM "${viewModelName}"`, 'color: #ffcc00;');
					const nestedVMI = this._findNestedViewModel(this._viewModelInstance, viewModelName);
					if(nestedVMI)
					{
						if(debug) console.log(`%c [_viewModelProperty] C2 `, 'color: #9687edff;');
						try
						{
							const property = (nestedVMI as any)[propertyType](propertyName);
							if(debug) console.log(`%c [_viewModelProperty] C3 `, 'color: #9687edff;');
							if(property)
							{
								if(debug) console.log(`%c [_viewModelProperty] C4 `, 'color: #9687edff;');
								if(debug) console.log(`%c [_viewModelProperty] Found ${propertyType} "${propertyName}" in nested VM "${viewModelName}"`, 'color: #00ff00;');
								return property;
							}
						}
						catch(e)
						{
							if(debug) console.log(`%c [_viewModelProperty] Cerror `, 'color: #9687edff;');
							// Property doesn't exist, continue
						}
					}

					if(debug) console.log(`%c [_viewModelProperty] C5 `, 'color: #9687edff;');
					// Also search through all registered viewModels recursively
					for(const [vmName, vmi] of this._viewModels)
					{
						const nestedVMI2 = this._findNestedViewModel(vmi, viewModelName);
						if(debug) console.log(`%c [_viewModelProperty] C6 `, 'color: #9687edff;');
						if(nestedVMI2)
						{
							try
							{
								const property = (nestedVMI2 as any)[propertyType](propertyName);
								if(debug) console.log(`%c [_viewModelProperty] C7 `, 'color: #9687edff;');
								if(property)
								{
									if(debug) console.log(`%c [_viewModelProperty] C8 `, 'color: #9687edff;');
									if(debug) console.log(`%c [_viewModelProperty] Found ${propertyType} "${propertyName}" in nested VM "${viewModelName}" within "${vmName}"`, 'color: #00ff00;');
									return property;
								}
							}
							catch(e)
							{
								if(debug) console.log(`%c [_viewModelProperty] Cerror `, 'color: #9687edff;');
								// Continue searching
							}
						}
					}
				}
			}
		}

		// Case 3: Fallback - search through all viewModels
		const propertyName = path.split('/').filter(p => p.length > 0).pop() || path;
		if(debug) console.log(`%c [_viewModelProperty] D1 `, 'color: #9687edff;');
		for(const [vmName, vmi] of this._viewModels)
		{
			try
			{
				if(debug) console.log(`%c [_viewModelProperty] D2 `, 'color: #9687edff;');
				const property = (vmi as any)[propertyType](propertyName);
				if(property)
				{
					if(debug) console.log(`%c [_viewModelProperty] De `, 'color: #9687edff;');
					if(debug) console.log(`%c [_viewModelProperty] Found ${propertyType} "${propertyName}" in VM "${vmName}" (fallback)`, 'color: #ffcc00;');
					return property;
				}
			}
			catch(e)
			{
				if(debug) console.log(`%c [_viewModelProperty] Derror `, 'color: #9687edff;');
				// Continue searching
			}
		}

		// Case 4: Give up gracefully
		if(required) console.warn(`%c [_viewModelProperty] Could not find ${propertyType} "${path}" in any viewModel`, 'color: #ff0000;');
		return null;
	}

	/**
	 * Remove all event listeners for a specific event name
	 */
	public ClearRiveTriggerListeners(eventName:string):void
	{
		this._triggerCallbacks.delete(eventName);
	}

	/**
	 * Remove all event listeners
	 */
	public ClearAllRiveTriggerListeners():void
	{
		this._triggerCallbacks.clear();
	}


	// Event subscription syste
	private _eventCallbacks = new Map<string, ((event:any) => void)[]>();

	/**
	 * Subscribe to a Rive event by name
	 * @param eventName The name of the Rive event to listen for
	 * @param callback Function to call when the event fires
	 * @returns Unsubscribe function
	 */
	public OnRiveEventDeprecated(eventName:string, callback:(event:any) => void):() => void
	{
		console.warn(`%c DEPRECATED... use viewModel trigger[CanvasRiveObj] OnRiveEventDeprecated subscribed to "${eventName}"`, 'color: #ff3700ff;');
		if(!this._eventCallbacks.has(eventName))
		{
			this._eventCallbacks.set(eventName, []);
		}
		this._eventCallbacks.get(eventName)!.push(callback);

		// Return unsubscribe function
		return () =>
		{
			const callbacks = this._eventCallbacks.get(eventName);
			if(callbacks)
			{
				const index = callbacks.indexOf(callback);
				if(index !== -1)
				{
					callbacks.splice(index, 1);
				}
			}
		};
	}

	public TransitionOut():void
	{
		//const boundTrigger = this.OnRiveTrigger("/"+RIVEBUS_COMMON_RIVE_TO_APP_EVENTS.EVENT_TRANSITION_IN_STARTED, () =>
		//{
		//	console.log('%c RiveObj Transition In Started -> making visible: '+this._label,'color:#00FFFF');
		//	this.QueueViewModelEnumChange(RIVE_COMMON_ENUMS.VISIBLE, RIVE_COMMON_VISIBLE.TRUE);
		//	this.visible = true;
		//},false);

		//if(boundTrigger != null)
		//{
		//	console.log('%c RiveObj bound trigger... start as false: '+this._label,'color:#00FFFF');
		//	this.visible = false;
		//	this.ViewModelInstance!.enum(RIVE_COMMON_ENUMS.VISIBLE).value = RIVE_COMMON_VISIBLE.FALSE;
		//}
		//else
		//{
		//	this.visible = true;
		//}
		console.log('%c RiveObj Transition Out requested: '+this._label,'color:#FF00FF');
		this.QueueInputTrigger(RIVEBUS_COMMON_APP_TO_RIVE_EVENTS.REQUEST_TRANSITION_OUT);
	}

	/**
	 * Remove all event listeners for a specific event name
	 */
	public ClearRiveEventListeners(eventName:string):void
	{
		this._eventCallbacks.delete(eventName);
	}

	/**
	 * Remove all event listeners
	 */
	public ClearAllRiveEventListeners():void
	{
		this._eventCallbacks.clear();
	}

	public SetViewModelInstance(vmi:ViewModelInstance | null)
	{
		const debug = false;
		if(debug)
		{
			console.log(`📝 SetViewModelInstance called for "${this._label}"`);
			console.log(`   VMI is null?`, vmi === null);
			console.log(`   State Machine exists?`, !!this._stateMachine);
			console.log(`   State Machine name:`, this._stateMachine?.name);
		}

		this._viewModelInstance = vmi;

		if(vmi && this._stateMachine && typeof this._stateMachine.bindViewModelInstance === "function")
		{
			if(debug) console.log(`🔗 Binding VMI to State Machine "${this._stateMachine.name}" for object "${this._label}"`);
			this._stateMachine.bindViewModelInstance(vmi);
			if(debug) console.log(`✅ VMI successfully bound to State Machine!`);
		}
		else
		{
			if(debug) console.log(`❌ Cannot bind VMI to State Machine:`);
			if(!vmi) console.log(`   - VMI is null`);
			if(debug && !this._stateMachine) console.log(`   - State Machine is null`);
			if(this._stateMachine && typeof this._stateMachine.bindViewModelInstance !== "function")
			if(debug) console.log(`   - bindViewModelInstance is not a function`);
		}
	}

	public get ViewModelInstance(): ViewModelInstance | null
	{
		return this._viewModelInstance;
	}

	/**
	 * Check if a specific ViewModel exists by name
	 * @param vmName - The name of the ViewModel to check
	 * @returns true if the ViewModel exists, false otherwise
	 */
	public HasViewModel(vmName:string):boolean
	{
		return this._viewModels.has(vmName);
	}

	/**
	 * Get a specific ViewModel by name
	 * @param vmName - The name of the ViewModel to retrieve
	 * @returns The ViewModelInstance or null if not found
	 */
	public GetViewModel(vmName:string):ViewModelInstance | null
	{
		return this._viewModels.get(vmName) ?? null;
	}

	/**
	 * Register a ViewModel by name
	 * @param vmName - The name to register the ViewModel under
	 * @param vmi - The ViewModelInstance to register
	 */
	public RegisterViewModel(vmName:string, vmi:ViewModelInstance):void
	{
		this._viewModels.set(vmName, vmi);
	}

	/**
	 * Queue a ViewModel enum change to be applied in the next frame.
	 * This ensures State Machines process changes one per frame in sequence.
	 * @param path - The path to the enum property (e.g., "POD_TYPE")
	 * @param value - The string value to set (e.g., "SPACE")
	 */
	public QueueViewModelEnumChange(path:string, value:string):void
	{
		//console.log('%c QueueViewModelEnumChange path='+path+', value='+value, 'color: #ffc400; font-weight: bold;');

		if(!this._viewModelInstance)
		{
			//console.warn(`QueueViewModelEnumChange: No ViewModelInstance available for "${this._label}"`);
			return;
		}
		this._actionQueue.push({type:'enum', path, value});
		//console.log(`📋 Queued enum change: ${path} = ${value} (queue length: ${this._actionQueue.length})`);
	}

	/**
	 * Queue an input trigger to be fired in the next available frame.
	 * This ensures State Machines process triggers one per frame in sequence.
	 * @param inputName - The name of the trigger input (e.g., "FADE_IN_EVENT")
	 */
	public QueueInputTrigger(inputName:string):void
	{
		this._actionQueue.push({type:'trigger', inputName});
		//console.log(`📋 Queued trigger: ${inputName} (queue length: ${this._actionQueue.length})`);
	}

	/**
	 * Queue an input boolean change to be applied in the next available frame.
	 * @param inputName - The name of the boolean input
	 * @param value - The boolean value to set
	 */
	public QueueInputBoolean(inputName:string, value:boolean):void
	{
		this._actionQueue.push({type:'boolean', inputName, value});
		//console.log(`📋 Queued boolean: ${inputName} = ${value} (queue length: ${this._actionQueue.length})`);
	}

	/**
	 * Queue an input number change to be applied in the next available frame.
	 * @param inputName - The name of the number input
	 * @param value - The number value to set
	 */
	public QueueInputNumber(inputName:string, value:number):void
	{
		this._actionQueue.push({type:'number', inputName, value});
		//console.log(`📋 Queued number: ${inputName} = ${value} (queue length: ${this._actionQueue.length})`);
	}

	/**
	 * Process the next queued action (ViewModel enum change or input action) - called once per frame in Update
	 */
	private _processActionQueue():void
	{
		if(this._actionQueue.length === 0) return;

		// Only process one action per frame
		if(this._actionQueueProcessedThisFrame) return;

		const action = this._actionQueue.shift();
		if(action)
		{
			try
			{
				switch(action.type)
				{
					case 'enum':
						if(this._viewModelInstance)
						{
							this._viewModelInstance.enum(action.path).value = action.value;
							//console.log(`✅ Applied queued enum: ${action.path} = ${action.value} (${this._actionQueue.length} remaining)`);
						}
						break;

					case 'trigger':
						{
							const input = this.InputByName(action.inputName);
							if(input)
							{
								input.asTrigger().fire();
								//console.log(`✅ Fired queued trigger: ${action.inputName} (${this._actionQueue.length} remaining)`);
							}
							else
							{
								console.warn(`❌ Input not found for trigger: ${action.inputName}`);
							}
						}
						break;

					case 'boolean':
						{
							const input = this.InputByName(action.inputName);
							if(input)
							{
								input.asBool().value = action.value;
								//console.log(`✅ Applied queued boolean: ${action.inputName} = ${action.value} (${this._actionQueue.length} remaining)`);
							}
							else
							{
								console.warn(`❌ Input not found for boolean: ${action.inputName}`);
							}
						}
						break;

					case 'number':
						{
							const input = this.InputByName(action.inputName);
							if(input)
							{
								input.asNumber().value = action.value;
								//console.log(`✅ Applied queued number: ${action.inputName} = ${action.value} (${this._actionQueue.length} remaining)`);
							}
							else
							{
								console.warn(`❌ Input not found for number: ${action.inputName}`);
							}
						}
						break;
				}
			}
			catch(error)
			{
				console.error(`❌ Failed to apply queued action:`, action, error);
			}
			this._actionQueueProcessedThisFrame = true;
		}
	}

	private _riveObjDef:RiveObjectDef;
	public get riveObjDef():RiveObjectDef { return this._riveObjDef; }

	private _artboardName: string = "";
	public get artboardName(): string { return this._artboardName; }

	private _filePath: string = "";
	public get filePath(): string { return this._filePath; }

	protected _baseRiveVMPath: string = "";
	public get baseRiveVMPath(): string { return this._baseRiveVMPath; }

	constructor(riveDef:RiveObjectDef, artboard: Artboard)
	{
		super(riveDef);

		this._riveObjDef = riveDef;
		if(this._riveObjDef.id != undefined && this._riveObjDef.id != "")
		{
			this._id = this._riveObjDef.id;
		}

		this._artboardName = this._riveObjDef.artboardName ?? "";
		this._filePath = this._riveObjDef.filePath ?? "";

		this._renderer = RiveController.get().Renderer!;
		this._riveInstance = RiveController.get().Rive!;
		this._artboard = artboard;
		this._animations = [];

	}

	private _lastMousePos = { x: -1, y: -1 };
	private _lastMouseDown = false;

	private _entityObj:CanvasObjectEntity | null = null;

	// Inspect all props/methods on a WASM-wrapped object (e.g., a Rive Node)
	private dumpWasmObject(obj: any)
	{
		const seen = new Set<string>();
		let level = 0;
		let proto: any = obj;

		while (proto && proto !== Object.prototype) {
			const ctorName = proto.constructor?.name ?? '(anonymous proto)';
			const keys = Reflect.ownKeys(proto) as (string | symbol)[];

			console.groupCollapsed(`[[proto level ${level}]] ${ctorName} — ${keys.length} keys`);

			for (const k of keys) {
			if (k === 'constructor') continue;
			const desc = Object.getOwnPropertyDescriptor(proto, k as any);
			if (!desc) continue;

			let kind = 'field';
			let arity = '';
			if (desc.get || desc.set) {
				kind = `accessor${desc.get ? '(get' : ''}${desc.set ? '/set)' : ')'}`;
			} else if (typeof desc.value === 'function') {
				kind = 'method';
				arity = `/${(desc.value as Function).length}`; // param count
			}

			const tag = `${String(k)}@${level}`;
			if (seen.has(tag)) continue;
			seen.add(tag);

			console.log(kind.padEnd(12), String(k), arity);
			}

			console.groupEnd();
			proto = Object.getPrototypeOf(proto);
			level++;
		}
	}

	public InitRiveObject():void
	{
		this._debugLogs = false;

		if(this._debugLogs)
		{
			console.log("");
			console.log('%c ___________________ INIT RIVE OBJECT ________________________','color:#00FFFF');
			console.log('%c Artboard Name: '+this.artboard.name,'color:#00FFFF');
			console.log(" artboard: ",this.artboard);
			console.log(" filePath: ",this.filePath);
			console.log('%c Artboard Width: '+this.artboard.width,'color:#00FFFF');
			console.log('%c Artboard Height: '+this.artboard.height,'color:#00FFFF');
		}

		this._initRiveObjectVisuals();

		this._initRiveObjectStates();
	}


	private _initRiveObjectVisuals():void
	{
		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

		if(this._debugLogs) console.log('%c InitRiveObject x:'+this.x+', y:'+this.y,'color:#00FFFF');

		const artboardWidth = this.artboard.width;
		const artboardHeight = this.artboard.height;
		const aspectRatio = artboardWidth / artboardHeight;

		if (this.defObj.width && this.defObj.height)
		{
			// CASE 1: Fully specified
			this.width = this.defObj.width;
			this.height = this.defObj.height;
			this.xScale = this.width / artboardWidth;
			this.yScale = this.height / artboardHeight;
		}
		else if (this.defObj.constrainProportions && this.defObj.width && !this.defObj.height)
		{
			// CASE 2: width specified, calculate height
			this.width = this.defObj.width;
			this.height = this.defObj.width / aspectRatio;
			this.xScale = this.width / artboardWidth;
			this.yScale = this.height / artboardHeight;
		}
		else if (this.defObj.constrainProportions && this.defObj.height && !this.defObj.width)
		{
			// CASE 3: height specified, calculate width
			this.height = this.defObj.height;
			this.width = this.defObj.height * aspectRatio;
			this.xScale = this.width / artboardWidth;
			this.yScale = this.height / artboardHeight;
		}
		else
		{
			// CASE 4: fallback to xScale/yScale or defaults
			this.width = artboardWidth;
			this.height = artboardHeight;

			this.xScale = this.defObj.xScale ?? 1;
			if (this.xScale > 0) this.width = artboardWidth * this.xScale;

			this.yScale = this.defObj.yScale ?? 1;
			if (this.yScale > 0) this.height = artboardHeight * this.yScale;
		}

		if(this._debugLogs)
		{
			console.log('%c CanvasRiveObj .. ALL done : x='+this.x+',y='+this.y+',w='+this.width+',h='+this.height+',xScale='+this.xScale+',yScale='+this.yScale,'color:#00FFFF');
		}

		if(this.centerGlobally)
		{
			this.x = CanvasEngine.get().width / 2;
			this.y = CanvasEngine.get().height / 2;
		}

		if(this.centerGlobally || this.centerLocally)
		{
			this.x -= (this.width / 2);
			this.y -= (this.height / 2);
		}

		if((this.defObj as RiveObjectDef).onClickCallback) this._onClickCallback = (this.defObj as RiveObjectDef).onClickCallback;
		if((this.defObj as RiveObjectDef).onHoverCallback) this._onHoverCallback = (this.defObj as RiveObjectDef).onHoverCallback;
		if((this.defObj as RiveObjectDef).onHoverOutCallback) this._onHoverOutCallback = (this.defObj as RiveObjectDef).onHoverOutCallback;

		if(this._debugLogs)
		{
			console.log("<"+this._label+"> CanvasRiveObj ---   position :: "+this.x+" - "+this.y+" ");
			console.log("<"+this._label+"> CanvasRiveObj --- dimensions :: "+this.width+"x"+this.height+" --- scale::"+this.xScale+"x"+this.yScale);
			console.log("<"+this._label+"> CanvasRiveObj ---   artboard :: "+this.artboard.width+"x"+this.artboard.height);

			//console.log("");
			console.log(" UPDATE BASE PROPS >>> "+this._label+" --- "+this.width+"x"+this.height+" --- "+this.xScale+"x"+this.yScale);
		}
		//this.UpdateBaseProps();

		if(this.defObj.interactive) this.initInteractive();

		if(this.defObj.text && this.defObj.text.length > 0) this.drawTextLabel();

		if(this._debugLogs)
		{
			//console.log("Artboard Bounds: ", this.artboard.bounds);
			//console.log("Artboard State Machine Count: "+this.artboard.stateMachineCount());
			console.log("Artboard Animation Count: "+this.artboard.animationCount());
		}

		this._animations = [];
		for (let j = 0; j < this.artboard.animationCount(); j++)
		{
			const animationDefinition = this.artboard.animationByIndex(j);
			//if(this._debugLogs) console.log("Animation["+j+"]: ________ "+animationDefinition.name+" loopValue:"+animationDefinition.loopValue);
			const animation = new this.Rive.LinearAnimationInstance( animationDefinition, this.artboard );

			const animDef = animationDefinition as any;

			if(this._debugLogs)
			{
				// Debug: Log all duration-related properties
				//console.log(`Animation[${j}] "${animationDefinition.name}" duration investigation:`);
				//console.log(`  - animDef.duration: ${animDef.duration}`);
				//console.log(`  - animDef.durationSeconds: ${animDef.durationSeconds}`);
				//console.log(`  - animDef.durationFrames: ${animDef.durationFrames}`);
				//console.log(`  - animDef.workEnd: ${animDef.workEnd}`);
				//console.log(`  - animDef.workStart: ${animDef.workStart}`);
				//console.log(`  - animDef.fps: ${animDef.fps ?? 60}`);
			}

			// Check if we're getting frames instead of seconds
			let duration = animDef.durationSeconds ?? animDef.duration ?? 0;
			const fps = animDef.fps ?? 60;

			// If duration seems to be in frames (e.g., 600 frames for 10 seconds at 60fps)
			// Check if the duration value is suspiciously large (likely frames)
			if(animDef.workEnd && animDef.workEnd > 100) {
				// workEnd appears to be in frames, convert to seconds
				duration = animDef.workEnd / fps;
				if(this._debugLogs) console.log(`  - Converting workEnd from frames (${animDef.workEnd}) to seconds: ${duration}s`);
			} else if(duration > 100) {
				// If duration is suspiciously large, it might be in frames
				if(this._debugLogs) console.log(`  - Duration seems to be in frames (${duration}), converting to seconds...`);
				duration = duration / fps;
			}

			//console.log(`  - FINAL duration: ${duration} seconds (${duration * fps} frames)`);

			//if(this._debugLogs) console.log("Animation["+j+"]: "+animationDefinition.name+" -- duration:"+duration+" -- fps:"+(animDef.fps ?? 60));

			const metadata = new AnimationMetadata(this.artboard, animation, j, animationDefinition.name, duration);
			this._animations.push(metadata);
		}
		if(this._debugLogs) console.log("Animations Loaded : "+this._animations.length);

		const smCount = this.artboard.stateMachineCount();
		if(this._debugLogs) console.log(`🎰 Artboard "${this.artboard.name}" has ${smCount} State Machine(s)`);

		this._stateMachine = smCount > 0 ? new this.Rive.StateMachineInstance(this.artboard.stateMachineByIndex(0),this.artboard): null;

		this._inputs = new Map<string, SMIInput>();
		if (this._stateMachine)
		{
			if(this._debugLogs)
			{
				console.log(`✅ State Machine "${this._stateMachine.name}" created successfully`);
				console.log("Has State Machine<"+this._stateMachine.inputCount()+">: "+this._stateMachine.name);
				console.log("Has State Machine<"+this._stateMachine.inputCount()+">: "+this._stateMachine.stateChangedCount());
			}

			for (let j = 0; j < this._stateMachine.inputCount(); j++)
			{
				const input = this._stateMachine.input(j);
				this._inputs.set(input.name, input);
				if(this._debugLogs) console.log("Input["+j+"]: "+input.name+" -- "+input.type+" -- "+input.value);
			}

			// CRITICAL: Bind VMI to State Machine if VMI was set before the State Machine was created
			// This handles the timing issue where SetViewModelInstance() is called during super() before the SM exists
			if(this._viewModelInstance && typeof this._stateMachine.bindViewModelInstance === "function")
			{
				if(this._debugLogs) console.log(`🔗 [Constructor] Binding VMI to State Machine "${this._stateMachine.name}" for "${this._label}"`);
				this._stateMachine.bindViewModelInstance(this._viewModelInstance);
				if(this._debugLogs) console.log('✅ [Constructor] VMI successfully bound to State Machine! :: '+this._viewModelInstance);
			}
		}
		else
		{
			if(this._debugLogs) console.log(`❌ No State Machine found in artboard "${this.artboard.name}"`);
		}

		this._entityObj = { x: this.x, y: this.y, width: this.width, height: this.height, xScale:this.xScale, yScale:this.yScale, riveInteractiveLocalOnly:this.defObj.riveInteractiveLocalOnly};

		this.ApplyResolutionScale(this._resolutionScale,'*');
	}

	private _initRiveObjectStates():void
	{
		this.OnRiveTrigger("/"+RIVEBUS_COMMON_RIVE_TO_APP_EVENTS.EVENT_TRANSITION_OUT_COMPLETED, () =>
		{
			console.log('%c RiveObj Transition Out Completed -> disposing: '+this._label,'color:#00FFFF');
			this.Dispose();
			CanvasEngine.get().RemoveCanvasObjects(this);
		},false);


		const boundTrigger = this.OnRiveTrigger("/"+RIVEBUS_COMMON_RIVE_TO_APP_EVENTS.EVENT_TRANSITION_IN_STARTED, () =>
		{
			console.log('%c RiveObj Transition In Started -> making visible: '+this._label,'color:#00FFFF');
			this.QueueViewModelEnumChange(RIVE_COMMON_ENUMS.VISIBLE, RIVE_COMMON_VISIBLE.TRUE);
			this.visible = true;
		},false);

		if(boundTrigger != null)
		{
			console.log('%c RiveObj bound trigger... start as false: '+this._label,'color:#00FFFF');
			this.visible = false;
			this.ViewModelInstance!.enum(RIVE_COMMON_ENUMS.VISIBLE).value = RIVE_COMMON_VISIBLE.FALSE;
		}
		else
		{
			this.visible = true;
		}
	}

	public updateEntityObj():void
	{
		this._entityObj!.x = this.x;
		this._entityObj!.y = this.y;
		this._entityObj!.width = this.width;
		this._entityObj!.height = this.height;
		this._entityObj!.xScale = this.xScale;
		this._entityObj!.yScale = this.yScale;
		this._entityObj!.riveInteractiveLocalOnly = this.defObj.riveInteractiveLocalOnly;
		this._entityObj!.resolutionScale = this._resolutionScale;
	}

	public InputByName(name: string):SMIInput | null
	{
		if (this._inputs.has(name))
		{
			return this._inputs.get(name)!;
		}
		else
		{
			console.warn("Input not found: " + name);
			return null;
		}
	}

	public RandomInput(): SMIInput | null
	{
		const randomIndex = Math.floor(Math.random() * this._inputs.size);
		return Array.from(this._inputs.values())[randomIndex];
	}

	public RandomInputByName(searchTerm: string): SMIInput | null
	{
		const matchingInputs: SMIInput[] = [];

		this._inputs.forEach((input) =>
		{
			if (input.name.toLowerCase().includes(searchTerm.toLowerCase()))
			{
				matchingInputs.push(input);
			}
		});

		if (matchingInputs.length === 0)
		{
			console.warn(`No matching inputs found for: ${searchTerm}`);
			return null;
		}

		const randomIndex = Math.floor(Math.random() * matchingInputs.length);
		return matchingInputs[randomIndex];
	}

	public GetAnimationByName(name: string): AnimationMetadata | null
	{
		const found = this._animations.find(animMeta => animMeta.name === name);
		return found || null;
	}

	public GetAnimationByIndex(index: number): AnimationMetadata | null
	{
		if (index >= 0 && index < this._animations.length)
		{
			return this._animations[index];
		}
		return null;
	}

	public GetAnimationsByNamePattern(searchTerm: string): AnimationMetadata[]
	{
		return this._animations.filter(animMeta =>
			animMeta.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}

	public GetAllAnimations(): AnimationMetadata[]
	{
		return [...this._animations];
	}

	public PlayAnimationByName(name: string): boolean
	{
		const animMeta = this.GetAnimationByName(name);
		if (animMeta)
		{
			animMeta.animation.advance(0);
			animMeta.animation.apply(1);
			return true;
		}
		console.warn(`Animation not found: ${name}`);
		return false;
	}

	public SetAnimationAutoPlay(name: string, autoPlay: boolean): boolean
	{
		const animMeta = this.GetAnimationByName(name);
		if (animMeta)
		{
			animMeta.autoPlay = autoPlay;
			return true;
		}
		console.warn(`Animation not found: ${name}`);
		return false;
	}

	public SetAllAnimationsAutoPlay(autoPlay: boolean): void
	{
		this._animations.forEach(animMeta => {
			animMeta.autoPlay = autoPlay;
		});
	}

	public DisableAutoPlayForAnimations(names: string[]): void
	{
		names.forEach(name => {
			this.SetAnimationAutoPlay(name, false);
		});
	}

	public Update(time:number, frameCount:number, onceSecond:boolean): void
	{
		if(this.enabled === false || this._disposed) return;

		this._actionQueueProcessedThisFrame = false;
		this._processActionQueue();

		if(!this._disposed)
		{
			this.artboard.advance(time);
		}

		for (let i = 0; i < this._animations.length; i++)
		{
			const animationMeta = this._animations[i];
			if(!animationMeta.isTimelineControlled)
			{
				if(animationMeta.autoPlay)
				{
					animationMeta.animation.advance(time);
					animationMeta.animation.apply(1);
				}
			}
			else
			{
				const timelineController = CanvasEngine.get().GetTimelineController(animationMeta);
				if(timelineController)
				{
					timelineController.Update(time, frameCount, onceSecond);
				}
			}
		}

		if(this._stateMachine)
		{
			this._stateMachine.advance(time);

			// Clear initial state for newly subscribed triggers (after advance, before checking)
			if(this._triggersNeedingInitialClear.size > 0)
			{
				this._triggersNeedingInitialClear.forEach(eventName =>
				{
					const cachedValue = this._triggerCache.get(eventName);
					if(Array.isArray(cachedValue))
					{
						// Wildcard case: clear all triggers in the array
						cachedValue.forEach(({trigger}) =>
						{
							if(trigger && 'hasChanged' in trigger && trigger.hasChanged)
							{
								trigger.clearChanges();
							}
						});
					}
					else if(cachedValue && 'hasChanged' in cachedValue && cachedValue.hasChanged)
					{
						// Single trigger case
						cachedValue.clearChanges();
					}
				});
				this._triggersNeedingInitialClear.clear();
			}

			//Check cached triggers for hasChanged and fire callbacks
			if(!this._disposed && this._triggerCache.size > 0)
			{
				this._triggerCache.forEach((cachedValue, eventName) =>
				{
					// Check if this is a wildcard pattern (array of triggers)
					if(Array.isArray(cachedValue))
					{
						// Wildcard case: iterate through all matched triggers
						cachedValue.forEach(({trigger, vmName, index}) =>
						{
							if(trigger && 'hasChanged' in trigger)
							{
								if(trigger.hasChanged)
								{
									trigger.clearChanges();
									const callbacks = this._triggerCallbacks.get(eventName);
									if(callbacks && callbacks.length > 0)
									{
										// Pass metadata object with trigger info to callback
										const metadata = {
											trigger,
											vmName,
											index,
											eventName
										};
										callbacks.forEach(callback => callback(metadata));
									}
								}
							}
						});
					}
					else
					{
						// Single trigger case
						const trigger = cachedValue;
						if(trigger && 'hasChanged' in trigger)
						{
							if(trigger.hasChanged)
							{
								trigger.clearChanges();
								const callbacks = this._triggerCallbacks.get(eventName);
								if(callbacks && callbacks.length > 0)
								{
									//console.log(`%c  [Update] Trigger "${eventName}" hasChanged - firing ${callbacks.length} callback(s)`, 'color: #00ff00;');
									callbacks.forEach(callback => callback(trigger));
								}
							}
						}
					}
				});
			}

			// DEPRECATED Check for events and do callbacks
			//const eventCount = this._stateMachine.reportedEventCount();
			//if(!this._disposed && eventCount > 0)
			//{
			//	for(let i = 0; i < eventCount; i++)
			//	{
			//		const event = this._stateMachine.reportedEventAt(i);
			//		if (event != undefined)
			//		{
			//			// Trigger any subscribed callbacks for this event
			//			const callbacks = this._eventCallbacks.get(event.name);
			//			if(callbacks && callbacks.length > 0)
			//			{
			//				callbacks.forEach(callback => callback(event));
			//			}
			//		}
			//	}
			//}

// Debug: Log state changes
			//if(!this._disposed && this._stateMachine)
			//{
			//	const stateChangeCount = this._stateMachine.stateChangedCount();
			//	if(stateChangeCount > 0)
			//	{
			//		for(let x = 0; x < stateChangeCount; x++)
			//		{
			//			const stateChange = this._stateMachine.stateChangedNameByIndex(x);
			//			if (stateChange != undefined)
			//			{
			//				console.log(this.id+'> RIVE STATE CHANGE<'+x+'>: ', stateChange);
			//			}
			//		}
			//	}
			//}

			if(!this._disposed && this.defObj.riveInteractive)
			{
				this.updateEntityObj();

				const artboardMoveSpace = RiveController.get().WindowToArtboard(this._entityObj!);
				const mouseDown = RiveController.get().MouseDown;

				// Cache comparison values
				const mousePosChanged = ( this._lastMousePos.x !== artboardMoveSpace.x || this._lastMousePos.y !== artboardMoveSpace.y);
				const mouseDownChanged = ( this._lastMouseDown !== mouseDown );

				if (mouseDownChanged)
				{
					const artBoardInteractionSpace = RiveController.get().CanvasToArtboard(this._entityObj!,true);
					if(mouseDown)
					{
						//console.log('CanvasRiveObj<'+this._label+'>: '+this._stateMachine?.name+' -- mouseDown @ ');
						//console.log('CanvasRiveObj<'+this._label+'>: DOWN ', artboardMoveSpace.x, artboardMoveSpace.y, ' -- interaction space: ', artBoardInteractionSpace.x, artBoardInteractionSpace.y);
						//this._stateMachine.pointerDown(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
						this._stateMachine.pointerDown(artboardMoveSpace.x, artboardMoveSpace.y, 1);
					}
					else
					{
						//this._stateMachine.pointerUp(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
						this._stateMachine.pointerUp(artboardMoveSpace.x, artboardMoveSpace.y, 1);
					}
				}

				if (mousePosChanged)
				{
					//console.log("Rive Interaction<"+this._label+">: MOVE ", artboardMoveSpace.x, artboardMoveSpace.y);
					this._stateMachine.pointerMove(artboardMoveSpace.x, artboardMoveSpace.y, 1);
				}

				this._lastMousePos.x = artboardMoveSpace.x;
				this._lastMousePos.y = artboardMoveSpace.y;
				this._lastMouseDown = mouseDown;
			}
		}

		// Render the artboard (only if visible)
		if(!this._disposed && this.visible)
		{
			const scaledWidth = this.artboard.width * this.xScale;
			const scaledHeight = this.artboard.height * this.yScale;

			// Get DPR to account for high-res backing store
			const dpr = Math.max(1, window.devicePixelRatio || 1);

			if(this._resolutionScale !== -1)
			{
				// Bounds for Rive renderer need to be in canvas pixels (with DPR)
				this._objBoundsReuse.minX = Math.round(this._transformedX * dpr);
				this._objBoundsReuse.minY = Math.round(this._transformedY * dpr);
				this._objBoundsReuse.maxX = Math.round((this._transformedX + (scaledWidth * this._resolutionScale)) * dpr);
				this._objBoundsReuse.maxY = Math.round((this._transformedY + (scaledHeight * this._resolutionScale)) * dpr);
			}
			else
			{
				this._objBoundsReuse.minX = Math.round(this.x * dpr);
				this._objBoundsReuse.minY = Math.round(this.y * dpr);
				this._objBoundsReuse.maxX = Math.round((this.x + scaledWidth) * dpr);
				this._objBoundsReuse.maxY = Math.round((this.y + scaledHeight) * dpr);
			}

			this.Renderer.save();
			this.Renderer.align(
				this.Rive.Fit.contain,
				this.Rive.Alignment.topLeft,
				this._objBoundsReuse,
				this.artboard.bounds
			);

			if(this._interactiveGraphics)
			{
				// Pixi uses CSS pixels, but _objBoundsReuse is in canvas pixels (with DPR)
				// So divide by DPR to convert back to CSS coordinates for Pixi
				const dpr = Math.max(1, window.devicePixelRatio || 1);

				this._interactiveGraphics.x = this._objBoundsReuse.minX / dpr;
				this._interactiveGraphics.y = this._objBoundsReuse.minY / dpr;

				this._interactiveGraphics.width = (this._objBoundsReuse.maxX - this._objBoundsReuse.minX) / dpr;
				this._interactiveGraphics.height = (this._objBoundsReuse.maxY - this._objBoundsReuse.minY) / dpr;
			}

			if(this._textLabel)
			{
				// Cache resolution scale check
				const resScale = this._resolutionScale !== -1 ? this._resolutionScale : 1;
				const combinedScaleX = resScale * this.xScale;
				const combinedScaleY = resScale * this.yScale;

				this._textLabel.x = this._objBoundsReuse.minX;
				this._textLabel.y = this._objBoundsReuse.maxY - (this._textLabel.height * combinedScaleY) - 5;

				// Only update scale if it changed
				if(this._textLabel.scale.x !== combinedScaleX || this._textLabel.scale.y !== combinedScaleY)
				{
					this._textLabel.scale.set(combinedScaleX, combinedScaleY);
				}
			}

			this.artboard.draw(this.Renderer);
			this.Renderer.restore();
		}
	}

	public SetText(text: string): void
	{
		this.defObj.text = text;
		this.drawTextLabel();
	}

	private _textLabel: PIXI.Text | null = null;
	private drawTextLabel()
	{
		if(this._textLabel)
		{
			this._textLabel.destroy();
			this._textLabel = null;
		}

		if(this.defObj.text && this.defObj.text.length > 0)
		{
			const style = new PIXI.TextStyle({
				fontFamily: "Verdana",
				fontSize: 32,
				fill: "#ffcc00",
				stroke: "#000000",
				dropShadow: true,
				align: "center",
				fontWeight: "bold",
			});
			this._textLabel = new PIXI.Text({text:this.defObj.text, style:style});
			this._textLabel.interactive = false;
			this._textLabel.eventMode = 'none';

			const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
			const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;

			this._textLabel.scale.set(combinedScaleX, combinedScaleY);
			this._textLabel.x = this._objBoundsReuse.minX;
			this._textLabel.y = this._objBoundsReuse.maxY - (this._textLabel.height * combinedScaleY) - 5;

			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._textLabel);
		}
	}

	private _interactiveGraphics: PIXI.Graphics | null = null;
	private initInteractive()
	{
		//console.log("   INIT INTERACTIVE RIVE OBJECT -- "+this._label);
		this._interactiveGraphics = new PIXI.Graphics();
		PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._interactiveGraphics);

		this._interactiveGraphics.rect(0, 0, this.width, this.height);
		this._interactiveGraphics.fill({color:0x650a5a, alpha:0});
		this._interactiveGraphics.stroke({ width: 1, color: 0xfeeb77, alpha: 0 });

		this._interactiveGraphics.x = this.x;
		this._interactiveGraphics.y = this.y;

		this._interactiveGraphics.eventMode = "static";
		this.CurrentCursor = RIVE_CURSOR_TYPES.POINTER;

		this._interactiveGraphics.on("pointerdown", this.onClick, this);
		this._interactiveGraphics.on("pointerover", this.onHover, this);
		this._interactiveGraphics.on("pointerout", this.onHoverOut, this);
	}

	private _currentRiveCursor:RIVE_CURSOR_TYPES = RIVE_CURSOR_TYPES.DEFAULT;
	public get CurrentCursor():RIVE_CURSOR_TYPES
	{
		return this._currentRiveCursor;
	}

	public set CurrentCursor(cursor: RIVE_CURSOR_TYPES)
	{
		if(this._interactiveGraphics)
		{
			if(this._currentRiveCursor === cursor) return;
			this._currentRiveCursor = cursor;

			this._interactiveGraphics.cursor = cursor.toString();
		}
	}

	protected _onClickCallback?:(event: MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj:CanvasRiveObj) => void;
	protected _onHoverCallback?:(sourceObj:CanvasRiveObj) => void;
	protected _onHoverOutCallback?:(sourceObj:CanvasRiveObj) => void;

	public SetEventHandlers({
		onClick,
		onHover,
		onHoverOut,
	}: {
		onClick?:(e:MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj:CanvasRiveObj) => void;
		onHover?:(sourceObj:CanvasRiveObj) => void;
		onHoverOut?:(sourceObj:CanvasRiveObj) => void;
	}) {
		this._onClickCallback = onClick;
		this._onHoverCallback = onHover;
		this._onHoverOutCallback = onHoverOut;
	}

	protected onClick(event:MouseEvent | PointerEvent | PIXI.PixiTouch)
	{
		if(this._onClickCallback)
		{
			this._onClickCallback?.(event,this);
		}

		if(this._defObj!.clickFunction)
		{
			this._defObj!.clickFunction(this);
		}
	}

	protected onHover()
	{
		if (this._interactiveGraphics)
		{
			this._interactiveGraphics.tint = 0x00ff00;
		}
		if(this._onHoverCallback) this._onHoverCallback?.(this);
	}

	protected onHoverOut()
	{
		if (this._interactiveGraphics)
		{
			this._interactiveGraphics.tint = 0xffffff;
		}
		if(this._onHoverOutCallback) this._onHoverOutCallback?.(this);
	}

	public Dispose(): void
	{
		this._disposed = true;

		const debug = false;
		if(debug)
		{
			console.log('');
			console.log((new Error('stack')).stack);
			console.log('Canvas rive obj dispose');
		}
		// Clean up Rive resources properly
		if(this._animations)
		{
			if(debug) console.log('dispose animations : '+this._animations.length);
			this._animations.forEach((animationMeta) => {
				try
				{
					if(debug) console.log('dispose animation : '+animationMeta.name+',  isTimelineControlled:'+animationMeta.isTimelineControlled);
					if(animationMeta.isTimelineControlled)
					{
						if(debug) console.log('OMG timeline controlled meta shit... lets destroy it');
						CanvasEngine.get().DestroyTimelineController(animationMeta);
					}

					animationMeta.animation.delete();
				}
				catch(e)
				{
					console.warn("Failed to delete animation:", e);
				}
			});
			this._animations = [];
		}
		else
		{
			if(debug) console.log('dispose NO animation... THERE IS NO ANIMATION ');
		}

		if(this._actionQueue)
		{
			this._actionQueue = [];
		}

		if(this._stateMachine)
		{
			try
			{
				this._stateMachine.delete();
			}
			catch(e)
			{
				console.warn("Failed to delete state machine:", e);
			}
			this._stateMachine = null;
		}

		// Properly null out references instead of forcing undefined
		this._renderer = null as any;
		this._artboard = null as any;
		this._riveInstance = null as any;

		// Clean up interactive graphics with proper event removal
		if(this._interactiveGraphics)
		{
			// Remove specific event listeners
			this._interactiveGraphics.off("pointerdown", this.onClick, this);
			this._interactiveGraphics.off("pointerover", this.onHover, this);
			this._interactiveGraphics.off("pointerout", this.onHoverOut, this);

			// Remove all listeners just in case
			this._interactiveGraphics.removeAllListeners();

			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._interactiveGraphics);
			this._interactiveGraphics.destroy();
			this._interactiveGraphics = null;
		}

		// Clean up text label
		if(this._textLabel)
		{
			this._textLabel.removeAllListeners();
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textLabel);
			this._textLabel.destroy();
			this._textLabel = null;
		}

		// Clear callback references to prevent circular references
		this._onClickCallback = undefined;
		this._onHoverCallback = undefined;
		this._onHoverOutCallback = undefined;

		// Clear event callbacks
		this._eventCallbacks.clear();

		// Automatically unsubscribe all trigger listeners
		this._triggerUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
		this._triggerUnsubscribeFunctions = [];

		// Clear trigger callbacks and cache
		this._triggerCallbacks.clear();
		this._triggerCache.clear();
		this._triggersNeedingInitialClear.clear();

		// Clear ViewModels
		this._viewModels.clear();
		this._viewModelInstance = null;

		if(debug) console.log('canvasriveobj dispose complete call super.......... ');
		super.Dispose();
	}

	protected get Rive(): Awaited<ReturnType<typeof RiveCanvas>>
	{
		return this._riveInstance!;
	}

	protected get Renderer(): Renderer
	{
		return this._renderer;
	}

	public get artboard(): Artboard
	{
		return this._artboard;
	}
}
