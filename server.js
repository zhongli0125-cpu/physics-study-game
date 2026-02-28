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

// AI explanation endpoint
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
      // STREAMLINED LESSONS - Balanced detail, not overwhelming (## marks new pages)
      const fallbacks = {
  'Motion': `## MOTION - The Physics of Movement

Motion is the change in position of an object over time. Understanding motion is the foundation of all physics!

## Page 1: Distance vs Displacement

**Distance (Scalar):** Total path length traveled
- Always positive
- Example: Walk 3 km north, then 3 km south = 6 km distance

**Displacement (Vector):** Straight-line distance from start to finish with direction
- Can be positive, negative, or zero
- Same example: Displacement = 0 km (ended where you started)

**Key Point:** Distance ≥ Displacement always

**Example:** Walk 4 m east, then 3 m north
- Distance = 7 m
- Displacement = 5 m northeast (using Pythagorean theorem: √(4² + 3²) = 5)

## Page 2: Speed vs Velocity

**Speed (Scalar):** How fast you're going
- Formula: speed = distance / time
- Unit: m/s, km/h, mph

**Velocity (Vector):** How fast AND in what direction
- Formula: velocity = displacement / time
- Unit: m/s with direction

**Key Difference:** Two cars at 60 mph have same speed, but different velocities if going opposite directions!

**Example:** Drive 60 km north in 1 hour, then 60 km south in 1 hour
- Average speed = 120 km / 2 h = 60 km/h
- Average velocity = 0 km / 2 h = 0 km/h

## Page 3: Acceleration

**Acceleration:** Rate of change of velocity
- Formula: a = (v_final - v_initial) / time
- Unit: m/s² (meters per second squared)

**Types:**
1. Speeding up (positive acceleration)
2. Slowing down (negative acceleration/deceleration)
3. Changing direction (even at constant speed!)

**Example:** Car accelerates at 2 m/s²
- After 1 second: velocity increases by 2 m/s
- After 2 seconds: velocity increases by 4 m/s
- After 3 seconds: velocity increases by 6 m/s

## Page 4: Equations of Motion

**The Big Three:**

**1. v = u + at**
- v = final velocity, u = initial velocity, a = acceleration, t = time

**2. s = ut + ½at²**
- s = displacement

**3. v² = u² + 2as**
- Useful when you don't know time

**Example:** Car starts from rest, accelerates at 3 m/s² for 5 seconds
s = 0(5) + ½(3)(5²) = 37.5 meters

## Page 5: Free Fall and Gravity

**Acceleration due to gravity:** g = 9.8 m/s²

**Amazing Fact:** ALL objects fall at the same rate (without air resistance)!
- Feather and bowling ball fall together in vacuum
- Proven on the Moon by Apollo 15 astronauts

**Example: Dropping a ball**
- After 1 second: v = 9.8 m/s downward
- After 2 seconds: v = 19.6 m/s downward
- Keeps getting faster!

**Throwing upward:** Ball slows down going up, stops at peak (but acceleration is still 9.8 m/s² down!), then speeds up coming down

## Page 6: Projectile Motion

**Key Principle:** Horizontal and vertical motions are independent!

**Horizontal:** Constant velocity (no acceleration)
**Vertical:** Constant acceleration (gravity = 9.8 m/s² down)

**Example:** Cannon fires ball at 50 m/s at 30° angle
- Horizontal velocity: 50 cos(30°) = 43.3 m/s
- Vertical velocity: 50 sin(30°) = 25 m/s
- Path: Parabola (curved)

**Optimal angle for maximum range:** 45°

## Page 7: Practice Problems

**Problem 1:** Car accelerates from 0 to 27 m/s in 6 seconds. Find acceleration.
**Answer:** a = (27 - 0) / 6 = 4.5 m/s²

**Problem 2:** Throw ball upward at 20 m/s. How high does it go?
**Answer:** Use v² = u² + 2as where v=0, u=20, a=-9.8
0 = 400 - 19.6s → s = 20.4 meters

**Problem 3:** Why do heavier objects NOT fall faster?
**Answer:** Gravity accelerates all objects equally at 9.8 m/s². Mass doesn't matter (without air resistance)!`,

  'Newton Laws': `## NEWTON'S LAWS OF MOTION

Sir Isaac Newton discovered three laws that explain how forces affect motion!

## Page 1: Newton's First Law - Inertia

**Statement:** An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

**Inertia:** Resistance to changes in motion. More mass = more inertia.

**Examples:**
- Car braking: You jerk forward (body wants to keep moving)
- Tablecloth trick: Dishes stay in place when cloth pulled quickly
- Space travel: Spacecraft keeps moving without engines

**Key Point:** Objects don't naturally slow down - friction slows them!

## Page 2: Newton's Second Law - F = ma

**Statement:** Force equals mass times acceleration

**Formula:** F = ma
- F = force (Newtons, N)
- m = mass (kg)
- a = acceleration (m/s²)

**What it means:**
- More force → More acceleration
- More mass → Less acceleration (for same force)
- Force and acceleration have same direction

**The Newton:** 1 N = force to accelerate 1 kg at 1 m/s²

**Example:** Push 10 kg box with 50 N force, friction is 20 N
- Net force = 50 - 20 = 30 N
- Acceleration: a = F/m = 30/10 = 3 m/s²

## Page 3: Weight vs Mass

**Mass:** Amount of matter (doesn't change)
- Measured in kilograms (kg)
- Same everywhere in universe

**Weight:** Force of gravity on mass
- Formula: W = mg
- Measured in Newtons (N)
- Changes with gravity

**Example: 60 kg person**
- On Earth: Weight = 60 × 9.8 = 588 N
- On Moon: Weight = 60 × 1.6 = 96 N (feels 6× lighter!)
- Mass is ALWAYS 60 kg

**Key Point:** You don't "weigh" 60 kg, you have a mass of 60 kg!

## Page 4: Newton's Third Law - Action-Reaction

**Statement:** For every action, there is an equal and opposite reaction.

**Important:** Forces act on DIFFERENT objects!

**Examples:**
- Walking: You push ground back → ground pushes you forward
- Swimming: You push water back → water pushes you forward
- Rocket: Pushes gas down → gas pushes rocket up
- Jumping: You push down on ground → ground pushes you up

**Why don't they cancel?** They act on different objects, so they don't cancel out!

## Page 5: Applications and Practice

**Example: Elevator**
70 kg person in elevator:
- At rest: Normal force = 686 N (feels normal)
- Accelerating up at 2 m/s²: N = 826 N (feels heavier!)
- Accelerating down at 2 m/s²: N = 546 N (feels lighter!)

**Practice Problems:**

**Problem 1:** 10 kg box pushed with 50 N, friction 20 N. Find acceleration.
**Answer:** Net force = 30 N, a = 30/10 = 3 m/s²

**Problem 2:** What force needed to accelerate 1000 kg car at 2 m/s²?
**Answer:** F = ma = 1000 × 2 = 2000 N

**Real-World:**
- Airbags: Increase collision time → reduce force
- Seatbelts: Provide force to stop you with car
- Sports: Every hit involves action-reaction pairs`,

  'Energy': `## ENERGY - The Ability to Do Work

Energy is the ability to cause change or do work. It cannot be created or destroyed, only transformed!

## Page 1: Kinetic Energy

**Formula:** KE = ½mv²

**Why v² matters:** 2× faster = 4× more energy!

**Examples:**
- Moving car has KE
- Flying bullet has lots of KE (high velocity)
- Wind has KE (turns turbines)

**Example:** 1000 kg car at 20 m/s
KE = ½ × 1000 × 20² = 200,000 J

**Important:** Doubling speed quadruples energy! This is why high-speed crashes are so dangerous.

## Page 2: Potential Energy

**Gravitational PE Formula:** PE = mgh
- m = mass, g = 9.8 m/s², h = height

**Examples:**
- Book on shelf has PE
- Water behind dam has PE
- Skier at top of hill has PE

**Example:** 10 kg object at 5 m height
PE = 10 × 9.8 × 5 = 490 J

**Other types:** Elastic PE (springs), Chemical PE (food, gasoline), Nuclear PE

## Page 3: Conservation of Energy

**Law:** Energy cannot be created or destroyed, only transformed!

**Formula:** Total Energy Initial = Total Energy Final

**Roller Coaster Example:**
- Top: Maximum PE, minimum KE
- Bottom: Minimum PE, maximum KE
- Total energy stays constant!

**Example: Falling ball from 10 m**
At top: PE = 196 J, KE = 0, Total = 196 J
At middle (5 m): PE = 98 J, KE = 98 J, Total = 196 J
At bottom: PE = 0, KE = 196 J, Total = 196 J

Energy transformed from PE to KE, but total stayed constant!

## Page 4: Work and Power

**Work:** W = Force × Distance
- Measured in Joules (J)
- Only force in direction of motion does work

**Power:** P = Work / Time
- Measured in Watts (W)
- 1 Watt = 1 Joule/second

**Examples:**
- 100 W light bulb uses 100 J every second
- Climb stairs in 5 seconds vs 10 seconds: Same work, different power!

**Example:** 70 kg person climbs 3 m stairs in 5 seconds
Work = mgh = 70 × 9.8 × 3 = 2058 J
Power = 2058/5 = 412 W

## Page 5: Efficiency

**Formula:** Efficiency = (Useful energy out / Total energy in) × 100%

**No machine is 100% efficient!** Some energy always becomes heat.

**Examples:**
- Incandescent bulb: 5% efficient (95% wasted as heat!)
- LED bulb: 20% efficient (much better)
- Car engine: 25% efficient
- Electric motor: 90% efficient

**Why it matters:** More efficient = less energy wasted = saves money and environment

## Page 6: Practice Problems

**Problem 1:** 2 kg ball thrown at 10 m/s. Find kinetic energy.
**Answer:** KE = ½mv² = ½ × 2 × 10² = 100 J

**Problem 2:** 5 kg book on 2 m shelf. Find potential energy.
**Answer:** PE = mgh = 5 × 9.8 × 2 = 98 J

**Problem 3:** Ball dropped from 20 m. What's velocity at ground?
**Answer:** PE converts to KE: mgh = ½mv²
gh = ½v² → v = √(2gh) = √(2 × 9.8 × 20) = 19.8 m/s

**Key Takeaway:** Energy is never lost, just transformed into different forms!`,

  'Electricity': `## ELECTRICITY - Flow of Electric Charge

Electricity is electrons flowing through wires. Think of it like water flowing through pipes!

## Page 1: The Three Key Concepts

**1. Voltage (V) - The Push**
- Like water pressure
- Measured in Volts (V)
- Wall outlet: 120V (US)

**2. Current (I) - The Flow**
- How many electrons flow per second
- Measured in Amperes (A)
- Current is what's dangerous!

**3. Resistance (R) - The Obstacle**
- What slows down flow
- Measured in Ohms (Ω)
- Thin wire = high resistance

**Water Analogy:**
- Voltage = Water pressure
- Current = Water flow rate
- Resistance = Pipe narrowness

## Page 2: Ohm's Law

**V = I × R** (Voltage = Current × Resistance)

This is the MOST IMPORTANT equation in electricity!

**Three forms:**
1. V = I × R (find voltage)
2. I = V/R (find current)
3. R = V/I (find resistance)

**Examples:**

**Example 1:** 12V battery, 4Ω resistor
Current: I = V/R = 12/4 = 3A

**Example 2:** 2A current, 6Ω resistor
Voltage: V = I × R = 2 × 6 = 12V

**Example 3:** 120V, 10A current
Resistance: R = V/I = 120/10 = 12Ω

## Page 3: Series vs Parallel Circuits

**Series Circuit:**
- Components in single path
- Same current through all
- Voltages add: V_total = V1 + V2 + V3
- Resistances add: R_total = R1 + R2 + R3
- If one breaks, all stop (old Christmas lights)

**Parallel Circuit:**
- Components in multiple paths
- Same voltage across all
- Currents add: I_total = I1 + I2 + I3
- Resistances: 1/R_total = 1/R1 + 1/R2 + 1/R3
- If one breaks, others work (house outlets)

**Example:** Three 10Ω resistors
- In series: R_total = 10 + 10 + 10 = 30Ω
- In parallel: 1/R_total = 1/10 + 1/10 + 1/10 = 3/10, so R_total = 3.33Ω

## Page 4: Electrical Power

**Formula:** P = V × I (Power = Voltage × Current)

**Also:** P = I²R and P = V²/R

**Unit:** Watts (W)

**Examples:**
- 60W light bulb at 120V: I = P/V = 60/120 = 0.5A
- Phone charger: 5V × 2A = 10W
- Microwave: 120V × 10A = 1200W

**Electricity Bill:**
- Energy = Power × Time
- Unit: kilowatt-hour (kWh)
- Example: 100W bulb for 10 hours = 1 kWh
- At $0.12/kWh: Cost = $0.12

## Page 5: Electrical Safety

**Current is what kills, not voltage!**

**Effects on human body:**
- 1 mA: Barely feel it
- 10 mA: Can't let go
- 100 mA: Can be FATAL!

**Safety Rules:**
1. Never touch wires with wet hands (lowers resistance!)
2. Don't use electrical devices near water
3. Don't overload outlets
4. Use circuit breakers
5. Keep water away from electricity

**Why wet hands are dangerous:**
- Dry skin: 100,000Ω resistance
- Wet skin: 1,000Ω resistance (100× less!)
- Same voltage → 100× more current!

## Page 6: Practice Problems

**Problem 1:** 12V battery, 4Ω resistor. Find current and power.
**Answer:** I = 12/4 = 3A, P = 12 × 3 = 36W

**Problem 2:** Device uses 5A at 120V. Find power and cost for 3 hours at $0.12/kWh.
**Answer:** P = 120 × 5 = 600W = 0.6kW
Energy = 0.6 × 3 = 1.8 kWh
Cost = 1.8 × $0.12 = $0.22

**Problem 3:** Why do power lines use high voltage?
**Answer:** Higher voltage = lower current for same power. Lower current = less power loss in wires (P = I²R). That's why transmission lines use 100,000+ volts!`,

  'Waves': `## WAVES - Energy Transfer

Waves transfer energy from one place to another without moving material!

## Page 1: What Are Waves?

**Wave:** A disturbance that transfers energy

**Key Concept:** The wave moves, but material just oscillates in place!

**Example:** Ocean wave travels across ocean, but water just moves up and down in circles.

**Wave Parts:**
- **Crest:** Highest point
- **Trough:** Lowest point
- **Wavelength (λ):** Distance between crests
- **Amplitude:** Height of wave (more amplitude = more energy)
- **Frequency (f):** Waves per second (Hz)
- **Period (T):** Time for one wave (T = 1/f)

## Page 2: Types of Waves

**Transverse Waves:** Particles move perpendicular to wave direction
- Examples: Light, water waves, rope waves
- Visualization: Shake rope up/down, wave travels horizontally

**Longitudinal Waves:** Particles move parallel to wave direction
- Examples: Sound waves, slinky compression waves
- Visualization: Push/pull slinky, compressions travel along it

**Key Difference:** Direction of particle motion relative to wave direction

## Page 3: Wave Equation

**v = f × λ** (Speed = Frequency × Wavelength)

This is the FUNDAMENTAL WAVE EQUATION!

**Examples:**

**Example 1: Sound**
Frequency: 440 Hz (A note)
Speed: 343 m/s
Wavelength: λ = v/f = 343/440 = 0.78 m

**Example 2: Light**
Wavelength: 500 nm (green)
Speed: 3 × 10⁸ m/s
Frequency: f = v/λ = (3 × 10⁸)/(500 × 10⁻⁹) = 6 × 10¹⁴ Hz

**Key Point:** If frequency doubles, wavelength halves (for constant speed)

## Page 4: Electromagnetic Spectrum

**ALL electromagnetic waves travel at light speed:** c = 3 × 10⁸ m/s

**From longest to shortest wavelength:**
1. **Radio waves:** Radio, TV, WiFi
2. **Microwaves:** Microwave ovens, radar
3. **Infrared:** Heat, remote controls
4. **Visible Light:** ROYGBIV (Red to Violet)
5. **Ultraviolet:** Sunburn, kills bacteria
6. **X-rays:** Medical imaging, see bones
7. **Gamma rays:** Most energetic, most dangerous

**Key:** Longer wavelength = Lower frequency = Lower energy

**Why sky is blue:** Blue light scatters more than red (shorter wavelength)

## Page 5: Wave Behaviors

**1. Reflection:** Wave bounces off surface
- Examples: Mirrors (light), echoes (sound)
- Law: Angle in = Angle out

**2. Refraction:** Wave bends when entering different medium
- Cause: Speed changes in different materials
- Examples: Straw looks bent in water, rainbows

**3. Diffraction:** Wave spreads through opening or around obstacle
- More diffraction when wavelength ≈ opening size
- Why we hear around corners but don't see around them!

**4. Interference:** Waves overlap and combine
- **Constructive:** Crests align → bigger wave
- **Destructive:** Crest meets trough → cancel out
- Example: Noise-canceling headphones create opposite wave

## Page 6: Sound Waves

**Sound:** Longitudinal pressure waves through matter

**Cannot travel through vacuum!** (No medium = no sound)

**Speed of sound:**
- Air: 343 m/s
- Water: 1480 m/s (4× faster)
- Steel: 5960 m/s (17× faster)

**Properties:**
- **Pitch:** Determined by frequency (high frequency = high pitch)
- **Loudness:** Determined by amplitude (big amplitude = loud)
- **Human hearing:** 20 Hz to 20,000 Hz

**Doppler Effect:** Frequency changes when source moves
- Approaching: Higher pitch (ambulance siren)
- Moving away: Lower pitch

**Decibels (dB):**
- 30 dB: Whisper
- 60 dB: Normal conversation
- 120 dB: Rock concert (pain threshold)
- 140 dB: Jet engine (immediate damage)

## Page 7: Practice Problems

**Problem 1:** Wave has frequency 50 Hz and wavelength 2 m. Find speed.
**Answer:** v = f × λ = 50 × 2 = 100 m/s

**Problem 2:** Sound in air (343 m/s) has frequency 686 Hz. Find wavelength.
**Answer:** λ = v/f = 343/686 = 0.5 m

**Problem 3:** Why can't sound travel through space?
**Answer:** Sound needs matter (medium) to travel through. Space is a vacuum with no matter!

**Problem 4:** Light has wavelength 600 nm. Find frequency.
**Answer:** f = c/λ = (3 × 10⁸)/(600 × 10⁻⁹) = 5 × 10¹⁴ Hz`,

  'Modern Physics': `## MODERN PHYSICS - The Extreme Universe

Modern Physics explains the very small (atoms) and very fast (near light speed)!

## Page 1: Special Relativity Basics

**Einstein's Two Postulates (1905):**
1. Laws of physics same in all inertial reference frames
2. Speed of light is constant for all observers: c = 3 × 10⁸ m/s

**Time Dilation:** Moving clocks run slower!

**Formula:** t' = t / √(1 - v²/c²)

**Example:** Travel at 0.9c (90% light speed) for 1 year (your time)
- γ = 1/√(1 - 0.9²) = 2.29
- Earth time = 1 × 2.29 = 2.29 years
- You age 1 year, Earth ages 2.29 years!

**Real Evidence:** Muons from upper atmosphere reach ground due to time dilation!

## Page 2: E = mc²

**Mass-Energy Equivalence:** Mass and energy are the same thing!

**Formula:** E = mc²
- E = energy (Joules)
- m = mass (kg)
- c = speed of light

**Why c²?** c² = 9 × 10¹⁶ → Tiny mass = HUGE energy!

**Example:** 1 gram of matter
E = 0.001 × (3 × 10⁸)² = 9 × 10¹³ J
= 21 kilotons of TNT (more than Hiroshima bomb!)

**Applications:**
- Nuclear power: Uranium fission releases energy
- The Sun: Converts 4 million tons of mass to energy every second!
- Why nothing can reach light speed: Would need infinite energy

## Page 3: General Relativity

**Key Idea:** Gravity is not a force - it's curved spacetime!

**Massive objects bend spacetime, objects follow curved paths**

**Predictions:**
1. **Gravitational Time Dilation:** Time runs slower in stronger gravity
2. **Gravitational Lensing:** Light bends around massive objects
3. **Gravitational Waves:** Ripples in spacetime (detected 2015!)
4. **Black Holes:** Extreme curvature, nothing escapes

**GPS Example:** Satellites need relativity corrections!
- Without corrections: GPS off by 11 km per day
- Proves relativity is real and practical!

**Black Holes:**
- Event horizon: Point of no return
- Singularity: Infinite density at center
- Time stops at event horizon (from outside view)

## Page 4: Quantum Mechanics Basics

**The Quantum World:**
At atomic scales, reality is WEIRD!

**Key Principles:**
1. Energy is quantized (comes in discrete packets)
2. Wave-particle duality (everything is both)
3. Uncertainty principle (can't know everything)
4. Superposition (multiple states at once)
5. Probability (can only predict probabilities)

**Why Quantum Mechanics?**
- Classical physics failed for atoms
- Quantum mechanics explains: atomic structure, chemistry, electronics, lasers

**Most precisely tested theory ever!** Predictions accurate to 12 decimal places.

## Page 5: Wave-Particle Duality

**Everything is BOTH wave AND particle!**

**Light as Particles (Photons):**
- Photoelectric Effect: Light ejects electrons from metal
- Each photon has energy: E = hf (h = Planck's constant)
- Higher frequency = more energy per photon

**Light as Waves:**
- Interference patterns
- Diffraction
- Polarization

**Matter as Waves:**
- de Broglie wavelength: λ = h/(mv)
- Electrons show interference patterns!
- Everything has wave nature

**Example:** Electron at 10⁶ m/s
λ = 7.3 × 10⁻¹⁰ m (atomic size - wave effects observable!)

**Double-Slit Experiment:** Particles go through BOTH slits simultaneously! Observation changes the result!

## Page 6: Heisenberg Uncertainty Principle

**You cannot know both position AND momentum precisely!**

**Formula:** Δx × Δp ≥ h/(4π)

**What it means:**
- More precisely you know position → less precisely you know momentum
- This is NOT a measurement problem
- This is how nature fundamentally works!

**Why?** Particles are waves! Waves are spread out.

**Example:** If you know electron position within atomic size (10⁻¹⁰ m), momentum uncertainty prevents collapse into nucleus!

**Philosophical Impact:** Reality is fundamentally uncertain. Can only predict probabilities, not certainties.

## Page 7: Quantum Superposition and Entanglement

**Superposition:** Particles exist in multiple states simultaneously until measured!

**Schrödinger's Cat (Thought Experiment):**
- Cat in box with radioactive atom
- Before opening: Cat is BOTH alive AND dead
- Opening box = measurement → collapses to one state
- Shows absurdity of quantum rules at macro scale

**Quantum Entanglement:**
Two particles become correlated - measuring one instantly affects the other!

**Example:** Two entangled photons with opposite spins
- Measure one: Gets spin up
- Other INSTANTLY becomes spin down
- Even if separated by light-years!
- Einstein called it "spooky action at a distance"

**Bell's Theorem:** Proved entanglement is real! No hidden variables can explain it.

**Applications:**
- Quantum computing: Use superposition for parallel computation
- Quantum cryptography: Unbreakable encryption
- Quantum teleportation: Transfer quantum states

## Page 8: Real-World Applications

**1. Nuclear Energy:**
- E = mc² explains nuclear power
- 1 kg uranium = 3 million kg coal
- Powers 20% of US electricity

**2. Semiconductors & Electronics:**
- Transistors work via quantum mechanics
- Billions in every computer chip
- LEDs, solar panels, all electronics

**3. Lasers:**
- Quantum process (stimulated emission)
- Uses: Surgery, fiber optics, manufacturing, Blu-ray

**4. Medical Imaging:**
- MRI: Uses quantum spin of atoms
- PET scans: Uses antimatter (positrons!)

**5. GPS:**
- Requires both special and general relativity corrections
- Without them: Off by miles per day!

**6. Quantum Computing:**
- Uses superposition and entanglement
- Can solve certain problems exponentially faster
- Future of computing!

## Page 9: Mind-Blowing Facts

**Time Travel (Forward):**
- Travel near light speed → time slows for you
- Return to Earth → you've traveled to future!
- Example: Travel at 0.999c for 1 year → Earth ages 22.4 years

**Antimatter:**
- For every particle, there's an antiparticle
- Matter + Antimatter → Pure energy (100% efficient!)
- Why is universe made of matter, not antimatter? Mystery!

**Quantum Tunneling:**
- Particles can pass through barriers they shouldn't!
- Why radioactivity happens
- Why the sun shines (protons tunnel through repulsion)
- Used in: Flash memory, scanning tunneling microscopes

**Dark Matter & Dark Energy:**
- Dark Matter: 27% of universe (only detected through gravity)
- Dark Energy: 68% of universe (causes expansion)
- Normal Matter: Only 5% of universe!

**Unsolved Mysteries:**
1. How to combine quantum mechanics and general relativity?
2. What is dark matter?
3. What is dark energy?
4. Why more matter than antimatter?
5. What happened before Big Bang?

## Page 10: Practice Problems

**Problem 1:** Spaceship travels at 0.8c. How much time passes on Earth while 5 years pass on ship?
**Answer:** γ = 1/√(1-0.8²) = 1.67, Earth time = 5 × 1.67 = 8.35 years

**Problem 2:** How much energy from 0.01 kg of matter?
**Answer:** E = mc² = 0.01 × (3×10⁸)² = 9 × 10¹⁴ J (200,000 tons of TNT!)

**Problem 3:** Photon has wavelength 500 nm. Find energy.
**Answer:** f = c/λ = 6 × 10¹⁴ Hz, E = hf = 4.0 × 10⁻¹⁹ J

**Key Takeaways:**
- Time and space are relative
- Mass and energy are equivalent
- Everything is both wave and particle
- Reality is fundamentally uncertain
- Observation affects reality
- Modern physics powers all modern technology!`
      };
      explanation = fallbacks[topic] || `${topic} is an important concept in physics that involves the study of matter, energy, and their interactions. This topic covers fundamental principles that help us understand the natural world and develop new technologies. To learn more about ${topic}, study the key formulas, work through practice problems, and try to connect the concepts to real-world examples you encounter in daily life.`;
      console.log('Explanation length:', explanation.length);
Motion is the change in position of an object with respect to a reference point over time. This seemingly simple definition contains several important concepts that we must understand.

**Reference Frames:**
Motion is always relative. When we say something is moving, we must ask: moving relative to what? A reference frame is the perspective from which we observe and measure motion.

**Example:** You're sitting in a train reading this. Relative to the train, you're stationary. Relative to the ground outside, you're moving at the train's speed. Relative to the sun, you're moving at Earth's orbital speed (about 30 km/s!). All these descriptions are correct - motion depends on your reference frame.

**Types of Motion:**
1. **Linear Motion:** Movement along a straight line (car on straight road)
2. **Circular Motion:** Movement along a circular path (Earth around sun)
3. **Rotational Motion:** Spinning around an axis (spinning top)
4. **Oscillatory Motion:** Back and forth movement (pendulum)
5. **Random Motion:** Unpredictable movement (gas molecules)

**Historical Context:**
Ancient Greek philosophers like Aristotle believed that objects naturally came to rest - that motion required a continuous force. It wasn't until Galileo and Newton in the 16th-17th centuries that we understood that objects in motion tend to stay in motion (inertia). This revolutionary insight laid the foundation for modern physics.

## Page 2: Distance and Displacement

**Distance (Scalar Quantity):**
Distance is the total length of the path traveled by an object. It's a scalar quantity, meaning it has magnitude (size) but no direction. Distance is always positive or zero, never negative.

**Formula:** Distance = Total path length
**Unit:** meters (m), kilometers (km), miles, etc.
**Symbol:** Usually 'd' or 's'

**Displacement (Vector Quantity):**
Displacement is the straight-line distance from the starting position to the final position, including direction. It's a vector quantity with both magnitude and direction.

**Formula:** Displacement = Final position - Initial position
**Unit:** meters (m) with direction
**Symbol:** Usually Δx, Δy, or Δs (Δ means "change in")

**Key Differences:**
- Distance depends on the path taken; displacement doesn't
- Distance is always ≥ displacement
- Distance is always positive; displacement can be positive, negative, or zero
- Distance is scalar; displacement is vector

**Detailed Examples:**

**Example 1: The Round Trip**
You walk 3 km north from your house to a store, then 3 km south back home.
- Distance = 3 + 3 = 6 km (you walked 6 km total)
- Displacement = 0 km (you ended where you started)
- This shows that distance and displacement can be very different!

**Example 2: The Right Triangle**
You walk 4 meters east, then 3 meters north.
- Distance = 4 + 3 = 7 meters (total path length)
- Displacement = 5 meters northeast
  * Using Pythagorean theorem: √(4² + 3²) = √(16 + 9) = √25 = 5 m
  * Direction: arctan(3/4) = 36.87° north of east

**Example 3: The Race Track**
A runner completes one lap around a 400 m circular track.
- Distance = 400 m (circumference of track)
- Displacement = 0 m (ended at starting point)

**Real-World Applications:**
- GPS systems calculate displacement (straight-line distance) but also track distance traveled
- Delivery drivers care about distance (affects fuel, time) more than displacement
- Migrating birds use displacement to navigate straight to their destination
- Taxi fares are based on distance, not displacement

## Page 3: Speed and Velocity

**Speed (Scalar):**
Speed measures how fast an object is moving, regardless of direction. It's the rate of change of distance with time.

**Formula:** Speed = Distance / Time
**Unit:** m/s, km/h, mph
**Types:**
- **Average Speed:** Total distance / Total time
- **Instantaneous Speed:** Speed at a specific moment (what your speedometer shows)

**Velocity (Vector):**
Velocity measures how fast an object is moving in a specific direction. It's the rate of change of displacement with time.

**Formula:** Velocity = Displacement / Time
**Unit:** m/s (with direction)
**Types:**
- **Average Velocity:** Total displacement / Total time
- **Instantaneous Velocity:** Velocity at a specific moment

**Critical Difference:**
Speed tells you "how fast" - velocity tells you "how fast and which way"

**Detailed Examples:**

**Example 1: The Commute**
You drive 60 km north in 1 hour, then 60 km south in 1 hour.
- Total distance = 120 km
- Total displacement = 0 km
- Average speed = 120 km / 2 h = 60 km/h
- Average velocity = 0 km / 2 h = 0 km/h
- Your speed was 60 km/h, but your average velocity was zero!

**Example 2: The Speedometer**
Two cars both traveling at 100 km/h:
- Car A heading north
- Car B heading south
- Same speed (100 km/h)
- Different velocities (100 km/h north vs 100 km/h south)
- If they collide head-on, the relative velocity is 200 km/h!

**Example 3: Circular Motion**
A car drives around a circular track at constant 60 mph:
- Speed is constant (60 mph)
- Velocity is constantly changing (direction changes)
- This means the car is accelerating even though speed is constant!

**Speed Records:**
- Fastest human (Usain Bolt): 44.72 km/h (27.8 mph)
- Fastest land animal (Cheetah): 120 km/h (75 mph)
- Speed of sound: 343 m/s (1,235 km/h)
- Speed of light: 299,792,458 m/s (ultimate speed limit!)

**Real-World Applications:**
- Air traffic control tracks velocity (speed + direction) for safety
- Weather forecasts report wind velocity (speed + direction)
- Sports analytics use speed for performance metrics
- Navigation systems calculate velocity for accurate arrival times

## Page 4: Acceleration - The Rate of Change

**What is Acceleration?**
Acceleration is the rate of change of velocity. Any change in velocity - speeding up, slowing down, or changing direction - involves acceleration.

**Formula:** a = (v_final - v_initial) / time = Δv / Δt
**Unit:** m/s² (meters per second squared)

**What does m/s² mean?**
It means your velocity changes by that many m/s every second. If acceleration is 5 m/s², your velocity increases by 5 m/s each second.

**Types of Acceleration:**

**1. Positive Acceleration (Speeding Up):**
When velocity increases in the positive direction.
Example: Car accelerating from 0 to 60 mph

**2. Negative Acceleration/Deceleration (Slowing Down):**
When velocity decreases.
Example: Car braking from 60 mph to 0

**3. Centripetal Acceleration (Changing Direction):**
When direction changes even if speed is constant.
Example: Car turning a corner at constant speed

**Detailed Examples:**

**Example 1: The Drag Race**
A car accelerates at 5 m/s² from rest:
- After 1 second: v = 0 + 5(1) = 5 m/s
- After 2 seconds: v = 0 + 5(2) = 10 m/s
- After 3 seconds: v = 0 + 5(3) = 15 m/s
- After 4 seconds: v = 0 + 5(4) = 20 m/s
- Velocity increases by 5 m/s every second

**Example 2: Emergency Braking**
A car traveling at 30 m/s brakes with acceleration -6 m/s²:
- After 1 second: v = 30 + (-6)(1) = 24 m/s
- After 2 seconds: v = 30 + (-6)(2) = 18 m/s
- After 3 seconds: v = 30 + (-6)(3) = 12 m/s
- After 4 seconds: v = 30 + (-6)(4) = 6 m/s
- After 5 seconds: v = 30 + (-6)(5) = 0 m/s (stopped!)

**Example 3: The Elevator**
When an elevator starts moving up:
- You feel heavier (positive acceleration upward)
When it stops:
- You feel lighter (negative acceleration)
This is why your stomach feels funny in elevators!

**Acceleration in Daily Life:**
- Car acceleration: 0-60 mph in 6 seconds = 4.5 m/s²
- Roller coaster: Up to 40 m/s² (4g's!)
- Fighter jet: Up to 90 m/s² (9g's - pilots can black out)
- Space shuttle launch: 30 m/s² (3g's)
- Gravity on Earth: 9.8 m/s² (1g)

## Page 5: The Kinematic Equations

These four equations describe motion with constant acceleration. They're derived from calculus but can be understood intuitively.

**Equation 1: v = u + at**
**Meaning:** Final velocity = Initial velocity + (acceleration × time)
**Use when:** You know initial velocity, acceleration, and time
**Example:** Car starts at 10 m/s, accelerates at 2 m/s² for 5 seconds
v = 10 + 2(5) = 20 m/s

**Equation 2: s = ut + ½at²**
**Meaning:** Displacement = (initial velocity × time) + (half × acceleration × time²)
**Use when:** You want to find distance traveled
**Example:** Car starts from rest, accelerates at 3 m/s² for 4 seconds
s = 0(4) + ½(3)(4²) = 0 + ½(3)(16) = 24 meters

**Equation 3: v² = u² + 2as**
**Meaning:** (Final velocity)² = (Initial velocity)² + (2 × acceleration × displacement)
**Use when:** You don't know time
**Example:** Car accelerates from 10 m/s to 20 m/s over 75 meters. Find acceleration.
20² = 10² + 2a(75)
400 = 100 + 150a
300 = 150a
a = 2 m/s²

**Equation 4: s = (u + v)t / 2**
**Meaning:** Displacement = (average velocity) × time
**Use when:** You know both initial and final velocity
**Example:** Car goes from 20 m/s to 30 m/s in 10 seconds
s = (20 + 30)(10) / 2 = (50)(10) / 2 = 250 meters

**Complex Problem:**
A car traveling at 25 m/s sees a red light and brakes with deceleration 5 m/s². How far does it travel before stopping?

Given: u = 25 m/s, v = 0 m/s, a = -5 m/s²
Find: s = ?
Use: v² = u² + 2as
0² = 25² + 2(-5)s
0 = 625 - 10s
10s = 625
s = 62.5 meters

## Page 6: Free Fall and Gravity

**Gravity - The Universal Force:**
Every object with mass attracts every other object. On Earth's surface, this creates a constant downward acceleration.

**Acceleration due to gravity:** g = 9.8 m/s² (often rounded to 10 m/s² for calculations)

**Galileo's Revolutionary Discovery:**
In the late 1500s, Galileo proved that all objects fall at the same rate, regardless of mass. Legend says he dropped objects from the Leaning Tower of Pisa. This contradicted Aristotle's 2000-year-old belief that heavier objects fall faster.

**Why do feathers fall slower than rocks on Earth?**
Air resistance! In a vacuum (no air), they fall at exactly the same rate. Apollo 15 astronaut David Scott demonstrated this on the Moon in 1971, dropping a hammer and feather simultaneously - they hit the ground together!

**Free Fall Equations:**
For objects falling or thrown vertically, use kinematic equations with a = -g = -9.8 m/s²
(Negative because gravity pulls downward)

**Example 1: Dropping a Ball**
Drop a ball from rest (u = 0):
- After 1 second: v = 0 + 9.8(1) = 9.8 m/s, distance = ½(9.8)(1²) = 4.9 m
- After 2 seconds: v = 0 + 9.8(2) = 19.6 m/s, distance = ½(9.8)(2²) = 19.6 m
- After 3 seconds: v = 0 + 9.8(3) = 29.4 m/s, distance = ½(9.8)(3²) = 44.1 m
- Velocity increases linearly, distance increases quadratically!

**Example 2: Throwing Upward**
Throw a ball upward at 20 m/s:
- Going up: Gravity slows it down at 9.8 m/s²
- At peak: Velocity = 0 (but acceleration is still 9.8 m/s² downward!)
- Coming down: Gravity speeds it up at 9.8 m/s²
- Returns to hand at 20 m/s downward (same speed, opposite direction)

**How high does it go?**
Use v² = u² + 2as where v = 0, u = 20, a = -9.8
0 = 400 + 2(-9.8)s
19.6s = 400
s = 20.4 meters

**Terminal Velocity:**
In real air, falling objects eventually reach terminal velocity when air resistance equals gravitational force:
- Skydiver (spread out): ~120 mph (53 m/s)
- Skydiver (head down): ~200 mph (89 m/s)
- Raindrop: ~20 mph (9 m/s)
- Feather: ~2 mph (0.9 m/s)

## Page 7: Projectile Motion

**What is Projectile Motion?**
When an object is thrown at an angle, it follows a curved parabolic path. This combines horizontal motion (constant velocity) and vertical motion (constant acceleration due to gravity).

**Key Principle: Independence of Motion**
Horizontal and vertical motions are completely independent! They don't affect each other.

**Horizontal Motion:**
- No acceleration (ignoring air resistance)
- Constant velocity: v_x = v₀ cos(θ)
- Distance: x = v_x × t

**Vertical Motion:**
- Constant acceleration: a_y = -g = -9.8 m/s²
- Initial velocity: v_y = v₀ sin(θ)
- Use kinematic equations with a = -g

**Example: The Cannon Ball**
A cannon fires a ball at 50 m/s at 30° above horizontal.

**Initial velocities:**
- Horizontal: v_x = 50 cos(30°) = 50(0.866) = 43.3 m/s
- Vertical: v_y = 50 sin(30°) = 50(0.5) = 25 m/s

**Time to reach peak:**
At peak, v_y = 0
0 = 25 - 9.8t
t = 2.55 seconds

**Maximum height:**
v² = u² + 2as
0 = 25² + 2(-9.8)s
s = 31.9 meters

**Total flight time:**
2 × 2.55 = 5.1 seconds (symmetry!)

**Range (horizontal distance):**
x = v_x × t = 43.3 × 5.1 = 220.8 meters

**Optimal Angle:**
For maximum range on level ground, launch at 45°! This balances height and distance.

**Real-World Applications:**
- Basketball: Players instinctively use projectile motion
- Artillery: Calculating shell trajectories
- Water fountains: Parabolic water arcs
- Long jump: Athletes launch at ~20° (not 45° due to running speed)

## Page 8: Relative Motion and Reference Frames

**Relative Velocity:**
Velocity depends on the observer's reference frame. The velocity of object A relative to object B is:
v_AB = v_A - v_B

**Example 1: Trains Passing**
Train A: 30 m/s east
Train B: 20 m/s east
Relative velocity of A with respect to B: 30 - 20 = 10 m/s east
(A appears to move 10 m/s east to passengers on B)

**Example 2: Head-On Collision**
Car A: 25 m/s east
Car B: 25 m/s west (-25 m/s east)
Relative velocity: 25 - (-25) = 50 m/s
(They approach each other at 50 m/s!)

**Example 3: River Crossing**
Boat speed in still water: 5 m/s
River current: 3 m/s downstream
If boat aims straight across:
- Resultant velocity: √(5² + 3²) = √34 = 5.83 m/s
- Direction: arctan(3/5) = 31° downstream from straight across

**Einstein's Relativity:**
At everyday speeds, velocities add simply. But near light speed, Einstein showed that velocities don't add normally - nothing can exceed light speed!

## Page 9: Circular Motion

**Uniform Circular Motion:**
Moving in a circle at constant speed. Even though speed is constant, velocity changes because direction changes constantly.

**Centripetal Acceleration:**
Acceleration toward the center of the circle.
**Formula:** a_c = v² / r
- v = speed
- r = radius

**Example: Car on Curve**
Car traveling 20 m/s around curve with radius 50 m:
a_c = 20² / 50 = 400 / 50 = 8 m/s²

**Centripetal Force:**
The force causing centripetal acceleration.
**Formula:** F_c = mv² / r

**Examples:**
- Earth orbiting sun: Gravity provides centripetal force
- Car turning: Friction provides centripetal force
- Satellite orbiting Earth: Gravity provides centripetal force
- Spinning bucket of water: Tension in your arm provides centripetal force

**Period and Frequency:**
- **Period (T):** Time for one complete revolution
- **Frequency (f):** Number of revolutions per second
- Relationship: f = 1/T
- Speed: v = 2πr / T = 2πrf

## Page 10: Practice Problems and Applications

**Problem 1:** A car accelerates from rest to 27 m/s (60 mph) in 6 seconds. Find:
a) Acceleration
b) Distance traveled

**Solution:**
a) a = (v - u) / t = (27 - 0) / 6 = 4.5 m/s²
b) s = ut + ½at² = 0 + ½(4.5)(6²) = 81 meters

**Problem 2:** A ball is thrown upward at 25 m/s. Find:
a) Maximum height
b) Time to return to hand
c) Velocity when it returns

**Solution:**
a) v² = u² + 2as → 0 = 625 + 2(-9.8)s → s = 31.9 meters
b) v = u + at → 0 = 25 - 9.8t → t = 2.55 s (up), total = 5.1 seconds
c) 25 m/s downward (same speed, opposite direction)

**Problem 3:** Two cars approach an intersection. Car A travels north at 15 m/s, Car B travels east at 20 m/s. What is their relative velocity?

**Solution:**
Relative velocity magnitude: √(15² + 20²) = √625 = 25 m/s
Direction: arctan(15/20) = 36.87° north of east (from B's perspective)

**Real-World Applications:**

**1. Vehicle Safety:**
- Stopping distance increases with speed squared
- At 30 mph: ~75 feet stopping distance
- At 60 mph: ~300 feet (4× the distance, not 2×!)

**2. Sports:**
- Baseball pitch: Understanding projectile motion
- Track and field: Optimizing launch angles
- Diving: Controlling rotational motion

**3. Space Exploration:**
- Orbital mechanics: Satellites use circular motion
- Rocket launches: Overcoming gravity
- Interplanetary travel: Relative motion between planets

**4. Transportation:**
- GPS: Calculating position from velocity
- Air traffic control: Tracking relative velocities
- Autonomous vehicles: Predicting motion

**Common Misconceptions:**
❌ Heavier objects fall faster → ✅ All objects fall at same rate (without air resistance)
❌ No force means no motion → ✅ Objects keep moving without force (Newton's 1st Law)
❌ Acceleration always means speeding up → ✅ Can mean slowing down or changing direction
❌ At the peak of a throw, acceleration is zero → ✅ Acceleration is always 9.8 m/s² downward`,


  'Newton Laws': `## NEWTON'S LAWS OF MOTION - The Foundation of Classical Mechanics

Sir Isaac Newton (1642-1727) revolutionized physics with three simple laws that explain how forces affect motion. Published in his 1687 masterpiece "Philosophiæ Naturalis Principia Mathematica," these laws unified terrestrial and celestial mechanics, showing that the same principles govern falling apples and orbiting planets.

## Page 1: Newton's First Law - The Law of Inertia

**Statement:** An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external net force.

**What is Inertia?**
Inertia is the resistance of an object to changes in its state of motion. It's the tendency of objects to "keep doing what they're doing." Mass is the measure of inertia - more mass means more inertia.

**Historical Context:**
Before Newton, Aristotle's view dominated for 2000 years: objects naturally come to rest, so continuous force is needed for motion. Galileo challenged this, showing that friction (not nature) stops moving objects. Newton formalized this insight.

**Understanding "Net Force":**
The First Law applies when net force is zero. Net force is the vector sum of all forces. If forces balance (cancel out), net force = 0, and the object maintains constant velocity (which could be zero).

**Detailed Examples:**

**Example 1: The Hockey Puck**
On ice (low friction), a puck slides far after being hit. In space (no friction), it would slide forever at constant velocity. This demonstrates inertia - the puck "wants" to keep moving.

**Example 2: Car Crash**
When a car suddenly stops, passengers continue forward at the car's original speed (inertia). Seatbelts provide the external force needed to stop the passengers with the car.

**Example 3: Tablecloth Trick**
Pull a tablecloth quickly from under dishes. The dishes' inertia keeps them stationary while the cloth slides out. Pull slowly, and friction has time to accelerate the dishes.

**Example 4: Space Travel**
Spacecraft don't need engines to maintain speed in space. Once accelerated, they coast at constant velocity indefinitely (ignoring gravity). Engines are only needed to change velocity.

**Example 5: The Coin Drop**
Place a coin on a card on a glass. Flick the card horizontally. The coin drops straight into the glass because its inertia keeps it stationary while the card moves.

**Misconceptions:**
❌ "Objects naturally slow down" → ✅ Friction slows them; without friction, they'd continue forever
❌ "Heavier objects have more inertia" → ✅ TRUE! Mass measures inertia
❌ "Force is needed to maintain motion" → ✅ Force is needed only to CHANGE motion

## Page 2: Newton's Second Law - F = ma

**Statement:** The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. The direction of acceleration is in the direction of the net force.

**Formula:** F = ma or a = F/m
- F = net force (Newtons, N)
- m = mass (kilograms, kg)
- a = acceleration (m/s²)

**What This Means:**
1. **More force → More acceleration:** Double the force, double the acceleration
2. **More mass → Less acceleration:** Double the mass, half the acceleration (for same force)
3. **Force and acceleration have the same direction:** Push right, accelerate right

**The Newton (Unit of Force):**
1 Newton = force needed to accelerate 1 kg at 1 m/s²
1 N = 1 kg⋅m/s²

**Intuitive Understanding:**
- Pushing a shopping cart (low mass): Easy to accelerate
- Pushing a car (high mass): Hard to accelerate
- Same force, different accelerations due to different masses

**Detailed Examples:**

**Example 1: The Shopping Cart**
Empty cart: mass = 10 kg, push with 20 N
a = F/m = 20/10 = 2 m/s²

Full cart: mass = 50 kg, push with 20 N
a = F/m = 20/50 = 0.4 m/s²

Same force, but full cart accelerates 5× slower!

**Example 2: The Rocket**
Rocket: mass = 1,000,000 kg, thrust = 15,000,000 N
a = F/m = 15,000,000 / 1,000,000 = 15 m/s²

As fuel burns, mass decreases, so acceleration increases (with same thrust)!

**Example 3: Multiple Forces**
Box on table:
- Push right: 50 N
- Friction left: 20 N
- Net force: 50 - 20 = 30 N right
- Mass: 10 kg
- Acceleration: a = 30/10 = 3 m/s² right

**Example 4: Vertical Motion**
Object falling:
- Weight down: mg
- Air resistance up: F_air
- Net force: mg - F_air
- Acceleration: a = (mg - F_air) / m = g - F_air/m
- As speed increases, F_air increases, so acceleration decreases
- Eventually F_air = mg, so a = 0 (terminal velocity!)

**Vector Nature:**
Forces are vectors - they have magnitude and direction. When multiple forces act, we must add them as vectors:
- Forces in same direction: Add magnitudes
- Forces in opposite directions: Subtract magnitudes
- Forces at angles: Use vector addition (Pythagorean theorem, trigonometry)

## Page 3: Mass vs Weight - A Critical Distinction

**Mass:**
- Amount of matter in an object
- Measure of inertia
- Scalar quantity
- Unit: kilogram (kg)
- NEVER changes (same everywhere in universe)
- Intrinsic property of object

**Weight:**
- Force of gravity on an object
- Vector quantity (has direction: toward center of planet)
- Unit: Newton (N)
- Changes with gravity
- Depends on location

**Formula:** W = mg
- W = weight (N)
- m = mass (kg)
- g = gravitational acceleration (m/s²)

**Gravitational Acceleration on Different Bodies:**
- Earth: g = 9.8 m/s²
- Moon: g = 1.6 m/s² (1/6 of Earth)
- Mars: g = 3.7 m/s² (3/8 of Earth)
- Jupiter: g = 24.8 m/s² (2.5× Earth)
- Sun: g = 274 m/s² (28× Earth!)

**Detailed Example: 60 kg Person**

**On Earth:**
- Mass: 60 kg (always)
- Weight: W = 60 × 9.8 = 588 N
- Feels "normal"

**On Moon:**
- Mass: 60 kg (unchanged!)
- Weight: W = 60 × 1.6 = 96 N
- Feels 6× lighter, can jump 6× higher

**On Jupiter:**
- Mass: 60 kg (still unchanged!)
- Weight: W = 60 × 24.8 = 1,488 N
- Feels 2.5× heavier, very difficult to move

**In Space (far from any planet):**
- Mass: 60 kg (never changes!)
- Weight: ~0 N (no significant gravity)
- Weightless, but still has inertia!

**Weightlessness vs Masslessness:**
Astronauts in orbit are weightless (no sensation of weight) but NOT massless. They still have inertia - it's still hard to accelerate them. They're in free fall, so they don't feel gravity's pull.

**Common Misconceptions:**
❌ "I weigh 60 kg" → ✅ "My mass is 60 kg" or "I weigh 588 N"
❌ "Astronauts are weightless because there's no gravity in space" → ✅ There IS gravity; they're in free fall
❌ "Weight and mass are the same" → ✅ Completely different concepts!

## Page 4: Newton's Third Law - Action and Reaction

**Statement:** For every action force, there is an equal and opposite reaction force. Forces always come in pairs.

**Formula:** F_AB = -F_BA
If object A exerts force F on object B, then object B exerts force -F on object A.

**Critical Understanding:**
1. **Equal magnitude:** Forces have same size
2. **Opposite direction:** Forces point opposite ways
3. **Different objects:** Forces act on DIFFERENT objects (this is crucial!)
4. **Same type:** Both forces are same type (both gravitational, both contact, etc.)
5. **Simultaneous:** Forces exist at the same time

**Why Don't They Cancel?**
Action-reaction pairs act on DIFFERENT objects, so they don't cancel. For forces to cancel, they must act on the SAME object.

**Detailed Examples:**

**Example 1: Walking**
- Action: Your foot pushes backward on ground
- Reaction: Ground pushes forward on your foot
- Result: You accelerate forward
- On ice (low friction), ground can't push back effectively, so you slip

**Example 2: Swimming**
- Action: You push water backward with your hands
- Reaction: Water pushes you forward
- Result: You move forward through water
- Stronger push = faster swimming

**Example 3: Rocket Propulsion**
- Action: Rocket pushes gas molecules downward/backward at high speed
- Reaction: Gas molecules push rocket upward/forward
- Result: Rocket accelerates upward
- Works in space (no air needed!) because it's pushing against the gas, not air

**Example 4: Jumping**
- Action: Your legs push down on ground
- Reaction: Ground pushes up on you
- Result: You accelerate upward
- On Moon (lower gravity), same push gives higher jump

**Example 5: Book on Table**
- Action: Book pushes down on table (weight)
- Reaction: Table pushes up on book (normal force)
- Result: Book stays stationary (forces on book balance)
- Note: Weight and normal force are NOT action-reaction pairs! They act on same object (book)

**Example 6: Earth and Moon**
- Action: Earth pulls Moon with gravitational force
- Reaction: Moon pulls Earth with equal gravitational force
- Result: Both orbit around common center of mass
- Earth is much more massive, so it moves much less

**Example 7: Gun Recoil**
- Action: Gun pushes bullet forward with force F
- Reaction: Bullet pushes gun backward with force F
- Result: Bullet accelerates forward (small mass, large acceleration)
- Gun recoils backward (large mass, small acceleration)
- Same force, different accelerations (F = ma!)

**Identifying Action-Reaction Pairs:**
Ask: "What two objects are interacting?" The forces they exert on each other are action-reaction pairs.

**Example:** Person pushing wall
- Action: Person pushes wall to the right
- Reaction: Wall pushes person to the left
- NOT action-reaction: Weight of person and normal force from ground (both act on person)

## Page 5: Applications and Problem Solving

**Problem 1: The Elevator**
A 70 kg person stands in an elevator. Find the normal force from the floor when:
a) Elevator at rest
b) Elevator accelerating upward at 2 m/s²
c) Elevator accelerating downward at 2 m/s²

**Solution:**
a) At rest: a = 0
   Net force = 0
   N - mg = 0
   N = mg = 70 × 9.8 = 686 N
   (Person feels normal weight)

b) Accelerating up: a = 2 m/s² upward
   Net force = ma upward
   N - mg = ma
   N = mg + ma = m(g + a) = 70(9.8 + 2) = 826 N
   (Person feels heavier!)

c) Accelerating down: a = 2 m/s² downward
   Net force = ma downward
   mg - N = ma
   N = mg - ma = m(g - a) = 70(9.8 - 2) = 546 N
   (Person feels lighter!)

**Problem 2: Pushing Boxes**
Two boxes on frictionless surface:
- Box A: 10 kg
- Box B: 20 kg (behind A)
- Push B with 60 N force to the right

Find:
a) Acceleration of system
b) Force A exerts on B
c) Force B exerts on A

**Solution:**
a) Total mass = 10 + 20 = 30 kg
   a = F/m = 60/30 = 2 m/s²

b) For box A alone:
   F_BA = ma = 10 × 2 = 20 N
   (B must push A with 20 N to accelerate it at 2 m/s²)

c) By Newton's 3rd Law:
   F_AB = -F_BA = 20 N to the left
   (A pushes back on B with 20 N)

**Problem 3: Friction and Motion**
A 50 kg box is pushed with 200 N force. Friction is 80 N. Find:
a) Net force
b) Acceleration
c) Velocity after 5 seconds (starting from rest)

**Solution:**
a) Net force = 200 - 80 = 120 N

b) a = F/m = 120/50 = 2.4 m/s²

c) v = u + at = 0 + 2.4(5) = 12 m/s

**Real-World Applications:**

**1. Vehicle Safety:**
- Airbags: Increase time of collision, reducing force (F = ma)
- Crumple zones: Increase stopping distance, reducing acceleration
- Seatbelts: Provide force to decelerate passengers with car

**2. Sports:**
- Baseball: Bat exerts force on ball, ball exerts equal force on bat (you feel the impact)
- Football: Tackling involves action-reaction forces
- Gymnastics: Push hard on ground to jump high

**3. Space Exploration:**
- Rockets: Expel gas to generate thrust
- Spacewalks: Astronauts must push off carefully (equal and opposite reaction)
- Satellite maneuvering: Small thrusters change orientation

**4. Engineering:**
- Bridges: Must support weight (action) with equal upward force (reaction)
- Buildings: Foundation pushes up to balance weight pushing down
- Machines: Every moving part experiences action-reaction forces

**Common Mistakes:**
❌ Confusing mass and weight
❌ Forgetting to find net force before using F = ma
❌ Thinking action-reaction forces cancel (they act on different objects!)
❌ Using wrong units (mass in grams instead of kg)`,

  'Energy': `## ENERGY - The Ability to Do Work and Cause Change

Energy is one of the most fundamental concepts in all of physics. It's the ability to do work or cause change. Energy exists in many forms and can transform from one form to another, but the total amount of energy in a closed system always remains constant. This principle, known as conservation of energy, is one of the most important laws in physics.

## Page 1: Introduction to Energy and Work

**What is Energy?**
Energy is the capacity to do work or produce change. It's measured in Joules (J), named after James Prescott Joule who studied the relationship between heat and mechanical work in the 1840s.

**What is Work?**
In physics, work has a specific meaning: work is done when a force causes displacement.

**Formula:** W = F × d × cos(θ)
- W = work (Joules)
- F = force (Newtons)
- d = displacement (meters)
- θ = angle between force and displacement

**Simplified:** W = F × d (when force and displacement are in same direction)

**Key Points About Work:**
1. Force must cause displacement (pushing a wall that doesn't move = no work!)
2. Only the component of force in the direction of motion does work
3. Work can be positive (force aids motion) or negative (force opposes motion)
4. No displacement = no work, regardless of force

**Examples:**

**Example 1: Lifting a Box**
Lift a 10 kg box 2 meters vertically.
- Force needed: F = mg = 10 × 9.8 = 98 N (upward)
- Displacement: d = 2 m (upward)
- Work: W = 98 × 2 = 196 J
- You did 196 J of work against gravity

**Example 2: Pushing a Car**
Push a car with 500 N force for 10 meters.
- Work: W = 500 × 10 = 5,000 J
- You transferred 5,000 J of energy to the car

**Example 3: Carrying a Suitcase Horizontally**
Carry a 20 kg suitcase horizontally for 100 meters.
- Force: 196 N upward (to support weight)
- Displacement: 100 m horizontal
- Angle between force and displacement: 90°
- Work: W = F × d × cos(90°) = 196 × 100 × 0 = 0 J
- No work done! (Force perpendicular to motion)

**Example 4: Friction Doing Negative Work**
A 50 kg box slides 5 meters on a surface with friction force 100 N.
- Friction opposes motion (acts backward)
- Work by friction: W = -100 × 5 = -500 J
- Friction removes 500 J of energy from the box (converts to heat)

**Historical Context:**
The concept of energy unified many areas of physics. In the 1800s, scientists realized that heat, motion, electricity, and light were all forms of the same thing: energy. This led to the development of thermodynamics and revolutionized technology.

## Page 2: Kinetic Energy - Energy of Motion

**Definition:** Kinetic energy is the energy an object possesses due to its motion.

**Formula:** KE = ½mv²
- KE = kinetic energy (Joules)
- m = mass (kg)
- v = velocity (m/s)

**Why v²?**
The velocity is squared, which has profound implications:
- 2× faster = 4× more energy
- 3× faster = 9× more energy
- 10× faster = 100× more energy!

This is why high-speed collisions are so much more dangerous than low-speed ones.

**Derivation from Work:**
When you apply force F to accelerate mass m over distance d:
- Work done: W = F × d
- Using F = ma and v² = u² + 2ad (starting from rest, u = 0):
- W = ma × d = m × (v²/2d) × d = ½mv²
- So work done equals kinetic energy gained!

**Detailed Examples:**

**Example 1: The Car**
Car: mass = 1000 kg, velocity = 20 m/s
KE = ½ × 1000 × 20² = ½ × 1000 × 400 = 200,000 J

Same car at 40 m/s (2× faster):
KE = ½ × 1000 × 40² = ½ × 1000 × 1600 = 800,000 J
4× more energy! This is why speed limits exist.

**Example 2: The Bullet**
Bullet: mass = 0.01 kg (10 grams), velocity = 400 m/s
KE = ½ × 0.01 × 400² = ½ × 0.01 × 160,000 = 800 J

Despite tiny mass, high velocity gives significant energy!

**Example 3: Comparing Objects**
Which has more kinetic energy?
A) 1000 kg car at 10 m/s: KE = ½ × 1000 × 100 = 50,000 J
B) 0.1 kg baseball at 40 m/s: KE = ½ × 0.1 × 1600 = 80 J

Car has 625× more kinetic energy!

**Example 4: Stopping Distance**
Car traveling at speed v needs distance d to stop.
- Initial KE = ½mv²
- Work by brakes = F × d
- To stop: F × d = ½mv²
- So d = mv²/(2F)

If speed doubles (2v):
- d = m(2v)²/(2F) = 4mv²/(2F) = 4 × original distance
- Stopping distance increases by factor of 4!

This is why speed limits are crucial for safety.

**Real-World Applications:**
- Vehicle safety: Crumple zones absorb kinetic energy
- Sports: Kinetic energy of ball determines impact
- Wind power: Turbines extract kinetic energy from moving air
- Hydroelectric: Falling water's kinetic energy generates electricity

## Page 3: Potential Energy - Stored Energy

**Definition:** Potential energy is stored energy due to an object's position or configuration.

**Gravitational Potential Energy:**
Energy stored due to height above ground.

**Formula:** PE = mgh
- PE = potential energy (Joules)
- m = mass (kg)
- g = gravitational acceleration (9.8 m/s²)
- h = height above reference point (meters)

**Key Concept: Reference Point**
Potential energy depends on where you measure from. The reference point (h = 0) is arbitrary - what matters is the change in height.

**Detailed Examples:**

**Example 1: Book on Shelf**
10 kg book on 5 m high shelf:
PE = 10 × 9.8 × 5 = 490 J

If it falls to the ground:
- Loses 490 J of PE
- Gains 490 J of KE
- Hits ground with velocity: ½mv² = 490 → v = 9.9 m/s

**Example 2: Water Behind Dam**
1,000,000 kg of water at height 100 m:
PE = 1,000,000 × 9.8 × 100 = 980,000,000 J = 980 MJ

This energy can generate electricity when water flows down!

**Example 3: Roller Coaster**
At top of 50 m hill:
- PE = mgh = m × 9.8 × 50 = 490m J
- KE ≈ 0 (moving slowly)

At bottom (h = 0):
- PE = 0
- KE = 490m J (all PE converted to KE!)
- Velocity: ½mv² = 490m → v = 31.3 m/s (113 km/h!)

**Example 4: Pendulum**
At highest point:
- Maximum PE, minimum KE (momentarily stopped)

At lowest point:
- Minimum PE, maximum KE (moving fastest)

Energy constantly converts between PE and KE!

**Other Forms of Potential Energy:**

**Elastic Potential Energy:**
Stored in stretched/compressed springs or elastic materials.
Formula: PE = ½kx²
- k = spring constant
- x = displacement from equilibrium

Examples: Bow and arrow, trampoline, rubber band

**Chemical Potential Energy:**
Stored in chemical bonds.
Examples: Food, gasoline, batteries, explosives

**Nuclear Potential Energy:**
Stored in atomic nuclei.
Examples: Nuclear reactors, atomic bombs, the sun

**Electrical Potential Energy:**
Stored in electric fields.
Examples: Capacitors, thunderclouds

## Page 4: Conservation of Energy - The Universal Law

**Law of Conservation of Energy:**
Energy cannot be created or destroyed, only transformed from one form to another. The total energy of an isolated system remains constant.

**Formula:** E_initial = E_final
Or: KE_i + PE_i + Other_i = KE_f + PE_f + Other_f

**This is one of the most fundamental laws in physics!**

**Detailed Examples:**

**Example 1: Falling Object**
Drop a 2 kg ball from 10 m height.

At top (h = 10 m, v = 0):
- PE = 2 × 9.8 × 10 = 196 J
- KE = 0
- Total = 196 J

At middle (h = 5 m):
- PE = 2 × 9.8 × 5 = 98 J
- KE = 196 - 98 = 98 J (by conservation)
- Total = 196 J ✓
- Velocity: ½(2)v² = 98 → v = 9.9 m/s

At bottom (h = 0):
- PE = 0
- KE = 196 J
- Total = 196 J ✓
- Velocity: ½(2)v² = 196 → v = 14 m/s

Energy transformed from PE to KE, but total stayed constant!

**Example 2: Roller Coaster**
1000 kg car starts at 40 m height with 5 m/s velocity.

Initial energy:
- PE = 1000 × 9.8 × 40 = 392,000 J
- KE = ½ × 1000 × 5² = 12,500 J
- Total = 404,500 J

At 20 m height:
- PE = 1000 × 9.8 × 20 = 196,000 J
- KE = 404,500 - 196,000 = 208,500 J
- Velocity: ½(1000)v² = 208,500 → v = 20.4 m/s

At ground level:
- PE = 0
- KE = 404,500 J
- Velocity: ½(1000)v² = 404,500 → v = 28.5 m/s

**Example 3: Pendulum**
A pendulum swings back and forth. At each point:
- Total energy = PE + KE = constant
- At highest points: All PE, no KE
- At lowest point: All KE, no PE
- Energy continuously transforms between PE and KE

**Example 4: Spring-Mass System**
Compress a spring, release it to launch a mass:
- Initially: Elastic PE in spring
- During launch: Elastic PE → KE
- After launch: All KE (if horizontal)

**Real-World Considerations:**

**Energy "Loss" to Heat:**
In real systems, some energy converts to heat due to friction and air resistance. The energy isn't destroyed - it's just transformed into a less useful form.

Example: Sliding box
- Initial KE = 1000 J
- Final KE = 200 J
- "Lost" energy = 800 J → converted to heat by friction

**Why Perpetual Motion is Impossible:**
You can't create energy from nothing (1st Law of Thermodynamics). Any machine will eventually stop due to energy conversion to heat.

## Page 5: Work-Energy Theorem

**Statement:** The net work done on an object equals its change in kinetic energy.

**Formula:** W_net = ΔKE = KE_final - KE_initial

**This connects force (through work) to energy!**

**Detailed Examples:**

**Example 1: Accelerating Car**
1000 kg car accelerates from 10 m/s to 20 m/s.

Change in KE:
- KE_i = ½ × 1000 × 10² = 50,000 J
- KE_f = ½ × 1000 × 20² = 200,000 J
- ΔKE = 200,000 - 50,000 = 150,000 J

Work done by engine = 150,000 J

If this happens over 100 m:
- W = F × d
- 150,000 = F × 100
- F = 1,500 N (average force)

**Example 2: Braking Car**
1000 kg car brakes from 25 m/s to 0.

Change in KE:
- KE_i = ½ × 1000 × 25² = 312,500 J
- KE_f = 0
- ΔKE = -312,500 J (negative = energy removed)

Work by brakes = -312,500 J

If braking distance is 50 m:
- -312,500 = F × 50
- F = -6,250 N (negative = opposes motion)

**Example 3: Lifting with Friction**
Lift 10 kg box 3 m vertically. Friction force is 20 N.

Work by you:
- Against gravity: W_g = mgh = 10 × 9.8 × 3 = 294 J
- Against friction: W_f = 20 × 3 = 60 J
- Total work: W = 294 + 60 = 354 J

Change in energy:
- ΔPE = 294 J (gained)
- Heat from friction = 60 J
- Total = 354 J ✓

## Page 6: Power - Rate of Energy Transfer

**Definition:** Power is the rate at which work is done or energy is transferred.

**Formula:** P = W/t = E/t
- P = power (Watts)
- W = work (Joules)
- t = time (seconds)
- 1 Watt = 1 Joule/second

**Alternative Formula:** P = F × v
(Power = Force × velocity)

**Units:**
- Watt (W): 1 J/s
- Kilowatt (kW): 1000 W
- Megawatt (MW): 1,000,000 W
- Horsepower (hp): 746 W

**Detailed Examples:**

**Example 1: Light Bulb**
100 W light bulb:
- Uses 100 J every second
- In 1 hour: E = 100 × 3600 = 360,000 J = 360 kJ
- In 1 day: E = 100 × 86,400 = 8,640,000 J = 8.64 MJ

**Example 2: Climbing Stairs**
70 kg person climbs 3 m in 5 seconds.

Work done:
- W = mgh = 70 × 9.8 × 3 = 2,058 J

Power:
- P = W/t = 2,058/5 = 411.6 W

Same person climbs in 10 seconds:
- Work = 2,058 J (same!)
- Power = 2,058/10 = 205.8 W (half the power)

More time = less power needed (but same work!)

**Example 3: Car Engine**
100 kW (134 hp) car engine at 25 m/s:

Power = Force × velocity
100,000 = F × 25
F = 4,000 N

Engine provides 4,000 N force at this speed.

**Example 4: Electricity Bill**
Your home uses:
- 5 × 100 W bulbs = 500 W
- 1 × 1500 W microwave = 1500 W
- 1 × 200 W TV = 200 W
- Total = 2200 W = 2.2 kW

Running for 5 hours:
- Energy = 2.2 × 5 = 11 kWh (kilowatt-hours)
- At $0.12/kWh: Cost = 11 × 0.12 = $1.32

**Power in Daily Life:**
- Human at rest: ~100 W
- Human running: ~1000 W
- Car engine: 50,000-300,000 W (67-402 hp)
- Power plant: 1,000,000,000 W (1 GW)
- Sun's output: 3.8 × 10²⁶ W!

## Page 7: Efficiency and Energy Transformations

**Efficiency:** The ratio of useful energy output to total energy input.

**Formula:** Efficiency = (Useful energy out / Total energy in) × 100%

Or: Efficiency = (Useful power out / Total power in) × 100%

**No machine is 100% efficient!** Some energy always converts to heat.

**Detailed Examples:**

**Example 1: Incandescent Light Bulb**
100 W input:
- Light output: 5 W
- Heat output: 95 W
- Efficiency = (5/100) × 100% = 5%

Only 5% of energy becomes light! Very inefficient.

**Example 2: LED Light Bulb**
20 W input (same brightness as 100 W incandescent):
- Light output: 4 W
- Heat output: 16 W
- Efficiency = (4/20) × 100% = 20%

4× more efficient than incandescent!

**Example 3: Car Engine**
Gasoline contains 34 MJ/liter.
Car uses 1 liter to travel 10 km.

Useful work (moving car): ~8.5 MJ
Wasted as heat: ~25.5 MJ
Efficiency = (8.5/34) × 100% = 25%

Only 25% of fuel energy moves the car!

**Example 4: Electric Motor**
1000 W input:
- Mechanical output: 900 W
- Heat loss: 100 W
- Efficiency = (900/1000) × 100% = 90%

Electric motors are very efficient!

**Example 5: Power Plant**
Coal power plant:
- Chemical energy in coal: 100 units
- Heat from burning: 100 units
- Steam turbine: 40 units (60% lost to environment)
- Generator: 38 units (2% lost to friction)
- Transmission: 35 units (3% lost in wires)
- Overall efficiency: 35%

**Efficiency Comparison:**
- Incandescent bulb: 5%
- Fluorescent bulb: 10%
- LED bulb: 20%
- Gasoline car: 25%
- Diesel car: 30%
- Power plant: 35%
- Solar panel: 15-20%
- Wind turbine: 35-45%
- Hydroelectric: 85-90%
- Electric motor: 90-95%

**Why Efficiency Matters:**
- Saves money (less energy wasted)
- Reduces environmental impact
- Conserves resources
- Less heat generation

## Page 8: Forms of Energy

**Mechanical Energy:**
- Kinetic + Potential energy
- Examples: Moving car, raised weight, compressed spring

**Thermal Energy (Heat):**
- Random kinetic energy of molecules
- Examples: Hot water, fire, friction

**Chemical Energy:**
- Stored in chemical bonds
- Examples: Food, gasoline, batteries, wood

**Electrical Energy:**
- Movement of electric charges
- Examples: Lightning, power lines, circuits

**Nuclear Energy:**
- Stored in atomic nuclei
- Examples: Nuclear reactors, atomic bombs, stars

**Electromagnetic Energy:**
- Carried by electromagnetic waves
- Examples: Light, radio waves, X-rays, microwaves

**Sound Energy:**
- Vibrations traveling through matter
- Examples: Music, speech, thunder

**Energy Transformations:**

**Power Plant:**
Chemical → Thermal → Mechanical → Electrical

**Solar Panel:**
Electromagnetic → Electrical

**Photosynthesis:**
Electromagnetic → Chemical

**Eating and Moving:**
Chemical → Thermal + Mechanical

**Battery-Powered Device:**
Chemical → Electrical → Light/Sound/Mechanical

## Page 9: Real-World Applications

**1. Renewable Energy:**

**Solar Power:**
- Converts sunlight to electricity
- Efficiency: 15-20%
- Clean, unlimited source

**Wind Power:**
- Converts wind's kinetic energy to electricity
- Efficiency: 35-45%
- Clean, but location-dependent

**Hydroelectric:**
- Converts gravitational PE of water to electricity
- Efficiency: 85-90%
- Very efficient, but requires dams

**2. Transportation:**

**Hybrid Cars:**
- Capture braking energy (normally wasted as heat)
- Store in battery
- Reuse for acceleration
- Improves efficiency by ~30%

**Regenerative Braking:**
- Electric motor acts as generator when braking
- Converts KE back to electrical energy
- Used in electric cars and trains

**3. Sports:**

**Pole Vault:**
- Runner's KE → Elastic PE in pole → Gravitational PE at height
- Energy transformation allows jumping higher than possible without pole

**Trampoline:**
- Gravitational PE → Elastic PE → Gravitational PE
- Allows bouncing higher than original jump

**4. Safety:**

**Airbags:**
- Increase time of collision
- Same change in KE, but over longer time
- Reduces force (F = ΔKE/d)

**Crumple Zones:**
- Increase stopping distance
- Absorb energy through deformation
- Protects passengers

## Page 10: Practice Problems

**Problem 1:** A 2 kg ball is thrown upward at 15 m/s. Find:
a) Initial kinetic energy
b) Maximum height
c) Velocity at 5 m height

**Solution:**
a) KE = ½mv² = ½(2)(15²) = 225 J

b) At max height, all KE → PE:
   mgh = 225
   2(9.8)h = 225
   h = 11.5 m

c) At 5 m:
   PE = 2(9.8)(5) = 98 J
   KE = 225 - 98 = 127 J
   ½(2)v² = 127
   v = 11.3 m/s

**Problem 2:** A 1500 kg car traveling at 20 m/s brakes to a stop in 40 m. Find:
a) Initial kinetic energy
b) Work done by brakes
c) Braking force

**Solution:**
a) KE = ½(1500)(20²) = 300,000 J

b) W = -300,000 J (negative because it removes energy)

c) W = F × d
   -300,000 = F × 40
   F = -7,500 N (negative = opposes motion)

**Problem 3:** A 60 kg person climbs 100 m stairs in 2 minutes. Find:
a) Work done
b) Power output

**Solution:**
a) W = mgh = 60(9.8)(100) = 58,800 J

b) P = W/t = 58,800/120 = 490 W

**Problem 4:** A machine uses 5000 J of energy and does 4000 J of useful work. Find efficiency.

**Solution:**
Efficiency = (4000/5000) × 100% = 80%

**Common Misconceptions:**
❌ "Energy is used up" → ✅ Energy is transformed, never destroyed
❌ "Power and energy are the same" → ✅ Power is rate of energy transfer
❌ "Heavier objects have more energy" → ✅ Depends on velocity too (KE = ½mv²)
❌ "Work is done when you hold something" → ✅ No displacement = no work`,

  'Electricity': `## ELECTRICITY - The Flow of Electric Charge

Electricity is one of the most important discoveries in human history. It powers our modern world - from lights to computers to electric vehicles. Understanding electricity requires grasping three fundamental concepts: voltage, current, and resistance, and how they relate through Ohm's Law.

## Page 1: Introduction to Electric Charge and Current

**What is Electric Charge?**
Electric charge is a fundamental property of matter. There are two types:
- **Positive charge:** Carried by protons
- **Negative charge:** Carried by electrons

**Key Principles:**
- Like charges repel (+ repels +, - repels -)
- Opposite charges attract (+ attracts -)
- Charge is conserved (can't be created or destroyed)
- Charge is quantized (comes in discrete units)

**Elementary Charge:**
e = 1.6 × 10⁻¹⁹ Coulombs (C)
- Charge of one proton: +e
- Charge of one electron: -e

**What is Electric Current?**
Current is the flow of electric charge. In most circuits, electrons flow through wires.

**Formula:** I = Q/t
- I = current (Amperes, A)
- Q = charge (Coulombs, C)
- t = time (seconds)

**1 Ampere = 1 Coulomb per second**

**Direction of Current:**
- **Conventional current:** Defined as flow of positive charge (+ to -)
- **Electron flow:** Actual flow of electrons (- to +)
- These are opposite directions!
- We use conventional current (historical reasons)

**Example 1: Current Calculation**
10 Coulombs of charge flows through a wire in 2 seconds.
I = Q/t = 10/2 = 5 A

**Example 2: Charge from Current**
A 3 A current flows for 5 seconds.
Q = I × t = 3 × 5 = 15 C

How many electrons?
Number = Q/e = 15/(1.6 × 10⁻¹⁹) = 9.4 × 10¹⁹ electrons!

**Historical Context:**
Benjamin Franklin (1750s) defined current as positive charge flow before electrons were discovered. When electrons were discovered later, we learned current actually flows the opposite way, but we kept Franklin's convention.

## Page 2: Voltage - The Electrical Push

**What is Voltage?**
Voltage (also called electric potential difference) is the "electrical pressure" that pushes charges through a circuit. It's the energy per unit charge.

**Formula:** V = E/Q
- V = voltage (Volts, V)
- E = energy (Joules, J)
- Q = charge (Coulombs, C)

**1 Volt = 1 Joule per Coulomb**

**Water Analogy:**
Think of electricity like water in pipes:
- **Voltage = Water pressure:** Higher pressure pushes water faster
- **Current = Water flow rate:** How much water flows per second
- **Resistance = Pipe narrowness:** Narrow pipes resist flow

**Voltage Sources:**
- **Battery:** Chemical energy → Electrical energy
  * AA battery: 1.5 V
  * Car battery: 12 V
  * Laptop battery: 11-15 V
- **Wall outlet:** 120 V (US) or 230 V (Europe)
- **Power lines:** Thousands to hundreds of thousands of volts
- **Lightning:** Millions of volts!

**Example 1: Energy Transfer**
A 12 V battery moves 5 C of charge through a circuit.
Energy transferred: E = V × Q = 12 × 5 = 60 J

**Example 2: Voltage and Power**
A 120 V outlet supplies 10 A current.
Power: P = V × I = 120 × 10 = 1200 W (1.2 kW)

**Voltage Difference:**
Voltage is always measured between two points. It's the difference in electrical potential.
- Bird on power line: Safe! (No voltage difference across its body)
- Touch power line and ground: Dangerous! (Large voltage difference)

**Example 3: Series Voltages**
Three batteries in series: 1.5 V + 1.5 V + 1.5 V = 4.5 V total
Voltages add in series!

## Page 3: Resistance - Opposition to Current Flow

**What is Resistance?**
Resistance is the opposition to current flow. It's caused by collisions between moving electrons and atoms in the material.

**Formula:** R = ρL/A
- R = resistance (Ohms, Ω)
- ρ = resistivity (material property)
- L = length of conductor
- A = cross-sectional area

**Key Points:**
- Longer wire = more resistance
- Thicker wire = less resistance
- Different materials have different resistivities

**Resistivity of Common Materials:**
- Silver: 1.6 × 10⁻⁸ Ω⋅m (best conductor)
- Copper: 1.7 × 10⁻⁸ Ω⋅m (commonly used)
- Aluminum: 2.8 × 10⁻⁸ Ω⋅m
- Iron: 1.0 × 10⁻⁷ Ω⋅m
- Rubber: 10¹³ Ω⋅m (insulator)
- Glass: 10¹¹ Ω⋅m (insulator)

**Conductors vs Insulators:**
- **Conductors:** Low resistance, allow current flow (metals)
- **Insulators:** High resistance, block current flow (rubber, plastic, glass)
- **Semiconductors:** Intermediate resistance (silicon, germanium)

**Example 1: Wire Resistance**
Copper wire: length = 10 m, diameter = 2 mm (radius = 0.001 m)
Area: A = πr² = π(0.001)² = 3.14 × 10⁻⁶ m²
R = ρL/A = (1.7 × 10⁻⁸)(10)/(3.14 × 10⁻⁶) = 0.054 Ω

**Example 2: Effect of Length**
Double the length → Double the resistance
Wire 1: 10 m, R = 0.054 Ω
Wire 2: 20 m, R = 0.108 Ω

**Example 3: Effect of Thickness**
Double the diameter → 4× the area → 1/4 the resistance
Wire 1: 2 mm diameter, R = 0.054 Ω
Wire 2: 4 mm diameter, R = 0.0135 Ω

**Temperature Effect:**
For most conductors, resistance increases with temperature.
- Hot wire: Higher resistance
- Cold wire: Lower resistance
- Superconductors: Zero resistance at very low temperatures!

## Page 4: Ohm's Law - The Fundamental Relationship

**Ohm's Law:** V = I × R
- V = voltage (Volts)
- I = current (Amperes)
- R = resistance (Ohms)

**This is the most important equation in electricity!**

**Three Forms:**
1. V = I × R (find voltage)
2. I = V/R (find current)
3. R = V/I (find resistance)

**Memory Triangle:**
    V
   ---
  I | R

Cover what you want to find, and you see the formula!

**Detailed Examples:**

**Example 1: Finding Current**
Battery: 12 V, Resistor: 4 Ω
Current: I = V/R = 12/4 = 3 A

**Example 2: Finding Voltage**
Current: 2 A, Resistance: 6 Ω
Voltage: V = I × R = 2 × 6 = 12 V

**Example 3: Finding Resistance**
Voltage: 120 V, Current: 10 A
Resistance: R = V/I = 120/10 = 12 Ω

**Example 4: Light Bulb**
120 V bulb draws 0.5 A
Resistance: R = 120/0.5 = 240 Ω
Power: P = V × I = 120 × 0.5 = 60 W (60-watt bulb!)

**Example 5: Heater**
1500 W heater on 120 V outlet
Current: P = V × I → I = P/V = 1500/120 = 12.5 A
Resistance: R = V/I = 120/12.5 = 9.6 Ω

**Example 6: Multiple Resistors**
Two resistors in series: R1 = 10 Ω, R2 = 20 Ω
Total resistance: R_total = R1 + R2 = 30 Ω
With 60 V battery: I = 60/30 = 2 A

**Ohmic vs Non-Ohmic Materials:**
- **Ohmic:** Resistance constant (metals) - V vs I graph is straight line
- **Non-Ohmic:** Resistance changes (diodes, transistors) - V vs I graph is curved

## Page 5: Series and Parallel Circuits

**Series Circuit:**
Components connected in a single path - current flows through each component one after another.

**Series Rules:**
1. **Same current everywhere:** I_total = I1 = I2 = I3
2. **Voltages add:** V_total = V1 + V2 + V3
3. **Resistances add:** R_total = R1 + R2 + R3

**Example: Christmas Lights (Old Style)**
10 bulbs in series, each 12 Ω, on 120 V
- Total resistance: R = 10 × 12 = 120 Ω
- Current: I = 120/120 = 1 A (same through all bulbs)
- Voltage per bulb: V = 120/10 = 12 V
- If one breaks, circuit opens, all go out!

**Parallel Circuit:**
Components connected across multiple paths - current splits among paths.

**Parallel Rules:**
1. **Same voltage across each:** V_total = V1 = V2 = V3
2. **Currents add:** I_total = I1 + I2 + I3
3. **Resistances:** 1/R_total = 1/R1 + 1/R2 + 1/R3

**Example: House Outlets**
Three devices plugged into 120 V outlet:
- Lamp: 240 Ω → I = 120/240 = 0.5 A
- TV: 60 Ω → I = 120/60 = 2 A
- Heater: 10 Ω → I = 120/10 = 12 A
- Total current: 0.5 + 2 + 12 = 14.5 A
- If one unplugs, others still work!

**Detailed Example: Mixed Circuit**
Two 10 Ω resistors in parallel, then in series with 5 Ω resistor, 30 V battery.

Step 1: Parallel resistors
1/R_parallel = 1/10 + 1/10 = 2/10
R_parallel = 5 Ω

Step 2: Total resistance
R_total = R_parallel + R_series = 5 + 5 = 10 Ω

Step 3: Total current
I_total = V/R = 30/10 = 3 A

Step 4: Voltage across parallel section
V_parallel = I × R = 3 × 5 = 15 V

Step 5: Current through each parallel resistor
I_each = 15/10 = 1.5 A (splits equally)

## Page 6: Electrical Power and Energy

**Power:** Rate of energy transfer

**Formulas:**
1. P = V × I (voltage × current)
2. P = I²R (current² × resistance)
3. P = V²/R (voltage² / resistance)

All three are equivalent (derived from Ohm's Law)!

**Energy:** E = P × t
- E = energy (Joules or kWh)
- P = power (Watts)
- t = time (seconds or hours)

**Kilowatt-hour (kWh):**
Energy unit used by electric companies
1 kWh = 1000 W × 3600 s = 3,600,000 J = 3.6 MJ

**Detailed Examples:**

**Example 1: Light Bulb**
60 W bulb on 120 V circuit
Current: P = V × I → I = 60/120 = 0.5 A
Resistance: R = V/I = 120/0.5 = 240 Ω

Running for 5 hours:
Energy = 60 W × 5 h = 300 Wh = 0.3 kWh
Cost (at $0.12/kWh): 0.3 × $0.12 = $0.036 (less than 4 cents)

**Example 2: Electric Heater**
1500 W heater
Current (on 120 V): I = 1500/120 = 12.5 A
Resistance: R = 120/12.5 = 9.6 Ω

Running for 8 hours:
Energy = 1.5 kW × 8 h = 12 kWh
Cost: 12 × $0.12 = $1.44

**Example 3: Power Loss in Wires**
10 A current through 0.5 Ω wire
Power loss: P = I²R = 10² × 0.5 = 50 W
This energy becomes heat!

**Example 4: Comparing Bulbs**
Incandescent: 60 W for 800 lumens
LED: 10 W for 800 lumens (same brightness)

Running 5 hours/day for 30 days:
Incandescent: 60 × 5 × 30 = 9000 Wh = 9 kWh → $1.08
LED: 10 × 5 × 30 = 1500 Wh = 1.5 kWh → $0.18
Savings: $0.90/month, $10.80/year per bulb!

**Why High Voltage for Power Transmission?**
Power loss in wires: P = I²R
For same power delivered: P = V × I
Higher voltage → Lower current → Much less power loss!

Example:
Transmit 1,000,000 W over 1 Ω wire

At 1000 V: I = 1,000,000/1000 = 1000 A
Loss: P = 1000² × 1 = 1,000,000 W (100% loss!)

At 100,000 V: I = 1,000,000/100,000 = 10 A
Loss: P = 10² × 1 = 100 W (0.01% loss!)

This is why power lines use very high voltages!

## Page 7: Electrical Safety

**Current is What's Dangerous!**

**Effects of Current on Human Body:**
- 0.001 A (1 mA): Barely perceptible
- 0.005 A (5 mA): Maximum "safe" current
- 0.010 A (10 mA): Involuntary muscle contractions, can't let go
- 0.030 A (30 mA): Breathing difficulty
- 0.075 A (75 mA): Ventricular fibrillation (heart stops pumping)
- 0.100 A (100 mA): Often fatal
- 1 A and above: Severe burns, cardiac arrest

**Why is Current Dangerous?**
- Disrupts electrical signals in nerves and heart
- Causes muscles to contract involuntarily
- Can stop the heart or breathing

**Factors Affecting Shock Severity:**
1. **Current magnitude:** More current = more dangerous
2. **Duration:** Longer exposure = more dangerous
3. **Path through body:** Through heart = most dangerous
4. **Frequency:** AC at 50-60 Hz is most dangerous
5. **Body resistance:** Wet skin = lower resistance = more current

**Body Resistance:**
- Dry skin: 100,000 Ω
- Wet skin: 1,000 Ω (100× less!)
- Internal body: 300-1000 Ω

**Example: Shock Calculation**
Touch 120 V with wet hands (1000 Ω resistance)
Current: I = V/R = 120/1000 = 0.12 A = 120 mA
This is potentially FATAL!

Same voltage with dry hands (100,000 Ω):
Current: I = 120/100,000 = 0.0012 A = 1.2 mA
Barely felt, relatively safe

**Safety Rules:**
1. **Never touch electrical wires with wet hands**
2. **Don't use electrical devices near water**
3. **Don't overload outlets** (fire hazard)
4. **Use circuit breakers and fuses**
5. **Ground electrical systems properly**
6. **Use GFCI outlets in bathrooms/kitchens**
7. **Don't touch downed power lines**
8. **Unplug devices before repairing**

**Circuit Breakers:**
Automatically disconnect circuit if current exceeds safe limit.
- 15 A breaker: Trips if current > 15 A
- Prevents fires from overheating wires

**Ground Fault Circuit Interrupter (GFCI):**
Detects current imbalance (leakage to ground)
Trips in 0.025 seconds if imbalance > 5 mA
Required in bathrooms, kitchens, outdoors

## Page 8: Batteries and DC vs AC

**Battery:**
Converts chemical energy to electrical energy
Provides constant voltage (Direct Current - DC)

**Types:**
- **Primary (non-rechargeable):** Alkaline, zinc-carbon
- **Secondary (rechargeable):** Lithium-ion, NiMH, lead-acid

**Battery Specifications:**
- **Voltage:** Electrical potential (1.5 V, 3.7 V, 12 V, etc.)
- **Capacity:** Energy storage (mAh or Ah)
  * 2000 mAh = can provide 2000 mA for 1 hour, or 1000 mA for 2 hours

**Example: Phone Battery**
3.7 V, 3000 mAh battery
Energy: E = V × Q = 3.7 × 3 = 11.1 Wh

If phone uses 1 W:
Runtime: 11.1 Wh / 1 W = 11.1 hours

**Direct Current (DC):**
- Current flows in one direction
- Constant voltage
- Sources: Batteries, solar panels, DC power supplies
- Uses: Electronics, LED lights, electric vehicles

**Alternating Current (AC):**
- Current periodically reverses direction
- Voltage oscillates sinusoidally
- Frequency: 60 Hz (US) or 50 Hz (Europe)
- Sources: Power plants, generators
- Uses: Home outlets, appliances, power transmission

**Why AC for Power Distribution?**
1. Easy to transform voltage (transformers)
2. Efficient long-distance transmission
3. Simple generators
4. Historically, won the "War of Currents" (Edison vs Tesla)

**AC Specifications:**
- **RMS Voltage:** Effective voltage (120 V in US)
- **Peak Voltage:** Maximum voltage (170 V in US)
- **Frequency:** Cycles per second (60 Hz in US)

**Relationship:** V_peak = V_RMS × √2 ≈ V_RMS × 1.414

## Page 9: Real-World Applications

**1. Power Grid:**
- Power plant generates AC at 25,000 V
- Step-up transformer: 25,000 V → 500,000 V (transmission)
- Step-down transformer: 500,000 V → 7,200 V (distribution)
- Step-down transformer: 7,200 V → 120/240 V (homes)

**2. Electric Vehicles:**
- Battery: 400 V DC, 75 kWh capacity
- Motor: 200 kW (268 hp)
- Range: 300 miles
- Charging: AC from outlet converted to DC for battery

**3. Solar Power:**
- Solar panels produce DC
- Inverter converts DC to AC for home use
- Excess power sent to grid

**4. Electronics:**
- Wall adapter converts 120 V AC to low voltage DC (5V, 12V, etc.)
- Rectifier converts AC to DC
- Voltage regulator maintains constant voltage

**5. Lightning:**
- Voltage: 100 million to 1 billion volts!
- Current: 20,000 to 200,000 A
- Duration: 0.0002 seconds
- Energy: ~250 kWh (but too brief to capture)

## Page 10: Practice Problems

**Problem 1:** A 12 V battery is connected to a 4 Ω resistor. Find:
a) Current
b) Power dissipated

**Solution:**
a) I = V/R = 12/4 = 3 A
b) P = V × I = 12 × 3 = 36 W
   Or: P = I²R = 3² × 4 = 36 W ✓

**Problem 2:** A device uses 5 A at 120 V. Find:
a) Resistance
b) Power
c) Energy used in 3 hours
d) Cost at $0.12/kWh

**Solution:**
a) R = V/I = 120/5 = 24 Ω
b) P = V × I = 120 × 5 = 600 W
c) E = P × t = 600 W × 3 h = 1800 Wh = 1.8 kWh
d) Cost = 1.8 × $0.12 = $0.216 ≈ $0.22

**Problem 3:** Three resistors in series: 10 Ω, 20 Ω, 30 Ω, connected to 60 V. Find:
a) Total resistance
b) Current
c) Voltage across each resistor

**Solution:**
a) R_total = 10 + 20 + 30 = 60 Ω
b) I = V/R = 60/60 = 1 A
c) V1 = I × R1 = 1 × 10 = 10 V
   V2 = 1 × 20 = 20 V
   V3 = 1 × 30 = 30 V
   Check: 10 + 20 + 30 = 60 V ✓

**Problem 4:** Two resistors in parallel: 12 Ω and 6 Ω, connected to 12 V. Find:
a) Total resistance
b) Total current
c) Current through each resistor

**Solution:**
a) 1/R_total = 1/12 + 1/6 = 1/12 + 2/12 = 3/12
   R_total = 4 Ω
b) I_total = V/R = 12/4 = 3 A
c) I1 = 12/12 = 1 A
   I2 = 12/6 = 2 A
   Check: 1 + 2 = 3 A ✓

**Common Misconceptions:**
❌ "Voltage flows through a circuit" → ✅ Current flows, voltage is the push
❌ "Batteries store charge" → ✅ Batteries store chemical energy, not charge
❌ "Higher voltage is always more dangerous" → ✅ Current kills, not voltage (but higher V can cause higher I)
❌ "Electricity travels at light speed" → ✅ Electrons drift slowly (~mm/s), but energy propagates fast`,

  'Waves': `## WAVES - Energy Transfer Through Space and Matter

Waves are one of the most important phenomena in physics. They transfer energy from one place to another without transferring matter. From ocean waves to sound to light to earthquakes, waves are everywhere in nature and technology. Understanding waves is essential for comprehending sound, light, radio, earthquakes, and even quantum mechanics.

## Page 1: Introduction to Waves

**What is a Wave?**
A wave is a disturbance that transfers energy from one location to another without transferring matter. The medium (material) oscillates in place while the wave pattern moves forward.

**Key Concept:** The wave moves, but the material doesn't travel with it!

**Example: Ocean Wave**
- Wave travels across ocean (energy moves)
- Water molecules just move up and down in circles (matter stays in place)
- Surfers ride the energy, not the water itself

**Example: Stadium Wave**
- Wave pattern travels around stadium
- Each person just stands up and sits down (doesn't move to next seat)
- Pattern moves, people don't

**Parts of a Wave:**
- **Crest:** Highest point
- **Trough:** Lowest point
- **Amplitude (A):** Maximum displacement from equilibrium (height of crest or depth of trough)
- **Wavelength (λ):** Distance between consecutive crests (or troughs)
- **Period (T):** Time for one complete wave cycle
- **Frequency (f):** Number of complete cycles per second

**Wave Properties:**
1. **Wavelength (λ):** Measured in meters (m)
2. **Frequency (f):** Measured in Hertz (Hz) = cycles/second
3. **Period (T):** Measured in seconds (s)
4. **Amplitude (A):** Measured in meters (m)
5. **Speed (v):** Measured in m/s

**Relationships:**
- f = 1/T (frequency = 1 / period)
- T = 1/f (period = 1 / frequency)
- v = fλ (speed = frequency × wavelength)

**Example 1: Wave Calculations**
Wave with frequency 5 Hz:
- Period: T = 1/5 = 0.2 seconds (each cycle takes 0.2 s)
- Meaning: 5 complete waves pass per second

Wave with period 0.1 seconds:
- Frequency: f = 1/0.1 = 10 Hz
- Meaning: 10 complete waves pass per second

**Example 2: Energy and Amplitude**
Amplitude determines energy:
- Larger amplitude = more energy
- 2× amplitude = 4× energy (energy ∝ amplitude²)

Ocean waves:
- Small waves (0.5 m amplitude): Gentle
- Large waves (3 m amplitude): Powerful, dangerous
- Tsunami (10+ m amplitude): Devastating

## Page 2: Types of Waves

**1. Transverse Waves:**
Particles oscillate perpendicular (at right angles) to wave direction.

**Examples:**
- Light waves (electromagnetic)
- Water waves (surface)
- Waves on a string/rope
- S-waves in earthquakes

**Visualization:**
Wave moves right →
Particles move up ↑ and down ↓

**Example: Rope Wave**
Shake rope up and down:
- Wave travels horizontally along rope
- Rope particles move vertically up and down
- Perpendicular motion = transverse

**2. Longitudinal Waves:**
Particles oscillate parallel (same direction) to wave direction.

**Examples:**
- Sound waves
- P-waves in earthquakes
- Compression waves in springs

**Visualization:**
Wave moves right →
Particles move right → and left ←

**Example: Sound Wave**
- Air molecules compress and expand
- Compressions (high pressure) and rarefactions (low pressure)
- Molecules vibrate back and forth in direction of wave travel

**Example: Slinky**
Push and pull slinky:
- Wave travels along slinky
- Coils compress and expand in same direction
- Parallel motion = longitudinal

**3. Surface Waves:**
Combination of transverse and longitudinal motion.

**Example: Ocean Waves**
- Water molecules move in circular paths
- Both up/down and forward/backward
- Energy travels horizontally across surface

**Comparison:**

| Property | Transverse | Longitudinal |
|----------|------------|--------------|
| Particle motion | Perpendicular | Parallel |
| Can travel in vacuum | Yes (light) | No (need medium) |
| Examples | Light, rope | Sound, slinky |
| Can be polarized | Yes | No |

## Page 3: Wave Properties - Wavelength, Frequency, and Speed

**Wavelength (λ):**
Distance between two consecutive points in phase (crest to crest, or trough to trough).

**Measured in:** meters (m), centimeters (cm), nanometers (nm)

**Examples:**
- Radio waves: 1 m to 100,000 m
- Visible light: 400-700 nm (nanometers)
- X-rays: 0.01-10 nm
- Sound (middle C): 1.3 m

**Frequency (f):**
Number of complete wave cycles passing a point per second.

**Measured in:** Hertz (Hz) = cycles per second

**Examples:**
- AM radio: 500-1600 kHz (kilohertz)
- FM radio: 88-108 MHz (megahertz)
- WiFi: 2.4 or 5 GHz (gigahertz)
- Visible light: 430-750 THz (terahertz)
- Sound (middle C): 262 Hz

**Period (T):**
Time for one complete wave cycle.

**Measured in:** seconds (s)

**Relationship:** T = 1/f

**Examples:**
- 60 Hz AC power: T = 1/60 = 0.0167 s (16.7 ms)
- 440 Hz sound (A note): T = 1/440 = 0.00227 s (2.27 ms)

**Amplitude (A):**
Maximum displacement from equilibrium position.

**Determines:**
- Energy of wave (Energy ∝ A²)
- Intensity (brightness for light, loudness for sound)

**Examples:**
- Loud sound: Large amplitude
- Quiet sound: Small amplitude
- Bright light: Large amplitude
- Dim light: Small amplitude

**Wave Speed (v):**
How fast the wave pattern travels.

**Formula:** v = fλ (speed = frequency × wavelength)

This is the FUNDAMENTAL WAVE EQUATION!

**Detailed Examples:**

**Example 1: Sound Wave**
Frequency: 440 Hz (A note)
Speed of sound: 343 m/s
Wavelength: λ = v/f = 343/440 = 0.78 m

**Example 2: Light Wave**
Wavelength: 500 nm (green light)
Speed of light: 3 × 10⁸ m/s
Frequency: f = v/λ = (3 × 10⁸)/(500 × 10⁻⁹) = 6 × 10¹⁴ Hz

**Example 3: Radio Wave**
FM station at 100 MHz
Speed: 3 × 10⁸ m/s (light speed)
Wavelength: λ = v/f = (3 × 10⁸)/(100 × 10⁶) = 3 m

**Example 4: Relationship**
If frequency doubles, wavelength halves (for constant speed):
- Original: f = 100 Hz, λ = 3.43 m
- Doubled: f = 200 Hz, λ = 1.715 m
- v = fλ = 343 m/s (constant!)

## Page 4: The Electromagnetic Spectrum

**Electromagnetic Waves:**
Transverse waves consisting of oscillating electric and magnetic fields. They can travel through vacuum (no medium needed)!

**ALL electromagnetic waves travel at the speed of light:** c = 3 × 10⁸ m/s (in vacuum)

**The Spectrum (from longest to shortest wavelength):**

**1. Radio Waves**
- Wavelength: > 1 mm
- Frequency: < 300 GHz
- Uses: Radio, TV, WiFi, cell phones, radar
- Penetration: Pass through walls easily

**2. Microwaves**
- Wavelength: 1 mm to 1 m
- Frequency: 300 MHz to 300 GHz
- Uses: Microwave ovens, satellite communication, radar
- Fact: Microwave ovens use 2.45 GHz to heat water molecules

**3. Infrared (IR)**
- Wavelength: 700 nm to 1 mm
- Frequency: 300 GHz to 430 THz
- Uses: Remote controls, thermal imaging, night vision
- Fact: We feel IR as heat

**4. Visible Light**
- Wavelength: 400-700 nm
- Frequency: 430-750 THz
- Colors (ROYGBIV):
  * Red: 700 nm (lowest frequency)
  * Orange: 620 nm
  * Yellow: 580 nm
  * Green: 550 nm
  * Blue: 470 nm
  * Indigo: 450 nm
  * Violet: 400 nm (highest frequency)
- Only part we can see!

**5. Ultraviolet (UV)**
- Wavelength: 10-400 nm
- Frequency: 750 THz to 30 PHz
- Effects: Causes sunburn, kills bacteria, produces vitamin D
- Blocked by: Ozone layer (mostly), sunscreen, glass

**6. X-rays**
- Wavelength: 0.01-10 nm
- Frequency: 30 PHz to 30 EHz
- Uses: Medical imaging, airport security, astronomy
- Penetration: Pass through soft tissue, blocked by bones/metal

**7. Gamma Rays**
- Wavelength: < 0.01 nm
- Frequency: > 30 EHz
- Sources: Radioactive decay, nuclear reactions, cosmic events
- Most energetic, most dangerous
- Uses: Cancer treatment, sterilization

**Key Relationships:**
- Longer wavelength = Lower frequency = Lower energy
- Shorter wavelength = Higher frequency = Higher energy
- Energy = h × f (h = Planck's constant)

**Example: Comparing Waves**
Red light: λ = 700 nm, f = 4.3 × 10¹⁴ Hz
Blue light: λ = 400 nm, f = 7.5 × 10¹⁴ Hz
Blue has shorter wavelength, higher frequency, more energy!

**Why Sky is Blue:**
Blue light scatters more than red (shorter wavelength)
Sunlight hits atmosphere → blue scatters in all directions → we see blue sky!

## Page 5: Wave Behaviors - Reflection, Refraction, Diffraction

**1. Reflection:**
Wave bounces off a surface.

**Law of Reflection:** Angle of incidence = Angle of reflection

**Examples:**
- Mirror: Light reflects
- Echo: Sound reflects off walls/mountains
- Radar: Radio waves reflect off objects
- Sonar: Sound waves reflect off underwater objects

**Types:**
- **Specular reflection:** Smooth surface (mirror) - organized reflection
- **Diffuse reflection:** Rough surface (paper) - scattered reflection

**Example: Echo**
Shout at mountain 343 m away:
- Sound travels to mountain: t = 343/343 = 1 second
- Reflects back: t = 1 second
- Total time: 2 seconds
- You hear echo after 2 seconds

**2. Refraction:**
Wave bends when entering a different medium (due to speed change).

**Cause:** Wave speed changes in different materials

**Examples:**
- Straw in water looks bent
- Lenses focus light
- Mirages in desert
- Rainbow formation

**Snell's Law:** n₁ sin(θ₁) = n₂ sin(θ₂)
- n = refractive index
- θ = angle from normal

**Refractive Indices:**
- Vacuum: 1.00
- Air: 1.0003 ≈ 1.00
- Water: 1.33
- Glass: 1.5
- Diamond: 2.42

**Example: Light Entering Water**
Light slows down in water (from 3 × 10⁸ m/s to 2.25 × 10⁸ m/s)
Bends toward normal (perpendicular to surface)
This is why pools look shallower than they are!

**3. Diffraction:**
Wave spreads out when passing through an opening or around an obstacle.

**Key Point:** More diffraction when:
- Wavelength is larger
- Opening is smaller

**Examples:**
- Hear sound around corners (long wavelength)
- Can't see light around corners (short wavelength)
- Radio waves bend around buildings
- Water waves spread through harbor entrance

**Example: Why We Hear But Don't See Around Corners**
Sound wavelength: ~1 m (similar to door size) → diffracts well
Light wavelength: ~500 nm (much smaller than door) → minimal diffraction

**4. Interference:**
Two or more waves overlap and combine.

**Constructive Interference:**
- Waves in phase (crests align)
- Amplitudes add
- Result: Larger amplitude

**Destructive Interference:**
- Waves out of phase (crest meets trough)
- Amplitudes subtract
- Result: Smaller amplitude or cancellation

**Examples:**
- Noise-canceling headphones: Create opposite wave to cancel noise
- Thin film interference: Colors in soap bubbles, oil slicks
- Double-slit experiment: Proves wave nature of light

**Example: Noise Cancellation**
Original noise: Amplitude = +A
Canceling wave: Amplitude = -A
Result: +A + (-A) = 0 (silence!)

## Page 6: Sound Waves

**What is Sound?**
Longitudinal pressure waves traveling through matter (air, water, solids).

**Cannot travel through vacuum!** (No medium = no sound)

**Speed of Sound:**
- Air (20°C): 343 m/s (767 mph)
- Water: 1,480 m/s (4.3× faster than air)
- Steel: 5,960 m/s (17× faster than air)
- Vacuum: 0 m/s (can't travel!)

**Why faster in solids?**
Molecules closer together → vibrations transfer faster

**Properties of Sound:**

**1. Pitch:**
Determined by frequency
- High frequency = High pitch (soprano, whistle)
- Low frequency = Low pitch (bass, thunder)

**Human hearing range:** 20 Hz to 20,000 Hz
- Infrasound: < 20 Hz (elephants, earthquakes)
- Ultrasound: > 20,000 Hz (bats, dolphins, medical imaging)

**2. Loudness:**
Determined by amplitude
- Large amplitude = Loud
- Small amplitude = Quiet

**Measured in:** Decibels (dB)
- 0 dB: Threshold of hearing
- 30 dB: Whisper
- 60 dB: Normal conversation
- 85 dB: Heavy traffic (hearing damage with prolonged exposure)
- 120 dB: Rock concert (pain threshold)
- 140 dB: Jet engine (immediate hearing damage)
- 194 dB: Loudest possible sound in air (shockwave)

**3. Timbre (Quality):**
Determined by wave shape (combination of frequencies)
- Why different instruments sound different playing same note
- Piano vs guitar vs violin - all playing middle C (262 Hz)

**Doppler Effect:**
Frequency changes when source or observer moves.

**Moving toward:** Frequency increases (higher pitch)
**Moving away:** Frequency decreases (lower pitch)

**Examples:**
- Ambulance siren: Higher pitch approaching, lower pitch leaving
- Race car: Pitch drops as it passes
- Astronomy: Red shift (galaxies moving away), blue shift (moving toward)

**Formula:** f' = f × (v ± v_observer) / (v ∓ v_source)

**Example: Ambulance**
Siren frequency: 1000 Hz
Ambulance speed: 30 m/s
Sound speed: 343 m/s

Approaching: f' = 1000 × 343/(343-30) = 1096 Hz (higher!)
Leaving: f' = 1000 × 343/(343+30) = 920 Hz (lower!)

**Sonic Boom:**
When object travels faster than sound (supersonic)
- Creates shockwave (cone-shaped)
- Heard as loud boom
- Examples: Supersonic jets, bullets, whips

## Page 7: Light Waves and Optics

**Light as a Wave:**
Electromagnetic wave with wavelength 400-700 nm

**Properties:**
- Travels at c = 3 × 10⁸ m/s (in vacuum)
- Can travel through vacuum
- Transverse wave
- Exhibits reflection, refraction, diffraction, interference

**Reflection:**

**Plane Mirror:**
- Image is virtual (behind mirror)
- Same size as object
- Left-right reversed

**Curved Mirrors:**
- **Concave (converging):** Can form real or virtual images
  * Uses: Telescopes, makeup mirrors, headlights
- **Convex (diverging):** Always forms virtual, smaller images
  * Uses: Security mirrors, car side mirrors

**Refraction:**

**Lenses:**
- **Convex (converging):** Thicker in middle
  * Focuses light to a point
  * Uses: Magnifying glass, camera, eyeglasses (farsightedness)
- **Concave (diverging):** Thinner in middle
  * Spreads light out
  * Uses: Eyeglasses (nearsightedness), peepholes

**Lens Equation:** 1/f = 1/d_o + 1/d_i
- f = focal length
- d_o = object distance
- d_i = image distance

**Dispersion:**
Different colors refract by different amounts
- Red bends least
- Violet bends most
- Creates rainbows!

**Rainbow Formation:**
1. Sunlight enters water droplet
2. Refracts (separates into colors)
3. Reflects off back of droplet
4. Refracts again exiting droplet
5. Colors spread out → rainbow!

**Polarization:**
Light waves oscillating in one plane only

**Examples:**
- Polarized sunglasses: Block glare (reflected light is polarized)
- 3D movies: Use polarization to separate images for each eye
- LCD screens: Use polarized light

**Interference:**

**Thin Film Interference:**
Light reflects from top and bottom of thin film
- Two reflected waves interfere
- Creates colors in soap bubbles, oil slicks, butterfly wings

**Double-Slit Experiment:**
Light through two slits creates interference pattern
- Proves wave nature of light
- Alternating bright and dark bands

## Page 8: Standing Waves and Resonance

**Standing Wave:**
Wave pattern that appears stationary, formed by interference of two waves traveling in opposite directions.

**Nodes:** Points of zero amplitude (no motion)
**Antinodes:** Points of maximum amplitude

**Examples:**
- Guitar string
- Organ pipe
- Microwave oven
- Laser cavity

**String Fixed at Both Ends:**

**Fundamental (1st harmonic):**
- Wavelength: λ = 2L
- Frequency: f₁ = v/(2L)
- One antinode in middle

**2nd Harmonic:**
- Wavelength: λ = L
- Frequency: f₂ = 2f₁
- Two antinodes

**3rd Harmonic:**
- Wavelength: λ = 2L/3
- Frequency: f₃ = 3f₁
- Three antinodes

**General:** f_n = n × f₁ (n = 1, 2, 3, ...)

**Example: Guitar String**
Length: 0.65 m
Wave speed: 400 m/s

Fundamental: f₁ = 400/(2 × 0.65) = 308 Hz
2nd harmonic: f₂ = 2 × 308 = 616 Hz
3rd harmonic: f₃ = 3 × 308 = 924 Hz

**Resonance:**
System vibrates with maximum amplitude at its natural frequency.

**Examples:**
- Pushing swing at right time → high amplitude
- Shattering glass with sound (opera singer)
- Tacoma Narrows Bridge collapse (1940)
- Musical instruments
- Radio tuning

**Resonance Conditions:**
- Driving frequency = Natural frequency
- Energy efficiently transferred
- Amplitude builds up

**Example: Swing**
Natural period: 2 seconds
Push every 2 seconds → resonance → swing goes high
Push every 1 second → no resonance → swing doesn't go high

## Page 9: Real-World Applications

**1. Medical Imaging:**

**Ultrasound:**
- Frequency: 1-20 MHz
- Uses: Pregnancy imaging, examining organs
- Safe (no radiation)

**X-rays:**
- High-energy electromagnetic waves
- Pass through soft tissue, blocked by bones
- Uses: Broken bones, dental imaging

**MRI:**
- Uses radio waves and magnetic fields
- Creates detailed images of soft tissues
- No radiation

**2. Communication:**

**Radio/TV:**
- AM radio: 500-1600 kHz
- FM radio: 88-108 MHz
- TV: 54-890 MHz
- Waves carry information through air

**Cell Phones:**
- Frequency: 800-2600 MHz
- Digital signals
- Towers relay signals

**WiFi:**
- Frequency: 2.4 or 5 GHz
- Short range
- High data rate

**Fiber Optics:**
- Uses light waves in glass fibers
- Total internal reflection keeps light inside
- Very high data rate
- Internet backbone

**3. Remote Sensing:**

**Radar:**
- Radio waves reflect off objects
- Measures distance and speed
- Uses: Weather, air traffic control, speed guns

**Sonar:**
- Sound waves underwater
- Echolocation
- Uses: Submarines, fish finders, mapping ocean floor

**Lidar:**
- Laser light
- Very precise distance measurement
- Uses: Self-driving cars, 3D mapping

**4. Energy:**

**Microwave Oven:**
- 2.45 GHz microwaves
- Water molecules absorb energy
- Rotate rapidly → heat

**Solar Panels:**
- Convert light to electricity
- Photovoltaic effect
- Renewable energy

**5. Entertainment:**

**Music:**
- Instruments create standing waves
- Different harmonics = different timbres
- Speakers convert electrical signals to sound waves

**3D Movies:**
- Polarized light
- Different polarization for each eye
- Creates depth perception

## Page 10: Practice Problems

**Problem 1:** A wave has frequency 50 Hz and wavelength 2 m. Find:
a) Period
b) Speed

**Solution:**
a) T = 1/f = 1/50 = 0.02 seconds
b) v = fλ = 50 × 2 = 100 m/s

**Problem 2:** Sound wave in air at 343 m/s has frequency 686 Hz. Find wavelength.

**Solution:**
λ = v/f = 343/686 = 0.5 m

**Problem 3:** Light has wavelength 600 nm. Find frequency.

**Solution:**
f = v/λ = (3 × 10⁸)/(600 × 10⁻⁹) = 5 × 10¹⁴ Hz

**Problem 4:** Guitar string length 0.6 m, wave speed 300 m/s. Find fundamental frequency.

**Solution:**
f₁ = v/(2L) = 300/(2 × 0.6) = 250 Hz

**Problem 5:** Why can't sound travel through space?

**Solution:**
Sound is a mechanical wave that requires a medium (matter) to travel through. Space is a vacuum (no matter), so sound waves cannot propagate.

**Common Misconceptions:**
❌ "Sound travels faster than light" → ✅ Light is ~1 million times faster
❌ "Radio waves and light are different things" → ✅ Both are electromagnetic waves, just different frequencies
❌ "Waves carry matter" → ✅ Waves carry energy, not matter
❌ "Higher amplitude = higher frequency" → ✅ Amplitude and frequency are independent`,

  'Modern Physics': `## MODERN PHYSICS - The Extreme Universe

Modern Physics is the study of the universe at extreme scales - the incredibly small (atoms and subatomic particles) and the incredibly fast (near the speed of light). It revolutionized our understanding of reality in the early 20th century and continues to challenge our intuitions about how the universe works.

## Page 1: Introduction to Modern Physics

**The Two Pillars:**
1. **Relativity (Einstein):** Physics of the very fast and very massive
2. **Quantum Mechanics:** Physics of the very small

**Why "Modern"?**
- Classical physics (Newton, Maxwell) worked perfectly for everyday objects
- But failed at extreme scales
- Early 1900s: New theories needed
- Einstein, Bohr, Heisenberg, Schrödinger revolutionized physics

**The Crisis of Classical Physics:**

**Problem 1: Blackbody Radiation**
- Classical physics predicted infinite energy at high frequencies ("ultraviolet catastrophe")
- Max Planck (1900): Energy comes in discrete packets (quanta)
- This was the birth of quantum mechanics!

**Problem 2: Photoelectric Effect**
- Light shining on metal ejects electrons
- Classical wave theory couldn't explain observations
- Einstein (1905): Light is made of particles (photons)
- Won Nobel Prize for this, not relativity!

**Problem 3: Atomic Stability**
- Classical physics said atoms should collapse instantly
- Electrons orbiting nucleus should radiate energy and spiral in
- Bohr (1913): Electrons exist in discrete energy levels
- Can't spiral in - quantum mechanics prevents it!

**Problem 4: Speed of Light**
- Maxwell's equations predicted constant light speed
- But relative to what?
- Michelson-Morley experiment (1887): Light speed same in all directions
- Einstein (1905): Light speed is absolute constant
- Led to special relativity!

**The Revolution:**
Modern physics showed that:
- Time is not absolute (relativity)
- Energy is quantized (quantum mechanics)
- Particles are waves (wave-particle duality)
- Reality is probabilistic (quantum mechanics)
- Mass and energy are equivalent (E = mc²)

## Page 2: Special Relativity - Part 1

**Einstein's 1905 Breakthrough:**
At age 26, Einstein published his theory of Special Relativity, forever changing our understanding of space and time.

**Two Postulates:**
1. **Laws of physics are the same in all inertial reference frames**
   - No experiment can tell if you're at rest or moving at constant velocity
   - Physics works the same on Earth or on a spaceship moving at constant speed

2. **Speed of light is constant for all observers**
   - Light always travels at c = 299,792,458 m/s ≈ 3 × 10⁸ m/s
   - Doesn't matter if you're moving toward or away from light source
   - This seems impossible, but it's true!

**Why This is Weird:**

**Classical (Wrong) View:**
- You're on a train going 50 mph
- Throw a ball forward at 20 mph
- Observer on ground sees ball at 50 + 20 = 70 mph
- Velocities add!

**Relativistic (Correct) View:**
- You're on a spaceship going 0.5c (half light speed)
- Shine a flashlight forward
- You see light at c
- Observer on Earth ALSO sees light at c (not 1.5c!)
- Light speed doesn't add!

**Time Dilation:**
Moving clocks run slower!

**Formula:** t' = t / √(1 - v²/c²)
- t = time for stationary observer
- t' = time for moving observer
- v = velocity
- c = speed of light

**Lorentz Factor:** γ = 1 / √(1 - v²/c²)
- At low speeds: γ ≈ 1 (no noticeable effect)
- At high speeds: γ >> 1 (huge effect!)

**Examples:**

**Example 1: Everyday Speeds**
Car at 100 mph = 45 m/s
γ = 1 / √(1 - 45²/(3×10⁸)²) ≈ 1.0000000000000112
Time dilation: Completely negligible!

**Example 2: High Speed**
Spaceship at 0.9c (90% light speed)
γ = 1 / √(1 - 0.9²) = 1 / √(1 - 0.81) = 1 / √0.19 = 2.29

Travel for 1 year (your time):
- Earth time: 1 × 2.29 = 2.29 years
- You age 1 year, Earth ages 2.29 years!

**Example 3: Near Light Speed**
Spaceship at 0.99c
γ = 7.09
Your 1 year = Earth's 7.09 years!

Spaceship at 0.999c
γ = 22.4
Your 1 year = Earth's 22.4 years!

**Real Evidence:**
- Muons (particles) created in upper atmosphere
- Should decay before reaching ground
- But time dilation extends their lifetime
- We detect them at ground level!
- Proves time dilation is real!

## Page 3: Special Relativity - Part 2

**Length Contraction:**
Moving objects appear shorter in the direction of motion!

**Formula:** L' = L × √(1 - v²/c²) = L / γ

**Example:**
Spaceship 100 m long traveling at 0.9c
L' = 100 / 2.29 = 43.7 m
Appears only 43.7 m long to stationary observer!

**Mass-Energy Equivalence: E = mc²**

This is the most famous equation in physics!

**What it means:**
- Mass and energy are the same thing
- Mass is "frozen" energy
- Energy is "liberated" mass
- They can convert into each other

**Formula:** E = mc²
- E = energy (Joules)
- m = mass (kg)
- c = speed of light (3 × 10⁸ m/s)

**Why c²?**
c² = (3 × 10⁸)² = 9 × 10¹⁶
This is HUGE! Tiny mass = enormous energy!

**Detailed Examples:**

**Example 1: One Gram**
m = 0.001 kg
E = 0.001 × (3 × 10⁸)² = 9 × 10¹³ J

This equals:
- 21 kilotons of TNT (Hiroshima bomb was 15 kilotons)
- Enough to power a city for days
- All from 1 gram!

**Example 2: One Kilogram**
E = 1 × 9 × 10¹⁶ = 90,000,000,000,000,000 J
= 90 petajoules
= 21 megatons of TNT
= Enough to power USA for several hours!

**Example 3: The Sun**
Sun converts 4 million tons of mass to energy every second!
E = 4,000,000,000 kg × 9 × 10¹⁶ = 3.6 × 10²⁶ J/second
This is why the sun shines!

**Nuclear Reactions:**

**Fission (splitting atoms):**
- Uranium-235 splits into smaller atoms
- Products have slightly less mass than original
- Missing mass converted to energy (E = mc²)
- Nuclear power plants use this

**Fusion (combining atoms):**
- Hydrogen atoms fuse into helium
- Products have less mass than original
- Missing mass → energy
- Powers the sun and stars
- Future of clean energy?

**Relativistic Momentum:**
p = γmv
At high speeds, momentum increases more than classically predicted!

**Why Nothing Can Reach Light Speed:**
As v → c:
- γ → ∞
- Mass → ∞
- Energy needed → ∞
- Impossible!

Only massless particles (photons) can travel at c!

## Page 4: General Relativity - Gravity as Curved Spacetime

**Einstein's Greatest Achievement (1915):**
General Relativity extends Special Relativity to include gravity and acceleration.

**Revolutionary Idea:**
Gravity is not a force - it's the curvature of spacetime!

**Spacetime:**
- Not separate "space" and "time"
- Combined 4-dimensional "spacetime"
- 3 space dimensions + 1 time dimension
- Massive objects curve spacetime

**The Rubber Sheet Analogy:**
- Imagine spacetime as a stretched rubber sheet
- Place a bowling ball (massive object) on it
- Sheet curves around the ball
- Roll a marble nearby - it curves toward the ball
- Not because of "force" - because of curved space!

**Einstein's Field Equations:**
Describe how mass/energy curves spacetime
(Very complex mathematics - tensor calculus)

**Key Predictions:**

**1. Gravitational Time Dilation:**
Time runs slower in stronger gravity!
- At sea level: Time runs slower than on mountain
- Near black hole: Time nearly stops
- GPS satellites: Must correct for this!

**Example: GPS Satellites**
- Orbit at 20,000 km altitude (weaker gravity)
- Clocks run 45 microseconds/day faster than Earth
- Without correction: GPS off by 11 km per day!
- Proves general relativity!

**2. Gravitational Lensing:**
Light bends around massive objects
- Confirmed during 1919 solar eclipse
- Made Einstein world famous
- Used to find dark matter and exoplanets

**3. Gravitational Waves:**
Ripples in spacetime from accelerating masses
- Predicted 1916
- Detected 2015 (LIGO)
- From merging black holes
- Nobel Prize 2017!

**4. Black Holes:**
Extreme curvature of spacetime
- Escape velocity > light speed
- Nothing can escape
- Time stops at event horizon

**Black Hole Properties:**
- **Event Horizon:** Point of no return
- **Singularity:** Infinite density at center
- **Schwarzschild Radius:** Size of event horizon
  * Formula: r = 2GM/c²
  * For Earth: 9 mm (if compressed to black hole)
  * For Sun: 3 km

**Example: Falling into Black Hole**
From outside perspective:
- You slow down as you approach
- Time dilation increases
- You appear to freeze at event horizon
- Never actually see you cross it!

From your perspective:
- Nothing special at event horizon
- Cross it normally
- Then pulled to singularity
- "Spaghettification" - stretched by tidal forces!

## Page 5: Introduction to Quantum Mechanics

**The Quantum Revolution:**
Quantum mechanics describes the behavior of matter and energy at atomic and subatomic scales. It's the most successful theory in physics - incredibly accurate predictions!

**Key Principles:**
1. Energy is quantized (comes in discrete packets)
2. Wave-particle duality (everything is both wave and particle)
3. Uncertainty principle (can't know everything precisely)
4. Superposition (particles in multiple states simultaneously)
5. Probability (can only predict probabilities, not certainties)

**Why Quantum Mechanics?**

**Classical physics failed for atoms:**
- Predicted atoms should collapse instantly
- Couldn't explain atomic spectra
- Couldn't explain chemical bonds
- Couldn't explain why matter is stable

**Quantum mechanics succeeded:**
- Explains atomic structure perfectly
- Predicts spectra with incredible accuracy
- Explains all of chemistry
- Basis for modern technology

**The Quantum World is Weird:**
- Particles don't have definite positions until measured
- Observation affects reality
- Particles can be in two places at once
- Particles can tunnel through barriers
- Entangled particles affect each other instantly

**But it works!**
- Most precisely tested theory ever
- Predictions accurate to 12 decimal places
- Basis for: computers, smartphones, lasers, LEDs, solar panels, MRI, etc.

## Page 6: Wave-Particle Duality

**The Central Mystery of Quantum Mechanics:**
Everything is BOTH a wave AND a particle!

**Light as Particles (Photons):**

**Photoelectric Effect (Einstein, 1905):**
- Shine light on metal → electrons ejected
- Classical wave theory predictions:
  * Brighter light → more energetic electrons (WRONG!)
  * Any frequency should work eventually (WRONG!)
- Actual observations:
  * Brighter light → more electrons, same energy
  * Only high frequency light works
  * Instant ejection (no delay)

**Einstein's Explanation:**
- Light comes in particles (photons)
- Each photon has energy: E = hf
  * h = Planck's constant = 6.626 × 10⁻³⁴ J·s
  * f = frequency
- One photon ejects one electron
- Higher frequency → more energy per photon

**Example:**
Red light: f = 4.5 × 10¹⁴ Hz
E = (6.626 × 10⁻³⁴)(4.5 × 10¹⁴) = 3.0 × 10⁻¹⁹ J per photon

Blue light: f = 7.5 × 10¹⁴ Hz
E = (6.626 × 10⁻³⁴)(7.5 × 10¹⁴) = 5.0 × 10⁻¹⁹ J per photon

Blue photons have more energy!

**Light as Waves:**
- Interference patterns (double-slit experiment)
- Diffraction
- Polarization
- All wave behaviors!

**Matter as Waves (de Broglie, 1924):**

If light (wave) can be particle, can matter (particle) be wave?

**de Broglie Wavelength:** λ = h / p = h / (mv)
- λ = wavelength
- h = Planck's constant
- p = momentum
- m = mass, v = velocity

**Examples:**

**Example 1: Electron**
m = 9.11 × 10⁻³¹ kg, v = 10⁶ m/s
λ = (6.626 × 10⁻³⁴) / (9.11 × 10⁻³¹ × 10⁶) = 7.3 × 10⁻¹⁰ m
Similar to atomic spacing - wave effects observable!

**Example 2: Baseball**
m = 0.145 kg, v = 40 m/s
λ = (6.626 × 10⁻³⁴) / (0.145 × 40) = 1.1 × 10⁻³⁴ m
Way too small to observe - acts like particle!

**Electron Diffraction:**
- Shoot electrons at crystal
- Get interference pattern (wave behavior!)
- Proves electrons are waves
- Used in electron microscopes

**Double-Slit Experiment:**
- Shoot particles (electrons, photons) at two slits
- Get interference pattern (wave!)
- But detect individual particles (particle!)
- Each particle goes through BOTH slits simultaneously!
- Observing which slit → pattern disappears!
- Observation changes reality!

## Page 7: Heisenberg Uncertainty Principle

**The Fundamental Limit of Knowledge:**
You cannot simultaneously know both the exact position and exact momentum of a particle.

**Formula:** Δx × Δp ≥ h/(4π)
- Δx = uncertainty in position
- Δp = uncertainty in momentum
- h = Planck's constant

**What This Means:**
- More precisely you know position → less precisely you know momentum
- More precisely you know momentum → less precisely you know position
- This is NOT a measurement problem
- This is how nature fundamentally works!

**Why?**
Particles are waves! Waves are spread out. A particle doesn't HAVE an exact position and momentum simultaneously!

**Examples:**

**Example 1: Electron in Atom**
If we know electron position within 10⁻¹⁰ m (atomic size):
Δp ≥ (6.626 × 10⁻³⁴) / (4π × 10⁻¹⁰) ≈ 5 × 10⁻²⁵ kg·m/s

This uncertainty in momentum means electron has kinetic energy - prevents collapse into nucleus!

**Example 2: Baseball**
Δx = 1 mm = 10⁻³ m
Δp ≥ (6.626 × 10⁻³⁴) / (4π × 10⁻³) ≈ 5 × 10⁻³² kg·m/s

For 0.145 kg baseball:
Δv ≥ 5 × 10⁻³² / 0.145 ≈ 3 × 10⁻³¹ m/s

Completely negligible! Uncertainty principle doesn't affect large objects.

**Energy-Time Uncertainty:**
ΔE × Δt ≥ h/(4π)

Can "borrow" energy for short time!
- Basis for virtual particles
- Quantum fluctuations
- Hawking radiation from black holes

**Philosophical Implications:**
- Reality is fundamentally uncertain
- Determinism is impossible at quantum level
- Can only predict probabilities
- Einstein hated this: "God does not play dice!"
- But experiments prove Einstein wrong!

## Page 8: Quantum Superposition and Entanglement

**Superposition:**
Particles exist in multiple states simultaneously until measured!

**Schrödinger's Cat (Thought Experiment):**
- Cat in sealed box
- Radioactive atom: 50% chance to decay in 1 hour
- If decays → releases poison → cat dies
- If doesn't decay → cat lives

**Quantum interpretation:**
- Before opening box, atom is in superposition (decayed AND not decayed)
- Cat is in superposition (alive AND dead)
- Opening box = measurement
- Superposition collapses to one state
- Cat becomes definitely alive OR dead

**This seems absurd!** But it's how quantum mechanics works for particles!

**Real Examples:**

**Electron Spin:**
- Electron has "spin" (up or down)
- Before measurement: Superposition of both!
- Measurement: Collapses to up OR down
- 50% probability each

**Photon Polarization:**
- Photon can be vertically or horizontally polarized
- Before measurement: Superposition of both!
- Measurement: Collapses to one

**Quantum Entanglement:**
Two particles become correlated - measuring one instantly affects the other, regardless of distance!

**Einstein called it "spooky action at a distance"** and thought it proved quantum mechanics was incomplete. He was wrong!

**Example: Entangled Photons**
- Create two photons with opposite spins
- Send them in opposite directions
- Measure one: Gets spin up
- Other INSTANTLY becomes spin down
- Even if separated by light-years!
- Faster than light? No - can't send information this way

**Bell's Theorem (1964):**
- Proved entanglement is real
- No "hidden variables" can explain it
- Experiments confirm: Nature is truly non-local!

**Applications:**
- **Quantum Computing:** Use superposition for parallel computation
- **Quantum Cryptography:** Unbreakable encryption using entanglement
- **Quantum Teleportation:** Transfer quantum states (not matter!)

## Page 9: Quantum Tunneling and Applications

**Quantum Tunneling:**
Particles can pass through barriers they classically couldn't!

**Classical View:**
- Ball rolling toward hill
- Not enough energy → bounces back
- Can't go through hill!

**Quantum View:**
- Particle is a wave
- Wave extends into barrier
- Small probability of appearing on other side
- Particle "tunnels" through!

**Probability:** Decreases exponentially with barrier width and height

**Real Examples:**

**1. Radioactive Decay:**
- Alpha particles trapped in nucleus
- Don't have enough energy to escape
- But they tunnel out!
- This is why radioactivity happens

**2. Nuclear Fusion in Sun:**
- Protons need to get very close to fuse
- But they repel each other (both positive)
- Don't have enough energy to overcome repulsion
- But they tunnel through the barrier!
- This is why the sun shines!

**3. Scanning Tunneling Microscope (STM):**
- Sharp tip brought near surface
- Electrons tunnel between tip and surface
- Tunneling current depends on distance
- Can image individual atoms!
- Nobel Prize 1986

**4. Flash Memory:**
- Electrons tunnel through insulator
- Get trapped in floating gate
- Stores data in your USB drive, SSD, phone!

**5. Enzymes:**
- Biological reactions use quantum tunneling
- Protons and electrons tunnel through barriers
- Makes reactions faster
- Life depends on quantum mechanics!

## Page 10: Atomic Structure and Quantum Numbers

**Bohr Model (1913):**
- Electrons orbit nucleus in specific energy levels
- Can't exist between levels
- Jumping between levels absorbs/emits photons

**Quantum Mechanical Model:**
- Electrons don't have definite orbits
- Exist in "orbitals" (probability clouds)
- Described by wave functions

**Quantum Numbers:**
Four numbers describe each electron:

**1. Principal Quantum Number (n):**
- Energy level: n = 1, 2, 3, ...
- Higher n = higher energy, farther from nucleus

**2. Angular Momentum Quantum Number (l):**
- Orbital shape: l = 0, 1, 2, ..., (n-1)
- l = 0: s orbital (spherical)
- l = 1: p orbital (dumbbell)
- l = 2: d orbital (complex)
- l = 3: f orbital (very complex)

**3. Magnetic Quantum Number (m_l):**
- Orbital orientation: m_l = -l, ..., 0, ..., +l

**4. Spin Quantum Number (m_s):**
- Electron spin: m_s = +1/2 or -1/2 (up or down)

**Pauli Exclusion Principle:**
No two electrons can have the same set of all four quantum numbers!

This explains:
- Periodic table structure
- Chemical bonding
- Why matter doesn't collapse

## Page 11: Real-World Applications of Modern Physics

**1. Nuclear Energy:**
- **Fission Reactors:** Split uranium → energy (E = mc²)
  * 1 kg uranium = 3 million kg coal
  * Powers 20% of US electricity
- **Future Fusion:** Combine hydrogen → helium
  * Clean, abundant fuel
  * Still experimental (ITER project)

**2. Semiconductors and Electronics:**
- **Transistors:** Quantum mechanics explains how they work
  * Billions in every computer chip
  * Basis of all modern electronics
- **LEDs:** Electrons drop energy levels → emit photons
  * Energy-efficient lighting
- **Solar Panels:** Photoelectric effect
  * Convert light to electricity

**3. Lasers:**
- **Stimulated Emission:** Quantum process
- Applications:
  * Surgery (precise cutting)
  * Communications (fiber optics)
  * Manufacturing (cutting, welding)
  * Entertainment (laser shows, Blu-ray)
  * Measurement (LIDAR, surveying)

**4. Medical Imaging:**
- **MRI:** Uses quantum spin of hydrogen nuclei
  * No radiation
  * Detailed soft tissue images
- **PET Scans:** Uses antimatter (positrons!)
  * Detects cancer, brain activity

**5. GPS:**
- **Requires relativity corrections!**
  * Special relativity: Satellite clocks run slower (moving fast)
  * General relativity: Satellite clocks run faster (weaker gravity)
  * Net effect: +38 microseconds/day
  * Without correction: 11 km error per day!

**6. Quantum Computing:**
- Uses superposition and entanglement
- Can solve certain problems exponentially faster
- Still experimental but rapidly developing
- Applications: Cryptography, drug discovery, AI

**7. Atomic Clocks:**
- Use quantum transitions in atoms
- Accurate to 1 second in 100 million years!
- Basis for GPS, internet timing, scientific experiments

## Page 12: Mind-Blowing Facts and Future Physics

**Time Travel:**

**Forward Time Travel (Possible!):**
- Travel near light speed → time slows for you
- Return to Earth → you've traveled to future!
- Example: Travel at 0.999c for 1 year (your time)
  * Earth time: 22.4 years
  * You've jumped 21.4 years into future!

**Backward Time Travel (Probably Impossible):**
- Would violate causality (grandfather paradox)
- General relativity allows some solutions (wormholes, rotating black holes)
- But require exotic matter with negative energy
- Probably impossible in practice

**Antimatter:**
- For every particle, there's an antiparticle
  * Electron ↔ Positron
  * Proton ↔ Antiproton
- Same mass, opposite charge
- Matter + Antimatter → Pure energy!
  * 100% efficient (E = mc²)
  * 1 kg matter + 1 kg antimatter = 180 petajoules
  * Enough to power USA for 2 days!
- Why is universe made of matter, not antimatter?
  * One of biggest unsolved mysteries!

**Dark Matter and Dark Energy:**
- **Dark Matter:** 27% of universe
  * Doesn't emit light
  * Only detected through gravity
  * Unknown what it is!
- **Dark Energy:** 68% of universe
  * Causes universe to expand faster
  * Completely mysterious!
- **Normal Matter:** Only 5% of universe!
  * Everything we can see and touch

**Quantum Foam:**
- At Planck scale (10⁻³⁵ m), spacetime is turbulent
- Virtual particles pop in and out of existence
- Energy borrowed from uncertainty principle
- Spacetime itself is quantum!

**The Measurement Problem:**
- When does superposition collapse?
- What counts as "measurement"?
- Does consciousness play a role?
- Still debated after 100 years!

**Many-Worlds Interpretation:**
- Every quantum measurement splits universe
- All possibilities happen in parallel universes
- Schrödinger's cat: Both alive AND dead, in different universes!
- Controversial but mathematically consistent

**Unsolved Mysteries:**
1. How to combine quantum mechanics and general relativity?
   - Need "quantum gravity" theory
   - String theory? Loop quantum gravity?
2. What is dark matter?
3. What is dark energy?
4. Why is there more matter than antimatter?
5. What happened before Big Bang?
6. Are there extra dimensions?
7. Is our universe unique, or one of many?

## Page 13: Practice Problems and Summary

**Problem 1:** A spaceship travels at 0.8c. How much time passes on Earth while 5 years pass on the ship?

**Solution:**
γ = 1 / √(1 - 0.8²) = 1 / √0.36 = 1.67
Earth time = 5 × 1.67 = 8.35 years

**Problem 2:** How much energy is released if 0.01 kg of matter is converted to energy?

**Solution:**
E = mc² = 0.01 × (3 × 10⁸)² = 9 × 10¹⁴ J
(About 200,000 tons of TNT!)

**Problem 3:** A photon has wavelength 500 nm. What is its energy?

**Solution:**
f = c/λ = (3 × 10⁸)/(500 × 10⁻⁹) = 6 × 10¹⁴ Hz
E = hf = (6.626 × 10⁻³⁴)(6 × 10¹⁴) = 4.0 × 10⁻¹⁹ J

**Problem 4:** What is the de Broglie wavelength of an electron moving at 10⁶ m/s?

**Solution:**
λ = h/(mv) = (6.626 × 10⁻³⁴)/[(9.11 × 10⁻³¹)(10⁶)]
λ = 7.3 × 10⁻¹⁰ m (about atomic size!)

**Key Takeaways:**

**Relativity:**
- Time and space are relative, not absolute
- Nothing can exceed light speed
- Mass and energy are equivalent (E = mc²)
- Gravity is curved spacetime
- GPS needs relativity to work!

**Quantum Mechanics:**
- Energy is quantized
- Everything is both wave and particle
- Uncertainty is fundamental
- Superposition and entanglement are real
- Observation affects reality
- Basis for all modern technology

**The Weirdness is Real:**
- Confirmed by countless experiments
- Most precisely tested theories ever
- But still don't fully understand WHY
- Nature is stranger than we imagined!

**Common Misconceptions:**
❌ "Relativity is just a theory" → ✅ Confirmed by countless experiments, used in GPS
❌ "Quantum mechanics only applies to tiny things" → ✅ Basis for lasers, computers, solar panels
❌ "Time travel is impossible" → ✅ Forward time travel is possible (and proven!)
❌ "Schrödinger's cat is really alive and dead" → ✅ Thought experiment to show absurdity at macro scale
❌ "Quantum mechanics is just probability" → ✅ It's fundamentally different from classical probability

**The Future:**
Modern physics continues to evolve. Current frontiers include quantum computing, quantum gravity, dark matter detection, and understanding the early universe. The next revolution in physics may be just around the corner!`
      };
      explanation = fallbacks[topic] || `${topic} is an important concept in physics that involves the study of matter, energy, and their interactions. This topic covers fundamental principles that help us understand the natural world and develop new technologies. To learn more about ${topic}, study the key formulas, work through practice problems, and try to connect the concepts to real-world examples you encounter in daily life.`;
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

    let flashcards;

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `Generate 3 flashcard questions and answers about ${topic} in physics. Format as JSON array with "question" and "answer" fields.`
        }],
        max_tokens: 300
      });
      flashcards = JSON.parse(completion.choices[0].message.content);
    } else {
      // Fallback flashcards
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
      flashcards = fallbackCards[topic] || [
        { question: `What is ${topic}?`, answer: 'Study your textbook for details!' },
        { question: `Key formula for ${topic}?`, answer: 'Check your notes!' },
        { question: `Application of ${topic}?`, answer: 'Practice problems!' }
      ];
    }

    res.json({ flashcards });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// Q&A endpoint - ask questions about topics
app.post('/ask-question', async (req, res) => {
  try {
    const { topic, question } = req.body;
    if (!topic || !question) return res.status(400).json({ error: 'Topic and question required' });

    let answer;
    
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: `You are a helpful physics tutor. Answer questions about ${topic} in simple, clear language for high school students. Use examples.`
        }, {
          role: "user",
          content: question
        }],
        max_tokens: 300
      });
      answer = completion.choices[0].message.content;
    } else {
      // Smart fallback - match keywords in question
      const q = question.toLowerCase();
      
      // Motion questions
      if (topic === 'Motion') {
        if (q.includes('velocity') || q.includes('speed')) {
          answer = "Speed is how fast you're going (like 60 mph). Velocity is speed PLUS direction (like 60 mph north). So two cars going 60 mph in opposite directions have different velocities but the same speed!";
        } else if (q.includes('acceleration')) {
          answer = "Acceleration is when your speed OR direction changes. Speeding up? Accelerating. Slowing down? Accelerating (backward). Turning a corner? Still accelerating because your direction changed!";
        } else if (q.includes('formula') || q.includes('equation')) {
          answer = "Key formulas: v = u + at (final speed), s = ut + ½at² (distance), v² = u² + 2as. Where v=final speed, u=starting speed, a=acceleration, t=time, s=distance.";
        } else if (q.includes('example')) {
          answer = "Example: When you throw a ball up, it slows down (negative acceleration from gravity), stops at the top, then speeds up coming down. The whole time, gravity is accelerating it downward at 9.8 m/s²!";
        } else {
          answer = "Motion is about how things move! Key ideas: Speed (how fast), Velocity (speed + direction), Acceleration (changing speed or direction). Ask me about any of these!";
        }
      }
      
      // Newton's Laws questions
      else if (topic === 'Newton Laws') {
        if (q.includes('first') || q.includes('inertia') || q.includes('1')) {
          answer = "Newton's 1st Law (Inertia): Things don't want to change! If sitting still, they stay still. If moving, they keep moving the same way. That's why you jerk forward when a car brakes - your body wants to keep moving!";
        } else if (q.includes('second') || q.includes('f=ma') || q.includes('2')) {
          answer = "Newton's 2nd Law: F = ma (Force = Mass × Acceleration). Heavier things need more force to move. That's why pushing a car is harder than pushing a bike - the car has way more mass!";
        } else if (q.includes('third') || q.includes('action') || q.includes('reaction') || q.includes('3')) {
          answer = "Newton's 3rd Law: Every action has an equal opposite reaction. When you jump, you push down on the ground, and the ground pushes you up! Rockets work this way too - they push gas down, gas pushes rocket up.";
        } else if (q.includes('example')) {
          answer = "Walking example: You push backward on the ground (action), ground pushes you forward (reaction). That's Newton's 3rd Law! Without friction, you'd slip like on ice.";
        } else {
          answer = "Newton's 3 Laws explain how forces make things move! Law 1: Inertia (things resist change). Law 2: F=ma (heavier = harder to move). Law 3: Action-Reaction (forces come in pairs). Which one do you want to know more about?";
        }
      }
      
      // Energy questions
      else if (topic === 'Energy') {
        if (q.includes('kinetic')) {
          answer = "Kinetic Energy is moving energy! Formula: KE = ½mv². The v² part is important - if you double your speed, you get 4 times the energy! That's why high-speed crashes are so dangerous.";
        } else if (q.includes('potential')) {
          answer = "Potential Energy is stored energy! Formula: PE = mgh (mass × gravity × height). A book on a high shelf has more potential energy than one on a low shelf. Drop it and that potential becomes kinetic!";
        } else if (q.includes('conservation')) {
          answer = "Energy Conservation means energy never disappears, it just changes form! Roller coaster at the top: lots of potential energy. At the bottom: lots of kinetic energy. Total energy stays the same!";
        } else if (q.includes('example')) {
          answer = "Example: When you eat food (chemical energy), your body converts it to kinetic energy (moving) and heat (why you feel warm after exercise). The energy changed form but didn't disappear!";
        } else {
          answer = "Energy is the ability to do work! Two main types: Kinetic (moving) and Potential (stored). Energy can't be created or destroyed, only transformed. What specific part do you want to know about?";
        }
      }
      
      // Electricity questions
      else if (topic === 'Electricity') {
        if (q.includes('voltage') || q.includes('volt')) {
          answer = "Voltage is the electrical 'push' - like water pressure in a pipe. Higher voltage = stronger push for electrons. Your phone charger is 5 volts, wall outlet is 120 volts, power lines are thousands of volts!";
        } else if (q.includes('current') || q.includes('amp')) {
          answer = "Current is the flow of electrons - like how much water flows through a pipe. Measured in Amps. A phone charger uses 1-2 amps, a microwave uses 10-15 amps. Too much current = danger!";
        } else if (q.includes('resistance') || q.includes('ohm')) {
          answer = "Resistance is what slows down electron flow - like friction in a pipe. Thin wires have high resistance (get hot!), thick wires have low resistance (stay cool). Measured in Ohms.";
        } else if (q.includes('ohm') && q.includes('law')) {
          answer = "Ohm's Law: V = I × R (Voltage = Current × Resistance). If you know any two, you can find the third! Example: 12 volts with 4 ohms resistance = 3 amps of current.";
        } else if (q.includes('example')) {
          answer = "Example: Extension cords have thick wires to reduce resistance. If resistance is too high, the wire gets hot and could start a fire! That's why we use thick wires for high-power devices.";
        } else {
          answer = "Electricity is electron flow! Three key things: Voltage (the push), Current (the flow), Resistance (the obstacle). They're related by Ohm's Law: V = I × R. What do you want to know more about?";
        }
      }
      
      // Waves questions
      else if (topic === 'Waves') {
        if (q.includes('wavelength')) {
          answer = "Wavelength is the distance between two wave peaks. Radio waves have long wavelengths (meters), visible light has tiny wavelengths (nanometers), X-rays have even tinier wavelengths!";
        } else if (q.includes('frequency')) {
          answer = "Frequency is how many waves pass per second, measured in Hertz (Hz). High frequency = short wavelength. Low frequency = long wavelength. Radio stations are measured in MHz (millions of Hz)!";
        } else if (q.includes('transverse') || q.includes('longitudinal')) {
          answer = "Transverse waves: particles move up/down while wave goes forward (like a rope wave). Longitudinal waves: particles move forward/backward with the wave (like sound). Different motions!";
        } else if (q.includes('speed') || q.includes('formula')) {
          answer = "Wave equation: v = f × λ (Speed = Frequency × Wavelength). All light waves travel at 300,000,000 m/s! If frequency goes up, wavelength must go down to keep the same speed.";
        } else if (q.includes('example')) {
          answer = "Example: Your microwave uses microwaves (a type of light wave) at a specific frequency that makes water molecules vibrate. That vibration creates heat, which cooks your food!";
        } else {
          answer = "Waves transfer energy without moving material! Two types: Transverse (up/down motion) and Longitudinal (push/pull motion). Key properties: wavelength, frequency, amplitude, speed. What interests you?";
        }
      }
      
      // Modern Physics questions
      else if (topic === 'Modern Physics') {
        if (q.includes('relativity') || q.includes('einstein')) {
          answer = "Einstein's Relativity has two parts: Special (nothing goes faster than light, time slows at high speeds, E=mc²) and General (gravity is curved space-time). Mind-blowing: astronauts age slower than people on Earth!";
        } else if (q.includes('quantum')) {
          answer = "Quantum Mechanics is the physics of tiny things! Key ideas: particles are also waves, you can't know position AND speed perfectly (uncertainty), particles exist in multiple states until observed (superposition). It's weird but proven!";
        } else if (q.includes('e=mc') || q.includes('energy')) {
          answer = "E=mc² means mass and energy are the same thing! A tiny bit of mass converts to HUGE energy (c² is huge!). This powers the sun, nuclear reactors, and atomic bombs. Mass IS energy!";
        } else if (q.includes('time') || q.includes('dilation')) {
          answer = "Time Dilation: Time slows down as you go faster! If you travel at 90% light speed for 1 year, people on Earth age 2.3 years. GPS satellites need relativity corrections or they'd be off by miles!";
        } else if (q.includes('black hole')) {
          answer = "Black holes are where space curves infinitely! Gravity is so strong that even light can't escape. They're not 'holes' - they're super dense objects that warp space-time to the extreme!";
        } else if (q.includes('wave') && q.includes('particle')) {
          answer = "Wave-Particle Duality: Light acts like both waves AND particles (photons). Electrons act like both too! Everything has a wave nature. This isn't a metaphor - particles literally behave as waves!";
        } else if (q.includes('uncertainty')) {
          answer = "Heisenberg's Uncertainty Principle: You can't know both position AND speed perfectly. The more you know one, the less you know the other. This isn't a measurement problem - it's how nature fundamentally works!";
        } else if (q.includes('application') || q.includes('use')) {
          answer = "Modern Physics applications: Nuclear power (E=mc²), all electronics (quantum mechanics), lasers (stimulated emission), MRI machines (nuclear magnetic resonance), GPS (relativity corrections). Modern tech runs on modern physics!";
        } else if (q.includes('example')) {
          answer = "Example: Your phone's transistors work because of quantum mechanics! Electrons 'tunnel' through barriers they shouldn't be able to cross. Without quantum physics, no computers, phones, or modern electronics!";
        } else {
          answer = "Modern Physics covers the extreme: super tiny (quantum mechanics) and super fast (relativity). Key ideas: E=mc², time dilation, wave-particle duality, uncertainty principle. What specific part interests you?";
        }
      }
      
      // Generic fallback
      else {
        answer = `Great question about ${topic}! Here's a tip: Try asking about specific concepts like formulas, examples, or how things work. I can explain ${topic} in simple terms - just be specific about what you want to know!`;
      }
    }

    res.json({ answer });
  } catch (error) {
    console.error('Q&A error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// PDF upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let problems;
    
    if (openai) {
      problems = 'PDF uploaded! AI problem generation coming soon. For now, practice problems from your textbook.';
    } else {
      problems = 'PDF uploaded successfully! Add OpenAI API key to generate custom problems from your PDF.';
    }

    res.json({ problems, filename: req.file.filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Form submission endpoint
app.post('/submit', upload.single('file'), (req, res) => {
  const { topic, name, link } = req.body;
  
  if (!topic || !name) {
    return res.status(400).send('Topic and name are required');
  }

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
