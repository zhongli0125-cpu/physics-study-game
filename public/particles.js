// Particle system for visual effects
let particles = [];

class Particle {
  constructor(x, y, color, vx, vy, size = 3) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = 1;
    this.size = size;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life -= 0.02;
  }
  
  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }
  
  isDead() {
    return this.life <= 0;
  }
}

function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(
      x, y, color,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4 - 2
    ));
  }
}

function createTrail(x, y, color) {
  if (Math.random() > 0.7) {
    particles.push(new Particle(x, y, color, 0, 0.5, 2));
  }
}

function updateParticles() {
  particles.forEach(p => p.update());
  particles = particles.filter(p => !p.isDead());
}

function drawParticles(ctx) {
  particles.forEach(p => p.draw(ctx));
}
