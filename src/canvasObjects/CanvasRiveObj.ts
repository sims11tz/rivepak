import RiveCanvas, { Artboard, LinearAnimationInstance, Renderer, SMIInput, StateMachineInstance } from "@rive-app/canvas-advanced";
import { RiveController, RiveObjectDef } from "../controllers/RiveController";
import { CanvasObj, CanvasObjectEntity } from "./CanvasObj";
import * as PIXI from "pixi.js";
import { PixiController } from "../controllers/PixiController";
import { CanvasEngine } from "../useCanvasEngine";

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

export class CanvasRiveObj extends CanvasObj
{
	private _artboard:Artboard;
	protected _renderer:Renderer;
	protected _riveInstance: Awaited<ReturnType<typeof RiveCanvas>>;

	protected  _animations:LinearAnimationInstance[];
	protected _stateMachine:StateMachineInstance | null = null;
	protected _inputs = new Map<string, SMIInput>();

	private _objBoundsReuse = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

	private _riveObjDef:RiveObjectDef;
	public get riveObjDef():RiveObjectDef { return this._riveObjDef; }

	private _artboardName: string = "";
	public get artboardName(): string { return this._artboardName; }

	private _filePath: string = "";
	public get filePath(): string { return this._filePath; }

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

	protected initRiveObject():void
	{
		//console.log('%c 22222 initRiveObj(*) width:'+this.artboard.width+', height:'+this.artboard.height,'color:#00FF88; font-weight:bold;');

		this.x = this.defObj.x ?? Math.random() * RiveController.get().Canvas.width;
		this.y = this.defObj.y ?? Math.random() * RiveController.get().Canvas.height;

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

		//console.log("<"+this._label+"> CanvasRiveObj ---   position :: "+this.x+" - "+this.y+" ");
		//console.log("<"+this._label+"> CanvasRiveObj --- dimensions :: "+this.width+"x"+this.height+" --- scale::"+this.xScale+"x"+this.yScale);
		//console.log("<"+this._label+"> CanvasRiveObj ---   artboard :: "+this.artboard.width+"x"+this.artboard.height);

		//console.log("");
		//console.log(" UPDATE BASE PROPS >>> "+this._label+" --- "+this.width+"x"+this.height+" --- "+this.xScale+"x"+this.yScale);
		//console.log(" UPDATE BASE PROPS >>> "+this._label+" --- "+this.x+"|"+this.y);
		this.UpdateBaseProps();

		if(this.defObj.interactive) this.initInteractive();

		if(this.defObj.text && this.defObj.text.length > 0) this.drawTextLabel();

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
	}

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
				this.updateEntityObj();

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
					//console.log("Rive Interaction<"+this._label+">: MOVE ", artboardMoveSpace.x, artboardMoveSpace.y);
					this._stateMachine.pointerMove(artboardMoveSpace.x, artboardMoveSpace.y);
				}

				this._lastMousePos.x = artboardMoveSpace.x;
				this._lastMousePos.y = artboardMoveSpace.y;
				this._lastMouseDown = mouseDown;
			}
		}

		this.artboard.advance(time);

		const scaledWidth = this.artboard.width * this.xScale;
		const scaledHeight = this.artboard.height * this.yScale;

		if(this._resolutionScale !== -1)
		{
			this._objBoundsReuse.minX = this._transformedX;
			this._objBoundsReuse.minY = this._transformedY;
			this._objBoundsReuse.maxX = this._transformedX + (scaledWidth * this._resolutionScale);
			this._objBoundsReuse.maxY = this._transformedY + (scaledHeight * this._resolutionScale);
		}
		else
		{
			this._objBoundsReuse.minX = this.x;
			this._objBoundsReuse.minY = this.y;
			this._objBoundsReuse.maxX = this.x + scaledWidth;
			this._objBoundsReuse.maxY = this.y + scaledHeight;
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
			this._interactiveGraphics.x = this._objBoundsReuse.minX;
			this._interactiveGraphics.y = this._objBoundsReuse.minY;

			this._interactiveGraphics.width = this._objBoundsReuse.maxX - this._objBoundsReuse.minX;
			this._interactiveGraphics.height = this._objBoundsReuse.maxY - this._objBoundsReuse.minY;
		}

		if(this._textLabel)
		{
			this._textLabel.x = this._objBoundsReuse.minX;
			this._textLabel.y = this._objBoundsReuse.maxY - this._textLabel.height - 5;

			if(this._textLabel.scale.x !== this._resolutionScale)
			{
				this._textLabel.scale.set(this._resolutionScale);
			}
		}

		this.artboard.draw(this.Renderer);
		this.Renderer.restore();
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

			this._textLabel.x = this._objBoundsReuse.minX;
			this._textLabel.y = this._objBoundsReuse.maxY - this._textLabel.height - 5;

			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._textLabel);
		}
	}

	private _interactiveGraphics: PIXI.Graphics | null = null;
	private initInteractive()
	{
		//console.log("   INIT INTERACTIVE RIVE OBJECT -- "+this._label);
		this._interactiveGraphics = new PIXI.Graphics();
		PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._interactiveGraphics);

		//this._interactiveGraphics.rect(0, 0, this.width, this.height);
		//this._interactiveGraphics.fill({color:0x650a5a, alpha:0.05});
		//this._interactiveGraphics.stroke({ width: 1, color: 0xfeeb77, alpha: 0.5 });

		this._interactiveGraphics.x = this.x;
		this._interactiveGraphics.y = this.y;

		this._interactiveGraphics.eventMode = "static";
		this._interactiveGraphics.cursor = "pointer";

		this._interactiveGraphics.on("pointerdown", this.onClick, this);
		this._interactiveGraphics.on("pointerover", this.onHover, this);
		this._interactiveGraphics.on("pointerout", this.onHoverOut, this);
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

	protected onClick(event: MouseEvent | PointerEvent | PIXI.PixiTouch)
	{
		if(this._onClickCallback) this._onClickCallback?.(event,this);
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
		this._animations.forEach((animation) => animation.delete());
		this._stateMachine?.delete();
		this._animations = [];
		this._stateMachine = null;

		this._renderer = undefined as unknown as Renderer;
		this._artboard = undefined as unknown as Artboard;

		if(this._interactiveGraphics)
		{
			this._interactiveGraphics.off("pointerdown", this.onClick, this);
			this._interactiveGraphics.off("pointerover", this.onHover, this);
			this._interactiveGraphics.off("pointerout", this.onHoverOut, this);

			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._interactiveGraphics);
			this._interactiveGraphics.destroy();
			this._interactiveGraphics = null;
		}

		if(this._textLabel)
		{
			PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._textLabel);
			this._textLabel.destroy();
			this._textLabel = null;
		}

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
