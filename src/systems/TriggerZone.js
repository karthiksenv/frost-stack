import * as THREE from 'three';

export class TriggerZone {
  constructor(x, z, width = 3, depth = 2.6) {
    this.center = new THREE.Vector3(x, 0.8, z);
    this.size = new THREE.Vector3(width, 2, depth);
    this.bounds = new THREE.Box3().setFromCenterAndSize(this.center, this.size);
  }

  intersects(playerBounds) { return this.bounds.intersectsBox(playerBounds); }
}
