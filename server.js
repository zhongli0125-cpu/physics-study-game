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
        'Motion': `MOTION - The Physics of Movement

What is Motion?
Motion is the change in position of an object over time.

Key Concepts:
1. Distance vs Displacement
   - Distance: Total path traveled
   - Displacement: Straight line from start to end

2. Speed vs Velocity  
   - Speed: How fast (just a number)
   - Velocity: Speed + direction (vector)
   - Formula: speed = distance / time

3. Acceleration
   - Rate of change of velocity
   - Formula: a = (v_final - v_initial) / time
   - Unit: m/s²

Important Formulas:
- v = u + at
- s = ut + ½at²
- v² = u² + 2as

Free Fall:
- Gravity accelerates everything at 9.8 m/s²
- All objects fall at same rate (without air resistance)

Real Examples:
- Car speeding up: positive acceleration
- Car braking: negative acceleration (deceleration)
- Throwing ball up: slows down, stops, speeds up coming down

Remember: Velocity = Speed + Direction!`,

        'Newton Laws': `NEWTON'S LAWS OF MOTION

Law 1 - Inertia:
Objects at rest stay at rest, objects in motion stay in motion, unless acted upon by a force.

Example: When car stops suddenly, you jerk forward (your body wants to keep moving).

Law 2 - F = ma:
Force = Mass × Acceleration

What this means:
- More force = more acceleration
- More mass = less acceleration (for same force)
- Heavier things need more force to move

Law 3 - Action-Reaction:
Every action has an equal and opposite reaction.

Examples:
- Walking: You push ground back, ground pushes you forward
- Rocket: Pushes gas down, gas pushes rocket up
- Jumping: You push down, ground pushes you up

Weight vs Mass:
- Mass: Amount of matter (doesn't change)
- Weight: Force of gravity (W = mg)
- Same mass everywhere, different weight on different planets

Remember: All three laws work together!`,

        'Energy': `ENERGY - The Ability to Do Work

Types of Energy:

1. Kinetic Energy (Moving)
   - Formula: KE = ½mv²
   - Anything moving has it
   - Speed matters A LOT (v²)

2. Potential Energy (Stored)
   - Formula: PE = mgh
   - Energy waiting to be used
   - Higher = more potential energy

Law of Conservation:
Energy cannot be created or destroyed, only transformed!

Example: Roller coaster
- Top: Lots of PE, little KE
- Bottom: Lots of KE, little PE
- Total energy stays same

Work and Power:
- Work: W = Force × Distance
- Power: P = Work / Time
- Unit of energy: Joule (J)
- Unit of power: Watt (W)

Real Examples:
- Eating food: Chemical → Your energy
- Phone battery: Chemical → Electrical → Light
- Solar panel: Light → Electrical

Remember: Energy transforms but never disappears!`,

        'Electricity': `ELECTRICITY - Flow of Electric Charge

Three Key Things:

1. Voltage (V) - The Push
   - Like water pressure
   - Measured in Volts
   - Wall outlet: 120V

2. Current (I) - The Flow
   - How many electrons flow
   - Measured in Amps
   - Current is dangerous!

3. Resistance (R) - The Obstacle
   - What slows down flow
   - Measured in Ohms
   - Thin wire: high resistance

Ohm's Law:
V = I × R
(Voltage = Current × Resistance)

Example: 12V ÷ 4Ω = 3A

Two Ways to Connect:
- Series: One breaks, all break (Christmas lights)
- Parallel: One breaks, others work (house outlets)

Power:
P = V × I
Measured in Watts

Safety:
- Current (amps) is what's dangerous
- Even 0.1A can hurt you
- That's why we have circuit breakers

Remember: Think of electricity like water in pipes!`,

        'Waves': `WAVES - Energy Transfer

What are Waves?
Waves transfer energy without moving material.

Two Types:

1. Transverse (Up & Down)
   - Wave goes forward, stuff moves up/down
   - Examples: Light, water waves

2. Longitudinal (Push & Pull)
   - Wave goes forward, stuff moves forward/back
   - Examples: Sound waves

Wave Properties:
- Wavelength (λ): Distance between peaks
- Frequency (f): Waves per second (Hz)
- Amplitude: Height of wave
- Speed (v): How fast wave travels

The Wave Formula:
v = f × λ

Electromagnetic Spectrum (longest to shortest):
1. Radio waves - Radio, TV, WiFi
2. Microwaves - Microwave ovens
3. Infrared - Heat, remotes
4. Visible Light - What we see!
5. Ultraviolet - Sunburn
6. X-rays - See bones
7. Gamma rays - Most dangerous

All travel at light speed: 300,000,000 m/s!

Wave Behaviors:
- Reflection: Bounces off (mirrors, echoes)
- Refraction: Bends (straw in water)
- Diffraction: Spreads around obstacles
- Interference: Waves combine or cancel

Remember: Waves carry energy, not material!`,

        'Modern Physics': `MODERN PHYSICS - The Extreme Universe

Two Big Ideas:

1. Relativity (Einstein)
   - Nothing faster than light
   - Time slows at high speeds
   - E = mc² (mass = energy)
   - Gravity is curved space

2. Quantum Mechanics (Tiny World)
   - Light is both wave AND particle
   - Particles exist in multiple states
   - Can't know position AND speed perfectly
   - Observation changes reality

Key Discoveries:
- Photoelectric Effect: Light is particles
- Wave-Particle Duality: Everything is both
- Uncertainty Principle: Can't know everything
- Quantum Tunneling: Particles pass through barriers

Real Applications:
- Nuclear Energy: E = mc²
- Semiconductors: Quantum mechanics
- Lasers: Stimulated emission
- MRI: Nuclear magnetic resonance
- GPS: Needs relativity corrections!

Mind-Blowing Facts:
- Time isn't constant
- Particles are waves
- Observation changes reality
- Quantum entanglement: instant connection

Famous Equations:
- E = mc² (Mass-energy)
- E = hf (Photon energy)

Remember: Reality is weirder than it seems!`,
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
