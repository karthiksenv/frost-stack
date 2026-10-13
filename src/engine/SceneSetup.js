import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damping } from '../utils/math.js';

export class SceneSetup {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdce8ed);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 150);
    // Equal XYZ offset gives a 45° azimuth and classic 35.264° isometric elevation.
    this.offset = new THREE.Vector3(22, 22, 22);
    this.focus = new THREE.Vector3(0, 0.8, 4);
    this.desired = new THREE.Vector3();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.setAttribute('aria-label', 'Isometric snowy outpost. Use WASD or click to move.');
    container.append(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xd5efff, 0x8397ac, 2));
    this.sun = new THREE.DirectionalLight(0xfff1dc, 3);
    this.sun.position.set(-12, 24, 8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 0.5, far: 80 });
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.scene.add(this.sun, this.sun.target);
    this.resize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      const aspect = w / Math.max(1, h);
      const half = CONFIG.viewHeight / 2;
      Object.assign(this.camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(container);
    this.resize();
    this.follow(this.focus, 0);
  }

  follow(position, dt) {
    this.desired.set(position.x, 0.8, position.z);
    this.focus.lerp(this.desired, damping(CONFIG.cameraFollow, dt));
    this.camera.position.copy(this.focus).add(this.offset);
    this.camera.lookAt(this.focus);
    this.camera.updateMatrixWorld();
  }

  render() { this.renderer.render(this.scene, this.camera); }

  dispose() {
    this.observer.disconnect();
    this.sun.shadow.map?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
