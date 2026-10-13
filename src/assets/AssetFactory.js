import * as THREE from 'three';
import { RESOURCE } from '../config.js';

export class AssetFactory {
  constructor() {
    this.geometries = new Set();
    this.materials = new Map();
    this.resourceGeometries = new Map();
  }

  mesh(geometry, color) {
    this.geometries.add(geometry);
    if (!this.materials.has(color)) {
      this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }));
    }
    const mesh = new THREE.Mesh(geometry, this.materials.get(color));
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }

  box(w, h, d, color) { return this.mesh(new THREE.BoxGeometry(w, h, d), color); }
  cylinder(top, bottom, height, color) {
    return this.mesh(new THREE.CylinderGeometry(top, bottom, height, 8), color);
  }

  player(color = 0x3284cf) {
    const group = new THREE.Group();
    const body = this.mesh(new THREE.CapsuleGeometry(0.33, 0.8, 4, 8), color);
    body.position.y = 0.75;
    const backpack = this.box(0.55, 0.65, 0.32, 0x24516e);
    backpack.position.set(0, 0.8, -0.38);
    const face = this.box(0.4, 0.2, 0.12, 0xe4f6ff);
    face.position.set(0, 1.1, 0.3);
    group.add(body, backpack, face);
    return group;
  }

  tree() {
    const group = new THREE.Group();
    const trunk = this.cylinder(0.18, 0.24, 1, 0x795039);
    trunk.position.y = 0.5;
    group.add(trunk);
    for (let i = 0; i < 3; i++) {
      const cone = this.mesh(new THREE.ConeGeometry(1.1 - i * 0.25, 1.7, 7), 0x377464);
      cone.position.y = 1.4 + i * 0.65;
      const snow = this.mesh(new THREE.ConeGeometry(0.75 - i * 0.18, 1.15, 7), 0xf0f7f7);
      snow.position.y = cone.position.y + 0.42;
      group.add(cone, snow);
    }
    return group;
  }

  bear() {
    const group = new THREE.Group();
    const body = this.box(0.9, 0.7, 1.55, 0xfffcf2);
    body.position.y = 0.85;
    const head = this.box(0.7, 0.6, 0.65, 0xfffcf2);
    head.position.set(0, 1, 0.9);
    const nose = this.box(0.25, 0.2, 0.15, 0x304551);
    nose.position.set(0, 0.98, 1.27);
    group.add(body, head, nose);
    for (const x of [-0.3, 0.3]) for (const z of [-0.5, 0.5]) {
      const leg = this.cylinder(0.15, 0.16, 0.5, 0xfffcf2);
      leg.position.set(x, 0.25, z);
      group.add(leg);
    }
    return group;
  }

  resource(type) {
    if (!RESOURCE[type]) throw new Error(`Unknown resource: ${type}`);
    if (!this.resourceGeometries.has(type)) {
      const geometry = type === 'wood'
        ? new THREE.CylinderGeometry(0.16, 0.16, 0.72, 8).rotateZ(Math.PI / 2)
        : new THREE.BoxGeometry(0.65, 0.18, 0.42);
      geometry.computeBoundingBox();
      this.resourceGeometries.set(type, geometry);
    }
    const geometry = this.resourceGeometries.get(type);
    const mesh = this.mesh(geometry, RESOURCE[type].color);
    mesh.userData.height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    return mesh;
  }

  campfire() {
    const group = new THREE.Group();
    for (const angle of [-0.6, 0.6]) {
      const log = this.resource('wood');
      log.scale.set(2, 1.5, 1.5);
      log.rotation.y = angle;
      log.position.y = 0.22;
      group.add(log);
    }
    const flame = this.mesh(new THREE.ConeGeometry(0.38, 1.1, 5), 0xff9d42);
    flame.position.y = 0.8;
    group.add(flame);
    return group;
  }

  fence(width = 1) {
    const group = new THREE.Group();
    const post = this.box(0.18, 1.3, 0.18, 0x9c8065);
    post.position.y = 0.65;
    group.add(post);
    for (const y of [0.4, 0.95]) {
      const rail = this.box(width, 0.13, 0.12, 0xb59779);
      rail.position.set(width / 2, y, 0);
      group.add(rail);
    }
    return group;
  }

  dispose() {
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.geometries.clear();
    this.materials.clear();
    this.resourceGeometries.clear();
  }
}
