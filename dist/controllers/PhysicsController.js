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
            // Use logical dimensions for walls
            const walls = [
                Matter.Bodies.rectangle(this._logicalWidth / 2, 0, this._logicalWidth - this.wallThickness(this._logicalWidth), this.wallThickness(this._logicalWidth), this._wallOptions),
                Matter.Bodies.rectangle(this._logicalWidth / 2, this._logicalHeight, this._logicalWidth - this.wallThickness(this._logicalWidth), this.wallThickness(this._logicalWidth), this._wallOptions),
                Matter.Bodies.rectangle(0, this._logicalHeight / 2, this.wallThickness(this._logicalWidth), this._logicalHeight, this._wallOptions),
                Matter.Bodies.rectangle(this._logicalWidth, this._logicalHeight / 2, this.wallThickness(this._logicalWidth), this._logicalHeight, this._wallOptions),
            ];
            walls.forEach(w => w.isWall = true);
            Matter.World.add(this._engine.world, walls);
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
        // Optionally, rebuild walls if they exist (using logical dimensions)
        if (this._engine && this._physicswalls) {
            const world = this._engine.world;
            const wallsToRemove = world.bodies.filter(b => b.isWall);
            wallsToRemove.forEach(w => Matter.World.remove(world, w));
            const newWalls = [
                Matter.Bodies.rectangle(width / 2, 0, width - this.wallThickness(width), this.wallThickness(width), this._wallOptions),
                Matter.Bodies.rectangle(width / 2, height, width - this.wallThickness(width), this.wallThickness(width), this._wallOptions),
                Matter.Bodies.rectangle(0, height / 2, this.wallThickness(width), height, this._wallOptions),
                Matter.Bodies.rectangle(width, height / 2, this.wallThickness(width), height, this._wallOptions),
            ];
            newWalls.forEach(w => w.isWall = true);
            Matter.World.add(world, newWalls);
        }
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
