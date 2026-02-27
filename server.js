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
      // Simple working explanations
     
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

**Average vs Instantaneous:**
- Average speed = total distance / total time
- Instantaneous speed = speed at a specific moment (what your speedometer shows)
- Same concepts apply to velocity

## Page 3: Acceleration

Acceleration is the rate of change of velocity. It happens when you:
1. Speed up (positive acceleration)
2. Slow down (negative acceleration, called deceleration)
3. Change direction (even at constant speed!)

**Formula:** a = (v_final - v_initial) / time

**Unit:** m/s² (meters per second squared)

**What does m/s² mean?**
It means your velocity changes by that many m/s every second.

**Example:**
A car accelerates at 2 m/s²
- After 1 second: velocity increases by 2 m/s
- After 2 seconds: velocity increases by 4 m/s
- After 3 seconds: velocity increases by 6 m/s

**Important:** Acceleration is a VECTOR, so it has direction! Acceleration can be:
- Forward (speeding up)
- Backward (slowing down)
- Sideways (turning)

## Page 4: The Equations of Motion

These are the most important formulas in physics. They work when acceleration is constant.

**1. v = u + at**
- v = final velocity
- u = initial velocity
- a = acceleration
- t = time
- Use when: You know initial velocity, acceleration, and time

**2. s = ut + ½at²**
- s = displacement
- Tells you how far something travels
- Use when: You want to find distance traveled

**3. v² = u² + 2as**
- Useful when you don't know time
- Connects velocity, acceleration, and distance
- Use when: Time is unknown

**4. s = (u + v)t / 2**
- Average velocity formula
- s = displacement
- Use when: You know both initial and final velocity

**Example Problem:**
A car starts from rest (u = 0) and accelerates at 3 m/s² for 5 seconds. How far does it travel?

Using s = ut + ½at²:
s = 0(5) + ½(3)(5²)
s = 0 + ½(3)(25)
s = 37.5 meters

## Page 5: Free Fall and Gravity

When you drop something, gravity accelerates it downward at a constant rate.

**Acceleration due to gravity:** g = 9.8 m/s² (or ~10 m/s² for easy calculations)

**Amazing Fact:** This is the SAME for all objects, regardless of mass! A feather and a bowling ball fall at the same rate in a vacuum (no air resistance).

**Why do feathers fall slower on Earth?**
Air resistance! In a vacuum, they fall at the same speed.

**Example: Dropping a ball**
Drop a ball from rest (u = 0):
- After 1 second: v = 9.8 m/s downward
- After 2 seconds: v = 19.6 m/s downward
- After 3 seconds: v = 29.4 m/s downward
- It keeps getting faster!

**Throwing upward:**
When you throw a ball up:
1. It slows down as it goes up (gravity pulls down)
2. At the peak, velocity = 0 (but acceleration is still 9.8 m/s² down!)
3. It speeds up coming down
4. It hits your hand at the same speed you threw it (ignoring air resistance)

## Page 6: Projectile Motion

When you throw something at an angle, it follows a curved path (parabola).

**Key Insight:** Horizontal and vertical motions are independent!

**Horizontal motion:**
- Constant velocity (no acceleration)
- No forces acting horizontally (ignoring air resistance)
- Distance = velocity × time

**Vertical motion:**
- Constant acceleration (gravity = 9.8 m/s² down)
- Same as free fall
- Use motion equations with a = -9.8 m/s²

**Example: Throwing a baseball**
- Horizontal: Ball moves at constant speed sideways
- Vertical: Ball slows going up, stops at peak, speeds up coming down
- Combined: Curved parabolic path

**Range Formula:**
For maximum distance, throw at 45° angle!

## Page 7: Relative Motion

Motion depends on your reference frame (what you're comparing to).

**Example 1: Train**
You're on a train going 60 mph:
- Relative to ground: you're moving 60 mph
- Relative to train: you're not moving (0 mph)
- Relative to another train going 60 mph same direction: 0 mph
- Relative to train going opposite direction at 60 mph: 120 mph!

**Example 2: Airplane**
Plane flies 500 mph east, wind blows 50 mph east:
- Ground speed = 500 + 50 = 550 mph east

Plane flies 500 mph east, wind blows 50 mph west:
- Ground speed = 500 - 50 = 450 mph east

**Key Point:** There's no "absolute" motion. All motion is relative to something!

## Page 8: Circular Motion

Moving in a circle requires constant acceleration toward the center, even at constant speed!

**Why?** Because velocity is a vector (has direction). If direction changes, velocity changes, so there's acceleration!

**Centripetal Acceleration:**
Formula: a = v² / r
- v = speed
- r = radius of circle
- Direction: Always toward center

**Example: Car turning**
When a car turns a corner at constant speed, it's accelerating toward the center of the turn. You feel pushed outward (that's inertia - your body wants to go straight!).

**Centripetal Force:**
F = mv² / r
- This is the force needed to keep something moving in a circle
- Examples: Tension in a string, friction on tires, gravity for planets

## Page 9: Real-World Applications

**1. Car Safety**
- Airbags deploy based on deceleration (negative acceleration)
- Seatbelts prevent you from continuing forward when car stops (Newton's 1st Law)
- Crumple zones increase stopping time to reduce acceleration (F = ma)

**2. Sports**
- Baseball pitcher: Acceleration of ball determines final speed
- Long jump: Projectile motion determines distance
- Race car: Acceleration determines how fast you reach top speed

**3. Space Travel**
- Rockets need huge acceleration to escape Earth's gravity
- Orbital motion is constant circular motion around Earth
- Relative motion determines docking procedures

**4. GPS and Navigation**
- Calculates velocity from position changes
- Determines arrival time from distance and speed
- Accounts for acceleration when giving directions

## Page 10: Common Misconceptions

❌ **WRONG:** "Heavier objects fall faster"
✅ **RIGHT:** All objects fall at same rate without air resistance (9.8 m/s²)

❌ **WRONG:** "If velocity is zero, acceleration must be zero"
✅ **RIGHT:** At the peak of a throw, velocity = 0 but acceleration = 9.8 m/s² downward!

❌ **WRONG:** "Acceleration always means speeding up"
✅ **RIGHT:** Acceleration can mean speeding up, slowing down, OR changing direction

❌ **WRONG:** "You need force to keep moving"
✅ **RIGHT:** Objects keep moving at constant velocity without force (Newton's 1st Law)

❌ **WRONG:** "Displacement is always equal to distance"
✅ **RIGHT:** Displacement is often less than distance (can even be zero!)

## Practice Problems

**Problem 1:** A car accelerates from 0 to 60 mph (27 m/s) in 6 seconds. What's the acceleration?
**Answer:** a = (27 - 0) / 6 = 4.5 m/s²

**Problem 2:** You throw a ball upward at 20 m/s. How high does it go?
**Answer:** Use v² = u² + 2as, where v=0 at peak, u=20, a=-9.8
0 = 400 - 19.6s → s = 20.4 meters

**Problem 3:** A train travels 100 km in 2 hours. What's its average speed?
**Answer:** speed = 100 km / 2 h = 50 km/h

**Problem 4:** A ball is dropped from a 45-meter building. How long until it hits the ground?
**Answer:** Use s = ut + ½at², where s=45, u=0, a=9.8
45 = 0 + ½(9.8)t² → t = 3 seconds

  'Newton Laws': `## NEWTON'S LAWS OF MOTION

Sir Isaac Newton (1643-1727) discovered three laws that explain how forces affect motion. These laws are the foundation of classical mechanics and apply to everything from baseballs to planets!

## Page 1: Newton's First Law - The Law of Inertia

**Statement:**
"An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force."

**What is Inertia?**
Inertia is the resistance of an object to changes in its motion. The more mass something has, the more inertia it has.

Think of it as "laziness" - objects don't want to change what they're doing!

**Examples:**

**1. Car Braking**
When a car suddenly stops, you jerk forward. Why?
- The car stops (force from brakes)
- Your body wants to keep moving (inertia)
- Seatbelt provides force to stop you

**2. Tablecloth Trick**
Pull a tablecloth quickly from under dishes:
- Dishes have inertia (want to stay still)
- Quick pull means little time for force to act
- Dishes stay in place!

**3. Space Travel**
Once a spacecraft reaches speed in space:
- No air resistance (no external force)
- Keeps moving forever at constant velocity
- Doesn't need engines to maintain speed!

## Page 2: Understanding Inertia

**Common Misconception:**
❌ WRONG: "Objects naturally slow down and stop"
✅ RIGHT: Objects only slow down because of friction/air resistance (external forces)

In a perfect vacuum with no friction, a moving object would continue forever!

**Mass and Inertia:**
- More mass = more inertia
- Harder to start moving
- Harder to stop once moving
- Harder to change direction

**Example:**
Pushing an empty shopping cart vs. a full one:
- Empty cart: Low mass, low inertia, easy to push
- Full cart: High mass, high inertia, hard to push

**Inertia in Daily Life:**
- Why you lean forward when bus brakes
- Why objects slide forward in car accidents
- Why it's hard to stop a heavy truck quickly
- Why astronauts float in space (no forces acting)

## Page 3: Newton's Second Law - F = ma

**Statement:**
"Force equals mass times acceleration" or F = ma

**Understanding the Variables:**

**Force (F):** Push or pull on an object
- Measured in Newtons (N)
- 1 Newton = force to accelerate 1 kg at 1 m/s²

**Mass (m):** Amount of matter in object
- Measured in kilograms (kg)
- Doesn't change with location

**Acceleration (a):** Rate of change of velocity
- Measured in m/s²
- Direction matters!

## Page 4: What F = ma Means

**1. More Force = More Acceleration**
Push harder → object accelerates faster
Example: Pushing a shopping cart harder makes it speed up faster

**2. More Mass = Less Acceleration**
Same force on heavier object → less acceleration
Example: Same push on empty cart vs full cart - empty cart accelerates more!

**3. Force and Acceleration Have Same Direction**
- Push right → object accelerates right
- Push left → object accelerates left
- Push up → object accelerates up

**The Newton (Unit of Force):**
1 Newton = force needed to accelerate 1 kg at 1 m/s²

Examples:
- Apple weighs about 1 N
- Pushing a door: 5-10 N
- Car engine: thousands of Newtons
- Rocket engine: millions of Newtons!

## Page 5: Weight vs Mass

**Mass:** Amount of matter (doesn't change)
- Same everywhere (Earth, Moon, space)
- Measured in kilograms (kg)
- Intrinsic property of object

**Weight:** Force of gravity on mass
- Changes with gravity
- Formula: W = mg (weight = mass × gravity)
- Measured in Newtons (N)

**Example: 60 kg person**
- On Earth (g = 9.8 m/s²): Weight = 60 × 9.8 = 588 N
- On Moon (g = 1.6 m/s²): Weight = 60 × 1.6 = 96 N
- In space (g = 0): Weight = 0 N (weightless!)
- Mass is ALWAYS 60 kg everywhere!

**Why weightless in space?**
No gravity pulling on you, so W = mg = m(0) = 0 N

## Page 6: Net Force

When multiple forces act on an object, add them as vectors to get net force.

**Balanced Forces:** Net force = 0
- No acceleration
- Object stays at rest OR moves at constant velocity
- Example: Book on table (gravity down = normal force up)

**Unbalanced Forces:** Net force ≠ 0
- Acceleration occurs
- Object speeds up, slows down, or changes direction
- Example: Falling object (gravity > air resistance)

**Example 1: Pushing a Box**
- You push with 100 N right
- Friction pushes 30 N left
- Net force = 100 - 30 = 70 N right
- Box accelerates right at a = F/m = 70/m

**Example 2: Elevator**
- Going up: Cable force > Weight (net force up, accelerates up)
- Constant speed: Cable force = Weight (net force = 0, no acceleration)
- Going down: Cable force < Weight (net force down, accelerates down)

## Page 7: Newton's Third Law - Action-Reaction

**Statement:**
"For every action, there is an equal and opposite reaction."

**Important Points:**

**1. Forces Come in Pairs**
You can't have one force alone - always comes with a partner!

**2. Equal Magnitude**
Action and reaction forces have the same strength

**3. Opposite Direction**
If action is right, reaction is left

**4. Different Objects**
Action and reaction act on DIFFERENT objects (this is key!)

## Page 8: Action-Reaction Examples

**1. Walking**
- Action: Your foot pushes backward on ground
- Reaction: Ground pushes forward on your foot
- Result: You move forward!

Why you slip on ice:
- Ice is slippery (low friction)
- Ground can't push back effectively
- You can't walk well!

**2. Swimming**
- Action: You push water backward
- Reaction: Water pushes you forward
- Result: You move through water!

**3. Rocket Propulsion**
- Action: Rocket pushes gas downward (exhaust)
- Reaction: Gas pushes rocket upward
- Result: Rocket goes up!

This works in space (no air needed) because the reaction is from the gas, not from pushing against air!

**4. Jumping**
- Action: You push down on ground
- Reaction: Ground pushes up on you
- Result: You go up!

Can't jump high on soft sand because sand compresses instead of pushing back hard.

## Page 9: Why Don't Action-Reaction Cancel?

**Common confusion:** "If forces are equal and opposite, why does anything move?"

**Answer:** They act on DIFFERENT objects!

**Example: You push a wall**
- Action: You push wall (force on wall)
- Reaction: Wall pushes you (force on you)
- Wall doesn't move (attached to ground, too much mass)
- You might move backward (less mass)

**Example: Gun recoil**
- Action: Gun pushes bullet forward (force on bullet)
- Reaction: Bullet pushes gun backward (force on gun)
- Bullet: Small mass, huge acceleration forward
- Gun: Large mass, small acceleration backward
- Both experience same force, different accelerations!

## Page 10: Combining All Three Laws

**Example: Car Crash**

**Before Crash:**
- Law 1: Car moving at constant velocity (no net force)
- Law 2: Engine force = friction + air resistance (balanced)

**During Crash:**
- Law 1: Passengers want to keep moving (inertia)
- Law 2: Wall exerts huge force, causing huge deceleration (F = ma)
- Law 3: Car pushes wall, wall pushes car (equal and opposite)

**Safety Features:**
- Seatbelts: Provide force to stop passengers (Law 2)
- Airbags: Increase stopping time, reducing force (F = ma, smaller a = smaller F)
- Crumple zones: Increase stopping distance, reducing acceleration

## Practice Problems

**Problem 1:** A 10 kg box is pushed with 50 N force. Friction is 20 N. What's the acceleration?
**Answer:** Net force = 50 - 20 = 30 N. a = F/m = 30/10 = 3 m/s²

**Problem 2:** What force is needed to accelerate a 1000 kg car at 2 m/s²?
**Answer:** F = ma = 1000 × 2 = 2000 N

**Problem 3:** You push a wall with 100 N. How hard does the wall push back?
**Answer:** 100 N (Law 3 - equal and opposite)

**Problem 4:** A 50 kg person stands on a scale in an elevator accelerating upward at 2 m/s². What does the scale read?
**Answer:** F = m(g + a) = 50(9.8 + 2) = 590 N`,


  'Energy': `## ENERGY - The Ability to Do Work

Energy is the ability to cause change or do work. It's one of the most fundamental concepts in physics - everything that happens involves energy transfer or transformation!

**Key Principle:** Energy cannot be created or destroyed, only transformed from one form to another (Law of Conservation of Energy)

## Page 1: Kinetic Energy - Energy of Motion

Any moving object has kinetic energy.

**Formula:** KE = ½mv²

Where:
- m = mass (kg)
- v = velocity (m/s)
- KE = kinetic energy (Joules)

**Why v² Matters:**
The velocity is SQUARED, which means:
- 2× faster = 4× more energy
- 3× faster = 9× more energy
- 10× faster = 100× more energy!

This is why high-speed crashes are so much more dangerous!

**Examples:**
- Moving car: Has KE, can do damage in crash
- Flying bullet: Small mass but huge velocity = lots of KE
- Rolling ball: Has KE, can knock over pins
- Wind: Moving air has KE, can turn turbines

**Example Calculation:**
Car: mass = 1000 kg, velocity = 20 m/s
KE = ½ × 1000 × 20² = ½ × 1000 × 400 = 200,000 J

Same car at 40 m/s (2× faster):
KE = ½ × 1000 × 40² = ½ × 1000 × 1600 = 800,000 J (4× more energy!)

## Page 2: Potential Energy - Stored Energy

Energy stored due to position or configuration.

**Gravitational Potential Energy**

Formula: PE = mgh

Where:
- m = mass (kg)
- g = gravity (9.8 m/s²)
- h = height (m)
- PE = potential energy (Joules)

**Examples:**
- Book on shelf: Has PE, can fall and do work
- Water behind dam: Has PE, can flow and generate electricity
- Raised hammer: Has PE, can drive nail when dropped
- Skier at top of hill: Has PE, converts to KE going down

**Example Calculation:**
10 kg object at 5 m height:
PE = 10 × 9.8 × 5 = 490 J

**Elastic Potential Energy**

Stored in stretched or compressed objects.

Formula: PE = ½kx²

Where:
- k = spring constant (stiffness)
- x = displacement from rest position

**Examples:**
- Stretched rubber band: Has PE, can shoot projectile
- Compressed spring: Has PE, can push objects
- Drawn bow: Has PE, can launch arrow
- Trampoline: Stores PE when compressed, releases when bouncing

## Page 3: Other Forms of Energy

**Chemical Potential Energy**
Stored in chemical bonds.

Examples:
- Food: Your body breaks bonds to release energy
- Gasoline: Combustion releases energy to power cars
- Batteries: Chemical reactions produce electrical energy
- Wood: Burning releases stored solar energy

**Nuclear Potential Energy**
Stored in atomic nuclei.

Examples:
- Nuclear power plants: Fission releases energy
- Sun: Fusion releases enormous energy
- Atomic bombs: Uncontrolled release of nuclear energy

**Thermal Energy (Heat)**
Energy from random motion of particles.

Key Points:
- Temperature measures average kinetic energy of particles
- Heat flows from hot to cold
- Can't be 100% converted to work (2nd Law of Thermodynamics)

**Electrical Energy**
Energy from moving electric charges.

Examples:
- Lightning: Huge electrical discharge
- Power lines: Transmit electrical energy
- Batteries: Store and release electrical energy

## Page 4: Law of Conservation of Energy

**Statement:** Energy cannot be created or destroyed, only transformed from one form to another.

**Total Energy = Constant**

This is one of the most important laws in physics!

**Roller Coaster Example:**
- Top of hill: Maximum PE, minimum KE
- Bottom of hill: Minimum PE, maximum KE
- Total energy stays constant (ignoring friction)

At top: PE = 100%, KE = 0%
Halfway down: PE = 50%, KE = 50%
At bottom: PE = 0%, KE = 100%

**Pendulum Example:**
- Highest point: All PE
- Lowest point: All KE
- Swings back and forth, converting PE ↔ KE

## Page 5: Energy Transformations

**1. Hydroelectric Dam**
- Water at top: PE (gravitational)
- Water falls: PE → KE
- Turbine spins: KE → Rotational KE
- Generator: Rotational KE → Electrical energy
- Your home: Electrical → Light, heat, etc.

**2. Photosynthesis**
- Light energy → Chemical energy (glucose)
- Plants store solar energy in chemical bonds
- Animals eat plants → Chemical energy transferred

**3. Car Engine**
- Chemical energy (gasoline) → Thermal energy (combustion)
- Thermal energy → Kinetic energy (pistons move)
- Kinetic energy → Rotational energy (wheels turn)
- Some energy → Heat (wasted, engine gets hot)

**4. Light Bulb**
- Electrical energy → Light energy + Heat energy
- Incandescent: 5% light, 95% heat (inefficient!)
- LED: 20% light, 80% heat (more efficient)

## Page 6: Work and Energy

Work is the transfer of energy by a force.

**Formula:** W = Fd cos(θ)

Where:
- F = force (N)
- d = distance (m)
- θ = angle between force and motion
- W = work (Joules)

**Simple case (force parallel to motion):** W = Fd

**Key Points:**
- Work transfers energy
- Positive work: Energy added to object
- Negative work: Energy removed from object
- No motion = No work (even if you're tired!)

**Examples:**

**1. Lifting a Box**
- You do work against gravity
- Your chemical energy → Box's PE
- W = mgh

**2. Pushing a Car**
- You do work on car
- Your chemical energy → Car's KE
- W = Fd

**3. Friction**
- Does negative work (opposes motion)
- Removes KE from object
- Converts to thermal energy (heat)

## Page 7: Power - Rate of Energy Transfer

Power is how fast energy is transferred or work is done.

**Formula:** P = W/t or P = E/t

Where:
- P = power (Watts)
- W = work (Joules)
- E = energy (Joules)
- t = time (seconds)

**Unit:** 1 Watt = 1 Joule/second

**Examples:**
- 100 W light bulb: Uses 100 J every second
- 1000 W microwave: Uses 1000 J every second
- Car engine: 100,000 W (100 kW) or more
- Human body: About 100 W at rest

**Horsepower:**
1 horsepower = 746 Watts
Car with 200 hp = 149,200 W = 149.2 kW

## Page 8: Efficiency

No energy transformation is 100% efficient - some energy always becomes "waste" heat.

**Formula:** Efficiency = (Useful energy out / Total energy in) × 100%

**Examples:**

**1. Incandescent Light Bulb**
- Energy in: 100 J electrical
- Light out: 5 J
- Heat out: 95 J (wasted)
- Efficiency: 5%

**2. LED Light Bulb**
- Energy in: 20 J electrical
- Light out: 4 J (same brightness!)
- Heat out: 16 J
- Efficiency: 20% (4× better!)

**3. Car Engine**
- Energy in: 100 J chemical (gasoline)
- Motion out: 25 J
- Heat out: 75 J (wasted)
- Efficiency: 25%

**4. Electric Motor**
- Energy in: 100 J electrical
- Motion out: 90 J
- Heat out: 10 J
- Efficiency: 90% (very efficient!)

**5. Human Body**
- Energy in: 100 J chemical (food)
- Motion out: 25 J
- Heat out: 75 J (why you get hot exercising!)
- Efficiency: 25%

## Page 9: Real-World Applications

**1. Renewable Energy**
- Solar panels: Light → Electrical
- Wind turbines: Wind KE → Electrical
- Hydroelectric: Water PE → Electrical
- Geothermal: Earth's heat → Electrical

**2. Energy Storage**
- Batteries: Chemical → Electrical
- Pumped hydro: Electrical → PE (pump water up) → Electrical (let water down)
- Flywheels: Electrical → Rotational KE → Electrical
- Compressed air: Electrical → PE (compressed gas) → Electrical

**3. Transportation**
- Regenerative braking: KE → Electrical (stored in battery)
- Hybrid cars: Use both gasoline and electricity
- Electric cars: Battery → Electrical → KE

**4. Sports**
- Pole vault: Runner's KE → Elastic PE (bent pole) → Gravitational PE (height)
- Archery: Chemical (muscles) → Elastic PE (bow) → KE (arrow)
- Diving: PE (platform) → KE (falling) → KE (water splash)

## Page 10: Practice Problems

**Problem 1:** A 2 kg ball is thrown at 10 m/s. What's its kinetic energy?
**Answer:** KE = ½mv² = ½ × 2 × 10² = ½ × 2 × 100 = 100 J

**Problem 2:** A 5 kg book is on a 2 m high shelf. What's its potential energy?
**Answer:** PE = mgh = 5 × 9.8 × 2 = 98 J

**Problem 3:** A 1000 W microwave runs for 2 minutes. How much energy does it use?
**Answer:** E = Pt = 1000 × 120 = 120,000 J = 120 kJ

**Problem 4:** You push a box with 50 N force for 3 meters. How much work?
**Answer:** W = Fd = 50 × 3 = 150 J

**Problem 5:** A 60 kg person climbs 10 m stairs. How much work against gravity?
**Answer:** W = mgh = 60 × 9.8 × 10 = 5,880 J`,


  'Electricity': `## ELECTRICITY - Flow of Electric Charge

Electricity is the flow of tiny particles called electrons through wires. Think of it like water flowing through pipes!

## Page 1: The Three Key Concepts

**1. Voltage (V) - The Push**
Voltage is the electrical "pressure" that pushes electrons through a wire.

- Like water pressure in a pipe
- Measured in Volts (V)
- Higher voltage = stronger push

Examples:
- Phone charger: 5 volts
- Wall outlet: 120 volts (US) or 230 volts (Europe)
- Car battery: 12 volts
- Power lines: Thousands of volts!

**2. Current (I) - The Flow**
Current is how many electrons flow past a point per second.

- Like how much water flows through a pipe
- Measured in Amperes or Amps (A)
- More current = more electrons flowing

Examples:
- LED light: 0.02 amps
- Phone charging: 1-2 amps
- Microwave: 10-15 amps
- Lightning bolt: 30,000 amps!

**3. Resistance (R) - The Obstacle**
Resistance is what slows down the flow of electrons.

- Like friction in a pipe
- Measured in Ohms (Ω)
- More resistance = less current flows

Examples:
- Thin wire: High resistance (gets hot!)
- Thick wire: Low resistance (stays cool)
- Insulators: Very high resistance (rubber, plastic)
- Conductors: Low resistance (copper, silver)

## Page 2: Ohm's Law - The Magic Formula

**V = I × R**
(Voltage = Current × Resistance)

This is the most important equation in electricity!

**What it means:**
- If you know any two values, you can find the third
- Voltage and current are directly related
- Voltage and resistance are directly related
- Current and resistance are inversely related

**Example 1:**
Battery: 12 volts, Resistance: 4 ohms
Current = V / R = 12 / 4 = 3 amps

**Example 2:**
Current: 2 amps, Resistance: 6 ohms
Voltage = I × R = 2 × 6 = 12 volts

**Example 3:**
Voltage: 120 volts, Current: 10 amps
Resistance = V / I = 120 / 10 = 12 ohms

**Rearranging Ohm's Law:**
- V = I × R (voltage)
- I = V / R (current)
- R = V / I (resistance)

## Page 3: Series vs Parallel Circuits

**Series Circuit:**
Components connected in a single path (one after another).

Characteristics:
- Same current flows through all components
- Voltage divides among components
- If one breaks, all stop working
- Total resistance = R1 + R2 + R3...

Example: Old Christmas lights
- One bulb burns out → all lights go out
- Current has only one path

**Parallel Circuit:**
Components connected in multiple paths (side by side).

Characteristics:
- Same voltage across all components
- Current divides among paths
- If one breaks, others keep working
- Total resistance = 1/(1/R1 + 1/R2 + 1/R3...)

Example: House outlets
- One device breaks → others still work
- Current has multiple paths

## Page 4: Electrical Power

Power is the rate at which electrical energy is used or produced.

**Formula:** P = V × I

Where:
- P = power (Watts)
- V = voltage (Volts)
- I = current (Amps)

**Other formulas (using Ohm's Law):**
- P = I²R
- P = V²/R

**Examples:**

**1. Light Bulb**
Voltage: 120 V, Current: 0.5 A
Power = 120 × 0.5 = 60 W (60 watt bulb)

**2. Phone Charger**
Voltage: 5 V, Current: 2 A
Power = 5 × 2 = 10 W

**3. Microwave**
Voltage: 120 V, Current: 10 A
Power = 120 × 10 = 1200 W = 1.2 kW

**Kilowatt-hours (kWh):**
This is how your electric bill is calculated!
- 1 kWh = using 1000 watts for 1 hour
- Example: 100 W bulb for 10 hours = 1 kWh

## Page 5: Conductors vs Insulators

**Conductors:**
Materials that allow electricity to flow easily.

Examples:
- Metals (copper, silver, gold, aluminum)
- Graphite (carbon)
- Salt water
- Human body (be careful!)

Why they conduct:
- Have free electrons that can move
- Low resistance

**Insulators:**
Materials that resist electricity flow.

Examples:
- Rubber
- Plastic
- Glass
- Wood (when dry)
- Air

Why they insulate:
- Electrons are tightly bound
- Very high resistance

**Semiconductors:**
Materials between conductors and insulators.

Examples:
- Silicon
- Germanium

Uses:
- Computer chips
- Solar panels
- LEDs
- Transistors

## Page 6: AC vs DC

**Direct Current (DC):**
Electrons flow in one direction only.

Sources:
- Batteries
- Solar panels
- USB chargers
- Car electrical system

Symbol: ⎓ (straight line)

**Alternating Current (AC):**
Electrons flow back and forth, changing direction many times per second.

Sources:
- Wall outlets
- Power plants
- Generators

Frequency:
- US: 60 Hz (changes direction 120 times/second)
- Europe: 50 Hz (changes direction 100 times/second)

Symbol: ~ (wavy line)

**Why AC for power lines?**
- Easy to change voltage with transformers
- Less energy lost over long distances
- Easier to generate

## Page 7: Electrical Safety

**Current is what's dangerous, not voltage!**

Dangerous current levels:
- 0.001 A (1 mA): Barely feel it
- 0.005 A (5 mA): Painful shock
- 0.01 A (10 mA): Can't let go
- 0.1 A (100 mA): Can be fatal!
- 1 A and above: Usually fatal

**Safety Rules:**
1. Never touch electrical wires with wet hands
2. Don't overload outlets
3. Use circuit breakers and fuses
4. Ground electrical devices
5. Keep water away from electricity
6. Don't use damaged cords

**Why is water dangerous?**
- Pure water is an insulator
- But tap water has minerals (conductors!)
- Your body is mostly water with minerals
- Electricity flows through you easily

**Circuit Breakers:**
- Automatically cut power if current too high
- Prevent fires and shocks
- Can be reset after problem is fixed

## Page 8: Real-World Applications

**1. Household Wiring**
- Parallel circuits (devices work independently)
- Circuit breakers protect each circuit
- Ground wire for safety
- 120V outlets for most devices
- 240V outlets for heavy appliances (dryer, oven)

**2. Electronics**
- Smartphones: Complex circuits with billions of components
- Computers: Use DC power (converted from AC)
- TVs: Mix of AC and DC circuits

**3. Electric Vehicles**
- Large battery pack (DC)
- Electric motor (converts to motion)
- Regenerative braking (converts motion back to electricity)

**4. Power Grid**
- Power plants generate AC
- Transformers step up voltage for transmission
- Transformers step down voltage for homes
- Distribution to millions of homes

## Page 9: Common Electrical Devices

**Resistor:**
- Limits current flow
- Converts electrical energy to heat
- Used in almost every circuit

**Capacitor:**
- Stores electrical energy temporarily
- Like a tiny rechargeable battery
- Used in camera flashes, power supplies

**Inductor:**
- Stores energy in magnetic field
- Resists changes in current
- Used in transformers, motors

**Diode:**
- Allows current in one direction only
- Used to convert AC to DC
- LEDs are special diodes that emit light

**Transistor:**
- Acts as a switch or amplifier
- Billions in every computer chip
- Foundation of modern electronics

## Page 10: Practice Problems

**Problem 1:** A circuit has 12V battery and 4Ω resistor. What's the current?
**Answer:** I = V/R = 12/4 = 3 A

**Problem 2:** A device uses 5A at 120V. What's the power?
**Answer:** P = V × I = 120 × 5 = 600 W

**Problem 3:** A 60W light bulb runs for 5 hours. How much energy?
**Answer:** E = P × t = 60 × 5 = 300 Wh = 0.3 kWh

**Problem 4:** Three 6Ω resistors in series. Total resistance?
**Answer:** R_total = 6 + 6 + 6 = 18 Ω

**Problem 5:** Is 0.05A (50mA) dangerous?
**Answer:** Yes! Above 10mA can cause muscle contractions and inability to let go.`,


  'Waves': `## WAVES - Energy Transfer Through Space

Waves transfer energy without moving the actual material. Sound, light, ocean waves - they're all waves carrying energy!

## Page 1: What Are Waves?

A wave is a disturbance that transfers energy from one place to another without transferring matter.

**Key Point:** The wave moves, but the stuff just wiggles!

**Example: Ocean Wave**
- Wave travels across ocean
- Water molecules just move up and down
- Energy travels, but water stays in same general area

**What Waves Carry:**
- Energy (always!)
- Information (sound, light, radio)
- Momentum (can push things)

**What Waves DON'T Carry:**
- Matter (stuff doesn't travel with wave)

## Page 2: Two Types of Waves

**1. Transverse Waves (Up & Down)**
Particles move perpendicular to wave direction.

Wave goes → but stuff moves ↑↓

Examples:
- Light waves
- Water waves (mostly)
- Waves on a string
- Electromagnetic waves

Visualize: Shaking a rope - wave travels along rope, but rope moves up and down

**2. Longitudinal Waves (Push & Pull)**
Particles move parallel to wave direction.

Wave goes → and stuff moves ←→

Examples:
- Sound waves
- Earthquake P-waves
- Compression waves in a spring

Visualize: Pushing a slinky - compressions and expansions travel along

**Some waves are both!**
Ocean waves have both transverse and longitudinal motion (water moves in circles)

## Page 3: Wave Properties

**1. Wavelength (λ - lambda)**
Distance between two consecutive peaks (or troughs)
- Measured in meters
- Symbol: λ
- Longer wavelength = lower frequency

**2. Frequency (f)**
Number of waves passing a point per second
- Measured in Hertz (Hz)
- 1 Hz = 1 wave per second
- Higher frequency = more waves per second

**3. Amplitude**
Height of wave from rest position to peak
- Bigger amplitude = more energy
- Determines loudness (sound) or brightness (light)

**4. Speed (v)**
How fast the wave travels
- Formula: v = f × λ
- Speed = Frequency × Wavelength

**5. Period (T)**
Time for one complete wave to pass
- T = 1/f
- Measured in seconds

## Page 4: The Wave Equation

**v = f × λ**
(Speed = Frequency × Wavelength)

This is the most important wave equation!

**What it means:**
- If frequency goes up, wavelength goes down (for constant speed)
- If wavelength goes up, frequency goes down
- Speed depends on the medium (what it's traveling through)

**Example 1:**
Sound wave: frequency = 440 Hz, speed = 340 m/s
Wavelength = v/f = 340/440 = 0.77 m

**Example 2:**
Light wave: wavelength = 500 nm, speed = 3×10⁸ m/s
Frequency = v/λ = (3×10⁸)/(500×10⁻⁹) = 6×10¹⁴ Hz

**Example 3:**
Water wave: wavelength = 2 m, frequency = 0.5 Hz
Speed = f × λ = 0.5 × 2 = 1 m/s

## Page 5: The Electromagnetic Spectrum

All electromagnetic waves travel at light speed: 300,000,000 m/s (3×10⁸ m/s)

From longest to shortest wavelength:

**1. Radio Waves**
- Wavelength: meters to kilometers
- Uses: Radio, TV, WiFi, cell phones
- Lowest energy

**2. Microwaves**
- Wavelength: millimeters to centimeters
- Uses: Microwave ovens, radar, satellites
- Make water molecules vibrate (heat food!)

**3. Infrared**
- Wavelength: micrometers
- Uses: Heat, night vision, TV remotes
- We feel it as heat

**4. Visible Light**
- Wavelength: 400-700 nanometers
- Colors: Red (longest) → Violet (shortest)
- Only part we can see!

**5. Ultraviolet (UV)**
- Wavelength: 10-400 nanometers
- Uses: Sterilization, black lights
- Causes sunburn!

**6. X-rays**
- Wavelength: 0.01-10 nanometers
- Uses: Medical imaging, airport security
- Can penetrate soft tissue

**7. Gamma Rays**
- Wavelength: less than 0.01 nanometers
- Sources: Radioactive decay, space
- Most dangerous, highest energy

**Remember:** They're all the same type of wave (electromagnetic), just different wavelengths!

## Page 6: Wave Behaviors

**1. Reflection**
Wave bounces off a surface

Examples:
- Mirror reflects light
- Echo reflects sound
- Radar reflects radio waves

Law of Reflection:
Angle of incidence = Angle of reflection

**2. Refraction**
Wave bends when entering different medium

Examples:
- Straw looks bent in water
- Lenses focus light
- Mirages in desert

Why it happens:
- Wave speed changes in different materials
- Changes direction (except straight on)

**3. Diffraction**
Wave spreads around obstacles or through openings

Examples:
- Hear sound around corners
- Water waves spread through harbor opening
- Radio waves bend around buildings

More diffraction when:
- Wavelength is larger
- Opening is smaller

**4. Interference**
Two waves meet and combine

Constructive Interference:
- Peaks align with peaks
- Waves add up (louder, brighter)

Destructive Interference:
- Peaks align with troughs
- Waves cancel out (quieter, darker)

Examples:
- Noise-canceling headphones (destructive)
- Beats in music (interference pattern)
- Thin film colors (soap bubbles)

## Page 7: Sound Waves

Sound is a longitudinal wave that travels through matter (not through vacuum!).

**Speed of Sound:**
- Air (20°C): 343 m/s
- Water: 1,480 m/s
- Steel: 5,960 m/s
- Vacuum: 0 m/s (no sound in space!)

**Pitch:**
Determined by frequency
- High frequency = high pitch (squeaky)
- Low frequency = low pitch (deep)
- Human hearing: 20 Hz to 20,000 Hz

**Loudness:**
Determined by amplitude
- Measured in decibels (dB)
- 0 dB: Threshold of hearing
- 60 dB: Normal conversation
- 120 dB: Pain threshold
- 140 dB: Damage to ears

**Doppler Effect:**
Frequency changes when source or observer moves
- Approaching: Higher pitch (ambulance coming)
- Receding: Lower pitch (ambulance leaving)

## Page 8: Light Waves

Light is an electromagnetic wave (transverse).

**Speed of Light:**
c = 3 × 10⁸ m/s (in vacuum)
- Fastest thing in universe!
- Slower in materials (water, glass)

**Colors:**
Different wavelengths of visible light
- Red: ~700 nm (longest, lowest frequency)
- Orange: ~600 nm
- Yellow: ~580 nm
- Green: ~550 nm
- Blue: ~450 nm
- Violet: ~400 nm (shortest, highest frequency)

**White Light:**
Mixture of all colors
- Prism separates into rainbow
- Each color refracts differently

**Why Sky is Blue:**
- Light scatters off air molecules
- Blue light scatters more (shorter wavelength)
- We see blue from all directions

**Why Sunsets are Red:**
- Light travels through more atmosphere
- Blue light scattered away
- Red light makes it through

## Page 9: Real-World Applications

**1. Medical**
- Ultrasound: High-frequency sound waves see inside body
- X-rays: See bones and dense tissue
- MRI: Uses radio waves and magnets
- Laser surgery: Focused light cuts precisely

**2. Communication**
- Radio: AM/FM broadcasts
- TV: Transmits picture and sound
- Cell phones: Microwaves carry signals
- WiFi: Radio waves for internet
- Fiber optics: Light through glass cables

**3. Technology**
- Microwave oven: Heats food with microwaves
- Remote control: Infrared signals
- Radar: Detects planes, weather, speed
- Sonar: Sound waves map ocean floor

**4. Entertainment**
- Music: Sound waves create melodies
- Movies: Light and sound combined
- Holograms: Interference patterns of light

## Page 10: Practice Problems

**Problem 1:** A wave has frequency 50 Hz and wavelength 4 m. What's its speed?
**Answer:** v = f × λ = 50 × 4 = 200 m/s

**Problem 2:** Light has wavelength 600 nm. What's its frequency? (c = 3×10⁸ m/s)
**Answer:** f = c/λ = (3×10⁸)/(600×10⁻⁹) = 5×10¹⁴ Hz

**Problem 3:** Sound travels 1,020 m in 3 seconds. What's the speed?
**Answer:** v = distance/time = 1020/3 = 340 m/s

**Problem 4:** A wave has period 0.02 seconds. What's its frequency?
**Answer:** f = 1/T = 1/0.02 = 50 Hz

**Problem 5:** Which has more energy: red light or blue light?
**Answer:** Blue light (shorter wavelength = higher frequency = more energy)`,


  'Waves': `## WAVES - Energy Transfer Through Space

Waves transfer energy without moving the actual material. Sound, light, ocean waves - they're all waves!

## Page 1: What Are Waves?

A wave is a disturbance that transfers energy from one place to another without transferring matter.

**Key Concept:** The wave moves, but the material just oscillates (moves back and forth) in place!

**Example: Ocean Wave**
- Wave travels across ocean
- Water molecules just move up and down
- Energy travels, but water stays in roughly same place

**Example: Stadium Wave**
- Wave travels around stadium
- People just stand up and sit down
- People don't actually move around the stadium!

**What Waves Carry:**
- Energy (always)
- Information (sometimes)
- Momentum (sometimes)
- NOT matter!

## Page 2: Types of Waves

**1. Transverse Waves**
Particles move perpendicular (up and down) to wave direction.

Examples:
- Light waves
- Water waves (mostly)
- Waves on a string
- Electromagnetic waves

Visualization: Shake a rope up and down - wave travels horizontally, rope moves vertically

**2. Longitudinal Waves**
Particles move parallel (back and forth) to wave direction.

Examples:
- Sound waves
- Earthquake P-waves
- Compression waves in a spring

Visualization: Push and pull a slinky - compressions and expansions travel along

**3. Surface Waves**
Combination of transverse and longitudinal.

Examples:
- Ocean waves (water moves in circles)
- Earthquake surface waves

## Page 3: Wave Properties

**Wavelength (λ - lambda):**
Distance between two consecutive peaks (or troughs)
- Measured in meters
- Symbol: λ

**Frequency (f):**
Number of waves passing a point per second
- Measured in Hertz (Hz)
- 1 Hz = 1 wave per second
- Higher frequency = more waves per second

**Amplitude:**
Maximum displacement from rest position
- Height of wave from middle to peak
- Bigger amplitude = more energy
- Determines loudness (sound) or brightness (light)

**Period (T):**
Time for one complete wave to pass
- Measured in seconds
- T = 1/f

**Speed (v):**
How fast the wave travels
- Measured in m/s

## Page 4: The Wave Equation

**v = f × λ**
(Speed = Frequency × Wavelength)

This is the fundamental wave equation!

**What it means:**
- If frequency increases, wavelength decreases (for constant speed)
- If wavelength increases, frequency decreases
- Speed depends on the medium

**Example 1:**
Sound wave: f = 440 Hz, λ = 0.78 m
Speed = 440 × 0.78 = 343 m/s (speed of sound in air!)

**Example 2:**
Light wave: f = 5 × 10¹⁴ Hz, v = 3 × 10⁸ m/s
Wavelength = v/f = (3 × 10⁸)/(5 × 10¹⁴) = 6 × 10⁻⁷ m = 600 nm (orange light!)

**Example 3:**
Radio wave: λ = 3 m, v = 3 × 10⁸ m/s
Frequency = v/λ = (3 × 10⁸)/3 = 100 MHz (FM radio!)

## Page 5: The Electromagnetic Spectrum

All electromagnetic waves travel at the speed of light: c = 3 × 10⁸ m/s (300,000,000 m/s!)

**From longest to shortest wavelength:**

**1. Radio Waves**
- Wavelength: > 1 meter
- Uses: Radio, TV, WiFi, cell phones
- Lowest energy, safest

**2. Microwaves**
- Wavelength: 1 mm to 1 m
- Uses: Microwave ovens, radar, satellite communication
- Make water molecules vibrate = heat

**3. Infrared (IR)**
- Wavelength: 700 nm to 1 mm
- Uses: Heat, night vision, TV remotes
- We feel it as heat

**4. Visible Light**
- Wavelength: 400-700 nm
- Colors: Red (longest) → Orange → Yellow → Green → Blue → Violet (shortest)
- Only part we can see!

**5. Ultraviolet (UV)**
- Wavelength: 10-400 nm
- Uses: Sterilization, black lights, vitamin D production
- Causes sunburn and skin cancer

**6. X-rays**
- Wavelength: 0.01-10 nm
- Uses: Medical imaging, airport security
- Can penetrate soft tissue, stopped by bones

**7. Gamma Rays**
- Wavelength: < 0.01 nm
- Sources: Radioactive decay, nuclear reactions, space
- Most dangerous, highest energy
- Used in cancer treatment

**Key Point:** They're all the same type of wave (electromagnetic), just different wavelengths!

## Page 6: Wave Behaviors

**1. Reflection**
Wave bounces off a surface.

Examples:
- Mirror reflects light
- Echo is reflected sound
- Radar bounces off objects

Law of Reflection: Angle in = Angle out

**2. Refraction**
Wave bends when entering a different medium.

Examples:
- Straw looks bent in water
- Lenses focus light
- Mirages in desert

Why it happens: Wave speed changes in different materials

**3. Diffraction**
Wave spreads out when passing through an opening or around an obstacle.

Examples:
- Hear sound around corners
- Light spreads through small holes
- Water waves spread through harbor entrance

Smaller opening = more diffraction

**4. Interference**
Two waves meet and combine.

**Constructive Interference:**
- Waves add together
- Peak + Peak = Bigger peak
- Makes louder sound or brighter light

**Destructive Interference:**
- Waves cancel out
- Peak + Trough = Flat
- Makes quieter sound or darker light
- Used in noise-canceling headphones!

## Page 7: Sound Waves

Sound is a longitudinal wave that travels through matter (not through vacuum!).

**Speed of Sound:**
- In air (20°C): 343 m/s
- In water: 1,480 m/s
- In steel: 5,960 m/s
- Faster in denser materials!

**Pitch:**
Determined by frequency
- High frequency = High pitch (squeaky)
- Low frequency = Low pitch (deep)
- Human hearing: 20 Hz to 20,000 Hz

**Loudness:**
Determined by amplitude
- Measured in decibels (dB)
- 0 dB: Threshold of hearing
- 60 dB: Normal conversation
- 120 dB: Pain threshold
- 140 dB: Damage to ears

**Doppler Effect:**
Frequency changes when source or observer moves.

Examples:
- Ambulance siren sounds higher when approaching
- Sounds lower when moving away
- Used in radar speed guns
- Used to detect moving stars

## Page 8: Light Waves

Light is an electromagnetic wave that can travel through vacuum!

**Speed of Light:**
c = 3 × 10⁸ m/s (fastest speed possible in universe!)

**Properties:**
- Transverse wave
- Doesn't need a medium
- Can be reflected, refracted, diffracted
- Shows wave-particle duality (acts like both wave and particle!)

**Color:**
Determined by wavelength/frequency
- Red: ~700 nm (longest visible)
- Violet: ~400 nm (shortest visible)
- White light: Mix of all colors

**Dispersion:**
White light splits into colors (rainbow)
- Different wavelengths refract differently
- Prism separates colors
- Rainbows form from water droplets

## Page 9: Real-World Applications

**1. Communication**
- Radio/TV: Use radio waves
- WiFi: Uses microwaves
- Fiber optics: Uses light waves
- Cell phones: Use microwaves

**2. Medical**
- X-rays: See bones
- Ultrasound: See inside body (sound waves)
- MRI: Uses radio waves
- Laser surgery: Uses focused light

**3. Technology**
- Microwave oven: Heats food with microwaves
- Remote controls: Use infrared
- Solar panels: Convert light to electricity
- Radar: Uses radio waves to detect objects

**4. Music**
- Instruments create sound waves
- Speakers vibrate to make sound
- Noise-canceling: Uses destructive interference
- Acoustics: Design rooms for good sound

**5. Astronomy**
- Telescopes: Collect light from space
- Radio telescopes: Detect radio waves from space
- Spectroscopy: Analyze light to learn about stars
- Doppler shift: Measure star movement

## Page 10: Practice Problems

**Problem 1:** A wave has frequency 50 Hz and wavelength 2 m. What's its speed?
**Answer:** v = f × λ = 50 × 2 = 100 m/s

**Problem 2:** Light travels at 3 × 10⁸ m/s with wavelength 500 nm. What's the frequency?
**Answer:** f = v/λ = (3 × 10⁸)/(500 × 10⁻⁹) = 6 × 10¹⁴ Hz

**Problem 3:** A sound wave travels 1,029 m in 3 seconds. What's its speed?
**Answer:** v = distance/time = 1029/3 = 343 m/s (speed of sound!)

**Problem 4:** If frequency doubles, what happens to wavelength (constant speed)?
**Answer:** Wavelength is cut in half (v = f × λ, so if f doubles, λ must halve)

**Problem 5:** Why can't sound travel through space?
**Answer:** Sound needs a medium (matter) to travel through. Space is a vacuum (no matter)!`,

  'Modern Physics': `## MODERN PHYSICS - The Extreme Universe

Modern Physics is the study of the universe at extreme scales - super tiny (atoms) and super fast (near light speed)!

## Page 1: Introduction to Modern Physics

**Classical Physics (Newton, etc.):**
- Works great for everyday objects
- Breaks down at extreme scales
- Can't explain atoms, light, or high speeds

**Modern Physics (Einstein, etc.):**
- Explains the very small (quantum mechanics)
- Explains the very fast (relativity)
- Revolutionized our understanding of reality

**Two Main Branches:**
1. Relativity (Einstein) - Space, time, gravity
2. Quantum Mechanics - Atoms, particles, probability

## Page 2: Special Relativity - Part 1

**Einstein's Big Ideas (1905):**

**1. Speed of Light is Constant**
Light always travels at c = 3 × 10⁸ m/s, no matter what!
- Same speed for everyone
- Nothing can go faster
- This leads to weird consequences...

**2. Time Dilation**
Time slows down as you go faster!

Formula: t' = t / √(1 - v²/c²)

Where:
- t = time for stationary observer
- t' = time for moving observer
- v = velocity
- c = speed of light

**Example:**
Travel at 90% light speed for 1 year (your time):
- People on Earth age 2.3 years!
- Time literally slows down for you
- This is real, not an illusion!

**Proof:**
- GPS satellites experience time dilation
- Without corrections, GPS would be off by miles!
- Atomic clocks on planes run slower

## Page 3: Special Relativity - Part 2

**3. Length Contraction**
Objects shrink in the direction of motion as they go faster!

Formula: L' = L × √(1 - v²/c²)

**Example:**
Spaceship 100 m long traveling at 90% light speed:
- Appears only 44 m long to stationary observer!
- Inside the ship, everything seems normal

**4. Mass-Energy Equivalence**

**E = mc²**

The most famous equation in physics!

**What it means:**
- Mass and energy are the same thing
- Tiny mass = Huge energy (c² is enormous!)
- Mass can convert to energy and vice versa

**Example:**
1 kg of matter = 9 × 10¹⁶ J of energy
- Enough to power a city for months!
- Nuclear bombs and reactors use this

**Applications:**
- Nuclear power plants
- Atomic bombs
- How the Sun produces energy
- PET scans in medicine

## Page 4: General Relativity

**Einstein's Theory of Gravity (1915):**

**Key Idea:** Gravity isn't a force - it's curved space-time!

**What this means:**
- Massive objects bend space and time
- Objects follow curved paths in bent space
- We're not "pulled" down - we're following curved space!

**Visualize:**
- Imagine a bowling ball on a trampoline
- It creates a dip (curves the surface)
- Marble rolls toward it (not because of "pull", but because surface is curved)

**Predictions:**
1. Light bends near massive objects (proven!)
2. Time runs slower near massive objects (proven!)
3. Gravitational waves exist (detected 2015!)
4. Black holes exist (photographed 2019!)

**Black Holes:**
- Space curves infinitely
- Nothing can escape, not even light
- Time stops at the event horizon
- Not actually "holes" - super dense objects

## Page 5: Quantum Mechanics - Introduction

**The Physics of the Very Small**

At atomic scales, reality is WEIRD:
- Particles are also waves
- Can't know position AND speed perfectly
- Particles exist in multiple states at once
- Observation changes reality

**Why Classical Physics Fails:**
- Atoms should collapse (they don't!)
- Light should be continuous (it's not!)
- Electrons should radiate energy (they don't!)

**Quantum mechanics explains:**
- How atoms work
- Why elements have specific properties
- How chemistry works
- How electronics work

## Page 6: Wave-Particle Duality

**Light is BOTH a wave AND a particle!**

**Evidence for Wave:**
- Interference patterns
- Diffraction
- Polarization

**Evidence for Particle:**
- Photoelectric effect
- Comes in discrete packets (photons)
- E = hf (energy of one photon)

**But wait, there's more:**
**Matter is ALSO both wave and particle!**

**De Broglie Wavelength:**
λ = h/p (wavelength = Planck's constant / momentum)

**What this means:**
- Electrons show interference patterns
- Everything has a wave nature
- Usually too small to notice for big objects

**Example:**
- Electron: Wavelength ~ 10⁻¹⁰ m (noticeable!)
- Baseball: Wavelength ~ 10⁻³⁴ m (way too small to detect)

## Page 7: Heisenberg Uncertainty Principle

**You can't know both position AND momentum perfectly!**

**Formula:** Δx × Δp ≥ h/4π

Where:
- Δx = uncertainty in position
- Δp = uncertainty in momentum
- h = Planck's constant

**What this means:**
- The more you know position, the less you know momentum
- The more you know momentum, the less you know position
- This isn't a measurement problem - it's how nature works!

**Example:**
- Electron in atom: Know position well → momentum very uncertain
- Electron in beam: Know momentum well → position very uncertain

**Consequences:**
- Electrons can't fall into nucleus (would violate uncertainty!)
- Quantum tunneling is possible
- Virtual particles can pop into existence

## Page 8: Quantum Superposition

**Particles exist in multiple states at once until observed!**

**Schrödinger's Cat (Thought Experiment):**
- Cat in box with poison
- Poison triggered by quantum event
- Before opening box: Cat is BOTH alive AND dead!
- Opening box forces cat into one state

**Real Examples:**
- Electron spin: Both up AND down until measured
- Photon polarization: Both horizontal AND vertical until measured
- Quantum computers use superposition for calculations

**Quantum Entanglement:**
- Two particles connected instantly across any distance
- Measure one → instantly know about the other
- Einstein called it "spooky action at a distance"
- Proven real! Used in quantum communication

## Page 9: Real-World Applications

**1. Nuclear Energy**
- E = mc² explains nuclear power
- Fission: Split heavy atoms → energy
- Fusion: Combine light atoms → energy (powers the Sun!)
- 1 kg uranium = 3 million kg coal

**2. Semiconductors & Electronics**
- Quantum mechanics explains how transistors work
- Computers, phones, all electronics
- Modern world runs on quantum physics!

**3. Lasers**
- Quantum mechanics explains stimulated emission
- Used in: Surgery, communications, measurements, DVD players, barcode scanners

**4. MRI Machines**
- Uses quantum spin of atoms
- Sees inside body without surgery
- Based on nuclear magnetic resonance

**5. GPS**
- Needs relativity corrections!
- Satellites experience time dilation
- Without corrections: Off by miles per day

**6. Solar Panels**
- Photoelectric effect (quantum)
- Light knocks electrons loose
- Converts light directly to electricity

**7. Quantum Computing**
- Uses superposition and entanglement
- Can solve certain problems exponentially faster
- Still in development

## Page 10: Mind-Blowing Facts & Practice

**Amazing Facts:**

1. **Time Travel (Forward):**
- Travel near light speed → time slows for you
- Return to Earth → everyone aged more than you
- You've traveled to the future!

2. **Quantum Tunneling:**
- Particles can pass through barriers they shouldn't!
- Like a ball rolling through a wall
- Makes nuclear fusion in Sun possible

3. **Antimatter:**
- For every particle, there's an opposite
- Positron (anti-electron), antiproton, etc.
- Matter + Antimatter = Pure energy!

4. **Observation Changes Reality:**
- Measuring a particle changes its state
- Not just disturbing it - actually changing it
- Reality is fundamentally probabilistic

**Practice Problems:**

**Problem 1:** How much energy from 0.001 kg of matter?
**Answer:** E = mc² = 0.001 × (3×10⁸)² = 9 × 10¹³ J (90 trillion joules!)

**Problem 2:** What's the energy of a photon with f = 5 × 10¹⁴ Hz? (h = 6.63 × 10⁻³⁴)
**Answer:** E = hf = 6.63 × 10⁻³⁴ × 5 × 10¹⁴ = 3.3 × 10⁻¹⁹ J

**Problem 3:** Why can't we notice quantum effects in daily life?
**Answer:** Quantum effects are significant only at atomic scales. For large objects, wavelengths are too small and uncertainties are negligible.

**Problem 4:** If you travel at 99% light speed for 1 year, how much time passes on Earth?
**Answer:** About 7 years! (Time dilation factor ≈ 7)

**Remember:** Modern physics shows reality is WAY weirder than it seems! Time isn't constant, particles are waves, and observation changes reality!`
};

