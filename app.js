/**
 * Random Villager Creator - Main Application
 */

class RandomVillagerApp {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.rerollBtn = document.getElementById("reroll-btn");
        this.loading = document.getElementById("loading");
        this.attrForm = document.getElementById("attr-form");

        this.renderer = null;
        this.randomizer = null;
        this.followerData = null;
        this.isShuffling = false;

        this.shuffleFrames = 8;
        this.shuffleBaseDelay = 50;
        this.shuffleMaxDelay = 200;

        // Preload sounds
        this.deathSound = new Audio("sounds/death.wav");
        this.spawnSound = new Audio("sounds/spawn.wav");
        this.deathSound.volume = 0.5;
        this.spawnSound.volume = 0.6;
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

            // Show initial villager
            const initialConfig = this.randomizer.generate();
            this.renderer.applyConfig(initialConfig, this.followerData);
            this.attrForm.textContent = this.followerData.forms[initialConfig.form].name || initialConfig.form;

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

        // Play death animation + sound
        this.deathSound.currentTime = 0;
        this.deathSound.play().catch(() => {});
        const deathDuration = this.renderer.playDeath(1.2);
        if (deathDuration > 0) {
            await new Promise(r => setTimeout(r, (deathDuration / 1.2) * 1000));
        }

        // Generate and apply new villager
        const finalConfig = this.randomizer.generate();
        this.renderer.applyConfig(finalConfig, this.followerData);
        this.attrForm.textContent = this.followerData.forms[finalConfig.form].name || finalConfig.form;

        // Play spawn animation + sound
        this.spawnSound.currentTime = 0;
        this.spawnSound.play().catch(() => {});
        const spawnDuration = this.renderer.playSpawnIn();
        if (spawnDuration > 0) {
            await new Promise(r => setTimeout(r, (spawnDuration / 1.5) * 1000));
        }

        // Shuffle through variations
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

            await new Promise(r => setTimeout(r, delay));
        }

        this.renderer.resetToIdle();
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
}

document.addEventListener("DOMContentLoaded", () => new RandomVillagerApp().init());
