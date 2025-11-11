import { PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { BaseCanvasObj, CanvasObjectDef } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";

export class CanvasContainerObj extends BaseCanvasObj
{
	public children: BaseCanvasObj[] = [];
	private _childOriginalTransforms: Map<string, { x: number; y: number; xScale: number; yScale: number; }> = new Map();

	public override get visible(): boolean
	{
		return super.visible;
	}
	public override set visible(value: boolean)
	{
		//console.log('%c <CanvasContainerObj> setting visible for '+this.label+' to '+value,'color:#FF8800; font-weight:bold;');
		super.visible = value;
		for(const child of this.children)
		{
			if(!child.independentVisibility)
			{
				//console.log('%c <CanvasContainerObj> setting visible for '+this.label+' to child: '+child.label+',  '+value,'color:#FF8800; font-weight:bold;');
				child.visible = value;
			}
			else
			{
				//console.log('%c <CanvasContainerObj> SKIPPING visible for '+this.label+' to child: '+child.label+' (independent visibility)','color:#FFA500; font-weight:bold;');
			}
		}
	}

	constructor(canvasDef:CanvasObjectDef)
	{
		super(canvasDef);

		this._debugRive = true;

		this.InitContainer();
	}

	protected _debugGraphics:PIXI.Graphics | null = null;
	private _needsDebugGraphics:boolean = false; // Flag to track if debug graphics should be created when parent is set

	protected InitContainer():void
	{
		console.log('%c <CanvasContainerObj> InitContainer for '+this.label,'color:#FF8800; font-weight:bold;');

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

		// Don't create debug graphics yet if we don't have a parent
		// Wait until OnParentAdded is called
		if(this._debugRive)
		{
			this.initDebugGraphics();
		}
	}

	private initDebugGraphics(forceCreate:boolean = false):void
	{
		console.log('%c <CanvasContainerObj> initDebugGraphics for '+this.label,'color:#FF8800; font-weight:bold;');
		console.log('%c <CanvasContainerObj> '+this.label+'.  parent=>','color:#FF8800; font-weight:bold;', this._parent);
		console.log('%c <CanvasContainerObj> '+this.label+'.  forceCreate=>','color:#FF8800; font-weight:bold;', forceCreate);

		// Only create debug graphics if we're being force-created (from OnParentAdded)
		// OR if we have a parent (are in a container)
		if(!forceCreate && this._parent === null)
		{
			console.log('%c <CanvasContainerObj> COCK BLOCK 1 '+this.label,'color:#FF8800; font-weight:bold;');
			this._needsDebugGraphics = true;
			return;
		}

		// Prevent double-initialization
		if(this._debugGraphics)
		{
			console.log('%c <CanvasContainerObj> COCK BLOCK 2 '+this.label,'color:#FF8800; font-weight:bold;');
			return;
		}

		console.log('%c <CanvasContainerObj> COCK BLOCK 3 create '+this.label,'color:#FF8800; font-weight:bold;');
		this._debugGraphics = new PIXI.Graphics();
		PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._debugGraphics);

		// Pixi uses logical pixels, but container coordinates might be in Rive's high-DPI space
		// Scale the debug graphics by devicePixelRatio to match Rive coordinates
		const dpr = window.devicePixelRatio || 1;
		this._debugGraphics.x = this.x / dpr;
		this._debugGraphics.y = this.y / dpr;
		this._debugGraphics.scale.set(this.xScale, this.yScale);
		this._debugGraphics.eventMode = "static";

		this.DrawDebug();
	}

	private destroyDebugGraphics():void
	{
		if(this._debugGraphics)
		{
			this._debugGraphics.removeAllListeners();
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._debugGraphics);
			this._debugGraphics.destroy();
			this._debugGraphics = null;
		}
	}

	public override OnParentAdded():void
	{
		console.warn('%c <CanvasContainerObj> OnParentAdded for '+this.label,'color:#FF8800; font-weight:bold;');
		// Handle debug graphics based on parent state
		if(this._needsDebugGraphics)
		{
			console.log('%c <CanvasContainerObj> call initDebug graphiocs '+this.label,'color:#FF8800; font-weight:bold;');
			this.initDebugGraphics(true); // forceCreate=true since we're being added to engine
			this._needsDebugGraphics = false;
		}
		else
		{
			console.log('%c <CanvasContainerObj> call NO .. ','color:#FF8800; font-weight:bold;');
		}
	}

	public override OnParentRemoved():void
	{
		console.warn('%c <CanvasContainerObj> OnParentRemoved for '+this.label,'color:#FF8800; font-weight:bold;');
		// Clean up debug graphics when removed from engine
		if(this._debugGraphics)
		{
			this.destroyDebugGraphics();
		}
	}

	protected DrawDebug()
	{
		if(this._debugRive && this._debugGraphics)
		{
			console.log('%c <CanvasContainerObj> DrawDEBUG YES'+this.label,'color:#FF8800; font-weight:bold;');
			// Draw in Rive coordinate space (high-DPI)
			const dpr = window.devicePixelRatio || 1;
			this._debugGraphics.clear();
			this._debugGraphics.rect(0, 0, this.width / dpr, this.height / dpr);
			this._debugGraphics.fill({color: 0x66CCFF, alpha: 0.15});
			this._debugGraphics.stroke({ width: 2 / dpr, color: 0xfeeb77, alpha: 0.5 });
		}
		else
		{
			console.log('%c <CanvasContainerObj> DrawDEBUG no'+this.label,'color:#FF8800; font-weight:bold;');
		}
	}

	/**
	 * Adds a child object to this container
	 */
	public AddChild(child:BaseCanvasObj):void
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

		// Store the child's coordinates as relative to the parent's coordinate space
		// If child is at (0,0), it means (0,0) relative to parent, not world space
		const relativeX = child.x;
		const relativeY = child.y;
		const relativeXScale = child.xScale;
		const relativeYScale = child.yScale;

		// Store original transform relative to container
		this._childOriginalTransforms.set(child.uuid, {
			x: relativeX,
			y: relativeY,
			xScale: relativeXScale,
			yScale: relativeYScale
		});

		// No property change listeners needed - child x,y are always parent-relative
		// The stored values in _childOriginalTransforms will be updated when child.x/y are set directly

		child.SetParent(this);
		this.children.push(child);

		// Update child transform immediately
		this.updateChildTransform(child,true);

		CanvasEngine.get().AddCanvasObjects(child);
	}

	/**
	 * Removes a child object from this container
	 */
	public RemoveChild(child:BaseCanvasObj):boolean
	{
		const index = this.children.indexOf(child);
		if (index === -1) return false;

		// Convert world position back to local before removing parent
		// So the object stays in the same visual position
		child.x = child._worldX;
		child.y = child._worldY;
		child.xScale = child._worldXScale;
		child.yScale = child._worldYScale;

		child.SetParent(null);
		this.children.splice(index, 1);

		// Clean up stored transform
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
	public GetChildById(id: string):BaseCanvasObj | null
	{
		return this.children.find(c => c.id === id || c.label === id) || null;
	}

	public GetChildrenByType<T extends BaseCanvasObj>(type: new (...args: any[]) => T): T[]
	{
		return this.children.filter(c => c instanceof type) as T[];
	}

	/**
	 * Removes all children from this container
	 */
	public ClearChildren():void
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
	public BringChildToFront(child:BaseCanvasObj):void
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
	public SendChildToBack(child:BaseCanvasObj):void
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
	 * Uses fractional offsets to avoid polluting the global z-index space
	 */
	private updateChildrenZOrder():void
	{
		const baseZ = this.z || 0;
		this.children.forEach((child, index) => {
			// Use fractional offsets (0.001 per child) to maintain order within container
			// This allows up to 999 children before hitting the next integer z-level
			child.z = baseZ + (index * 0.001);
		});
	}

	/**
	 * Updates a child's transform based on container's transform
	 */
	private updateChildTransform(child:BaseCanvasObj, oncePerSecond:boolean=false):void
	{
		// Update the stored relative position to match current child.x/y
		// Child x,y are always treated as parent-relative
		let original = this._childOriginalTransforms.get(child.uuid);
		if (!original) {
			// Create entry if it doesn't exist
			original = {
				x: child.x,
				y: child.y,
				xScale: child.xScale,
				yScale: child.yScale
			};
			this._childOriginalTransforms.set(child.uuid, original);
		} else {
			// Update stored relative values with current child values
			original.x = child.x;
			original.y = child.y;
			original.xScale = child.xScale;
			original.yScale = child.yScale;
		}

		// Calculate world coordinates for rendering
		// Use parent's render coordinates (which already account for nested parents)
		child._worldX = this.renderX + (child.x * this.renderXScale);
		child._worldY = this.renderY + (child.y * this.renderYScale);
		child._worldXScale = child.xScale * this.renderXScale;
		child._worldYScale = child.yScale * this.renderYScale;

		//if(oncePerSecond) {
		//	console.log('%c <updateChildTransform> for '+child.label,'color:#00FF88; font-weight:bold;');
		//	console.log('%c <updateChildTransform> CHILD LOCAL -- x:'+child.x+', y:'+child.y+', scaleX:'+child.xScale+', scaleY:'+child.yScale,'color:#00FF88; font-weight:bold;');
		//	console.log('%c <updateChildTransform> PARENT WORLD -- x:'+this.worldX+', y:'+this.worldY+', scaleX:'+this.worldXScale+', scaleY:'+this.worldYScale,'color:#00FF88; font-weight:bold;');
		//	console.log('%c <updateChildTransform> CHILD WORLD -- x:'+child._worldX+', y:'+child._worldY+', scaleX:'+child._worldXScale+', scaleY:'+child._worldYScale,'color:#00FF88; font-weight:bold;');
		//}

		// If container has resolution scale, propagate it
		if (this._resolutionScale !== -1)
		{
			child._resolutionScale = this._resolutionScale;
			child._transformedX = this._transformedX + (child.x * this.renderXScale * this._resolutionScale);
			child._transformedY = this._transformedY + (child.y * this.renderYScale * this._resolutionScale);
		}
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
	public GetChildAtPoint(x: number, y: number):BaseCanvasObj | null
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
	public Update(time: number, frameCount: number, onceSecond: boolean):void
	{
		if (!this.enabled || !this.visible) return;

		// Update all child transforms relative to container

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

		const dpr = window.devicePixelRatio || 1;

		if(CanvasEngine.get().EngineSettings?.autoScale && (this._debugRive && this._debugGraphics))
		{
			transformedX = (this.x * CanvasEngine.get().CurrentCanvasScale) / dpr;
			transformedY = (this.y * CanvasEngine.get().CurrentCanvasScale) / dpr;
			xScale = CanvasEngine.get().CurrentCanvasScale * this.xScale;
			yScale = CanvasEngine.get().CurrentCanvasScale * this.yScale;
		}
		else
		{
			transformedX = this.x / dpr;
			transformedY = this.y / dpr;
			xScale = this.xScale;
			yScale = this.yScale;
		}

		//if(CanvasEngine.get().EngineSettings?.autoScale && (this._debugRive && this._debugGraphics))
		//{
		//	transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
		//	transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
		//	xScale = CanvasEngine.get().CurrentCanvasScale * this.xScale;
		//	yScale = CanvasEngine.get().CurrentCanvasScale * this.yScale;
		//}
		//else
		//{
		//	transformedX = this.x;
		//	transformedY = this.y;
		//	xScale = this.xScale;
		//	yScale = this.yScale;
		//}

		//if(this._graphics)
		//{
		//	this._graphics.x = transformedX;
		//	this._graphics.y = transformedY;
		//	this._graphics.scale.set(xScale, yScale);
		//}

		if(this._debugGraphics)
		{
			if(onceSecond) console.log('%c <'+frameCount+'>  updating debug graphics for container '+this.label,'color:#00FF88; font-weight:bold;');
			this._debugGraphics.x = transformedX;
			this._debugGraphics.y = transformedY;
			this._debugGraphics.scale.set(xScale, yScale);
		}

		//if(onceSecond) console.log('%c <'+frameCount+'>  TEST '+this.label,'color:#00FF88; font-weight:bold;');

		for(const child of this.children)
		{
			//if(onceSecond) console.log('%c <'+frameCount+'>  updating child transform for '+child.label,'color:#00FF88; font-weight:bold;');
			this.updateChildTransform(child,onceSecond);

			// Update the child itself
			//if (child.enabled)
			//{
			//	child.Update(time, frameCount, onceSecond);
			//}
		}
	}

	/**
	 * Sets the position of the container

	public SetPosition(x: number, y: number): void
	{
		this.x = x;
		this.y = y;
	}

	/**
	 * Sets the scale of the container

	public SetScale(xScale: number, yScale?: number): void
	{
		this.xScale = xScale;
		this.yScale = yScale ?? xScale;
	}

	/**
	 * Moves a child to a new relative position within the container

	public MoveChild(child: CanvasObj, x: number, y: number): void
	{
		// Set the child's position relative to the container
		child.x = this.x + x;
		child.y = this.y + y;
	}

	public ScaleChild(child: CanvasObj, xScale: number, yScale?: number): void
	{
		// Set the child's scale relative to the container
		child.xScale = this.xScale * xScale;
		child.yScale = this.yScale * (yScale ?? xScale);
	}
	*/

	public override Dispose():void
	{
		// Clear parent references for all children
		for (const child of this.children)
		{
			// Clear parent reference
			child.SetParent(null);

			// Dispose the child---- the Controller they are attached to should dispose of them.... we hope?
			//child.Dispose();
		}

		// Clean up debug graphics using the helper method
		this.destroyDebugGraphics();

		// Clear collections
		this.children = [];
		this._childOriginalTransforms.clear();

		super.Dispose();
	}

	/**
	 * Gets debug info about the container
	 */
	public GetDebugInfo():string
	{
		return `Container: ${this.label}
Position: (${this.x}, ${this.y})
Scale: (${this.xScale}, ${this.yScale})
Children: ${this.children.length}
${this.children.map(c => `  - ${c.label} (${c.constructor.name})`).join('\n')}`;
	}
}
