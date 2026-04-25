/**
 * playbackWorker.js — Precision playback timer running off the main thread.
 *
 * Messages IN  (from main thread):
 *   { type: 'START',  speed: Number, maxIndex: Number }
 *   { type: 'PAUSE'  }
 *   { type: 'STOP'   }
 *   { type: 'SEEK',  index: Number }
 *   { type: 'SPEED', speed: Number }
 *
 * Messages OUT (to main thread):
 *   { type: 'TICK',  index: Number }
 *   { type: 'DONE'  }
 */

let index = 0;
let maxIndex = 0;
let speed = 2;
let running = false;
let lastTime = null;
let accumulated = 0;

// ~25 FPS target interval
const FRAME_INTERVAL_MS = 40;

function tick(now) {
  if (!running) return;

  if (lastTime !== null) {
    const elapsed = now - lastTime;
    accumulated += elapsed;

    // Drain accumulated time into index increments
    while (accumulated >= FRAME_INTERVAL_MS) {
      accumulated -= FRAME_INTERVAL_MS;
      index += speed;
      if (index >= maxIndex) {
        index = maxIndex;
        postMessage({ type: 'TICK', index });
        postMessage({ type: 'DONE' });
        running = false;
        lastTime = null;
        return;
      }
      postMessage({ type: 'TICK', index });
    }
  }

  lastTime = now;
  setTimeout(() => tick(performance.now()), FRAME_INTERVAL_MS);
}

self.onmessage = function (e) {
  const { type } = e.data;

  switch (type) {
    case 'START':
      speed = e.data.speed ?? speed;
      maxIndex = e.data.maxIndex ?? maxIndex;
      if (!running) {
        running = true;
        lastTime = null;
        accumulated = 0;
        tick(performance.now());
      }
      break;

    case 'PAUSE':
      running = false;
      lastTime = null;
      accumulated = 0;
      break;

    case 'STOP':
      running = false;
      lastTime = null;
      accumulated = 0;
      index = 0;
      break;

    case 'SEEK':
      index = Math.max(0, Math.min(e.data.index ?? 0, maxIndex));
      break;

    case 'SPEED':
      speed = e.data.speed ?? speed;
      break;

    default:
      break;
  }
};
