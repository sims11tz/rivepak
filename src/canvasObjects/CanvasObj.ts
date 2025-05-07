import Matter from "matter-js";

export class GlobalUIDGenerator
{
	private static currentId = 0;

	public static generateUID():string
	{
		return `obj_${++this.currentId}}`;
	}

	private static uniqueIds: Record<string, number> = {};

	public static generateUniqueString(baseString: string): string
	{
		if (!this.uniqueIds[baseString]) {
			this.uniqueIds[baseString] = 1;
		} else {
			this.uniqueIds[baseString]++;
		}

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
	public abstract update(time: number, frameCount: number, onceSecond: boolean): void;
	public dispose():void
	{

	}

	public _uuid: string = "";
	public get uuid(): string { return this._uuid; }

	public _label: string = "";
	public get label(): string { return this._label; }

	public _defObj: CanvasObjectDef | null = null;
	public get defObj(): CanvasObjectDef { return this._defObj!; }

	public enabled: boolean = true;
	public _state: { x: number; y: number; z: number }; // Internal state

	public group: string = "main";
	public width: number = 0;
	public height: number = 0;
	public xScale: number = 0;
	public yScale: number = 0;

	public _body: Matter.Body | null = null;

	public _propertyChangeListeners: Map<"x" | "y" | "z", (oldValue: number, newValue: number) => void> = new Map();

	constructor(defObj: CanvasObjectDef)
	{
		this._defObj = defObj;

		this._uuid = GlobalUIDGenerator.generateUID();
		this._label = this.defObj.label ?? GlobalUIDGenerator.generateUniqueString(this.constructor.name);

		this._state = { x: defObj.x ?? 0, y: defObj.y ?? 0, z: defObj.z ?? 0 };

		this.group = this.defObj.group ?? "main";
		this.width = this.defObj.width ?? 0;
		this.height = this.defObj.height ?? 0;

		this.xScale = this.defObj.xScale ?? 0;
		this.yScale = this.defObj.yScale ?? 0;

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

	public get x(): number { return this._state.x; }
	public set x(value: number) { this._state.x = value; }

	public get y(): number { return this._state.y; }
	public set y(value: number) { this._state.y = value; }

	public get z(): number { return this._state.z; }
	public set z(value: number)
	{
		if (this._state.z !== value)
		{
			const oldZ = this._state.z;
			this._state.z = value;
			this._onZIndexChanged?.(this, oldZ, this._state.z);
		}
	}

	public swapDepths(other: CanvasObj)
	{
		const temp = this.z;
		this.z = other.z;
		other.z = temp;
	}

	// ✅ Function to selectively bind to x, y, or z changes
	public bindPropertyChange(property: "x" | "y" | "z", callback: (oldValue: number, newValue: number) => void)
	{
		this._propertyChangeListeners.set(property, callback);
	}

	// ✅ Function to unbind property change listener
	public unbindPropertyChange(property: "x" | "y" | "z")
	{
		this._propertyChangeListeners.delete(property);
	}

	public set onZIndexChanged(func: ((canvasObj: CanvasObj, oldZIndex: number, newZIndex: number) => void) | null)
	{
		this._onZIndexChanged = func;
	}
	public _onZIndexChanged: ((canvasObj: CanvasObj, oldZIndex: number, newZIndex: number) => void) | null = null;
}
