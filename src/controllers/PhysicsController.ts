import Matter from "matter-js";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";
import { RivePakBody, createRivePakBody, isWallBody, extractCollisionData, DEFAULT_WALL_OPTIONS, PhysicsConfig } from "../types/physics.types";
import { ResourceManager, ResourceType } from "../core/ResourceManager";

export class PhysicsController
{
	static myInstance: PhysicsController;
	static get() { if (PhysicsController.myInstance == null) { PhysicsController.myInstance = new PhysicsController(); } return this.myInstance; }

	public get engine() { return this._engine!; }
	private _engine: Matter.Engine | null = null;
	private _debugRender: Matter.Render | null = null;

	private _physicswalls:boolean = false;
	private _wallOptions = DEFAULT_WALL_OPTIONS;
	private resourceManager: ResourceManager | null = null;

	private wallThickness(delta:number) { return delta*this._wallOptions.wallThickness; }

	public Init(canvas:HTMLCanvasElement, physicsWalls:boolean=false, debugRenderDiv:HTMLDivElement, debug:boolean = false, resourceManager?: ResourceManager)
	{
		this.resourceManager = resourceManager || null;
		this._physicswalls = physicsWalls;

		if (this._debugRender)
		{
			Matter.Render.stop(this._debugRender);
			this._debugRender.canvas.remove();
			this._debugRender = null;
		}

		this._engine = Matter.Engine.create();
		this._engine.gravity.y = 0;
		this._engine.gravity.x = 0;

		if (debug && debugRenderDiv)
		{
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
		else if (debugRenderDiv)
		{
			debugRenderDiv.style.display = "none";
		}

		Matter.Events.on(this._engine, "collisionStart", this.handleCollision);
		if(physicsWalls)
		{
			const walls: RivePakBody[] = [
				createRivePakBody(
					canvas.width / 2, 0,
					canvas.width - this.wallThickness(canvas.width), this.wallThickness(canvas.width),
					{ ...this._wallOptions, isWall: true }
				),
				createRivePakBody(
					canvas.width / 2, canvas.height,
					canvas.width - this.wallThickness(canvas.width), this.wallThickness(canvas.width),
					{ ...this._wallOptions, isWall: true }
				),
				createRivePakBody(
					0, canvas.height / 2,
					this.wallThickness(canvas.width), canvas.height,
					{ ...this._wallOptions, isWall: true }
				),
				createRivePakBody(
					canvas.width, canvas.height / 2,
					this.wallThickness(canvas.width), canvas.height,
					{ ...this._wallOptions, isWall: true }
				)
			];
			Matter.World.add(this._engine.world, walls);
			
			// Register walls with resource manager
			if (this.resourceManager) {
				walls.forEach((wall, index) => {
					this.resourceManager!.register(
						`physics_wall_${index}`,
						ResourceType.MATTER_BODY,
						wall,
						() => Matter.World.remove(this._engine!.world, wall)
					);
				});
			}
		}
	}

	public SetSize(width: number, height: number)
	{
		if (this._debugRender)
		{
			this._debugRender.canvas.width = width;
			this._debugRender.canvas.height = height;
			this._debugRender.options.width = width;
			this._debugRender.options.height = height;
		}

		// Optionally, rebuild walls if they exist
		if (this._engine && this._physicswalls)
		{
			const world = this._engine.world;

			const wallsToRemove = world.bodies.filter(b => isWallBody(b));
			wallsToRemove.forEach(w => Matter.World.remove(world, w));

			const newWalls: RivePakBody[] = [
				createRivePakBody(
					width / 2, 0,
					width - this.wallThickness(width), this.wallThickness(width),
					{ ...this._wallOptions, isWall: true }
				),
				createRivePakBody(
					width / 2, height,
					width - this.wallThickness(width), this.wallThickness(width),
					{ ...this._wallOptions, isWall: true }
				),
				createRivePakBody(
					0, height / 2,
					this.wallThickness(width), height,
					{ ...this._wallOptions, isWall: true }
				),
				createRivePakBody(
					width, height / 2,
					this.wallThickness(width), height,
					{ ...this._wallOptions, isWall: true }
				)
			];

			Matter.World.add(world, newWalls);
		}
	}

	public AddBody(body: Matter.Body)
	{
		if (this._engine)
		{
			Matter.World.add(this._engine.world, body);
		}
	}

	public Update(time: number, frameCount: number, onceSecond: boolean): void
	{
		if (this._engine)
		{
			const fixedTimeStep = Math.min(time * 1000, 16.667);
			Matter.Engine.update(this._engine, fixedTimeStep);
		}
	}

	private handleCollision = (event: Matter.IEventCollision<Matter.Engine>) =>
	{
		event.pairs.forEach((pair) =>
		{
			const bodyA = pair.bodyA;
			const bodyB = pair.bodyB;

			const collisionData = extractCollisionData(pair);
			if (collisionData && collisionData.objectA && collisionData.objectB) {
				(collisionData.objectA as RivePhysicsObject).OnCollision(
					collisionData.objectB,
					collisionData.impactForce
				);
				(collisionData.objectB as RivePhysicsObject).OnCollision(
					collisionData.objectA,
					collisionData.impactForce
				);
			}
		});
	};

	public Dispose()
	{
		if (this._engine)
		{
			Matter.Events.off(this._engine, "collisionStart", this.handleCollision);
			Matter.World.clear(this._engine.world, false);
			this._engine = null;

		}

		if (this._debugRender)
		{
			Matter.Render.stop(this._debugRender);
			this._debugRender.canvas.remove();
			this._debugRender = null;
		}
	}
}
