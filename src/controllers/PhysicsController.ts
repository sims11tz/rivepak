import Matter from "matter-js";
import { RivePhysicsObject } from "../canvasObjects/RivePhysicsObj";

export class PhysicsController
{
	static myInstance: PhysicsController;
	static get() { if (PhysicsController.myInstance == null) { PhysicsController.myInstance = new PhysicsController(); } return this.myInstance; }

	public get engine() { return this._engine!; }
	private _engine: Matter.Engine | null = null;
	private _debugRender: Matter.Render | null = null;
	private _debugRenderDiv: HTMLDivElement | null = null;

	private _physicswalls:boolean = false;
	private _wallOptions = { isStatic: true, restitution: 1, friction: 0, frictionStatic: 0, frictionAir: 0, wallThickness: 0.035 };
	private _logicalWidth:number = 0;
	private _logicalHeight:number = 0;

	private wallThickness(delta:number) { return delta*this._wallOptions.wallThickness; }

	public Init(canvas:HTMLCanvasElement, physicsWalls:boolean=false, debugRenderDiv:HTMLDivElement, debug:boolean = false)
	{
		this._physicswalls = physicsWalls;
		this._debugRenderDiv = debugRenderDiv;

		if (this._debugRender)
		{
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

		if (debug && debugRenderDiv)
		{
			// Create debug render at LOGICAL dimensions (not physical pixels)
			this._debugRender = Matter.Render.create({
				element: debugRenderDiv,
				engine: this._engine,
				options: {
					width: this._logicalWidth,
					height: this._logicalHeight,
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
			// Use logical dimensions for walls
			const walls = [
				Matter.Bodies.rectangle(this._logicalWidth / 2, 0, this._logicalWidth - this.wallThickness(this._logicalWidth), this.wallThickness(this._logicalWidth), this._wallOptions),
				Matter.Bodies.rectangle(this._logicalWidth / 2, this._logicalHeight, this._logicalWidth - this.wallThickness(this._logicalWidth), this.wallThickness(this._logicalWidth), this._wallOptions),
				Matter.Bodies.rectangle(0, this._logicalHeight / 2, this.wallThickness(this._logicalWidth), this._logicalHeight, this._wallOptions),
				Matter.Bodies.rectangle(this._logicalWidth, this._logicalHeight / 2, this.wallThickness(this._logicalWidth), this._logicalHeight, this._wallOptions),
			];
			walls.forEach(w => (w as any).isWall = true);
			Matter.World.add(this._engine.world, walls);
		}
	}

	public SetSize(width:number, height:number, dprIn:number=-1)
	{
		// Width/height are logical dimensions, store them
		this._logicalWidth = width;
		this._logicalHeight = height;

		if (this._debugRender)
		{
			// Use logical dimensions for the debug render canvas
			this._debugRender.canvas.width = width;
			this._debugRender.canvas.height = height;
			this._debugRender.options.width = width;
			this._debugRender.options.height = height;
		}

		// Optionally, rebuild walls if they exist (using logical dimensions)
		if (this._engine && this._physicswalls)
		{
			const world = this._engine.world;

			const wallsToRemove = world.bodies.filter(b => (b as any).isWall);
			wallsToRemove.forEach(w => Matter.World.remove(world, w));

			const newWalls = [
				Matter.Bodies.rectangle(width / 2, 0, width - this.wallThickness(width), this.wallThickness(width), this._wallOptions),
				Matter.Bodies.rectangle(width / 2, height, width - this.wallThickness(width), this.wallThickness(width), this._wallOptions),
				Matter.Bodies.rectangle(0, height / 2, this.wallThickness(width), height, this._wallOptions),
				Matter.Bodies.rectangle(width, height / 2, this.wallThickness(width), height, this._wallOptions),
			];
			newWalls.forEach(w => (w as any).isWall = true);

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

	public Update(time:number, frameCount:number, onceSecond:boolean, onceMinute:boolean): void
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

		this._debugRenderDiv = null;
		this._logicalWidth = 0;
		this._logicalHeight = 0;
	}
}
