let wordsList = [];
let currentStage = 0;
let totalStages = 0;

let currentWord = "";
let currentClue = "";
let currentGuess = [];
let gameOver = false;
let attempts = 0;
let keyStates = {};

let isDarkMode = true;
let currentLang = 'en';

// ذخیره آمار برای هر مرحله
let stageStats = [];

// بارگذاری JSON کلمات
async function loadWords() {
  try {
    const response = await fetch('../JS/words.json');
    if (!response.ok) throw new Error('Failed to load words.json');
    const data = await response.json();
    wordsList = data;
    totalStages = wordsList.length;
    init();
  } catch (err) {
    console.error('Error loading words:', err);
    alert('خطا در بارگذاری کلمات بازی.');
  }
}

// تنظیم مرحله فعلی
function setStage(stageIndex) {
  currentStage = stageIndex;
  const level = wordsList[currentStage];
  currentWord = level.word.toUpperCase();
  currentClue = level.clue;
  resetGame();
  createWordGrid();
  updateContent();
}

// بروزرسانی محتوای صفحه
function updateContent() {
  const clueTextElement = document.getElementById('clueText');
  if (clueTextElement) clueTextElement.textContent = currentClue;
}

// ساخت بازی کلمه
function createWordGrid() {
  const wordGrid = document.getElementById('wordGrid');
  wordGrid.innerHTML = '';
  for (let i = 0; i < currentWord.length; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.id = `box-${i}`;
    wordGrid.appendChild(box);
  }
}

// ساخت کیبورد
function createKeyboard() {
  const keyboard = document.getElementById('keyboard');
  const rows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫']
  ];

  keyboard.innerHTML = '';
  rows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    row.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'key';
      if (key === 'ENTER' || key === '⌫') btn.classList.add('wide');
      btn.textContent = key;
      btn.onclick = () => handleKeyPress(key);
      rowDiv.appendChild(btn);
    });
    keyboard.appendChild(rowDiv);
  });
}

// هندل کردن فشردن کلید
function handleKeyPress(key) {
  if (gameOver) return;

  if (key === '⌫') {
    if (currentGuess.length > 0) {
      currentGuess.pop();
      updateWordDisplay();
    }
  } else if (key === 'ENTER') {
    if (currentGuess.length === currentWord.length) {
      checkGuess();
    }
  } else {
    if (currentGuess.length < currentWord.length) {
      currentGuess.push(key);
      updateWordDisplay();
    }
  }
}

// نمایش حدس فعلی روی بازی
function updateWordDisplay() {
  for (let i = 0; i < currentWord.length; i++) {
    const box = document.getElementById(`box-${i}`);
    if (i < currentGuess.length) {
      box.textContent = currentGuess[i];
      box.classList.add('filled');
    } else {
      box.textContent = '';
      box.classList.remove('filled');
    }
  }
}

// محاسبه امتیاز بر اساس تلاش
function calculateScore() {
  const baseScore = 100;
  return baseScore + (3 - attempts) * 50;
}

// بررسی حدس کاربر با ۳ تلاش
function checkGuess() {
  attempts++;
  const guess = currentGuess.join('');
  const wordArr = currentWord.split('');
  const guessArr = guess.split('');

  const letterStatus = new Array(currentWord.length).fill('absent');
  const countMap = {};
  wordArr.forEach(l => { countMap[l] = (countMap[l] || 0) + 1; });

  guessArr.forEach((l, i) => {
    if (l === wordArr[i]) {
      letterStatus[i] = 'correct';
      countMap[l]--;
    }
  });

  guessArr.forEach((l, i) => {
    if (letterStatus[i] === 'absent' && countMap[l] > 0) {
      letterStatus[i] = 'present';
      countMap[l]--;
    }
  });

  for (let i = 0; i < currentWord.length; i++) {
    const box = document.getElementById(`box-${i}`);
    setTimeout(() => box.classList.add(letterStatus[i]), i*100);

    const letter = guessArr[i];
    if (!keyStates[letter] || letterStatus[i] === 'correct') {
      keyStates[letter] = letterStatus[i];
    } else if (keyStates[letter] === 'absent' && letterStatus[i] === 'present') {
      keyStates[letter] = 'present';
    }
  }

  updateKeyboardColors();

  const score = calculateScore();

  if (guess === currentWord || attempts >= 3) {
    gameOver = true;

    // ذخیره آمار مرحله
    stageStats.push({
      word: currentWord,
      attempts: attempts,
      score: score
    });

    // بعد از هر 3 مرحله نمایش نتایج
    if (stageStats.length % 3 === 0 || currentStage === totalStages - 1) {
      showStats();
    } else {
      // مرحله بعد
      setTimeout(() => setStage(currentStage + 1), 800);
    }

  } else {
    currentGuess = [];
    setTimeout(() => {
      for (let i = 0; i < currentWord.length; i++) {
        const box = document.getElementById(`box-${i}`);
        box.textContent = '';
        box.classList.remove('filled','correct','present','absent');
      }
    }, 1500);
  }
}

// رنگ کیبورد
function updateKeyboardColors() {
  document.querySelectorAll('.key').forEach(key => {
    const l = key.textContent;
    if (keyStates[l]) {
      key.classList.remove('correct','present','absent');
      key.classList.add(keyStates[l]);
    }
  });
}

// ریست بازی
function resetGame() {
  currentGuess = [];
  gameOver = false;
  attempts = 0;
  keyStates = {};
  document.querySelectorAll('.letter-box').forEach(box => {
    box.textContent = '';
    box.classList.remove('filled','correct','present','absent');
  });
  document.querySelectorAll('.key').forEach(key => {
    key.classList.remove('correct','present','absent');
  });
}

// نمایش صفحه نتایج با جمع آمار 3 مرحله
function showStats() {
  let totalAttempts = 0;
  let totalScore = 0;
  stageStats.slice(-3).forEach(s => {
    totalAttempts += s.attempts;
    totalScore += s.score;
  });

  const avgAttempts = (totalAttempts / Math.min(3, stageStats.length)).toFixed(0);
  const avgScore = Math.round(totalScore / Math.min(3, stageStats.length));
  const accuracyPercent = Math.min(100, Math.round((avgScore / 300) * 100));

  document.getElementById('correctWordDisplay').textContent =
    stageStats.slice(-3).map(s => s.word).join(', ');

  document.getElementById('attemptsValue').textContent = avgAttempts;
  document.getElementById('accuracyValue').textContent = '0%';
  document.getElementById('progressFill').style.width = '0%';
  showPage('statsPage');

  let current = 0;
  const step = Math.ceil(accuracyPercent / 20);
  const interval = setInterval(() => {
    current += step;
    if (current >= accuracyPercent) current = accuracyPercent;
    document.getElementById('accuracyValue').textContent = current + '%';
    document.getElementById('progressFill').style.width = current + '%';
    if (current >= accuracyPercent) clearInterval(interval);
  }, 50);
}

// نمایش مودال
function showModal(title,message){
  const modal = document.getElementById('modal');
  if(!modal) return;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  modal.classList.add('active');
}

// نمایش صفحه
function showPage(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if(page) page.classList.add('active');
}

// لیسنرهای دکمه‌ها و کیبورد
function setupEventListeners(){
  document.getElementById('logoBtn')?.addEventListener('click',()=>showPage('homePage'));
  document.getElementById('playNavBtn')?.addEventListener('click',()=>{
    resetGame(); showPage('gamePage');
  });
  document.getElementById('playBtn')?.addEventListener('click',()=>{
    resetGame(); showPage('gamePage');
  });
  document.getElementById('signInBtn')?.addEventListener('click',()=>showPage('loginPage'));
  document.getElementById('guideNavBtn')?.addEventListener('click',()=>showPage('guidePage'));
  document.getElementById('startPlayingBtn')?.addEventListener('click',()=>{
    resetGame(); showPage('gamePage');
  });
  document.getElementById('playAgainBtn')?.addEventListener('click',()=>{
    resetGame(); showPage('gamePage');
  });

  document.getElementById('toSignupLink')?.addEventListener('click',e=>{ e.preventDefault(); showPage('signupPage'); });
  document.getElementById('toLoginLink')?.addEventListener('click',e=>{ e.preventDefault(); showPage('loginPage'); });

  document.getElementById('loginForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    showModal('Success!', 'You\'ve successfully signed in!');
    setTimeout(()=>{
      document.getElementById('modal').classList.remove('active');
      resetGame(); showPage('gamePage');
    },1500);
  });

  document.getElementById('signupForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    showModal('Welcome!', 'Your account has been created successfully!');
    setTimeout(()=>{
      document.getElementById('modal').classList.remove('active');
      resetGame(); showPage('gamePage');
    },1500);
  });

  document.getElementById('themeToggle')?.addEventListener('click',()=>{
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode',!isDarkMode);
    document.getElementById('themeToggle').textContent = isDarkMode ? '🌙':'☀️';
  });

  document.getElementById('langToggle')?.addEventListener('click',()=>{
    currentLang = currentLang==='en'?'fa':'en';
    document.getElementById('langToggle').textContent = currentLang==='en'?'EN':'FA';
    document.body.style.direction = currentLang==='fa'?'rtl':'ltr';
  });

  document.addEventListener('keydown', e=>{
    if(document.getElementById('gamePage')?.classList.contains('active')){
      const key = e.key.toUpperCase();
      if(/^[A-Z]$/.test(key)) handleKeyPress(key);
      else if(key==='BACKSPACE') handleKeyPress('⌫');
      else if(key==='ENTER') handleKeyPress('ENTER');
    }
  });
}

// Initialize
function init(){
  setStage(0);
  createKeyboard();
  createWordGrid();
  setupEventListeners();
}

// شروع بازی
loadWords();
