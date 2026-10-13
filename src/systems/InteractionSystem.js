import { CONFIG, RESOURCE } from '../config.js';

export class InteractionSystem {
  constructor(zones, inventory, wallet) {
    Object.assign(this, { zones, inventory, wallet });
    this.cooking = null;
    this.saleTime = 0;
  }

  update(dt, bounds) {
    // An accepted cooking job finishes even if the player leaves the fire.
    if (this.cooking !== null) {
      this.cooking -= dt;
      if (this.cooking <= 1e-9) {
        this.inventory.add('cookedMeat');
        this.cooking = null;
      }
    }
    if (this.cooking === null && this.zones.fire.intersects(bounds) && this.inventory.remove('rawMeat')) {
      this.cooking = CONFIG.cookSeconds;
    }
    if (!this.zones.crowd.intersects(bounds)) { this.saleTime = 0; return; }
    this.saleTime += dt;
    while (this.saleTime + 1e-9 >= CONFIG.sellSeconds) {
      this.saleTime -= CONFIG.sellSeconds;
      const type = this.inventory.count('cookedMeat') ? 'cookedMeat' : 'wood';
      if (!this.inventory.remove(type)) { this.saleTime = 0; break; }
      this.wallet.cash += RESOURCE[type].value;
    }
  }
}
