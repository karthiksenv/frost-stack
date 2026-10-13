import './style.css';
import { GameManager } from './engine/GameManager.js';

export let game;
try {
  game = new GameManager(document.querySelector('#app'));
  game.start();
  if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());
} catch (error) {
  document.querySelector('#activity').textContent = 'Could not start the 3D scene. A WebGL2-capable browser is required.';
  console.error(error);
}
