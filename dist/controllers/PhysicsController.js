import Matter from "matter-js";
import { createRivePakBody, isWallBody, extractCollisionData, DEFAULT_WALL_OPTIONS } from "../types/physics.types";
import { ResourceType } from "../core/ResourceManager";
export class PhysicsController {
    constructor() {
        this._engine = null;
        this._debugRender = null;
        this._physicswalls = false;
        this._wallOptions = DEFAULT_WALL_OPTIONS;
        this.resourceManager = null;
        this.handleCollision = (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                const collisionData = extractCollisionData(pair);
                if (collisionData && collisionData.objectA && collisionData.objectB) {
                    collisionData.objectA.OnCollision(collisionData.objectB, collisionData.impactForce);
                    collisionData.objectB.OnCollision(collisionData.objectA, collisionData.impactForce);
                }
            });
        };
    }
    static get() { if (PhysicsController.myInstance == null) {
        PhysicsController.myInstance = new PhysicsController();
    } return this.myInstance; }
    get engine() { return this._engine; }
    wallThickness(delta) { return delta * this._wallOptions.wallThickness; }
    Init(canvas, physicsWalls = false, debugRenderDiv, debug = false, resourceManager) {
        this.resourceManager = resourceManager || null;
        this._physicswalls = physicsWalls;
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
        Matter.Events.on(this._engine, "collisionStart", this.handleCollision);
        if (physicsWalls) {
            const walls = [
                createRivePakBody(canvas.width / 2, 0, canvas.width - this.wallThickness(canvas.width), this.wallThickness(canvas.width), Object.assign(Object.assign({}, this._wallOptions), { isWall: true })),
                createRivePakBody(canvas.width / 2, canvas.height, canvas.width - this.wallThickness(canvas.width), this.wallThickness(canvas.width), Object.assign(Object.assign({}, this._wallOptions), { isWall: true })),
                createRivePakBody(0, canvas.height / 2, this.wallThickness(canvas.width), canvas.height, Object.assign(Object.assign({}, this._wallOptions), { isWall: true })),
                createRivePakBody(canvas.width, canvas.height / 2, this.wallThickness(canvas.width), canvas.height, Object.assign(Object.assign({}, this._wallOptions), { isWall: true }))
            ];
            Matter.World.add(this._engine.world, walls);
            // Register walls with resource manager
            if (this.resourceManager) {
                walls.forEach((wall, index) => {
                    this.resourceManager.register(`physics_wall_${index}`, ResourceType.MATTER_BODY, wall, () => Matter.World.remove(this._engine.world, wall));
                });
            }
        }
    }
    SetSize(width, height) {
        if (this._debugRender) {
            this._debugRender.canvas.width = width;
            this._debugRender.canvas.height = height;
            this._debugRender.options.width = width;
            this._debugRender.options.height = height;
        }
        // Optionally, rebuild walls if they exist
        if (this._engine && this._physicswalls) {
            const world = this._engine.world;
            const wallsToRemove = world.bodies.filter(b => isWallBody(b));
            wallsToRemove.forEach(w => Matter.World.remove(world, w));
            const newWalls = [
                createRivePakBody(width / 2, 0, width - this.wallThickness(width), this.wallThickness(width), Object.assign(Object.assign({}, this._wallOptions), { isWall: true })),
                createRivePakBody(width / 2, height, width - this.wallThickness(width), this.wallThickness(width), Object.assign(Object.assign({}, this._wallOptions), { isWall: true })),
                createRivePakBody(0, height / 2, this.wallThickness(width), height, Object.assign(Object.assign({}, this._wallOptions), { isWall: true })),
                createRivePakBody(width, height / 2, this.wallThickness(width), height, Object.assign(Object.assign({}, this._wallOptions), { isWall: true }))
            ];
            Matter.World.add(world, newWalls);
        }
    }
    AddBody(body) {
        if (this._engine) {
            Matter.World.add(this._engine.world, body);
        }
    }
    Update(time, frameCount, onceSecond) {
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
    }
}
