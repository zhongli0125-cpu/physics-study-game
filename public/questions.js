// Question pool with difficulty levels
const questionPool = [
  // EASY - Motion (3 choices)
  { q: "What is velocity?", opts: ["Speed only", "Speed with direction", "Acceleration"], ans: 1, topic: "Motion", diff: "easy" },
  { q: "Formula for speed?", opts: ["s = d*t", "s = t/d", "s = d/t"], ans: 2, topic: "Motion", diff: "easy" },
  { q: "Unit of acceleration?", opts: ["m/s²", "m/s", "m"], ans: 0, topic: "Motion", diff: "easy" },
  { q: "What is uniform motion?", opts: ["Changing speed", "Constant speed", "No motion"], ans: 1, topic: "Motion", diff: "easy" },
  { q: "Free fall acceleration?", opts: ["10 m/s", "5 m/s²", "9.8 m/s²"], ans: 2, topic: "Motion", diff: "easy" },
  
  // EASY - Newton's Laws (3 choices)
  { q: "Newton's 2nd Law?", opts: ["Inertia", "F=ma", "Action-Reaction"], ans: 1, topic: "Newton", diff: "easy" },
  { q: "What is force?", opts: ["Speed", "Push or pull", "Energy"], ans: 1, topic: "Newton", diff: "easy" },
  { q: "Unit of force?", opts: ["Newton", "Joule", "Watt"], ans: 0, topic: "Newton", diff: "easy" },
  { q: "What is mass?", opts: ["Weight", "Force", "Amount of matter"], ans: 2, topic: "Newton", diff: "easy" },
  { q: "Weight formula?", opts: ["W = m/g", "W = mg", "W = m+g"], ans: 1, topic: "Newton", diff: "easy" },
  
  // EASY - Energy (3 choices)
  { q: "Kinetic energy formula?", opts: ["KE = mgh", "KE = ½mv²", "KE = mc²"], ans: 1, topic: "Energy", diff: "easy" },
  { q: "Potential energy formula?", opts: ["PE = ½mv²", "PE = mc²", "PE = mgh"], ans: 2, topic: "Energy", diff: "easy" },
  { q: "Unit of energy?", opts: ["Joule", "Newton", "Watt"], ans: 0, topic: "Energy", diff: "easy" },
  { q: "What is work?", opts: ["Force + Distance", "Force × Distance", "Force / Distance"], ans: 1, topic: "Energy", diff: "easy" },
  { q: "Unit of power?", opts: ["Joule", "Watt", "Newton"], ans: 1, topic: "Energy", diff: "easy" },
  
  // EASY - Electricity (3 choices)
  { q: "Ohm's Law?", opts: ["V = I/R", "V = IR", "V = I+R"], ans: 1, topic: "Electricity", diff: "easy" },
  { q: "Unit of voltage?", opts: ["Ampere", "Volt", "Ohm"], ans: 1, topic: "Electricity", diff: "easy" },
  { q: "Unit of current?", opts: ["Volt", "Ampere", "Ohm"], ans: 1, topic: "Electricity", diff: "easy" },
  { q: "Unit of resistance?", opts: ["Ampere", "Ohm", "Volt"], ans: 1, topic: "Electricity", diff: "easy" },
  { q: "Power formula?", opts: ["P = V/I", "P = V+I", "P = VI"], ans: 2, topic: "Electricity", diff: "easy" },
  
  // EASY - Waves (3 choices)
  { q: "Wave speed formula?", opts: ["v = f/λ", "v = fλ", "v = f+λ"], ans: 1, topic: "Waves", diff: "easy" },
  { q: "Unit of frequency?", opts: ["Meter", "Hertz", "Second"], ans: 1, topic: "Waves", diff: "easy" },
  { q: "What is wavelength?", opts: ["Wave height", "Distance between peaks", "Wave speed"], ans: 1, topic: "Waves", diff: "easy" },
  { q: "What is amplitude?", opts: ["Wave speed", "Wave height", "Wave length"], ans: 1, topic: "Waves", diff: "easy" },
  { q: "Speed of light?", opts: ["3×10⁶ m/s", "3×10⁴ m/s", "3×10⁸ m/s"], ans: 2, topic: "Waves", diff: "easy" },
  
  // EASY - Modern Physics (3 choices)
  { q: "Einstein's famous equation?", opts: ["F=ma", "E=mc²", "V=IR"], ans: 1, topic: "Modern", diff: "easy" },
  { q: "Speed of light?", opts: ["3×10⁸ m/s", "3×10⁶ m/s", "Infinite"], ans: 0, topic: "Modern", diff: "easy" },
  { q: "What is a photon?", opts: ["Sound wave", "Light particle", "Electron"], ans: 1, topic: "Modern", diff: "easy" },
  { q: "What powers the sun?", opts: ["Burning gas", "Nuclear fusion", "Electricity"], ans: 1, topic: "Modern", diff: "easy" },
  { q: "Black hole gravity?", opts: ["Normal", "So strong light can't escape", "No gravity"], ans: 1, topic: "Modern", diff: "easy" },

  // MEDIUM - Motion (4 choices)
  { q: "What is acceleration?", opts: ["Speed", "Rate of change of velocity", "Distance/time", "Force"], ans: 1, topic: "Motion", diff: "medium" },
  { q: "What is displacement?", opts: ["Total distance", "Speed", "Change in position with direction", "Velocity"], ans: 2, topic: "Motion", diff: "medium" },
  { q: "What is inertia?", opts: ["Force", "Resistance to change in motion", "Speed", "Energy"], ans: 1, topic: "Motion", diff: "medium" },
  { q: "Scalar vs Vector?", opts: ["Same thing", "Vector has no magnitude", "Scalar has no direction", "Both have direction"], ans: 2, topic: "Motion", diff: "medium" },
  { q: "What is momentum?", opts: ["Mass + Velocity", "Mass × Velocity", "Mass / Velocity", "Mass - Velocity"], ans: 1, topic: "Motion", diff: "medium" },
  
  // MEDIUM - Newton's Laws (4 choices)
  { q: "Newton's 1st Law?", opts: ["F=ma", "Objects stay in motion unless acted upon", "Action-Reaction", "Gravity"], ans: 1, topic: "Newton", diff: "medium" },
  { q: "Newton's 3rd Law?", opts: ["F=ma", "Inertia", "Action-Reaction pairs", "Gravity"], ans: 2, topic: "Newton", diff: "medium" },
  { q: "What is friction?", opts: ["Speed", "Force opposing motion", "Energy", "Mass"], ans: 1, topic: "Newton", diff: "medium" },
  { q: "Normal force direction?", opts: ["Down", "Sideways", "Perpendicular to surface", "Up"], ans: 2, topic: "Newton", diff: "medium" },
  { q: "Net force = 0 means?", opts: ["No motion", "Acceleration", "Constant velocity", "Deceleration"], ans: 2, topic: "Newton", diff: "medium" },
  
  // MEDIUM - Energy (4 choices)
  { q: "Law of conservation?", opts: ["Energy is created", "Energy is conserved", "Energy is destroyed", "Energy changes form only"], ans: 1, topic: "Energy", diff: "medium" },
  { q: "Power formula?", opts: ["P = W×t", "P = t/W", "P = W/t", "P = W+t"], ans: 2, topic: "Energy", diff: "medium" },
  { q: "Elastic potential energy?", opts: ["In height", "In springs", "In motion", "In heat"], ans: 1, topic: "Energy", diff: "medium" },
  { q: "Thermal energy is?", opts: ["Light", "Heat", "Sound", "Motion"], ans: 1, topic: "Energy", diff: "medium" },
  { q: "Chemical energy example?", opts: ["Moving car", "Battery", "Stretched spring", "Falling object"], ans: 1, topic: "Energy", diff: "medium" },
  
  // MEDIUM - Electricity (4 choices)
  { q: "Series circuit current?", opts: ["Divides", "Same everywhere", "Zero", "Increases"], ans: 1, topic: "Electricity", diff: "medium" },
  { q: "Parallel circuit voltage?", opts: ["Divides", "Zero", "Same everywhere", "Increases"], ans: 2, topic: "Electricity", diff: "medium" },
  { q: "What is a conductor?", opts: ["Blocks current", "Allows current flow", "Stores charge", "Creates voltage"], ans: 1, topic: "Electricity", diff: "medium" },
  { q: "What is an insulator?", opts: ["Allows current", "Stores charge", "Blocks current flow", "Creates voltage"], ans: 2, topic: "Electricity", diff: "medium" },
  { q: "Electric charge unit?", opts: ["Volt", "Ampere", "Coulomb", "Ohm"], ans: 2, topic: "Electricity", diff: "medium" },
  
  // MEDIUM - Waves (4 choices)
  { q: "Transverse wave motion?", opts: ["Parallel", "Perpendicular", "Circular", "Random"], ans: 1, topic: "Waves", diff: "medium" },
  { q: "Longitudinal wave motion?", opts: ["Perpendicular", "Parallel to wave", "Circular", "Random"], ans: 1, topic: "Waves", diff: "medium" },
  { q: "Sound wave type?", opts: ["Transverse", "Longitudinal", "Both", "Neither"], ans: 1, topic: "Waves", diff: "medium" },
  { q: "Light wave type?", opts: ["Longitudinal", "Transverse", "Both", "Neither"], ans: 1, topic: "Waves", diff: "medium" },
  { q: "What is reflection?", opts: ["Wave bends", "Wave bounces", "Wave stops", "Wave speeds up"], ans: 1, topic: "Waves", diff: "medium" },
  
  // MEDIUM - Modern Physics (4 choices)
  { q: "What is relativity?", opts: ["Time is constant", "Time/space are relative", "Gravity is a force", "Speed is absolute"], ans: 1, topic: "Modern", diff: "medium" },
  { q: "Wave-particle duality?", opts: ["Light is only waves", "Light is only particles", "Light is both", "Light is neither"], ans: 2, topic: "Modern", diff: "medium" },
  { q: "Quantum superposition?", opts: ["One state only", "Multiple states at once", "No states", "Fixed state"], ans: 1, topic: "Modern", diff: "medium" },
  { q: "What is antimatter?", opts: ["Dark matter", "Opposite of matter", "No mass", "Heavy matter"], ans: 1, topic: "Modern", diff: "medium" },
  { q: "Time dilation means?", opts: ["Time is constant", "Time slows at high speeds", "Time stops", "Time reverses"], ans: 1, topic: "Modern", diff: "medium" },

  // HARD - Motion (4-5 choices with calculations)
  { q: "A car accelerates from 0 to 20 m/s in 4 seconds. What is its acceleration?", opts: ["4 m/s²", "5 m/s²", "20 m/s²", "80 m/s²", "10 m/s²"], ans: 1, topic: "Motion", diff: "hard" },
  { q: "If an object travels 100m in 5s, what is its average speed?", opts: ["10 m/s", "50 m/s", "20 m/s", "500 m/s", "5 m/s"], ans: 2, topic: "Motion", diff: "hard" },
  { q: "An object with mass 5kg and velocity 10m/s has what momentum?", opts: ["15 kg·m/s", "2 kg·m/s", "50 kg·m/s", "5 kg·m/s", "10 kg·m/s"], ans: 2, topic: "Motion", diff: "hard" },
  { q: "How far does an object fall in 2 seconds? (g=10m/s²)", opts: ["10m", "40m", "20m", "5m", "2m"], ans: 2, topic: "Motion", diff: "hard" },
  { q: "A ball thrown up at 30m/s reaches max height when velocity is?", opts: ["30 m/s", "15 m/s", "0 m/s", "-30 m/s", "10 m/s"], ans: 2, topic: "Motion", diff: "hard" },
  
  // HARD - Newton's Laws (4-5 choices with calculations)
  { q: "What force accelerates a 10kg mass at 5m/s²?", opts: ["15 N", "2 N", "50 N", "10 N", "5 N"], ans: 2, topic: "Newton", diff: "hard" },
  { q: "A 2kg object weighs how much on Earth? (g=10m/s²)", opts: ["2 N", "10 N", "20 N", "12 N", "5 N"], ans: 2, topic: "Newton", diff: "hard" },
  { q: "If net force is 100N and mass is 20kg, acceleration is?", opts: ["120 m/s²", "5 m/s²", "80 m/s²", "2000 m/s²", "10 m/s²"], ans: 1, topic: "Newton", diff: "hard" },
  { q: "Two forces 30N and 40N at right angles give resultant?", opts: ["70 N", "10 N", "50 N", "35 N", "100 N"], ans: 2, topic: "Newton", diff: "hard" },
  { q: "Friction force of 20N opposes 50N push. Net force is?", opts: ["70 N", "20 N", "30 N", "50 N", "10 N"], ans: 2, topic: "Newton", diff: "hard" },
  
  // HARD - Energy (4-5 choices with calculations)
  { q: "KE of 4kg mass moving at 5m/s? (KE=½mv²)", opts: ["20 J", "100 J", "50 J", "10 J", "25 J"], ans: 2, topic: "Energy", diff: "hard" },
  { q: "PE of 2kg object at 10m height? (g=10m/s²)", opts: ["20 J", "100 J", "200 J", "12 J", "50 J"], ans: 2, topic: "Energy", diff: "hard" },
  { q: "Work done by 20N force over 5m distance?", opts: ["25 J", "4 J", "100 J", "15 J", "20 J"], ans: 2, topic: "Energy", diff: "hard" },
  { q: "Power if 300J work done in 10 seconds?", opts: ["3000 W", "30 W", "310 W", "290 W", "10 W"], ans: 1, topic: "Energy", diff: "hard" },
  { q: "Object falls 5m. Final KE if mass is 4kg? (g=10m/s²)", opts: ["20 J", "40 J", "200 J", "50 J", "100 J"], ans: 2, topic: "Energy", diff: "hard" },
  
  // HARD - Electricity (4-5 choices with calculations)
  { q: "Voltage across 5Ω resistor with 2A current?", opts: ["2.5 V", "7 V", "10 V", "3 V", "5 V"], ans: 2, topic: "Electricity", diff: "hard" },
  { q: "Current through 20Ω resistor with 100V applied?", opts: ["120 A", "80 A", "5 A", "2000 A", "10 A"], ans: 2, topic: "Electricity", diff: "hard" },
  { q: "Power dissipated: 10V across 2Ω resistor?", opts: ["20 W", "5 W", "50 W", "12 W", "10 W"], ans: 2, topic: "Electricity", diff: "hard" },
  { q: "Two 10Ω resistors in series have total resistance?", opts: ["5 Ω", "10 Ω", "20 Ω", "100 Ω", "15 Ω"], ans: 2, topic: "Electricity", diff: "hard" },
  { q: "Two 10Ω resistors in parallel have total resistance?", opts: ["20 Ω", "10 Ω", "5 Ω", "100 Ω", "2.5 Ω"], ans: 2, topic: "Electricity", diff: "hard" },
  
  // HARD - Waves (4-5 choices with calculations)
  { q: "Wave with frequency 50Hz and wavelength 2m has speed?", opts: ["52 m/s", "48 m/s", "100 m/s", "25 m/s", "50 m/s"], ans: 2, topic: "Waves", diff: "hard" },
  { q: "Light travels 3×10⁸ m/s. Frequency if wavelength is 6×10⁻⁷m?", opts: ["3×10⁸ Hz", "6×10⁻⁷ Hz", "5×10¹⁴ Hz", "2×10¹⁵ Hz", "1×10¹⁴ Hz"], ans: 2, topic: "Waves", diff: "hard" },
  { q: "Sound at 340m/s with frequency 170Hz has wavelength?", opts: ["510 m", "170 m", "2 m", "340 m", "1 m"], ans: 2, topic: "Waves", diff: "hard" },
  { q: "Period of wave with frequency 25Hz?", opts: ["25 s", "1 s", "0.04 s", "0.25 s", "4 s"], ans: 2, topic: "Waves", diff: "hard" },
  { q: "Wave completes 10 cycles in 2 seconds. Frequency is?", opts: ["20 Hz", "10 Hz", "5 Hz", "2 Hz", "12 Hz"], ans: 2, topic: "Waves", diff: "hard" },
  
  // HARD - Modern Physics (4-5 choices with calculations)
  { q: "Energy from 2kg mass converted to energy? (E=mc², c=3×10⁸)", opts: ["6×10⁸ J", "2×10⁸ J", "1.8×10¹⁷ J", "9×10¹⁶ J", "3×10⁸ J"], ans: 2, topic: "Modern", diff: "hard" },
  { q: "Photon energy if frequency is 5×10¹⁴Hz? (h=6.6×10⁻³⁴)", opts: ["5×10¹⁴ J", "6.6×10⁻³⁴ J", "3.3×10⁻¹⁹ J", "1×10⁻¹⁹ J", "5×10⁻¹⁹ J"], ans: 2, topic: "Modern", diff: "hard" },
  { q: "At 0.8c, time dilation factor γ ≈ ? (γ=1/√(1-v²/c²))", opts: ["0.8", "1.0", "1.67", "2.0", "0.6"], ans: 2, topic: "Modern", diff: "hard" },
  { q: "Wavelength of electron with momentum 6.6×10⁻²⁴? (λ=h/p, h=6.6×10⁻³⁴)", opts: ["6.6×10⁻³⁴ m", "6.6×10⁻²⁴ m", "1×10⁻¹⁰ m", "1×10⁻⁵⁸ m", "1×10⁻¹⁵ m"], ans: 2, topic: "Modern", diff: "hard" },
  { q: "Schwarzschild radius for 10 solar mass black hole? (Rs≈3km×M)", opts: ["10 km", "3 km", "30 km", "300 km", "100 km"], ans: 2, topic: "Modern", diff: "hard" }
];

// Get random question for level
function getQuestionForLevel(lvl) {
  const index = (lvl - 1) % questionPool.length;
  return questionPool[index];
}
