"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function Objects({ reduced }: { reduced:boolean }) {
  const group=useRef<THREE.Group>(null);
  const {pointer}=useThree();
  useFrame((_,delta)=>{
    if(!group.current||reduced)return;
    group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,pointer.x*.12,3,delta);
    group.current.rotation.x=THREE.MathUtils.damp(group.current.rotation.x,-pointer.y*.07,3,delta);
  });
  return <group ref={group}>
    <Float speed={reduced?0:0.8} rotationIntensity={0.08} floatIntensity={reduced?0:0.13}>
      <mesh position={[0,0,0]} rotation={[0,0,-.12]} castShadow>
        <boxGeometry args={[1.8,2.25,.08]}/><meshStandardMaterial color="#d7c9b7" roughness={.82}/>
      </mesh>
      <mesh position={[0,0,.06]} rotation={[0,0,-.12]}>
        <boxGeometry args={[1.55,1.96,.045]}/><meshStandardMaterial color="#a95640" roughness={.68}/>
      </mesh>
      <mesh position={[-.12,.08,.1]} rotation={[0,0,-.12]}>
        <boxGeometry args={[1.05,1.5,.035]}/><meshStandardMaterial color="#eee3d3" roughness={.92}/>
      </mesh>
      <mesh position={[.48,-.42,.16]} rotation={[0,0,.3]}>
        <torusGeometry args={[.4,.1,12,48]}/><meshStandardMaterial color="#353b3a" roughness={.42} metalness={.24}/>
      </mesh>
    </Float>
    <mesh position={[1.05,-.7,-.42]} rotation={[.15,.25,.16]} castShadow>
      <boxGeometry args={[.48,.8,.36]}/><meshStandardMaterial color="#876b59" roughness={.76}/>
    </mesh>
  </group>;
}
export function HeroScene(){
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{
    const query=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReduced(query.matches);update();query.addEventListener("change",update);
    return()=>query.removeEventListener("change",update);
  },[]);
  return <div className="hero-scene" role="img" aria-label="A layered sculptural arrangement of film and paper textures">
    <Canvas camera={{position:[0,0,5.3],fov:35}} dpr={[1,1.5]} frameloop={reduced?"demand":"always"}>
      <ambientLight intensity={2.2}/><directionalLight position={[-3,4,5]} intensity={2.4}/><directionalLight position={[4,-2,3]} intensity={.5} color="#d69a76"/>
      <Objects reduced={reduced}/>
    </Canvas>
  </div>;
}
