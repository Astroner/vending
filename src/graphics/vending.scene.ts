import * as THREE from "three";
import { Assets } from "./types";
import { TextGeometry } from "three/examples/jsm/Addons.js";

type SlotInfo = {
    slot: number;
    group: THREE.Group;
};

export class VendingScene extends THREE.Scene {
    static DEBUGGING = false;

    public displayText: THREE.Mesh;

    public shiftPerItem: number;

    public itemsClippingPlanes: THREE.Plane[];

    private slotsMap = new Map<number, SlotInfo>();

    constructor(
        private assets: Assets,
        initialText: string,
    ) {
        super();

        this.add(assets.scene);

        const sky = new THREE.HemisphereLight(0xffffff, 0x0000ff);
        this.add(sky);

        const projector = new THREE.DirectionalLight(0xffffff, 2);
        projector.position.set(2, 8, 0);
        projector.target.position.copy(assets.numpadHighlight.plane.position);
        this.add(projector);
        this.add(projector.target);

        if (VendingScene.DEBUGGING) {
            const projectorHelper = new THREE.DirectionalLightHelper(projector);
            this.add(projectorHelper);
        }

        assets.glass.material.transparent = true;
        assets.glass.material.opacity = 0.5;

        const geometry = new TextGeometry(initialText, {
            font: assets.displayFont,
            size: 0.1,
            height: 2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5,
        });

        this.displayText = new THREE.Mesh(geometry, [
            new THREE.MeshBasicMaterial({ color: 0x000000 }),
        ]);

        this.displayText.rotateY(Math.PI / 2);

        this.displayText.position.set(-10.92, 4.22, -1.4);

        this.add(this.displayText);

        assets.coin.visible = false;

        for (const item of this.assets.items.values()) {
            item.visible = false;
        }

        const itemBox = new THREE.Box3().setFromObject(
            this.assets.items.get(1)!,
        );
        this.shiftPerItem = itemBox.max.x - itemBox.min.x + 0.027;

        const box = new THREE.Box3().setFromObject(assets.shelves[0]);

        this.itemsClippingPlanes = [
            new THREE.Plane(new THREE.Vector3(1, 0, 0), box.max.x),
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), -box.min.x + 0.17),
        ];

        if (VendingScene.DEBUGGING) {
            for (const plane of this.itemsClippingPlanes) {
                this.add(new THREE.PlaneHelper(plane, 15, 0xff0000));
            }
        }

        for (const obj of Object.values(assets.cameras)) {
            if (VendingScene.DEBUGGING) obj.material.wireframe = true;
            else obj.visible = false;
        }

        assets.numpadHighlight.plane.material.transparent = true;
        assets.numpadHighlight.plane.material.opacity = 0;

        assets.numpadHighlight.square.material.transparent = true;
        assets.numpadHighlight.square.material.opacity = 0;
    }

    setSlot(slot: number, color: number, items: number) {
        if (!this.itemsClippingPlanes) return;

        const proto = this.assets.items.get(slot);

        if (!proto) throw new Error("Unsupported slot " + slot);

        const group = new THREE.Group();

        const material = proto.material.clone();
        material.color.set(color);

        material.clippingPlanes = this.itemsClippingPlanes;

        let nextPosition = proto.position.clone();
        for (let i = 0; i < items; i++) {
            const newItem = proto.clone();
            newItem.visible = true;
            newItem.material = material;
            newItem.position.copy(nextPosition);
            group.add(newItem);

            nextPosition = nextPosition.clone();
            nextPosition.x -= 0.1;
        }

        const prevSlot = this.slotsMap.get(slot);
        if (prevSlot) {
            prevSlot.group.removeFromParent();
        }
        this.slotsMap.set(slot, {
            group,
            slot,
        });

        this.add(group);
    }

    clearSlots() {
        for (const slot of this.slotsMap.values()) {
            slot.group.removeFromParent();
        }

        this.slotsMap.clear();
    }

    dropItem(slot: number) {
        if (!this.shiftPerItem) return;

        const slotInfo = this.slotsMap.get(slot);

        if (!slotInfo) return;

        slotInfo.group.position.x += this.shiftPerItem;
    }

    setDisplay(text: string) {
        if (!this.displayText) return;

        const geometry = new TextGeometry(text, {
            font: this.assets.displayFont,
            size: 0.1,
            height: 2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5,
        });

        this.displayText.geometry = geometry;
    }
}
