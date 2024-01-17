import * as THREE from "three";

export class ViewCamera<Position extends string> extends THREE.PerspectiveCamera {
    constructor(
        public currentPosition: Position,
        aspectRatio: number,
        positions: Record<Position, THREE.Object3D>,
        private transitions: Record<Position, Record<Position, THREE.AnimationClip>>
    ) {
        super(45, aspectRatio);

        this.position.copy(positions[currentPosition].position);
        this.rotation.copy(positions[currentPosition].rotation);
    }

    setPosition(position: Position): THREE.AnimationMixer | null {
        const animation = this.transitions[this.currentPosition][position];
        
        if(!animation) return null;

        const mixer = new THREE.AnimationMixer(this);

        const action = mixer.clipAction(animation);
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
        action.play();
        
        this.currentPosition = position;

        return mixer;
    }
}