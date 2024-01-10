"use client";

import { useEffect, useRef, useState } from 'react'
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Home() {
  const ref = useRef<HTMLCanvasElement>(null);

  const [canvas, setCanvas] = useState<HTMLCanvasElement>();

  useEffect(() => {
    if(!ref.current) return;

    setCanvas(ref.current);
  }, [])

  useEffect(() => {
    if(!canvas) return;

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight);
    camera.position.z = -10;

    const scene = new THREE.Scene();

    const sky = new THREE.HemisphereLight(0xffffff, 0x0000ff);
    scene.add(sky);

    const projector = new THREE.DirectionalLight(0xffffff, 2);
    projector.position.set(2, 8, 0);
    projector.target.position.set(0, 0, 0);
    const projectorHelper = new THREE.DirectionalLightHelper(projector);
    scene.add(projectorHelper);
    scene.add(projector);

    const loader = new GLTFLoader();

    loader.load("/assets/vending.glb", (mesh) => {
      scene.add(mesh.scene);
      mesh.scene.traverse(obj => {
        console.log(obj.name, obj)
        if(obj.name !== "Glass" || !(obj instanceof THREE.Mesh) || !(obj.material instanceof THREE.MeshStandardMaterial)) return;

        obj.material.transparent = true;
        obj.material.opacity = .5;
      })
  
  
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x0000a0)

      const orbit = new OrbitControls(camera, renderer.domElement);
  
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
        orbit.update();
      })
    })

  }, [canvas])

  return (
      <div>
        <canvas ref={ref} />
      </div>
  )
}
