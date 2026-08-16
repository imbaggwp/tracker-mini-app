let currentDate = new Date();

let tasks = [];

let editingTaskId = null;

let selectedTaskDate = null;

let selectedTaskTime = "";

let selectedRepeat = "none";


/* ================= ELEMENTS ================= */

const dateTitle =
  document.getElementById("dateTitle");

const dateSubtitle =
  document.getElementById("dateSubtitle");

const completedCount =
  document.getElementById("completedCount");

const totalCount =
  document.getElementById("totalCount");

const emptyState =
  document.getElementById("emptyState");

const tasksList =
  document.getElementById("tasksList");

const addTaskButton =
  document.getElementById("addTaskButton");

const taskModal =
  document.getElementById("taskModal");

const modalOverlay =
  document.getElementById("modalOverlay");

const closeModal =
  document.getElementById("closeModal");

const modalTitle =
  document.getElementById("modalTitle");

const taskInput =
  document.getElementById("taskInput");

const taskDescription =
  document.getElementById("taskDescription");

const saveTaskButton =
  document.getElementById("saveTaskButton");

const deleteTaskButton =
  document.getElementById("deleteTaskButton");

const importantOption =
  document.getElementById("importantOption");

const importantValue =
  document.getElementById("importantValue");

const dateValue =
  document.getElementById("dateValue");

const timeValue =
  document.getElementById("timeValue");

const repeatValue =
  document.getElementById("repeatValue");

const addSubtaskButton =
  document.getElementById("addSubtaskButton");

const subtasksContainer =
  document.getElementById("subtasks");

const prevDay =
  document.getElementById("prevDay");

const nextDay =
  document.getElementById("nextDay");


/* ================= PICKERS ================= */

const datePicker =
  document.getElementById("datePicker");

const dateInput =
  document.getElementById("dateInput");

const closeDatePicker =
  document.getElementById("closeDatePicker");

const confirmDate =
  document.getElementById("confirmDate");

const datePickerOverlay =
  document.getElementById("datePickerOverlay");


const timePicker =
  document.getElementById("timePicker");

const timeInput =
  document.getElementById("timeInput");

const closeTimePicker =
  document.getElementById("closeTimePicker");

const confirmTime =
  document.getElementById("confirmTime");

const removeTime =
  document.getElementById("removeTime");

const timePickerOverlay =
  document.getElementById("timePickerOverlay");


const repeatPicker =
  document.getElementById("repeatPicker");

const closeRepeatPicker =
  document.getElementById("closeRepeatPicker");

const repeatPickerOverlay =
  document.getElementById("repeatPickerOverlay");


/* ================= STORAGE ================= */

function loadTasks() {

  const saved =
    localStorage.getItem(
      "tracker_tasks"
    );

  if (!saved) {

    tasks = [];

    return;

  }

  try {

    tasks = JSON.parse(saved);

  } catch {

    tasks = [];

  }

}


function saveTasks() {

  localStorage.setItem(
    "tracker_tasks",
    JSON.stringify(tasks)
  );

}


/* ================= DATE ================= */

function dateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function isSameDay(date1, date2) {

  return (
    date1.getFullYear() ===
      date2.getFullYear() &&

    date1.getMonth() ===
      date2.getMonth() &&

    date1.getDate() ===
      date2.getDate()
  );

}


function formatDate(date) {

  const today =
    new Date();


  if (isSameDay(date, today)) {

    dateTitle.textContent =
      "Сегодня";

  } else {

    dateTitle.textContent =
      date.toLocaleDateString(
        "ru-RU",
        {
          weekday: "long"
        }
      );

  }


  dateSubtitle.textContent =
    date.toLocaleDateString(
      "ru-RU",
      {
        weekday: "short",
        day: "numeric",
        month: "short"
      }
    );

}


/* ================= DATE TEXT ================= */

function formatTaskDate(key) {

  if (!key) {
    return "";
  }

  const parts =
    key.split("-");

  const date =
    new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );


  if (isSameDay(
    date,
    new Date()
  )) {

    return "Сегодня";

  }


  return date.toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "short"
    }
  );

}


/* ================= CURRENT TASKS ================= */

function getCurrentTasks() {

  const key =
    dateKey(currentDate);

  return tasks.filter(
    task =>
      task.date === key
  );

}


/* ================= RENDER ================= */

function renderTasks() {

  tasksList.innerHTML = "";

  const currentTasks =
    getCurrentTasks();


  totalCount.textContent =
    currentTasks.length;


  const completed =
    currentTasks.filter(
      task =>
        task.completed
    ).length;


  completedCount.textContent =
    completed;


  emptyState.style.display =
    currentTasks.length === 0
      ? "flex"
      : "none";


  currentTasks.forEach(
    task => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "task-card";


      if (task.completed) {

        card.classList.add(
          "completed"
        );

      }


      if (task.important) {

        card.classList.add(
          "important"
        );

      }


      const check =
        document.createElement(
          "button"
        );


      check.className =
        "task-check";


      check.textContent =
        task.completed
          ? "✓"
          : "";


      check.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          task.completed =
            !task.completed;

          saveTasks();

          renderTasks();

        }
      );


      const main =
        document.createElement(
          "div"
        );


      main.className =
        "task-main";


      const name =
        document.createElement(
          "div"
        );


      name.className =
        "task-name";


      name.textContent =
        task.title;


      main.appendChild(
        name
      );


      if (task.description) {

        const description =
          document.createElement(
            "div"
          );

        description.className =
          "task-description-preview";

        description.textContent =
          task.description;

        main.appendChild(
          description
        );

      }


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "task-meta";


      if (task.time) {

        const time =
          document.createElement(
            "span"
          );

        time.className =
          "task-meta-item";

        time.textContent =
          "🕐 " + task.time;

        meta.appendChild(
          time
        );

      }


      if (
        task.repeat &&
        task.repeat !== "none"
      ) {

        const repeat =
          document.createElement(
            "span"
          );

        repeat.className =
          "task-meta-item";

        repeat.textContent =
          "🔁";

        meta.appendChild(
          repeat
        );

      }


      if (task.important) {

        const important =
          document.createElement(
            "span"
          );

        important.className =
          "task-important";

        important.textContent =
          "★";

        meta.appendChild(
          important
        );

      }


      if (
        task.time ||
        task.repeat ||
        task.important
      ) {

        main.appendChild(
          meta
        );

      }


      card.appendChild(
        check
      );

      card.appendChild(
        main
      );


      card.addEventListener(
        "click",
        () => {

          openEditModal(
            task.id
          );

        }
      );


      tasksList.appendChild(
        card
      );

    }
  );

}


/* ================= RESET MODAL ================= */

function resetModal() {

  editingTaskId = null;

  selectedTaskDate =
    dateKey(currentDate);

  selectedTaskTime =
    "";

  selectedRepeat =
    "none";


  modalTitle.textContent =
    "Новая задача";

  saveTaskButton.textContent =
    "Сохранить";

  deleteTaskButton.classList.add(
    "hidden"
  );


  taskInput.value =
    "";

  taskDescription.value =
    "";


  importantOption.classList.remove(
    "important-active"
  );

  importantValue.textContent =
    "Выключено";


  dateValue.textContent =
    formatTaskDate(
      selectedTaskDate
    );


  timeValue.textContent =
    "Без времени";


  repeatValue.textContent =
    "Не повторять";


  subtasksContainer.innerHTML =
    "";

}


/* ================= OPEN ================= */

function openModal() {

  resetModal();

  taskModal.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      taskInput.focus();

    },
    100
  );

}


/* ================= EDIT ================= */

function openEditModal(
  taskId
) {

  const task =
    tasks.find(
      item =>
        item.id === taskId
    );


  if (!task) {
    return;
  }


  editingTaskId =
    task.id;


  selectedTaskDate =
    task.date;


  selectedTaskTime =
    task.time || "";


  selectedRepeat =
    task.repeat || "none";


  modalTitle.textContent =
    "Редактировать задачу";


  saveTaskButton.textContent =
    "Сохранить";


  deleteTaskButton.classList.remove(
    "hidden"
  );


  taskInput.value =
    task.title;


  taskDescription.value =
    task.description || "";


  if (task.important) {

    importantOption.classList.add(
      "important-active"
    );

    importantValue.textContent =
      "Включено";

  } else {

    importantOption.classList.remove(
      "important-active"
    );

    importantValue.textContent =
      "Выключено";

  }


  dateValue.textContent =
    formatTaskDate(
      selectedTaskDate
    );


  timeValue.textContent =
    selectedTaskTime ||
    "Без времени";


  repeatValue.textContent =
    getRepeatText(
      selectedRepeat
    );


  subtasksContainer.innerHTML =
    "";


  if (task.subtasks) {

    task.subtasks.forEach(
      subtask => {

        createSubtaskInput(
          subtask
        );

      }
    );

  }


  taskModal.classList.remove(
    "hidden"
  );

}


/* ================= CLOSE ================= */

function closeTaskModal() {

  taskModal.classList.add(
    "hidden"
  );

  resetModal();

}


/* ================= SAVE ================= */

function saveTask() {

  const title =
    taskInput.value.trim();


  if (!title) {

    taskInput.focus();

    return;

  }


  const description =
    taskDescription.value.trim();


  const important =
    importantOption.classList.contains(
      "important-active"
    );


  const subtasks =
    Array.from(
      subtasksContainer.querySelectorAll(
        ".subtask-input"
      )
    )
      .map(
        input =>
          input.value.trim()
      )
      .filter(Boolean);


  if (editingTaskId) {

    const task =
      tasks.find(
        item =>
          item.id ===
          editingTaskId
      );


    if (task) {

      task.title =
        title;

      task.description =
        description;

      task.date =
        selectedTaskDate;

      task.time =
        selectedTaskTime;

      task.repeat =
        selectedRepeat;

      task.important =
        important;

      task.subtasks =
        subtasks;

    }

  } else {

    tasks.push({

      id:
        Date.now(),

      title,

      description,

      date:
        selectedTaskDate,

      time:
        selectedTaskTime,

      repeat:
        selectedRepeat,

      important,

      completed:
        false,

      subtasks

    });

  }


  saveTasks();

  closeTaskModal();

  renderTasks();

}


/* ================= DELETE ================= */

function deleteTask() {

  if (!editingTaskId) {
    return;
  }


  const confirmed =
    confirm(
      "Удалить эту задачу?"
    );


  if (!confirmed) {
    return;
  }


  tasks =
    tasks.filter(
      task =>
        task.id !==
        editingTaskId
    );


  saveTasks();

  closeTaskModal();

  renderTasks();

}


/* ================= SUBTASK ================= */

function createSubtaskInput(
  value = ""
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "subtask-row";


  const input =
    document.createElement(
      "input"
    );


  input.className =
    "subtask-input";

  input.placeholder =
    "Подзадача";

  input.value =
    value;


  const remove =
    document.createElement(
      "button"
    );


  remove.className =
    "remove-subtask";

  remove.textContent =
    "×";


  remove.addEventListener(
    "click",
    () => {

      row.remove();

    }
  );


  row.appendChild(
    input
  );

  row.appendChild(
    remove
  );


  subtasksContainer.appendChild(
    row
  );


  input.focus();

}


/* ================= IMPORTANT ================= */

importantOption.addEventListener(
  "click",
  () => {

    const active =
      importantOption.classList.toggle(
        "important-active"
      );


    importantValue.textContent =
      active
        ? "Включено"
        : "Выключено";

  }
);


/* ================= DATE PICKER ================= */

document
  .getElementById("dateOption")
  .addEventListener(
    "click",
    () => {

      dateInput.value =
        selectedTaskDate;

      datePicker.classList.remove(
        "hidden"
      );

    }
  );


function closeDatePickerWindow() {

  datePicker.classList.add(
    "hidden"
  );

}


closeDatePicker.addEventListener(
  "click",
  closeDatePickerWindow
);


datePickerOverlay.addEventListener(
  "click",
  closeDatePickerWindow
);


confirmDate.addEventListener(
  "click",
  () => {

    if (dateInput.value) {

      selectedTaskDate =
        dateInput.value;

      dateValue.textContent =
        formatTaskDate(
          selectedTaskDate
        );

    }

    closeDatePickerWindow();

  }
);


/* ================= TIME PICKER ================= */

document
  .getElementById("timeOption")
  .addEventListener(
    "click",
    () => {

      timeInput.value =
        selectedTaskTime;

      timePicker.classList.remove(
        "hidden"
      );

    }
  );


function closeTimePickerWindow() {

  timePicker.classList.add(
    "hidden"
  );

}


closeTimePicker.addEventListener(
  "click",
  closeTimePickerWindow
);


timePickerOverlay.addEventListener(
  "click",
  closeTimePickerWindow
);


confirmTime.addEventListener(
  "click",
  () => {

    selectedTaskTime =
      timeInput.value;

    timeValue.textContent =
      selectedTaskTime ||
      "Без времени";

    closeTimePickerWindow();

  }
);


removeTime.addEventListener(
  "click",
  () => {

    selectedTaskTime =
      "";

    timeValue.textContent =
      "Без времени";

    closeTimePickerWindow();

  }
);


/* ================= REPEAT ================= */

document
  .getElementById("repeatOption")
  .addEventListener(
    "click",
    () => {

      repeatPicker.classList.remove(
        "hidden"
      );

    }
  );


function closeRepeatPickerWindow() {

  repeatPicker.classList.add(
    "hidden"
  );

}


closeRepeatPicker.addEventListener(
  "click",
  closeRepeatPickerWindow
);


repeatPickerOverlay.addEventListener(
  "click",
  closeRepeatPickerWindow
);


function getRepeatText(
  repeat
) {

  const names = {

    none:
      "Не повторять",

    daily:
      "Каждый день",

    weekdays:
      "По будням",

    weekly:
      "Каждую неделю",

    monthly:
      "Каждый месяц"

  };


  return (
    names[repeat] ||
    "Не повторять"
  );

}


document
  .querySelectorAll(
    ".repeat-choice"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          selectedRepeat =
            button.dataset.repeat;

          repeatValue.textContent =
            getRepeatText(
              selectedRepeat
            );

          closeRepeatPickerWindow();

        }
      );

    }
  );


/* ================= SUBTASK ================= */

addSubtaskButton.addEventListener(
  "click",
  () => {

    createSubtaskInput();

  }
);


/* ================= MODAL EVENTS ================= */

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
  saveTask
);


deleteTaskButton.addEventListener(
  "click",
  deleteTask
);


taskInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      saveTask();

    }

  }
);


/* ================= DAY NAVIGATION ================= */

prevDay.addEventListener(
  "click",
  () => {

    currentDate.setDate(
      currentDate.getDate() - 1
    );

    formatDate(
      currentDate
    );

    renderTasks();

  }
);


nextDay.addEventListener(
  "click",
  () => {

    currentDate.setDate(
      currentDate.getDate() + 1
    );

    formatDate(
      currentDate
    );

    renderTasks();

  }
);


/* ================= START ================= */

loadTasks();

formatDate(
  currentDate
);

renderTasks();
