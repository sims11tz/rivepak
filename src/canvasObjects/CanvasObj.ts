import Matter from "matter-js";
import { CanvasEngine } from "../useCanvasEngine";

export class GlobalUIDGenerator
{
	private static currentId = 0;
	public static generateUID():string { return `obj_${++this.currentId}`; }
	private static uniqueIds: Record<string, number> = {};
	public static generateUniqueString(baseString: string): string
	{
		if (!this.uniqueIds[baseString]) { this.uniqueIds[baseString] = 1; } else { this.uniqueIds[baseString]++; }
		return `${baseString}_${this.uniqueIds[baseString]}`;
	}

	public static clear(): void
	{
		this.currentId = 0;
		this.uniqueIds = {};
	}
}

export interface CanvasObjectEntity
{
	width?: number;
	height?: number;

	xScale?: number;
	yScale?: number;

	xSpeed?: number;

	x?: number;
	y?: number;
	z?: number;

	resolutionScale?: number;

	riveInteractiveLocalOnly?: boolean;
}

export interface CanvasObjectDef
{
	uuid?: string;
	label?: string;

	count?: number;
	width?: number;
	height?: number;

	xScale?: number;
	yScale?: number;

	x?: number;
	y?: number;
	z?: number;

	centerLocally?:boolean;
	centerGlobally?:boolean;

	baseX?: number;
	baseY?: number;
	baseXScale?: number;
	baseYScale?: number;

	group?:string;

	randomSpeed?: boolean;
	xSpeed?: number;
	ySpeed?: number;

	interactive?: boolean;
	riveInteractive?: boolean;
	riveInteractiveLocalOnly?: boolean;
}

export abstract class CanvasObj
{
	public _uuid: string = "";
	public get uuid(): string { return this._uuid; }

	public _label: string = "";
	public get label(): string { return this._label; }

	public _defObj: CanvasObjectDef | null = null;
	public get defObj(): CanvasObjectDef { return this._defObj!; }

	public enabled: boolean = true;
	public _state: { x: number; y: number; z: number };

	public centerLocally: boolean=false;
	public centerGlobally: boolean=false;

	public group: string = "main";
	public width: number = 0;
	public height: number = 0;
	public xScale: number = 0;
	public yScale: number = 0;

	public baseX: number;
	public baseY: number;
	public baseWidth: number;
	public baseHeight: number;
	public baseXScale: number;
	public baseYScale: number;

	public get resolutionScale(): number { return this._resolutionScale; }
	public _resolutionScale: number = -1;
	public get transformedWidth(): number { return this._transformedWidth; }
	public _transformedWidth: number = -1;
	public _transformedWidthlast: number = -1;
	public get transformedHeight(): number { return this._transformedHeight; }
	public _transformedHeight: number = -1;
	public _transformedHeightlast: number = -1;
	public get transformedX(): number { return this._transformedX; }
	public _transformedX: number = -1;
	public _transformedXlast: number = -1;
	public get transformedY(): number { return this._transformedY; }
	public _transformedY: number = -1;
	public _transformedYlast: number = -1;

	public _body: Matter.Body | null = null;

	public _propertyChangeListeners: Map<"x" | "y" | "z", (oldValue: number, newValue: number) => void> = new Map();
	constructor(defObj: CanvasObjectDef)
	{
		this._defObj = defObj;

		this._uuid = GlobalUIDGenerator.generateUID();
		this._label = this.defObj.label ?? GlobalUIDGenerator.generateUniqueString(this.constructor.name);

		this._state = { x: defObj.x ?? 0, y: defObj.y ?? 0, z: defObj.z ?? 0 };

		this.centerLocally = defObj.centerLocally ?? false;
		this.centerGlobally = defObj.centerGlobally ?? false;

		this.group = this.defObj.group ?? "main";
		this.width = this.defObj.width ?? 0;
		this.height = this.defObj.height ?? 0;

		this.xScale = this.defObj.xScale ?? 0;
		this.yScale = this.defObj.yScale ?? 0;

		this.baseX = defObj.x ?? 0;
		this.baseY = defObj.y ?? 0;
		this.baseWidth = defObj.width ?? 1;
		this.baseHeight = defObj.height ?? 1;
		this.baseXScale = defObj.xScale ?? 1;
		this.baseYScale = defObj.yScale ?? 1;
		//console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");

		this._state = new Proxy(this._state,
		{
			set: (target, key, value) =>
			{
				const oldValue = target[key as keyof typeof target];
				if (oldValue !== value)
				{
					target[key as keyof typeof target] = value;
					this._propertyChangeListeners.get(key as "x" | "y" | "z")?.(oldValue, value);
				}
				return true;
			},
		});
	}

	public checkBody()
	{
		console.log('base check body....');
	}

	public UpdateBaseProps()
	{
		this.baseX = this._state.x;
		this.baseY = this._state.y;
		this.baseWidth = this.width;
		this.baseHeight = this.height;
		this.baseXScale = this.xScale;
		this.baseYScale = this.yScale;
		//console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");
	}

	public get x(): number { return this._state.x; }
	public set x(value: number)
	{
		this._state.x = value;
		if(this._resolutionScale !== -1) this.ApplyResolutionScale(this._resolutionScale,"x");
	}

	public get y(): number {  return this._state.y; }
	public set y(value: number)
	{
		this._state.y = value;
		if(this._resolutionScale !== -1) this.ApplyResolutionScale(this._resolutionScale,"y");
	}

	public get z(): number { return this._state.z; }
	public set z(value: number)
	{
		if (this._state.z !== value)
		{
			const oldZ = this._state.z;
			this._state.z = value;
			this._OnZIndexChanged?.(this, oldZ, this._state.z);
		}
	}

	public ApplyResolutionScale(scale:number, property:string="")
	{
		if(scale !== this._resolutionScale)
		{
			//console.log(""+this.label+"  1 * "+scale+" ");
			property = "*";
			this._resolutionScale = scale;
		}
		else
		{
			//console.log(""+this.label+"  2 ! "+scale+" ");
		}

		//console.log(""+this.label+"  3 prop="+property+" ");
		if((property == "*") || (property == "x" && this._transformedXlast != this.x))
		{
			this._transformedX = this.x * scale;
			this._transformedXlast = this.x;
			//console.log(""+this.label+"APRS  4 x "+this.x+"--"+this._transformedX);
		}

		if((property == "*") || (property == "y" && this._transformedYlast != this.y))
		{
			this._transformedY = this.y * scale;
			this._transformedYlast = this.y;
			//console.log(""+this.label+"APRS  5 y "+this.y+"--"+this._transformedY);
		}

		if((property == "*") || (property == "width" && this._transformedWidthlast != this.width))
		{
			this._transformedWidth = this.width * scale;
			this._transformedWidthlast = this.width;
			//console.log(""+this.label+"APRS  6 width "+this.width+"--TransW:"+this._transformedWidth);
		}

		if((property == "*") || (property == "height" && this._transformedHeightlast != this.height))
		{
			this._transformedHeight = this.height * scale;
			this._transformedHeightlast = this.height;
			//console.log(""+this.label+"APRS  7 height "+this.height+"--TransH:"+this._transformedHeight);
		}
	}

	public abstract Update(time: number, frameCount: number, onceSecond: boolean): void;

	public SwapDepths(other: CanvasObj)
	{
		const temp = this.z;
		this.z = other.z;
		other.z = temp;
	}

	// ✅ Function to selectively bind to x, y, or z changes
	public BindPropertyChange(property: "x" | "y" | "z", callback: (oldValue: number, newValue: number) => void)
	{
		this._propertyChangeListeners.set(property, callback);
	}

	// ✅ Function to unbind property change listener
	public UnbindPropertyChange(property: "x" | "y" | "z")
	{
		this._propertyChangeListeners.delete(property);
	}

	public set OnZIndexChanged(func: ((canvasObj: CanvasObj, oldZIndex: number, newZIndex: number) => void) | null)
	{
		this._OnZIndexChanged = func;
	}
	public _OnZIndexChanged: ((canvasObj: CanvasObj, oldZIndex: number, newZIndex: number) => void) | null = null;

	public Dispose():void
	{
		this._propertyChangeListeners.clear();
		this._defObj = null;
		this._OnZIndexChanged = null;
	}
}
