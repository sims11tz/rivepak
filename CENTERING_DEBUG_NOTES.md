# RivePak Centering Debug Notes - Resume Tomorrow

## What We Accomplished Today ✅

### 1. OBJECT_SCALE_ALIGN.TOP_CENTER - FULLY WORKING!
We successfully implemented horizontal centering for stretch mode. The key insight was understanding that when `scaleMode: STRETCH`, the artboard maintains its aspect ratio while fitting to canvas height, so the rendered width is **constant** regardless of browser width.

**The Working Formula:**
```typescript
const offsetNumber = (PixiController.get().PixiAbove.view.width - test1.maxX) / 2;
test1.minX = test1.minX + offsetNumber;
test1.maxX = test1.maxX + offsetNumber;
```

**Why it works:**
- The artboard stretches to fit canvas HEIGHT (fixed at ~1666px with dpr=2)
- This means rendered width is always **2937px** (maintaining 1920:1080 aspect ratio)
- We calculate how much wider the canvas is than the rendered artboard
- Divide by 2 to center it
- Shift BOTH edges (minX and maxX) by the same amount to translate the whole artboard

**Test Results:** Works perfectly at all browser widths (tested 1890px, 3214px, etc.)

---

## What We're Debugging Now 🔍

### 2. OBJECT_SCALE_ALIGN.CENTER - Horizontal ✅, Vertical ❌

**Current Implementation:**
```typescript
// Horizontal centering (WORKS)
const offsetWNumber = (RiveController.get().Canvas.width - test1.maxX) / 2;
test1.minX = test1.minX + offsetWNumber;
test1.maxX = test1.maxX + offsetWNumber;

// Vertical centering (HAS ISSUES)
const offsetHNumber = (RiveController.get().Canvas.height - test1.maxY) / 2;
test1.minY = test1.minY + offsetHNumber;
test1.maxY = test1.maxY + offsetHNumber;
```

---

## The Problem

The vertical centering formula **looks mathematically correct** (same pattern as horizontal), but visual results are wrong:

### Test Case 1: Wide Rectangle (1905 x 885) - Landscape
```
Browser: 1905 x 885
Canvas: 3814 x 1666 (with dpr=2)
test1.maxY=1666, canvasHeight=1666
Offset H=0 ✓ (correct - fills height)
```
**Problem:** Pink rectangle is TOO HIGH UP and CLIPPED at the top
**Screenshot:** Shows artboard at top of screen with black space below

### Test Case 2: Tall Rectangle (1050 x 1450) - Portrait
```
Browser: 1050 x 1450
Canvas: 2110 x 2802 (with dpr=2)
test1.maxY=1187, canvasHeight=2802
Offset H=807.5
```
**Problem:** Pink rectangle is TOO FAR DOWN
**Screenshot:** Shows artboard in lower portion with black space above

### Test Case 3: Square-ish (1000 x 1450) - Almost Square
```
Browser: 1000 x 1450
Canvas: 2006 x 2802 (with dpr=2)
test1.maxY=1128, canvasHeight=2802
Offset H=837
```
**Result:** Looks pretty damn good! ✓

---

## Key Observations

1. **Landscape (wide) mode:**
   - Artboard fills HEIGHT completely (test1.maxY = canvasHeight)
   - Offset = 0 (correct, no vertical centering needed)
   - BUT visually it's clipped at top with black space below
   - This suggests the canvas itself might not be filling the viewport!

2. **Portrait (tall) mode:**
   - Artboard is narrower than canvas (test1.maxY < canvasHeight)
   - Offset pushes it down
   - But it goes too far down

3. **Square-ish mode:**
   - Works well!
   - Similar to portrait but proportions are better

---

## Dave's Hypothesis Before Bed

The math looks correct, but visually something's off. Possible issues:

1. **CSS/Layout Issue:** The canvas might not be filling the viewport properly
   - In landscape, there's black space below the pink rectangle
   - This could mean the Rive canvas isn't centered in the viewport
   - We're centering the artboard within the canvas, but the canvas itself might not be centered in the viewport

2. **Aspect Ratio Switching:**
   - Landscape: artboard stretches to fit HEIGHT
   - Portrait: artboard stretches to fit WIDTH
   - The centering logic might need to detect which dimension is constraining

---

## What to Check Tomorrow

### 1. Investigate Canvas Positioning
Look at the CSS for the canvas elements:
- Is the Rive canvas filling the full viewport?
- Are there any CSS positioning/centering rules?
- Check in `/client/src/components/typers/game.tsx` or wherever the canvas is rendered

### 2. Add More Debug Logs
Before the offset calculation, log:
```typescript
console.log('Canvas actual dimensions:', RiveController.get().Canvas.width, RiveController.get().Canvas.height);
console.log('Window inner size:', window.innerWidth, window.innerHeight);
console.log('test1 bounds BEFORE offset:', test1.minY, test1.maxY);
```

### 3. Check Aspect Ratio Behavior
The artboard (1920x1080) has aspect ratio = 1.777...

When browser is:
- **Wide** (aspect > 1.777): Artboard constrained by HEIGHT → fills vertically, extra space horizontally
- **Tall** (aspect < 1.777): Artboard constrained by WIDTH → fills horizontally, extra space vertically

Maybe we need different centering logic based on which dimension is constrained?

### 4. Compare to TOP_CENTER
TOP_CENTER works perfectly for horizontal. The only difference is it doesn't do vertical centering. Can we see what the canvas layout looks like with TOP_CENTER in portrait vs landscape?

---

## Code Locations

**File:** `/Users/dgeurts/Projects/rivepak/src/canvasObjects/CanvasRiveObj.ts`

**TOP_CENTER (working):** Line ~1665-1674
**CENTER (debugging):** Line ~1675-1696

---

## Questions for Tomorrow

1. What does `scaleBounds:{ width: 1920, height: 1080 }` do in the RiveObj definition?
2. Is there a useCanvasEngine setting that controls canvas positioning in the viewport?
3. Should we check `window.innerWidth/innerHeight` vs `canvas.width/height`?

---

## User's Hardcoded Values That Worked

Dave found these hardcoded values worked:
- **~880px height:** `offsetHNumber = 285` worked great
- **~1200px height:** `offsetHNumber = 615` worked great

The difference (615-285=330) is close to the height difference (1200-880=320), suggesting there might be a simpler formula related to viewport size rather than canvas size.

---

## Good Night! 🌙

We made GREAT progress on horizontal centering today. The vertical issue is close - the math looks right, just need to figure out why the visual result doesn't match. My gut says it's either:
- A CSS/viewport issue
- Or we need to detect landscape vs portrait and adjust the formula

See you tomorrow!
