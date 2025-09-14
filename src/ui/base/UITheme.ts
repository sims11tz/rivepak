/**
 * Theme System for RivePak UI Components
 */

export interface UITheme
{
	name:string;
	colors:{
		primary:number;
		primaryLight:number;
		primaryHover:number;
		primaryActive:number;
		secondary:number;
		secondaryHover:number;
		secondaryActive:number;
		background:number;
		surface:number;
		surfaceHover:number;
		text:number;
		textSecondary:number;
		textDisabled:number;
		border:number;
		borderHover:number;
		borderFocus:number;
		disabled:number;
		error:number;
		success:number;
		warning:number;
		info:number;
	};
	fonts:{
		family:string;
		size:number;
		sizeSmall:number;
		sizeLarge:number;
		weight:string;
		weightBold:string;
	};
	spacing:{
		tiny:number;
		small:number;
		medium:number;
		large:number;
		huge:number;
	};
	borderRadius:number;
	borderWidth:number;
	animation:{
		duration:number;
		easing:string;
	};
	shadows:{
		small:{ color:number; alpha:number; blur:number; offsetX:number; offsetY:number };
		medium:{ color:number; alpha:number; blur:number; offsetX:number; offsetY:number };
		large:{ color:number; alpha:number; blur:number; offsetX:number; offsetY:number };
	};
}

// Default Light Theme
export const LightTheme:UITheme = {
	name: 'light',
	colors: {
		primary: 0x007AFF,
		primaryLight: 0x5AC8FA,
		primaryHover: 0x0051D5,
		primaryActive: 0x003D99,
		secondary: 0x5AC8FA,
		secondaryHover: 0x32ADE6,
		secondaryActive: 0x1E88C7,
		background: 0xF2F2F7,
		surface: 0xFFFFFF,
		surfaceHover: 0xF5F5F5,
		text: 0x000000,
		textSecondary: 0x8E8E93,
		textDisabled: 0xC7C7CC,
		border: 0xC6C6C8,
		borderHover: 0x007AFF,
		borderFocus: 0x0051D5,
		disabled: 0xD1D1D6,
		error: 0xFF3B30,
		success: 0x34C759,
		warning: 0xFF9500,
		info: 0x5AC8FA
	},
	fonts: {
		family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		size: 14,
		sizeSmall: 12,
		sizeLarge: 16,
		weight: '400',
		weightBold: '600'
	},
	spacing: {
		tiny: 4,
		small: 8,
		medium: 16,
		large: 24,
		huge: 32
	},
	borderRadius: 8,
	borderWidth: 1,
	animation: {
		duration: 200,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
	},
	shadows: {
		small: { color: 0x000000, alpha: 0.1, blur: 4, offsetX: 0, offsetY: 2 },
		medium: { color: 0x000000, alpha: 0.15, blur: 8, offsetX: 0, offsetY: 4 },
		large: { color: 0x000000, alpha: 0.2, blur: 16, offsetX: 0, offsetY: 8 }
	}
};

// Dark Theme
export const DarkTheme:UITheme = {
	name: 'dark',
	colors: {
		primary: 0x0A84FF,
		primaryLight: 0x64D2FF,
		primaryHover: 0x409CFF,
		primaryActive: 0x0066CC,
		secondary: 0x64D2FF,
		secondaryHover: 0x70C7EC,
		secondaryActive: 0x5899C3,
		background: 0x000000,
		surface: 0x1C1C1E,
		surfaceHover: 0x2C2C2E,
		text: 0xFFFFFF,
		textSecondary: 0x8E8E93,
		textDisabled: 0x48484A,
		border: 0x38383A,
		borderHover: 0x0A84FF,
		borderFocus: 0x409CFF,
		disabled: 0x2C2C2E,
		error: 0xFF453A,
		success: 0x32D74B,
		warning: 0xFF9F0A,
		info: 0x64D2FF
	},
	fonts: {
		family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		size: 14,
		sizeSmall: 12,
		sizeLarge: 16,
		weight: '400',
		weightBold: '600'
	},
	spacing: {
		tiny: 4,
		small: 8,
		medium: 16,
		large: 24,
		huge: 32
	},
	borderRadius: 8,
	borderWidth: 1,
	animation: {
		duration: 200,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
	},
	shadows: {
		small: { color: 0x000000, alpha: 0.3, blur: 4, offsetX: 0, offsetY: 2 },
		medium: { color: 0x000000, alpha: 0.4, blur: 8, offsetX: 0, offsetY: 4 },
		large: { color: 0x000000, alpha: 0.5, blur: 16, offsetX: 0, offsetY: 8 }
	}
};

// Theme Manager
export class UIThemeManager
{
	private static themes:Map<string, UITheme> = new Map([
		['light', LightTheme],
		['dark', DarkTheme]
	]);
	
	private static currentTheme:UITheme = LightTheme;
	
	public static get Current():UITheme { return this.currentTheme; }
	
	public static SetTheme(name:string):void
	{
		const theme = this.themes.get(name);
		if(theme)
		{
			this.currentTheme = theme;
		}
		else
		{
			console.warn(`Theme '${name}' not found`);
		}
	}
	
	public static RegisterTheme(theme:UITheme):void
	{
		this.themes.set(theme.name, theme);
	}
	
	public static GetTheme(name:string):UITheme | undefined
	{
		return this.themes.get(name);
	}
}