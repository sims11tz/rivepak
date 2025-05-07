/// <reference types="matter-js" />
import { Artboard } from "@rive-app/webgl-advanced";
import { RiveObjectDef } from "../controllers/RiveController";
import { CanvasRiveObj } from "./CanvasRiveObj";
declare const BaseRivePhysicsObject_base: {
    new (...args: any[]): {
        _body: import("matter-js").Body | null;
        initPhysics(): void;
        updatePhysics(time: number, frameCount: number, onceSecond: boolean): void;
        update(time: number, frameCount: number, onceSecond: boolean): void;
        onCollision(other: import("./CanvasObj").CanvasObj, impactForce: number): void;
        dispose(): void;
        _uuid: string;
        readonly uuid: string;
        _label: string;
        readonly label: string;
        _defObj: import("./CanvasObj").CanvasObjectDef | null;
        readonly defObj: import("./CanvasObj").CanvasObjectDef;
        enabled: boolean;
        _state: {
            x: number;
            y: number;
            z: number;
        };
        group: string;
        width: number;
        height: number;
        xScale: number;
        yScale: number;
        _propertyChangeListeners: Map<"x" | "y" | "z", (oldValue: number, newValue: number) => void>;
        x: number;
        y: number;
        z: number;
        swapDepths(other: import("./CanvasObj").CanvasObj): void;
        bindPropertyChange(property: "x" | "y" | "z", callback: (oldValue: number, newValue: number) => void): void;
        unbindPropertyChange(property: "x" | "y" | "z"): void;
        onZIndexChanged: ((canvasObj: import("./CanvasObj").CanvasObj, oldZIndex: number, newZIndex: number) => void) | null;
        _onZIndexChanged: ((canvasObj: import("./CanvasObj").CanvasObj, oldZIndex: number, newZIndex: number) => void) | null;
    };
} & typeof CanvasRiveObj;
declare class BaseRivePhysicsObject extends BaseRivePhysicsObject_base {
}
export declare class RivePhysicsObject extends BaseRivePhysicsObject {
    constructor(riveDef: RiveObjectDef, artboard: Artboard);
    protected initRiveObject(): void;
    update(time: number, frameCount: number, onceSecond: boolean): void;
}
export {};
