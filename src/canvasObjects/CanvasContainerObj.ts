import { CanvasObj, CanvasObjectDef } from "./CanvasObj";

export class CanvasContainerObj extends CanvasObj
{
	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
		this.InitContainer();
	}

	protected InitContainer(): void
	{

	}

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;
	}

	public Dispose(): void
	{
		super.Dispose();
	}
}
