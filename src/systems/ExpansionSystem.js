import { CONFIG } from '../config.js';
import { tween } from '../utils/math.js';

export class ExpansionSystem {
  constructor(world, wallet) {
    Object.assign(this, { world, wallet });
    this.state = 'locked';
    this.elapsed = 0;
  }

  update(dt, bounds) {
    if (this.state === 'locked' && this.world.zones.buy.intersects(bounds) && this.wallet.cash >= CONFIG.pondCost) {
      this.wallet.cash -= CONFIG.pondCost;
      this.state = 'opening'; // Commit once before animating.
      this.world.pond.visible = true;
    }
    if (this.state !== 'opening') return;
    this.elapsed += dt;
    this.world.gate.forEach((segment, i) => {
      segment.position.y = tween(0, -1.6, this.elapsed - i * 0.04, 0.8);
    });
    if (this.elapsed >= 0.8 + (this.world.gate.length - 1) * 0.04) {
      this.state = 'open';
      this.world.unlocked = true;
      for (const segment of this.world.gate) segment.visible = false;
    }
  }
}
