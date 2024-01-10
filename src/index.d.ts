declare module "three/examples/jsm/loaders/GLTFLoader" {
	import { AnimationClip, Camera, Loader, LoadingManager, Scene } from 'three';
	import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
	import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader';

	export interface GLTF {
		animations: AnimationClip[];
		scene: Scene;
		scenes: Scene[];
		cameras: Camera[];
		asset: object;
	}

	export class GLTFLoader extends Loader {

		constructor( manager?: LoadingManager );
		dracoLoader: DRACOLoader | null;
		ddsLoader: DDSLoader | null;

		load( url: string, onLoad?: ( gltf: GLTF ) => void, onProgress?: ( event: ProgressEvent ) => void, onError?: ( event: ErrorEvent ) => void ): GLTF;
		setDRACOLoader( dracoLoader: DRACOLoader ): GLTFLoader;
		setDDSLoader( ddsLoader: DDSLoader ): GLTFLoader;
		parse( data: ArrayBuffer | string, path: string, onLoad: ( gltf: GLTF ) => void, onError?: ( event: ErrorEvent ) => void ) : void;

	}
}

declare module "three/examples/jsm/controls/OrbitControls" {
	import { Camera } from 'three';
	export class OrbitControls {
		constructor(camera: Camera, element: HTMLElement) {

		}

		update() {

		}
	}
}

declare module "*.module.scss" {
	const classes: Record<string, string>;

	export default classes;
}