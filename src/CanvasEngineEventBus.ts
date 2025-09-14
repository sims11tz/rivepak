import { ResizeCanvasObj } from "./useCanvasEngine";

type Listener<T> = (data: T) => void;

class PubSub<T>
{
	private listeners = new Set<Listener<T>>();

	public Subscribe(listener: Listener<T>)
	{
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	public Publish(data:T)
	{
		for (const listener of this.listeners)
		{
			listener(data);
		}
	}

	public Clear()
	{
		this.listeners.clear();
	}

	public UnsubscribeAll()
	{
		this.Clear();
	}
}

export const CanvasEngineResizePubSub = new PubSub<ResizeCanvasObj>();
export const CanvasEngineStartResizePubSub = new PubSub();

/**
 * Generic event bus for UI components
 */
export class CanvasEngineEventBus
{
	private static listeners:Map<string, Set<(data:any) => void>> = new Map();
	
	public static on(event:string, handler:(data:any) => void):void
	{
		if(!this.listeners.has(event))
		{
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(handler);
	}
	
	public static off(event:string, handler:(data:any) => void):void
	{
		if(this.listeners.has(event))
		{
			this.listeners.get(event)!.delete(handler);
		}
	}
	
	public static emit(event:string, data:any):void
	{
		if(this.listeners.has(event))
		{
			this.listeners.get(event)!.forEach(handler => handler(data));
		}
	}
	
	public static clear(event?:string):void
	{
		if(event)
		{
			this.listeners.delete(event);
		}
		else
		{
			this.listeners.clear();
		}
	}
}
