import * as THREE from 'three';
import { TriggerZone } from '../systems/TriggerZone.js';
import { CONFIG } from '../config.js';

export class World {
  constructor(scene, factory) {
    this.unlocked = false;
    this.zones = {
      wood: new TriggerZone(-6, 1), rawMeat: new TriggerZone(6, 1),
      fire: new TriggerZone(-4, -5), crowd: new TriggerZone(4, -5),
      buy: new TriggerZone(0, -8, 3, 2),
    };
    const ground = factory.box(24, 0.65, 18, 0xecf4f4);
    ground.position.set(0, -0.325, -1);
    scene.add(ground);
    this.pond = new THREE.Group();
    const bank = factory.box(12, 0.65, 10, 0xecf4f4);
    bank.position.set(0, -0.325, -15);
    const water = factory.mesh(new THREE.PlaneGeometry(8, 6), 0x65b9d3);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.025, -15);
    water.castShadow = false;
    this.pond.add(bank, water);
    this.pond.visible = false;
    scene.add(this.pond);
    const colors = { wood: 0xbdd5bf, rawMeat: 0xe8c3bf, fire: 0xefc797, crowd: 0xb6d8cc, buy: 0xbacddb };
    for (const [name, zone] of Object.entries(this.zones)) {
      const pad = factory.box(zone.size.x, 0.04, zone.size.z, colors[name]);
      pad.position.set(zone.center.x, 0.025, zone.center.z);
      scene.add(pad);
    }
    for (const [x, z] of [[-8, -1], [-6, -1.5], [-9, 4], [-10, -6], [9, 5], [10, -7]]) {
      const tree = factory.tree();
      tree.position.set(x, 0, z);
      scene.add(tree);
    }
    for (const x of [5.5, 7.5]) {
      const bear = factory.bear();
      bear.position.set(x, 0, -1.3);
      bear.rotation.y = -0.5;
      scene.add(bear);
    }
    const fire = factory.campfire();
    fire.position.set(-4, 0, -6.9);
    scene.add(fire);
    for (let i = 0; i < 4; i++) {
      const customer = factory.player([0xd27a53, 0x8179a8, 0xd4a54f, 0x688c73][i]);
      customer.position.set(2.6 + i * 0.95, 0, -7.3);
      customer.scale.setScalar(0.85);
      scene.add(customer);
    }
    this.gate = [];
    for (let x = -12; x < 12; x++) {
      const segment = factory.fence();
      segment.position.set(x, 0, -10);
      scene.add(segment);
      if (x >= -5 && x < 5) this.gate.push(segment);
    }
  }

  canStand(x, z) {
    const r = CONFIG.playerRadius;
    if (z >= -10 + r) return x >= -12 + r && x <= 12 - r && z <= 8 - r;
    return this.unlocked && Math.abs(x) <= 5 - r && z >= -20 + r;
  }
}
