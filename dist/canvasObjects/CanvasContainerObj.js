import { CanvasObj } from "./CanvasObj";
/**
 * Container object that can hold and manage child canvas objects.
 * All children inherit transformations from their parent container.
 */
export class CanvasContainerObj extends CanvasObj {
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
        this.InitContainer();
    }
    InitContainer() {
        // Container-specific initialization
        // Set default size if not specified
        if (!this.defObj.width)
            this.width = 100;
        if (!this.defObj.height)
            this.height = 100;
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
        // Store original transform relative to container
        this._childOriginalTransforms.set(child.uuid, {
            x: child.x,
            y: child.y,
            xScale: child.xScale,
            yScale: child.yScale
        });
        child.SetParent(this);
        this.children.push(child);
        // Update child transform immediately
        this.updateChildTransform(child);
    }
    /**
     * Removes a child object from this container
     */
    RemoveChild(child) {
        const index = this.children.indexOf(child);
        if (index === -1)
            return false;
        child.SetParent(null);
        this.children.splice(index, 1);
        // Restore original transform
        const original = this._childOriginalTransforms.get(child.uuid);
        if (original) {
            child.x = original.x;
            child.y = original.y;
            child.xScale = original.xScale;
            child.yScale = original.yScale;
            this._childOriginalTransforms.delete(child.uuid);
        }
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
    /**
     * Gets all children of a specific type
     */
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
    updateChildTransform(child) {
        const original = this._childOriginalTransforms.get(child.uuid);
        if (!original)
            return;
        // Apply container transformations to child
        // Position is relative to container position
        child.x = this.x + (original.x * this.xScale);
        child.y = this.y + (original.y * this.yScale);
        // Scale is multiplicative
        child.xScale = original.xScale * this.xScale;
        child.yScale = original.yScale * this.yScale;
        // If container has resolution scale, propagate it
        if (this._resolutionScale !== -1) {
            child._resolutionScale = this._resolutionScale;
            child._transformedX = this._transformedX + (original.x * this.xScale * this._resolutionScale);
            child._transformedY = this._transformedY + (original.y * this.yScale * this._resolutionScale);
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
        if (!this.enabled || !this._visible)
            return;
        // Update all child transforms relative to container
        //for(const child of this.children)
        //{
        //	this.updateChildTransform(child);
        //	// Update the child itself
        //	if (child.enabled)
        //	{
        //		child.Update(time, frameCount, onceSecond);
        //	}
        //}
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
    }
    /**
     * Sets the position of the container
     */
    SetPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Sets the scale of the container
     */
    SetScale(xScale, yScale) {
        this.xScale = xScale;
        this.yScale = yScale !== null && yScale !== void 0 ? yScale : xScale;
    }
    /**
     * Moves a child to a new relative position within the container
     */
    MoveChild(child, x, y) {
        const original = this._childOriginalTransforms.get(child.uuid);
        if (original) {
            original.x = x;
            original.y = y;
            this.updateChildTransform(child);
        }
    }
    /**
     * Scales a child relative to the container
     */
    ScaleChild(child, xScale, yScale) {
        const original = this._childOriginalTransforms.get(child.uuid);
        if (original) {
            original.xScale = xScale;
            original.yScale = yScale !== null && yScale !== void 0 ? yScale : xScale;
            this.updateChildTransform(child);
        }
    }
    /**
     * Disposes of the container and all its children
     */
    Dispose() {
        // Dispose all children
        for (const child of this.children) {
            child.Dispose();
        }
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
