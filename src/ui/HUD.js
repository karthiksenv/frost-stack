import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class HUD {
  constructor(world) {
    this.cash = document.querySelector('#cash');
    this.inventory = document.querySelector('#inventory');
    this.activity = document.querySelector('#activity');
    this.goal = document.querySelector('#goal');
    this.objective = document.querySelector('#objective');
    this.progress = document.querySelector('#progress');
    this.container = document.querySelector('#labels');
    this.projected = new THREE.Vector3();
    const names = { wood: 'TIMBER · $10', rawMeat: 'RAW MEAT', fire: 'COOK · 1 SEC', crowd: 'SELL · $10 / $25', buy: 'UNLOCK POND · $' + CONFIG.pondCost };
    this.labels = Object.entries(world.zones).map(([name, zone]) => {
      const element = document.createElement('div');
      element.className = 'zone-label ' + name;
      element.textContent = names[name];
      this.container.append(element);
      return { name, zone, element };
    });
  }

  text(element, value) { if (element.textContent !== value) element.textContent = value; }

  update(game) {
    const { inventory, wallet, expansion, interactions, world, playerController, sceneSetup } = game;
    this.text(this.cash, '$' + wallet.cash);
    const counts = ['wood', 'rawMeat', 'cookedMeat'].map(type => inventory.count(type));
    this.text(this.inventory, 'WOOD ' + counts[0] + '  /  RAW ' + counts[1] + '  /  COOKED ' + counts[2]);
    this.goal.value = expansion.state === 'locked' ? wallet.cash : CONFIG.pondCost;
    this.text(this.objective, expansion.state === 'open' ? 'The pond is yours.' : 'Open the frozen pond');
    this.text(this.progress, expansion.state === 'locked' ? 'Earn $' + Math.max(0, CONFIG.pondCost - wallet.cash) + ' more at the trading post.' : 'New ground, new possibilities.');
    let activity = 'Collect wood or raw meat, then visit the camp.';
    if (interactions.cooking !== null) activity = 'Cooking… ' + Math.max(0, interactions.cooking).toFixed(1) + 's';
    else if (world.zones.crowd.intersects(playerController.bounds)) activity = 'Trading wood ($10) and cooked meat ($25).';
    else if (world.zones.wood.intersects(playerController.bounds)) activity = 'Gathering timber… watch that stack grow.';
    else if (world.zones.rawMeat.intersects(playerController.bounds)) activity = 'Gathering raw meat… take it to the fire.';
    this.text(this.activity, activity);
    const rect = sceneSetup.renderer.domElement.getBoundingClientRect();
    for (const { name, zone, element } of this.labels) {
      this.projected.set(zone.center.x, 0.1, zone.center.z + zone.size.z / 2 + 0.35).project(sceneSetup.camera);
      const p = this.projected;
      element.hidden = Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || Math.abs(p.z) > 1 || (name === 'buy' && expansion.state !== 'locked');
      element.style.left = (rect.left + (p.x + 1) * rect.width / 2) + 'px';
      element.style.top = (rect.top + (1 - p.y) * rect.height / 2) + 'px';
    }
  }

  dispose() { this.container.replaceChildren(); }
}
