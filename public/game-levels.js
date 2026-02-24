// Enhanced level generation with 100 levels
function initLevel(lvl) {
  platforms = []; lavaZones = []; waterZones = []; greenZones = []; collectibles = [];
  gameOver = false; levelComplete = false; timer = 0;
  
  // Ground platform
  platforms.push({ x: 0, y: 460, w: 800, h: 40, type: 'ground' });
  
  // Safe spawn area - no hazards near start
  const safeZone = 200;
  
  // Progressive difficulty
  const difficulty = Math.min(lvl / 10, 10); // 0 to 10
  const numPlatforms = 3 + Math.floor(lvl / 5); // More platforms as you progress
  const numHazards = 1 + Math.floor(lvl / 10); // More hazards
  
  // Generate platforms
  for (let i = 0; i < numPlatforms; i++) {
    const x = safeZone + (i * (600 - safeZone) / numPlatforms);
    const y = 400 - (Math.random() * 150);
    const w = 100 - (difficulty * 5); // Smaller platforms at higher levels
    platforms.push({ x: x, y: y, w: Math.max(w, 50), h: 20, type: 'platform' });
  }
  
  // Generate hazards (not in safe zone)
  for (let i = 0; i < numHazards; i++) {
    const x = safeZone + Math.random() * (600 - safeZone);
    const hazardType = Math.random();
    if (hazardType < 0.4) {
      lavaZones.push({ x: x, y: 440, w: 60 + Math.random() * 40, h: 20 });
    } else if (hazardType < 0.8) {
      waterZones.push({ x: x, y: 440, w: 60 + Math.random() * 40, h: 20 });
    } else {
      greenZones.push({ x: x, y: 440, w: 60 + Math.random() * 40, h: 20 });
    }
  }
  
  // Doors at the end
  doors.fire = { x: 700, y: 380 - (difficulty * 5), w: 30, h: 50 };
  doors.water = { x: 740, y: 380 - (difficulty * 5), w: 30, h: 50 };
  
  // Collectibles
  const numCollectibles = 2 + Math.floor(lvl / 20);
  for (let i = 0; i < numCollectibles; i++) {
    const plat = platforms[Math.floor(Math.random() * platforms.length)];
    collectibles.push({
      x: plat.x + Math.random() * (plat.w - 20),
      y: plat.y - 30,
      type: Math.random() > 0.5 ? 'fire' : 'water',
      collected: false
    });
  }
  
  // Question gate with variety
  const questions = getQuestionForLevel(lvl);
  questionGate = {
    x: 400 + (Math.random() * 100 - 50),
    y: 200 - (difficulty * 10),
    w: 60, h: 80,
    question: questions.question,
    options: questions.options,
    answer: questions.answer,
    passed: false
  };
  
  // Reset players to SAFE positions
  fireboy.x = 50; fireboy.y = 380; fireboy.vx = 0; fireboy.vy = 0; fireboy.alive = true; fireboy.inDoor = false;
  watergirl.x = 100; watergirl.y = 380; watergirl.vx = 0; watergirl.vy = 0; watergirl.alive = true; watergirl.inDoor = false;
}

// Question bank with variety
function getQuestionForLevel(lvl) {
  const allQuestions = [
    // Motion
    { question: "What is velocity?", options: ["Just speed", "Speed with direction", "Acceleration"], answer: 1 },
    { question: "What is acceleration?", options: ["Speed", "Rate of change of velocity", "Distance/time"], answer: 1 },
    { question: "Formula for speed?", options: ["s = d/t", "s = d*t", "s = t/d"], answer: 0 },
    // Newton's Laws
    { question: "Newton's First Law?", options: ["F=ma", "Objects stay in motion unless acted upon", "Action-reaction"], answer: 1 },
    { question: "What is F=ma?", options: ["First Law", "Second Law", "Third Law"], answer: 1 },
    { question: "Action-reaction is which law?", options: ["First", "Second", "Third"], answer: 2 },
    // Energy
    { question: "Kinetic energy formula?", options: ["KE = mgh", "KE = ½mv²", "KE = mc²"], answer: 1 },
    { question: "Potential energy formula?", options: ["PE = ½mv²", "PE = mgh", "PE = mc²"], answer: 1 },
    { question: "Energy can be?", options: ["Created", "Destroyed", "Transformed"], answer: 2 },
    // Electricity
    { question: "Ohm's Law?", options: ["V = IR", "P = IV", "E = mc²"], answer: 0 },
    { question: "Unit of current?", options: ["Volt", "Ampere", "Ohm"], answer: 1 },
    { question: "Unit of resistance?", options: ["Volt", "Ampere", "Ohm"], answer: 2 },
    // Waves
    { question: "Wave speed formula?", options: ["v = f/λ", "v = fλ", "v = f+λ"], answer: 1 },
    { question: "What is frequency?", options: ["Distance between peaks", "Waves per second", "Wave height"], answer: 1 },
    { question: "Light is what type of wave?", options: ["Longitudinal", "Transverse", "Sound"], answer: 1 },
    // Modern Physics
    { question: "Speed of light?", options: ["3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s"], answer: 1 },
    { question: "E=mc² relates?", options: ["Energy and mass", "Energy and speed", "Mass and speed"], answer: 0 },
    { question: "Smallest particle?", options: ["Atom", "Molecule", "Quark"], answer: 2 },
    { question: "Quantum means?", options: ["Very small", "Discrete amount", "Very fast"], answer: 1 },
    { question: "Photon is?", options: ["Light particle", "Sound wave", "Electron"], answer: 0 }
  ];
  
  // Pick question based on level (cycle through, no immediate repeats)
  const index = (lvl - 1) % allQuestions.length;
  return allQuestions[index];
}
