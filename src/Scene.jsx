import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Scene() {
  const mount = useRef(null);
  useEffect(() => {
    const element = mount.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }); } catch { return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
    camera.position.set(0, 0, 7);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    element.appendChild(renderer.domElement);
    const group = new THREE.Group();
    scene.add(group);
    const lime = new THREE.MeshBasicMaterial({ color: 0xc5ff2c, wireframe: true, transparent: true, opacity: .45 });
    const dark = new THREE.MeshBasicMaterial({ color: 0xeef5d7, wireframe: true, transparent: true, opacity: .14 });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.05, .019, 8, 140), lime);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.5, .016, 8, 140), dark);
    ringA.rotation.x = .6; ringB.rotation.x = 1.1; ringB.rotation.y = .45;
    group.add(ringA, ringB);
    const sparkGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) { vertices[i * 3] = Math.sin(i * 13.1) * 3.7; vertices[i * 3 + 1] = Math.cos(i * 17.7) * 3.2; vertices[i * 3 + 2] = Math.sin(i * 7.4); }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const points = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xc5ff2c, size: .022, transparent: true, opacity: .5 }));
    group.add(points);
    const resize = () => { let w = element.clientWidth, h = element.clientHeight; if (!w || !h) return; camera.aspect = w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false); };
    const ro = new ResizeObserver(resize);ro.observe(element);resize();
    let frame = 0, raf;
    const tick = () => {frame++; group.rotation.y += .0015;ringA.rotation.z += .0012;ringB.rotation.z -= .0008;points.rotation.z += .00017;renderer.render(scene,camera);raf=requestAnimationFrame(tick);}; tick();
    return () => {cancelAnimationFrame(raf);ro.disconnect();scene.remove(group);ringA.geometry.dispose();ringB.geometry.dispose();sparkGeo.dispose();lime.dispose();dark.dispose();points.material.dispose();renderer.dispose();renderer.domElement.remove();};
  }, []);
  return <div ref={mount} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
}
