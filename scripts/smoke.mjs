import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 5173 } });
await server.listen();
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath = process.env.FROST_BROWSER_PATH || (existsSync(edge) ? edge : undefined);
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(async () => Boolean((await import('/src/main.js')).game?.running));
  await page.evaluate(async () => {
    const { game } = await import('/src/main.js');
    game.running = false;
    cancelAnimationFrame(game.frameId);
  });
  mkdirSync('.artifacts', { recursive: true });
  await page.screenshot({ path: '.artifacts/initial.png' });

  await page.keyboard.down('w');
  const moved = await page.evaluate(async () => {
    const { game } = await import('/src/main.js');
    const start = game.player.position.clone();
    for (let i = 0; i < 60; i++) game.update(1 / 60);
    return game.player.position.distanceTo(start);
  });
  await page.keyboard.up('w');
  assert.ok(Math.abs(moved - 5) < 1e-6, 'WASD travels five units per second');

  const target = await page.evaluate(async () => {
    const { game } = await import('/src/main.js');
    game.sceneSetup.follow(game.player.position, 1);
    game.sceneSetup.render();
    const p = game.world.zones.wood.center.clone();
    p.y = 0;
    p.project(game.sceneSetup.camera);
    return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
  });
  await page.mouse.click(target.x, target.y);
  const clicked = await page.evaluate(async () => {
    const { game } = await import('/src/main.js');
    const accepted = Boolean(game.playerController.target);
    for (let i = 0; i < 150; i++) game.update(1 / 60);
    return { accepted, x: game.player.position.x, z: game.player.position.z, wood: game.inventory.count('wood') };
  });
  assert.ok(clicked.accepted, 'Raycast accepts a ground click');
  assert.ok(Math.hypot(clicked.x + 6, clicked.z - 1) < 0.05, 'Click movement reaches its target without overshoot');
  assert.ok(clicked.wood > 0, 'Entering a resource zone gathers items');

  const outcome = await page.evaluate(async () => {
    const { game } = await import('/src/main.js');
    const advance = seconds => { for (let i = 0; i < seconds * 60; i++) game.update(1 / 60); };
    const move = (x, z) => { game.playerController.clearInput(); game.player.position.set(x, 0, z); game.playerController.updateBounds(); };
    while (game.inventory.remove('wood')) {}
    move(0, 4); advance(1);
    move(-6, 1); advance(8);
    const harvested = game.inventory.count('wood');
    move(4, -5); advance(4);
    const earned = game.wallet.cash;
    move(0, -8); advance(2);
    game.sceneSetup.follow(game.player.position, 2);
    game.sceneSetup.render();
    game.hud.update(game);
    return { harvested, earned, cash: game.wallet.cash, state: game.expansion.state, pond: game.world.pond.visible, ortho: game.sceneSetup.camera.isOrthographicCamera };
  });
  assert.deepEqual(outcome, { harvested: 20, earned: 200, cash: 0, state: 'open', pond: true, ortho: true });
  assert.equal(await page.locator('#objective').textContent(), 'The pond is yours.');
  await page.screenshot({ path: '.artifacts/pond-open.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(async () => (await import('/src/main.js')).game.sceneSetup.renderer.domElement.clientWidth === 390);
  await page.evaluate(async () => {
    const { game } = await import('/src/main.js');
    game.sceneSetup.render(); game.hud.update(game);
  });
  await page.screenshot({ path: '.artifacts/mobile.png' });
  assert.deepEqual(errors, [], 'No browser runtime or console errors');
  console.log('Browser smoke passed: rendering, WASD, raycasting, collecting, selling, unlocking, responsive canvas.');
} finally {
  await browser?.close();
  await server.close();
}
