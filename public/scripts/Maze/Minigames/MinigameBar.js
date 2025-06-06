class MinigameBar {
    constructor(duration, onComplete) {
        this.duration = duration || 5000;
        this.onComplete = onComplete || null;
        this.progress = 0;
        this.active = false;
        this.paused = false;
        this.startTime = null;
        this.canHoldSpace = false;
    }

    configure(duration, onComplete) {
        if (this.active) return;
        if (duration !== undefined) this.duration = duration;
        if (onComplete !== undefined) this.onComplete = onComplete;
    }
    

    start() {
        if (!this.canHoldSpace) return;
        this.progress = 0;
        this.active = true;
        this.paused = false;
        this.startTime = millis();
    }

    stop() {
        this.progress = 0;
        this.active = false;
        this.paused = false;
        this.startTime = null;
    }
    

    pause() {
        if (this.active) {
            this.paused = true;
        }
    }

    resume() {
        if (this.paused) {
            this.paused = false;
            this.startTime = millis() - this.progress * this.duration;
        }
    }

    update(x, y, width, height) {
        if (!this.active || this.paused || !this.canHoldSpace) return;

        const elapsedTime = millis() - this.startTime;
        this.progress = constrain(elapsedTime / this.duration, 0, 1);

        if (this.progress >= 1) {
            this.complete();
        }

        this.draw(x, y, width, height)
    }

    complete() {
        this.active = false;
        isHoldingSpace = false;
        if (this.onComplete) this.onComplete();
    }

    draw(x, y, width, height) {
        if (this.active) {
            fill(0);
            rect(x - 2, y - 2, width + 4, height + 4);
    
            fill(50);
            rect(x, y, width, height);
    
            fill(255, 255, 255);
            rect(x, y, this.progress * width, height);
        }
    }
}