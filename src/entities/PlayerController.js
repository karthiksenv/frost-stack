import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damping } from '../utils/math.js';

export class PlayerController {
  constructor(player, camera, canvas, world) {
    Object.assign(this, { player, camera, canvas, world });
    this.keys = new Set();
    this.target = null;
    this.direction = new THREE.Vector3();
    this.rotation = new THREE.Quaternion();
    this.up = new THREE.Vector3(0, 1, 0);
    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(this.up, 0);
    this.pointer = new THREE.Vector2();
    this.bounds = new THREE.Box3();
    this.center = new THREE.Vector3();
    this.bodySize = new THREE.Vector3(CONFIG.playerRadius * 2, CONFIG.playerHeight, CONFIG.playerRadius * 2);
    this.events = new AbortController();
    const options = { signal: this.events.signal };
    const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    window.addEventListener('keydown', event => {
      if (movementKeys.has(event.code)) {
        event.preventDefault();
        this.keys.add(event.code);
        this.target = null;
      }
    }, options);
    window.addEventListener('keyup', event => this.keys.delete(event.code), options);
    window.addEventListener('blur', () => this.clearInput(), options);
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, camera);
      const point = this.raycaster.ray.intersectPlane(this.ground, new THREE.Vector3());
      if (point && world.canStand(point.x, point.z)) this.target = point;
    }, options);
    this.updateBounds();
  }

  update(dt) {
    const pressed = (...codes) => codes.some(code => this.keys.has(code));
    const x = Number(pressed('KeyD', 'ArrowRight')) - Number(pressed('KeyA', 'ArrowLeft'));
    const y = Number(pressed('KeyW', 'ArrowUp')) - Number(pressed('KeyS', 'ArrowDown'));
    // Screen-relative input for the fixed 45-degree camera.
    this.direction.set(x - y, 0, -x - y);
    let distance = Infinity;
    if (this.direction.lengthSq()) this.target = null;
    else if (this.target) {
      this.direction.subVectors(this.target, this.player.position);
      this.direction.y = 0;
      distance = this.direction.length();
      if (distance < 0.04) { this.target = null; this.direction.set(0, 0, 0); }
    }
    if (this.direction.lengthSq()) {
      this.direction.normalize();
      const step = Math.min(CONFIG.speed * dt, distance);
      const p = this.player.position;
      const oldX = p.x, oldZ = p.z;
      if (this.world.canStand(p.x + this.direction.x * step, p.z)) p.x += this.direction.x * step;
      if (this.world.canStand(p.x, p.z + this.direction.z * step)) p.z += this.direction.z * step;
      this.direction.set(p.x - oldX, 0, p.z - oldZ);
      if (this.direction.lengthSq() > 1e-10) {
        this.rotation.setFromAxisAngle(this.up, Math.atan2(this.direction.x, this.direction.z));
        this.player.quaternion.slerp(this.rotation, damping(CONFIG.turnSpeed, dt));
      } else this.target = null;
    }
    this.updateBounds();
  }

  updateBounds() {
    this.center.copy(this.player.position).y += CONFIG.playerHeight / 2;
    this.bounds.setFromCenterAndSize(this.center, this.bodySize);
  }

  clearInput() { this.keys.clear(); this.target = null; }
  dispose() { this.events.abort(); }
}
