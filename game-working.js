// This file adds random questions to game.js
// Include this AFTER game.js in your HTML

// Override initLevel to use random questions
const originalInitLevel = initLevel;
window.initLevel = function(lvl) {
  originalInitLevel(lvl);
  // Replace question with random one
  if (questionGate) {
    const randomQ = questionPool[Math.floor(Math.random() * questionPool.length)];
    questionGate.question = randomQ.q;
    questionGate.options = randomQ.opts;
    questionGate.answer = randomQ.ans;
  }
};
