import { PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { CanvasObj, CanvasObjectDef } from "./CanvasObj";
import * as PIXI from "pixi.js";

export class CanvasContainerObj extends CanvasObj
{
	public children: CanvasObj[] = [];

	// Store original child transforms for relative positioning
	private _childOriginalTransforms: Map<string, {
		x: number;
		y: number;
		xScale: number;
		yScale: number;
	}> = new Map();

	// Container visibility affects children
	private _visible: boolean = true;
	public get visible(): boolean { return this._visible; }
	public set visible(value: boolean)
	{
		this._visible = value;
		// Could propagate to children if needed
	}

	constructor(canvasDef: CanvasObjectDef)
	{
		super(canvasDef);
		this.InitContainer();
	}

	protected _debugGraphics: PIXI.Graphics | null = null;
	protected InitContainer(): void
	{
		this.width = this.defObj.width ?? 100;
		this.height = this.defObj.height ?? 100;
		this.xScale = this.defObj.xScale ?? 1;
		this.yScale = this.defObj.yScale ?? 1;

		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

		if(this.centerGlobally)
		{
			//console.log(`CANVAS CONTAINER... center globally`);
			this.x = CanvasEngine.get().width / 2;
			this.y = CanvasEngine.get().height / 2;
		}

		if(this.centerGlobally || this.centerLocally)
		{
			//console.log(`CANVAS CONTAINER... center locally`);
			this.x -= (this.width / 2);
			this.y -= (this.height / 2);
		}

		if (this._debug)
		{
			//console.log(`CANVAS CONTAINER... DEBUG MODE!!!!! `);
			this._debugGraphics = new PIXI.Graphics();
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._debugGraphics);

			this._debugGraphics.x = this.x;
			this._debugGraphics.y = this.y;
			this._debugGraphics.scale.set(this.xScale, this.yScale);
			this._debugGraphics.eventMode = "static";

			console.log('CANVAS CONTAINER... '+this._debugGraphics.x+','+this._debugGraphics.y+','+this._debugGraphics.scale.x+','+this._debugGraphics.scale.y);

		}

		this.UpdateBaseProps();

		if(this._debug) this.DrawDebug();
	}

	protected DrawDebug()
	{
		if(this._debug && this._debugGraphics)
		{
			console.log('CANVAS CONTAINER --- DrawDebug');
			this._debugGraphics.clear();
			this._debugGraphics.rect(0, 0, this.width, this.height);
			this._debugGraphics.fill({color: 0x66CCFF, alpha: 0.45});
			this._debugGraphics.stroke({ width: 2, color: 0xfeeb77, alpha: 0.35 });
		}
	}

	/**
	 * Adds a child object to this container
	 */
	public AddChild(child: CanvasObj): void
	{
		if (this.children.includes(child))
		{
			console.warn(`Child ${child.label} already exists in container ${this.label}`);
			return;
		}

		// Remove from previous parent if exists
		if (child.parent)
		{
			(child.parent as CanvasContainerObj).RemoveChild(child);
		}

		// Calculate relative position to container
		const relativeX = child.x - this.x;
		const relativeY = child.y - this.y;
		const relativeXScale = child.xScale / this.xScale;
		const relativeYScale = child.yScale / this.yScale;

		// Store original transform relative to container
		this._childOriginalTransforms.set(child.uuid, {
			x: relativeX,
			y: relativeY,
			xScale: relativeXScale,
			yScale: relativeYScale
		});

		// Set up property change listeners to track child movement
		child.BindPropertyChange('x', (oldValue, newValue) => {
			const original = this._childOriginalTransforms.get(child.uuid);
			if (original) {
				// Update relative position
				original.x = newValue - this.x;
			}
		});

		child.BindPropertyChange('y', (oldValue, newValue) => {
			const original = this._childOriginalTransforms.get(child.uuid);
			if (original) {
				// Update relative position
				original.y = newValue - this.y;
			}
		});

		child.BindPropertyChange('xScale', (oldValue, newValue) => {
			const original = this._childOriginalTransforms.get(child.uuid);
			if (original) {
				// Update relative scale
				original.xScale = newValue / this.xScale;
			}
		});

		child.BindPropertyChange('yScale', (oldValue, newValue) => {
			const original = this._childOriginalTransforms.get(child.uuid);
			if (original) {
				// Update relative scale
				original.yScale = newValue / this.yScale;
			}
		});

		child.SetParent(this);
		this.children.push(child);

		// Update child transform immediately
		this.updateChildTransform(child);
	}

	/**
	 * Removes a child object from this container
	 */
	public RemoveChild(child: CanvasObj): boolean
	{
		const index = this.children.indexOf(child);
		if (index === -1) return false;

		// Remove property change listeners
		child.UnbindPropertyChange('x');
		child.UnbindPropertyChange('y');
		child.UnbindPropertyChange('xScale');
		child.UnbindPropertyChange('yScale');

		child.SetParent(null);
		this.children.splice(index, 1);

		// Keep current world position (don't restore to original)
		// The child keeps its current position after being removed
		this._childOriginalTransforms.delete(child.uuid);

		return true;
	}

	/**
	 * Removes a child by its ID or label
	 */
	public RemoveChildById(id: string): boolean
	{
		const child = this.GetChildById(id);
		if (child)
		{
			return this.RemoveChild(child);
		}
		return false;
	}

	/**
	 * Gets a child by its ID or label
	 */
	public GetChildById(id: string): CanvasObj | null
	{
		return this.children.find(c => c.id === id || c.label === id) || null;
	}

	/**
	 * Gets all children of a specific type
	 */
	public GetChildrenByType<T extends CanvasObj>(type: new (...args: any[]) => T): T[]
	{
		return this.children.filter(c => c instanceof type) as T[];
	}

	/**
	 * Removes all children from this container
	 */
	public ClearChildren(): void
	{
		// Create a copy to avoid modification during iteration
		const childrenCopy = [...this.children];
		for (const child of childrenCopy)
		{
			this.RemoveChild(child);
		}
		this._childOriginalTransforms.clear();
	}

	/**
	 * Brings a child to the front (highest z-order)
	 */
	public BringChildToFront(child: CanvasObj): void
	{
		const index = this.children.indexOf(child);
		if (index > -1 && index < this.children.length - 1)
		{
			this.children.splice(index, 1);
			this.children.push(child);
			this.updateChildrenZOrder();
		}
	}

	/**
	 * Sends a child to the back (lowest z-order)
	 */
	public SendChildToBack(child: CanvasObj): void
	{
		const index = this.children.indexOf(child);
		if (index > 0)
		{
			this.children.splice(index, 1);
			this.children.unshift(child);
			this.updateChildrenZOrder();
		}
	}

	/**
	 * Updates z-order of all children based on their position in the array
	 */
	private updateChildrenZOrder(): void
	{
		const baseZ = this.z || 0;
		this.children.forEach((child, index) => {
			child.z = baseZ + index + 1;
		});
	}

	/**
	 * Updates a child's transform based on container's transform
	 */
	private updateChildTransform(child: CanvasObj): void
	{
		const original = this._childOriginalTransforms.get(child.uuid);
		if (!original) return;

		// Apply container transformations to child
		// Position is relative to container position
		child.x = this.x + (original.x * this.xScale);
		child.y = this.y + (original.y * this.yScale);

		// Scale is multiplicative
		child.xScale = original.xScale * this.xScale;
		child.yScale = original.yScale * this.yScale;

		// If container has resolution scale, propagate it
		if (this._resolutionScale !== -1)
		{
			child._resolutionScale = this._resolutionScale;
			child._transformedX = this._transformedX + (original.x * this.xScale * this._resolutionScale);
			child._transformedY = this._transformedY + (original.y * this.yScale * this._resolutionScale);
		}

		//console.log('%c      child.x='+child.x+',      child.y='+child.y,'color:#00FF88');
		//console.log('%c child.xScale='+child.xScale+', child.yScale='+child.yScale,'color:#00FF88');
	}

	/**
	 * Gets the world position of this container (accounting for nested containers)
	 */
	public GetWorldPosition(): { x: number, y: number }
	{
		let worldX = this.x;
		let worldY = this.y;
		let current = this.parent;

		while (current)
		{
			worldX += current.x;
			worldY += current.y;
			current = current.parent;
		}

		return { x: worldX, y: worldY };
	}

	/**
	 * Gets the world scale of this container (accounting for nested containers)
	 */
	public GetWorldScale(): { xScale: number, yScale: number }
	{
		let worldXScale = this.xScale;
		let worldYScale = this.yScale;
		let current = this.parent;

		while (current)
		{
			worldXScale *= current.xScale;
			worldYScale *= current.yScale;
			current = current.parent;
		}

		return { xScale: worldXScale, yScale: worldYScale };
	}

	/**
	 * Checks if a point is within this container's bounds
	 */
	public ContainsPoint(x: number, y: number): boolean
	{
		return x >= this.x &&
		       x <= this.x + (this.width * this.xScale) &&
		       y >= this.y &&
		       y <= this.y + (this.height * this.yScale);
	}

	/**
	 * Gets a child at a specific point (useful for hit testing)
	 */
	public GetChildAtPoint(x: number, y: number): CanvasObj | null
	{
		// Check children in reverse order (top to bottom)
		for (let i = this.children.length - 1; i >= 0; i--)
		{
			const child = this.children[i];
			if (!child.enabled) continue;

			// Check if point is within child bounds
			if (x >= child.x &&
			    x <= child.x + (child.width * child.xScale) &&
			    y >= child.y &&
			    y <= child.y + (child.height * child.yScale))
			{
				// If child is also a container, check its children
				if (child instanceof CanvasContainerObj)
				{
					const nestedChild = child.GetChildAtPoint(x, y);
					if (nestedChild) return nestedChild;
				}
				return child;
			}
		}
		return null;
	}

	/**
	 * Updates container and all its children
	 */
	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if (!this.enabled || !this._visible) return;

		// Update all child transforms relative to container
		for(const child of this.children)
		{
			this.updateChildTransform(child);

			// Update the child itself
			//if (child.enabled)
			//{
			//	child.Update(time, frameCount, onceSecond);
			//}
		}

		// Handle autoscale if needed
		//if (CanvasEngine.get().EngineSettings?.autoScale)
		//{
		//	const scale = CanvasEngine.get().CurrentCanvasScale;
		//	this._transformedX = this.x * scale;
		//	this._transformedY = this.y * scale;
		//	this._transformedWidth = this.width * this.xScale * scale;
		//	this._transformedHeight = this.height * this.yScale * scale;
		//	this._resolutionScale = scale;
		//}

		let transformedX = 0;
		let xScale = 0;
		let transformedY = 0;
		let yScale = 0;

		if(CanvasEngine.get().EngineSettings?.autoScale && (this._debug && this._debugGraphics))
		{
			transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
			transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
			xScale = CanvasEngine.get().CurrentCanvasScale * this.xScale;
			yScale = CanvasEngine.get().CurrentCanvasScale * this.yScale;
		}
		else
		{
			transformedX = this.x;
			transformedY = this.y;
			xScale = this.xScale;
			yScale = this.yScale;
		}

		//if(this._graphics)
		//{
		//	this._graphics.x = transformedX;
		//	this._graphics.y = transformedY;
		//	this._graphics.scale.set(xScale, yScale);
		//}

		if(this._debug && this._debugGraphics)
		{
			this._debugGraphics.x = transformedX;
			this._debugGraphics.y = transformedY;
			this._debugGraphics.scale.set(xScale, yScale);
		}
	}

	/**
	 * Sets the position of the container
	 */
	public SetPosition(x: number, y: number): void
	{
		this.x = x;
		this.y = y;
	}

	/**
	 * Sets the scale of the container
	 */
	public SetScale(xScale: number, yScale?: number): void
	{
		this.xScale = xScale;
		this.yScale = yScale ?? xScale;
	}

	/**
	 * Moves a child to a new relative position within the container
	 */
	public MoveChild(child: CanvasObj, x: number, y: number): void
	{
		// Set the child's position relative to the container
		child.x = this.x + x;
		child.y = this.y + y;
	}

	/**
	 * Scales a child relative to the container
	 */
	public ScaleChild(child: CanvasObj, xScale: number, yScale?: number): void
	{
		// Set the child's scale relative to the container
		child.xScale = this.xScale * xScale;
		child.yScale = this.yScale * (yScale ?? xScale);
	}

	/**
	 * Disposes of the container and all its children
	 */
	public Dispose(): void
	{
		// Dispose all children
		for (const child of this.children)
		{
			child.Dispose();
		}

		this.children = [];
		this._childOriginalTransforms.clear();

		super.Dispose();
	}

	/**
	 * Gets debug info about the container
	 */
	public GetDebugInfo(): string
	{
		return `Container: ${this.label}
Position: (${this.x}, ${this.y})
Scale: (${this.xScale}, ${this.yScale})
Children: ${this.children.length}
${this.children.map(c => `  - ${c.label} (${c.constructor.name})`).join('\n')}`;
	}
}
