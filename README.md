# Frost Stack

A modular Three.js + Vite foundation for a snowy isometric resource game. All models are procedural; no external model, image, or font requests.

## Screenshots

Actual captures of the running game.

![Snowy outpost](docs/images/outpost.png)

![Unlocked pond](docs/images/pond-open.png)

## Run

Use Node.js 22.12+ (Node 24 recommended).

~~~sh
npm install
npm run dev
npm test
npm run build
~~~

Open the URL printed by Vite. Use `npm run preview` to serve the production build. Vite uses its defaults, so a config file is unnecessary.

## Play

- WASD or arrow keys move relative to the camera. Click or tap the snow to walk to a destination.
- Stand in TIMBER or RAW MEAT to collect one resource every 0.4 seconds.
- Stand at COOK to convert raw meat to cooked meat, one item per second. A started job finishes even if you walk away.
- Stand at SELL to sell one resource every 0.2 seconds: cooked meat for $25, then wood for $10. Raw meat is not sold.
- Stand at UNLOCK POND with $200 to pay once. The fence sinks in a staggered cubic tween; the path opens when it finishes.
- Example: collect 20 logs, sell them, then enter the buy zone.

## Architecture

`GameManager` owns the lifecycle, fixed-step simulation, and system ordering. `SceneSetup` owns rendering, shadows, resizing, and the orthographic camera. Equal XYZ camera offsets produce a 45-degree azimuth and 35.264-degree isometric elevation. Camera lerp and character quaternion slerp use exponential damping.

`AssetFactory` owns geometry/material lifetime and shares resource geometry. `World` builds terrain, decoration, zones, and the expansion boundary. `PlayerController` owns input, ground raycasting, rotation, and a fixed body AABB that excludes inventory.

`InventoryStack` owns an attached group with mixed resources. Each item's actual geometry height determines its Y offset; removals reflow every remaining item. `ResourceSystem`, `InteractionSystem`, and `ExpansionSystem` own gathering, processing/selling, and the one-shot purchase respectively. `HUD` projects world labels into HTML.

Change balance and motion in `src/config.js`; change map positions in `src/world/World.js`.

## Timing and foundation scope

The RAF loop advances gameplay at 60 fixed steps per second. Rendering and camera smoothing run at the display frame rate. Hidden tabs pause; frame gaps are capped at 100 ms to prevent huge simulation catch-up after stalls. Cooking takes one second of active simulation time.

Cash is credited directly to the UI counter. The factory also provides green cash-block meshes for future drop effects. Bears and trees are decorative renewable resource stations, with no combat or depletion. The pond reveal is a map-expansion foundation, with no fishing mechanic yet.

Movement collides with map/locked-region bounds; decorative objects are not solid. Click movement travels directly and slides along bounds, without pathfinding. Inventory is uncapped to support exaggerated stacks. This is an in-memory prototype: progress resets on reload.

## Verification

`npm test` exercises mixed-height stacking, renewable gathering, delayed cooking, sale cadence/prices, one-shot unlocking, movement across frame rates, and the complete gather-sell-buy loop.

API references: [Three.js documentation](https://threejs.org/docs/) and [Vite guide](https://vite.dev/guide/).


The browser smoke test starts its own Vite server and checks WebGL rendering, real keyboard/pointer events, the complete progression loop, responsive canvas sizing, and console errors. Run `npm run test:browser`. It uses Microsoft Edge when installed at its standard Windows path; elsewhere run `npx playwright install chromium` first, or set `FROST_BROWSER_PATH` to a Chromium browser executable. Screenshots are saved under `.artifacts/`.

`SOURCE.md` contains the folder structure first, followed by the complete contents of every hand-written project file. `package-lock.json` is generated dependency metadata and is shipped alongside it.

## Usage rights

No license is granted for this project. All rights are reserved; copying, modifying, or distributing the code requires permission from the owner.
