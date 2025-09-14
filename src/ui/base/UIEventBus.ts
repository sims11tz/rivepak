/**
 * UI Event Bus - Integrates with RivePak's existing PubSub system
 */

import { CanvasEngineEventBus } from "../../CanvasEngineEventBus";
import { UIEvent, UIEventHandler, UIEventType } from "./UIEventTypes";

export class UIEventBus
{
	private static listeners:Map<string, Set<UIEventHandler>> = new Map();
	
	/**
	 * Subscribe to a UI event
	 */
	public static on(eventType:UIEventType | string, handler:UIEventHandler, component?:any):void
	{
		const key = component ? `${eventType}:${component.uuid}` : eventType;
		
		if(!this.listeners.has(key))
		{
			this.listeners.set(key, new Set());
		}
		
		this.listeners.get(key)!.add(handler);
		
		// Also register with main CanvasEngine event bus for global events
		if(!component)
		{
			CanvasEngineEventBus.on(eventType, handler);
		}
	}
	
	/**
	 * Unsubscribe from a UI event
	 */
	public static off(eventType:UIEventType | string, handler:UIEventHandler, component?:any):void
	{
		const key = component ? `${eventType}:${component.uuid}` : eventType;
		
		if(this.listeners.has(key))
		{
			this.listeners.get(key)!.delete(handler);
			
			if(this.listeners.get(key)!.size === 0)
			{
				this.listeners.delete(key);
			}
		}
		
		// Also unregister from main event bus
		if(!component)
		{
			CanvasEngineEventBus.off(eventType, handler);
		}
	}
	
	/**
	 * Emit a UI event
	 */
	public static emit(event:UIEvent):void
	{
		// Emit to component-specific listeners
		if(event.target)
		{
			const componentKey = `${event.type}:${event.target.uuid}`;
			if(this.listeners.has(componentKey))
			{
				this.listeners.get(componentKey)!.forEach(handler => handler(event));
			}
		}
		
		// Emit to global listeners
		if(this.listeners.has(event.type))
		{
			this.listeners.get(event.type)!.forEach(handler => handler(event));
		}
		
		// Also emit to main CanvasEngine event bus for global integration
		CanvasEngineEventBus.emit(event.type, event);
	}
	
	/**
	 * Subscribe once to an event
	 */
	public static once(eventType:UIEventType | string, handler:UIEventHandler, component?:any):void
	{
		const wrappedHandler:UIEventHandler = (event) =>
		{
			handler(event);
			this.off(eventType, wrappedHandler, component);
		};
		
		this.on(eventType, wrappedHandler, component);
	}
	
	/**
	 * Clear all listeners for a component
	 */
	public static clearComponentListeners(component:any):void
	{
		const keysToDelete:string[] = [];
		
		this.listeners.forEach((_, key) =>
		{
			if(key.includes(`:${component.uuid}`))
			{
				keysToDelete.push(key);
			}
		});
		
		keysToDelete.forEach(key => this.listeners.delete(key));
	}
	
	/**
	 * Create a UI event
	 */
	public static createEvent<T = any>(
		type:UIEventType,
		target:any,
		value?:T,
		previousValue?:T,
		data?:any
	):UIEvent<T>
	{
		return {
			type,
			target,
			value,
			previousValue,
			data,
			timestamp: Date.now()
		};
	}
}