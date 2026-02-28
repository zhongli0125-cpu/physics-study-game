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
      // FULLY EXPANDED LESSONS - Research Quality with Detailed Content (## marks new pages)
      const fallbacks = {
  'Motion': `## MOTION - The Physics of Movement

Motion is one of the most fundamental concepts in physics. It describes the change in position of an object over time. From the smallest subatomic particles to the largest galaxies, everything in the universe is in constant motion. Understanding motion is essential for comprehending all other areas of physics, from mechanics to thermodynamics to quantum mechanics.

## Page 1: Introduction to Motion and Reference Frames

**What is Motion?**
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
