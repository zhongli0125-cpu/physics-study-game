let flashcards = [];
let currentTopic = '';
let lessonPages = [];
let currentPage = 0;

function selectTopic(topic) {
  currentTopic = topic;
  console.log('Topic selected:', currentTopic);
  
  // Visual feedback
  const topicButtons = document.querySelectorAll('.topic-btn');
  topicButtons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  askAI(topic);
  generateFlashcards(topic);
}

async function askAI(topic) {
  try {
    const aiResult = document.getElementById("aiResult");
    aiResult.innerHTML = "Loading explanation...";
    aiResult.style.color = "#00ffcc";
    
    console.log('Fetching explanation for:', topic);
    
    const res = await fetch("/ai-explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error:', errorText);
      throw new Error(`Server returned ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Explanation received, length:', data.explanation.length);
    
    // Split explanation into pages (every 1500 characters or at section breaks)
    lessonPages = splitIntoPages(data.explanation);
    currentPage = 0;
    displayLessonPage();
    
  } catch (error) {
    console.error('AI explain error:', error);
    const aiResult = document.getElementById("aiResult");
    aiResult.innerHTML = "Error loading explanation. Please check console (F12) for details.<br><br>Error: " + error.message;
    aiResult.style.color = "#ff4500";
  }
}

function splitIntoPages(text) {
  // Split by major sections (##) or every 1500 characters
  const sections = text.split(/(?=##)/);
  const pages = [];
  let currentPageText = '';
  
  sections.forEach(section => {
    if (currentPageText.length + section.length > 1500 && currentPageText.length > 0) {
      pages.push(currentPageText);
      currentPageText = section;
    } else {
      currentPageText += section;
    }
  });
  
  if (currentPageText.length > 0) {
    pages.push(currentPageText);
  }
  
  return pages.length > 0 ? pages : [text];
}

function displayLessonPage() {
  const aiResult = document.getElementById("aiResult");
  const pageContent = lessonPages[currentPage];
  
  // Create navigation buttons
  const navButtons = `
    <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
      <button onclick="previousPage()" ${currentPage === 0 ? 'disabled' : ''} 
        style="padding: 10px 20px; background: ${currentPage === 0 ? '#555' : '#00ffcc'}; 
        color: #000; border: none; cursor: ${currentPage === 0 ? 'not-allowed' : 'pointer'}; 
        border-radius: 5px; font-weight: bold;">
        ← Previous
      </button>
      <span style="color: #00ffcc;">Page ${currentPage + 1} of ${lessonPages.length}</span>
      <button onclick="nextPage()" ${currentPage === lessonPages.length - 1 ? 'disabled' : ''} 
        style="padding: 10px 20px; background: ${currentPage === lessonPages.length - 1 ? '#555' : '#00ffcc'}; 
        color: #000; border: none; cursor: ${currentPage === lessonPages.length - 1 ? 'not-allowed' : 'pointer'}; 
        border-radius: 5px; font-weight: bold;">
        Next →
      </button>
    </div>
  `;
  
  aiResult.innerHTML = `<div style="white-space: pre-wrap;">${pageContent}</div>${navButtons}`;
  aiResult.style.color = "#00ffcc";
  
  // Scroll to top of lesson
  aiResult.scrollTop = 0;
}

function nextPage() {
  if (currentPage < lessonPages.length - 1) {
    currentPage++;
    displayLessonPage();
  }
}

function previousPage() {
  if (currentPage > 0) {
    currentPage--;
    displayLessonPage();
  }
}

async function generateFlashcards(topic) {
  try {
    const flashcardDisplay = document.getElementById("flashcardDisplay");
    flashcardDisplay.innerHTML = "<p>Loading flashcards...</p>";
    
    const res = await fetch("/generate-flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });
    
    if (!res.ok) throw new Error('Failed to fetch flashcards');
    
    const data = await res.json();
    flashcards = data.flashcards;
    displayFlashcards();
  } catch (error) {
    document.getElementById("flashcardDisplay").innerHTML = "<p>Error loading flashcards.</p>";
    console.error('Flashcard generation error:', error);
  }
}

function displayFlashcards() {
  const flashcardDisplay = document.getElementById("flashcardDisplay");
  flashcardDisplay.innerHTML = "";
  
  flashcards.forEach(card => {
    const div = document.createElement("div");
    div.className = "pixel-card";
    div.innerHTML = `
      <div class="inner">
        <div class="front">${card.question}</div>
        <div class="back">${card.answer}</div>
      </div>
    `;
    div.onclick = () => div.classList.toggle("flip");
    flashcardDisplay.appendChild(div);
  });
}

async function uploadFile() {
  try {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files[0]) {
      alert("Please select a PDF file first");
      return;
    }
    
    document.getElementById("problemOutput").innerText = "Uploading...";
    
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    
    const res = await fetch("/upload", {
      method: "POST",
      body: formData
    });
    
    if (!res.ok) throw new Error('Upload failed');
    
    const data = await res.json();
    document.getElementById("problemOutput").innerText = data.problems;
  } catch (error) {
    document.getElementById("problemOutput").innerText = "Upload failed. Please try again.";
    console.error('Upload error:', error);
  }
}


// Leaderboard functionality
async function loadLeaderboard() {
  try {
    const leaderboardDisplay = document.getElementById('leaderboardDisplay');
    leaderboardDisplay.innerHTML = '<p>Loading...</p>';
    
    const res = await fetch('/leaderboard');
    if (!res.ok) throw new Error('Failed to load leaderboard');
    
    const data = await res.json();
    
    if (data.leaderboard.length === 0) {
      leaderboardDisplay.innerHTML = '<p>No scores yet. Be the first!</p>';
      return;
    }
    
    let html = '<table class="leaderboard-table"><thead><tr><th>Rank</th><th>Player</th><th>Level</th><th>Score</th><th>Time (s)</th></tr></thead><tbody>';
    data.leaderboard.forEach((entry, index) => {
      html += `<tr>
        <td>${index + 1}</td>
        <td>${entry.player_name}</td>
        <td>${entry.level}</td>
        <td>${entry.score}</td>
        <td>${entry.time}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    
    leaderboardDisplay.innerHTML = html;
  } catch (error) {
    document.getElementById('leaderboardDisplay').innerHTML = '<p>Error loading leaderboard.</p>';
    console.error('Leaderboard error:', error);
  }
}

// Review questions functionality
async function loadReviewQuestions() {
  try {
    const reviewDisplay = document.getElementById('reviewDisplay');
    reviewDisplay.innerHTML = '<p>Loading...</p>';
    
    const res = await fetch('/review-questions');
    if (!res.ok) throw new Error('Failed to load review questions');
    
    const data = await res.json();
    
    if (data.questions.length === 0) {
      reviewDisplay.innerHTML = '<p>No wrong answers yet. Keep playing!</p>';
      return;
    }
    
    let html = '<div class="review-list">';
    data.questions.forEach((q, index) => {
      html += `<div class="review-item">
        <p><strong>Q${index + 1}:</strong> ${q.question}</p>
        <p><strong>Answer:</strong> ${q.correct_answer}</p>
        <p><strong>Topic:</strong> ${q.topic} | <strong>Wrong ${q.times_wrong} time(s)</strong></p>
      </div>`;
    });
    html += '</div>';
    
    reviewDisplay.innerHTML = html;
  } catch (error) {
    document.getElementById('reviewDisplay').innerHTML = '<p>Error loading review questions.</p>';
    console.error('Review questions error:', error);
  }
}

// Set player name
function setPlayerName() {
  const name = prompt('Enter your name for the leaderboard:');
  if (name) {
    localStorage.setItem('playerName', name);
    alert(`Welcome, ${name}!`);
  }
}

// Check if player name is set on load
if (!localStorage.getItem('playerName')) {
  setTimeout(setPlayerName, 2000);
}

// Q&A functionality (for studying topics, NOT game questions)
async function askQuestionStudy() {
  console.log('askQuestionStudy called!');
  console.log('Current topic:', currentTopic);
  
  try {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value.trim();
    
    console.log('Question:', question);
    
    if (!question) {
      alert('Please enter a question first!');
      return;
    }
    
    if (!currentTopic) {
      alert('Please select a topic first! Click one of the topic buttons above.');
      return;
    }
    
    const qaResult = document.getElementById('qaResult');
    qaResult.innerHTML = '<p>Thinking...</p>';
    qaResult.style.display = 'block';
    
    console.log('Sending request to /ask-question...');
    
    const res = await fetch('/ask-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: currentTopic, question })
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error:', errorText);
      throw new Error('Failed to get answer');
    }
    
    const data = await res.json();
    console.log('Answer received:', data.answer);
    
    qaResult.innerHTML = `
      <div class="qa-item">
        <p><strong>Q:</strong> ${question}</p>
        <p><strong>A:</strong> ${data.answer}</p>
      </div>
    `;
    
    questionInput.value = '';
  } catch (error) {
    console.error('Q&A error:', error);
    document.getElementById('qaResult').innerHTML = '<p style="color: red;">Error: ' + error.message + '. Check console for details.</p>';
  }
}
