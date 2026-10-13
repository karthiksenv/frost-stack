import { CONFIG } from '../config.js';
import { SceneSetup } from './SceneSetup.js';
import { AssetFactory } from '../assets/AssetFactory.js';
import { World } from '../world/World.js';
import { PlayerController } from '../entities/PlayerController.js';
import { InventoryStack } from '../systems/InventoryStack.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { ExpansionSystem } from '../systems/ExpansionSystem.js';
import { HUD } from '../ui/HUD.js';

export class GameManager {
  constructor(container) {
    this.sceneSetup = new SceneSetup(container);
    this.factory = new AssetFactory();
    this.world = new World(this.sceneSetup.scene, this.factory);
    this.player = this.factory.player();
    this.player.position.set(0, 0, 4);
    this.sceneSetup.scene.add(this.player);
    this.wallet = { cash: 0 };
    this.inventory = new InventoryStack(this.player, this.factory);
    this.playerController = new PlayerController(this.player, this.sceneSetup.camera, this.sceneSetup.renderer.domElement, this.world);
    this.resources = new ResourceSystem(this.world.zones, this.inventory);
    this.interactions = new InteractionSystem(this.world.zones, this.inventory, this.wallet);
    this.expansion = new ExpansionSystem(this.world, this.wallet);
    this.hud = new HUD(this.world);
    this.running = false;
    this.accumulator = 0;
    this.previousTime = null;
    this.onVisibility = () => {
      this.previousTime = null;
      this.accumulator = 0;
      this.playerController.clearInput();
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.previousTime = null;
    this.frameId = requestAnimationFrame(this.frame);
  }

  update(dt) {
    this.playerController.update(dt);
    const bounds = this.playerController.bounds;
    this.resources.update(dt, bounds);
    this.interactions.update(dt, bounds);
    this.expansion.update(dt, bounds);
  }

  frame(timestamp) {
    if (!this.running) return;
    const dt = this.previousTime === null ? 0 : Math.min((timestamp - this.previousTime) / 1000, CONFIG.maxFrameDelta);
    this.previousTime = timestamp;
    if (!document.hidden) {
      this.accumulator += dt;
      while (this.accumulator + 1e-9 >= CONFIG.fixedStep) {
        this.update(CONFIG.fixedStep);
        this.accumulator -= CONFIG.fixedStep;
      }
      this.sceneSetup.follow(this.player.position, dt);
      this.sceneSetup.render();
      this.hud.update(this);
    }
    this.frameId = requestAnimationFrame(this.frame);
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.playerController.dispose();
    this.hud.dispose();
    this.factory.dispose();
    this.sceneSetup.dispose();
  }
}
