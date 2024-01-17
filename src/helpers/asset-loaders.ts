import {
    Font,
    FontLoader,
    GLTF,
    GLTFLoader,
} from "three/examples/jsm/Addons.js";

const glbLoader = new GLTFLoader();
export const loadGLB = async (path: string): Promise<GLTF> =>
    new Promise((resolve, reject) => {
        glbLoader.load(path, resolve, undefined, reject);
    });

const fontLoader = new FontLoader();
export const loadFont = async (path: string): Promise<Font> =>
    new Promise((resolve, reject) => {
        fontLoader.load(path, resolve, undefined, reject);
    });
