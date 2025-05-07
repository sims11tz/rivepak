import Matter from "matter-js";
export class PhysicsController {
    constructor() {
        this._engine = null;
        this._debugRender = null;
        this.handleCollision = (event) => {
            event.pairs.forEach((pair) => {
                var _a, _b, _c, _d;
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                const objA = (_b = (_a = bodyA.parent) === null || _a === void 0 ? void 0 : _a.plugin) === null || _b === void 0 ? void 0 : _b.object;
                const objB = (_d = (_c = bodyB.parent) === null || _c === void 0 ? void 0 : _c.plugin) === null || _d === void 0 ? void 0 : _d.object;
                if (objA && objB) {
                    const impactForce = Matter.Vector.magnitude(pair.collision.penetration);
                    objA.onCollision(objB, impactForce);
                    objB.onCollision(objA, impactForce);
                }
            });
        };
    }
    static get() {
        if (PhysicsController.myInstance == null) {
            PhysicsController.myInstance = new PhysicsController();
        }
        return this.myInstance;
    }
    get engine() { return this._engine; }
    init(canvas, debugRenderDiv, debug = false) {
        if (this._debugRender) {
            Matter.Render.stop(this._debugRender);
            this._debugRender.canvas.remove();
            this._debugRender = null;
        }
        this._engine = Matter.Engine.create();
        this._engine.gravity.y = 0;
        this._engine.gravity.x = 0;
        if (debug && debugRenderDiv) {
            this._debugRender = Matter.Render.create({
                element: debugRenderDiv,
                engine: this._engine,
                options: {
                    width: canvas.width,
                    height: canvas.height,
                    wireframes: true,
                    background: "transparent",
                },
            });
            Matter.Render.run(this._debugRender);
        }
        else if (debugRenderDiv) {
            debugRenderDiv.style.display = "none";
        }
        Matter.Events.on(this._engine, "collisionStart", this.handleCollision); // ✅ now correctly bound
        const wallOptions = { isStatic: true, restitution: 0, friction: 0, wallThickness: 45 };
        const walls = [
            Matter.Bodies.rectangle(canvas.width / 2, 0, canvas.width - wallOptions.wallThickness, wallOptions.wallThickness, wallOptions),
            Matter.Bodies.rectangle(canvas.width / 2, canvas.height, canvas.width - wallOptions.wallThickness, wallOptions.wallThickness, wallOptions),
            Matter.Bodies.rectangle(0, canvas.height / 2, wallOptions.wallThickness, canvas.height, wallOptions),
            Matter.Bodies.rectangle(canvas.width, canvas.height / 2, wallOptions.wallThickness, canvas.height, wallOptions),
        ];
        Matter.World.add(this._engine.world, walls);
    }
    addBody(body) {
        if (this._engine) {
            Matter.World.add(this._engine.world, body);
        }
    }
    update(time, frameCount, onceSecond) {
        if (this._engine) {
            const fixedTimeStep = Math.min(time * 1000, 16.667);
            Matter.Engine.update(this._engine, fixedTimeStep);
        }
    }
    dispose() {
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
    }
}
