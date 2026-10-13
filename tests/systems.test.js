import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AssetFactory } from '../src/assets/AssetFactory.js';
import { InventoryStack } from '../src/systems/InventoryStack.js';
import { ResourceSystem } from '../src/systems/ResourceSystem.js';
import { InteractionSystem } from '../src/systems/InteractionSystem.js';
import { ExpansionSystem } from '../src/systems/ExpansionSystem.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { World } from '../src/world/World.js';
import { CONFIG } from '../src/config.js';

function fixture(t) {
  const factory = new AssetFactory();
  t.after(() => factory.dispose());
  const world = new World(new THREE.Scene(), factory);
  const player = factory.player();
  const inventory = new InventoryStack(player, factory);
  const wallet = { cash: 0 };
  const interactions = new InteractionSystem(world.zones, inventory, wallet);
  return { factory, world, player, inventory, wallet, interactions };
}

function bodyAt(x, z) {
  return new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, 0.85, z), new THREE.Vector3(0.7, 1.7, 0.7));
}

function advance(system, seconds, bounds) {
  for (let i = 0; i < Math.round(seconds * 60); i++) system.update(1 / 60, bounds);
}

test('mixed stack uses actual mesh heights and closes gaps after middle removal', t => {
  const { inventory } = fixture(t);
  inventory.add('wood');
  inventory.add('rawMeat');
  inventory.add('wood');
  inventory.add('cookedMeat');
  assert.ok(inventory.remove('rawMeat'));
  assert.equal(inventory.remove('rawMeat'), false);
  let expectedBottom = 0;
  for (const item of inventory.items) {
    assert.ok(Math.abs(item.mesh.position.y - item.height / 2 - expectedBottom) < 1e-8);
    expectedBottom += item.height + CONFIG.stackGap;
  }
  assert.equal(inventory.group.children.length, 3);
  assert.ok(inventory.items[0].height > inventory.items[2].height);
});

test('renewable gathering has the same yield with different update intervals', t => {
  const { world, inventory } = fixture(t);
  const source = new ResourceSystem(world.zones, inventory);
  advance(source, 8, bodyAt(-6, 1));
  assert.equal(inventory.count('wood'), 20);
  const second = new InventoryStack(new THREE.Group(), inventory.factory);
  const source2 = new ResourceSystem(world.zones, second);
  for (let i = 0; i < 240; i++) source2.update(1 / 30, bodyAt(-6, 1));
  assert.equal(second.count('wood'), 20);
});

test('cooking consumes one raw item and finishes after one second away from fire', t => {
  const { inventory, interactions } = fixture(t);
  inventory.add('rawMeat');
  inventory.add('rawMeat');
  interactions.update(0, bodyAt(-4, -5));
  assert.equal(inventory.count('rawMeat'), 1);
  advance(interactions, 0.5, bodyAt(0, 4));
  assert.equal(inventory.count('cookedMeat'), 0);
  advance(interactions, 0.5, bodyAt(0, 4));
  assert.equal(inventory.count('cookedMeat'), 1);
  assert.equal(inventory.count('rawMeat'), 1);
  assert.equal(interactions.cooking, null);
});

test('selling respects cadence, prices, and raw-meat exclusion', t => {
  const { inventory, interactions, wallet } = fixture(t);
  for (const type of ['wood', 'rawMeat', 'cookedMeat']) inventory.add(type);
  advance(interactions, 0.1, bodyAt(4, -5));
  assert.equal(wallet.cash, 0);
  advance(interactions, 0.1, bodyAt(4, -5));
  assert.equal(wallet.cash, 25);
  assert.equal(inventory.items.length, 2);
  advance(interactions, 2, bodyAt(4, -5));
  assert.equal(wallet.cash, 35);
  assert.equal(inventory.count('rawMeat'), 1);
});

test('pond purchase is atomic and passage opens only after the fence tween', t => {
  const { world, wallet } = fixture(t);
  const expansion = new ExpansionSystem(world, wallet);
  const bounds = bodyAt(0, -8);
  wallet.cash = 199;
  expansion.update(0, bounds);
  assert.equal(expansion.state, 'locked');
  assert.equal(world.canStand(0, -12), false);
  wallet.cash = 450;
  expansion.update(0, bounds);
  assert.equal(wallet.cash, 250);
  assert.equal(world.pond.visible, true);
  assert.equal(world.canStand(0, -12), false);
  advance(expansion, 2, bounds);
  assert.equal(expansion.state, 'open');
  assert.equal(wallet.cash, 250);
  assert.equal(world.canStand(0, -12), true);
  assert.equal(world.canStand(7, -12), false);
  assert.ok(world.gate.every(segment => !segment.visible && segment.position.y === -1.6));
});

test('normalized WASD speed is independent of frame rate and stack size', t => {
  const oldWindow = globalThis.window;
  globalThis.window = new EventTarget();
  t.after(() => { globalThis.window = oldWindow; });
  for (const fps of [30, 60, 120]) {
    const { player, inventory, world } = fixture(t);
    for (let i = 0; i < 40; i++) inventory.add('wood');
    const controller = new PlayerController(player, new THREE.OrthographicCamera(), new EventTarget(), world);
    controller.keys.add('KeyW');
    controller.keys.add('KeyD');
    for (let i = 0; i < fps; i++) controller.update(1 / fps);
    assert.ok(Math.abs(player.position.length() - CONFIG.speed) < 1e-8);
    assert.equal(controller.bounds.max.y, CONFIG.playerHeight);
    controller.dispose();
  }
});

test('complete gather-sell-buy loop reaches the pond without seeded cash', t => {
  const { world, inventory, wallet, interactions } = fixture(t);
  const resources = new ResourceSystem(world.zones, inventory);
  advance(resources, 8, bodyAt(-6, 1));
  advance(interactions, 4, bodyAt(4, -5));
  assert.equal(wallet.cash, 200);
  assert.equal(inventory.items.length, 0);
  const expansion = new ExpansionSystem(world, wallet);
  advance(expansion, 2, bodyAt(0, -8));
  assert.equal(wallet.cash, 0);
  assert.equal(world.unlocked, true);
});
