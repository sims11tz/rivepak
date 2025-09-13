import { PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { BaseCanvasObj } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export class CanvasContainerObj extends BaseCanvasObj {
    get visible() { return this._visible; }
    set visible(value) {
        this._visible = value;
        // Could propagate to children if needed
    }
    constructor(canvasDef) {
        super(canvasDef);
        this.children = [];
        // Store original child transforms for relative positioning
        this._childOriginalTransforms = new Map();
        // Container visibility affects children
        this._visible = true;
        this._debugGraphics = null;
        this.InitContainer();
    }
    InitContainer() {
        var _a, _b, _c, _d, _e, _f;
        this.width = (_a = this.defObj.width) !== null && _a !== void 0 ? _a : 100;
        this.height = (_b = this.defObj.height) !== null && _b !== void 0 ? _b : 100;
        this.xScale = (_c = this.defObj.xScale) !== null && _c !== void 0 ? _c : 1;
        this.yScale = (_d = this.defObj.yScale) !== null && _d !== void 0 ? _d : 1;
        this.x = (_e = this.defObj.x) !== null && _e !== void 0 ? _e : Math.random() * RiveController.get().Canvas.width;
        this.y = (_f = this.defObj.y) !== null && _f !== void 0 ? _f : Math.random() * RiveController.get().Canvas.height;
        if (this.centerGlobally) {
            //console.log(`CANVAS CONTAINER... center globally`);
            this.x = CanvasEngine.get().width / 2;
            this.y = CanvasEngine.get().height / 2;
        }
        if (this.centerGlobally || this.centerLocally) {
            //console.log(`CANVAS CONTAINER... center locally`);
            this.x -= (this.width / 2);
            this.y -= (this.height / 2);
        }
        if (this._debug) {
            this._debugGraphics = new PIXI.Graphics();
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._debugGraphics);
            this._debugGraphics.x = this.x;
            this._debugGraphics.y = this.y;
            this._debugGraphics.scale.set(this.xScale, this.yScale);
            this._debugGraphics.eventMode = "static";
            console.log('CANVAS CONTAINER... ' + this._debugGraphics.x + ',' + this._debugGraphics.y + ',' + this._debugGraphics.scale.x + ',' + this._debugGraphics.scale.y);
        }
        this.UpdateBaseProps();
        if (this._debug)
            this.DrawDebug();
    }
    DrawDebug() {
        if (this._debug && this._debugGraphics) {
            this._debugGraphics.clear();
            this._debugGraphics.rect(0, 0, this.width, this.height);
            this._debugGraphics.fill({ color: 0x66CCFF, alpha: 0.45 });
            this._debugGraphics.stroke({ width: 2, color: 0xfeeb77, alpha: 0.35 });
        }
    }
    /**
     * Adds a child object to this container
     */
    AddChild(child) {
        if (this.children.includes(child)) {
            console.warn(`Child ${child.label} already exists in container ${this.label}`);
            return;
        }
        // Remove from previous parent if exists
        if (child.parent) {
            child.parent.RemoveChild(child);
        }
        // Store the child's coordinates as relative to the parent's coordinate space
        // If child is at (0,0), it means (0,0) relative to parent, not world space
        const relativeX = child.x;
        const relativeY = child.y;
        const relativeXScale = child.xScale;
        const relativeYScale = child.yScale;
        // Store original transform relative to container
        this._childOriginalTransforms.set(child.uuid, {
            x: relativeX,
            y: relativeY,
            xScale: relativeXScale,
            yScale: relativeYScale
        });
        // No property change listeners needed - child x,y are always parent-relative
        // The stored values in _childOriginalTransforms will be updated when child.x/y are set directly
        child.SetParent(this);
        this.children.push(child);
        // Update child transform immediately
        this.updateChildTransform(child, true);
        CanvasEngine.get().AddCanvasObjects(child);
    }
    /**
     * Removes a child object from this container
     */
    RemoveChild(child) {
        const index = this.children.indexOf(child);
        if (index === -1)
            return false;
        // Convert world position back to local before removing parent
        // So the object stays in the same visual position
        child.x = child._worldX;
        child.y = child._worldY;
        child.xScale = child._worldXScale;
        child.yScale = child._worldYScale;
        child.SetParent(null);
        this.children.splice(index, 1);
        // Clean up stored transform
        this._childOriginalTransforms.delete(child.uuid);
        return true;
    }
    /**
     * Removes a child by its ID or label
     */
    RemoveChildById(id) {
        const child = this.GetChildById(id);
        if (child) {
            return this.RemoveChild(child);
        }
        return false;
    }
    /**
     * Gets a child by its ID or label
     */
    GetChildById(id) {
        return this.children.find(c => c.id === id || c.label === id) || null;
    }
    GetChildrenByType(type) {
        return this.children.filter(c => c instanceof type);
    }
    /**
     * Removes all children from this container
     */
    ClearChildren() {
        // Create a copy to avoid modification during iteration
        const childrenCopy = [...this.children];
        for (const child of childrenCopy) {
            this.RemoveChild(child);
        }
        this._childOriginalTransforms.clear();
    }
    /**
     * Brings a child to the front (highest z-order)
     */
    BringChildToFront(child) {
        const index = this.children.indexOf(child);
        if (index > -1 && index < this.children.length - 1) {
            this.children.splice(index, 1);
            this.children.push(child);
            this.updateChildrenZOrder();
        }
    }
    /**
     * Sends a child to the back (lowest z-order)
     */
    SendChildToBack(child) {
        const index = this.children.indexOf(child);
        if (index > 0) {
            this.children.splice(index, 1);
            this.children.unshift(child);
            this.updateChildrenZOrder();
        }
    }
    /**
     * Updates z-order of all children based on their position in the array
     */
    updateChildrenZOrder() {
        const baseZ = this.z || 0;
        this.children.forEach((child, index) => {
            child.z = baseZ + index + 1;
        });
    }
    /**
     * Updates a child's transform based on container's transform
     */
    updateChildTransform(child, oncePerSecond = false) {
        // Update the stored relative position to match current child.x/y
        // Child x,y are always treated as parent-relative
        let original = this._childOriginalTransforms.get(child.uuid);
        if (!original) {
            // Create entry if it doesn't exist
            original = {
                x: child.x,
                y: child.y,
                xScale: child.xScale,
                yScale: child.yScale
            };
            this._childOriginalTransforms.set(child.uuid, original);
        }
        else {
            // Update stored relative values with current child values
            original.x = child.x;
            original.y = child.y;
            original.xScale = child.xScale;
            original.yScale = child.yScale;
        }
        // Calculate world coordinates for rendering
        // Use parent's render coordinates (which already account for nested parents)
        child._worldX = this.renderX + (child.x * this.renderXScale);
        child._worldY = this.renderY + (child.y * this.renderYScale);
        child._worldXScale = child.xScale * this.renderXScale;
        child._worldYScale = child.yScale * this.renderYScale;
        //if(oncePerSecond) {
        //	console.log('%c <updateChildTransform> for '+child.label,'color:#00FF88; font-weight:bold;');
        //	console.log('%c <updateChildTransform> CHILD LOCAL -- x:'+child.x+', y:'+child.y+', scaleX:'+child.xScale+', scaleY:'+child.yScale,'color:#00FF88; font-weight:bold;');
        //	console.log('%c <updateChildTransform> PARENT WORLD -- x:'+this.worldX+', y:'+this.worldY+', scaleX:'+this.worldXScale+', scaleY:'+this.worldYScale,'color:#00FF88; font-weight:bold;');
        //	console.log('%c <updateChildTransform> CHILD WORLD -- x:'+child._worldX+', y:'+child._worldY+', scaleX:'+child._worldXScale+', scaleY:'+child._worldYScale,'color:#00FF88; font-weight:bold;');
        //}
        // If container has resolution scale, propagate it
        if (this._resolutionScale !== -1) {
            child._resolutionScale = this._resolutionScale;
            child._transformedX = this._transformedX + (child.x * this.renderXScale * this._resolutionScale);
            child._transformedY = this._transformedY + (child.y * this.renderYScale * this._resolutionScale);
        }
    }
    /**
     * Gets the world position of this container (accounting for nested containers)
     */
    GetWorldPosition() {
        let worldX = this.x;
        let worldY = this.y;
        let current = this.parent;
        while (current) {
            worldX += current.x;
            worldY += current.y;
            current = current.parent;
        }
        return { x: worldX, y: worldY };
    }
    /**
     * Gets the world scale of this container (accounting for nested containers)
     */
    GetWorldScale() {
        let worldXScale = this.xScale;
        let worldYScale = this.yScale;
        let current = this.parent;
        while (current) {
            worldXScale *= current.xScale;
            worldYScale *= current.yScale;
            current = current.parent;
        }
        return { xScale: worldXScale, yScale: worldYScale };
    }
    /**
     * Checks if a point is within this container's bounds
     */
    ContainsPoint(x, y) {
        return x >= this.x &&
            x <= this.x + (this.width * this.xScale) &&
            y >= this.y &&
            y <= this.y + (this.height * this.yScale);
    }
    /**
     * Gets a child at a specific point (useful for hit testing)
     */
    GetChildAtPoint(x, y) {
        // Check children in reverse order (top to bottom)
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if (!child.enabled)
                continue;
            // Check if point is within child bounds
            if (x >= child.x &&
                x <= child.x + (child.width * child.xScale) &&
                y >= child.y &&
                y <= child.y + (child.height * child.yScale)) {
                // If child is also a container, check its children
                if (child instanceof CanvasContainerObj) {
                    const nestedChild = child.GetChildAtPoint(x, y);
                    if (nestedChild)
                        return nestedChild;
                }
                return child;
            }
        }
        return null;
    }
    /**
     * Updates container and all its children
     */
    Update(time, frameCount, onceSecond) {
        var _a;
        if (!this.enabled || !this._visible)
            return;
        // Update all child transforms relative to container
        // Handle autoscale if needed
        //if (CanvasEngine.get().EngineSettings?.autoScale)
        //{
        //	const scale = CanvasEngine.get().CurrentCanvasScale;
        //	this._transformedX = this.x * scale;
        //	this._transformedY = this.y * scale;
        //	this._transformedWidth = this.width * this.xScale * scale;
        //	this._transformedHeight = this.height * this.yScale * scale;
        //	this._resolutionScale = scale;
        //}
        let transformedX = 0;
        let xScale = 0;
        let transformedY = 0;
        let yScale = 0;
        if (((_a = CanvasEngine.get().EngineSettings) === null || _a === void 0 ? void 0 : _a.autoScale) && (this._debug && this._debugGraphics)) {
            transformedX = this.x * CanvasEngine.get().CurrentCanvasScale;
            transformedY = this.y * CanvasEngine.get().CurrentCanvasScale;
            xScale = CanvasEngine.get().CurrentCanvasScale * this.xScale;
            yScale = CanvasEngine.get().CurrentCanvasScale * this.yScale;
        }
        else {
            transformedX = this.x;
            transformedY = this.y;
            xScale = this.xScale;
            yScale = this.yScale;
        }
        //if(this._graphics)
        //{
        //	this._graphics.x = transformedX;
        //	this._graphics.y = transformedY;
        //	this._graphics.scale.set(xScale, yScale);
        //}
        if (this._debug && this._debugGraphics) {
            this._debugGraphics.x = transformedX;
            this._debugGraphics.y = transformedY;
            this._debugGraphics.scale.set(xScale, yScale);
        }
        for (const child of this.children) {
            //if(onceSecond) console.log('%c <'+frameCount+'>  updating child transform for '+child.label,'color:#00FF88; font-weight:bold;');
            this.updateChildTransform(child, onceSecond);
            // Update the child itself
            //if (child.enabled)
            //{
            //	child.Update(time, frameCount, onceSecond);
            //}
        }
    }
    /**
     * Sets the position of the container

    public SetPosition(x: number, y: number): void
    {
        this.x = x;
        this.y = y;
    }

    /**
     * Sets the scale of the container

    public SetScale(xScale: number, yScale?: number): void
    {
        this.xScale = xScale;
        this.yScale = yScale ?? xScale;
    }

    /**
     * Moves a child to a new relative position within the container

    public MoveChild(child: CanvasObj, x: number, y: number): void
    {
        // Set the child's position relative to the container
        child.x = this.x + x;
        child.y = this.y + y;
    }

    public ScaleChild(child: CanvasObj, xScale: number, yScale?: number): void
    {
        // Set the child's scale relative to the container
        child.xScale = this.xScale * xScale;
        child.yScale = this.yScale * (yScale ?? xScale);
    }
    */
    Dispose() {
        // Clear parent references for all children
        for (const child of this.children) {
            // Clear parent reference
            child.SetParent(null);
            // Dispose the child---- the Controller they are attached to should dispose of them.... we hope?
            //child.Dispose();
        }
        // Clean up debug graphics if present
        if (this._debugGraphics) {
            this._debugGraphics.removeAllListeners();
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._debugGraphics);
            this._debugGraphics.destroy();
            this._debugGraphics = null;
        }
        // Clear collections
        this.children = [];
        this._childOriginalTransforms.clear();
        super.Dispose();
    }
    /**
     * Gets debug info about the container
     */
    GetDebugInfo() {
        return `Container: ${this.label}
Position: (${this.x}, ${this.y})
Scale: (${this.xScale}, ${this.yScale})
Children: ${this.children.length}
${this.children.map(c => `  - ${c.label} (${c.constructor.name})`).join('\n')}`;
    }
}
