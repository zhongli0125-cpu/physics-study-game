// Add this at the end to override askQuestion
function askQuestion() {
  console.log('Question triggered!', questionGate);
  if (!questionGate || questionGate.passed) return;
  
  const questionText = questionGate.question + '\n\n' + 
    questionGate.options.map((opt, i) => (i + 1) + '. ' + opt).join('\n') +
    '\n\nEnter the number (1, 2, or 3):';
  
  const answer = prompt(questionText);
  console.log('User answered:', answer);
  
  if (answer === null) return; // User cancelled
  
  const answerIndex = parseInt(answer) - 1;
  
  if (answerIndex === questionGate.answer) {
    alert('✅ Correct! Gate opened!');
    questionGate.passed = true;
    score += 50;
    if (typeof playGateOpen !== 'undefined') playGateOpen();
  } else {
    alert('❌ Wrong answer! Try again.\n\nHint: The correct answer is option ' + (questionGate.answer + 1));
  }
}


