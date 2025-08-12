import * as PIXI from "pixi.js";
import { CanvasPixiShapeObj } from "./CanvasPixiShapeObj";
import { CanvasObjectDef } from "./CanvasObj";
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
    InitPixiObject(): void;
    private createTextStyle;
    private calculateAlignmentOffsets;
    DrawVectors(): void;
    /**
     * Updates text position and scale based on current settings
     */
    private updateTextTransform;
    /**
     * Gets the current text to display (considering animations)
     */
    private getCurrentDisplayText;
    /**
     * Checks if style has changed and needs recreation
     */
    private hasStyleChanged;
    /**
     * Sets the text content
     */
    SetText(text: string): void;
    /**
     * Updates the text style dynamically
     */
    SetTextStyle(style: Partial<PIXI.TextStyleOptions>): void;
    /**
     * Sets text alignment
     */
    SetAlignment(horizontal?: 'left' | 'center' | 'right' | 'justify', vertical?: 'top' | 'middle' | 'bottom'): void;
    /**
     * Animates the text with a typewriter effect
     */
    StartTypewriter(speed?: number): void;
    /**
     * Stops the typewriter effect and shows full text
     */
    StopTypewriter(): void;
    /**
     * Click handler for interactive text
     */
    private onTextClick;
    /**
     * Hover handler for interactive text
     */
    private onTextHover;
    /**
     * Hover out handler for interactive text
     */
    private onTextHoverOut;
    Update(time: number, frameCount: number, onceSecond: boolean): void;
    Dispose(): void;
}
