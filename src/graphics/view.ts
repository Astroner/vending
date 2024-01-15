import * as THREE from "three";
import { Assets, View } from "./types";
import { OrbitControls, TextGeometry } from "three/examples/jsm/Addons.js";

export type Configuration = {
    canvas: HTMLCanvasElement,
    assets: Assets,
    width: number,
    height: number,
    initialText: string;
}

export type ViewEventTemplate<T extends string, Data = {}> = Data & {
    type: T;
}

export type CanvasEvent = 
    | ViewEventTemplate<"numberPressed", {
        key: number
    }>
    | ViewEventTemplate<"okPressed">
    | ViewEventTemplate<"resetPressed">
    | ViewEventTemplate<"numpadAreaClicked">
    | ViewEventTemplate<"keyHover">
    | ViewEventTemplate<"keyLeave">

export type ViewEventListener = (e: CanvasEvent) => void;

export type MovingCoin = {
    coin: THREE.Object3D,
    animationMixer: THREE.AnimationMixer
}

export type SlotInfo = {
    slot: number;
    id: string;
    group: THREE.Group;
}

export type CameraPosition = "front" | "numpad";

export class CanvasView implements View {
    private eventListeners = new Set<ViewEventListener>()
    private slotsMap = new Map<number, SlotInfo>();

    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private raycaster = new THREE.Raycaster()
    private scene = new THREE.Scene();
    private clock = new THREE.Clock();

    private displayText: THREE.Mesh | null = null;
    private itemsClippingPlanes: THREE.Plane[] | null = null;
    private shiftPerItem: number | null = null;

    private mouse = new THREE.Vector2();

    private animations = new Set<THREE.AnimationMixer>()
    private hatchAnimation: THREE.AnimationAction | null = null;

    private currentCameraPosition: CameraPosition = "front";

    private buttonAnimations = new Map<string, THREE.AnimationAction>();

    constructor(private config: Configuration) {
        this.camera = new THREE.PerspectiveCamera(45, config.width / config.height);
        this.camera.position.x = 2;
        this.camera.position.y = 2;
        // this.camera.position.z = -10;

        
        this.renderer = new THREE.WebGLRenderer({ canvas: config.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x0000a0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.localClippingEnabled = true;
    }

    start() {
        this.renderer.domElement.addEventListener("mousemove", this.mouseMoveHandler);
        this.renderer.domElement.addEventListener("click", this.mouseClickHandler);

        this.initScene();

        const orbit = new OrbitControls(this.camera, this.renderer.domElement);

        this.renderer.setAnimationLoop(() => {
            this.renderer.render(this.scene, this.camera);

            const delta = this.clock.getDelta();

            for(const anim of this.animations) {
                anim.update(delta);
            }

            orbit.update();
        })
    }

    destroy() {
        this.renderer.domElement.removeEventListener("mousemove", this.mouseMoveHandler);
        this.renderer.domElement.removeEventListener("click", this.mouseClickHandler);

        this.renderer.dispose();
    }

    insertCoin() {
        const coin = this.config.assets.coin.clone();
        coin.visible = true;
        this.scene.add(coin);

        const animationMixer = new THREE.AnimationMixer(coin);
        const clip = animationMixer.clipAction(this.config.assets.coinAnimation.clone()).play();
        clip.loop = THREE.LoopOnce;

        animationMixer.addEventListener('finished', () => {
            this.animations.delete(animationMixer);
            coin.removeFromParent();
        })

        this.animations.add(animationMixer);
    }

    setText(text: string) {
        if(!this.displayText) return;

        const geometry = new TextGeometry(text, {
            font: this.config.assets.displayFont,
            size: .1,
            height: 2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5
        });

        this.displayText.geometry = geometry;
    }

    setSize(width: number, height: number) {
        this.renderer.setSize(width, height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    setSlot(slot: number, id: string, color: number, items: number) {
        if(!this.itemsClippingPlanes) return;
        
        const proto = this.config.assets.items.get(slot);

        if(!proto) throw new Error("Unsupported slot " + slot);        

        const group = new THREE.Group();

        const material = proto.material.clone();
        material.color.set(color);


        material.clippingPlanes = this.itemsClippingPlanes;

        let nextPosition = proto.position.clone();
        for(let i = 0; i < items; i++) {
            const newItem = proto.clone();
            newItem.visible = true;
            newItem.material = material;
            newItem.position.copy(nextPosition);
            group.add(newItem);

            nextPosition = nextPosition.clone();
            nextPosition.x -= .1;
        }

        const prevSlot = this.slotsMap.get(slot);
        if(prevSlot) {
            prevSlot.group.removeFromParent();
        }
        this.slotsMap.set(slot, {
            group,
            id,
            slot
        });

        this.scene.add(group);
    }

    openCloseHatch() {
        if(!this.hatchAnimation) return;

        this.hatchAnimation.reset();
        this.hatchAnimation.play();
    }

    addEventListener(cb: ViewEventListener) {
        this.eventListeners.add(cb);

        return {
            unsubscribe: () => {
                this.eventListeners.delete(cb);
            }
        }
    }

    getCameraPosition(): CameraPosition {
        return this.currentCameraPosition;
    }

    setCameraPosition(position: CameraPosition) {
        const animation = this.config.assets.cameraTracks[this.currentCameraPosition][position];
        
        const mixer = new THREE.AnimationMixer(this.camera);

        const action = mixer.clipAction(animation);
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
        action.play();
        
        this.animations.add(mixer);
        
        mixer.addEventListener("finished", () => {
            this.animations.delete(mixer);
        })

        this.currentCameraPosition = position;

        switch(this.currentCameraPosition) {
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
    }

    giveChange(coins: number) {
        for(let i = 0; i < coins; i++) {
            const coin = this.config.assets.changeCoin.clone(true);

            const mixer = new THREE.AnimationMixer(coin);
            this.animations.add(mixer);
            mixer.addEventListener("finished", () => {
                this.animations.delete(mixer);
                coin.removeFromParent();
            })

            const action = mixer.clipAction(this.config.assets.changeCoinAnimation);
            action.loop = THREE.LoopOnce;
            action.startAt(i / 6);
            action.play();

            this.scene.add(coin);
        }
    }

    dropItem(slot: number) {
        if(!this.shiftPerItem) return;

        const slotInfo = this.slotsMap.get(slot);

        if(!slotInfo) return;
        
        slotInfo.group.position.x += this.shiftPerItem;
    }

    private mouseMoveHandler = (e: MouseEvent) => {
        this.mouse.set(e.clientX / this.renderer.domElement.clientWidth, e.clientY / this.renderer.domElement.clientHeight);

        this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x * 2 - 1, this.mouse.y * -2 + 1), this.camera);

        if(this.currentCameraPosition === "front") {
            const [hits] = this.raycaster.intersectObject(this.config.assets.numpadHighlight.plane);

            if(hits) {
                this.config.assets.numpadHighlight.square.material.opacity = 1;
                this.sendEvent({ type: "keyHover" });
            } else {
                this.config.assets.numpadHighlight.square.material.opacity = 0;
                this.sendEvent({ type: "keyLeave" });
            }

            return;
        } else {
            this.config.assets.numpadHighlight.square.material.opacity = 0;
        }

        const [intersection] = this.raycaster.intersectObjects(this.config.assets.numbers.concat([this.config.assets.okBtn, this.config.assets.resetBtn]));
        
        if(intersection && intersection.object.parent) {
            this.sendEvent({ type: "keyHover" })
        } else {
            this.sendEvent({ type: "keyLeave" })
        }
    }

    private mouseClickHandler = (e: MouseEvent) => {
        this.mouse.set(e.clientX / this.renderer.domElement.clientWidth, e.clientY / this.renderer.domElement.clientHeight);

        this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x * 2 - 1, this.mouse.y * -2 + 1), this.camera);

        if(this.currentCameraPosition === "front") {
            const [hits] = this.raycaster.intersectObject(this.config.assets.numpadHighlight.plane);

            if(hits) {
                this.sendEvent({ type: "numpadAreaClicked" })   
            }

            return;
        }

        const [intersection] = this.raycaster.intersectObjects(this.config.assets.numbers.concat([this.config.assets.okBtn, this.config.assets.resetBtn]));

        if(intersection && intersection.object.parent) {
            const action = this.buttonAnimations.get(intersection.object.parent.name);
            if(action) {
                action.reset();
                action.play();
            }

            if(!isNaN(+intersection.object.parent.name)) this.sendEvent({ type: "numberPressed", key: +intersection.object.parent.name })
            else if(intersection.object.parent.name === "ok") this.sendEvent({ type: "okPressed" })
            else this.sendEvent({ type: "resetPressed" })
        }
    }

    private initScene() {
        this.camera.position.copy(this.config.assets.cameras.front.position);
        this.camera.rotation.copy(this.config.assets.cameras.front.rotation);
        console.log(this.config.assets.numbers);

        const sky = new THREE.HemisphereLight(0xffffff, 0x0000ff);
        this.scene.add(sky);

        const projector = new THREE.DirectionalLight(0xffffff, 2);
        projector.position.set(2, 8, 0);
        projector.target.position.set(0, 0, 0);
        projector.castShadow = true;
        this.scene.add(projector.target)
        this.scene.add(projector);

        const projectorHelper = new THREE.DirectionalLightHelper(projector);
        this.scene.add(projectorHelper);

        this.scene.add(this.config.assets.scene);

        this.config.assets.body.castShadow = true;

        this.config.assets.glass.material.transparent = true;
        this.config.assets.glass.material.opacity = 0.5;

        this.config.assets.floor.receiveShadow = true;


        const geometry = new TextGeometry(this.config.initialText, {
            font: this.config.assets.displayFont,
            size: .1,
            height: 2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5
        });

        const mesh = new THREE.Mesh(geometry, [
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        ])

        mesh.rotateY(Math.PI / 2);

        mesh.position.set(-10.92, 4.22, -1.4);

        this.scene.add(mesh);

        this.displayText = mesh;


        this.config.assets.coin.visible = false;


        for(const item of this.config.assets.items.values()) {
            item.visible = false;
        }

        const itemBox = new THREE.Box3().setFromObject(this.config.assets.items.get(1)!);
        this.shiftPerItem = itemBox.max.x - itemBox.min.x + .027;


        const box = new THREE.Box3().setFromObject(this.config.assets.shelves[0]);

        this.itemsClippingPlanes = [
            new THREE.Plane(new THREE.Vector3(1, 0, 0), box.max.x),
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), -box.min.x + .17),
        ];

        for(const plane of this.itemsClippingPlanes) {
            this.scene.add(new THREE.PlaneHelper(plane, 15, 0xff0000));
        }


        const hatchAnimationMixer = new THREE.AnimationMixer(this.config.assets.hatch);
        this.hatchAnimation = hatchAnimationMixer.clipAction(this.config.assets.hatchAnimation);
        this.hatchAnimation.loop = THREE.LoopOnce;
        this.animations.add(hatchAnimationMixer);


        for(const obj of Object.values(this.config.assets.cameras)) {
            obj.material.wireframe = true;
        }


        for(const obj of this.config.assets.numbers.concat([this.config.assets.okBtn, this.config.assets.resetBtn])) {
            const mixer = new THREE.AnimationMixer(obj);
            this.animations.add(mixer);

            const action = mixer.clipAction(this.config.assets.buttonPressAnimation);
            action.loop = THREE.LoopOnce;

            this.buttonAnimations.set(obj.name, action);
        }


        this.config.assets.numpadHighlight.plane.material.transparent = true;
        this.config.assets.numpadHighlight.plane.material.opacity = 0;

        this.config.assets.numpadHighlight.square.material.transparent = true;
        this.config.assets.numpadHighlight.square.material.opacity = 0;
    }

    private sendEvent(e: CanvasEvent) {
        for(const listener of this.eventListeners) {
            listener(e);
        }
    }
}