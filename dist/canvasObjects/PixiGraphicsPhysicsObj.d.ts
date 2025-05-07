/// <reference types="matter-js" />
import { CanvasObjectDef } from "./CanvasObj";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
declare const BaseShapePhysicsObj_base: {
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
        _defObj: CanvasObjectDef | null;
        readonly defObj: CanvasObjectDef;
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
} & typeof CanvasPixiShapeObj;
declare class BaseShapePhysicsObj extends BaseShapePhysicsObj_base {
}
export declare class PixiShapePhysicsObj extends BaseShapePhysicsObj {
    constructor(canvasDef: CanvasObjectDef);
    update(time: number, frameCount: number, onceSecond: boolean): void;
    dispose(): void;
}
export {};
