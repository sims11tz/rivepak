import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance, ViewModelInstance } from "@rive-app/webgl2-advanced";
import { RiveController, RiveObjectDef } from "../controllers/RiveController";
import { BaseCanvasObj, CanvasObjectEntity, GlobalUIDGenerator } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
import { PixiController } from "../controllers/PixiController";
import { CanvasEngine } from "../useCanvasEngine";
import { RiveTimelineController } from "./RiveTimelineController";

export class AnimationMetadata
{
	public readonly animation:LinearAnimationInstance;
	public readonly artboard:Artboard;
	public readonly index:number;
	public readonly name:string;
	public readonly duration:number;
	public readonly speed:number;
	public readonly fps:number;
	public autoPlay:boolean = true;
	public isTimelineControlled:boolean = false;
	private _uuid:string;
	public get uuid():string { return this._uuid; }

	constructor(artboard:Artboard, animation: LinearAnimationInstance, index: number, name: string, duration: number, autoPlay: boolean = true)
	{
		this._uuid = GlobalUIDGenerator.generateUID();

		this.artboard = artboard;
		this.animation = animation;
		this.index = index;
		this.name = name;
		this.duration = duration;
		this.speed = (animation as any).speed ?? 1;
		this.fps = (animation as any).fps ?? 60;
		this.autoPlay = autoPlay;
		this.isTimelineControlled = false;
	}
}

export enum RIVE_CURSOR_TYPES
{
	DEFAULT = 'default',
	POINTER = 'pointer',
	GRAB = 'grab',
	CROSSHAIR = 'crosshair',
	NOT_ALLOWED = 'not-allowed',
	N_RESIZE = 'n-resize',
	EW_RESIZE = 'ew-resize',
	NESW_RESIZE = 'nesw-resize'
}

export type RiveInstance = Awaited<ReturnType<typeof RiveCanvas>>;

export interface RiveArtboardBundle
{
	id:number;
	entityObj:EntityObj;
	artboard:Artboard;
	animations:LinearAnimationInstance[];
	stateMachine:StateMachineInstance | null;
	inputs:Map<string, SMIInput>;
}

export interface EntityObj
{
	width:number;
	height:number;
	body:Matter.Body | null;
}

export class CanvasRiveObj extends BaseCanvasObj
{
	private _artboard:Artboard;
	protected _renderer:Renderer;
	protected _riveInstance: Awaited<ReturnType<typeof RiveCanvas>>;

	protected  _animations:AnimationMetadata[];
	protected _stateMachine:StateMachineInstance | null = null;
	protected _inputs = new Map<string, SMIInput>();

	protected _viewModels = new Map<string, any>();
	protected _viewModelInstance:ViewModelInstance | null = null;

	private _vmEnumQueue:Array<{path: string, value: string}> = [];
	private _vmEnumQueueProcessedThisFrame = false;

	// Event subscription system
	private _eventCallbacks = new Map<string, ((event:any) => void)[]>();

	/**
	 * Subscribe to a Rive event by name
	 * @param eventName The name of the Rive event to listen for
	 * @param callback Function to call when the event fires
	 * @returns Unsubscribe function
	 */
	public OnRiveEvent(eventName:string, callback:(event:any) => void):() => void
	{
		if(!this._eventCallbacks.has(eventName))
		{
			this._eventCallbacks.set(eventName, []);
		}
		this._eventCallbacks.get(eventName)!.push(callback);

		// Return unsubscribe function
		return () =>
		{
			const callbacks = this._eventCallbacks.get(eventName);
			if(callbacks)
			{
				const index = callbacks.indexOf(callback);
				if(index !== -1)
				{
					callbacks.splice(index, 1);
				}
			}
		};
	}

	/**
	 * Remove all event listeners for a specific event name
	 */
	public ClearRiveEventListeners(eventName:string):void
	{
		this._eventCallbacks.delete(eventName);
	}

	/**
	 * Remove all event listeners
	 */
	public ClearAllRiveEventListeners():void
	{
		this._eventCallbacks.clear();
	}

	public SetViewModelInstance(vmi:ViewModelInstance | null)
	{
		const debug = false;
		if(debug)
		{
			console.log(`📝 SetViewModelInstance called for "${this._label}"`);
			console.log(`   VMI is null?`, vmi === null);
			console.log(`   State Machine exists?`, !!this._stateMachine);
			console.log(`   State Machine name:`, this._stateMachine?.name);
		}

		this._viewModelInstance = vmi;

		// CRITICAL: Bind VMI to State Machine if it exists
		// The State Machine needs the VMI bound to react to ViewModel changes
		if(vmi && this._stateMachine && typeof this._stateMachine.bindViewModelInstance === "function")
		{
			if(debug) console.log(`🔗 Binding VMI to State Machine "${this._stateMachine.name}" for object "${this._label}"`);
			this._stateMachine.bindViewModelInstance(vmi);
			if(debug) console.log(`✅ VMI successfully bound to State Machine!`);
		}
		else
		{
			if(debug) console.log(`❌ Cannot bind VMI to State Machine:`);
			if(!vmi) console.log(`   - VMI is null`);
			if(debug && !this._stateMachine) console.log(`   - State Machine is null`);
			if(this._stateMachine && typeof this._stateMachine.bindViewModelInstance !== "function")
			if(debug) console.log(`   - bindViewModelInstance is not a function`);
		}
	}

	public get ViewModelInstance(): ViewModelInstance | null
	{
		return this._viewModelInstance;
	}

	/**
	 * Queue a ViewModel enum change to be applied in the next frame.
	 * This ensures State Machines process changes one per frame in sequence.
	 * @param path - The path to the enum property (e.g., "POD_TYPE")
	 * @param value - The string value to set (e.g., "SPACE")
	 */
	public QueueViewModelEnumChange(path: string, value: string): void
	{
		//console.log('%c QueueViewModelEnumChange path='+path+', value='+value, 'color: #ffc400; font-weight: bold;');

		if(!this._viewModelInstance)
		{
			console.warn(`QueueViewModelEnumChange: No ViewModelInstance available for "${this._label}"`);
			return;
		}
		this._vmEnumQueue.push({path, value});
		//console.log(`📋 Queued enum change: ${path} = ${value} (queue length: ${this._vmEnumQueue.length})`);
	}

	/**
	 * Process the next queued ViewModel enum change (called once per frame in Update)
	 */
	private _processVMEnumQueue(): void
	{
		if(this._vmEnumQueue.length === 0 || !this._viewModelInstance) return;

		// Only process one change per frame
		if(this._vmEnumQueueProcessedThisFrame) return;

		const change = this._vmEnumQueue.shift();
		if(change)
		{
			try
			{
				this._viewModelInstance.enum(change.path).value = change.value;
				//console.log(`✅ Applied queued enum change: ${change.path} = ${change.value} (${this._vmEnumQueue.length} remaining)`);
			}
			catch(error)
			{
				console.error(`❌ Failed to apply queued enum change: ${change.path} = ${change.value}`, error);
			}
			this._vmEnumQueueProcessedThisFrame = true;
		}
	}

	private _riveObjDef:RiveObjectDef;
	public get riveObjDef():RiveObjectDef { return this._riveObjDef; }

	private _artboardName: string = "";
	public get artboardName(): string { return this._artboardName; }

	private _filePath: string = "";
	public get filePath(): string { return this._filePath; }

	protected _baseRiveVMPath: string = "";
	public get baseRiveVMPath(): string { return this._baseRiveVMPath; }

	constructor(riveDef:RiveObjectDef, artboard: Artboard)
	{
		super(riveDef);

		this._riveObjDef = riveDef;
		if(this._riveObjDef.id != undefined && this._riveObjDef.id != "")
		{
			this._id = this._riveObjDef.id;
		}

		this._artboardName = this._riveObjDef.artboardName ?? "";
		this._filePath = this._riveObjDef.filePath ?? "";

		this._renderer = RiveController.get().Renderer!;
		this._riveInstance = RiveController.get().Rive!;
		this._artboard = artboard;
		this._animations = [];

	}

	private _lastMousePos = { x: -1, y: -1 };
	private _lastMouseDown = false;

	private _entityObj:CanvasObjectEntity | null = null;

	// Inspect all props/methods on a WASM-wrapped object (e.g., a Rive Node)
	private dumpWasmObject(obj: any)
	{
		const seen = new Set<string>();
		let level = 0;
		let proto: any = obj;

		while (proto && proto !== Object.prototype) {
			const ctorName = proto.constructor?.name ?? '(anonymous proto)';
			const keys = Reflect.ownKeys(proto) as (string | symbol)[];

			console.groupCollapsed(`[[proto level ${level}]] ${ctorName} — ${keys.length} keys`);

			for (const k of keys) {
			if (k === 'constructor') continue;
			const desc = Object.getOwnPropertyDescriptor(proto, k as any);
			if (!desc) continue;

			let kind = 'field';
			let arity = '';
			if (desc.get || desc.set) {
				kind = `accessor${desc.get ? '(get' : ''}${desc.set ? '/set)' : ')'}`;
			} else if (typeof desc.value === 'function') {
				kind = 'method';
				arity = `/${(desc.value as Function).length}`; // param count
			}

			const tag = `${String(k)}@${level}`;
			if (seen.has(tag)) continue;
			seen.add(tag);

			console.log(kind.padEnd(12), String(k), arity);
			}

			console.groupEnd();
			proto = Object.getPrototypeOf(proto);
			level++;
		}
	}

	public InitRiveObject():void
	{
		if(this._debugLogs)
		{
			console.log("");
			console.log('%c ___________________ INIT RIVE OBJECT ________________________','color:#00FFFF');
			console.log('%c Artboard Name: '+this.artboard.name,'color:#00FFFF');
			console.log(" artboard: ",this.artboard);
			console.log(" filePath: ",this.filePath);
			console.log('%c Artboard Width: '+this.artboard.width,'color:#00FFFF');
			console.log('%c Artboard Height: '+this.artboard.height,'color:#00FFFF');
		}

		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

		if(this._debugLogs) console.log('%c InitRiveObject x:'+this.x+', y:'+this.y,'color:#00FFFF');

		const artboardWidth = this.artboard.width;
		const artboardHeight = this.artboard.height;
		const aspectRatio = artboardWidth / artboardHeight;

		if (this.defObj.width && this.defObj.height)
		{
			// CASE 1: Fully specified
			this.width = this.defObj.width;
			this.height = this.defObj.height;
			this.xScale = this.width / artboardWidth;
			this.yScale = this.height / artboardHeight;
		}
		else if (this.defObj.constrainProportions && this.defObj.width && !this.defObj.height)
		{
			// CASE 2: width specified, calculate height
			this.width = this.defObj.width;
			this.height = this.defObj.width / aspectRatio;
			this.xScale = this.width / artboardWidth;
			this.yScale = this.height / artboardHeight;
		}
		else if (this.defObj.constrainProportions && this.defObj.height && !this.defObj.width)
		{
			// CASE 3: height specified, calculate width
			this.height = this.defObj.height;
			this.width = this.defObj.height * aspectRatio;
			this.xScale = this.width / artboardWidth;
			this.yScale = this.height / artboardHeight;
		}
		else
		{
			// CASE 4: fallback to xScale/yScale or defaults
			this.width = artboardWidth;
			this.height = artboardHeight;

			this.xScale = this.defObj.xScale ?? 1;
			if (this.xScale > 0) this.width = artboardWidth * this.xScale;

			this.yScale = this.defObj.yScale ?? 1;
			if (this.yScale > 0) this.height = artboardHeight * this.yScale;
		}

		if(this._debugLogs)
		{
			console.log('%c CanvasRiveObj .. ALL done : x='+this.x+',y='+this.y+',w='+this.width+',h='+this.height+',xScale='+this.xScale+',yScale='+this.yScale,'color:#00FFFF');
		}

		if(this.centerGlobally)
		{
			this.x = CanvasEngine.get().width / 2;
			this.y = CanvasEngine.get().height / 2;
		}

		if(this.centerGlobally || this.centerLocally)
		{
			this.x -= (this.width / 2);
			this.y -= (this.height / 2);
		}

		if((this.defObj as RiveObjectDef).onClickCallback) this._onClickCallback = (this.defObj as RiveObjectDef).onClickCallback;
		if((this.defObj as RiveObjectDef).onHoverCallback) this._onHoverCallback = (this.defObj as RiveObjectDef).onHoverCallback;
		if((this.defObj as RiveObjectDef).onHoverOutCallback) this._onHoverOutCallback = (this.defObj as RiveObjectDef).onHoverOutCallback;

		if(this._debugLogs)
		{
			console.log("<"+this._label+"> CanvasRiveObj ---   position :: "+this.x+" - "+this.y+" ");
			console.log("<"+this._label+"> CanvasRiveObj --- dimensions :: "+this.width+"x"+this.height+" --- scale::"+this.xScale+"x"+this.yScale);
			console.log("<"+this._label+"> CanvasRiveObj ---   artboard :: "+this.artboard.width+"x"+this.artboard.height);

			//console.log("");
			console.log(" UPDATE BASE PROPS >>> "+this._label+" --- "+this.width+"x"+this.height+" --- "+this.xScale+"x"+this.yScale);
		}
		//this.UpdateBaseProps();

		if(this.defObj.interactive) this.initInteractive();

		if(this.defObj.text && this.defObj.text.length > 0) this.drawTextLabel();

		if(this._debugLogs)
		{
			//console.log("Artboard Bounds: ", this.artboard.bounds);
			//console.log("Artboard State Machine Count: "+this.artboard.stateMachineCount());
			console.log("Artboard Animation Count: "+this.artboard.animationCount());
		}

		this._animations = [];
		for (let j = 0; j < this.artboard.animationCount(); j++)
		{
			const animationDefinition = this.artboard.animationByIndex(j);
			//if(this._debugLogs) console.log("Animation["+j+"]: ________ "+animationDefinition.name+" loopValue:"+animationDefinition.loopValue);
			const animation = new this.Rive.LinearAnimationInstance( animationDefinition, this.artboard );

			const animDef = animationDefinition as any;

			if(this._debugLogs)
			{
				// Debug: Log all duration-related properties
				//console.log(`Animation[${j}] "${animationDefinition.name}" duration investigation:`);
				//console.log(`  - animDef.duration: ${animDef.duration}`);
				//console.log(`  - animDef.durationSeconds: ${animDef.durationSeconds}`);
				//console.log(`  - animDef.durationFrames: ${animDef.durationFrames}`);
				//console.log(`  - animDef.workEnd: ${animDef.workEnd}`);
				//console.log(`  - animDef.workStart: ${animDef.workStart}`);
				//console.log(`  - animDef.fps: ${animDef.fps ?? 60}`);
			}

			// Check if we're getting frames instead of seconds
			let duration = animDef.durationSeconds ?? animDef.duration ?? 0;
			const fps = animDef.fps ?? 60;

			// If duration seems to be in frames (e.g., 600 frames for 10 seconds at 60fps)
			// Check if the duration value is suspiciously large (likely frames)
			if(animDef.workEnd && animDef.workEnd > 100) {
				// workEnd appears to be in frames, convert to seconds
				duration = animDef.workEnd / fps;
				if(this._debugLogs) console.log(`  - Converting workEnd from frames (${animDef.workEnd}) to seconds: ${duration}s`);
			} else if(duration > 100) {
				// If duration is suspiciously large, it might be in frames
				if(this._debugLogs) console.log(`  - Duration seems to be in frames (${duration}), converting to seconds...`);
				duration = duration / fps;
			}

			//console.log(`  - FINAL duration: ${duration} seconds (${duration * fps} frames)`);

			//if(this._debugLogs) console.log("Animation["+j+"]: "+animationDefinition.name+" -- duration:"+duration+" -- fps:"+(animDef.fps ?? 60));

			const metadata = new AnimationMetadata(this.artboard, animation, j, animationDefinition.name, duration);
			this._animations.push(metadata);
		}
		if(this._debugLogs) console.log("Animations Loaded : "+this._animations.length);

		const smCount = this.artboard.stateMachineCount();
		if(this._debugLogs) console.log(`🎰 Artboard "${this.artboard.name}" has ${smCount} State Machine(s)`);

		this._stateMachine = smCount > 0 ? new this.Rive.StateMachineInstance(this.artboard.stateMachineByIndex(0),this.artboard): null;

		this._inputs = new Map<string, SMIInput>();
		if (this._stateMachine)
		{
			if(this._debugLogs)
			{
				console.log(`✅ State Machine "${this._stateMachine.name}" created successfully`);
				console.log("Has State Machine<"+this._stateMachine.inputCount()+">: "+this._stateMachine.name);
				console.log("Has State Machine<"+this._stateMachine.inputCount()+">: "+this._stateMachine.stateChangedCount());
			}

			for (let j = 0; j < this._stateMachine.inputCount(); j++)
			{
				const input = this._stateMachine.input(j);
				this._inputs.set(input.name, input);
				//if(this._debugLogs) console.log("Input["+j+"]: "+input.name+" -- "+input.type+" -- "+input.value);
			}

			// CRITICAL: Bind VMI to State Machine if VMI was set before the State Machine was created
			// This handles the timing issue where SetViewModelInstance() is called during super() before the SM exists
			if(this._viewModelInstance && typeof this._stateMachine.bindViewModelInstance === "function")
			{
				if(this._debugLogs) console.log(`🔗 [Constructor] Binding VMI to State Machine "${this._stateMachine.name}" for "${this._label}"`);
				this._stateMachine.bindViewModelInstance(this._viewModelInstance);
				if(this._debugLogs) console.log(`✅ [Constructor] VMI successfully bound to State Machine!`);
			}
		}
		else
		{
			if(this._debugLogs) console.log(`❌ No State Machine found in artboard "${this.artboard.name}"`);
		}

		//if(this._viewModelInstance)
		//{
		//	this._readVMFlags();
		//}

		this._entityObj = { x: this.x, y: this.y, width: this.width, height: this.height, xScale:this.xScale, yScale:this.yScale, riveInteractiveLocalOnly:this.defObj.riveInteractiveLocalOnly};

		this.ApplyResolutionScale(this._resolutionScale,'*');
	}

	//private _autoplayVM = new Map<string, boolean>();
	//private _readVMFlags()
	//{
	//	this._autoplayVM.clear();
	//	const vmi:ViewModelInstance | null = this._viewModelInstance;
	//	if(vmi)
	//	{
	//		const props = vmi?.getProperties?.() ?? [];
	//		for (const p of props)
	//		{
	//			if (p?.name?.startsWith('auto.'))
	//			{
	//				const animName = p.name.slice(15);
	//				this._autoplayVM.set(animName, !!(p as any).value);
	//			}
	//		}
	//	}
	//}

	public updateEntityObj():void
	{
		this._entityObj!.x = this.x;
		this._entityObj!.y = this.y;
		this._entityObj!.width = this.width;
		this._entityObj!.height = this.height;
		this._entityObj!.xScale = this.xScale;
		this._entityObj!.yScale = this.yScale;
		this._entityObj!.riveInteractiveLocalOnly = this.defObj.riveInteractiveLocalOnly;
		this._entityObj!.resolutionScale = this._resolutionScale;
	}

	public InputByName(name: string):SMIInput | null
	{
		if (this._inputs.has(name))
		{
			return this._inputs.get(name)!;
		}
		else
		{
			console.warn("Input not found: " + name);
			return null;
		}
	}

	public RandomInput(): SMIInput | null
	{
		const randomIndex = Math.floor(Math.random() * this._inputs.size);
		return Array.from(this._inputs.values())[randomIndex];
	}

	public RandomInputByName(searchTerm: string): SMIInput | null
	{
		const matchingInputs: SMIInput[] = [];

		this._inputs.forEach((input) =>
		{
			if (input.name.toLowerCase().includes(searchTerm.toLowerCase()))
			{
				matchingInputs.push(input);
			}
		});

		if (matchingInputs.length === 0)
		{
			console.warn(`No matching inputs found for: ${searchTerm}`);
			return null;
		}

		const randomIndex = Math.floor(Math.random() * matchingInputs.length);
		return matchingInputs[randomIndex];
	}

	public GetAnimationByName(name: string): AnimationMetadata | null
	{
		const found = this._animations.find(animMeta => animMeta.name === name);
		return found || null;
	}

	public GetAnimationByIndex(index: number): AnimationMetadata | null
	{
		if (index >= 0 && index < this._animations.length)
		{
			return this._animations[index];
		}
		return null;
	}

	public GetAnimationsByNamePattern(searchTerm: string): AnimationMetadata[]
	{
		return this._animations.filter(animMeta =>
			animMeta.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}

	public GetAllAnimations(): AnimationMetadata[]
	{
		return [...this._animations];
	}

	public PlayAnimationByName(name: string): boolean
	{
		const animMeta = this.GetAnimationByName(name);
		if (animMeta)
		{
			animMeta.animation.advance(0);
			animMeta.animation.apply(1);
			return true;
		}
		console.warn(`Animation not found: ${name}`);
		return false;
	}

	public SetAnimationAutoPlay(name: string, autoPlay: boolean): boolean
	{
		const animMeta = this.GetAnimationByName(name);
		if (animMeta)
		{
			animMeta.autoPlay = autoPlay;
			return true;
		}
		console.warn(`Animation not found: ${name}`);
		return false;
	}

	public SetAllAnimationsAutoPlay(autoPlay: boolean): void
	{
		this._animations.forEach(animMeta => {
			animMeta.autoPlay = autoPlay;
		});
	}

	public DisableAutoPlayForAnimations(names: string[]): void
	{
		names.forEach(name => {
			this.SetAnimationAutoPlay(name, false);
		});
	}

	public Update(time:number, frameCount:number, onceSecond:boolean): void
	{
		if(this.enabled === false || this.visible === false || this._disposed) return;

		// Reset the queue processing flag at the start of each frame
		this._vmEnumQueueProcessedThisFrame = false;

		// Process one queued ViewModel enum change per frame (if any)
		this._processVMEnumQueue();

		// Process animations - skip if timeline controlled or autoPlay is false
		for (let i = 0; i < this._animations.length; i++)
		{
			const animationMeta = this._animations[i];
			if(!animationMeta.isTimelineControlled)
			{
				if(animationMeta.autoPlay)
				{
					if(onceSecond)
					{
						//console.log('YES Update('+time+' me : '+this._riveObjDef.artboardName+'-'+animationMeta.name+')');
					}
					animationMeta.animation.advance(time);
					animationMeta.animation.apply(1);
				}
			}
			else
			{
				const timelineController = CanvasEngine.get().GetTimelineController(animationMeta);
				if(timelineController)
				{
					timelineController.Update(time, frameCount, onceSecond);
				}
			}
		}

		if(this._stateMachine)
		{
			this._stateMachine.advance(time);

			// Check for events and trigger callbacks
			const eventCount = this._stateMachine.reportedEventCount();
			if(!this._disposed && eventCount > 0)
			{
				for(let i = 0; i < eventCount; i++)
				{
					const event = this._stateMachine.reportedEventAt(i);
					if (event != undefined)
					{
						// Trigger any subscribed callbacks for this event
						const callbacks = this._eventCallbacks.get(event.name);
						if(callbacks && callbacks.length > 0)
						{
							callbacks.forEach(callback => callback(event));
						}
					}
				}
			}

			// Skip state change checks if we're not using them
			//const stateChangeCount = this._stateMachine.stateChangedCount();
			//if(!this._disposed && stateChangeCount > 0)
			//{
			//	for(let x = 0; x < stateChangeCount; x++)
			//	{
			//		const stateChange = this._stateMachine.stateChangedNameByIndex(x);
			//		if (stateChange != undefined)
			//		{
			//			console.log('RIVE STATE CHANGE<'+x+'>: ', stateChange);
			//		}
			//	}
			//}

			if(!this._disposed && this.defObj.riveInteractive)
			{
				this.updateEntityObj();

				const artboardMoveSpace = RiveController.get().WindowToArtboard(this._entityObj!);
				const mouseDown = RiveController.get().MouseDown;

				// Cache comparison values
				const mousePosChanged = ( this._lastMousePos.x !== artboardMoveSpace.x || this._lastMousePos.y !== artboardMoveSpace.y);
				const mouseDownChanged = ( this._lastMouseDown !== mouseDown );

				if (mouseDownChanged)
				{
					const artBoardInteractionSpace = RiveController.get().CanvasToArtboard(this._entityObj!,true);
					if(mouseDown)
					{
						//console.log('CanvasRiveObj<'+this._label+'>: '+this._stateMachine?.name+' -- mouseDown @ ');
						//console.log('CanvasRiveObj<'+this._label+'>: DOWN ', artboardMoveSpace.x, artboardMoveSpace.y, ' -- interaction space: ', artBoardInteractionSpace.x, artBoardInteractionSpace.y);
						//this._stateMachine.pointerDown(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
						this._stateMachine.pointerDown(artboardMoveSpace.x, artboardMoveSpace.y);
					}
					else
					{
						//this._stateMachine.pointerUp(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
						this._stateMachine.pointerUp(artboardMoveSpace.x, artboardMoveSpace.y);
					}
				}

				if (mousePosChanged)
				{
					//console.log("Rive Interaction<"+this._label+">: MOVE ", artboardMoveSpace.x, artboardMoveSpace.y);
					this._stateMachine.pointerMove(artboardMoveSpace.x, artboardMoveSpace.y);
				}

				this._lastMousePos.x = artboardMoveSpace.x;
				this._lastMousePos.y = artboardMoveSpace.y;
				this._lastMouseDown = mouseDown;
			}
		}


		if(!this._disposed)
		{
			this.artboard.advance(time);

			const scaledWidth = this.artboard.width * this.xScale;
			const scaledHeight = this.artboard.height * this.yScale;

			// Get DPR to account for high-res backing store
			const dpr = Math.max(1, window.devicePixelRatio || 1);

			if(this._resolutionScale !== -1)
			{
				// Bounds for Rive renderer need to be in canvas pixels (with DPR)
				this._objBoundsReuse.minX = Math.round(this._transformedX * dpr);
				this._objBoundsReuse.minY = Math.round(this._transformedY * dpr);
				this._objBoundsReuse.maxX = Math.round((this._transformedX + (scaledWidth * this._resolutionScale)) * dpr);
				this._objBoundsReuse.maxY = Math.round((this._transformedY + (scaledHeight * this._resolutionScale)) * dpr);
			}
			else
			{
				this._objBoundsReuse.minX = Math.round(this.x * dpr);
				this._objBoundsReuse.minY = Math.round(this.y * dpr);
				this._objBoundsReuse.maxX = Math.round((this.x + scaledWidth) * dpr);
				this._objBoundsReuse.maxY = Math.round((this.y + scaledHeight) * dpr);
			}

			this.Renderer.save();
			this.Renderer.align(
				this.Rive.Fit.contain,
				this.Rive.Alignment.topLeft,
				this._objBoundsReuse,
				this.artboard.bounds
			);

			if(this._interactiveGraphics)
			{
				// Pixi uses CSS pixels, but _objBoundsReuse is in canvas pixels (with DPR)
				// So divide by DPR to convert back to CSS coordinates for Pixi
				const dpr = Math.max(1, window.devicePixelRatio || 1);

				this._interactiveGraphics.x = this._objBoundsReuse.minX / dpr;
				this._interactiveGraphics.y = this._objBoundsReuse.minY / dpr;

				this._interactiveGraphics.width = (this._objBoundsReuse.maxX - this._objBoundsReuse.minX) / dpr;
				this._interactiveGraphics.height = (this._objBoundsReuse.maxY - this._objBoundsReuse.minY) / dpr;
			}

			if(this._textLabel)
			{
				// Cache resolution scale check
				const resScale = this._resolutionScale !== -1 ? this._resolutionScale : 1;
				const combinedScaleX = resScale * this.xScale;
				const combinedScaleY = resScale * this.yScale;

				this._textLabel.x = this._objBoundsReuse.minX;
				this._textLabel.y = this._objBoundsReuse.maxY - (this._textLabel.height * combinedScaleY) - 5;

				// Only update scale if it changed
				if(this._textLabel.scale.x !== combinedScaleX || this._textLabel.scale.y !== combinedScaleY)
				{
					this._textLabel.scale.set(combinedScaleX, combinedScaleY);
				}
			}

			this.artboard.draw(this.Renderer);
			this.Renderer.restore();
		}
	}

	public SetText(text: string): void
	{
		this.defObj.text = text;
		this.drawTextLabel();
	}

	private _textLabel: PIXI.Text | null = null;
	private drawTextLabel()
	{
		if(this._textLabel)
		{
			this._textLabel.destroy();
			this._textLabel = null;
		}

		if(this.defObj.text && this.defObj.text.length > 0)
		{
			const style = new PIXI.TextStyle({
				fontFamily: "Verdana",
				fontSize: 32,
				fill: "#ffcc00",
				stroke: "#000000",
				dropShadow: true,
				align: "center",
				fontWeight: "bold",
			});
			this._textLabel = new PIXI.Text({text:this.defObj.text, style:style});
			this._textLabel.interactive = false;
			this._textLabel.eventMode = 'none';

			const combinedScaleX = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.xScale;
			const combinedScaleY = (this._resolutionScale !== -1 ? this._resolutionScale : 1) * this.yScale;

			this._textLabel.scale.set(combinedScaleX, combinedScaleY);
			this._textLabel.x = this._objBoundsReuse.minX;
			this._textLabel.y = this._objBoundsReuse.maxY - (this._textLabel.height * combinedScaleY) - 5;

			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._textLabel);
		}
	}

	private _interactiveGraphics: PIXI.Graphics | null = null;
	private initInteractive()
	{
		//console.log("   INIT INTERACTIVE RIVE OBJECT -- "+this._label);
		this._interactiveGraphics = new PIXI.Graphics();
		PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._interactiveGraphics);

		this._interactiveGraphics.rect(0, 0, this.width, this.height);
		this._interactiveGraphics.fill({color:0x650a5a, alpha:0});
		this._interactiveGraphics.stroke({ width: 1, color: 0xfeeb77, alpha: 0 });

		this._interactiveGraphics.x = this.x;
		this._interactiveGraphics.y = this.y;

		this._interactiveGraphics.eventMode = "static";
		this.CurrentCursor = RIVE_CURSOR_TYPES.POINTER;

		this._interactiveGraphics.on("pointerdown", this.onClick, this);
		this._interactiveGraphics.on("pointerover", this.onHover, this);
		this._interactiveGraphics.on("pointerout", this.onHoverOut, this);
	}

	private _currentRiveCursor:RIVE_CURSOR_TYPES = RIVE_CURSOR_TYPES.DEFAULT;
	public get CurrentCursor():RIVE_CURSOR_TYPES
	{
		return this._currentRiveCursor;
	}

	public set CurrentCursor(cursor: RIVE_CURSOR_TYPES)
	{
		if(this._interactiveGraphics)
		{
			if(this._currentRiveCursor === cursor) return;
			this._currentRiveCursor = cursor;

			this._interactiveGraphics.cursor = cursor.toString();
		}
	}

	protected _onClickCallback?:(event: MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj:CanvasRiveObj) => void;
	protected _onHoverCallback?:(sourceObj:CanvasRiveObj) => void;
	protected _onHoverOutCallback?:(sourceObj:CanvasRiveObj) => void;

	public SetEventHandlers({
		onClick,
		onHover,
		onHoverOut,
	}: {
		onClick?:(e:MouseEvent | PointerEvent | PIXI.PixiTouch, sourceObj:CanvasRiveObj) => void;
		onHover?:(sourceObj:CanvasRiveObj) => void;
		onHoverOut?:(sourceObj:CanvasRiveObj) => void;
	}) {
		this._onClickCallback = onClick;
		this._onHoverCallback = onHover;
		this._onHoverOutCallback = onHoverOut;
	}

	protected onClick(event:MouseEvent | PointerEvent | PIXI.PixiTouch)
	{
		if(this._onClickCallback)
		{
			this._onClickCallback?.(event,this);
		}

		if(this._defObj!.clickFunction)
		{
			this._defObj!.clickFunction(this);
		}
	}

	protected onHover()
	{
		if (this._interactiveGraphics)
		{
			this._interactiveGraphics.tint = 0x00ff00;
		}
		if(this._onHoverCallback) this._onHoverCallback?.(this);
	}

	protected onHoverOut()
	{
		if (this._interactiveGraphics)
		{
			this._interactiveGraphics.tint = 0xffffff;
		}
		if(this._onHoverOutCallback) this._onHoverOutCallback?.(this);
	}

	public Dispose(): void
	{
		this._disposed = true;

		const debug = false;
		if(debug)
		{
			console.log('');
			console.log('Canvas rive obj dispose');
		}
		// Clean up Rive resources properly
		if(this._animations)
		{
			if(debug) console.log('dispose animations : '+this._animations.length);
			this._animations.forEach((animationMeta) => {
				try
				{
					if(debug) console.log('dispose animation : '+animationMeta.name+',  isTimelineControlled:'+animationMeta.isTimelineControlled);
					if(animationMeta.isTimelineControlled)
					{
						if(debug) console.log('OMG timeline controlled meta shit... lets destroy it');
						CanvasEngine.get().DestroyTimelineController(animationMeta);
					}

					animationMeta.animation.delete();
				}
				catch(e)
				{
					console.warn("Failed to delete animation:", e);
				}
			});
			this._animations = [];
		}
		else
		{
			if(debug) console.log('dispose NO animation... THERE IS NO ANIMATION ');
		}

		if(this._vmEnumQueue)
		{
			this._vmEnumQueue = [];
		}

		if(this._stateMachine)
		{
			try
			{
				this._stateMachine.delete();
			}
			catch(e)
			{
				console.warn("Failed to delete state machine:", e);
			}
			this._stateMachine = null;
		}

		// Properly null out references instead of forcing undefined
		this._renderer = null as any;
		this._artboard = null as any;
		this._riveInstance = null as any;

		// Clean up interactive graphics with proper event removal
		if(this._interactiveGraphics)
		{
			// Remove specific event listeners
			this._interactiveGraphics.off("pointerdown", this.onClick, this);
			this._interactiveGraphics.off("pointerover", this.onHover, this);
			this._interactiveGraphics.off("pointerout", this.onHoverOut, this);

			// Remove all listeners just in case
			this._interactiveGraphics.removeAllListeners();

			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._interactiveGraphics);
			this._interactiveGraphics.destroy();
			this._interactiveGraphics = null;
		}

		// Clean up text label
		if(this._textLabel)
		{
			this._textLabel.removeAllListeners();
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textLabel);
			this._textLabel.destroy();
			this._textLabel = null;
		}

		// Clear callback references to prevent circular references
		this._onClickCallback = undefined;
		this._onHoverCallback = undefined;
		this._onHoverOutCallback = undefined;

		// Clear event callbacks
		this._eventCallbacks.clear();

		if(debug) console.log('canvasriveobj dispose complete call super.......... ');
		super.Dispose();
	}

	protected get Rive(): Awaited<ReturnType<typeof RiveCanvas>>
	{
		return this._riveInstance!;
	}

	protected get Renderer(): Renderer
	{
		return this._renderer;
	}

	public get artboard(): Artboard
	{
		return this._artboard;
	}
}
