/**
 * Random Villager Creator - Main Application
 */

class RandomVillagerApp {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.rerollBtn = document.getElementById("reroll-btn");
        this.loading = document.getElementById("loading");
        this.silhouette = document.getElementById("silhouette");
        this.attrForm = document.getElementById("attr-form");

        this.renderer = null;
        this.randomizer = null;
        this.followerData = null;
        this.audioContext = null;
        this.isShuffling = false;

        this.shuffleFrames = 8;
        this.shuffleBaseDelay = 50;
        this.shuffleMaxDelay = 200;
    }

    async init() {
        try {
            this.resizeCanvas();
            window.addEventListener("resize", () => this.resizeCanvas());

            this.followerData = await fetch("data/follower-data.json").then(r => r.json());
            this.randomizer = new VillagerRandomizer(this.followerData);

            this.renderer = new SpineRenderer(this.canvas);
            await this.renderer.init();
            this.renderer.resize();

            this.loading.classList.add("hidden");
            this.rerollBtn.disabled = false;

            this.setupEventListeners();
            this.renderer.start();
            this.onRerollClick();

        } catch (error) {
            console.error("Failed to initialize:", error);
            this.loading.innerHTML = `<span style="color: #a03020;">Failed to load. Please refresh.</span>`;
        }
    }

    setupEventListeners() {
        this.rerollBtn.addEventListener("click", () => this.onRerollClick());
        document.addEventListener("keydown", (e) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                this.onRerollClick();
            }
        });
    }

    async onRerollClick() {
        if (this.isShuffling || this.rerollBtn.disabled) return;

        this.isShuffling = true;
        this.rerollBtn.disabled = true;
        this.playClickSound();
        this.silhouette.classList.add("hidden");

        await this.shuffleAnimation();

        this.rerollBtn.disabled = false;
        this.isShuffling = false;
    }

    async shuffleAnimation() {
        const configs = this.randomizer.generateMultiple(this.shuffleFrames);

        for (let i = 0; i < configs.length; i++) {
            this.renderer.applyConfig(configs[i], this.followerData);
            this.attrForm.textContent = this.followerData.forms[configs[i].form].name || configs[i].form;

            const progress = i / (configs.length - 1);
            const delay = this.shuffleBaseDelay + (this.shuffleMaxDelay - this.shuffleBaseDelay) * (progress * (2 - progress));

            if (i < configs.length - 1) this.playShuffleSound();
            await new Promise(r => setTimeout(r, delay));
        }

        this.playLandSound();
    }

    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = wrapper.clientWidth * dpr;
        this.canvas.height = wrapper.clientHeight * dpr;
        this.canvas.style.width = wrapper.clientWidth + "px";
        this.canvas.style.height = wrapper.clientHeight + "px";

        if (this.renderer) this.renderer.resize();
    }

    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    playClickSound() { this.playSound(800, 0.08); }
    playShuffleSound() { this.playSound(600 + Math.random() * 200, 0.03); }
    playLandSound() {
        this.playSound(1000, 0.12);
        setTimeout(() => this.playSound(1200, 0.08), 50);
    }

    playSound(frequency, duration) {
        try {
            const ctx = this.getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "square";
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }
}

document.addEventListener("DOMContentLoaded", () => new RandomVillagerApp().init());
