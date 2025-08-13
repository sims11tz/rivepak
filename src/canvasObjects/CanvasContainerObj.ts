import { CanvasObj, CanvasObjectDef } from "./CanvasObj";

export class CanvasContainerObj extends CanvasObj
{
	public children: CanvasObj[] = [];

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);
		this.InitContainer();
	}

	protected InitContainer(): void
	{

	}

	public AddChild(child: CanvasObj): void
	{
		child.SetParent(this);
		this.children.push(child);
	}

	public RemoveChild(child: CanvasObj): void
	{
		child.SetParent(null);
		this.children = this.children.filter(c => c !== child);
	}

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;

		//Update the x and y of children to be relative to my x and y... and scale and width and all that shit.. or i guess x and y and scale.
	}

	public Dispose(): void
	{
		super.Dispose();
	}
}
