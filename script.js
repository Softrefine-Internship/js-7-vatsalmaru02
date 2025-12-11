// write javascript here

const settingsScreen = document.getElementById("settingsScreen");
const quizScreen = document.getElementById("quizScreen");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");

const typeSelect = document.getElementById("typeSelect");
const startBtn = document.getElementById("startBtn");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let categories = [];

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
