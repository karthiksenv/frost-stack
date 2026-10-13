import { CONFIG } from '../config.js';

export class ResourceSystem {
  constructor(zones, inventory) {
    this.zones = zones;
    this.inventory = inventory;
    this.elapsed = { wood: 0, rawMeat: 0 };
  }

  update(dt, bounds) {
    for (const type of ['wood', 'rawMeat']) {
      if (!this.zones[type].intersects(bounds)) { this.elapsed[type] = 0; continue; }
      this.elapsed[type] += dt;
      while (this.elapsed[type] + 1e-9 >= CONFIG.harvestSeconds) {
        this.elapsed[type] -= CONFIG.harvestSeconds;
        this.inventory.add(type);
      }
    }
  }
}
