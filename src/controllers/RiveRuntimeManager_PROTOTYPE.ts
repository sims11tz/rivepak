import RiveCanvas from "@rive-app/webgl2-advanced";

/**
 * RiveRuntimeManager - Singleton that manages a SHARED Rive runtime
 *
 * Multiple CanvasEngine instances can share the same Rive WASM runtime
 * for memory efficiency. Each instance gets its own renderer.
 */
export class RiveRuntimeManager
{
	private static _instance:RiveRuntimeManager;
	public static get():RiveRuntimeManager
	{
		if (!RiveRuntimeManager._instance)
		{
			RiveRuntimeManager._instance = new RiveRuntimeManager();
		}
		return RiveRuntimeManager._instance;
	}

	private _riveInstance:Awaited<ReturnType<typeof RiveCanvas>> | null = null;
	private _initPromise:Promise<Awaited<ReturnType<typeof RiveCanvas>>> | null = null;
	private _wasmSource:"local" | "cdn" | "custom" = "local";
	private _wasmLocalBase = "/rive/";

	/**
	 * Get or initialize the shared Rive runtime
	 */
	public async GetRiveInstance():Promise<Awaited<ReturnType<typeof RiveCanvas>>>
	{
		const debug = false;

		// If already initialized, return it
		if (this._riveInstance)
		{
			if (debug) console.log('%c RiveRuntimeManager: Returning existing Rive instance', 'color:#00ff00');
			return this._riveInstance;
		}

		// If initialization in progress, wait for it
		if (this._initPromise)
		{
			if (debug) console.log('%c RiveRuntimeManager: Waiting for Rive initialization in progress', 'color:#ffaa00');
			return this._initPromise;
		}

		// Start initialization
		if (debug) console.log('%c RiveRuntimeManager: Initializing NEW Rive instance', 'color:#00ffff');

		this._initPromise = this.InitializeRive();
		this._riveInstance = await this._initPromise;
		this._initPromise = null;

		return this._riveInstance;
	}

	/**
	 * Initialize the Rive runtime
	 */
	private async InitializeRive():Promise<Awaited<ReturnType<typeof RiveCanvas>>>
	{
		const debug = false;

		let locateFileConfig:{locateFile:(file:string) => string} | undefined;

		if (this._wasmSource === "local")
		{
			locateFileConfig = {
				locateFile: (file:string) =>
				{
					if (debug) console.log('%c RiveRuntimeManager: Loading WASM from local path:', 'color:#00ffff', this._wasmLocalBase + file);
					return this._wasmLocalBase + file;
				}
			};
		}
		else if (this._wasmSource === "cdn")
		{
			// Use default CDN (don't pass locateFile)
			locateFileConfig = undefined;
		}

		const riveInstance = await RiveCanvas(locateFileConfig);

		if (debug) console.log('%c RiveRuntimeManager: Rive runtime initialized successfully', 'color:#00ff00');

		return riveInstance;
	}

	/**
	 * Set WASM source location
	 */
	public SetWasmSource(source:"local" | "cdn" | "custom", localBase?:string):void
	{
		this._wasmSource = source;
		if (localBase) this._wasmLocalBase = localBase;
	}

	/**
	 * Check if Rive runtime is initialized
	 */
	public get IsInitialized():boolean
	{
		return this._riveInstance !== null;
	}

	/**
	 * Dispose the shared Rive runtime (use with caution!)
	 * This will affect all instances using it.
	 */
	public Dispose():void
	{
		const debug = false;
		if (debug) console.log('%c RiveRuntimeManager: Disposing shared Rive runtime', 'color:#ff0000');

		// Note: We don't actually delete the Rive instance here
		// because it may still be in use by other canvas instances
		this._riveInstance = null;
		this._initPromise = null;
	}
}
