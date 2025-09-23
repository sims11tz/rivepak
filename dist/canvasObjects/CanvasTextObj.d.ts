import * as PIXI from "pixi.js";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./_baseCanvasObj";
export declare class CanvasTextObject extends CanvasPixiShapeObj {
    private _textField;
    private _typewriterIndex;
    private _typewriterTimer;
    private _fullText;
    private _fadeStartTime;
    private _pulseTime;
    private _alignmentOffsetX;
    private _alignmentOffsetY;
    constructor(canvasDef: CanvasObjectDef);
    get z(): number;
    set z(value: number);
    InitPixiObject(): void;
    /**
     * Migrates old PIXI v7 stroke format to v8 format
     */
    private migrateStrokeStyle;
    private createTextStyle;
    private calculateAlignmentOffsets;
    get visible(): boolean;
    set visible(value: boolean);
    DrawVectors(): void;
    private updateTextTransform;
    private getCurrentDisplayText;
    private _styleDirty;
    private hasStyleChanged;
    set Text(value: string);
    get Text(): string;
    SetText(text: string): void;
    SetTextStyle(style: Partial<PIXI.TextStyleOptions>): void;
    SetAlignment(horizontal?: 'left' | 'center' | 'right' | 'justify', vertical?: 'top' | 'middle' | 'bottom'): void;
    StartTypewriter(speed?: number): void;
    StopTypewriter(): void;
    private onTextClick;
    private onTextHover;
    private onTextHoverOut;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
