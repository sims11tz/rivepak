export class RiveTimelineController {
    constructor(animationMeataDataId, anim, duration, name) {
        var _a, _b;
        this._playing = false;
        this._speed = 1;
        this._easeActive = false;
        this._easeElapsed = 0;
        this._easeDuration = 0;
        this._easeStart = 0;
        this._easeEnd = 0;
        this._anim = null;
        this._loopCount = 0;
        this._lastTimeForLoopCheck = 0;
        this._animationMeataDataId = animationMeataDataId;
        this._anim = anim;
        // Debug: Check what duration value we're receiving
        //console.log(`RiveTimelineController constructor called:`);
        //console.log(`  - duration parameter: ${duration}`);
        //console.log(`  - anim.duration: ${this._anim.duration}`);
        //console.log(`  - anim properties:`, Object.keys(this._anim));
        // Store the duration and name passed from AnimationMetadata
        // Check if duration is valid, otherwise use anim.duration
        if (duration !== undefined && duration > 0 && duration < 100000) {
            this._duration = duration;
        }
        else {
            // Try to get duration from the animation instance
            this._duration = (_a = this._anim.duration) !== null && _a !== void 0 ? _a : 10; // Default to 10 seconds if not found
            console.warn(`Duration was invalid (${duration}), using anim.duration: ${this._duration}`);
        }
        this._name = (_b = name !== null && name !== void 0 ? name : this._anim.name) !== null && _b !== void 0 ? _b : "";
        this.Pause();
        // Debug log to check values
        //console.log(`RiveTimelineController created: name=${this._name}, duration=${this._duration}s, fps=${this._fps}, frameCount=${this.FrameCount}`);
    }
    get _fps() {
        var _a;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (_a = this._anim.Fps) !== null && _a !== void 0 ? _a : 60;
    }
    get AnimationMetaDataId() { return this._animationMeataDataId; }
    get Animation() { return this._anim; }
    get TimeSeconds() { var _a, _b; return (_b = (_a = this._anim) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : 0; }
    get DurationSeconds() { return this._duration; }
    get Percent() {
        var _a, _b;
        const d = this._duration || 1;
        const time = (_b = (_a = this._anim) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : 0;
        // Handle looping animations - use modulo to wrap the percentage between 0-1
        const normalizedTime = time % d;
        return normalizedTime / d; // Returns 0-1
    }
    get Percent100() { return this.Percent * 100; } // Returns 0-100
    get Fps() { return this._fps; }
    get Frame() {
        var _a, _b;
        const time = (_b = (_a = this._anim) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : 0;
        return Math.min(Math.round(time * this._fps), 999999);
    }
    get FrameCount() {
        // Ensure we don't return an invalid frame count
        const count = Math.round(this._duration * this._fps);
        if (count < 0 || count > 999999 || !isFinite(count)) {
            console.warn(`Invalid frame count calculated: ${count}, duration: ${this._duration}, fps: ${this._fps}`);
            return 600; // Default to 600 frames (10 seconds at 60fps)
        }
        return count;
    }
    get RemainingSeconds() {
        var _a, _b;
        return Math.max(0, this._duration - ((_b = (_a = this._anim) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : 0));
    }
    get RemainingFrames() {
        return Math.max(0, this.FrameCount - this.Frame);
    }
    get IsPlaying() { return this._playing; }
    get IsEasing() { return this._easeActive; }
    get LoopCount() { return this._loopCount; }
    Play(speed = 1) { this._playing = true; this._speed = speed; }
    Pause() { this._playing = false; }
    ResetLoopCount() { this._loopCount = 0; }
    SeekSeconds(t) {
        if (this._anim == null)
            return;
        const clamped = Math.max(0, Math.min(this._duration, t));
        this._anim.time = clamped;
        this._anim.apply(1);
    }
    SeekPercent(p) { this.SeekSeconds(p * this._duration); }
    SeekFrame(f) { this.SeekSeconds(f / this._fps); }
    AdvanceFrame(n = 1) { var _a, _b; this.SeekSeconds(((_b = (_a = this._anim) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : 0) + n / this._fps); }
    EaseToPercent(p, duration = 0.5) {
        if (this._anim == null)
            return;
        this._easeStart = this._anim.time;
        this._easeEnd = Math.max(0, Math.min(1, p)) * this._duration;
        this._easeDuration = Math.max(0.001, duration);
        this._easeElapsed = 0;
        this._easeActive = true;
        this._playing = false;
    }
    Update(time, _frameCount, _onceSecond) {
        if (this._anim == null)
            return;
        //if(onceSecond) console.log('<'+frameCount+'>RiveTimelineController - ' + this._name);
        if (this._playing) {
            const previousTime = this._anim.time;
            //if(onceSecond) console.log('<'+frameCount+'>RiveTimelineController.playing --- '+(time * this._speed));
            this._anim.advance(time * this._speed);
            // Check if we've looped (current time is less than previous time)
            // This happens when the animation wraps from end to beginning
            if (this._anim.time < previousTime && this._duration > 0) {
                // We've completed a loop!
                this._loopCount++;
                //console.log(`Animation "${this._name}" completed loop #${this._loopCount}`);
            }
        }
        else {
            //if(onceSecond) console.log('<'+frameCount+'>RiveTimelineController NOT PLAYING');
        }
        if (this._easeActive) {
            this._easeElapsed += time;
            const a = Math.min(this._easeElapsed / this._easeDuration, 1);
            // easeInOutQuad
            const e = a < 0.5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2;
            this._anim.time = this._easeStart + (this._easeEnd - this._easeStart) * e;
            if (a >= 1)
                this._easeActive = false;
        }
        this._anim.apply(1);
    }
    Dispose() {
        this._anim = null;
    }
}
