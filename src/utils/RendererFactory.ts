/**
 * Runtime renderer detection and factory.
 * Uses WebGL2 on desktop, Canvas on mobile for better stability.
 */

export type RendererType = "webgl2" | "canvas";

export interface RendererInfo {
	type: RendererType;
	isMobile: boolean;
	userAgent: string;
}

let _cachedRendererInfo: RendererInfo | null = null;
let _rendererTypeOverride: RendererType | null = null;

/**
 * Detect if running on a mobile device
 */
export function isMobileDevice(): boolean
{
	if (typeof window === "undefined") return false;

	const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || "";

	// Check for mobile user agents
	const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

	// Also check for touch capability + small screen as backup
	const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
	const isSmallScreen = window.innerWidth <= 768;

	return mobileRegex.test(ua) || (hasTouch && isSmallScreen);
}

/**
 * Force a specific renderer type (for testing)
 */
export function setRendererOverride(type: RendererType | null): void
{
	_rendererTypeOverride = type;
	_cachedRendererInfo = null; // Clear cache
	console.log(`[RendererFactory] Renderer override set to: ${type || "auto"}`);
}

/**
 * Get the current renderer info
 */
export function getRendererInfo(): RendererInfo
{
	if (_cachedRendererInfo) return _cachedRendererInfo;

	const isMobile = isMobileDevice();
	const type: RendererType = _rendererTypeOverride || (isMobile ? "canvas" : "webgl2");

	_cachedRendererInfo = {
		type,
		isMobile,
		userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown"
	};

	console.log(`[RendererFactory] Detected: ${type} (mobile: ${isMobile})`);
	return _cachedRendererInfo;
}

/**
 * Get the renderer type to use
 */
export function getRendererType(): RendererType
{
	return getRendererInfo().type;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RiveModuleInit = (options?: { locateFile?: (file: string) => string }) => Promise<any>;

export interface RiveModuleResult {
	default: RiveModuleInit;
	type: RendererType;
}

/**
 * Load the appropriate Rive module based on renderer type
 */
export async function loadRiveModule(): Promise<RiveModuleResult>
{
	const rendererType = getRendererType();

	console.log(`[RendererFactory] Loading Rive module: ${rendererType}`);

	if (rendererType === "canvas")
	{
		const module = await import("@rive-app/canvas-advanced");
		return { default: module.default as RiveModuleInit, type: "canvas" };
	}
	else
	{
		const module = await import("@rive-app/webgl2-advanced");
		return { default: module.default as RiveModuleInit, type: "webgl2" };
	}
}
