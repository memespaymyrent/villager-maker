/**
 * Spine WebGL Renderer for Random Villager Creator
 */

class SpineRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: true
        });

        if (!this.gl) {
            throw new Error("WebGL not supported");
        }

        this.renderer = new spine.webgl.SceneRenderer(canvas, this.gl, true);
        this.skeleton = null;
        this.animationState = null;
        this.skeletonData = null;
        this.lastTime = 0;
        this.isRunning = false;
    }

    async loadTexture(path) {
        const response = await fetch(path);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const texture = new spine.webgl.GLTexture(this.gl, image);
                URL.revokeObjectURL(url);
                resolve(texture);
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`Failed to load texture: ${path}`));
            };
            image.src = url;
        });
    }

    async loadAtlas(atlasPath, textures) {
        const response = await fetch(atlasPath);
        const text = await response.text();
        return new spine.TextureAtlas(text, (path) => textures[path]);
    }

    async loadSkeleton(skeletonPath, atlas) {
        const response = await fetch(skeletonPath);
        const buffer = await response.arrayBuffer();
        const loader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonBinary = new spine.SkeletonBinary(loader);
        return skeletonBinary.readSkeletonData(new Uint8Array(buffer));
    }

    async init() {
        const texture = await this.loadTexture("assets/Follower.png");
        const atlas = await this.loadAtlas("assets/Follower.atlas", { "Follower.png": texture });
        this.skeletonData = await this.loadSkeleton("assets/Follower.skel", atlas);

        this.skeleton = new spine.Skeleton(this.skeletonData);
        const stateData = new spine.AnimationStateData(this.skeletonData);
        this.animationState = new spine.AnimationState(stateData);

        this.animationState.setAnimation(0, "idle", true);
        this.animationState.setAnimation(100, "Emotions/emotion-normal", true);

        this.skeleton.x = 0;
        this.skeleton.y = 0;
        this.skeleton.scaleX = 1;
        this.skeleton.scaleY = 1;
    }

    applyConfig(config, followerData) {
        const formData = followerData.forms[config.form];
        const clothingData = followerData.clothing[config.clothing];

        const formVariant = formData.variants[config.formVariantIdx];
        const clothingVariant = clothingData.variants[config.clothingVariantIdx];

        // Build combined skin
        const combinedSkin = new spine.Skin("RandomFollower");

        const formSkin = this.skeletonData.findSkin(formVariant);
        if (formSkin) combinedSkin.addSkin(formSkin);

        const clothingSkin = this.skeletonData.findSkin(clothingVariant);
        if (clothingSkin) combinedSkin.addSkin(clothingSkin);

        this.skeleton.setSkin(combinedSkin);
        this.skeleton.setToSetupPose();

        // Apply form colors
        if (formData.canBeTinted) {
            const colorSets = [...formData.sets, ...followerData.generalColorSets];
            const colorSet = colorSets[config.formColorSetIdx % colorSets.length];
            if (colorSet) this.applyColors(colorSet);
        }

        // Apply clothing colors
        if (clothingData.sets?.length > 0) {
            const clothingColorSet = clothingData.sets[config.clothingColorSetIdx % clothingData.sets.length];
            if (clothingColorSet) this.applyColors(clothingColorSet);
        }

        this.skeleton.updateWorldTransform();
    }

    applyColors(colorSet) {
        for (const { color, slots } of colorSet) {
            for (const slotName of slots) {
                const slotIndex = this.skeleton.findSlotIndex(slotName);
                if (slotIndex === -1) continue;

                const attachments = [];
                if (this.skeleton.skin) {
                    this.skeleton.skin.getAttachmentsForSlot(slotIndex, attachments);
                }

                for (const { attachment } of attachments) {
                    if (attachment?.color instanceof spine.Color) {
                        attachment.color.set(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
                    }
                }
            }
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.renderLoop();
    }

    renderLoop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.render(delta);
        requestAnimationFrame(() => this.renderLoop());
    }

    render(delta) {
        if (!this.skeleton || !this.animationState) return;

        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.animationState.update(delta);
        this.animationState.apply(this.skeleton);
        this.skeleton.updateWorldTransform();

        const { width, height } = this.canvas;
        this.renderer.camera.setViewport(width, height);
        this.gl.viewport(0, 0, width, height);

        this.renderer.camera.position.set(0, 180, 0);
        this.renderer.camera.zoom = 0.55;
        this.renderer.camera.update();

        this.renderer.begin();
        this.renderer.drawSkeleton(this.skeleton, false);
        this.renderer.end();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
    }
}
