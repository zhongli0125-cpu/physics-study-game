// Sound effects system
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(freq, duration, type = 'sine', volume = 0.1) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.log('Audio not supported');
  }
}

function playJump() { playSound(300, 0.1, 'square'); }
function playCollect() { playSound(600, 0.15, 'sine'); }
function playDeath() { playSound(100, 0.3, 'sawtooth'); }
function playGateOpen() { playSound(800, 0.2, 'sine'); }
function playSuccess() { 
  playSound(523, 0.1); 
  setTimeout(() => playSound(659, 0.1), 100);
  setTimeout(() => playSound(784, 0.2), 200);
}
