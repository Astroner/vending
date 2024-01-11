import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Assets } from "./types";

export type Configuration = {
    canvas: HTMLCanvasElement,
    assets: Assets,
    width: number,
    height: number
}

export class CanvasView {
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;

    constructor(private config: Configuration) {
        this.camera = new THREE.PerspectiveCamera(45, config.width / config.height);
        this.camera.position.z = -10;

        
        this.renderer = new THREE.WebGLRenderer({ canvas: config.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x0000a0)
    }

    start() {
        const scene = new THREE.Scene();


        const sky = new THREE.HemisphereLight(0xffffff, 0x0000ff);
        scene.add(sky);

        const projector = new THREE.DirectionalLight(0xffffff, 2);
        projector.position.set(2, 8, 0);
        projector.target.position.set(0, 0, 0);
        scene.add(projector);

        const projectorHelper = new THREE.DirectionalLightHelper(projector);
        scene.add(projectorHelper);

        scene.add(this.config.assets.vendingMachine.scene);

        this.config.assets.vendingMachine.scene.traverse(obj => {
            if(obj.name !== "Glass" || !(obj instanceof THREE.Mesh) || !(obj.material instanceof THREE.MeshStandardMaterial)) return;

            obj.material.transparent = true;
            obj.material.opacity = .5;
        })

        new OrbitControls(this.camera, this.renderer.domElement);

        this.renderer.setAnimationLoop(() => {
            this.renderer.render(scene, this.camera);
        })
    }

    destroy() {
        this.renderer.dispose();
    }
}