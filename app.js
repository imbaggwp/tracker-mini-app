let currentDate = new Date();

let tasks = [];

const dateTitle = document.getElementById("dateTitle");
const dateSubtitle = document.getElementById("dateSubtitle");

const completedCount = document.getElementById("completedCount");
const totalCount = document.getElementById("totalCount");

const emptyState = document.getElementById("emptyState");
const tasksList = document.getElementById("tasksList");

const addTaskButton = document.getElementById("addTaskButton");

const taskModal = document.getElementById("taskModal");
const modalOverlay = document.getElementById("modalOverlay");

const closeModal = document.getElementById("closeModal");

const taskInput = document.getElementById("taskInput");
const saveTaskButton = document.getElementById("saveTaskButton");

const prevDay = document.getElementById("prevDay");
const nextDay = document.getElementById("nextDay");


/* =====================================
   DATE
===================================== */

function formatDate(date) {

  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {

    dateTitle.textContent = "Сегодня";

  } else {

    dateTitle.textContent =
      date.toLocaleDateString("ru-RU", {
        weekday: "long"
      });

  }

  dateSubtitle.textContent =
    date.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });

  dateSubtitle.textContent =
    dateSubtitle.textContent
      .replace(".", "")
      .replace(",", ",");

}


/* =====================================
   RENDER
===================================== */

function renderTasks() {

  tasksList.innerHTML = "";

  totalCount.textContent = tasks.length;

  const completed =
    tasks.filter(task => task.completed).length;

  completedCount.textContent = completed;


  if (tasks.length === 0) {

    emptyState.style.display = "flex";

  } else {

    emptyState.style.display = "none";

  }


  tasks.forEach((task, index) => {

    const card =
      document.createElement("div");

    card.className =
      "task-card" +
      (task.completed ? " completed" : "");


    const check =
      document.createElement("button");

    check.className = "task-check";

    check.textContent =
      task.completed ? "✓" : "";


    check.addEventListener("click", () => {

      tasks[index].completed =
        !tasks[index].completed;

      renderTasks();

    });


    const name =
      document.createElement("div");

    name.className = "task-name";

    name.textContent = task.title;


    card.appendChild(check);
    card.appendChild(name);

    tasksList.appendChild(card);

  });

}


/* =====================================
   MODAL
===================================== */

function openModal() {

  taskModal.classList.remove("hidden");

  setTimeout(() => {

    taskInput.focus();

  }, 100);

}


function closeTaskModal() {

  taskModal.classList.add("hidden");

  taskInput.value = "";

}


/* =====================================
   ADD TASK
===================================== */

function addTask() {

  const title =
    taskInput.value.trim();

  if (!title) {

    taskInput.focus();

    return;

  }


  tasks.push({

    title,

    completed: false

  });


  closeTaskModal();

  renderTasks();

}


/* =====================================
   EVENTS
===================================== */

addTaskButton.addEventListener(
  "click",
  openModal
);


closeModal.addEventListener(
  "click",
  closeTaskModal
);


modalOverlay.addEventListener(
  "click",
  closeTaskModal
);


saveTaskButton.addEventListener(
  "click",
  addTask
);


taskInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      addTask();

    }

  }
);


prevDay.addEventListener(
  "click",
  () => {

    currentDate.setDate(
      currentDate.getDate() - 1
    );

    formatDate(currentDate);

  }
);


nextDay.addEventListener(
  "click",
  () => {

    currentDate.setDate(
      currentDate.getDate() + 1
    );

    formatDate(currentDate);

  }
);


/* =====================================
   START
===================================== */

formatDate(currentDate);

renderTasks();
