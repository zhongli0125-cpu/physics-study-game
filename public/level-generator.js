// Improved initLevel with no spawn killing and progressive difficulty
function initLevelImproved(lvl) {
  platforms = []; lavaZones = []; waterZones = []; greenZones = []; collectibles = [];
  gameOver = false; levelComplete = false; timer = 0;
  
  // Ground
  platforms.push({ x: 0, y: 460, w: 800, h: 40, type: 'ground' });
  
  // Safe spawn area - NO hazards near start!
  const safeZone = 200;
  
  // Progressive difficulty (levels 1-100)
  const difficulty = Math.min(lvl / 10, 10); // 0 to 10
  const numPlatforms = Math.min(3 + Math.floor(lvl / 5), 15); // 3 to 15 platforms
  const numHazards = Math.min(1 + Math.floor(lvl / 10), 8); // 1 to 8 hazards
  
  // Generate platforms with increasing complexity
  for (let i = 0; i < numPlatforms; i++) {
    const x = safeZone + (i * (600 - safeZone) / numPlatforms);
    const y = 400 - Math.random() * (100 + difficulty * 10);
    const w = Math.max(60 - difficulty * 2, 40);
    platforms.push({ x, y, w, h: 20, type: 'platform' });
  }
  
  // Add hazards AWAY from spawn
  for (let i = 0; i < numHazards; i++) {
    const x = safeZone + 100 + Math.random() * 400;
    const hazardType = Math.floor(Math.random() * 3);
    if (hazardType === 0) lavaZones.push({ x, y: 440, w: 60 + difficulty * 5, h: 20 });
    else if (hazardType === 1) waterZones.push({ x, y: 440, w: 60 + difficulty * 5, h: 20 });
    else greenZones.push({ x, y: 440, w: 50 + difficulty * 3, h: 20 });
  }
  
  // Doors at the end
  doors.fire = { x: 700, y: 380 - difficulty * 5, w: 30, h: 50 };
  doors.water = { x: 750, y: 380 - difficulty * 5, w: 30, h: 50 };
  
  // Collectibles
  for (let i = 0; i < Math.min(2 + Math.floor(lvl / 10), 6); i++) {
    const type = Math.random() > 0.5 ? 'fire' : 'water';
    const x = safeZone + Math.random() * 500;
    const y = 300 - Math.random() * 100;
    collectibles.push({ x, y, type, collected: false });
  }
  
  // Get unique question for this level
  const q = getQuestionForLevel(lvl);
  questionGate = {
    x: 400 + Math.random() * 100,
    y: 250 - difficulty * 10,
    w: 60, h: 80,
    question: q.q,
    options: q.opts,
    answer: q.ans,
    passed: false
  };
  
  // Reset players in SAFE zone
  fireboy.x = 50; fireboy.y = 300; fireboy.vx = 0; fireboy.vy = 0; fireboy.alive = true; fireboy.inDoor = false;
  watergirl.x = 100; watergirl.y = 300; watergirl.vx = 0; watergirl.vy = 0; watergirl.alive = true; watergirl.inDoor = false;
}
