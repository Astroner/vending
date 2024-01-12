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

export type ViewEventListener = (e: CanvasEvent) => void;

export type MovingCoin = {
    coin: THREE.Object3D,
    animationMixer: THREE.AnimationMixer
}

export class CanvasView implements View {
    private eventListeners = new Set<ViewEventListener>()

    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private raycaster = new THREE.Raycaster()
    private scene = new THREE.Scene();
    private clock = new THREE.Clock();

    private displayText: THREE.Mesh | null = null;

    private mouse = new THREE.Vector2();

    private animations = new Set<THREE.AnimationMixer>()
    
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
    }

    start() {
        this.renderer.domElement.addEventListener("mousemove", this.mouseMoveHandler);
        this.renderer.domElement.addEventListener("click", this.mouseClickHandler);

        this.initScene();

        new OrbitControls(this.camera, this.renderer.domElement);

        this.renderer.setAnimationLoop(() => {
            this.renderer.render(this.scene, this.camera);

            const delta = this.clock.getDelta();

            for(const coin of this.animations) {
                coin.update(delta);
            }
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

    addEventListener(cb: ViewEventListener) {
        this.eventListeners.add(cb);

        return {
            unsubscribe: () => {
                this.eventListeners.delete(cb);
            }
        }
    }

    private mouseMoveHandler = (e: MouseEvent) => {
        this.mouse.set(e.clientX / this.renderer.domElement.clientWidth, e.clientY / this.renderer.domElement.clientHeight);

        this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x * 2 - 1, this.mouse.y * -2 + 1), this.camera);

        const [intersection] = this.raycaster.intersectObjects(this.config.assets.numbers.concat([this.config.assets.okBtn, this.config.assets.resetBtn]));
        

        // if(intersection && intersection.object.parent) {
        //     this.config.assets.numbers[+intersection.object.parent.name].visible = false;
        // }
    }

    private mouseClickHandler = (e: MouseEvent) => {
        this.mouse.set(e.clientX / this.renderer.domElement.clientWidth, e.clientY / this.renderer.domElement.clientHeight);

        this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x * 2 - 1, this.mouse.y * -2 + 1), this.camera);

        const [intersection] = this.raycaster.intersectObjects(this.config.assets.numbers.concat([this.config.assets.okBtn, this.config.assets.resetBtn]));
        
        if(intersection && intersection.object.parent) {
            if(!isNaN(+intersection.object.parent.name)) this.sendEvent({ type: "numberPressed", key: +intersection.object.parent.name })
            else if(intersection.object.parent.name === "ok") this.sendEvent({ type: "okPressed" })
            else this.sendEvent({ type: "resetPressed" })
        }
    }

    private initScene() {
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
            new THREE.MeshBasicMaterial( { color: 0x000000 } )
        ])

        mesh.rotateY(Math.PI / 2);

        mesh.position.set(-10.92, 4.22, -1.4);

        this.scene.add(mesh);

        this.displayText = mesh;


        this.config.assets.coin.visible = false;
    }

    private sendEvent(e: CanvasEvent) {
        for(const listener of this.eventListeners.values()) {
            listener(e);
        }
    }
}