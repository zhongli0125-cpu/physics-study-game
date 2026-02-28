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
      // Expanded lessons with pagination support (## marks new pages)
      const fallbacks = {
  'Motion': `## MOTION - The Physics of Movement

Motion is the change in position of an object over time. Everything in the universe is moving - from atoms vibrating to galaxies spinning. Understanding motion is the foundation of all physics!

## Page 1: Distance vs Displacement

**Distance** is the total path length you traveled. It's a scalar quantity (just a number with no direction).

**Displacement** is your change in position from start to finish. It's a vector quantity (has both magnitude and direction).

**Example:**
Imagine you walk 3 blocks north, then 3 blocks south.
- Distance = 6 blocks (you walked 6 blocks total)
- Displacement = 0 blocks (you ended where you started!)

**Another Example:**
You walk 4 meters east, then 3 meters north.
- Distance = 4 + 3 = 7 meters
- Displacement = 5 meters northeast (using Pythagorean theorem: √(4² + 3²) = 5)

**Key Point:** Distance is always positive or zero. Displacement can be positive, negative, or zero depending on direction.

## Page 2: Speed vs Velocity

**Speed** tells you how fast you're going. It's a scalar (just a number).
- Formula: speed = distance / time
- Unit: m/s, km/h, mph
- Example: "I'm driving 60 mph"

**Velocity** tells you how fast AND in what direction. It's a vector.
- Formula: velocity = displacement / time
- Unit: m/s (with direction)
- Example: "I'm driving 60 mph north"

**Important Difference:**
Two cars both going 60 mph have the same speed. But if one goes north and one goes south, they have DIFFERENT velocities! Direction matters for velocity.

## Page 3: Acceleration

Acceleration is the rate of change of velocity. It happens when you:
1. Speed up (positive acceleration)
2. Slow down (negative acceleration, called deceleration)
3. Change direction (even at constant speed!)

**Formula:** a = (v_final - v_initial) / time

**Unit:** m/s² (meters per second squared)

**Example:**
A car accelerates at 2 m/s²
- After 1 second: velocity increases by 2 m/s
- After 2 seconds: velocity increases by 4 m/s
- After 3 seconds: velocity increases by 6 m/s

## Page 4: The Equations of Motion

These are the most important formulas in physics:

**1. v = u + at**
- v = final velocity
- u = initial velocity
- a = acceleration
- t = time

**2. s = ut + ½at²**
- s = displacement

**3. v² = u² + 2as**
- Useful when you don't know time

**Example Problem:**
A car starts from rest (u = 0) and accelerates at 3 m/s² for 5 seconds. How far does it travel?
s = 0(5) + ½(3)(5²) = 37.5 meters

## Page 5: Free Fall and Gravity

**Acceleration due to gravity:** g = 9.8 m/s²

**Amazing Fact:** This is the SAME for all objects! A feather and a bowling ball fall at the same rate in a vacuum.

**Example: Dropping a ball**
- After 1 second: v = 9.8 m/s downward
- After 2 seconds: v = 19.6 m/s downward
- It keeps getting faster!

## Page 6: Practice Problems

**Problem 1:** A car accelerates from 0 to 60 mph (27 m/s) in 6 seconds. What's the acceleration?
**Answer:** a = (27 - 0) / 6 = 4.5 m/s²

**Problem 2:** You throw a ball upward at 20 m/s. How high does it go?
**Answer:** Use v² = u² + 2as, where v=0 at peak, u=20, a=-9.8
0 = 400 - 19.6s → s = 20.4 meters`,


  'Newton Laws': `## NEWTON'S LAWS OF MOTION

Sir Isaac Newton discovered three laws that explain how forces affect motion!

## Page 1: Newton's First Law - Inertia

**Statement:** An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

**What is Inertia?** Resistance to changes in motion. More mass = more inertia.

**Examples:**
- Car braking: You jerk forward (your body wants to keep moving)
- Tablecloth trick: Dishes stay in place when cloth pulled quickly
- Space travel: Spacecraft keeps moving without engines

## Page 2: Newton's Second Law - F = ma

**Statement:** Force equals mass times acceleration

**Formula:** F = ma

**What it means:**
- More force = more acceleration
- More mass = less acceleration (for same force)
- Force and acceleration have same direction

**The Newton:** 1 N = force to accelerate 1 kg at 1 m/s²

## Page 3: Weight vs Mass

**Mass:** Amount of matter (doesn't change)
- Measured in kilograms (kg)
- Same everywhere

**Weight:** Force of gravity on mass
- Formula: W = mg
- Measured in Newtons (N)
- Changes with gravity

**Example: 60 kg person**
- On Earth: Weight = 60 × 9.8 = 588 N
- On Moon: Weight = 60 × 1.6 = 96 N
- Mass is ALWAYS 60 kg!

## Page 4: Newton's Third Law - Action-Reaction

**Statement:** For every action, there is an equal and opposite reaction.

**Important:** Forces act on DIFFERENT objects!

**Examples:**
- Walking: You push ground back, ground pushes you forward
- Swimming: You push water back, water pushes you forward
- Rocket: Pushes gas down, gas pushes rocket up
- Jumping: You push down, ground pushes you up

## Page 5: Practice Problems

**Problem 1:** A 10 kg box is pushed with 50 N force. Friction is 20 N. What's the acceleration?
**Answer:** Net force = 50 - 20 = 30 N. a = F/m = 30/10 = 3 m/s²

**Problem 2:** What force is needed to accelerate a 1000 kg car at 2 m/s²?
**Answer:** F = ma = 1000 × 2 = 2000 N`,

  'Energy': `## ENERGY - The Ability to Do Work

Energy is the ability to cause change or do work. It cannot be created or destroyed, only transformed!

## Page 1: Kinetic Energy

**Formula:** KE = ½mv²

**Why v² matters:** 2× faster = 4× more energy!

**Examples:**
- Moving car has KE
- Flying bullet has lots of KE (high velocity)
- Wind has KE (can turn turbines)

**Example Calculation:**
Car: mass = 1000 kg, velocity = 20 m/s
KE = ½ × 1000 × 20² = 200,000 J

## Page 2: Potential Energy

**Gravitational PE Formula:** PE = mgh

**Examples:**
- Book on shelf has PE
- Water behind dam has PE
- Skier at top of hill has PE

**Example Calculation:**
10 kg object at 5 m height:
PE = 10 × 9.8 × 5 = 490 J

## Page 3: Law of Conservation of Energy

**Energy cannot be created or destroyed, only transformed!**

**Roller Coaster Example:**
- Top: Maximum PE, minimum KE
- Bottom: Minimum PE, maximum KE
- Total energy stays constant

## Page 4: Work and Power

**Work:** W = Force × Distance
- Measured in Joules (J)

**Power:** P = Work / Time
- Measured in Watts (W)
- 1 Watt = 1 Joule/second

**Examples:**
- 100 W light bulb uses 100 J every second
- Car engine: 100,000 W (100 kW)

## Page 5: Efficiency

**Formula:** Efficiency = (Useful energy out / Total energy in) × 100%

**Examples:**
- Incandescent bulb: 5% efficient (95% wasted as heat)
- LED bulb: 20% efficient (much better!)
- Car engine: 25% efficient
- Electric motor: 90% efficient

## Page 6: Practice Problems

**Problem 1:** A 2 kg ball is thrown at 10 m/s. What's its kinetic energy?
**Answer:** KE = ½mv² = ½ × 2 × 10² = 100 J

**Problem 2:** A 5 kg book is on a 2 m high shelf. What's its potential energy?
**Answer:** PE = mgh = 5 × 9.8 × 2 = 98 J`,

  'Electricity': `## ELECTRICITY - Flow of Electric Charge

Electricity is electrons flowing through wires. Think of it like water flowing through pipes!

## Page 1: The Three Key Concepts

**1. Voltage (V) - The Push**
- Like water pressure
- Measured in Volts
- Wall outlet: 120V

**2. Current (I) - The Flow**
- How many electrons flow
- Measured in Amps
- Current is dangerous!

**3. Resistance (R) - The Obstacle**
- What slows down flow
- Measured in Ohms (Ω)
- Thin wire: high resistance

## Page 2: Ohm's Law

**V = I × R**
(Voltage = Current × Resistance)

This is the most important equation in electricity!

**Example 1:** Battery: 12V, Resistance: 4Ω
Current = V/R = 12/4 = 3A

**Example 2:** Current: 2A, Resistance: 6Ω
Voltage = I × R = 2 × 6 = 12V

## Page 3: Series vs Parallel Circuits

**Series Circuit:**
- Components in single path
- Same current through all
- If one breaks, all stop
- Example: Old Christmas lights

**Parallel Circuit:**
- Components in multiple paths
- Same voltage across all
- If one breaks, others work
- Example: House outlets

## Page 4: Electrical Power

**Formula:** P = V × I

**Examples:**
- Light bulb: 120V × 0.5A = 60W
- Phone charger: 5V × 2A = 10W
- Microwave: 120V × 10A = 1200W

## Page 5: Safety

**Current is what's dangerous!**

- 0.001A (1mA): Barely feel it
- 0.01A (10mA): Can't let go
- 0.1A (100mA): Can be fatal!

**Safety Rules:**
- Never touch wires with wet hands
- Don't overload outlets
- Use circuit breakers
- Keep water away from electricity

## Page 6: Practice Problems

**Problem 1:** A circuit has 12V battery and 4Ω resistor. What's the current?
**Answer:** I = V/R = 12/4 = 3A

**Problem 2:** A device uses 5A at 120V. What's the power?
**Answer:** P = V × I = 120 × 5 = 600W`,

  'Waves': `## WAVES - Energy Transfer

Waves transfer energy without moving material!

## Page 1: What Are Waves?

A wave is a disturbance that transfers energy from one place to another.

**Key Concept:** The wave moves, but material just oscillates in place!

**Example:** Ocean wave travels across ocean, but water just moves up and down.

## Page 2: Types of Waves

**1. Transverse Waves**
Particles move perpendicular to wave direction.
- Examples: Light, water waves, rope waves

**2. Longitudinal Waves**
Particles move parallel to wave direction.
- Examples: Sound waves, earthquake waves

## Page 3: Wave Properties

**Wavelength (λ):** Distance between peaks
- Measured in meters

**Frequency (f):** Waves per second
- Measured in Hertz (Hz)

**Amplitude:** Height of wave
- Bigger amplitude = more energy

**Speed (v):** How fast wave travels

## Page 4: The Wave Equation

**v = f × λ**
(Speed = Frequency × Wavelength)

**Example:** Sound wave: f = 440 Hz, λ = 0.78 m
Speed = 440 × 0.78 = 343 m/s (speed of sound!)

## Page 5: Electromagnetic Spectrum

All travel at light speed: 3 × 10⁸ m/s!

**From longest to shortest:**
1. Radio waves - Radio, TV, WiFi
2. Microwaves - Microwave ovens
3. Infrared - Heat, remotes
4. Visible Light - What we see!
5. Ultraviolet - Sunburn
6. X-rays - See bones
7. Gamma rays - Most dangerous

## Page 6: Wave Behaviors

**Reflection:** Wave bounces off (mirrors, echoes)

**Refraction:** Wave bends (straw in water)

**Diffraction:** Wave spreads (hear around corners)

**Interference:** Waves combine or cancel

## Page 7: Practice Problems

**Problem 1:** A wave has frequency 50 Hz and wavelength 2 m. What's its speed?
**Answer:** v = f × λ = 50 × 2 = 100 m/s

**Problem 2:** Why can't sound travel through space?
**Answer:** Sound needs matter to travel through. Space is a vacuum!`,

  'Modern Physics': `## MODERN PHYSICS - The Extreme Universe

Modern Physics explains the very small (atoms) and very fast (near light speed)!

## Page 1: Special Relativity

**Einstein's Big Ideas:**

**1. Speed of Light is Constant**
Light always travels at c = 3 × 10⁸ m/s, no matter what!

**2. Time Dilation**
Time slows down as you go faster!

**Example:** Travel at 90% light speed for 1 year (your time):
- People on Earth age 2.3 years!
- This is real, not an illusion!

**3. E = mc²**
Mass and energy are the same thing!
- Tiny mass = Huge energy
- Nuclear power uses this

## Page 2: General Relativity

**Key Idea:** Gravity isn't a force - it's curved space-time!

**What this means:**
- Massive objects bend space and time
- Objects follow curved paths
- We're not "pulled" down - we're following curved space!

**Black Holes:**
- Space curves infinitely
- Nothing can escape, not even light
- Time stops at event horizon

## Page 3: Quantum Mechanics

**The Physics of the Very Small**

At atomic scales, reality is WEIRD:
- Particles are also waves
- Can't know position AND speed perfectly
- Particles exist in multiple states at once
- Observation changes reality

## Page 4: Wave-Particle Duality

**Light is BOTH a wave AND a particle!**

**Evidence for Wave:** Interference, diffraction

**Evidence for Particle:** Photoelectric effect, comes in packets (photons)

**Matter is ALSO both wave and particle!**
- Electrons show interference patterns
- Everything has a wave nature

## Page 5: Heisenberg Uncertainty Principle

**You can't know both position AND momentum perfectly!**

**Formula:** Δx × Δp ≥ h/4π

**What this means:**
- More you know position, less you know momentum
- This isn't a measurement problem - it's how nature works!

## Page 6: Quantum Superposition

**Particles exist in multiple states at once until observed!**

**Schrödinger's Cat:**
- Cat in box is BOTH alive AND dead until you look!

**Quantum Entanglement:**
- Two particles connected instantly across any distance
- Einstein called it "spooky action at a distance"
- Proven real!

## Page 7: Real-World Applications

**1. Nuclear Energy**
- E = mc² explains nuclear power
- 1 kg uranium = 3 million kg coal

**2. Semiconductors**
- Quantum mechanics explains transistors
- All electronics use this

**3. Lasers**
- Quantum mechanics explains how they work
- Used in surgery, communications, DVD players

**4. MRI Machines**
- Uses quantum spin of atoms
- Sees inside body without surgery

**5. GPS**
- Needs relativity corrections!
- Without them: Off by miles per day

## Page 8: Mind-Blowing Facts

**1. Time Travel (Forward):**
- Travel near light speed → time slows for you
- Return to Earth → everyone aged more
- You've traveled to the future!

**2. Quantum Tunneling:**
- Particles can pass through barriers!
- Like a ball rolling through a wall

**3. Antimatter:**
- For every particle, there's an opposite
- Matter + Antimatter = Pure energy!

**4. Observation Changes Reality:**
- Measuring a particle changes its state
- Reality is fundamentally probabilistic

## Page 9: Practice Problems

**Problem 1:** How much energy from 0.001 kg of matter?
**Answer:** E = mc² = 0.001 × (3×10⁸)² = 9 × 10¹³ J

**Problem 2:** Why can't we notice quantum effects in daily life?
**Answer:** Quantum effects are significant only at atomic scales. For large objects, wavelengths are too small.

**Remember:** Modern physics shows reality is WAY weirder than it seems! Time isn't constant, particles are waves, and observation changes reality!`
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
