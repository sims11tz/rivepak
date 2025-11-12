import Matter from "matter-js";
import type { TextStyleOptions } from "pixi.js";
import { PIXI_LAYER } from "../controllers/PixiController";

export enum OBJECT_SCALE_MODE
{
	MANUAL = "MANUAL",       // Explicit xScale/yScale values (current default behavior)
	FIT = "FIT",            // Scale to fit inside bounds, maintain aspect ratio
	FILL = "FILL",          // Scale to fill bounds completely, maintain aspect ratio (may crop)
	STRETCH = "STRETCH"      // Scale to fill bounds exactly, break aspect ratio if needed
}

export enum OBJECT_SCALE_ALIGN
{
	DEFAULT = "default",
	TOP = "top",
	BOTTOM = "bottom",
	BOTTOM_CENTER = "bottom-center",
	LEFT = "left",
	RIGHT = "right",
	CENTER = "center",
	TOP_CENTER = "top-center",
	TOP_LEFT = "top-left",
	TOP_RIGHT = "top-right",
	BOTTOM_LEFT = "bottom-left",
	BOTTOM_RIGHT = "bottom-right",
}

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

	visible?:boolean;
	render?:boolean;

/*TEXT Start*/
	// Text styling options
	textStyle?: Partial<TextStyleOptions>;
	textStyleOver?: Partial<TextStyleOptions>;
	textStyleDown?: Partial<TextStyleOptions>;

	textAlign?: 'left' | 'center' | 'right' | 'justify';
	verticalAlign?: 'top' | 'middle' | 'bottom';

	debugMode?:boolean;
	debugLogs?:boolean;

	drawFunction?:(pixiGraphics:any, defObj:CanvasObjectDef) => void;
	clickFunction?:(canvasObj:BaseCanvasObj) => void;

	bgColor?:string | number;
	bgAlpha?:number;
	borderColor?:string | number;
	borderWidth?:number;
	borderAlpha?:number;
	borderRadius?:number;
	cornerRadius?:number; // For rounded rectangles

	diameter?:number;
	radius?:number;

	// Shape-specific properties
	starPoints?:number;
	starInnerRadiusRatio?:number;
	polygonSides?:number;
	arrowHeadSize?:number;
	crossThickness?:number;
	gradientFrom?:number;
	gradientTo?:number;
	burstSpikes?:number;
	burstInnerRadiusRatio?:number;
	tailSize?:number;
	gearTeeth?:number;

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

	// Text decoration
	textUnderline?:boolean;
	underlineColor?:string | number;
	underlineThickness?:number;
	underlineOffset?:number;
	underlineAlpha?:number;
/*TEXT END*/

	count?:number;
	width?:number;
	height?:number;

	constrainProportions?:boolean;

	xScale?:number;
	yScale?:number;

	// Object scaling mode configuration
	scaleMode?:OBJECT_SCALE_MODE;
	scaleAlign?:OBJECT_SCALE_ALIGN;
	scaleBounds?:{width:number; height:number}; // Bounds to scale relative to (canvas, container, etc.)

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
	public _state:{ x:number; y:number; z:number; xScale:number; yScale:number; visible:boolean, render:boolean; };

	public centerLocally:boolean=false;
	public centerGlobally:boolean=false;

	/**
	 * When true, this object manages its own visibility independently from its parent.
	 * Parent visibility changes will not affect this object's visibility.
	 */
	public independentVisibility:boolean = false;

	public group:string = "main";
	public width:number = 0;
	public height:number = 0;

	public _parent:BaseCanvasObj | null = null;
	public SetParent(parent:BaseCanvasObj | null):void
	{
		//console.log('_canvasCanvasObj--->'+this.id+':'+this.label+'< SET PARENT ))> '+((parent) ? parent.id+':'+parent.label : 'null'));
		const hadParent = this._parent !== null;
		const willHaveParent = parent !== null;

		this._parent = parent;

		// Trigger hooks based on parent state change
		if(willHaveParent && !hadParent)
		{
			// Just got added to engine/container
			this.OnParentAdded();
		}
		else if(!willHaveParent && hadParent)
		{
			// Just removed from engine/container
			this.OnParentRemoved();
		}
	}
	public get parent():BaseCanvasObj | null { return this._parent; }

	// Store world coordinates separately for rendering (calculated by parent)
	public _worldX:number = 0;
	public _worldY:number = 0;
	public _worldXScale:number = 1;
	public _worldYScale:number = 1;

	public constrainProportions:boolean = false;

	//public baseX:number;
	//public baseY:number;
	//public baseWidth:number;
	//public baseHeight:number;
	//public baseXScale:number;
	//public baseYScale:number;

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
	public _objBoundsCalcs = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

	public _body:Matter.Body | null = null;

	public _disposed = false;

	public _debugRive!:boolean;
	public _debugLogs!:boolean;

	public _propertyChangeListeners:Map<"x" | "y" | "z" | "xScale" | "yScale" | "visible" | "render", (oldValue:number | boolean, newValue:number | boolean) => void> = new Map();
	constructor(defObj:CanvasObjectDef)
	{
		this._debugRive = defObj.debugMode ?? false;
		this._debugLogs = defObj.debugLogs ?? false;
		this._defObj = defObj;

		this._uuid = GlobalUIDGenerator.generateUID();
		this._label = this.defObj.label ?? GlobalUIDGenerator.generateUniqueString(this.constructor.name);

		this._state = { x: defObj.x ?? 0, y: defObj.y ?? 0, z: defObj.z ?? 0, xScale: defObj.xScale ?? 1, yScale: defObj.yScale ?? 1, visible: defObj.visible ?? true, render: defObj.render ?? true };

		//console.log("");
		//console.log("CanvasObj["+this._uuid+"] / "+this._label+"  created. pos=<"+this._state.x+","+this._state.y+">  size=<"+defObj.width+","+defObj.height+">  scale=<"+this._state.xScale+","+this._state.yScale+"> ");

		this.centerLocally = defObj.centerLocally ?? false;
		this.centerGlobally = defObj.centerGlobally ?? false;

		this.group = this.defObj.group ?? "main";
		this.width = this.defObj.width ?? 0;
		this.height = this.defObj.height ?? 0;

		this.constrainProportions = this.defObj.constrainProportions ?? false;

		//this.baseX = defObj.x ?? 0;
		//this.baseY = defObj.y ?? 0;
		//this.baseWidth = defObj.width ?? 1;
		//this.baseHeight = defObj.height ?? 1;
		//this.baseXScale = defObj.xScale ?? 1;
		//this.baseYScale = defObj.yScale ?? 1;
		//console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");

		this._state = new Proxy(this._state,
		{
			set: (target, key: string | symbol, value: any) =>
			{
				if (typeof key === 'string')
				{
					const typedKey = key as keyof typeof target;
					const oldValue = target[typedKey];
					if (oldValue !== value)
					{
						(target as any)[typedKey] = value;
						this._propertyChangeListeners.get(key as "x" | "y" | "z" | "xScale" | "yScale" | "visible" | "render")?.(oldValue, value);
					}
				}
				return true;
			},
		});
	}

	//public UpdateBaseProps()
	//{
	//	this.baseX = this._state.x;
	//	this.baseY = this._state.y;
	//	this.baseWidth = this.width;
	//	this.baseHeight = this.height;
	//	this.baseXScale = this._state.xScale;
	//	this.baseYScale = this._state.yScale;
	//	this.visible = this._state.visible;
	//	//console.log("CanvasObj["+this._uuid+"]   pos=<"+this.baseX+","+this.baseY+">  size=<"+this.width+","+this.height+">  scale=<"+this.baseXScale+","+this.baseYScale+"> ");
	//}

	public get visible():boolean
	{
		return this._state.visible ?? true;
	}
	public set visible(value:boolean)
	{
		if(value == this._state.visible) return;
		this._state.visible = value;
	}

	public get render():boolean
	{
		return this._state.render ?? true;
	}
	public set render(value:boolean)
	{
		if(value == this._state.render) return;
		this._state.render = value;
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

	public get renderX(): number {
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

		//console.log('%c '+this.label+' ApplyResolutionScale() scale='+scale+', property='+property,'color:#c94fff');
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
			//console.log('%c '+this.label+' 6 width '+this.width+'--TransW:'+this._transformedWidth,'color:#c94fff');
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
			//console.log('%c '+this.label+' 7 width '+this.width+'--TransW:'+this._transformedWidth,'color:#c94fff');
		}

		if((property == "*") || (property == "yScale"))
		{
			this._transformedHeight = this.height * scale;
			this._transformedHeightlast = this.height;
		}
	}

	public Update(time:number, frameCount:number, onceSecond:boolean, onceMinute:boolean, centerWidth=0, centerHeight=0)
	{
/*
		//if(onceSecond) console.log(' ');
		//if(onceSecond) console.log(' BaseCanvasObj['+this.label+'] Update() centerWidth='+centerWidth+', centerHeight='+centerHeight);
		//if(onceSecond) console.log(' BaseCanvasObj['+this.label+'] Update() this.width='+this.width+', this.height='+this.height);
		//if(onceSecond) console.log(' BaseCanvasObj['+this.label+'] Update() this.xScale='+this.xScale+', this.yScale='+this.yScale);
		//if(onceSecond) console.log(' BaseCanvasObj['+this.label+'] ______________________________________');
		//const scaledWidth = this.width * this.xScale;
		//const scaledHeight = this.height * this.yScale;
		const scaledWidth = this.width;
		const scaledHeight = this.height;
		//if(onceSecond) console.log(' BaseCanvasObj['+this.label+'] Update() scaledW='+scaledWidth+', scaledH='+scaledHeight);

		// Get DPR to account for high-res backing store
		const dpr = Math.max(1, window.devicePixelRatio || 1);

		if(this._resolutionScale !== -1)
		{
			//if(onceSecond) console.log(' !--!('+this.label+') === SET BOUNDS A! ');
			// Bounds for Rive renderer need to be in canvas pixels (with DPR)
			this._objBoundsReuse.minX = Math.round(this._transformedX * dpr);
			this._objBoundsReuse.minY = Math.round(this._transformedY * dpr);
			this._objBoundsReuse.maxX = Math.round((this._transformedX + (scaledWidth * this._resolutionScale)) * dpr);
			this._objBoundsReuse.maxY = Math.round((this._transformedY + (scaledHeight * this._resolutionScale)) * dpr);
		}
		else
		{
			//if(onceSecond) console.log(' !--!('+this.label+') === SET BOUNDS B! ');
			this._objBoundsReuse.minX = Math.round(this.x * dpr);
			this._objBoundsReuse.minY = Math.round(this.y * dpr);
			this._objBoundsReuse.maxX = Math.round((this.x + scaledWidth) * dpr);
			this._objBoundsReuse.maxY = Math.round((this.y + scaledHeight) * dpr);
		}

		this._objBoundsCalcs = {
			minX: this._objBoundsReuse.minX,
			minY: this._objBoundsReuse.minY,
			maxX: this._objBoundsReuse.maxX,
			maxY: this._objBoundsReuse.maxY
		};

		if(this.defObj.scaleMode === OBJECT_SCALE_MODE.STRETCH)
		{
			//if(onceSecond) console.log(' !--!('+this.label+') === OBJECT_SCALE_ALIGN.STRETCH!!!!!!! )!--! centerWidth='+centerWidth);
			this._objBoundsCalcs.minX = this._objBoundsReuse.minX + centerWidth;
			this._objBoundsCalcs.maxX = this._objBoundsReuse.maxX + centerWidth;
		}
		else if(this.defObj.scaleAlign === OBJECT_SCALE_ALIGN.CENTER)
		{
			//if(onceSecond) console.log(' !--!('+this.label+') === OBJECT_SCALE_ALIGN.CENTER)!--!   centerWidth W='+centerWidth);
			this._objBoundsCalcs.minX = this._objBoundsReuse.minX + centerWidth;
			this._objBoundsCalcs.maxX = this._objBoundsReuse.maxX + centerWidth;

			//if(onceSecond) console.log(' !--!('+this.label+') === OBJECT_SCALE_ALIGN.CENTER)!--!   centerWidth W='+centerHeight);
			this._objBoundsCalcs.minY = this._objBoundsReuse.minY + centerHeight;
			this._objBoundsCalcs.maxY = this._objBoundsReuse.maxY + centerHeight;
		}



		//if(this.defObj.scaleMode === OBJECT_SCALE_MODE.STRETCH)
				//{
				//	const offsetNumber = (PixiController.get().PixiAbove.view.width - this._objBoundsReuse.maxX) / 2;
				//	if(daveDebug)
				//	{
				//		//if(onceSecond) console.log(' !--!('+this.label+') === OBJECT_SCALE_ALIGN.TOP_CENTER)!--!       pixi.w='+PixiController.get().PixiAbove.view.width);
				//		//if(onceSecond) console.log(' !--!('+this.label+') === OBJECT_SCALE_ALIGN.TOP_CENTER)!--! offsetNumber='+offsetNumber);
				//	}
				//	this._objBoundsReuse.minX = this._objBoundsReuse.minX + offsetNumber;
				//	this._objBoundsReuse.maxX = this._objBoundsReuse.maxX + offsetNumber;
				//}
				//else if(this.defObj.scaleAlign === OBJECT_SCALE_ALIGN.CENTER)
				//{
				//	const offsetWNumber = (RiveController.get().Canvas.width - this._objBoundsReuse.maxX) / 2;
				//	//if(onceSecond) console.log(' !--!('+this.label+') === OBJECT_SCALE_ALIGN.CENTER)!--!   Offset W='+offsetWNumber);
				//	this._objBoundsReuse.minX = this._objBoundsReuse.minX + offsetWNumber;
				//	this._objBoundsReuse.maxX = this._objBoundsReuse.maxX + offsetWNumber;

				//	// Vertical centering - divide by 2 to center (not just the full difference)
				//	const offsetHNumber = (PixiController.get().PixiAbove.view.height/2);
				//	this._objBoundsReuse.minY = this._objBoundsReuse.minY + offsetHNumber;
				//	this._objBoundsReuse.maxY = this._objBoundsReuse.maxY + offsetHNumber;
				//}
*/
	}

	public SwapDepths(other:BaseCanvasObj)
	{
		const temp = this.z;
		this.z = other.z;
		other.z = temp;
	}

	public BindPropertyChange(property: "x" | "y" | "z" | "xScale" | "yScale" | "visible", callback: (oldValue: number | boolean, newValue: number | boolean) => void)
	{
		this._propertyChangeListeners.set(property, callback);
	}

	public UnbindPropertyChange(property: "x" | "y" | "z" | "xScale" | "yScale" | "visible")
	{
		this._propertyChangeListeners.delete(property);
	}

	public set OnZIndexChanged(func:((canvasObj: BaseCanvasObj, oldZIndex: number, newZIndex: number) => void) | null)
	{
		this._OnZIndexChanged = func;
	}
	public _OnZIndexChanged:((canvasObj: BaseCanvasObj, oldZIndex: number, newZIndex: number) => void) | null = null;

	public set OnDispose(func:((canvasObj: BaseCanvasObj) => void) | null)
	{
		this._OnDispose = func;
	}
	public _OnDispose:((canvasObj: BaseCanvasObj) => void) | null = null;

	/**
	 * Hook method called when object gets a parent (added to engine/container)
	 * Subclasses can override to handle initialization that requires parent context
	 */
	public OnParentAdded():void
	{
		// Override in subclasses if needed
	}

	/**
	 * Hook method called when object loses its parent (removed from engine/container)
	 * Subclasses can override to handle cleanup that requires parent context
	 */
	public OnParentRemoved():void
	{
		// Override in subclasses if needed
	}

	public Dispose():void
	{
		//console.log("Disposing CanvasObj: "+this._uuid+" / "+this._label);
		this._disposed = true;

		if(this._OnDispose)
		{
			this._OnDispose(this);
		}

		this._propertyChangeListeners.clear();
		this._parent = null;
		this._defObj = null;
		this._OnZIndexChanged = null;
		this._OnDispose = null;

		if(this._body)
		{
			this._body = null;
		}
	}
}
