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
    /**
     * Gets the measured width of the text field after content and style are applied
     * @returns The actual rendered width of the text, or 0 if no text field exists
     */
    GetMeasuredTextWidth(): number;
    /**
     * Gets the measured height of the text field after content and style are applied
     * @returns The actual rendered height of the text, or 0 if no text field exists
     */
    GetMeasuredTextHeight(): number;
    /**
     * Gets both measured dimensions of the text field
     * @returns Object with width and height, or {width: 0, height: 0} if no text field
     */
    GetMeasuredTextDimensions(): {
        width: number;
        height: number;
    };
    /**
     * Gets the full bounds of the text field including any padding/stroke
     * @returns Bounds object with x, y, width, height or null if no text field
     */
    GetTextBounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    private onTextClick;
    private onTextHover;
    private onTextHoverOut;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
