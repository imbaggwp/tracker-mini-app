const STORAGE_KEY = "tracker_tasks";

let tasks =
  JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];


/* =========================
   DATE HELPERS
========================= */

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getToday() {
  return getDateKey(new Date());
}


function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}


/* =========================
   REPEAT LOGIC
========================= */

function taskOccursOnDate(task, dateString) {

  const target = new Date(
    `${dateString}T12:00:00`
  );

  const start = new Date(
    `${task.date}T12:00:00`
  );


  // До начала задачи
  if (target < start) {
    return false;
  }


  switch (task.repeat) {

    case "none":
      return dateString === task.date;


    case "daily":
      return true;


    case "weekdays": {
      const day = target.getDay();

      return day >= 1 && day <= 5;
    }


    case "weekends": {
      const day = target.getDay();

      return day === 0 || day === 6;
    }


    case "weekly": {

      const difference =
        Math.floor(
          (target - start) /
          (1000 * 60 * 60 * 24)
        );

      return difference % 7 === 0;
    }


    case "biweekly": {

      const difference =
        Math.floor(
          (target - start) /
          (1000 * 60 * 60 * 24)
        );

      return difference % 14 === 0;
    }


    case "monthly":

      return (
        target.getDate() ===
        start.getDate()
      );


    default:
      return false;
  }
}


/* =========================
   GET TASKS FOR DATE
========================= */

function getTasksForDate(dateString) {

  return tasks.filter(task =>
    taskOccursOnDate(
      task,
      dateString
    )
  );
}


/* =========================
   STORAGE
========================= */

function saveTasks() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tasks)
  );
}


/* =========================
   ELEMENTS
========================= */

const tasksContainer =
  document.getElementById(
    "tasksContainer"
  );

const modal =
  document.getElementById(
    "modalOverlay"
  );

const addButton =
  document.getElementById(
    "addButton"
  );

const closeModal =
  document.getElementById(
    "closeModal"
  );

const taskForm =
  document.getElementById(
    "taskForm"
  );


/* =========================
   CURRENT DATE
========================= */

const today = getToday();

document.getElementById(
  "currentDate"
).textContent =
  formatDate(today);


/* =========================
   RENDER
========================= */

function renderTasks() {

  const todayTasks =
    getTasksForDate(today);


  tasksContainer.innerHTML = "";


  if (!todayTasks.length) {

    tasksContainer.innerHTML = `
      <div class="empty">
        На сегодня задач нет.<br>
        Самое время добавить первую.
      </div>
    `;

    updateProgress([]);

    return;
  }


  todayTasks.forEach(task => {

    const element =
      document.createElement("div");

    element.className =
      "task" +
      (task.completedDates?.includes(today)
        ? " completed"
        : "");


    const repeatNames = {

      none: "",

      daily: "каждый день",

      weekdays: "будни",

      weekends: "выходные",

      weekly: "каждую неделю",

      biweekly: "раз в 2 недели",

      monthly: "каждый месяц"

    };


    element.innerHTML = `

      <button
        class="task-check"
        data-id="${task.id}"
      ></button>

      <div class="task-content">

        <div class="task-title">
          ${escapeHtml(task.title)}
        </div>

        <div class="task-time">
          ${task.time || "Без времени"}
        </div>

      </div>

      ${
        task.repeat !== "none"
          ? `
            <span class="task-repeat">
              ${repeatNames[task.repeat]}
            </span>
          `
          : ""
      }

      <button
        class="task-delete"
        data-delete="${task.id}"
      >
        ×
      </button>

    `;


    tasksContainer.appendChild(
      element
    );

  });


  updateProgress(todayTasks);
}


/* =========================
   PROGRESS
========================= */

function updateProgress(todayTasks) {

  const total =
    todayTasks.length;


  const completed =
    todayTasks.filter(task =>
      task.completedDates?.includes(today)
    ).length;


  const percent =
    total === 0
      ? 0
      : Math.round(
          completed / total * 100
        );


  document.getElementById(
    "progressPercent"
  ).textContent =
    `${percent}%`;


  document.getElementById(
    "progressFill"
  ).style.width =
    `${percent}%`;


  document.getElementById(
    "progressTasks"
  ).textContent =
    `${completed} из ${total} задач`;


  let message = "Начнём?";


  if (percent === 100) {
    message = "Все выполнено 🎉";
  }

  else if (percent >= 75) {
    message = "Почти готово";
  }

  else if (percent >= 50) {
    message = "Хороший темп";
  }

  else if (percent > 0) {
    message = "Продолжаем";
  }


  document.getElementById(
    "progressMessage"
  ).textContent =
    message;
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}


/* =========================
   MODAL
========================= */

function openModal() {

  modal.classList.add("open");

  document.getElementById(
    "taskDate"
  ).value = today;


  setTimeout(() => {

    document.getElementById(
      "taskTitle"
    ).focus();

  }, 200);
}


function closeTaskModal() {

  modal.classList.remove(
    "open"
  );

  taskForm.reset();
}


addButton.addEventListener(
  "click",
  openModal
);


closeModal.addEventListener(
  "click",
  closeTaskModal
);


modal.addEventListener(
  "click",
  event => {

    if (
      event.target === modal
    ) {
      closeTaskModal();
    }
  }
);


/* =========================
   CREATE TASK
========================= */

taskForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const title =
      document.getElementById(
        "taskTitle"
      ).value.trim();


    const date =
      document.getElementById(
        "taskDate"
      ).value;


    const time =
      document.getElementById(
        "taskTime"
      ).value;


    const repeat =
      document.getElementById(
        "taskRepeat"
      ).value;


    if (!title || !date) {
      return;
    }


    const task = {

      id: Date.now(),

      title,

      date,

      time,

      repeat,

      completedDates: []

    };


    tasks.push(task);

    saveTasks();

    renderTasks();

    closeTaskModal();

  }
);


/* =========================
   TASK ACTIONS
========================= */

tasksContainer.addEventListener(
  "click",
  event => {

    const check =
      event.target.closest(
        ".task-check"
      );


    const deleteButton =
      event.target.closest(
        ".task-delete"
      );


    if (check) {

      const id =
        Number(
          check.dataset.id
        );


      const task =
        tasks.find(
          item => item.id === id
        );


      if (!task) {
        return;
      }


      if (!task.completedDates) {
        task.completedDates = [];
      }


      const index =
        task.completedDates.indexOf(
          today
        );


      if (index === -1) {

        task.completedDates.push(
          today
        );

      } else {

        task.completedDates.splice(
          index,
          1
        );

      }


      saveTasks();

      renderTasks();

    }


    if (deleteButton) {

      const id =
        Number(
          deleteButton.dataset.delete
        );


      tasks =
        tasks.filter(
          task => task.id !== id
        );


      saveTasks();

      renderTasks();

    }

  }
);


/* =========================
   CLEAR COMPLETED
========================= */

document
  .getElementById(
    "clearCompleted"
  )
  .addEventListener(
    "click",
    () => {

      tasks =
        tasks.filter(task => {

          const completed =
            task.completedDates?.includes(
              today
            );

          return !completed;

        });


      saveTasks();

      renderTasks();

    }
  );


/* =========================
   INIT
========================= */

renderTasks();
