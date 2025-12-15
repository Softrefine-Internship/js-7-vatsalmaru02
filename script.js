// write javascript here

const settingsScreen = document.getElementById("settingsScreen");
const quizScreen = document.getElementById("quizScreen");
const resultsScreen = document.getElementById("resultsScreen");
const categorySelect = document.getElementById("category");
const difficultySelect = document.getElementById("difficulty");
const typeSelect = document.getElementById("type");
const amountSelect = document.getElementById("amount");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const quitBtn = document.getElementById("quitbtn");
const restartBtn = document.getElementById("restartBtn");
const errorDiv = document.getElementById("error");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let categories = [];

//Load Categories

async function loadCategories() {
  try {
    const response = await fetch("https://opentdb.com/api_category.php");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.trivia_categories || !Array.isArray(data.trivia_categories)) {
      throw new Error("Invalid response format");
    }

    categories = data.trivia_categories;

    categorySelect.innerHTML = '<option value="">Any Category</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    categorySelect.innerHTML =
      '<option value="">Error loading categories</option>';
    showError("Failed to load categories. Please refresh the page.");
  }
}

loadCategories();

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  const decoded = decodeURIComponent(html);
  txt.innerHTML = decoded;
  return txt.value;
}

function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
  setTimeout(() => {
    errorDiv.classList.add("hidden");
  }, 5000);
}

//Start quiz

startBtn.addEventListener("click", async () => {
  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  const type = typeSelect.value;
  const amount = amountSelect.value;

  // Build API URL with proper encoding
  let apiUrl = `https://opentdb.com/api.php?amount=${amount}&encode=url3986`;
  if (category) apiUrl += `&category=${category}`;
  if (difficulty) apiUrl += `&difficulty=${difficulty}`;
  if (type) apiUrl += `&type=${type}`;
  // if (amount) apiUrl += `&amount=${amount}`;

  startBtn.disabled = true;
  startBtn.textContent = "Loading";

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response codes
    if (data.response_code === 1) {
      showError(
        "No questions available for the selected options. Please try different settings."
      );
      return;
    } else if (data.response_code === 2) {
      showError("Invalid API parameters. Please try again.");
      return;
    } else if (data.response_code === 3 || data.response_code === 4) {
      showError("Session error. Please refresh the page and try again.");
      return;
    } else if (data.response_code === 5) {
      showError("Too many requests. Please wait a few seconds and try again.");
      return;
    }

    if (data.response_code === 0 && data.results && data.results.length > 0) {
      questions = data.results;
      currentQuestionIndex = 0;
      score = 0;
      userAnswers = [];

      settingsScreen.classList.add("hidden");
      quizScreen.classList.remove("hidden");
      displayQuestion();
    } else {
      showError("No questions available. Please try different settings.");
    }
  } catch (error) {
    console.error("Error loading questions:", error);
    showError(
      "Error loading questions. Please check your internet connection and try again."
    );
  } finally {
    startBtn.disabled = false;
    startBtn.innerHTML = "Start Quiz <span>›</span>";
  }
});

// Display current question
function displayQuestion() {
  const question = questions[currentQuestionIndex];
  const categoryName =
    categories.find((c) => c.id == categorySelect.value)?.name ||
    question.category;

  // Update progress
  document.getElementById("progressText").textContent = `Question ${
    currentQuestionIndex + 1
  } of ${questions.length}`;
  document.getElementById("currentScore").textContent = `Score: ${score}`;

  // Update question info
  document.getElementById("questionCategory").textContent = decodeHTML(
    question.category
  );
  document.getElementById("questionDifficulty").textContent =
    question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
  document.getElementById("questionText").textContent = decodeHTML(
    question.question
  );

  // Create answers
  const answersContainer = document.getElementById("answersContainer");
  answersContainer.innerHTML = "";

  const allAnswers = shuffle([
    ...question.incorrect_answers.map((a) => ({
      text: a,
      correct: false,
    })),
    { text: question.correct_answer, correct: true },
  ]);

  allAnswers.forEach((answer, index) => {
    const answerDiv = document.createElement("div");
    answerDiv.className = "answer-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.id = `answer${index}`;
    input.value = answer.text;
    input.dataset.correct = answer.correct;

    const label = document.createElement("label");
    label.htmlFor = `answer${index}`;
    label.className = "answer-label";
    label.textContent = decodeHTML(answer.text);

    answerDiv.appendChild(input);
    answerDiv.appendChild(label);
    answersContainer.appendChild(answerDiv);
  });

  nextBtn.disabled = false;
}

//Next button handler

nextBtn.addEventListener("click", () => {
  const selectedAnswer = document.querySelector(`input[name="answer"]:checked`);

  if (!selectedAnswer) {
    showError("Please select an answer before continuing.");
    return;
  }

  const question = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer.dataset.correct === "true";

  if (isCorrect) {
    score++;
  }

  userAnswers.push({
    question: question.question,
    category: question.category,
    difficulty: question.difficulty,
    userAnswers: selectedAnswer.value,
    correctAnswer: question.correct_answer,
    isCorrect: isCorrect,
  });

  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    displayQuestion();
  } else {
    showResults();
  }
});

quitBtn.addEventListener("click", () => {
  showResults();
});

//Show result

function showResults() {
  document.getElementById("finalScore").textContent = score;

  const resultsList = document.getElementById("resultsList");
  resultsList.innerHTML = "";

  userAnswers.forEach((answer, index) => {
    const resultItem = document.createElement("div");
    resultItem.className = `result-item ${
      answer.isCorrect ? "correct" : "incorrect"
    }`;

    resultItem.innerHTML = `
                    
                    <div class="result-content">
                        <div class="result-question">${decodeHTML(
                          answer.question
                        )}</div>
                        ${
                          !answer.isCorrect
                            ? `<div class="result-answer">Correct: ${decodeHTML(
                                answer.correctAnswer
                              )}</div>`
                            : ""
                        }
                    </div>
                `;
    resultsList.appendChild(resultItem);
  });

  quizScreen.classList.add("hidden");
  resultsScreen.classList.remove("hidden");
}

restartBtn.addEventListener("click", () => {
  resultsScreen.classList.add("hidden");
  settingsScreen.classList.remove("hidden");
});
