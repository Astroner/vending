import * as THREE from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Assets } from "../graphics/types";

export const parseVendingGLB = (glb: GLTF): Omit<Assets, 'displayFont'> => {
    const numbers: THREE.Group[] = [];
    const shelves: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
    const items = new Map<number, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>();

    let body: THREE.Group | null = null;
    let glass: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | null = null;
    let floor: THREE.Object3D | null = null;
    let screen: THREE.Object3D | null = null;
    let coin: THREE.Object3D | null = null;
    let hatch: THREE.Object3D | null = null;

    let okBtn: THREE.Group | null = null;
    let resetBtn: THREE.Group | null = null;

    let coinAnimation: THREE.AnimationClip | null = null;
    let hatchAnimation: THREE.AnimationClip | null = null;

    for(const animation of glb.animations) {
        switch(animation.name) {
            case "CoinAction":
                coinAnimation = animation;
                break;

            case "HatchOpenClose":
                hatchAnimation = animation;
                break;
        }
    }

    glb.scene.traverse(obj => {
        switch(obj.name) {
            case "Floor":
                floor = obj;
                return;

            case "Screen":
                screen = obj;
                return;
            
            case "Coin":
                coin = obj;
                return;

            case "Hatch":
                hatch = obj;
                return;
        }

        if(obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            switch(obj.name) {                
                case "Glass":
                    glass = obj;
                    return;

                
                case "Shelf-0":
                case "Shelf-1":
                case "Shelf-2":
                case "Shelf-3":
                case "Shelf-4":
                    shelves[+obj.name.split("-")[1]] = obj;
                    return;

                case "Item-1":
                case "Item-2":
                case "Item-3":
                case "Item-4":
                case "Item-5":
                case "Item-6":
                case "Item-7":
                case "Item-8":
                case "Item-9":
                case "Item-10":
                case "Item-11":
                case "Item-12":
                case "Item-13":
                case "Item-14":
                case "Item-15":
                    items.set(+obj.name.split("-")[1], obj);
                    return;
            };

            return;
        }

        if(obj instanceof THREE.Group) {
            switch(obj.name) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                case "0":
                    numbers[+obj.name] = obj;
                    return;

                case "Body":
                    body = obj;
                    return;

                case "ok":
                    okBtn = obj;
                    return;

                case "reset":
                    resetBtn = obj;
                    return;
                    
            }
        }
    })

    if(
        !body || 
        !glass || 
        numbers.length < 10 ||
        shelves.length < 5 ||
        !floor ||
        !screen ||
        !okBtn ||
        !resetBtn ||
        !coin ||
        !coinAnimation ||
        items.size < 15 ||
        !hatchAnimation ||
        !hatch
    ) throw new Error("Couldn't parse GLB");

    return {
        scene: glb.scene,
        numbers,
        body,
        glass,
        floor,
        shelves,
        screen,
        okBtn,
        resetBtn,
        coin,
        coinAnimation,
        items,
        hatchAnimation,
        hatch
    }
}
