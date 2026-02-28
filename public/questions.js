// Question pool - 100+ unique physics questions
const questionPool = [
  // Motion (20 questions) - Easy
  { q: "What is velocity?", opts: ["Speed only", "Speed with direction", "Acceleration"], ans: 1, topic: "Motion", diff: "easy" },
  { q: "What is acceleration?", opts: ["Speed", "Rate of change of velocity", "Distance/time"], ans: 1, topic: "Motion", diff: "easy" },
  { q: "Formula for speed?", opts: ["s = d/t", "s = d*t", "s = t/d"], ans: 0, topic: "Motion", diff: "easy" },
  { q: "What is displacement?", opts: ["Total distance", "Change in position with direction", "Speed"], ans: 1, topic: "Motion", diff: "easy" },
  { q: "Unit of acceleration?", opts: ["m/s", "m/s²", "m"], ans: 1, topic: "Motion", diff: "easy" },
  { q: "What is uniform motion?", opts: ["Constant speed", "Changing speed", "No motion"], ans: 0, topic: "Motion", diff: "medium" },
  { q: "Free fall acceleration?", opts: ["9.8 m/s²", "10 m/s", "5 m/s²", "8 m/s²"], ans: 0, topic: "Motion", diff: "medium" },
  { q: "What is inertia?", opts: ["Force", "Resistance to change in motion", "Speed", "Energy"], ans: 1, topic: "Motion", diff: "medium" },
  { q: "Scalar vs Vector?", opts: ["Same thing", "Scalar has no direction", "Vector has no magnitude", "Both have direction"], ans: 1, topic: "Motion", diff: "medium" },
  { q: "What is momentum?", opts: ["Mass × Velocity", "Mass + Velocity", "Mass / Velocity", "Mass - Velocity"], ans: 0, topic: "Motion", diff: "medium" },
  
  // Newton's Laws (20 questions)
  { q: "Newton's 1st Law?", opts: ["F=ma", "Objects stay in motion unless acted upon", "Action-Reaction"], ans: 1, topic: "Newton", diff: "easy" },
  { q: "Newton's 2nd Law?", opts: ["Inertia", "F=ma", "Action-Reaction"], ans: 1, topic: "Newton", diff: "easy" },
  { q: "Newton's 3rd Law?", opts: ["F=ma", "Inertia", "Action-Reaction pairs"], ans: 2, topic: "Newton", diff: "easy" },
  { q: "What is force?", opts: ["Push or pull", "Speed", "Energy"], ans: 0, topic: "Newton", diff: "easy" },
  { q: "Unit of force?", opts: ["Joule", "Newton", "Watt"], ans: 1, topic: "Newton", diff: "easy" },
  { q: "What is mass?", opts: ["Weight", "Amount of matter", "Force", "Energy"], ans: 1, topic: "Newton", diff: "medium" },
  { q: "Weight formula?", opts: ["W = mg", "W = m/g", "W = m+g", "W = m-g"], ans: 0, topic: "Newton", diff: "medium" },
  { q: "What is friction?", opts: ["Force opposing motion", "Speed", "Energy", "Acceleration"], ans: 0, topic: "Newton", diff: "medium" },
  { q: "Normal force direction?", opts: ["Down", "Perpendicular to surface", "Sideways", "Up"], ans: 1, topic: "Newton", diff: "medium" },
  { q: "Net force = 0 means?", opts: ["No motion", "Constant velocity", "Acceleration", "Deceleration"], ans: 1, topic: "Newton", diff: "medium" },
  
  // Energy (20 questions)
  { q: "Kinetic energy formula?", opts: ["KE = mgh", "KE = ½mv²", "KE = mc²"], ans: 1, topic: "Energy", diff: "easy" },
  { q: "Potential energy formula?", opts: ["PE = ½mv²", "PE = mgh", "PE = mc²"], ans: 1, topic: "Energy", diff: "easy" },
  { q: "Unit of energy?", opts: ["Newton", "Joule", "Watt"], ans: 1, topic: "Energy", diff: "easy" },
  { q: "Law of conservation?", opts: ["Energy is created", "Energy is destroyed", "Energy is conserved"], ans: 2, topic: "Energy", diff: "easy" },
  { q: "What is work?", opts: ["Force × Distance", "Force + Distance", "Force / Distance"], ans: 0, topic: "Energy", diff: "easy" },
  { q: "Power formula?", opts: ["P = W/t", "P = W×t", "P = t/W", "P = W-t"], ans: 0, topic: "Energy", diff: "medium" },
  { q: "Unit of power?", opts: ["Joule", "Newton", "Watt", "Volt"], ans: 2, topic: "Energy", diff: "medium" },
  { q: "Elastic potential energy?", opts: ["In springs", "In height", "In motion", "In heat"], ans: 0, topic: "Energy", diff: "medium" },
  { q: "Thermal energy is?", opts: ["Heat", "Light", "Sound", "Motion"], ans: 0, topic: "Energy", diff: "medium" },
  { q: "Chemical energy example?", opts: ["Battery", "Moving car", "Stretched spring", "Falling object"], ans: 0, topic: "Energy", diff: "medium" },
  
  // Electricity (20 questions)
  { q: "Ohm's Law?", opts: ["V = IR", "V = I/R", "V = I+R"], ans: 0, topic: "Electricity", diff: "easy" },
  { q: "Unit of voltage?", opts: ["Ampere", "Volt", "Ohm"], ans: 1, topic: "Electricity", diff: "easy" },
  { q: "Unit of current?", opts: ["Ampere", "Volt", "Ohm"], ans: 0, topic: "Electricity", diff: "easy" },
  { q: "Unit of resistance?", opts: ["Ampere", "Volt", "Ohm"], ans: 2, topic: "Electricity", diff: "easy" },
  { q: "Series circuit current?", opts: ["Same everywhere", "Divides", "Zero"], ans: 0, topic: "Electricity", diff: "easy" },
  { q: "Parallel circuit voltage?", opts: ["Divides", "Same everywhere", "Zero", "Doubles"], ans: 1, topic: "Electricity", diff: "medium" },
  { q: "Power formula?", opts: ["P = VI", "P = V/I", "P = V+I", "P = V-I"], ans: 0, topic: "Electricity", diff: "medium" },
  { q: "What is a conductor?", opts: ["Allows current flow", "Blocks current", "Stores charge", "Resists current"], ans: 0, topic: "Electricity", diff: "medium" },
  { q: "What is an insulator?", opts: ["Allows current", "Blocks current flow", "Stores charge", "Conducts heat"], ans: 1, topic: "Electricity", diff: "medium" },
  { q: "Electric charge unit?", opts: ["Volt", "Ampere", "Coulomb", "Ohm"], ans: 2, topic: "Electricity", diff: "medium" },
  
  // Waves (20 questions)
  { q: "Wave speed formula?", opts: ["v = fλ", "v = f/λ", "v = f+λ"], ans: 0, topic: "Waves", diff: "easy" },
  { q: "Unit of frequency?", opts: ["Meter", "Hertz", "Second"], ans: 1, topic: "Waves", diff: "easy" },
  { q: "What is wavelength?", opts: ["Distance between peaks", "Wave height", "Wave speed"], ans: 0, topic: "Waves", diff: "easy" },
  { q: "What is amplitude?", opts: ["Wave speed", "Wave height", "Wave length"], ans: 1, topic: "Waves", diff: "easy" },
  { q: "Transverse wave motion?", opts: ["Parallel", "Perpendicular", "Circular"], ans: 1, topic: "Waves", diff: "easy" },
  { q: "Longitudinal wave motion?", opts: ["Parallel to wave", "Perpendicular", "Circular", "Random"], ans: 0, topic: "Waves", diff: "medium" },
  { q: "Sound wave type?", opts: ["Transverse", "Longitudinal", "Both", "Neither"], ans: 1, topic: "Waves", diff: "medium" },
  { q: "Light wave type?", opts: ["Transverse", "Longitudinal", "Neither", "Both"], ans: 0, topic: "Waves", diff: "medium" },
  { q: "Speed of light?", opts: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁴ m/s", "3×10¹⁰ m/s"], ans: 0, topic: "Waves", diff: "medium" },
  { q: "What is reflection?", opts: ["Wave bounces", "Wave bends", "Wave stops", "Wave speeds up"], ans: 0, topic: "Waves", diff: "medium" },
  
  // Modern Physics (20 questions)
  { q: "Einstein's famous equation?", opts: ["F=ma", "E=mc²", "V=IR"], ans: 1, topic: "Modern", diff: "easy" },
  { q: "Speed of light?", opts: ["3×10⁸ m/s", "3×10⁶ m/s", "Infinite"], ans: 0, topic: "Modern", diff: "easy" },
  { q: "What is relativity?", opts: ["Time is constant", "Time/space are relative", "Gravity is a force"], ans: 1, topic: "Modern", diff: "easy" },
  { q: "Wave-particle duality?", opts: ["Light is only waves", "Light is only particles", "Light is both"], ans: 2, topic: "Modern", diff: "easy" },
  { q: "What is a photon?", opts: ["Light particle", "Sound wave", "Electron"], ans: 0, topic: "Modern", diff: "easy" },
  { q: "Quantum superposition?", opts: ["Multiple states at once", "One state only", "No states", "Random states"], ans: 0, topic: "Modern", diff: "medium" },
  { q: "Uncertainty principle?", opts: ["Can know everything", "Can't know position AND speed perfectly", "Only for big objects", "Only for atoms"], ans: 1, topic: "Modern", diff: "medium" },
  { q: "What is antimatter?", opts: ["Opposite of matter", "Dark matter", "No mass", "Heavy matter"], ans: 0, topic: "Modern", diff: "medium" },
  { q: "Time dilation means?", opts: ["Time is constant", "Time slows at high speeds", "Time stops", "Time reverses"], ans: 1, topic: "Modern", diff: "medium" },
  { q: "Black hole gravity?", opts: ["Normal", "So strong light can't escape", "No gravity", "Weak gravity"], ans: 1, topic: "Modern", diff: "medium" }
];

// Get random question for level
function getQuestionForLevel(lvl) {
  const index = (lvl - 1) % questionPool.length;
  return questionPool[index];
}


// Hard mode questions - Type the answer (no multiple choice)
const hardQuestions = [
  // Motion - Hard (type answer)
  { q: "A car accelerates from 0 to 30 m/s in 5 seconds. What is the acceleration in m/s²?", ans: "6", topic: "Motion", diff: "hard" },
  { q: "If an object travels 100 meters in 20 seconds, what is its average speed in m/s?", ans: "5", topic: "Motion", diff: "hard" },
  { q: "What is the acceleration due to gravity on Earth in m/s²?", ans: "9.8", topic: "Motion", diff: "hard" },
  { q: "An object is thrown upward at 20 m/s. How many seconds until it reaches maximum height? (Use g=10 m/s²)", ans: "2", topic: "Motion", diff: "hard" },
  
  // Newton's Laws - Hard
  { q: "What force is needed to accelerate a 10 kg object at 5 m/s²? (Answer in Newtons)", ans: "50", topic: "Newton", diff: "hard" },
  { q: "A 60 kg person on Earth weighs how many Newtons? (Use g=10 m/s²)", ans: "600", topic: "Newton", diff: "hard" },
  { q: "If net force is 100 N and mass is 20 kg, what is acceleration in m/s²?", ans: "5", topic: "Newton", diff: "hard" },
  { q: "What is the SI unit of force?", ans: "newton", topic: "Newton", diff: "hard" },
  
  // Energy - Hard
  { q: "A 2 kg object moving at 10 m/s has how much kinetic energy in Joules?", ans: "100", topic: "Energy", diff: "hard" },
  { q: "A 5 kg book on a 4 m shelf has how much potential energy? (Use g=10 m/s²)", ans: "200", topic: "Energy", diff: "hard" },
  { q: "What is the SI unit of energy?", ans: "joule", topic: "Energy", diff: "hard" },
  { q: "Power is 100 W for 5 seconds. How much work in Joules?", ans: "500", topic: "Energy", diff: "hard" },
  
  // Electricity - Hard
  { q: "Voltage is 12 V and resistance is 4 Ω. What is current in Amperes?", ans: "3", topic: "Electricity", diff: "hard" },
  { q: "Current is 5 A and voltage is 20 V. What is power in Watts?", ans: "100", topic: "Electricity", diff: "hard" },
  { q: "What is the SI unit of electric current?", ans: "ampere", topic: "Electricity", diff: "hard" },
  { q: "Resistance is 10 Ω and current is 2 A. What is voltage in Volts?", ans: "20", topic: "Electricity", diff: "hard" },
  
  // Waves - Hard
  { q: "Frequency is 50 Hz and wavelength is 6 m. What is wave speed in m/s?", ans: "300", topic: "Waves", diff: "hard" },
  { q: "What is the speed of light in m/s? (Use scientific notation: 3e8)", ans: "3e8", topic: "Waves", diff: "hard" },
  { q: "What is the SI unit of frequency?", ans: "hertz", topic: "Waves", diff: "hard" },
  { q: "Wave speed is 340 m/s and frequency is 170 Hz. What is wavelength in meters?", ans: "2", topic: "Waves", diff: "hard" },
  
  // Modern Physics - Hard
  { q: "What does 'c' represent in E=mc²?", ans: "speed of light", topic: "Modern", diff: "hard" },
  { q: "At what speed does time dilation become significant? (Answer: speed of light)", ans: "speed of light", topic: "Modern", diff: "hard" },
  { q: "What is a particle of light called?", ans: "photon", topic: "Modern", diff: "hard" },
  { q: "What process powers the sun?", ans: "fusion", topic: "Modern", diff: "hard" }
];

// Add hard questions to main pool
questionPool.push(...hardQuestions);
