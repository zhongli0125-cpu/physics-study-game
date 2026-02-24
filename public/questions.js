// Question pool - 100+ unique physics questions
const questionPool = [
  // Motion (20 questions)
  { q: "What is velocity?", opts: ["Speed only", "Speed with direction", "Acceleration"], ans: 1, topic: "Motion" },
  { q: "What is acceleration?", opts: ["Speed", "Rate of change of velocity", "Distance/time"], ans: 1, topic: "Motion" },
  { q: "Formula for speed?", opts: ["s = d/t", "s = d*t", "s = t/d"], ans: 0, topic: "Motion" },
  { q: "What is displacement?", opts: ["Total distance", "Change in position with direction", "Speed"], ans: 1, topic: "Motion" },
  { q: "Unit of acceleration?", opts: ["m/s", "m/s²", "m"], ans: 1, topic: "Motion" },
  { q: "What is uniform motion?", opts: ["Constant speed", "Changing speed", "No motion"], ans: 0, topic: "Motion" },
  { q: "Free fall acceleration?", opts: ["9.8 m/s²", "10 m/s", "5 m/s²"], ans: 0, topic: "Motion" },
  { q: "What is inertia?", opts: ["Force", "Resistance to change in motion", "Speed"], ans: 1, topic: "Motion" },
  { q: "Scalar vs Vector?", opts: ["Same thing", "Scalar has no direction", "Vector has no magnitude"], ans: 1, topic: "Motion" },
  { q: "What is momentum?", opts: ["Mass × Velocity", "Mass + Velocity", "Mass / Velocity"], ans: 0, topic: "Motion" },
  
  // Newton's Laws (20 questions)
  { q: "Newton's 1st Law?", opts: ["F=ma", "Objects stay in motion unless acted upon", "Action-Reaction"], ans: 1, topic: "Newton" },
  { q: "Newton's 2nd Law?", opts: ["Inertia", "F=ma", "Action-Reaction"], ans: 1, topic: "Newton" },
  { q: "Newton's 3rd Law?", opts: ["F=ma", "Inertia", "Action-Reaction pairs"], ans: 2, topic: "Newton" },
  { q: "What is force?", opts: ["Push or pull", "Speed", "Energy"], ans: 0, topic: "Newton" },
  { q: "Unit of force?", opts: ["Joule", "Newton", "Watt"], ans: 1, topic: "Newton" },
  { q: "What is mass?", opts: ["Weight", "Amount of matter", "Force"], ans: 1, topic: "Newton" },
  { q: "Weight formula?", opts: ["W = mg", "W = m/g", "W = m+g"], ans: 0, topic: "Newton" },
  { q: "What is friction?", opts: ["Force opposing motion", "Speed", "Energy"], ans: 0, topic: "Newton" },
  { q: "Normal force direction?", opts: ["Down", "Perpendicular to surface", "Sideways"], ans: 1, topic: "Newton" },
  { q: "Net force = 0 means?", opts: ["No motion", "Constant velocity", "Acceleration"], ans: 1, topic: "Newton" },
  
  // Energy (20 questions)
  { q: "Kinetic energy formula?", opts: ["KE = mgh", "KE = ½mv²", "KE = mc²"], ans: 1, topic: "Energy" },
  { q: "Potential energy formula?", opts: ["PE = ½mv²", "PE = mgh", "PE = mc²"], ans: 1, topic: "Energy" },
  { q: "Unit of energy?", opts: ["Newton", "Joule", "Watt"], ans: 1, topic: "Energy" },
  { q: "Law of conservation?", opts: ["Energy is created", "Energy is destroyed", "Energy is conserved"], ans: 2, topic: "Energy" },
  { q: "What is work?", opts: ["Force × Distance", "Force + Distance", "Force / Distance"], ans: 0, topic: "Energy" },
  { q: "Power formula?", opts: ["P = W/t", "P = W×t", "P = t/W"], ans: 0, topic: "Energy" },
  { q: "Unit of power?", opts: ["Joule", "Newton", "Watt"], ans: 2, topic: "Energy" },
  { q: "Elastic potential energy?", opts: ["In springs", "In height", "In motion"], ans: 0, topic: "Energy" },
  { q: "Thermal energy is?", opts: ["Heat", "Light", "Sound"], ans: 0, topic: "Energy" },
  { q: "Chemical energy example?", opts: ["Battery", "Moving car", "Stretched spring"], ans: 0, topic: "Energy" },
  
  // Electricity (20 questions)
  { q: "Ohm's Law?", opts: ["V = IR", "V = I/R", "V = I+R"], ans: 0, topic: "Electricity" },
  { q: "Unit of voltage?", opts: ["Ampere", "Volt", "Ohm"], ans: 1, topic: "Electricity" },
  { q: "Unit of current?", opts: ["Ampere", "Volt", "Ohm"], ans: 0, topic: "Electricity" },
  { q: "Unit of resistance?", opts: ["Ampere", "Volt", "Ohm"], ans: 2, topic: "Electricity" },
  { q: "Series circuit current?", opts: ["Same everywhere", "Divides", "Zero"], ans: 0, topic: "Electricity" },
  { q: "Parallel circuit voltage?", opts: ["Divides", "Same everywhere", "Zero"], ans: 1, topic: "Electricity" },
  { q: "Power formula?", opts: ["P = VI", "P = V/I", "P = V+I"], ans: 0, topic: "Electricity" },
  { q: "What is a conductor?", opts: ["Allows current flow", "Blocks current", "Stores charge"], ans: 0, topic: "Electricity" },
  { q: "What is an insulator?", opts: ["Allows current", "Blocks current flow", "Stores charge"], ans: 1, topic: "Electricity" },
  { q: "Electric charge unit?", opts: ["Volt", "Ampere", "Coulomb"], ans: 2, topic: "Electricity" },
  
  // Waves (20 questions)
  { q: "Wave speed formula?", opts: ["v = fλ", "v = f/λ", "v = f+λ"], ans: 0, topic: "Waves" },
  { q: "Unit of frequency?", opts: ["Meter", "Hertz", "Second"], ans: 1, topic: "Waves" },
  { q: "What is wavelength?", opts: ["Distance between peaks", "Wave height", "Wave speed"], ans: 0, topic: "Waves" },
  { q: "What is amplitude?", opts: ["Wave speed", "Wave height", "Wave length"], ans: 1, topic: "Waves" },
  { q: "Transverse wave motion?", opts: ["Parallel", "Perpendicular", "Circular"], ans: 1, topic: "Waves" },
  { q: "Longitudinal wave motion?", opts: ["Parallel to wave", "Perpendicular", "Circular"], ans: 0, topic: "Waves" },
  { q: "Sound wave type?", opts: ["Transverse", "Longitudinal", "Both"], ans: 1, topic: "Waves" },
  { q: "Light wave type?", opts: ["Transverse", "Longitudinal", "Neither"], ans: 0, topic: "Waves" },
  { q: "Speed of light?", opts: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁴ m/s"], ans: 0, topic: "Waves" },
  { q: "What is reflection?", opts: ["Wave bounces", "Wave bends", "Wave stops"], ans: 0, topic: "Waves" },
  
  // Modern Physics (20 questions)
  { q: "Einstein's famous equation?", opts: ["F=ma", "E=mc²", "V=IR"], ans: 1, topic: "Modern" },
  { q: "Speed of light?", opts: ["3×10⁸ m/s", "3×10⁶ m/s", "Infinite"], ans: 0, topic: "Modern" },
  { q: "What is relativity?", opts: ["Time is constant", "Time/space are relative", "Gravity is a force"], ans: 1, topic: "Modern" },
  { q: "Wave-particle duality?", opts: ["Light is only waves", "Light is only particles", "Light is both"], ans: 2, topic: "Modern" },
  { q: "What is a photon?", opts: ["Light particle", "Sound wave", "Electron"], ans: 0, topic: "Modern" },
  { q: "Quantum superposition?", opts: ["Multiple states at once", "One state only", "No states"], ans: 0, topic: "Modern" },
  { q: "Uncertainty principle?", opts: ["Can know everything", "Can't know position AND speed perfectly", "Only for big objects"], ans: 1, topic: "Modern" },
  { q: "What is antimatter?", opts: ["Opposite of matter", "Dark matter", "No mass"], ans: 0, topic: "Modern" },
  { q: "Time dilation means?", opts: ["Time is constant", "Time slows at high speeds", "Time stops"], ans: 1, topic: "Modern" },
  { q: "Black hole gravity?", opts: ["Normal", "So strong light can't escape", "No gravity"], ans: 1, topic: "Modern" },
  { q: "Quantum tunneling?", opts: ["Particles pass through barriers", "Digging tunnels", "Light bending"], ans: 0, topic: "Modern" },
  { q: "Photoelectric effect?", opts: ["Light releases electrons", "Light creates heat", "Light bends"], ans: 0, topic: "Modern" },
  { q: "Nuclear energy source?", opts: ["Chemical reactions", "Mass converting to energy", "Heat"], ans: 1, topic: "Modern" },
  { q: "Electron behavior?", opts: ["Only particle", "Only wave", "Both wave and particle"], ans: 2, topic: "Modern" },
  { q: "GPS needs relativity?", opts: ["No", "Yes, for accuracy", "Only in space"], ans: 1, topic: "Modern" },
  { q: "Quantum entanglement?", opts: ["Particles connected instantly", "Particles repel", "Particles merge"], ans: 0, topic: "Modern" },
  { q: "Schrödinger's cat?", opts: ["Dead only", "Alive only", "Both until observed"], ans: 2, topic: "Modern" },
  { q: "What powers the sun?", opts: ["Burning gas", "Nuclear fusion", "Electricity"], ans: 1, topic: "Modern" },
  { q: "Laser principle?", opts: ["Stimulated emission", "Random light", "Heat"], ans: 0, topic: "Modern" },
  { q: "MRI uses?", opts: ["X-rays", "Nuclear magnetic resonance", "Sound waves"], ans: 1, topic: "Modern" }
];

// Get random question for level
function getQuestionForLevel(lvl) {
  const index = (lvl - 1) % questionPool.length;
  return questionPool[index];
}
