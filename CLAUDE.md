Here you go — you can save this as MOBILE_RIVE_CRASH_DEBUG.md and hand it to Claude.

# Mobile Rive Crash – Debug & Fix Plan

## Context

- Project: **cookiesforfish.com** (React client using Rive + canvas/WebGL2 advanced runtime).
- Issue: Site works fine on **desktop Chrome/Firefox**, but on **iOS (Safari & Chrome)**:
  - The page briefly shows content, then the tab hard-crashes.
  - Chrome on iOS shows “Can’t open this page”.
- Using Safari Remote Web Inspector shows:
  - The request to `https://cookiesforfish.com/rive/fish_component.riv` starts,
  - `webgl2_advanced.wasm` and other assets load,
  - Then **the page process crashes** (`Webpage Crashed`) — no normal HTTP error.
- Sometimes, after multiple reloads, the page works, which suggests a **fragile runtime / memory issue**, not network / WAF.

Conclusion so far:
This is almost certainly **a Rive/WebGL issue specific to iOS**, triggered by `fish_component.riv` + the advanced runtime, rather than AWS / WAF / networking.

---

## Hypothesis

1. The **`fish_component.riv` scene is too heavy or hits a bug** in the advanced Rive runtime on iOS Safari.
2. iOS memory / GPU constraints or WebKit quirks cause the page to crash when that scene + `webgl2_advanced.wasm` are initialized.
3. Directly downloading the `.riv` file works (so the file is served correctly); the crash happens when JS/wasm tries to **load or render** it.

---

## Goals

1. **Stop mobile crashes immediately** (even if that means temporarily disabling the scene on iOS).
2. **Reduce risk** on iOS by:
   - Avoiding the advanced WebGL2 runtime on iOS.
   - Clamping `devicePixelRatio` so we don’t allocate massive canvases.
3. **Optionally** refactor/simplify `fish_component.riv` for mobile.

---

## Tasks for Claude

### 1. Add a reusable `isIOS` helper

Create a small utility function in a shared place (e.g. `src/utils/platform.ts`):

```ts
export const isIOS = (): boolean => {
 if (typeof navigator === 'undefined') return false;
 return /iPad|iPhone|iPod/.test(navigator.userAgent);
};


Make sure this is tree-shakeable and doesn’t break SSR (always guard with typeof navigator !== 'undefined').

2. TEMP: Disable the fish scene on iOS (safety switch)

Locate the main React component that mounts the fish game using fish_component.riv
(e.g. something like FishGameRoute, FishScene, FishComponent, etc.).

Wrap the Rive init/render with an iOS guard:

import { isIOS } from '@/utils/platform';

export const FishGameRoute: React.FC = () => {
 if (isIOS()) {
  // TEMP: Placeholder to keep mobile stable while debugging
  return (
   <div
    style={{
     color: '#fff',
     padding: '2rem',
     textAlign: 'center',
     fontFamily: 'system-ui',
    }}
   >
    Mobile version is under construction 🐟🍪
   </div>
  );
 }

 // Existing fish_component.riv Rive + canvas setup goes here
 // ...
};


Acceptance criteria for this step

On iOS Safari & Chrome:

https://cookiesforfish.com loads without crashing.

The placeholder renders instead of the game.

On desktop:

Behavior is unchanged.

Once this works, we’ve confirmed the crash is inside the fish scene path.

3. Gate the advanced Rive runtime on iOS

Wherever Rive is initialized with the webgl2 advanced runtime, introduce a feature flag based on isIOS().

Examples (adapt to actual API you use):

import { isIOS } from '@/utils/platform';

const useAdvancedRuntime = !isIOS(); // disable on iOS

// Pseudocode – adjust to the specific Rive setup in this project:

const rendererType = useAdvancedRuntime ? 'webgl2-advanced' : 'webgl';

const riveInstance = new Rive({
 canvas,
 src: '/rive/fish_component.riv',
 // or however src is provided
 rendererType,
 // ...other options
});


If your setup uses an options object or a runtime selector, implement the equivalent logic:

Desktop → advanced runtime enabled (as before).

iOS → fallback to default WebGL (or even Canvas runtime if that’s available in the library you’re using).

Acceptance criteria

With the fish scene re-enabled on iOS, using the non-advanced runtime:

The page consistently loads and does not crash.

Performance may be slightly lower, but still playable.

If it still crashes even without advanced runtime, keep the iOS placeholder from step 2 and proceed to further optimizations (below).

4. Clamp devicePixelRatio for the main canvas

Search the codebase for anywhere the canvas size is set using window.devicePixelRatio.
Typical patterns to modify:

Before (likely):
const dpr = window.devicePixelRatio || 1;

canvas.width = width * dpr;
canvas.height = height * dpr;

context.scale(dpr, dpr);

After (clamped):
const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
const dpr = Math.min(rawDpr, 2); // cap DPR at 2 to avoid huge buffers

canvas.width = width * dpr;
canvas.height = height * dpr;

context.scale(dpr, dpr);


Apply the same principle anywhere Rive/Pixi/WebGL canvases are sized.

Why: iPhones often have DPR = 3. A full-screen canvas at DPR 3 plus a heavy Rive scene can allocate massive GPU buffers and trigger an OOM → crash.

Acceptance criteria

No visual regressions on desktop.

On iOS, after re-enabling the fish scene with clamped DPR and non-advanced runtime, the page stays stable.

5. Rive file optimization (optional but recommended)

If we still see instability after the above:

Clone the fish_component.riv file inside Rive.

Create a lighter mobile variant, for example:

Remove unused artboards and animations.

Reduce texture sizes / image resolution.

Remove any unnecessary effects / filters.

Export as something like fish_component_mobile.riv.

Then update the loader:

import { isIOS } from '@/utils/platform';

const riveSrc = isIOS()
 ? '/rive/fish_component_mobile.riv'
 : '/rive/fish_component.riv';

const riveInstance = new Rive({
 canvas,
 src: riveSrc,
 // ...
});


Acceptance criteria

iOS uses the lighter scene and remains stable.

Desktop still uses the full blown fish_component.riv.

Logging & Verification

To make debugging easier, add global error logging in the browser:

if (typeof window !== 'undefined') {
 window.addEventListener('error', (event) => {
  console.log('Global error:', event.error || event.message);
 });

 window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled promise rejection:', event.reason);
 });
}


When testing on iOS via Safari Web Inspector:

Open Console tab.

Reload the page.

Confirm:

No new runtime errors appear as the scene loads.

The tab does not crash.

Summary of Work for Claude

Implement isIOS() helper.

Add temporary iOS guard around the fish game route/component so mobile gets a placeholder (quick safety fix).

Change Rive initialization so:

iOS does not use the advanced WebGL2 runtime.

Non-iOS remains unchanged.

Clamp devicePixelRatio for all Rive/canvas setups (cap at 2).

Test on:

Desktop Chrome/Firefox (should be unchanged).

iOS Safari/Chrome via remote debugging (page must no longer crash).

If needed, create and wire a lighter mobile-specific Rive file and use that on iOS.

Once all of this is in place and confirmed stable on iOS, we can remove or replace the placeholder and ship the full mobile experience.


If you want, after Claude makes changes you can send me the relevant code snippets (Rive init + canvas sizing) and I’ll sanity-check them.
::contentReference[oaicite:0]{index=0}


ChatGPT can make mistakes. Check important info.
