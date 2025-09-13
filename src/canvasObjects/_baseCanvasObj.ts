import Matter from "matter-js";

import { PIXI_LAYER } from "../controllers/PixiController";
import type { TextStyleOptions } from "pixi.js";

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
	width?:number;
	height?:number;

	xScale?:number;
	yScale?:number;

	xSpeed?:number;

	x?:number;
	y?:number;
	z?:number;

	resolutionScale?: number;
	riveInteractiveLocalOnly?: boolean;
}

export interface CanvasObjectDef
{
	uuid?:string;
	label?:string;

	text?:string;

/*TEXT Start*/
	// Text styling options
	textStyle?: Partial<TextStyleOptions>;
	textAlign?: 'left' | 'center' | 'right' | 'justify';
	verticalAlign?: 'top' | 'middle' | 'bottom';

	debugMode?:boolean;
	debugLogs?:boolean;

	drawFunction?:(pixiGraphics:any, defObj:CanvasObjectDef) => void;

	bgColor?:string | number;
	bgAlpha?:number;
	borderColor?:string | number;
	borderWidth?:number;
	borderAlpha?:number;
	borderRadius?:number;

	diameter?:number;
	radius?:number;

	// Text bounds and wrapping
	wordWrap?:boolean;
	wordWrapWidth?:number;
	breakWords?:boolean;
	maxWidth?:number;
	maxHeight?:number;

	// Text effects
	textShadow?:boolean;
	textShadowColor?:string | number;
	textShadowBlur?:number;
	textShadowAngle?:number;
	textShadowDistance?:number;
	textShadowAlpha?:number;

	// Text animations
	typewriterEffect?:boolean;
	typewriterSpeed?:number;
	fadeInDuration?:number;
	pulseText?:boolean;
	pulseSpeed?:number;

	// Advanced text options
	letterSpacing?:number;
	lineHeight?:number;
	padding?:number;
	trimText?:boolean;
	resolution?:number;
/*TEXT END*/

	count?:number;
	width?:number;
	height?:number;

	constrainProportions?:boolean;

	xScale?:number;
	yScale?:number;

	x?:number;
	y?:number;
	z?:number;

	centerLocally?:boolean;
	centerGlobally?:boolean;

	baseX?:number;
	baseY?:number;
	baseXScale?:number;
	baseYScale?:number;

	group?:string;

	randomSpeed?:boolean;
	xSpeed?:number;
	ySpeed?:number;

	pixiLayer?:PIXI_LAYER;

	interactive?:boolean;
	riveInteractive?:boolean;
	riveInteractiveLocalOnly?:boolean;
}

export abstract class BaseCanvasObj
{
	public _uuid:string = "";
	public get uuid():string { return this._uuid; }

	public _id:string = "";
	public get id():string { return (this._id != '') ? this._id : this._uuid; }

	public _label:string = "";
	public get label():string { return this._label; }

	public _defObj:CanvasObjectDef | null = null;
	public get defObj():CanvasObjectDef { return this._defObj!; }

	public enabled:boolean = true;
	public _state:{ x: number; y: number; z: number; xScale: number; yScale: number };

	public centerLocally:boolean=false;
	public centerGlobally:boolean=false;

	public group:string = "main";
	public width:number = 0;
	public height:number = 0;

	public _parent:BaseCanvasObj | null = null;
	public SetParent(parent:BaseCanvasObj | null): void {this._parent = parent;}
	public get parent():BaseCanvasObj | null { return this._parent; }

	// Store world coordinates separately for rendering (calculated by parent)
	public _worldX:number = 0;
	public _worldY:number = 0;
	public _worldXScale:number = 1;
	public _worldYScale:number = 1;

	public constrainProportions:boolean = false;

	public baseX:number;
	public baseY:number;
	public baseWidth:number;
	public baseHeight:number;
	public baseXScale:number;
	public baseYScale:number;

	public get resolutionScale():number { return this._resolutionScale; }
	public _resolutionScale:number = -1;
	public get transformedWidth():number { return this._transformedWidth; }
	public _transformedWidth:number = -1;
	public _transformedWidthlast:number = -1;
	public get transformedHeight():number { return this._transformedHeight; }
	public _transformedHeight:number = -1;
	public _transformedHeightlast:number = -1;
	public get transformedX():number { return this._transformedX; }
	public _transformedX:number = -1;
	public _transformedXlast:number = -1;
	public get transformedY():number { return this._transformedY; }
	public _transformedY:number = -1;
	public _transformedYlast:number = -1;

	public _objBoundsReuse = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

	public _body:Matter.Body | null = null;

	public _debug!:boolean;
	public _debugLogs!:boolean;

	public _propertyChangeListeners:Map<"x" | "y" | "z" | "xScale" | "yScale", (oldValue: number, newValue: number) => void> = new Map();
	constructor(defObj:CanvasObjectDef)
	{
		this._debug = defObj.debugMode ?? false;
		this._debugLogs = defObj.debugLogs ?? false;
		this._defObj = defObj;

		this._uuid = GlobalUIDGenerator.generateUID();
		this._label = this.defObj.label ?? GlobalUIDGenerator.generateUniqueString(this.constructor.name);

		this._state = { x: defObj.x ?? 0, y: defObj.y ?? 0, z: defObj.z ?? 0, xScale: defObj.xScale ?? 1, yScale: defObj.yScale ?? 1 };

		this.centerLocally = defObj.centerLocally ?? false;
		this.centerGlobally = defObj.centerGlobally ?? false;

		this.group = this.defObj.group ?? "main";
		this.width = this.defObj.width ?? 0;
		this.height = this.defObj.height ?? 0;

		this.constrainProportions = this.defObj.constrainProportions ?? false;

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
					this._propertyChangeListeners.get(key as "x" | "y" | "z" | "xScale" | "yScale")?.(oldValue, value);
				}
				return true;
			},
		});
	}

	public UpdateBaseProps()
	{
		this.baseX = this._state.x;
		this.baseY = this._state.y;
		this.baseWidth = this.width;
		this.baseHeight = this.height;
		this.baseXScale = this._state.xScale;
		this.baseYScale = this._state.yScale;
		//console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");
	}

	public get x():number { return this._state.x; }
	public set x(value:number)
	{
		if(value == this._state.x) return;
		//console.log('__CanvasObj['+this._uuid+']  set x='+value);
		this._state.x = value;
		if(this._resolutionScale !== -1) this.ApplyResolutionScale(this._resolutionScale,"x");
	}

	public get y():number { return this._state.y; }
	public set y(value:number)
	{
		this._state.y = value;
		if(this._resolutionScale !== -1) this.ApplyResolutionScale(this._resolutionScale,"y");
	}

	public get z():number { return this._state.z; }
	public set z(value:number)
	{
		if (this._state.z !== value)
		{
			const oldZ = this._state.z;
			this._state.z = value;
			this._OnZIndexChanged?.(this, oldZ, this._state.z);
		}
	}

	public get xScale():number { return this._state.xScale; }
	public set xScale(value:number)
	{
		this._state.xScale = value;
		if(this._resolutionScale !== -1) this.ApplyResolutionScale(this._resolutionScale,"xScale");
	}

	public get yScale():number { return this._state.yScale; }
	public set yScale(value:number)
	{
		this._state.yScale = value;
		if(this._resolutionScale !== -1) this.ApplyResolutionScale(this._resolutionScale,"yScale");
	}

	// Get coordinates for rendering (automatically uses world coords when parented)
	public get renderX(): number {
		// If parented, return the world position calculated by parent
		// Otherwise, return our own position
		return this._parent ? this._worldX : this._state.x;
	}
	public get renderY(): number {
		return this._parent ? this._worldY : this._state.y;
	}
	public get renderXScale(): number {
		return this._parent ? this._worldXScale : this._state.xScale;
	}
	public get renderYScale(): number {
		return this._parent ? this._worldYScale : this._state.yScale;
	}

	public InitVisuals():void
	{
	}

	public ApplyResolutionScale(scale:number, property:string="")
	{
		//console.log(''+this.label+' ApplyResolutionScale() scale='+scale+', property='+property);
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

		// Scale changes affect width/height so trigger their updates when scale changes
		if((property == "*") || (property == "xScale"))
		{
			this._transformedWidth = this.width * scale;
			this._transformedWidthlast = this.width;
		}

		if((property == "*") || (property == "yScale"))
		{
			this._transformedHeight = this.height * scale;
			this._transformedHeightlast = this.height;
		}
	}

	public abstract Update(time: number, frameCount: number, onceSecond: boolean): void;

	public SwapDepths(other: BaseCanvasObj)
	{
		const temp = this.z;
		this.z = other.z;
		other.z = temp;
	}

	public BindPropertyChange(property: "x" | "y" | "z" | "xScale" | "yScale", callback: (oldValue: number, newValue: number) => void)
	{
		this._propertyChangeListeners.set(property, callback);
	}

	public UnbindPropertyChange(property: "x" | "y" | "z" | "xScale" | "yScale")
	{
		this._propertyChangeListeners.delete(property);
	}

	public set OnZIndexChanged(func: ((canvasObj: BaseCanvasObj, oldZIndex: number, newZIndex: number) => void) | null)
	{
		this._OnZIndexChanged = func;
	}
	public _OnZIndexChanged: ((canvasObj: BaseCanvasObj, oldZIndex: number, newZIndex: number) => void) | null = null;

	public Dispose():void
	{
		//console.log("Disposing CanvasObj: "+this._uuid+" / "+this._label);
		this._propertyChangeListeners.clear();
		this._parent = null;
		this._defObj = null;
		this._OnZIndexChanged = null;

		if(this._body)
		{
			this._body = null;
		}
	}
}
