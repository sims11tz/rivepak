import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance } from "@rive-app/canvas-advanced";
import { RiveController, RiveObjectDef } from "../controllers/RiveController";
import { CanvasObj, CanvasObjectEntity } from "./CanvasObj";
import * as PIXI from "pixi.js";
import { PixiController } from "../controllers/PixiController";
import { CanvasEngine } from "../useCanvasEngine";

export type RiveInstance = Awaited<ReturnType<typeof RiveCanvas>>;

export interface RiveArtboardBundle
{
	id: number;
	entityObj: EntityObj;
	artboard: Artboard;
	animations: LinearAnimationInstance[];
	stateMachine: StateMachineInstance | null;
	inputs: Map<string, SMIInput>;
}

export interface EntityObj
{
	width: number;
	height: number;
	body: Matter.Body | null;
}

export class CanvasRiveObj extends CanvasObj
{
	private _artboard: Artboard;
	protected _renderer:Renderer;
	protected _riveInstance: Awaited<ReturnType<typeof RiveCanvas>>;

	protected  _animations:LinearAnimationInstance[];
	protected _stateMachine:StateMachineInstance | null = null;
	protected _inputs = new Map<string, SMIInput>();

	constructor(riveDef: RiveObjectDef, artboard: Artboard)
	{
		super(riveDef);

		this._renderer = RiveController.get().Renderer!;
		this._riveInstance = RiveController.get().Rive!;
		this._artboard = artboard;

		this._animations = [];
	}

	private _lastMousePos = { x: -1, y: -1 };
	private _lastMouseDown = false;

	private _entityObj:CanvasObjectEntity | null = null;

	protected initRiveObject():void
	{
		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

		this.width = this.defObj.width ?? this.artboard.width;
		this.height = this.defObj.height ?? this.artboard.height;

		this.xScale = this.defObj.xScale ?? 0;
		if(this.xScale > 0) this.width = this.width * this.xScale;

		this.yScale = this.defObj.yScale ?? 0;
		if(this.yScale > 0) this.height = this.height * this.yScale;

		//console.log("");
		//console.log(" UPDATE BASE PROPS >>> "+this._label+" --- "+this.width+"x"+this.height+" --- "+this.xScale+"x"+this.yScale);
		//console.log(" UPDATE BASE PROPS >>> "+this._label+" --- "+this.x+"|"+this.y);
		this.UpdateBaseProps();

		if(this.defObj.interactive) this.initInteractive();

		//console.log("");
		//console.log("___________________ INIT RIVE OBJECT ________________________");
		//console.log("");
		//console.log("Artboard Name: "+this.artboard.name);
		//console.log("Artboard Width: "+this.artboard.width);
		//console.log("Artboard Height: "+this.artboard.height);
		//console.log("Artboard Bounds: ", this.artboard.bounds);
		//console.log("Artboard State Machine Count: "+this.artboard.stateMachineCount());
		//console.log("Artboard Animation Count: "+this.artboard.animationCount());

		this._animations = [];
		for (let j = 0; j < this.artboard.animationCount(); j++)
		{
			const animation = new this.Rive.LinearAnimationInstance( this.artboard.animationByIndex(j), this.artboard );
			//console.log("Animation["+j+"]: ",animation);
			this._animations.push(animation);
		}
		//console.log("Animations Loaded : "+this._animations.length);

		this._stateMachine = this.artboard.stateMachineCount() > 0 ? new this.Rive.StateMachineInstance(this.artboard.stateMachineByIndex(0),this.artboard): null;

		this._inputs = new Map<string, SMIInput>();
		if (this._stateMachine)
		{
			//console.log("Has State Machine<"+this._stateMachine.inputCount()+">: ", this._stateMachine);
			for (let j = 0; j < this._stateMachine.inputCount(); j++)
			{
				const input = this._stateMachine.input(j);
				this._inputs.set(input.name, input);
				//console.log("Input["+j+"]: "+input.name+" -- "+input.type+" -- "+input.value);
			}
		}
		else
		{
			//console.log("No State Machine found");
		}

		this._entityObj = { x: this.x, y: this.y, width: this.width, height: this.height, xScale:this.xScale, yScale:this.yScale, riveInteractiveLocalOnly:this.defObj.riveInteractiveLocalOnly};
		//console.log("Inputs Loaded : "+this._inputs.size);
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

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if(this.enabled === false) return;

		this._animations.forEach((animation) =>
		{
			animation.advance(time);
			animation.apply(1);
		});

		if(this._stateMachine)
		{
			this._stateMachine.advance(time);
			for(let i = 0; i < this._stateMachine.reportedEventCount(); i++)
			{
				const event = this._stateMachine.reportedEventAt(i);
				if (event != undefined)
				{
					console.log('RIVE EVENT<'+i+'>: ', event);
				}
			}

			for(let x = 0; x < this._stateMachine.stateChangedCount(); x++)
			{
				const stateChange = this._stateMachine.stateChangedNameByIndex(x);
				if (stateChange != undefined)
				{
					//console.log('RIVE STATE CHANGE<'+x+'>: ', stateChange);
				}
			}

			if(this.defObj.riveInteractive)
			{
				this._entityObj!.x = this.x;
				this._entityObj!.y = this.y;
				//const artboardMoveSpace = RiveController.get().CanvasToArtboard(this._entityObj!);
				const artboardMoveSpace = RiveController.get().WindowToArtboard(this._entityObj!);

				const mouseDown = RiveController.get().MouseDown;
				const mousePosChanged = ( this._lastMousePos.x !== artboardMoveSpace.x || this._lastMousePos.y !== artboardMoveSpace.y);
				const mouseDownChanged = ( this._lastMouseDown !== mouseDown );

				if (mouseDownChanged)
				{
					const artBoardInteractionSpace = RiveController.get().CanvasToArtboard(this._entityObj!,true);
					if (mouseDown)
					{
						this._stateMachine.pointerDown(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
					}
					else
					{
						this._stateMachine.pointerUp(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
					}
				}

				if (mousePosChanged)
				{
					//console.log('----mousePosChanged() '+artboardMoveSpace.x+'--'+artboardMoveSpace.y);
					this._stateMachine.pointerMove(artboardMoveSpace.x, artboardMoveSpace.y);
				}

				this._lastMousePos.x = artboardMoveSpace.x;
				this._lastMousePos.y = artboardMoveSpace.y;
				this._lastMouseDown = mouseDown;
			}
		}

		const debug = false;

		if(debug)
		{
		if(frameCount == 5 || frameCount == 10)
		{
			console.log("");
			console.log("<"+frameCount+">__ "+this._label+" "+CanvasEngine.get().CurrentCanvasScale);
			console.log("<"+frameCount+"> ox="+this.x+"   oy="+this.y+"   ow="+this.width+"   oh="+this.height);
			console.log("<"+frameCount+"> bx="+this.baseX+"   by="+this.baseY+"   bw="+this.baseWidth+"   bh="+this.baseHeight);
			console.log("<"+frameCount+"> oxS="+this.xScale+"   oyS="+this.yScale+"");
			console.log("<"+frameCount+"> bxS="+this.baseXScale+"   byS="+this.baseYScale+"");
		}
		}

		this.artboard.advance(time);

		let objBounds;
		if(CanvasEngine.get().EngineSettings?.autoScale)
		{
			let transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
			let transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
			let transformedWidth = this.width * CanvasEngine.get().CurrentCanvasScale;
			let transformedHeight = this.height * CanvasEngine.get().CurrentCanvasScale;

			if(debug)
			{
			if(frameCount == 5 || frameCount == 10)
			{
				//console.log("<"+frameCount+">__ "+this._label+" "+CanvasEngine.get().CurrentCanvasScale);
				console.log("<"+frameCount+">________________________________");
				console.log("<"+frameCount+"> tx="+transformedX+"   ty="+transformedY+"");
				console.log("<"+frameCount+"> tw="+transformedWidth+"   th="+transformedHeight+"");
			}
			}

			objBounds =
			{
				minX: transformedX,
				minY: transformedY,
				maxX: transformedX + transformedWidth,
				maxY: transformedY + transformedHeight,
			}
		}
		else
		{
			if(debug)
			{
			if(frameCount == 5 || frameCount == 10)
			{
				//console.log("<"+frameCount+">__ "+this._label+" "+CanvasEngine.get().CurrentCanvasScale);
				console.log("<"+frameCount+">________________________________");
				console.log("<"+frameCount+"> tx="+this.x+"   ty="+this.y+"");
				console.log("<"+frameCount+"> tw="+(this.x + ( this.width))+"   th="+(this.y + this.height)+"");
			}
			}

			objBounds = {
				minX: this.x,
				minY: this.y,
				maxX: this.x + ( this.width),
				maxY: this.y + (this.height),
			}
		}

		this.Renderer.save();
		this.Renderer.align(
			this.Rive.Fit.contain,
			this.Rive.Alignment.topLeft,
			objBounds,
			this.artboard.bounds
		);

		if(this._interactiveGraphics)
		{
			this._interactiveGraphics.x = objBounds.minX;
			this._interactiveGraphics.y = objBounds.minY;

			this._interactiveGraphics.width = objBounds.maxX - objBounds.minX;
			this._interactiveGraphics.height = objBounds.maxY - objBounds.minY;
			//this._interactiveGraphics.rect(0, 0, this._interactiveGraphics.width, this._interactiveGraphics.height);

			//if(frameCount == 5 || frameCount == 10)
			//{
			//	//console.log("<"+frameCount+">__ "+this._label+" "+CanvasEngine.get().CurrentCanvasScale);
			//	console.log("<"+frameCount+">________________________________");
			//	console.log("<"+frameCount+"> tx="+this.x+"   ty="+this.y+"");
			//}
		}

		this.artboard.draw(this.Renderer);
		this.Renderer.restore();
	}

	private _interactiveGraphics: PIXI.Graphics | null = null;
	private initInteractive()
	{
		//console.log("   INIT INTERACTIVE RIVE OBJECT -- "+this._label);

		this._interactiveGraphics = new PIXI.Graphics();
		PixiController.get().Pixi.stage.addChild(this._interactiveGraphics);

		this._interactiveGraphics.rect(0, 0, this.width, this.height);
		this._interactiveGraphics.fill({color:0x650a5a, alpha:0.75});
		this._interactiveGraphics.stroke({ width: 0, color: 0xfeeb77 });

		console.log("interactive --- this.x:"+this.x+" : this.y:"+this.y);
		this._interactiveGraphics.x = this.x;
		this._interactiveGraphics.y = this.y;

		this._interactiveGraphics.eventMode = "static";
		this._interactiveGraphics.cursor = "pointer";

		this._interactiveGraphics.on("pointerdown", this.onClick, this);
		this._interactiveGraphics.on("pointerover", this.onHover, this);
		this._interactiveGraphics.on("pointerout", this.onHoverOut, this);
	}

	protected onClick(event: MouseEvent | PointerEvent | PIXI.PixiTouch)
	{

	}

	protected onHover()
	{
		if (this._interactiveGraphics)
		{
			this._interactiveGraphics.tint = 0x00ff00;
		}
	}

	protected onHoverOut()
	{
		if (this._interactiveGraphics)
		{
			this._interactiveGraphics.tint = 0xffffff;
		}
	}

	public Dispose(): void
	{
		super.Dispose();

		this._animations.forEach((animation) => animation.delete());
		this._stateMachine?.delete();
		this._animations = [];
		this._stateMachine = null;

		this._renderer = undefined as unknown as Renderer;
		this._artboard = undefined as unknown as Artboard;
		this._defObj = undefined as unknown as RiveObjectDef;

		if(this._interactiveGraphics)
		{
			this._interactiveGraphics.off("pointerdown", this.onClick, this);
			this._interactiveGraphics.off("pointerover", this.onHover, this);
			this._interactiveGraphics.off("pointerout", this.onHoverOut, this);

			PixiController.get().Pixi.stage.removeChild(this._interactiveGraphics);
			this._interactiveGraphics.destroy();
			this._interactiveGraphics = null;
		}
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
