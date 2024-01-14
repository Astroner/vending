import type { Font } from "three/examples/jsm/Addons.js"

type Update<Type, Data> = Data & {
    type: Type,
}


export interface Model {
    inputItemNumberID(char: string): Update<'screenUpdate', { state: string }>
    pressOk(): Update<'error', { message: string }> | Update<'success', { price: string }>
    pressReset(): Update<'reset', { screenState: string, coinsToReturn: number[] }>

    insertCoin(value: number): Update<"success", { moneyNeeded: number }>
}

export interface View {

}

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
    items: Map<number, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>

    okBtn: THREE.Group;
    resetBtn: THREE.Group;
    numbers: THREE.Group[];

    coinAnimation: THREE.AnimationClip;
    hatchAnimation: THREE.AnimationClip;
    buttonPressAnimation: THREE.AnimationClip;

    cameras: Record<CameraPosition, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>;

    cameraTracks: Record<CameraPosition, Record<CameraPosition, THREE.AnimationClip>>

    numpadHighlight: {
        square: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
        plane: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
    }

    changeCoin: THREE.Object3D;
    changeCoinAnimation: THREE.AnimationClip;
}