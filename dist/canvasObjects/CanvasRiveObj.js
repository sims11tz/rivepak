import { RiveController } from "../controllers/RiveController";
import { CanvasObj } from "./CanvasObj";
import * as PIXI from "pixi.js";
import { PixiController } from "../controllers/PixiController";
export class CanvasRiveObj extends CanvasObj {
    constructor(riveDef, artboard) {
        super(riveDef);
        this._stateMachine = null;
        this._inputs = new Map();
        this._lastMousePos = { x: -1, y: -1 };
        this._lastMouseDown = false;
        this._entityObj = null;
        this._interactiveGraphics = null;
        this._renderer = RiveController.get().Renderer;
        this._riveInstance = RiveController.get().Rive;
        this._artboard = artboard;
        this._animations = [];
    }
    initRiveObject() {
        var _a, _b, _c, _d, _e, _f;
        this.x = (_a = this.defObj.x) !== null && _a !== void 0 ? _a : Math.random() * RiveController.get().Canvas.width;
        this.y = (_b = this.defObj.y) !== null && _b !== void 0 ? _b : Math.random() * RiveController.get().Canvas.height;
        this.width = (_c = this.defObj.width) !== null && _c !== void 0 ? _c : this.artboard.width;
        this.height = (_d = this.defObj.height) !== null && _d !== void 0 ? _d : this.artboard.height;
        this.xScale = (_e = this.defObj.xScale) !== null && _e !== void 0 ? _e : 0;
        if (this.xScale > 0)
            this.width = this.width * this.xScale;
        this.yScale = (_f = this.defObj.yScale) !== null && _f !== void 0 ? _f : 0;
        if (this.yScale > 0)
            this.height = this.height * this.yScale;
        if (this.defObj.interactive)
            this.initInteractive();
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
        for (let j = 0; j < this.artboard.animationCount(); j++) {
            const animation = new this.Rive.LinearAnimationInstance(this.artboard.animationByIndex(j), this.artboard);
            //console.log("Animation["+j+"]: ",animation);
            this._animations.push(animation);
        }
        //console.log("Animations Loaded : "+this._animations.length);
        this._stateMachine = this.artboard.stateMachineCount() > 0 ? new this.Rive.StateMachineInstance(this.artboard.stateMachineByIndex(0), this.artboard) : null;
        this._inputs = new Map();
        if (this._stateMachine) {
            //console.log("Has State Machine<"+this._stateMachine.inputCount()+">: ", this._stateMachine);
            for (let j = 0; j < this._stateMachine.inputCount(); j++) {
                const input = this._stateMachine.input(j);
                this._inputs.set(input.name, input);
                //console.log("Input["+j+"]: "+input.name+" -- "+input.type+" -- "+input.value);
            }
        }
        else {
            //console.log("No State Machine found");
        }
        this._entityObj = { x: this.x, y: this.y, width: this.width, height: this.height, xScale: this.xScale, yScale: this.yScale, riveInteractiveLocalOnly: this.defObj.riveInteractiveLocalOnly };
        //console.log("Inputs Loaded : "+this._inputs.size);
    }
    InputByName(name) {
        if (this._inputs.has(name)) {
            return this._inputs.get(name);
        }
        else {
            console.warn("Input not found: " + name);
            return null;
        }
    }
    RandomInputByName(searchTerm) {
        const matchingInputs = [];
        this._inputs.forEach((input) => {
            if (input.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                matchingInputs.push(input);
            }
        });
        if (matchingInputs.length === 0) {
            console.warn(`No matching inputs found for: ${searchTerm}`);
            return null;
        }
        const randomIndex = Math.floor(Math.random() * matchingInputs.length);
        return matchingInputs[randomIndex];
    }
    update(time, frameCount, onceSecond) {
        if (this.enabled === false)
            return;
        this._animations.forEach((animation) => {
            animation.advance(time);
            animation.apply(1);
        });
        if (this._stateMachine) {
            this._stateMachine.advance(time);
            for (let i = 0; i < this._stateMachine.reportedEventCount(); i++) {
                const event = this._stateMachine.reportedEventAt(i);
                if (event != undefined) {
                    console.log('RIVE EVENT<' + i + '>: ', event);
                }
            }
            for (let x = 0; x < this._stateMachine.stateChangedCount(); x++) {
                const stateChange = this._stateMachine.stateChangedNameByIndex(x);
                if (stateChange != undefined) {
                    //console.log('RIVE STATE CHANGE<'+x+'>: ', stateChange);
                }
            }
            if (this.defObj.riveInteractive) {
                this._entityObj.x = this.x;
                this._entityObj.y = this.y;
                const artboardMoveSpace = RiveController.get().CanvasToArtboard(this._entityObj);
                const mouseDown = RiveController.get().MouseDown;
                const mousePosChanged = (this._lastMousePos.x !== artboardMoveSpace.x || this._lastMousePos.y !== artboardMoveSpace.y);
                const mouseDownChanged = (this._lastMouseDown !== mouseDown);
                if (mouseDownChanged) {
                    const artBoardInteractionSpace = RiveController.get().CanvasToArtboard(this._entityObj, true);
                    if (mouseDown) {
                        this._stateMachine.pointerDown(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
                    }
                    else {
                        this._stateMachine.pointerUp(artBoardInteractionSpace.x, artBoardInteractionSpace.y);
                    }
                }
                if (mousePosChanged) {
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
        this.Renderer.align(this.Rive.Fit.contain, this.Rive.Alignment.topLeft, {
            minX: this.x - (this.width / 2),
            minY: this.y - (this.height / 2),
            maxX: this.x + (this.width / 2),
            maxY: this.y + (this.height / 2),
        }, this.artboard.bounds);
        if (this._interactiveGraphics) {
            this._interactiveGraphics.x = this.x;
            this._interactiveGraphics.y = this.y;
        }
        this.artboard.draw(this.Renderer);
        this.Renderer.restore();
    }
    initInteractive() {
        this._interactiveGraphics = new PIXI.Graphics();
        PixiController.get().Pixi.stage.addChild(this._interactiveGraphics);
        this._interactiveGraphics.rect(-(this.width / 2), -(this.height / 2), this.width, this.height);
        this._interactiveGraphics.fill({ color: 0x650a5a, alpha: 0 });
        this._interactiveGraphics.stroke({ width: 0, color: 0xfeeb77 });
        this._interactiveGraphics.x = this.x;
        this._interactiveGraphics.y = this.y;
        this._interactiveGraphics.eventMode = "static";
        this._interactiveGraphics.cursor = "pointer";
        this._interactiveGraphics.on("pointerdown", this.onClick, this);
        this._interactiveGraphics.on("pointerover", this.onHover, this);
        this._interactiveGraphics.on("pointerout", this.onHoverOut, this);
    }
    onClick(event) {
    }
    onHover() {
        if (this._interactiveGraphics) {
            this._interactiveGraphics.tint = 0x00ff00;
        }
    }
    onHoverOut() {
        if (this._interactiveGraphics) {
            this._interactiveGraphics.tint = 0xffffff;
        }
    }
    dispose() {
        var _a;
        super.dispose();
        this._animations.forEach((animation) => animation.delete());
        (_a = this._stateMachine) === null || _a === void 0 ? void 0 : _a.delete();
        this._animations = [];
        this._stateMachine = null;
        this._renderer = undefined;
        this._artboard = undefined;
        this._defObj = undefined;
        if (this._interactiveGraphics) {
            this._interactiveGraphics.off("pointerdown", this.onClick, this);
            this._interactiveGraphics.off("pointerover", this.onHover, this);
            this._interactiveGraphics.off("pointerout", this.onHoverOut, this);
            PixiController.get().Pixi.stage.removeChild(this._interactiveGraphics);
            this._interactiveGraphics.destroy();
            this._interactiveGraphics = null;
        }
    }
    get Rive() {
        return this._riveInstance;
    }
    get Renderer() {
        return this._renderer;
    }
    get artboard() {
        return this._artboard;
    }
}
