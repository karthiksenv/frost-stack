export const CONFIG = Object.freeze({
  speed: 5, turnSpeed: 12, cameraFollow: 4, viewHeight: 24,
  playerRadius: 0.35, playerHeight: 1.7,
  fixedStep: 1 / 60, maxFrameDelta: 0.1,
  harvestSeconds: 0.4, cookSeconds: 1, sellSeconds: 0.2,
  pondCost: 200, stackGap: 0.025,
});

export const RESOURCE = Object.freeze({
  wood: { color: 0x91603b, value: 10 },
  rawMeat: { color: 0xe66b68, value: 0 },
  cookedMeat: { color: 0x975533, value: 25 },
  cash: { color: 0x72bd76, value: 0 },
});
