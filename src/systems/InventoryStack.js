import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class InventoryStack {
  constructor(player, factory) {
    this.factory = factory;
    this.items = [];
    this.group = new THREE.Group();
    this.group.position.set(0, 1.2, -0.4);
    player.add(this.group);
  }

  add(type) {
    const mesh = this.factory.resource(type);
    this.items.push({ type, mesh, height: mesh.userData.height });
    this.group.add(mesh);
    this.reflow();
  }

  remove(type) {
    // Remove the highest matching item, including from a mixed stack.
    const index = this.items.findLastIndex(item => item.type === type);
    if (index < 0) return false;
    const [item] = this.items.splice(index, 1);
    this.group.remove(item.mesh);
    // Shared geometry and materials remain owned by AssetFactory.
    this.reflow();
    return true;
  }

  count(type) { return this.items.filter(item => item.type === type).length; }

  reflow() {
    let y = 0;
    for (const item of this.items) {
      item.mesh.position.y = y + item.height / 2;
      y += item.height + CONFIG.stackGap;
    }
  }
}
