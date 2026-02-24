# 🔥💧 Fireboy & Watergirl Physics Adventure

An educational physics game combining Fireboy and Watergirl style parkour gameplay with interactive learning features.

## Features

- **Parkour Platformer**: Control both Fireboy (WASD) and Watergirl (Arrow Keys) simultaneously
- **Physics Questions**: Answer physics questions to unlock gates and progress
- **AI-Powered Learning**: Get explanations and flashcards for physics topics (with optional OpenAI integration)
- **Multiple Levels**: Progressive difficulty with hazards, collectibles, and puzzles
- **Study Mode**: Interactive flashcards and topic explanations
- **PDF Upload**: Upload study materials for future AI-generated problems

## Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Set up OpenAI API for AI features:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Start the server:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

## How to Play

### Game Controls
- **Fireboy**: WASD keys (W to jump)
- **Watergirl**: Arrow keys (Up to jump)

### Rules
- 🔥 Fireboy dies in water (blue pools)
- 💧 Watergirl dies in lava (red pools)
- 🟢 Green pools kill both characters
- Collect gems matching your character color
- Answer physics questions to open yellow gates
- Both characters must reach their colored doors to complete the level
- Press R to restart if you die

## Physics Topics

- Motion (velocity, acceleration, displacement)
- Newton's Laws (F=ma, inertia, action-reaction)
- Energy (kinetic, potential, conservation)
- Electricity (Ohm's Law, circuits, current)
- Waves (frequency, wavelength, wave speed)

## Tech Stack

- Node.js + Express
- SQLite database
- Canvas API for game rendering
- OpenAI API (optional, has fallback content)
- EJS templating

## Project Structure

```
├── public/
│   ├── game.js       # Game logic and rendering
│   ├── study.js      # Study mode functionality
│   ├── style.css     # Fireboy & Watergirl themed styling
│   └── index.html    # (moved to views/)
├── views/
│   ├── index.ejs     # Main game page
│   └── submissions.ejs # Submissions view
├── uploads/          # PDF uploads storage
├── server.js         # Express server with API endpoints
├── submissions.db    # SQLite database
└── package.json
```

## API Endpoints

- `GET /` - Main game page
- `POST /ai-explain` - Get AI explanation for a topic
- `POST /generate-flashcards` - Generate flashcards for a topic
- `POST /upload` - Upload PDF files
- `POST /submit` - Submit form data
- `GET /submissions` - View all submissions

## Notes

- Works without OpenAI API key (uses fallback content)
- Add your API key to `.env` for AI-generated content
- Database and uploads persist between sessions
- Game difficulty increases with each level

## License

ISC
