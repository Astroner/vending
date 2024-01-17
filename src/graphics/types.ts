import type { Font } from "three/examples/jsm/Addons.js";

export type EventTemplate<T extends string, Data = {}> = Data & {
    type: T;
};

export type EventListener<E extends EventTemplate<any>> = (e: E) => void;

export type Subscription = {
    unsubscribe(): void;
};

export type CameraPosition = "front" | "numpad";

export type Assets = {
    displayFont: Font;

    coin: THREE.Object3D;

    scene: THREE.Object3D;
    body: THREE.Group;
    glass: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    floor: THREE.Object3D;
    hatch: THREE.Object3D;
    shelves: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[];
    screen: THREE.Object3D;
    items: Map<
        number,
        THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
    >;

    okBtn: THREE.Group;
    resetBtn: THREE.Group;
    numbers: THREE.Group[];

    coinAnimation: THREE.AnimationClip;
    hatchAnimation: THREE.AnimationClip;
    buttonPressAnimation: THREE.AnimationClip;

    cameras: Record<
        CameraPosition,
        THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
    >;

    cameraTracks: Record<
        CameraPosition,
        Record<CameraPosition, THREE.AnimationClip>
    >;

    numpadHighlight: {
        square: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
        plane: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    };

    changeCoin: THREE.Object3D;
    changeCoinAnimation: THREE.AnimationClip;

    fallSound: AudioBuffer;
    coinsSound: AudioBuffer;
};
