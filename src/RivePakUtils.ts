import { File as RiveFile, Artboard, ViewModel, ViewModelInstance } from "@rive-app/webgl2-advanced";

export default class RivePakUtils
{
	static myInstance: RivePakUtils;
	static get() { if (RivePakUtils.myInstance == null) { RivePakUtils.myInstance = new RivePakUtils(); } return this.myInstance; }


	public static _typename = (x:any) => Object.prototype.toString.call(x).slice(8, -1);
	public static _isFn = (o:any, k:string) => o && typeof o[k] === "function";

	private static _debug = false;
	public static get debug() { return this._debug; }

	/** Try to read a "value" from different property shapes safely. */
	public static _readPropValueSafe(obj:any, key:string)
	{
		try
		{
			if (!obj) return undefined;
			// Common patterns: obj[key], obj.get(key), obj.value, obj.defaultValue, obj.initialValue, obj.current, etc.
			if (key in obj) return obj[key];
			if (this._isFn(obj, "get")) return obj.get(key);
			if ("value" in obj) return obj.value;
			if ("defaultValue" in obj) return obj.defaultValue;
			if ("initialValue" in obj) return obj.initialValue;
			if ("current" in obj) return obj.current;
		} catch {}
		return undefined;
	}

	/** Dump all enums declared in a RiveFile (names + options). */
	public static DumpEnums(file:RiveFile)
	{
		try
		{
			if (!this._isFn(file, "enums")) { console.log("No enums() on file."); return; }
			const enums:any[] = (file as any).enums?.() ?? [];
			console.log("🧩 Rive Enums (count:", enums.length, "):");
			enums.forEach((e:any, idx:number) => {
				const name = e?.name ?? `(enum-${idx})`;
				const opts = this._isFn(e, "options") ? e.options() : (e?.options ?? e?.values ?? []);
				console.log(`  • ${name}`, opts ? `options: ${JSON.stringify(opts)}` : "(no options API?)");
			});
		}
		catch (e)
		{
			console.log("dumpEnums error:", e);
		}
	}

	/** Return best Vie wModel match for an artboard. */
	public static PickBestViewModel(file:RiveFile, artboard:Artboard, requestedName?:string): ViewModel | null
	{
		// 1) explicit by name
		if (requestedName && this._isFn(file, "viewModelByName")) {
			const v = (file as any).viewModelByName(requestedName);
			if (v) return v;
		}
		// 2) artboard-default
		if (this._isFn(file, "defaultArtboardViewModel")) {
			const v = (file as any).defaultArtboardViewModel(artboard);
			if (v) return v;
		}
		// 3) exact artboard-name match if available in VM names
		if (this._isFn(file, "viewModelCount") && this._isFn(file, "viewModelByIndex")) {
			const count = (file as any).viewModelCount();
			for (let i=0;i<count;i++) {
				const vm = (file as any).viewModelByIndex(i);
				if (vm?.name === artboard?.name) return vm;
			}
		}
		// 4) first VM fallback
		if (this._isFn(file, "viewModelByIndex") && this._isFn(file, "viewModelCount")) {
			const first = (file as any).viewModelCount() > 0 ? (file as any).viewModelByIndex(0) : null;
			if (first) return first;
		}
		return null;
	}

	/** Make a VMI with preference order: instanceByName > defaultInstance > instance. */
	public static MakeBestVMI(vm:ViewModel, artboard:Artboard, instanceName?:string): ViewModelInstance | null
	{
		const debug = this._debug || false;
		try
		{
			//Helper to validate VMI has properties
			const isValidVMI = (vmi:any):boolean =>
			{
				if(!vmi) return false;
				try
				{
					const propCount = vmi.propertyCount;
					if(debug) console.log(`  VMI propertyCount: ${propCount}`);
					if (propCount > 0) return true;

					// Also try getting properties array
					const props = vmi.getProperties?.();
					if(debug) console.log(`  VMI getProperties() length: ${props?.length ?? 0}`);
					return props && props.length > 0;
				}
				catch (e)
				{
					console.log(`  Error checking VMI validity:`, e);
					return false;
				}
			};

			//If we have an instance name, try to get it specifically
			if(instanceName && this._isFn(vm, "instanceByName"))
			{
				if(debug) console.log(`Trying to get instance by name: "${instanceName}"`);
				const vmi = (vm as any).instanceByName(instanceName);
				if (isValidVMI(vmi))
				{
					if(debug) console.log(`✅ Successfully got instance by name: "${instanceName}"`);
					return vmi;
				}
				//console.log(`❌ instanceByName("${instanceName}") returned empty/invalid VMI`);
			}

			// Try defaultInstance
			if(this._isFn(vm, "defaultInstance"))
			{
				if(debug) console.log("Trying defaultInstance()");
				const vmi = (vm as any).defaultInstance();
				if(isValidVMI(vmi))
				{
					if(debug) console.log(`✅ Successfully got defaultInstance()`);
					return vmi;
				}
				if(debug) console.log("❌ defaultInstance() returned empty/invalid VMI");
			}

			// Try instance()
			if (this._isFn(vm, "instance"))
			{
				if(debug) console.log("Trying instance()");
				const vmi = (vm as any).instance();
				if (isValidVMI(vmi))
				{
					if(debug) console.log(`✅ Successfully got instance()`);
					return vmi;
				}
				if(debug) console.log("❌ instance() returned empty/invalid VMI");
			}

			// Last resort: try creating a new instance
			if (this._isFn(vm, "createInstance"))
			{
				if(debug) console.log("Trying createInstance()");
				const vmi = (vm as any).createInstance();
				if (isValidVMI(vmi))
				{
					if(debug) console.log(`✅ Successfully created new instance`);
					return vmi;
				}
				if(debug) console.log("❌ createInstance() returned empty/invalid VMI");
			}

			if(debug) console.log("❌ All VMI creation methods failed to return valid VMI");

		}
		catch(e)
		{
			console.log("makeBestVMI error:", e);
		}

		return null;
	}

	/** Dump one ViewModel’s metadata. */
	public static DumpViewModel(vm:ViewModel)
	{
		try {
			const count = this._isFn(vm, "instanceCount") ? (vm as any).instanceCount() : undefined;
			const names = this._isFn(vm, "getInstanceNames") ? (vm as any).getInstanceNames() : undefined;
			const props = this._isFn(vm, "getProperties") ? (vm as any).getProperties() : undefined;
			console.log(`📦 ViewModel "${(vm as any)?.name ?? "unnamed"}"`, { instanceCount: count, instanceNames: names });

			if (Array.isArray(props)) {
				console.log(`  Properties (${props.length}):`);
				for (const p of props) {
					const pName = p?.name ?? "(unnamed)";
					const pType = p?.type ?? p?.typeName ?? this._typename(p);
					const defVal = this._readPropValueSafe(p, "defaultValue") ?? this._readPropValueSafe(p, "initialValue");
					let enumOptions = undefined;
					if (Array.isArray(p?.options)) enumOptions = p.options;
					else if (this._isFn(p, "options")) enumOptions = p.options();

					console.log(`   • ${pName} [${pType}] default=${JSON.stringify(defVal)}${enumOptions ? ` options=${JSON.stringify(enumOptions)}` : ""}`);
				}
			} else {
				console.log("  (getProperties() not available)");
			}
		} catch (e) { console.log("dumpViewModel error:", e); }
	}

	/** Dump a VMI's current property values. */
	public static DumpVMI(vmi:ViewModelInstance)
	{
		try {
			console.log(`🔗 VMI on artboard "${(vmi as any)?.artboard?.name ?? "?"}"`);
			const props = this._isFn(vmi, "getProperties") ? (vmi as any).getProperties() : null;
			if (!Array.isArray(props)) { console.log("  (VMI.getProperties() not available)"); return; }

			// Prefer an API like vmi.get(name) / getPropertyValue / property.value; fallback to VM defaults if needed.
			for (const p of props) {
				const pName = p?.name ?? "(unnamed)";
				let curr:any = undefined;

				if (this._isFn(vmi, "getPropertyValue")) curr = (vmi as any).getPropertyValue(pName);
				else if (this._isFn(vmi, "get")) curr = (vmi as any).get(pName);
				else curr = this._readPropValueSafe(p, "defaultValue") ?? this._readPropValueSafe(p, "initialValue");

				console.log(`   • ${pName} = ${JSON.stringify(curr)}`);
			}
		} catch (e) { console.log("dumpVMI error:", e); }
	}

	/** Safe enum setter on a VMI (by property + option name). */
	public static SetEnumOnVMI(vmi:ViewModelInstance, propName:string, optionName:string):boolean
	{
		try
		{
			const degug = true;
			if(degug) console.log(`SetEnumOnVMI: prop="${propName}", option="${optionName}"`);
			if(!vmi)
			{
				if(degug) console.log(`SetEnumOnVMI: BLOCK A`);
				return false;
			}
			// Read property metadata from VMI (preferred) or from VM bound to it, if accessible
			const props = this._isFn(vmi, "getProperties") ? (vmi as any).getProperties() : null;
			if(degug) console.log("SetEnumOnVMI: props", props);
			if (!Array.isArray(props)) { console.log("SetEnumOnVMI: no property metadata"); return false; }

			const p = props.find((pp:any) => pp?.name === propName);
			if (!p) { console.log(`SetEnumOnVMI: prop "${propName}" not found`); return false; }

			if(degug) console.log("SetEnumOnVMI: p=", p);

			let options:any[]|undefined;
			if (Array.isArray(p?.options)) options = p.options;
			else if (this._isFn(p, "options")) options = p.options();

			if (!options || options.length === 0) { console.log(`SetEnumOnVMI: "${propName}" is not an enum or no options`); return false; }

			const match = options.find((o:any) => (o?.name ?? o) === optionName || (typeof o === "string" && o === optionName));
			if (!match) { console.log(`SetEnumOnVMI: option "${optionName}" not found in ${JSON.stringify(options)}`); return false; }

			// Apply: try named setter, then generic set
			if (this._isFn(vmi, "setPropertyValue")) { (vmi as any).setPropertyValue(propName, match?.value ?? match); return true; }
			if (this._isFn(vmi, "set")) { (vmi as any).set(propName, match?.value ?? match); return true; }

			// As a last resort, try write-through to property object (may be no-op if engine ignores)
			if ("value" in p) { p.value = match?.value ?? match; return true; }

			console.log(`SetEnumOnVMI: no setter available for "${propName}"`);
			return false;
		} catch (e) { console.log("SetEnumOnVMI error:", e); return false; }
	}

	public static GetEnumIndexMap(vmi:ViewModelInstance, propName:string): Record<string, number>
	{
		console.log('GetEnumIndexMap----) 1)) * ');
		const props = (vmi as any).getProperties?.() ?? [];
		console.log('GetEnumIndexMap----) 2)) * ',props);
		const p = props.find((pp:any) => pp?.name === propName);
		console.log('GetEnumIndexMap----) 3)) * ',p);
		if (!p) return {};
		console.log('GetEnumIndexMap----) 4)) * ');
		let raw:any[]|undefined;
		if (Array.isArray(p?.options)) raw = p.options;
		else if (typeof p?.options === "function") raw = p.options();

		console.log('GetEnumIndexMap----) 5)) * ',raw);
		const map:Record<string,number> = {};
		(raw ?? []).forEach((o:any, idx:number) => {
			const name  = typeof o === "string" ? o : (o?.name ?? String(idx));
			const value = typeof o === "number" ? o : (o?.value ?? idx);
			map[name] = value;
		});
		console.log('GetEnumIndexMap----) 6)) * ',map);
		return map;
	}

	//public static SetEnumOnVMI(vmi: ViewModelInstance, propName: string, option: string | number): boolean
	//{
	//	try
	//	{
	//		console.log('SetEnumOnVMI---->>>> 1)) * ');
	//		if (!vmi) return false;
	//		console.log('SetEnumOnVMI---->>>> 2)) * ');
	//		let resolved: number | undefined;

	//		console.log('SetEnumOnVMI---->>>> 3)) * ');
	//		if (typeof option === "number")
	//		{
	//			console.log('SetEnumOnVMI---->>>> 4)) * ');
	//			resolved = option;
	//		}
	//		else
	//		{
	//			console.log('SetEnumOnVMI---->>>> 5)) * ',propName);
	//			const map = this.GetEnumIndexMap(vmi, propName);
	//			console.log('SetEnumOnVMI---->>>> 6)) * m=',map);
	//			console.log('SetEnumOnVMI---->>>> 6)) * o=',option);
	//			if(option in map)
	//			{
	//				console.log('SetEnumOnVMI---->>>> 7)) * ');
	//				resolved = map[option];
	//			}
	//			else if (/^\d+$/.test(option))
	//			{
	//				console.log('SetEnumOnVMI---->>>> 8)) * ');
	//				resolved = parseInt(option, 10);
	//			}
	//		}
	//		console.log('SetEnumOnVMI---->>>> 9)) * ');
	//		if (resolved === undefined) { console.log(`SetEnumOnVMI: can't resolve`, propName, option); return false; }

	//		if ((vmi as any).setPropertyValue) { (vmi as any).setPropertyValue(propName, resolved); (vmi as any).commit?.(); return true; }
	//		if ((vmi as any).set)             { (vmi as any).set(propName, resolved);             (vmi as any).commit?.(); return true; }

	//		// last resort:
	//		const p = (vmi as any).getProperties?.().find((pp:any)=>pp?.name===propName);
	//		if (p && "value" in p) { p.value = resolved; (vmi as any).commit?.(); return true; }
	//		return false;
	//	} catch (e) { console.log("SetEnumOnVMI error:", e); return false; }
	//}

	public static SetEnum(file:RiveFile, artboard:Artboard, propName:string, optionName:string, vmName?:string): boolean
	{
		const debug = this._debug || false;
		if (debug) console.log(`SetEnum: artboard="${artboard?.name}", prop="${propName}", option="${optionName}", vm="${vmName}"`);

		const vm = this.PickBestViewModel(file, artboard, vmName);
		if (!vm) return false;
		const vmi = this.MakeBestVMI(vm, artboard);
		if (!vmi) return false;
		if (this._isFn(artboard, "bindViewModelInstance")) (artboard as any).bindViewModelInstance(vmi);
		return this.SetEnumOnVMI(vmi, propName, optionName);
	}

	/** High-level: dump everything relevant for a file/artboard/VM/VMI. */
	public static DumpRiveDiagnostics(file:RiveFile, artboard:Artboard, vm:ViewModel | null, vmi:ViewModelInstance | null)
	{
		console.log("");
		console.log("============== RIVE DIAGNOSTICS ==============");
		console.log("Artboard:", artboard?.name, " DPRUsed:", (artboard as any)?.devicePixelRatioUsed);
		this.DumpEnums(file);

		if (this._isFn(file, "viewModelCount") && this._isFn(file, "viewModelByIndex")) {
			const count = (file as any).viewModelCount();
			console.log("📚 ViewModels (count:", count, "):");
			for (let i=0;i<count;i++) {
				const vmI = (file as any).viewModelByIndex(i);
				this.DumpViewModel(vmI);
			}
		} else {
			console.log("No viewModelCount/viewModelByIndex on file.");
		}

		if (vm) {
			console.log("— Selected VM —");
			this.DumpViewModel(vm);
		} else {
			console.log("No VM selected for this artboard.");
		}

		if (vmi) {
			console.log("— Bound VMI —");
			this.DumpVMI(vmi);
		} else {
			console.log("No VMI bound.");
		}
		console.log("==============================================");
	}

	/** Try to discover enum name→index mapping even if the property lacks .options. */
public static ProbeEnumIndexMap(
	vmi: ViewModelInstance,
	propName: string,
	maxCandidates = 16
): Record<string, number> {
	const map: Record<string, number> = {};
	try {
		const enumAccessor = (vmi as any).enum?.(propName);
		if (!enumAccessor) return map;

		// Remember the current name to restore later
		const originalName: string | undefined = enumAccessor.value;

		// Try indices 0..maxCandidates-1; build mapping from name → index
		for (let i = 0; i < maxCandidates; i++) {
			try {
				// Prefer numeric setter at the VMI level so SMs see the index
				if (typeof (vmi as any).setPropertyValue === "function") {
					(vmi as any).setPropertyValue(propName, i);
				} else if (typeof (vmi as any).set === "function") {
					(vmi as any).set(propName, i);
				} else {
					// last resort: write through the enum accessor if it accepts numbers
					enumAccessor.value = i;
				}
				(vmi as any).commit?.();

				const nameNow: string | undefined = (vmi as any).enum?.(propName)?.value;
				if (typeof nameNow === "string") {
					// stop if we looped back to the first discovered name
					if (nameNow in map && map[nameNow] !== i) break;
					map[nameNow] = i;
				} else {
					// if runtime stops changing, we’re done
					break;
				}
			} catch {
				break;
			}
		}

		// restore original name if we had one
		if (originalName !== undefined) {
			if (typeof (vmi as any).setPropertyValue === "function") {
				(vmi as any).setPropertyValue(propName, map[originalName] ?? originalName);
			} else if (typeof (vmi as any).set === "function") {
				(vmi as any).set(propName, map[originalName] ?? originalName);
			} else {
				enumAccessor.value = originalName as any;
			}
			(vmi as any).commit?.();
		}
	} catch {}
	return map;
}

/** Name or index → index, with probe fallback. */
public static ResolveEnumIndex(
	vmi: ViewModelInstance,
	propName: string,
	option: string | number
): number | undefined {
	if (typeof option === "number") return option;
	// try metadata first
	const props = (vmi as any).getProperties?.() ?? [];
	const p = props.find((pp:any) => pp?.name === propName);
	let raw:any[]|undefined;
	if (Array.isArray(p?.options)) raw = p.options;
	else if (typeof p?.options === "function") raw = p.options();
	if (raw && raw.length) {
		for (let i = 0; i < raw.length; i++) {
			const o = raw[i];
			const name = typeof o === "string" ? o : (o?.name ?? String(i));
			if (name.toUpperCase() === option.toUpperCase()) return (typeof o === "number" ? o : (o?.value ?? i));
		}
	}
	// no options: probe
	const map = this.ProbeEnumIndexMap(vmi, propName);
	return map[option] ?? (/^\d+$/.test(option) ? parseInt(option, 10) : undefined);
}

	public static HexToRgb(hex:string, alpha:number = 255): { r: number; g: number; b: number; a: number } | null
	{
		if (!hex) return null;

		hex = hex.trim().replace(/^#/, '');
		if (/^0x/i.test(hex)) hex = hex.slice(2); // allow 0xRRGGBB[AA]

		// Expand shorthand #RGB -> #RRGGBB and #RGBA -> #RRGGBBAA
		if (hex.length === 3) {
			hex = hex.split('').map(c => c + c).join(''); // RGB -> RRGGBB
		} else if (hex.length === 4) {
			hex = hex.split('').map(c => c + c).join(''); // RGBA -> RRGGBBAA
		}

		let r = 0, g = 0, b = 0, a = alpha;

		if (hex.length === 6) {
			r = parseInt(hex.slice(0, 2), 16);
			g = parseInt(hex.slice(2, 4), 16);
			b = parseInt(hex.slice(4, 6), 16);
			// no alpha in hex -> use param 'alpha' (already set)
		} else if (hex.length === 8) {
			r = parseInt(hex.slice(0, 2), 16);
			g = parseInt(hex.slice(2, 4), 16);
			b = parseInt(hex.slice(4, 6), 16);
			a = parseInt(hex.slice(6, 8), 16); // 00..FF -> 0..255
		} else {
			return null; // invalid hex length
		}

		// Clamp just in case
		r = Math.max(0, Math.min(255, r));
		g = Math.max(0, Math.min(255, g));
		b = Math.max(0, Math.min(255, b));
		a = Math.max(0, Math.min(255, a));

		return { r, g, b, a };
	}

	public static HexToArgb(hex: string, alpha: number = 255): [number, number, number, number]
	{
		const c = this.HexToRgb(hex, alpha);
		// Fallback to opaque white if invalid input
		const r = c?.r ?? 255;
		const g = c?.g ?? 255;
		const b = c?.b ?? 255;
		const a = c?.a ?? 255;
		return [a, r, g, b];
	}

	public static GetUniqueColor(index: number): string
	{
		if (this.ColorPalette[index]) return this.ColorPalette[index];

		const hue = Math.floor((360 / 50) * (index - 28)); // rotate hue for fallback
		return `hsl(${hue}, 70%, 50%)`;
	}

	public static IsObjectIdLike(obj: any):boolean
	{
		return obj && typeof obj === "object" && obj.buffer;
	}

	public static ToObjectIdString(maybeId:any):string
	{
		if (typeof maybeId === "string") return maybeId;
		if (this.IsObjectIdLike(maybeId))
		{
			const buffer = Object.values(maybeId.buffer) as number[];
			return buffer.map(b => b.toString(16).padStart(2, "0")).join("");
		}
		return "";
	}

	public static ColorPalette: { [key: number]: string } =
	{
		0: '#ff7300',
		1: '#8884d8',
		2: '#82ca9d',
		3: '#0088FE',
		4: '#ffe119',
		5: '#FF8042',
		6: '#e6194b',
		7: '#ffbb28',
		8: '#3cb44b',
		9: '#00C49F',
		10: '#4363d8',
		11: '#f58231',
		12: '#911eb4',
		13: '#46f0f0',
		14: '#f032e6',
		15: '#bcf60c',
		16: '#fabebe',
		17: '#008080',
		18: '#e6beff',
		19: '#9a6324',
		20: '#fffac8',
		21: '#800000',
		22: '#aaffc3',
		23: '#808000',
		24: '#ffd8b1',
		25: '#000075',
		26: '#808080',
		27: '#000000'
	};


}
