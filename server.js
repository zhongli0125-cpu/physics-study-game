// COPY THIS ENTIRE FILE CONTENT AND REPLACE YOUR GITHUB server.js
// This has the expanded lessons with proper syntax

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI (optional - works without API key)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Create necessary folders
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('views')) fs.mkdirSync('views');

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

// Setup SQLite database
const db = new sqlite3.Database(process.env.DATABASE_PATH || 'submissions.db');
db.run(`CREATE TABLE IF NOT EXISTS submissions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT,
  name TEXT,
  filePath TEXT,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Progress tracking table
db.run(`CREATE TABLE IF NOT EXISTS progress(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT,
  level INTEGER,
  score INTEGER,
  time INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Wrong answers tracking
db.run(`CREATE TABLE IF NOT EXISTS wrong_answers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT,
  wrong_answer TEXT,
  correct_answer TEXT,
  topic TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// AI explanation endpoint - THIS IS WHERE THE LESSONS ARE
app.post('/ai-explain', async (req, res) => {
  try {
    console.log('AI explain request received');
    const { topic } = req.body;
    console.log('Topic requested:', topic);
    
    if (!topic) {
      console.log('No topic provided');
      return res.status(400).json({ error: 'Topic required' });
    }

    let explanation;
    
    if (openai) {
      console.log('Using OpenAI');
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `Explain ${topic} in physics in 4-5 detailed paragraphs for high school students. Include key concepts, formulas, real-world examples, and common misconceptions. Make it engaging and easy to understand.`
        }],
        max_tokens: 500
      });
      explanation = completion.choices[0].message.content;
    } else {
      console.log('Using fallback explanations');
      
      // Expanded lessons with pagination support (## marks new pages)
      const fallbacks = {
  'Motion': `## MOTION - The Physics of Movement

Motion is the change in position of an object over time. Understanding motion is the foundation of all physics!

## Page 1: Distance vs Displacement

Distance (Scalar): Total path length traveled
- Always positive
- Example: Walk 3 km north, then 3 km south = 6 km distance

Displacement (Vector): Straight-line distance from start to finish with direction
- Can be positive, negative, or zero
- Same example: Displacement = 0 km (ended where you started)

Key Point: Distance ≥ Displacement always

Example: Walk 4 m east, then 3 m north
- Distance = 7 m
- Displacement = 5 m northeast (using Pythagorean theorem: √(4² + 3²) = 5)

## Page 2: Speed vs Velocity

Speed (Scalar): How fast you're going
- Formula: speed = distance / time
- Unit: m/s, km/h, mph

Velocity (Vector): How fast AND in what direction
- Formula: velocity = displacement / time
- Unit: m/s with direction

Key Difference: Two cars at 60 mph have same speed, but different velocities if going opposite directions!

Example: Drive 60 km north in 1 hour, then 60 km south in 1 hour
- Average speed = 120 km / 2 h = 60 km/h
- Average velocity = 0 km / 2 h = 0 km/h

## Page 3: Acceleration

Acceleration: Rate of change of velocity
- Formula: a = (v_final - v_initial) / time
- Unit: m/s² (meters per second squared)

Types:
1. Speeding up (positive acceleration)
2. Slowing down (negative acceleration/deceleration)
3. Changing direction (even at constant speed!)

Example: Car accelerates at 2 m/s²
- After 1 second: velocity increases by 2 m/s
- After 2 seconds: velocity increases by 4 m/s
- After 3 seconds: velocity increases by 6 m/s

## Page 4: Equations of Motion

The Big Three:

1. v = u + at
- v = final velocity, u = initial velocity, a = acceleration, t = time

2. s = ut + ½at²
- s = displacement

3. v² = u² + 2as
- Useful when you don't know time

Example: Car starts from rest, accelerates at 3 m/s² for 5 seconds
s = 0(5) + ½(3)(5²) = 37.5 meters

## Page 5: Free Fall and Gravity

Acceleration due to gravity: g = 9.8 m/s²

Amazing Fact: ALL objects fall at the same rate (without air resistance)!
- Feather and bowling ball fall together in vacuum
- Proven on the Moon by Apollo 15 astronauts

Example: Dropping a ball
- After 1 second: v = 9.8 m/s downward
- After 2 seconds: v = 19.6 m/s downward
- Keeps getting faster!

Throwing upward: Ball slows down going up, stops at peak (but acceleration is still 9.8 m/s² down!), then speeds up coming down

## Page 6: Projectile Motion

Key Principle: Horizontal and vertical motions are independent!

Horizontal: Constant velocity (no acceleration)
Vertical: Constant acceleration (gravity = 9.8 m/s² down)

Example: Cannon fires ball at 50 m/s at 30° angle
- Horizontal velocity: 50 cos(30°) = 43.3 m/s
- Vertical velocity: 50 sin(30°) = 25 m/s
- Path: Parabola (curved)

Optimal angle for maximum range: 45°

## Page 7: Practice Problems

Problem 1: Car accelerates from 0 to 27 m/s in 6 seconds. Find acceleration.
Answer: a = (27 - 0) / 6 = 4.5 m/s²

Problem 2: Throw ball upward at 20 m/s. How high does it go?
Answer: Use v² = u² + 2as where v=0, u=20, a=-9.8
0 = 400 - 19.6s → s = 20.4 meters

Problem 3: Why do heavier objects NOT fall faster?
Answer: Gravity accelerates all objects equally at 9.8 m/s². Mass doesn't matter (without air resistance)!

---

## References & Further Reading

Educational Resources:
- Khan Academy: One-Dimensional Motion (https://www.khanacademy.org/science/physics/one-dimensional-motion)
- The Physics Classroom: Kinematics (https://www.physicsclassroom.com/class/1DKin)
- HyperPhysics: Motion Concepts (http://hyperphysics.phy-astr.gsu.edu/hbase/mot.html)
- Physics LibreTexts: Kinematics (https://phys.libretexts.org)

Note: Content based on classical mechanics principles from Galileo and Newton.`,

  'Newton Laws': `## NEWTON'S LAWS OF MOTION

Sir Isaac Newton discovered three laws that explain how forces affect motion!

## Page 1: Newton's First Law - Inertia

Statement: An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

Inertia: Resistance to changes in motion. More mass = more inertia.

Examples:
- Car braking: You jerk forward (body wants to keep moving)
- Tablecloth trick: Dishes stay in place when cloth pulled quickly
- Space travel: Spacecraft keeps moving without engines

Key Point: Objects don't naturally slow down - friction slows them!

## Page 2: Newton's Second Law - F = ma

Statement: Force equals mass times acceleration

Formula: F = ma
- F = force (Newtons, N)
- m = mass (kg)
- a = acceleration (m/s²)

What it means:
- More force → More acceleration
- More mass → Less acceleration (for same force)
- Force and acceleration have same direction

The Newton: 1 N = force to accelerate 1 kg at 1 m/s²

Example: Push 10 kg box with 50 N force, friction is 20 N
- Net force = 50 - 20 = 30 N
- Acceleration: a = F/m = 30/10 = 3 m/s²

## Page 3: Weight vs Mass

Mass: Amount of matter (doesn't change)
- Measured in kilograms (kg)
- Same everywhere in universe

Weight: Force of gravity on mass
- Formula: W = mg
- Measured in Newtons (N)
- Changes with gravity

Example: 60 kg person
- On Earth: Weight = 60 × 9.8 = 588 N
- On Moon: Weight = 60 × 1.6 = 96 N (feels 6× lighter!)
- Mass is ALWAYS 60 kg

Key Point: You don't "weigh" 60 kg, you have a mass of 60 kg!

## Page 4: Newton's Third Law - Action-Reaction

Statement: For every action, there is an equal and opposite reaction.

Important: Forces act on DIFFERENT objects!

Examples:
- Walking: You push ground back → ground pushes you forward
- Swimming: You push water back → water pushes you forward
- Rocket: Pushes gas down → gas pushes rocket up
- Jumping: You push down on ground → ground pushes you up

Why don't they cancel? They act on different objects, so they don't cancel out!

## Page 5: Applications and Practice

Example: Elevator
70 kg person in elevator:
- At rest: Normal force = 686 N (feels normal)
- Accelerating up at 2 m/s²: N = 826 N (feels heavier!)
- Accelerating down at 2 m/s²: N = 546 N (feels lighter!)

Practice Problems:

Problem 1: 10 kg box pushed with 50 N, friction 20 N. Find acceleration.
Answer: Net force = 30 N, a = 30/10 = 3 m/s²

Problem 2: What force needed to accelerate 1000 kg car at 2 m/s²?
Answer: F = ma = 1000 × 2 = 2000 N

Real-World:
- Airbags: Increase collision time → reduce force
- Seatbelts: Provide force to stop you with car
- Sports: Every hit involves action-reaction pairs

---

## References & Further Reading

Primary Source:
- Newton, Isaac - "Philosophiæ Naturalis Principia Mathematica" (1687)

Educational Resources:
- Khan Academy: Forces and Newton's Laws (https://www.khanacademy.org/science/physics/forces-newtons-laws)
- The Physics Classroom: Newton's Laws (https://www.physicsclassroom.com/class/newtlaws)
- HyperPhysics: Newton's Laws (http://hyperphysics.phy-astr.gsu.edu/hbase/Newt.html)
- NASA: Newton's Laws of Motion (https://www.grc.nasa.gov/www/k-12/airplane/newton.html)

Note: Newton's laws form the foundation of classical mechanics.`,

  'Energy': `## ENERGY - The Ability to Do Work

Energy is the ability to cause change or do work. It cannot be created or destroyed, only transformed!

## Page 1: Kinetic Energy

Formula: KE = ½mv²

Why v² matters: 2× faster = 4× more energy!

Examples:
- Moving car has KE
- Flying bullet has lots of KE (high velocity)
- Wind has KE (turns turbines)

Example: 1000 kg car at 20 m/s
KE = ½ × 1000 × 20² = 200,000 J

Important: Doubling speed quadruples energy! This is why high-speed crashes are so dangerous.

## Page 2: Potential Energy

Gravitational PE Formula: PE = mgh
- m = mass, g = 9.8 m/s², h = height

Examples:
- Book on shelf has PE
- Water behind dam has PE
- Skier at top of hill has PE

Example: 10 kg object at 5 m height
PE = 10 × 9.8 × 5 = 490 J

Other types: Elastic PE (springs), Chemical PE (food, gasoline), Nuclear PE

## Page 3: Conservation of Energy

Law: Energy cannot be created or destroyed, only transformed!

Formula: Total Energy Initial = Total Energy Final

Roller Coaster Example:
- Top: Maximum PE, minimum KE
- Bottom: Minimum PE, maximum KE
- Total energy stays constant!

Example: Falling ball from 10 m
At top: PE = 196 J, KE = 0, Total = 196 J
At middle (5 m): PE = 98 J, KE = 98 J, Total = 196 J
At bottom: PE = 0, KE = 196 J, Total = 196 J

Energy transformed from PE to KE, but total stayed constant!

## Page 4: Work and Power

Work: W = Force × Distance
- Measured in Joules (J)
- Only force in direction of motion does work

Power: P = Work / Time
- Measured in Watts (W)
- 1 Watt = 1 Joule/second

Examples:
- 100 W light bulb uses 100 J every second
- Climb stairs in 5 seconds vs 10 seconds: Same work, different power!

Example: 70 kg person climbs 3 m stairs in 5 seconds
Work = mgh = 70 × 9.8 × 3 = 2058 J
Power = 2058/5 = 412 W

## Page 5: Efficiency

Formula: Efficiency = (Useful energy out / Total energy in) × 100%

No machine is 100% efficient! Some energy always becomes heat.

Examples:
- Incandescent bulb: 5% efficient (95% wasted as heat!)
- LED bulb: 20% efficient (much better)
- Car engine: 25% efficient
- Electric motor: 90% efficient

Why it matters: More efficient = less energy wasted = saves money and environment

## Page 6: Practice Problems

Problem 1: 2 kg ball thrown at 10 m/s. Find kinetic energy.
Answer: KE = ½mv² = ½ × 2 × 10² = 100 J

Problem 2: 5 kg book on 2 m shelf. Find potential energy.
Answer: PE = mgh = 5 × 9.8 × 2 = 98 J

Problem 3: Ball dropped from 20 m. What's velocity at ground?
Answer: PE converts to KE: mgh = ½mv²
gh = ½v² → v = √(2gh) = √(2 × 9.8 × 20) = 19.8 m/s

Key Takeaway: Energy is never lost, just transformed into different forms!

---

## References & Further Reading

Educational Resources:
- Khan Academy: Work and Energy (https://www.khanacademy.org/science/physics/work-and-energy)
- The Physics Classroom: Energy (https://www.physicsclassroom.com/class/energy)
- HyperPhysics: Energy Concepts (http://hyperphysics.phy-astr.gsu.edu/hbase/energy.html)
- Physics LibreTexts: Work and Energy (https://phys.libretexts.org)

Historical Note:
- Law of Conservation of Energy developed by Julius von Mayer, James Joule, and Hermann von Helmholtz (1840s)

Note: Energy conservation is one of the most fundamental principles in physics.`,

  'Electricity': `## ELECTRICITY - Flow of Electric Charge

Electricity is electrons flowing through wires. Think of it like water flowing through pipes!

## Page 1: The Three Key Concepts

1. Voltage (V) - The Push
- Like water pressure
- Measured in Volts (V)
- Wall outlet: 120V (US)

2. Current (I) - The Flow
- How many electrons flow per second
- Measured in Amperes (A)
- Current is what's dangerous!

3. Resistance (R) - The Obstacle
- What slows down flow
- Measured in Ohms (Ω)
- Thin wire = high resistance

Water Analogy:
- Voltage = Water pressure
- Current = Water flow rate
- Resistance = Pipe narrowness

## Page 2: Ohm's Law

V = I × R (Voltage = Current × Resistance)

This is the MOST IMPORTANT equation in electricity!

Three forms:
1. V = I × R (find voltage)
2. I = V/R (find current)
3. R = V/I (find resistance)

Examples:

Example 1: 12V battery, 4Ω resistor
Current: I = V/R = 12/4 = 3A

Example 2: 2A current, 6Ω resistor
Voltage: V = I × R = 2 × 6 = 12V

Example 3: 120V, 10A current
Resistance: R = V/I = 120/10 = 12Ω

## Page 3: Series vs Parallel Circuits

Series Circuit:
- Components in single path
- Same current through all
- Voltages add: V_total = V1 + V2 + V3
- Resistances add: R_total = R1 + R2 + R3
- If one breaks, all stop (old Christmas lights)

Parallel Circuit:
- Components in multiple paths
- Same voltage across all
- Currents add: I_total = I1 + I2 + I3
- Resistances: 1/R_total = 1/R1 + 1/R2 + 1/R3
- If one breaks, others work (house outlets)

Example: Three 10Ω resistors
- In series: R_total = 10 + 10 + 10 = 30Ω
- In parallel: 1/R_total = 1/10 + 1/10 + 1/10 = 3/10, so R_total = 3.33Ω

## Page 4: Electrical Power

Formula: P = V × I (Power = Voltage × Current)

Also: P = I²R and P = V²/R

Unit: Watts (W)

Examples:
- 60W light bulb at 120V: I = P/V = 60/120 = 0.5A
- Phone charger: 5V × 2A = 10W
- Microwave: 120V × 10A = 1200W

Electricity Bill:
- Energy = Power × Time
- Unit: kilowatt-hour (kWh)
- Example: 100W bulb for 10 hours = 1 kWh
- At $0.12/kWh: Cost = $0.12

## Page 5: Electrical Safety

Current is what kills, not voltage!

Effects on human body:
- 1 mA: Barely feel it
- 10 mA: Can't let go
- 100 mA: Can be FATAL!

Safety Rules:
1. Never touch wires with wet hands (lowers resistance!)
2. Don't use electrical devices near water
3. Don't overload outlets
4. Use circuit breakers
5. Keep water away from electricity

Why wet hands are dangerous:
- Dry skin: 100,000Ω resistance
- Wet skin: 1,000Ω resistance (100× less!)
- Same voltage → 100× more current!

## Page 6: Practice Problems

Problem 1: 12V battery, 4Ω resistor. Find current and power.
Answer: I = 12/4 = 3A, P = 12 × 3 = 36W

Problem 2: Device uses 5A at 120V. Find power and cost for 3 hours at $0.12/kWh.
Answer: P = 120 × 5 = 600W = 0.6kW
Energy = 0.6 × 3 = 1.8 kWh
Cost = 1.8 × $0.12 = $0.22

Problem 3: Why do power lines use high voltage?
Answer: Higher voltage = lower current for same power. Lower current = less power loss in wires (P = I²R). That's why transmission lines use 100,000+ volts!

---

## References & Further Reading

Educational Resources:
- Khan Academy: Circuits (https://www.khanacademy.org/science/physics/circuits-topic)
- The Physics Classroom: Electric Circuits (https://www.physicsclassroom.com/class/circuits)
- All About Circuits (https://www.allaboutcircuits.com)
- HyperPhysics: Electricity and Magnetism (http://hyperphysics.phy-astr.gsu.edu/hbase/electric/elecon.html)
- Electronics Tutorials: Basic Electronics (https://www.electronics-tutorials.ws)

Historical Note:
- Ohm's Law discovered by Georg Ohm (1827)
- Electric power systems developed by Thomas Edison and Nikola Tesla (1880s)

Note: Modern civilization depends on electrical power distribution.`,

  'Waves': `## WAVES - Energy Transfer

Waves transfer energy from one place to another without moving material!

## Page 1: What Are Waves?

Wave: A disturbance that transfers energy

Key Concept: The wave moves, but material just oscillates in place!

Example: Ocean wave travels across ocean, but water just moves up and down in circles.

Wave Parts:
- Crest: Highest point
- Trough: Lowest point
- Wavelength (λ): Distance between crests
- Amplitude: Height of wave (more amplitude = more energy)
- Frequency (f): Waves per second (Hz)
- Period (T): Time for one wave (T = 1/f)

## Page 2: Types of Waves

Transverse Waves: Particles move perpendicular to wave direction
- Examples: Light, water waves, rope waves
- Visualization: Shake rope up/down, wave travels horizontally

Longitudinal Waves: Particles move parallel to wave direction
- Examples: Sound waves, slinky compression waves
- Visualization: Push/pull slinky, compressions travel along it

Key Difference: Direction of particle motion relative to wave direction

## Page 3: Wave Equation

v = f × λ (Speed = Frequency × Wavelength)

This is the FUNDAMENTAL WAVE EQUATION!

Examples:

Example 1: Sound
Frequency: 440 Hz (A note)
Speed: 343 m/s
Wavelength: λ = v/f = 343/440 = 0.78 m

Example 2: Light
Wavelength: 500 nm (green)
Speed: 3 × 10⁸ m/s
Frequency: f = v/λ = (3 × 10⁸)/(500 × 10⁻⁹) = 6 × 10¹⁴ Hz

Key Point: If frequency doubles, wavelength halves (for constant speed)

## Page 4: Electromagnetic Spectrum

ALL electromagnetic waves travel at light speed: c = 3 × 10⁸ m/s

From longest to shortest wavelength:
1. Radio waves: Radio, TV, WiFi
2. Microwaves: Microwave ovens, radar
3. Infrared: Heat, remote controls
4. Visible Light: ROYGBIV (Red to Violet)
5. Ultraviolet: Sunburn, kills bacteria
6. X-rays: Medical imaging, see bones
7. Gamma rays: Most energetic, most dangerous

Key: Longer wavelength = Lower frequency = Lower energy

Why sky is blue: Blue light scatters more than red (shorter wavelength)

## Page 5: Wave Behaviors

1. Reflection: Wave bounces off surface
- Examples: Mirrors (light), echoes (sound)
- Law: Angle in = Angle out

2. Refraction: Wave bends when entering different medium
- Cause: Speed changes in different materials
- Examples: Straw looks bent in water, rainbows

3. Diffraction: Wave spreads through opening or around obstacle
- More diffraction when wavelength ≈ opening size
- Why we hear around corners but don't see around them!

4. Interference: Waves overlap and combine
- Constructive: Crests align → bigger wave
- Destructive: Crest meets trough → cancel out
- Example: Noise-canceling headphones create opposite wave

## Page 6: Sound Waves

Sound: Longitudinal pressure waves through matter

Cannot travel through vacuum! (No medium = no sound)

Speed of sound:
- Air: 343 m/s
- Water: 1480 m/s (4× faster)
- Steel: 5960 m/s (17× faster)

Properties:
- Pitch: Determined by frequency (high frequency = high pitch)
- Loudness: Determined by amplitude (big amplitude = loud)
- Human hearing: 20 Hz to 20,000 Hz

Doppler Effect: Frequency changes when source moves
- Approaching: Higher pitch (ambulance siren)
- Moving away: Lower pitch

Decibels (dB):
- 30 dB: Whisper
- 60 dB: Normal conversation
- 120 dB: Rock concert (pain threshold)
- 140 dB: Jet engine (immediate damage)

## Page 7: Practice Problems

Problem 1: Wave has frequency 50 Hz and wavelength 2 m. Find speed.
Answer: v = f × λ = 50 × 2 = 100 m/s

Problem 2: Sound in air (343 m/s) has frequency 686 Hz. Find wavelength.
Answer: λ = v/f = 343/686 = 0.5 m

Problem 3: Why can't sound travel through space?
Answer: Sound needs matter (medium) to travel through. Space is a vacuum with no matter!

Problem 4: Light has wavelength 600 nm. Find frequency.
Answer: f = c/λ = (3 × 10⁸)/(600 × 10⁻⁹) = 5 × 10¹⁴ Hz

---

## References & Further Reading

Educational Resources:
- Khan Academy: Waves and Sound (https://www.khanacademy.org/science/physics/mechanical-waves-and-sound)
- The Physics Classroom: Sound Waves (https://www.physicsclassroom.com/class/sound)
- HyperPhysics: Wave Motion (http://hyperphysics.phy-astr.gsu.edu/hbase/wave.html)
- Physics LibreTexts: Waves (https://phys.libretexts.org)

Historical Note:
- Wave equation developed by Jean le Rond d'Alembert (1747)
- Electromagnetic waves predicted by James Clerk Maxwell (1865)

Note: Wave phenomena appear throughout physics from sound to light to quantum mechanics.`,

  'Modern Physics': `## MODERN PHYSICS - The Extreme Universe

Modern Physics explains the very small (atoms) and very fast (near light speed)!

## Page 1: Special Relativity Basics

Einstein's Two Postulates (1905):
1. Laws of physics same in all inertial reference frames
2. Speed of light is constant for all observers: c = 3 × 10⁸ m/s

Time Dilation: Moving clocks run slower!

Formula: t' = t / √(1 - v²/c²)

Example: Travel at 0.9c (90% light speed) for 1 year (your time)
- γ = 1/√(1 - 0.9²) = 2.29
- Earth time = 1 × 2.29 = 2.29 years
- You age 1 year, Earth ages 2.29 years!

Real Evidence: Muons from upper atmosphere reach ground due to time dilation!

## Page 2: E = mc²

Mass-Energy Equivalence: Mass and energy are the same thing!

Formula: E = mc²
- E = energy (Joules)
- m = mass (kg)
- c = speed of light

Why c²? c² = 9 × 10¹⁶ → Tiny mass = HUGE energy!

Example: 1 gram of matter
E = 0.001 × (3 × 10⁸)² = 9 × 10¹³ J
= 21 kilotons of TNT (more than Hiroshima bomb!)

Applications:
- Nuclear power: Uranium fission releases energy
- The Sun: Converts 4 million tons of mass to energy every second!
- Why nothing can reach light speed: Would need infinite energy

## Page 3: General Relativity

Key Idea: Gravity is not a force - it's curved spacetime!

Massive objects bend spacetime, objects follow curved paths

Predictions:
1. Gravitational Time Dilation: Time runs slower in stronger gravity
2. Gravitational Lensing: Light bends around massive objects
3. Gravitational Waves: Ripples in spacetime (detected 2015!)
4. Black Holes: Extreme curvature, nothing escapes

GPS Example: Satellites need relativity corrections!
- Without corrections: GPS off by 11 km per day
- Proves relativity is real and practical!

Black Holes:
- Event horizon: Point of no return
- Singularity: Infinite density at center
- Time stops at event horizon (from outside view)

## Page 4: Quantum Mechanics Basics

The Quantum World:
At atomic scales, reality is WEIRD!

Key Principles:
1. Energy is quantized (comes in discrete packets)
2. Wave-particle duality (everything is both)
3. Uncertainty principle (can't know everything)
4. Superposition (multiple states at once)
5. Probability (can only predict probabilities)

Why Quantum Mechanics?
- Classical physics failed for atoms
- Quantum mechanics explains: atomic structure, chemistry, electronics, lasers

Most precisely tested theory ever! Predictions accurate to 12 decimal places.

## Page 5: Wave-Particle Duality

Everything is BOTH wave AND particle!

Light as Particles (Photons):
- Photoelectric Effect: Light ejects electrons from metal
- Each photon has energy: E = hf (h = Planck's constant)
- Higher frequency = more energy per photon

Light as Waves:
- Interference patterns
- Diffraction
- Polarization

Matter as Waves:
- de Broglie wavelength: λ = h/(mv)
- Electrons show interference patterns!
- Everything has wave nature

Example: Electron at 10⁶ m/s
λ = 7.3 × 10⁻¹⁰ m (atomic size - wave effects observable!)

Double-Slit Experiment: Particles go through BOTH slits simultaneously! Observation changes the result!

## Page 6: Heisenberg Uncertainty Principle

You cannot know both position AND momentum precisely!

Formula: Δx × Δp ≥ h/(4π)

What it means:
- More precisely you know position → less precisely you know momentum
- This is NOT a measurement problem
- This is how nature fundamentally works!

Why? Particles are waves! Waves are spread out.

Example: If you know electron position within atomic size (10⁻¹⁰ m), momentum uncertainty prevents collapse into nucleus!

Philosophical Impact: Reality is fundamentally uncertain. Can only predict probabilities, not certainties.

## Page 7: Quantum Superposition and Entanglement

Superposition: Particles exist in multiple states simultaneously until measured!

Schrödinger's Cat (Thought Experiment):
- Cat in box with radioactive atom
- Before opening: Cat is BOTH alive AND dead
- Opening box = measurement → collapses to one state
- Shows absurdity of quantum rules at macro scale

Quantum Entanglement:
Two particles become correlated - measuring one instantly affects the other!

Example: Two entangled photons with opposite spins
- Measure one: Gets spin up
- Other INSTANTLY becomes spin down
- Even if separated by light-years!
- Einstein called it "spooky action at a distance"

Bell's Theorem: Proved entanglement is real! No hidden variables can explain it.

Applications:
- Quantum computing: Use superposition for parallel computation
- Quantum cryptography: Unbreakable encryption
- Quantum teleportation: Transfer quantum states

## Page 8: Real-World Applications

1. Nuclear Energy:
- E = mc² explains nuclear power
- 1 kg uranium = 3 million kg coal
- Powers 20% of US electricity

2. Semiconductors & Electronics:
- Transistors work via quantum mechanics
- Billions in every computer chip
- LEDs, solar panels, all electronics

3. Lasers:
- Quantum process (stimulated emission)
- Uses: Surgery, fiber optics, manufacturing, Blu-ray

4. Medical Imaging:
- MRI: Uses quantum spin of atoms
- PET scans: Uses antimatter (positrons!)

5. GPS:
- Requires both special and general relativity corrections
- Without them: Off by miles per day!

6. Quantum Computing:
- Uses superposition and entanglement
- Can solve certain problems exponentially faster
- Future of computing!

## Page 9: Mind-Blowing Facts

Time Travel (Forward):
- Travel near light speed → time slows for you
- Return to Earth → you've traveled to future!
- Example: Travel at 0.999c for 1 year → Earth ages 22.4 years

Antimatter:
- For every particle, there's an antiparticle
- Matter + Antimatter → Pure energy (100% efficient!)
- Why is universe made of matter, not antimatter? Mystery!

Quantum Tunneling:
- Particles can pass through barriers they shouldn't!
- Why radioactivity happens
- Why the sun shines (protons tunnel through repulsion)
- Used in: Flash memory, scanning tunneling microscopes

Dark Matter & Dark Energy:
- Dark Matter: 27% of universe (only detected through gravity)
- Dark Energy: 68% of universe (causes expansion)
- Normal Matter: Only 5% of universe!

Unsolved Mysteries:
1. How to combine quantum mechanics and general relativity?
2. What is dark matter?
3. What is dark energy?
4. Why more matter than antimatter?
5. What happened before Big Bang?

## Page 10: Practice Problems

Problem 1: Spaceship travels at 0.8c. How much time passes on Earth while 5 years pass on ship?
Answer: γ = 1/√(1-0.8²) = 1.67, Earth time = 5 × 1.67 = 8.35 years

Problem 2: How much energy from 0.01 kg of matter?
Answer: E = mc² = 0.01 × (3×10⁸)² = 9 × 10¹⁴ J (200,000 tons of TNT!)

Problem 3: Photon has wavelength 500 nm. Find energy.
Answer: f = c/λ = 6 × 10¹⁴ Hz, E = hf = 4.0 × 10⁻¹⁹ J

Key Takeaways:
- Time and space are relative
- Mass and energy are equivalent
- Everything is both wave and particle
- Reality is fundamentally uncertain
- Observation affects reality
- Modern physics powers all modern technology!

---

## References & Further Reading

Educational Resources:
- Khan Academy: Special Relativity (https://www.khanacademy.org/science/physics/special-relativity)
- Khan Academy: Quantum Physics (https://www.khanacademy.org/science/physics/quantum-physics)
- The Physics Classroom: Modern Physics (https://www.physicsclassroom.com)
- HyperPhysics: Relativity (http://hyperphysics.phy-astr.gsu.edu/hbase/Relativ/relcon.html)
- HyperPhysics: Quantum Physics (http://hyperphysics.phy-astr.gsu.edu/hbase/quacon.html)
- MIT OpenCourseWare: Modern Physics (https://ocw.mit.edu)

Historical Context:
- Einstein's Special Relativity (1905) and General Relativity (1915)
- Quantum mechanics developed by Planck, Bohr, Heisenberg, Schrödinger (1900-1930s)

Note: Content adapted from standard high school and introductory college physics curricula.`
      }
      
      explanation = fallbacks[topic] || `${topic} is an important physics concept.`;
      console.log('Explanation length:', explanation.length);
    }

    console.log('Sending response');
    res.json({ explanation });
  } catch (error) {
    console.error('AI explain error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate explanation', details: error.message });
  }
});

// Generate flashcards endpoint
app.post('/generate-flashcards', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });

    const fallbackCards = {
      'Motion': [
        { question: 'What is velocity?', answer: 'Speed with direction (vector quantity)' },
        { question: 'Formula for acceleration?', answer: 'a = (v_f - v_i) / t' },
        { question: 'What is displacement?', answer: 'Change in position with direction' }
      ],
      'Newton Laws': [
        { question: 'State Newton\'s 1st Law', answer: 'Object stays at rest/motion unless force acts on it' },
        { question: 'What is F=ma?', answer: 'Force equals mass times acceleration (2nd Law)' },
        { question: 'Newton\'s 3rd Law example?', answer: 'Rocket pushes gas down, gas pushes rocket up' }
      ],
      'Energy': [
        { question: 'Kinetic energy formula?', answer: 'KE = ½mv²' },
        { question: 'Potential energy formula?', answer: 'PE = mgh' },
        { question: 'Law of conservation?', answer: 'Energy cannot be created or destroyed' }
      ],
      'Electricity': [
        { question: 'What is Ohm\'s Law?', answer: 'V = IR (Voltage = Current × Resistance)' },
        { question: 'Unit of current?', answer: 'Ampere (A)' },
        { question: 'What is resistance?', answer: 'Opposition to flow of electric current' }
      ],
      'Waves': [
        { question: 'Wave speed formula?', answer: 'v = fλ (speed = frequency × wavelength)' },
        { question: 'What is frequency?', answer: 'Number of waves passing per second (Hz)' },
        { question: 'Transverse vs longitudinal?', answer: 'Transverse: perpendicular motion, Longitudinal: parallel motion' }
      ],
      'Modern Physics': [
        { question: 'What is E=mc²?', answer: 'Mass and energy are equivalent; tiny mass = huge energy' },
        { question: 'What is time dilation?', answer: 'Time slows down as you approach light speed' },
        { question: 'Wave-particle duality?', answer: 'Light and matter behave as both waves and particles' }
      ]
    };
    const flashcards = fallbackCards[topic] || [
      { question: `What is ${topic}?`, answer: 'Study your textbook for details!' }
    ];

    res.json({ flashcards });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// Q&A endpoint
app.post('/ask-question', async (req, res) => {
  try {
    const { topic, question } = req.body;
    if (!topic || !question) return res.status(400).json({ error: 'Topic and question required' });
    
    // Get the lesson content for context
    const lessonContent = fallbacks[topic] || `This is about ${topic} in physics.`;
    
    const prompt = `You are a physics tutor. A student is studying "${topic}" and has asked: "${question}"

Context from the lesson:
${lessonContent.substring(0, 1000)}

Provide a clear, concise answer to their question. Keep it educational and easy to understand.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    const answer = completion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error('Q&A error:', error);
    res.status(500).json({ error: 'Failed to answer question', details: error.message });
  }
});

// PDF upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ problems: 'PDF uploaded successfully!', filename: req.file.filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Form submission endpoint
app.post('/submit', upload.single('file'), (req, res) => {
  const { topic, name, link } = req.body;
  if (!topic || !name) return res.status(400).send('Topic and name are required');
  const filePath = req.file ? req.file.path : null;
  db.run(
    `INSERT INTO submissions(topic, name, filePath, link) VALUES(?,?,?,?)`,
    [topic, name, filePath, link],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Error saving submission');
      }
      res.send('Submission successful!');
    }
  );
});

// View submissions
app.get('/submissions', (req, res) => {
  db.all(`SELECT * FROM submissions ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Error fetching submissions');
    }
    res.render('submissions', { submissions: rows });
  });
});

// Save game progress
app.post('/save-progress', (req, res) => {
  const { player_name, level, score, time } = req.body;
  db.run(
    `INSERT INTO progress(player_name, level, score, time) VALUES(?,?,?,?)`,
    [player_name || 'Anonymous', level, score, time],
    function(err) {
      if (err) {
        console.error('Progress save error:', err);
        return res.status(500).json({ error: 'Failed to save progress' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Get leaderboard
app.get('/leaderboard', (req, res) => {
  db.all(
    `SELECT player_name, level, score, time, created_at 
     FROM progress 
     ORDER BY level DESC, score DESC, time ASC 
     LIMIT 10`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Leaderboard error:', err);
        return res.status(500).json({ error: 'Failed to fetch leaderboard' });
      }
      res.json({ leaderboard: rows });
    }
  );
});

// Track wrong answers
app.post('/track-wrong-answer', (req, res) => {
  const { question, wrong_answer, correct_answer, topic } = req.body;
  db.run(
    `INSERT INTO wrong_answers(question, wrong_answer, correct_answer, topic) VALUES(?,?,?,?)`,
    [question, wrong_answer, correct_answer, topic],
    function(err) {
      if (err) {
        console.error('Wrong answer tracking error:', err);
        return res.status(500).json({ error: 'Failed to track answer' });
      }
      res.json({ success: true });
    }
  );
});

// Get review questions (questions user got wrong)
app.get('/review-questions', (req, res) => {
  db.all(
    `SELECT question, correct_answer, topic, COUNT(*) as times_wrong
     FROM wrong_answers
     GROUP BY question
     ORDER BY times_wrong DESC
     LIMIT 5`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Review questions error:', err);
        return res.status(500).json({ error: 'Failed to fetch review questions' });
      }
      res.json({ questions: rows });
    }
  );
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err);
    console.log('\nDatabase closed. Server shutting down.');
    process.exit(0);
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🔥💧 Physics Game Server running at http://localhost:${port}`);
  console.log(`📱 Access from other devices: http://YOUR_IP_ADDRESS:${port}`);
  console.log(`💡 To find your IP: Run "ipconfig" (Windows) or "ifconfig" (Mac/Linux)`);
  if (!openai) console.log('⚠️  No OpenAI API key found. Using fallback content.');
});



