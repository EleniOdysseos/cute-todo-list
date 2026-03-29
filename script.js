// ============================================
// COLOR PALETTE
// These are the soft cozy colors used when
// a new category is created.
// ============================================

const COLOR_PALETTE = [
  "#d8b4a0", // dusty rose
  "#c9b59a", // warm beige
  "#b7c7a3", // muted sage
  "#e3c8b5", // soft peach
  "#cbb8a8", // taupe
  "#d9c2b0", // sand blush
  "#bfc9b2", // soft olive
  "#e6d3c7", // pale blush
];

// ============================================
// GET HTML ELEMENTS
// grab the things from HTML that i want
// to control using JavaScript.
// ============================================

const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const emptyState = document.getElementById("empty-state");
const dayName = document.getElementById("day-name");
const dayNumber = document.getElementById("day-number");
const monthName = document.getElementById("month-name");

const categoryFilters = document.getElementById("category-filters");
const categoryInputArea = document.getElementById("category-input-area");
const categoryNameInput = document.getElementById("category-name-input");
const taskCategorySelect = document.getElementById("task-category-select");

const searchInput = document.getElementById("search-input");
const prevDayBtn = document.getElementById("prev-day-btn");
const nextDayBtn = document.getElementById("next-day-btn");

// ============================================
// APP STATE
// These variables hold the data my app uses.
// ============================================

// Load tasks from browser storage, or start empty
let tasks = JSON.parse(localStorage.getItem("cozy-tasks")) || [];

// Load categories from browser storage, or start empty
let categories = JSON.parse(localStorage.getItem("cozy-categories")) || [];

// Which category is currently selected? ("all" means show everything)
let activeFilter = "all";

// What the user typed in the search bar
let searchQuery = "";

// The currently selected date in YYYY-MM-DD format
let selectedDate = getDateString(new Date());

// ============================================
// DATE HELPERS
// These help  convert dates into strings and
// back again.
// ============================================

// Turn a Date object into a string like 2026-04-01
function getDateString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Turn a string like 2026-04-01 back into a Date object
function parseDateString(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// ============================================
// LOCAL STORAGE
// Save tasks and categories so they stay there
// even after refresh.
// ============================================

function saveTasks() {
  localStorage.setItem("cozy-tasks", JSON.stringify(tasks));
}

function saveCategories() {
  localStorage.setItem("cozy-categories", JSON.stringify(categories));
}

// ============================================
// CATEGORY HELPERS
// ============================================

// Find one category by its id
function getCategoryById(id) {
  return categories.find((cat) => cat.id === id) || null;
}

// ============================================
// DATE CARD DISPLAY
// Show the currently selected date in the green card
// ============================================

function updateDateCard() {
  const current = parseDateString(selectedDate);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  dayName.textContent = days[current.getDay()];
  dayNumber.textContent = current.getDate();
  monthName.textContent = months[current.getMonth()];
}

// Go to the next day
function goToNextDay() {
  const current = parseDateString(selectedDate);
  current.setDate(current.getDate() + 1);
  selectedDate = getDateString(current);

  updateDateCard();
  renderTasks();
}

// Go to the previous day
function goToPrevDay() {
  const current = parseDateString(selectedDate);
  current.setDate(current.getDate() - 1);
  selectedDate = getDateString(current);

  updateDateCard();
  renderTasks();
}

// ============================================
// RENDER CATEGORIES
// Draw the category pills and the dropdown
// ============================================

function renderCategories() {
  categoryFilters.innerHTML = "";

  // Create the "All" pill
  const allPill = document.createElement("button");
  allPill.className = "category-pill" + (activeFilter === "all" ? " active" : "");
  allPill.textContent = "All";

  // If "All" is active, make it green
  if (activeFilter === "all") {
    allPill.style.backgroundColor = "#8fa66a";
  }

  allPill.addEventListener("click", function () {
    activeFilter = "all";
    renderCategories();
    renderTasks();
  });

  categoryFilters.appendChild(allPill);

  // Create one pill for each user-made category
  categories.forEach(function (cat) {
    const pill = document.createElement("button");
    const isActive = activeFilter === cat.id;

    pill.className = "category-pill" + (isActive ? " active" : "");

    if (isActive) {
      pill.style.backgroundColor = cat.color;
    }

    // Category name inside pill
    const nameSpan = document.createElement("span");
    nameSpan.textContent = cat.name;
    pill.appendChild(nameSpan);

    // Small X button to delete category
    const delBtn = document.createElement("button");
    delBtn.className = "pill-delete";
    delBtn.textContent = "×";
    delBtn.title = "Delete category";

    delBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // prevents the pill click from also happening
      deleteCategory(cat.id);
    });

    pill.appendChild(delBtn);

    // Clicking the pill filters tasks by this category
    pill.addEventListener("click", function () {
      activeFilter = cat.id;
      renderCategories();
      renderTasks();
    });

    categoryFilters.appendChild(pill);
  });

  // Also refresh the category dropdown
  renderTaskCategorySelect();
}

// ============================================
// CATEGORY DROPDOWN
// This fills the select menu with categories
// ============================================

function renderTaskCategorySelect() {
  taskCategorySelect.innerHTML = `<option value="">No category</option>`;

  categories.forEach(function (cat) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    taskCategorySelect.appendChild(opt);
  });
}

// ============================================
// CREATE CATEGORY
// ============================================

function createCategory() {
  const name = categoryNameInput.value.trim();
  if (name === "") return;

  // Prevent duplicate category names
  const exists = categories.some(function (cat) {
    return cat.name.toLowerCase() === name.toLowerCase();
  });

  if (exists) {
    categoryNameInput.style.borderColor = "#e8a09a";
    setTimeout(function () {
      categoryNameInput.style.borderColor = "";
    }, 1000);
    return;
  }

  // Pick the next soft color
  const color = COLOR_PALETTE[categories.length % COLOR_PALETTE.length];

  // Create a unique id
  const id = "cat-" + Date.now();

  categories.push({ id, name, color });
  saveCategories();

  categoryNameInput.value = "";
  hideCategoryInput();
  renderCategories();
}

// ============================================
// DELETE CATEGORY
// If a category is deleted, tasks that used it
// keep existing, but become uncategorized.
// ============================================

function deleteCategory(id) {
  categories = categories.filter((cat) => cat.id !== id);

  tasks.forEach(function (task) {
    if (task.categoryId === id) {
      task.categoryId = null;
    }
  });

  if (activeFilter === id) {
    activeFilter = "all";
  }

  saveCategories();
  saveTasks();
  renderCategories();
  renderTasks();
}

// ============================================
// SHOW / HIDE CATEGORY INPUT
// ============================================

function showCategoryInput() {
  categoryInputArea.style.display = "flex";
  document.getElementById("new-category-row").style.display = "none";
  categoryNameInput.focus();
}

function hideCategoryInput() {
  categoryInputArea.style.display = "none";
  document.getElementById("new-category-row").style.display = "flex";
  categoryNameInput.value = "";
}

// ============================================
// GET VISIBLE TASKS
// Only return tasks that match:
// 1. selected date
// 2. selected category
// 3. search text
// ============================================

function getVisibleTasks() {
  return tasks.filter(function (task) {
    const categoryMatch =
      activeFilter === "all" || task.categoryId === activeFilter;

    const dateMatch = task.date === selectedDate;

    const searchMatch = task.text.toLowerCase().includes(searchQuery);

    return categoryMatch && dateMatch && searchMatch;
  });
}

// ============================================
// PROGRESS BAR
// Only counts tasks for the selected day
// ============================================

function updateProgress() {
  const dailyTasks = tasks.filter((task) => task.date === selectedDate);
  const total = dailyTasks.length;
  const completed = dailyTasks.filter((task) => task.completed).length;

  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  progressBar.style.width = percentage + "%";
  progressText.textContent = `${completed} / ${total} tasks done`;
}

// ============================================
// EMPTY STATE
// Show/hide the "No tasks yet" message
// ============================================

function toggleEmptyState(visibleCount) {
  emptyState.style.display = visibleCount === 0 ? "block" : "none";
}

// ============================================
// RENDER TASKS
// Clear the list and draw every visible task
// ============================================

function renderTasks() {
  taskList.innerHTML = "";

  const visibleTasks = getVisibleTasks();

  visibleTasks.forEach(function (task) {
    // Find the real position of this task inside the full tasks array
    const index = tasks.indexOf(task);

    // Get the category object for this task
    const cat = getCategoryById(task.categoryId);

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="task-main">
        <input
          type="checkbox"
          ${task.completed ? "checked" : ""}
          onchange="toggleTask(${index})"
        />

        <div 
          class="category-dot" 
          style="background-color: ${cat ? cat.color : "#ddd0c8"};"
          title="${cat ? cat.name : "No category"}">
        </div>

        <span class="task-text ${task.completed ? "done-text" : ""}">
          ${task.text}
        </span>
      </div>

      <div class="task-meta">
        <button class="move-btn" onclick="moveToNextDay(${index})" title="Move to next day">
          ➜
        </button>

        <button class="delete-btn" onclick="deleteTask(${index})">
          ✕
        </button>
      </div>
    `;

    taskList.appendChild(li);
  });

  toggleEmptyState(visibleTasks.length);
  updateProgress();
  saveTasks();
}

// ============================================
// ADD TASK
// Creates a new task object and stores it
// ============================================

function addTask() {
  const text = taskInput.value.trim();
  if (text === "") return;

  const categoryId = taskCategorySelect.value || null;

  tasks.push({
    text: text,
    completed: false,
    categoryId: categoryId,
    date: selectedDate,
  });

  taskInput.value = "";
  renderTasks();
}

// ============================================
// TOGGLE TASK
// Checkbox switches completed true/false
// ============================================

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
}

// ============================================
// MOVE TO NEXT DAY
// Changes the task's date to the next day
// and also resets completed to false
// ============================================

function moveToNextDay(index) {
  const current = parseDateString(tasks[index].date);
  current.setDate(current.getDate() + 1);

  tasks[index].date = getDateString(current);
  tasks[index].completed = false;

  renderTasks();
}

// ============================================
// DELETE TASK
// First play animation, then remove task
// ============================================

function deleteTask(index) {
  const allItems = taskList.querySelectorAll("li");
  let targetLi = null;

  allItems.forEach(function (li) {
    const btn = li.querySelector(".delete-btn");

    if (btn && btn.getAttribute("onclick") === "deleteTask(" + index + ")") {
      targetLi = li;
    }
  });

  if (targetLi) {
    targetLi.classList.add("removing");

    setTimeout(function () {
      tasks.splice(index, 1);
      renderTasks();
    }, 350);
  } else {
    tasks.splice(index, 1);
    renderTasks();
  }
}

// ============================================
// EVENT LISTENERS
// These wait for user actions
// ============================================

// Add button click
addBtn.addEventListener("click", addTask);

// Press Enter inside task input
taskInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTask();
});

// Search while typing
searchInput.addEventListener("input", function () {
  searchQuery = this.value.toLowerCase().trim();
  renderTasks();
});

// Category input buttons
document
  .getElementById("show-category-input-btn")
  .addEventListener("click", showCategoryInput);

document
  .getElementById("save-category-btn")
  .addEventListener("click", createCategory);

document
  .getElementById("cancel-category-btn")
  .addEventListener("click", hideCategoryInput);

// Keyboard shortcuts in category input
categoryNameInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") createCategory();
  if (e.key === "Escape") hideCategoryInput();
});

// Date card arrows
prevDayBtn.addEventListener("click", goToPrevDay);
nextDayBtn.addEventListener("click", goToNextDay);

// ============================================
// INITIAL LOAD
// This runs once when page opens
// ============================================

updateDateCard();
renderCategories();
renderTasks();