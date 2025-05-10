import Matter from "matter-js";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";

export class PhysicsController
{
	static myInstance: PhysicsController;
	static get() { if (PhysicsController.myInstance == null) { PhysicsController.myInstance = new PhysicsController(); } return this.myInstance; }

	public get engine() { return this._engine!; }
	private _engine: Matter.Engine | null = null;
	private _debugRender: Matter.Render | null = null;

	public Init(canvas: HTMLCanvasElement, physicsWalls:boolean=false, debugRenderDiv: HTMLDivElement, debug: boolean = false)
	{
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

		Matter.Events.on(this._engine, "collisionStart", this.handleCollision); // ✅ now correctly bound
		if(physicsWalls)
		{
			const wallOptions = { isStatic: true, restitution: 0, friction: 0, wallThickness: 45 };
			const walls = [
				Matter.Bodies.rectangle(canvas.width / 2, 0, canvas.width - wallOptions.wallThickness, wallOptions.wallThickness, wallOptions),
				Matter.Bodies.rectangle(canvas.width / 2, canvas.height, canvas.width - wallOptions.wallThickness, wallOptions.wallThickness, wallOptions),
				Matter.Bodies.rectangle(0, canvas.height / 2, wallOptions.wallThickness, canvas.height, wallOptions),
				Matter.Bodies.rectangle(canvas.width, canvas.height / 2, wallOptions.wallThickness, canvas.height, wallOptions),
			];
			Matter.World.add(this._engine.world, walls);
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

			const objA = bodyA.parent?.plugin?.object as RivePhysicsObject;
			const objB = bodyB.parent?.plugin?.object as RivePhysicsObject;

			if (objA && objB)
			{
				const impactForce = Matter.Vector.magnitude(pair.collision.penetration);
				objA.OnCollision(objB, impactForce);
				objB.OnCollision(objA, impactForce);
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
