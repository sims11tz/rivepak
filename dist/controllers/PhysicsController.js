import Matter from "matter-js";
export class PhysicsController {
    constructor() {
        this._engine = null;
        this._debugRender = null;
        this._debugRenderDiv = null;
        this._physicswalls = false;
        this._wallOptions = { isStatic: true, restitution: 1, friction: 0, frictionStatic: 0, frictionAir: 0, wallThickness: 0.035 };
        this._logicalWidth = 0;
        this._logicalHeight = 0;
        // Wall offsets (positive = inward from edge)
        this._wallOffsets = { top: 0, bottom: 0, left: 0, right: 0 };
        this.handleCollision = (event) => {
            event.pairs.forEach((pair) => {
                var _a, _b, _c, _d;
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                const objA = (_b = (_a = bodyA.parent) === null || _a === void 0 ? void 0 : _a.plugin) === null || _b === void 0 ? void 0 : _b.object;
                const objB = (_d = (_c = bodyB.parent) === null || _c === void 0 ? void 0 : _c.plugin) === null || _d === void 0 ? void 0 : _d.object;
                if (objA && objB) {
                    const impactForce = Matter.Vector.magnitude(pair.collision.penetration);
                    objA.OnCollision(objB, impactForce);
                    objB.OnCollision(objA, impactForce);
                }
            });
        };
    }
    static get() { if (PhysicsController.myInstance == null) {
        PhysicsController.myInstance = new PhysicsController();
    } return this.myInstance; }
    get engine() { return this._engine; }
    wallThickness(delta) { return delta * this._wallOptions.wallThickness; }
    Init(canvas, physicsWalls = false, debugRenderDiv, debug = false) {
        this._physicswalls = physicsWalls;
        this._debugRenderDiv = debugRenderDiv;
        if (this._debugRender) {
            Matter.Render.stop(this._debugRender);
            this._debugRender.canvas.remove();
            this._debugRender = null;
        }
        this._engine = Matter.Engine.create();
        this._engine.gravity.y = 0;
        this._engine.gravity.x = 0;
        // Use clientWidth/clientHeight for logical (CSS) dimensions
        // These are the actual rendered size, not the internal buffer size
        this._logicalWidth = canvas.clientWidth || canvas.width;
        this._logicalHeight = canvas.clientHeight || canvas.height;
        if (debug && debugRenderDiv) {
            // Create debug render at LOGICAL dimensions (not physical pixels)
            this._debugRender = Matter.Render.create({
                element: debugRenderDiv,
                engine: this._engine,
                options: {
                    width: this._logicalWidth,
                    height: this._logicalHeight,
                    wireframes: false,
                    background: "transparent",
                },
            });
            Matter.Render.run(this._debugRender);
        }
        else if (debugRenderDiv) {
            debugRenderDiv.style.display = "none";
        }
        Matter.Events.on(this._engine, "collisionStart", this.handleCollision);
        if (physicsWalls) {
            this.createWalls();
        }
    }
    SetSize(width, height, dprIn = -1) {
        // Width/height are logical dimensions, store them
        this._logicalWidth = width;
        this._logicalHeight = height;
        if (this._debugRender) {
            // Use logical dimensions for the debug render canvas
            this._debugRender.canvas.width = width;
            this._debugRender.canvas.height = height;
            this._debugRender.options.width = width;
            this._debugRender.options.height = height;
        }
        // Rebuild walls if they exist (using new logical dimensions)
        if (this._engine && this._physicswalls) {
            this.removeWalls();
            this.createWalls();
        }
    }
    /**
     * Enable physics walls at canvas boundaries
     * Can be called at runtime to add walls dynamically
     * @param offsets - Optional offsets to move walls inward (positive = inward from edge)
     */
    EnableWalls(offsets) {
        var _a, _b, _c, _d;
        if (!this._engine)
            return;
        if (this._physicswalls)
            return; // Already enabled
        // Store offsets
        if (offsets) {
            this._wallOffsets.top = (_a = offsets.top) !== null && _a !== void 0 ? _a : 0;
            this._wallOffsets.bottom = (_b = offsets.bottom) !== null && _b !== void 0 ? _b : 0;
            this._wallOffsets.left = (_c = offsets.left) !== null && _c !== void 0 ? _c : 0;
            this._wallOffsets.right = (_d = offsets.right) !== null && _d !== void 0 ? _d : 0;
        }
        this._physicswalls = true;
        this.createWalls();
    }
    /**
     * Disable physics walls
     * Can be called at runtime to remove walls dynamically
     */
    DisableWalls() {
        if (!this._engine)
            return;
        if (!this._physicswalls)
            return; // Already disabled
        this._physicswalls = false;
        this.removeWalls();
    }
    /**
     * Check if physics walls are currently enabled
     */
    get wallsEnabled() {
        return this._physicswalls;
    }
    /**
     * Create boundary walls using current logical dimensions and offsets
     */
    createWalls() {
        if (!this._engine)
            return;
        const width = this._logicalWidth;
        const height = this._logicalHeight;
        const thickness = this.wallThickness(width);
        // Apply offsets (positive = inward from edge)
        const topY = this._wallOffsets.top;
        const bottomY = height - this._wallOffsets.bottom;
        const leftX = this._wallOffsets.left;
        const rightX = width - this._wallOffsets.right;
        // Calculate effective width/height for horizontal/vertical walls
        const effectiveWidth = rightX - leftX;
        const effectiveHeight = bottomY - topY;
        const centerX = leftX + effectiveWidth / 2;
        const centerY = topY + effectiveHeight / 2;
        const walls = [
            // Top wall
            Matter.Bodies.rectangle(centerX, topY, effectiveWidth, thickness, this._wallOptions),
            // Bottom wall
            Matter.Bodies.rectangle(centerX, bottomY, effectiveWidth, thickness, this._wallOptions),
            // Left wall
            Matter.Bodies.rectangle(leftX, centerY, thickness, effectiveHeight, this._wallOptions),
            // Right wall
            Matter.Bodies.rectangle(rightX, centerY, thickness, effectiveHeight, this._wallOptions),
        ];
        walls.forEach(w => w.isWall = true);
        Matter.World.add(this._engine.world, walls);
    }
    /**
     * Remove all boundary walls from the physics world
     */
    removeWalls() {
        if (!this._engine)
            return;
        const world = this._engine.world;
        const wallsToRemove = world.bodies.filter(b => b.isWall);
        wallsToRemove.forEach(w => Matter.World.remove(world, w));
    }
    AddBody(body) {
        if (this._engine) {
            Matter.World.add(this._engine.world, body);
        }
    }
    Update(time, frameCount, onceSecond, onceMinute) {
        if (this._engine) {
            const fixedTimeStep = Math.min(time * 1000, 16.667);
            Matter.Engine.update(this._engine, fixedTimeStep);
        }
    }
    Dispose() {
        if (this._engine) {
            Matter.Events.off(this._engine, "collisionStart", this.handleCollision);
            Matter.World.clear(this._engine.world, false);
            this._engine = null;
        }
        if (this._debugRender) {
            Matter.Render.stop(this._debugRender);
            this._debugRender.canvas.remove();
            this._debugRender = null;
        }
        this._debugRenderDiv = null;
        this._logicalWidth = 0;
        this._logicalHeight = 0;
    }
}
