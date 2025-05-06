import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance } from "@rive-app/canvas-advanced";
import RiveController, { RiveObjectDef } from "../controllers/RiveController";
import CanvasObj, { CanvasObjectEntity } from "./CanvasObj";
import * as PIXI from "pixi.js";
import PixiController from "../controllers/PixiController";

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

export default class CanvasRiveObj extends CanvasObj
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

	public update(time: number, frameCount: number, onceSecond: boolean): void
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
				const artboardMoveSpace = RiveController.get().CanvasToArtboard(this._entityObj!);

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

		this.artboard.advance(time);

		this.Renderer.save();
		this.Renderer.align(
			this.Rive.Fit.contain,
			this.Rive.Alignment.topLeft,
			{
				minX: this.x - (this.width/2),
				minY: this.y - (this.height/2),
				maxX: this.x + ( this.width/2),
				maxY: this.y + (this.height/2),
			},
			this.artboard.bounds
		);

		if(this._interactiveGraphics)
		{
			this._interactiveGraphics.x = this.x;
			this._interactiveGraphics.y = this.y;
		}

		this.artboard.draw(this.Renderer);
		this.Renderer.restore();
	}

	private _interactiveGraphics: PIXI.Graphics | null = null;
	private initInteractive()
	{
		this._interactiveGraphics = new PIXI.Graphics();
		PixiController.get().Pixi.stage.addChild(this._interactiveGraphics);

		this._interactiveGraphics.rect(-(this.width/2), -(this.height/2), this.width, this.height);
		this._interactiveGraphics.fill({color:0x650a5a, alpha:0});
		this._interactiveGraphics.stroke({ width: 0, color: 0xfeeb77 });

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

	public dispose(): void
	{
		console.log("CanvasRiveObj dispose() called");
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
