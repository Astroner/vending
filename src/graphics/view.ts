import * as THREE from "three";
import { OrbitControls, TextGeometry } from "three/examples/jsm/Addons.js";

import { Assets, EventTemplate } from "./types";
import { ViewCamera } from "./camera";
import { VendingScene } from "./vending.scene";
import { wait } from "../helpers/wait";

export type Configuration = {
    canvas: HTMLCanvasElement;
    assets: Assets;
    width: number;
    height: number;
    initialText: string;
};

export type CanvasEvent =
    | EventTemplate<
          "numberPressed",
          {
              key: number;
          }
      >
    | EventTemplate<"okPressed">
    | EventTemplate<"resetPressed">
    | EventTemplate<"numpadAreaClicked">
    | EventTemplate<"keyHover">
    | EventTemplate<"keyLeave">
    | EventTemplate<"cameraChange", { position: CameraPosition }>
    | EventTemplate<"glassClick">
    | EventTemplate<"hatchClick">;

export type ViewEventListener = (e: CanvasEvent) => void;

export type MovingCoin = {
    coin: THREE.Object3D;
    animationMixer: THREE.AnimationMixer;
};

export type CameraPosition = "front" | "numpad";

export class View {
    static DEBUGGING = false;

    static CAMERA_ROTATION_AVAILABLE = Math.PI / 60;
    static CAMERA_ROTATION_SPEED_RATIO = 0.007;

    private eventListeners = new Set<ViewEventListener>();

    private camera: ViewCamera<CameraPosition>;
    private renderer: THREE.WebGLRenderer;
    private raycaster = new THREE.Raycaster();
    private scene = new THREE.Scene();
    private clock = new THREE.Clock();

    private mouse = new THREE.Vector2(0.5, 0.5);

    private animations = new Set<THREE.AnimationMixer>();
    private hatchAnimation: THREE.AnimationAction | null = null;

    private buttonAnimations = new Map<string, THREE.AnimationAction>();

    private useHighlights = true;
    private enableCameraAdjustment = true;

    private vendingScene: VendingScene;

    private fallAudio: THREE.Audio;
    private coinsAudio: THREE.Audio;

    constructor(private config: Configuration) {
        this.camera = new ViewCamera<CameraPosition>(
            "front",
            config.width / config.height,
            config.assets.cameras,
            config.assets.cameraTracks,
        );

        this.renderer = new THREE.WebGLRenderer({
            canvas: config.canvas,
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x0000a0);
        this.renderer.localClippingEnabled = true;

        this.vendingScene = new VendingScene(config.assets, config.initialText);

        this.initScene();

        const listener = new THREE.AudioListener();
        this.fallAudio = new THREE.Audio(listener);
        this.fallAudio.setBuffer(config.assets.fallSound);

        this.coinsAudio = new THREE.Audio(listener);
        this.coinsAudio.setBuffer(config.assets.coinsSound);
        this.coinsAudio.setVolume(1.2);
    }

    start() {
        this.renderer.domElement.addEventListener(
            "mousemove",
            this.mouseMoveHandler,
        );
        this.renderer.domElement.addEventListener(
            "click",
            this.mouseClickHandler,
        );

        const orbit =
            View.DEBUGGING &&
            new OrbitControls(this.camera, this.renderer.domElement);

        this.renderer.setAnimationLoop(() => {
            this.renderer.render(this.scene, this.camera);

            if (this.enableCameraAdjustment) this.moveCamera();

            const delta = this.clock.getDelta();

            for (const anim of this.animations) {
                anim.update(delta);
            }

            orbit && orbit.update();
        });
    }

    destroy() {
        this.renderer.domElement.removeEventListener(
            "mousemove",
            this.mouseMoveHandler,
        );
        this.renderer.domElement.removeEventListener(
            "click",
            this.mouseClickHandler,
        );

        this.renderer.dispose();
    }

    insertCoin() {
        const coin = this.config.assets.coin.clone();
        coin.visible = true;
        this.scene.add(coin);

        const animationMixer = new THREE.AnimationMixer(coin);
        const clip = animationMixer
            .clipAction(this.config.assets.coinAnimation.clone())
            .play();
        clip.loop = THREE.LoopOnce;

        animationMixer.addEventListener("finished", () => {
            this.animations.delete(animationMixer);
            coin.removeFromParent();
        });

        this.animations.add(animationMixer);
    }

    setDisplay(text: string) {
        this.vendingScene.setDisplay(text);
    }

    setSize(width: number, height: number) {
        this.renderer.setSize(width, height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    setSlot(slot: number, color: number, items: number) {
        this.vendingScene.setSlot(slot, color, items);
    }

    clearSlots() {
        this.vendingScene.clearSlots();
    }

    openCloseHatch() {
        if (!this.hatchAnimation) return;

        this.hatchAnimation.reset();
        this.hatchAnimation.play();
    }

    addEventListener(cb: ViewEventListener) {
        this.eventListeners.add(cb);

        return {
            unsubscribe: () => {
                this.eventListeners.delete(cb);
            },
        };
    }

    getCameraPosition(): CameraPosition {
        return this.camera.currentPosition;
    }

    setCameraPosition(position: CameraPosition) {
        const mixer = this.camera.setPosition(position);

        if (!mixer) return;
        this.animations.add(mixer);

        mixer.addEventListener("finished", () => {
            this.animations.delete(mixer);
        });

        switch (this.camera.currentPosition) {
            case "front":
                this.config.assets.numpadHighlight.plane.visible = true;
                this.config.assets.numpadHighlight.square.visible = true;
                this.sendEvent({ type: "keyLeave" });
                break;

            case "numpad":
                this.config.assets.numpadHighlight.plane.visible = false;
                this.config.assets.numpadHighlight.square.visible = false;
                break;
        }

        this.sendEvent({
            type: "cameraChange",
            position: this.camera.currentPosition,
        });
    }

    async dropChange(coins: number) {
        await wait(500);

        this.coinsAudio.play();

        for (let i = 0; i < coins; i++) {
            const coin = this.config.assets.changeCoin.clone(true);

            const mixer = new THREE.AnimationMixer(coin);
            this.animations.add(mixer);
            mixer.addEventListener("finished", () => {
                this.animations.delete(mixer);
                coin.removeFromParent();
            });

            const action = mixer.clipAction(
                this.config.assets.changeCoinAnimation,
            );
            action.loop = THREE.LoopOnce;
            action.startAt(i / 6);
            action.play();

            this.scene.add(coin);
        }
    }

    async dropItem(slot: number) {
        this.vendingScene.dropItem(slot);
        await wait(1000);
        this.fallAudio.play();
    }

    setHighlight(useHighlights: boolean) {
        this.useHighlights = useHighlights;
    }

    setCameraAdjustments(enableCameraAdjustment: boolean) {
        this.enableCameraAdjustment = enableCameraAdjustment;
    }

    private mouseMoveHandler = (e: MouseEvent) => {
        this.mouse.set(
            e.clientX / this.renderer.domElement.clientWidth,
            e.clientY / this.renderer.domElement.clientHeight,
        );

        this.raycaster.setFromCamera(
            new THREE.Vector2(this.mouse.x * 2 - 1, this.mouse.y * -2 + 1),
            this.camera,
        );

        if (this.useHighlights) this.handleHovers();
    };

    private handleHovers() {
        let hitsSomething = false;

        if (this.camera.currentPosition === "front") {
            const [hits] = this.raycaster.intersectObject(
                this.config.assets.numpadHighlight.plane,
            );

            if (hits) {
                this.config.assets.numpadHighlight.square.material.opacity = 1;
                hitsSomething = true;
            } else {
                this.config.assets.numpadHighlight.square.material.opacity = 0;
            }
        } else {
            this.config.assets.numpadHighlight.square.material.opacity = 0;
        }

        const [intersection] = this.raycaster.intersectObjects(
            this.config.assets.numbers.concat([
                this.config.assets.okBtn,
                this.config.assets.resetBtn,
            ]),
        );

        if (intersection && intersection.object.parent) {
            hitsSomething = true;
        }

        const [glassIntersection] = this.raycaster.intersectObject(
            this.config.assets.glass,
        );
        if (glassIntersection) {
            this.config.assets.glass.material.color.set(0xf1ff00);
            hitsSomething = true;
        } else {
            this.config.assets.glass.material.color.set(0xffffff);
        }

        const [hatchIntersection] = this.raycaster.intersectObject(
            this.config.assets.hatch,
        );
        if (hatchIntersection) {
            hitsSomething = true;
        }

        if (hitsSomething) {
            this.sendEvent({ type: "keyHover" });
        } else {
            this.sendEvent({ type: "keyLeave" });
        }
    }

    private mouseClickHandler = (e: MouseEvent) => {
        this.mouse.set(
            e.clientX / this.renderer.domElement.clientWidth,
            e.clientY / this.renderer.domElement.clientHeight,
        );

        this.raycaster.setFromCamera(
            new THREE.Vector2(this.mouse.x * 2 - 1, this.mouse.y * -2 + 1),
            this.camera,
        );

        if (this.camera.currentPosition === "front") {
            const [hits] = this.raycaster.intersectObject(
                this.config.assets.numpadHighlight.plane,
            );

            if (hits) {
                this.sendEvent({ type: "numpadAreaClicked" });

                return;
            }
        }

        const [intersection] = this.raycaster.intersectObjects(
            this.config.assets.numbers.concat([
                this.config.assets.okBtn,
                this.config.assets.resetBtn,
            ]),
        );

        if (intersection && intersection.object.parent) {
            const action = this.buttonAnimations.get(
                intersection.object.parent.name,
            );
            if (action) {
                action.reset();
                action.play();
            }

            if (!isNaN(+intersection.object.parent.name))
                this.sendEvent({
                    type: "numberPressed",
                    key: +intersection.object.parent.name,
                });
            else if (intersection.object.parent.name === "ok")
                this.sendEvent({ type: "okPressed" });
            else this.sendEvent({ type: "resetPressed" });

            return;
        }

        const [glassIntersection] = this.raycaster.intersectObject(
            this.config.assets.glass,
        );
        if (glassIntersection) {
            this.sendEvent({ type: "glassClick" });

            return;
        }

        const [hatchIntersection] = this.raycaster.intersectObject(
            this.config.assets.hatch,
        );
        if (hatchIntersection) {
            this.sendEvent({ type: "hatchClick" });

            return;
        }
    };

    private initScene() {
        this.scene.add(this.vendingScene);

        const hatchAnimationMixer = new THREE.AnimationMixer(
            this.config.assets.hatch,
        );

        this.hatchAnimation = hatchAnimationMixer.clipAction(
            this.config.assets.hatchAnimation,
        );

        this.hatchAnimation.loop = THREE.LoopOnce;
        this.animations.add(hatchAnimationMixer);

        for (const obj of Object.values(this.config.assets.cameras)) {
            if (View.DEBUGGING) obj.material.wireframe = true;
            else obj.visible = false;
        }

        for (const obj of this.config.assets.numbers.concat([
            this.config.assets.okBtn,
            this.config.assets.resetBtn,
        ])) {
            const mixer = new THREE.AnimationMixer(obj);
            this.animations.add(mixer);

            const action = mixer.clipAction(
                this.config.assets.buttonPressAnimation,
            );
            action.loop = THREE.LoopOnce;

            this.buttonAnimations.set(obj.name, action);
        }
    }

    private moveCamera() {
        const cameraDefaultRotation =
            this.config.assets.cameras[this.camera.currentPosition];

        const targetAngle = cameraDefaultRotation.rotation.clone();

        if (this.mouse.y < 0.2 || this.mouse.y > 0.8) {
            targetAngle.y +=
                (this.mouse.y * -2 + 1) * View.CAMERA_ROTATION_AVAILABLE;
        }

        this.camera.rotation.y +=
            (targetAngle.y - this.camera.rotation.y) *
            View.CAMERA_ROTATION_SPEED_RATIO;
    }

    private sendEvent(e: CanvasEvent) {
        for (const listener of this.eventListeners) {
            listener(e);
        }
    }
}
