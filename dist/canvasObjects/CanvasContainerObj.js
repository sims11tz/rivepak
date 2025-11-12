import { PixiController } from "../controllers/PixiController";
import { RiveController } from "../controllers/RiveController";
import { CanvasEngine } from "../useCanvasEngine";
import { BaseCanvasObj, OBJECT_SCALE_ALIGN, OBJECT_SCALE_MODE } from "./_baseCanvasObj";
import * as PIXI from "pixi.js";
export class CanvasContainerObj extends BaseCanvasObj {
    get visible() {
        return super.visible;
    }
    set visible(value) {
        //console.log('%c <CanvasContainerObj> setting visible for '+this.label+' to '+value,'color:#FF8800; font-weight:bold;');
        super.visible = value;
        for (const child of this.children) {
            if (!child.independentVisibility) {
                //console.log('%c <CanvasContainerObj> setting visible for '+this.label+' to child: '+child.label+',  '+value,'color:#FF8800; font-weight:bold;');
                child.visible = value;
            }
            else {
                //console.log('%c <CanvasContainerObj> SKIPPING visible for '+this.label+' to child: '+child.label+' (independent visibility)','color:#FFA500; font-weight:bold;');
            }
        }
    }
    constructor(canvasDef) {
        super(canvasDef);
        this.children = [];
        this._childOriginalTransforms = new Map();
        this._debugGraphics = null;
        this._needsDebugGraphics = false; // Flag to track if debug graphics should be created when parent is set
        this._lastScaledWidth = 0;
        this._lastScaledHeight = 0;
        //this._debugRive = true;
        this.InitContainer();
    }
    InitContainer() {
        var _a, _b, _c, _d, _e, _f;
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const scaledWidth = CanvasEngine.get().width;
        const scaledHeight = CanvasEngine.get().height;
        let canvasWidth = scaledWidth / dpr;
        let canvasHeight = scaledHeight / dpr;
        if (this.defObj.scaleMode === OBJECT_SCALE_MODE.STRETCH) {
            if (PixiController.get().PixiAbove && PixiController.get().PixiAbove.view) {
                canvasWidth = PixiController.get().PixiAbove.view.width / dpr;
                canvasHeight = PixiController.get().PixiAbove.view.height / dpr;
            }
            else if (RiveController.get().CanvasBounds.width && RiveController.get().CanvasBounds.height) {
                canvasWidth = RiveController.get().CanvasBounds.width / dpr;
                canvasHeight = RiveController.get().CanvasBounds.height / dpr;
            }
        }
        else {
            canvasWidth = (this._objBoundsReuse.maxX - this._objBoundsReuse.minX) / dpr;
            canvasHeight = (this._objBoundsReuse.maxY - this._objBoundsReuse.minY) / dpr;
        }
        console.warn('hiiiiii');
        // Handle scaleMode if specified
        if (this.defObj.scaleMode === OBJECT_SCALE_MODE.STRETCH) {
            console.log(' SCALE MODE IS STRETCH for ' + this.label);
            // STRETCH mode: fill entire canvas
            this.width = canvasWidth;
            this.height = canvasHeight;
            console.log(' width=' + this.width + ', height=' + this.height);
            this.xScale = 1;
            this.yScale = 1;
            this.x = 0;
            this.y = 0;
        }
        else {
            console.log(' SCALE MODE IS DEFAULT for ' + this.label);
            // Default behavior
            this.width = (_a = this.defObj.width) !== null && _a !== void 0 ? _a : 100;
            this.height = (_b = this.defObj.height) !== null && _b !== void 0 ? _b : 100;
            this.xScale = (_c = this.defObj.xScale) !== null && _c !== void 0 ? _c : 1;
            this.yScale = (_d = this.defObj.yScale) !== null && _d !== void 0 ? _d : 1;
            console.log(' SCALE MODE IS DEFAULT for ' + this.label);
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
        }
        console.log(' InitContainer : width=' + this.width + ', height=' + this.height);
        // Handle scaleAlign for positioning
        //if(this.defObj.scaleAlign === OBJECT_SCALE_ALIGN.CENTER)
        //{
        //	// Center both horizontally and vertically
        //	this.x = (canvasWidth - this.width) / 2;
        //	this.y = (canvasHeight - this.height) / 2;
        //}
        //else if(this.defObj.scaleAlign === OBJECT_SCALE_ALIGN.TOP_CENTER)
        //{
        //	// Center horizontally, align to top
        //	this.x = (canvasWidth - this.width) / 2;
        //	this.y = 0;
        //}
        // Don't create debug graphics yet if we don't have a parent
        // Wait until OnParentAdded is called
        console.warn('eeeeeeps peeeeps');
        if (this._debugRive) {
            console.log('%c <CanvasContainerObj> scheduling debug graphics init for ' + this.label, 'color:#FF8800; font-weight:bold;');
            this.initDebugGraphics();
        }
        else {
            console.log('%c <CanvasContainerObj> no init for you.. ' + this.label, 'color:#FF8800; font-weight:bold;');
        }
    }
    initDebugGraphics(forceCreate = false) {
        console.log('%c <CanvasContainerObj> initDebugGraphics for ' + this.label, 'color:#FF8800; font-weight:bold;');
        console.log('%c <CanvasContainerObj> ' + this.label + '.  parent=>', 'color:#FF8800; font-weight:bold;', this._parent);
        console.log('%c <CanvasContainerObj> ' + this.label + '.  forceCreate=>', 'color:#FF8800; font-weight:bold;', forceCreate);
        // Only create debug graphics if we're being force-created (from OnParentAdded)
        // OR if we have a parent (are in a container)
        if (!forceCreate && this._parent === null) {
            console.log('%c <CanvasContainerObj> COCK BLOCK 1 ' + this.label, 'color:#FF8800; font-weight:bold;');
            this._needsDebugGraphics = true;
            return;
        }
        // Prevent double-initialization
        if (this._debugGraphics) {
            console.log('%c <CanvasContainerObj> COCK BLOCK 2 ' + this.label, 'color:#FF8800; font-weight:bold;');
            return;
        }
        console.log('%c <CanvasContainerObj> GO HO 3 ' + this.label, 'color:#FF8800; font-weight:bold;');
        this._debugGraphics = new PIXI.Graphics();
        PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.addChild(this._debugGraphics);
        this.DrawDebug();
    }
    destroyDebugGraphics() {
        if (this._debugGraphics) {
            this._debugGraphics.removeAllListeners();
            PixiController.get().GetPixiInstance(this.defObj.pixiLayer).stage.removeChild(this._debugGraphics);
            this._debugGraphics.destroy();
            this._debugGraphics = null;
        }
    }
    OnParentAdded() {
        if (this._needsDebugGraphics) {
            this.initDebugGraphics(true);
            this._needsDebugGraphics = false;
        }
    }
    OnParentRemoved() {
        // Clean up debug graphics when removed from engine
        if (this._debugGraphics) {
            this.destroyDebugGraphics();
        }
    }
    DrawDebug(onceSecond = false) {
        let bigD = false;
        if (this._debugGraphics) {
            if (bigD && onceSecond)
                console.log('%c <CanvasContainerObj> DrawDEBUG for ' + this.label, 'color:#FF8800; font-weight:bold;');
            const dpr = window.devicePixelRatio || 1;
            let scaledWidth = this.width / dpr;
            let scaledHeight = this.height / dpr;
            if (this.defObj.scaleMode === OBJECT_SCALE_MODE.STRETCH) {
                if (bigD && onceSecond)
                    console.log('%c <CanvasContainerObj> DrawDEBUG  SCALE STRETCH', 'color:#FF8800; font-weight:bold;');
                scaledWidth = PixiController.get().PixiAbove.view.width / dpr;
                scaledHeight = PixiController.get().PixiAbove.view.height / dpr;
            }
            else {
                if (bigD && onceSecond)
                    console.log('%c <CanvasContainerObj> DrawDEBUG   NOT STRETCH', 'color:#FF8800; font-weight:bold;');
                if (bigD && onceSecond)
                    console.log('%c <CanvasContainerObj> DrawDEBUG  objBoundsReuse => ', 'color:#FF8800; font-weight:bold;', this._objBoundsReuse);
                scaledWidth = (this._objBoundsReuse.maxX - this._objBoundsReuse.minX) / dpr;
                scaledHeight = (this._objBoundsReuse.maxY - this._objBoundsReuse.minY) / dpr;
                //if(this.centerGlobally)
                //{
                //}
                //if(this.centerGlobally || this.centerLocally)
                //{
                //}
            }
            if (this._lastScaledWidth === scaledWidth && this._lastScaledHeight === scaledHeight) {
                if (onceSecond)
                    console.log('%c <CanvasContainerObj>  cock block old shit... already done it!', 'color:#FF8800; font-weight:bold;');
                return;
            }
            else {
                console.log(' in like flinn ....');
                this._lastScaledWidth = scaledWidth;
                this._lastScaledHeight = scaledHeight;
                bigD = onceSecond = true;
            }
            if (bigD && onceSecond)
                console.log('%c <CanvasContainerObj> DrawDEBUG scaledWidth=' + scaledWidth, 'color:#FF8800; font-weight:bold;');
            if (bigD && onceSecond)
                console.log('%c <CanvasContainerObj> DrawDEBUG scaledHeight=' + scaledHeight, 'color:#FF8800; font-weight:bold;');
            //this._debugGraphics.clear();
            //this._debugGraphics.rect(5, 5, scaledWidth-5, scaledHeight-5).
            //fill({color:0x66CCFF, alpha:0.35}).
            //stroke({ width:2, color:0xfeeb77, alpha:0.5 });
            if (bigD && onceSecond)
                console.log('>>igraph>1>' + this.id + ':' + this._label + '>  dpr=' + dpr);
            if (bigD && onceSecond)
                console.log('>>igraph>2>  x=' + this._debugGraphics.x + ', y=' + this._debugGraphics.y);
            let newWidth = scaledWidth / dpr;
            let newHeight = scaledHeight / dpr;
            if (this.defObj.scaleMode === OBJECT_SCALE_MODE.STRETCH) {
                newWidth = PixiController.get().PixiAbove.view.width / dpr;
                newHeight = PixiController.get().PixiAbove.view.height / dpr;
                if (bigD && onceSecond)
                    console.log('>> STRETCH  newWidth=' + newWidth + ', newHeight=' + newHeight);
            }
            else {
                if (bigD && onceSecond)
                    console.log('>> NOT STRETCH  this._objBoundsReuse:::: ', this._objBoundsReuse);
                newWidth = (this._objBoundsReuse.maxX - this._objBoundsReuse.minX) / dpr;
                newHeight = (this._objBoundsReuse.maxY - this._objBoundsReuse.minY) / dpr;
                //newWidth = (this._objBoundsReuse.maxX - this._objBoundsReuse.minX) / dpr;
                //newHeight = (this._objBoundsReuse.maxY - this._objBoundsReuse.minY) / dpr;
                //newWidth = PixiController.get().PixiAbove.view.width/dpr;
                //newHeight = PixiController.get().PixiAbove.view.height/dpr;
                if (bigD && onceSecond)
                    console.log('>> NOT STRETCH  newWidth=' + newWidth + ', newHeight=' + newHeight);
            }
            this._debugGraphics.x = this._objBoundsReuse.minX / dpr;
            this._debugGraphics.y = this._objBoundsReuse.minY / dpr;
            if (bigD && onceSecond)
                console.log('>>   debugGraphics x=' + this._debugGraphics.x + ', y=' + this._debugGraphics.y);
            if (bigD && onceSecond)
                console.log('>>  debugGraphics nw=' + (newWidth - 2) + ', nh=' + (newHeight - 2));
            if (bigD && onceSecond)
                console.log('>>  debugGraphics  w=' + this._debugGraphics.width + ', h=' + this._debugGraphics.height);
            this._debugGraphics.clear();
            this._debugGraphics
                .rect(2, 2, newWidth - 2, newHeight - 4)
                .fill({ color: 0x770f77, alpha: 0.35 })
                .stroke({ width: 1, color: 0xfeeb77, alpha: 0.75 });
            if (bigD && onceSecond)
                console.log('>>  debugGraphics POST DRAW w=' + this._debugGraphics.width + ', h=' + this._debugGraphics.height);
        }
        else {
            if (onceSecond)
                console.log('%c <CanvasContainerObj> DrawDEBUG no' + this.label, 'color:#FF8800; font-weight:bold;');
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
     * Uses fractional offsets to avoid polluting the global z-index space
     */
    updateChildrenZOrder() {
        const baseZ = this.z || 0;
        this.children.forEach((child, index) => {
            // Use fractional offsets (0.001 per child) to maintain order within container
            // This allows up to 999 children before hitting the next integer z-level
            child.z = baseZ + (index * 0.001);
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
    Update(time, frameCount, onceSecond, onceMinute) {
        if (!this.enabled || !this.visible)
            return;
        let centerWidth = 0;
        let centerHeight = 0;
        if (this.defObj.scaleMode === OBJECT_SCALE_MODE.STRETCH) {
            centerWidth = (PixiController.get().PixiAbove.view.width - this._objBoundsReuse.maxX) / 2;
        }
        else if (this.defObj.scaleAlign === OBJECT_SCALE_ALIGN.CENTER) {
            centerWidth = (RiveController.get().Canvas.width - this._objBoundsReuse.maxX) / 2;
            centerHeight = (PixiController.get().PixiAbove.view.height / 2);
        }
        super.Update(time, frameCount, onceSecond, onceMinute, centerWidth, centerHeight);
        /*
        ????????????????????
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
        
                const dpr = window.devicePixelRatio || 1;
        
                if(CanvasEngine.get().EngineSettings?.autoScale && (this._debugRive && this._debugGraphics))
                {
                    transformedX = (this.x * CanvasEngine.get().CurrentCanvasScale) / dpr;
                    transformedY = (this.y * CanvasEngine.get().CurrentCanvasScale) / dpr;
                    xScale = CanvasEngine.get().CurrentCanvasScale * this.xScale;
                    yScale = CanvasEngine.get().CurrentCanvasScale * this.yScale;
                }
                else
                {
                    transformedX = this.x / dpr;
                    transformedY = this.y / dpr;
                    xScale = this.xScale;
                    yScale = this.yScale;
                }
        ????????????????????
        */
        if (this._debugGraphics) {
            this.DrawDebug(onceSecond);
        }
        for (const child of this.children) {
            //if(onceSecond) console.log('%c <'+frameCount+'>  updating child transform for '+child.label,'color:#00FF88; font-weight:bold;');
            this.updateChildTransform(child, onceSecond);
            //THE ENGINE SHOULD DO THIS........
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
        // Clean up debug graphics using the helper method
        this.destroyDebugGraphics();
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
