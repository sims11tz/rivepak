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
