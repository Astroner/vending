import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Assets } from "./types";

export const loadAssets = async (): Promise<Assets> => {
    const loader = new GLTFLoader();

    const vendingMachine = await new Promise<GLTF>((resolve, reject) => {
        loader.load("/assets/vending.glb", resolve, undefined, reject);
    })

    return {
        vendingMachine
    }
}