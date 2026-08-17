/* =====================================================
   TRACKER
   Полная версия
   ===================================================== */

let tasks = [];
let selectedDate = new Date();
let editingTaskId = null;

let taskFormDate = "";
let taskFormTime = "";
let taskFormRepeat = "none";
let taskFormImportant = false;
let taskFormReminder = "none";

const STORAGE_KEY = "tracker_tasks_v1";

/* =====================================================
   HELPERS
   ===================================================== */

const $ = id => document.getElementById(id);

function pad(n) {
  return String(n).padStart(2, "0");
}

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isToday(date) {
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatFullDate(date) {
  return date.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function repeatText(value) {
  return {
    none: "Не повторять",
    daily: "Каждый день",
    weekdays: "По будням",
    weekly: "Каждую неделю",
    monthly: "Каждый месяц"
  }[value] || "Не повторять";
}

const reminderOptions = {
  none: "Без напоминания",
  at: "В момент события",
  "5m": "За 5 минут",
  "10m": "За 10 минут",
  "15m": "За 15 минут",
  "30m": "За 30 минут",
  "1h": "За 1 час"
};

function reminderText(value) {
  return reminderOptions[value] || "Без напоминания";
}

/* =====================================================
   STORAGE
   ===================================================== */

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      tasks = [];
      return;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      tasks = [];
      return;
    }

    tasks = parsed.map(task => ({
      ...task,

      completedDates:
        task.completedDates &&
        typeof task.completedDates === "object"
          ? task.completedDates
          : {},

      subtasks: Array.isArray(task.subtasks)
        ? task.subtasks
            .map(subtask => {
              if (typeof subtask === "string") {
                return {
                  text: subtask,
                  completed: false
                };
              }

              return {
                text: subtask.text || "",
                completed: Boolean(subtask.completed)
              };
            })
            .filter(x => x.text.trim())
        : [],

      repeat: task.repeat || "none",
      reminder: task.reminder || "none",
      important: Boolean(task.important)
    }));

  } catch (error) {
    console.error("Ошибка загрузки задач:", error);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    );
  } catch (error) {
    console.error("Ошибка сохранения:", error);
  }
}

/* =====================================================
   REPEAT
   ===================================================== */

function taskOccursOnDate(task, dateKey) {
  if (!task || !task.date) return false;

  const start = dateFromKey(task.date);
  const target = dateFromKey(dateKey);

  if (target < start) return false;

  const repeat = task.repeat || "none";

  if (repeat === "none") {
    return task.date === dateKey;
  }

  if (repeat === "daily") {
    return true;
  }

  if (repeat === "weekdays") {
    const day = target.getDay();
    return day >= 1 && day <= 5;
  }

  if (repeat === "weekly") {
    return start.getDay() === target.getDay();
  }

  if (repeat === "monthly") {
    return start.getDate() === target.getDate();
  }

  return false;
}

function getTasksForSelectedDate() {
  const dateKey = getDateKey(selectedDate);

  return tasks.filter(task =>
    taskOccursOnDate(task, dateKey)
  );
}

/* =====================================================
   COMPLETION
   ===================================================== */

function isTaskCompletedOnDate(task, dateKey) {
  if (
    task.completedDates &&
    typeof task.completedDates === "object"
  ) {
    return Boolean(task.completedDates[dateKey]);
  }

  return Boolean(
    task.completed &&
    task.date === dateKey
  );
}

function setTaskCompletedOnDate(
  task,
  dateKey,
  completed
) {
  if (
    !task.completedDates ||
    typeof task.completedDates !== "object"
  ) {
    task.completedDates = {};
  }

  if (completed) {
    task.completedDates[dateKey] = true;
  } else {
    delete task.completedDates[dateKey];
  }

  task.completed = completed;
}

/* =====================================================
   ELEMENTS
   ===================================================== */

const dateMain = $("dateMain");
const dateSmall = $("dateSmall");

const previousDay = $("previousDay");
const nextDay = $("nextDay");
const todayButton = $("todayButton");
const calendarButton = $("calendarButton");

const tasksList = $("tasksList");
const emptyState = $("emptyState");

const progressFill = $("progressFill");
const progressCount = $("progressCount");

const addTaskButton = $("addTaskButton");

/* MODAL */

const taskModal = $("taskModal");
const modalBackdrop = $("modalBackdrop");
const closeModal = $("closeModal");
const modalTitle = $("modalTitle");

const taskTitle = $("taskTitle");
const taskDescription = $("taskDescription");

const taskDateButton = $("taskDateButton");
const taskDateValue = $("taskDateValue");

const taskTimeButton = $("taskTimeButton");
const taskTimeValue = $("taskTimeValue");

const taskRepeatButton = $("taskRepeatButton");
const taskRepeatValue = $("taskRepeatValue");

const taskReminderButton = $("taskReminderButton");
const taskReminderValue = $("taskReminderValue");

const importantButton = $("importantButton");
const importantSwitch = $("importantSwitch");
const importantValue = $("importantValue");

const subtasksList = $("subtasksList");
const addSubtaskButton = $("addSubtaskButton");

const saveTaskButton = $("saveTaskButton");
const deleteTaskButton = $("deleteTaskButton");

/* DATE */

const datePicker = $("datePicker");
const datePickerBackdrop = $("datePickerBackdrop");
const dateInput = $("dateInput");
const confirmDate = $("confirmDate");
const closeDatePicker = $("closeDatePicker");

/* TIME */

const timePicker = $("timePicker");
const timePickerBackdrop = $("timePickerBackdrop");
const timeInput = $("timeInput");
const confirmTime = $("confirmTime");
const removeTime = $("removeTime");
const closeTimePicker = $("closeTimePicker");

/* REPEAT */

const repeatPicker = $("repeatPicker");
const repeatPickerBackdrop = $("repeatPickerBackdrop");
const closeRepeatPicker = $("closeRepeatPicker");

/* REMINDER */

const reminderPicker = $("reminderPicker");
const reminderPickerBackdrop =
  $("reminderPickerBackdrop");
const closeReminderPicker =
  $("closeReminderPicker");

/* CALENDAR */

const calendarPicker = $("calendarPicker");
const calendarPickerBackdrop =
  $("calendarPickerBackdrop");
const calendarInput = $("calendarInput");
const goToDate = $("goToDate");
const closeCalendarPicker =
  $("closeCalendarPicker");

/* =====================================================
   DATE RENDER
   ===================================================== */

function renderDate() {
  if (isToday(selectedDate)) {
    dateMain.textContent = "Сегодня";
  } else {
    dateMain.textContent =
      selectedDate.toLocaleDateString(
        "ru-RU",
        {
          day: "numeric",
          month: "long"
        }
      );
  }

  dateSmall.textContent =
    formatFullDate(selectedDate);
}

/* =====================================================
   TASK RENDER
   ===================================================== */

function renderTasks() {
  const list = getTasksForSelectedDate();
  const dateKey = getDateKey(selectedDate);

  tasksList.innerHTML = "";

  emptyState.classList.toggle(
    "hidden",
    list.length > 0
  );

  let completedCount = 0;

  list.forEach(task => {
    const completed =
      isTaskCompletedOnDate(
        task,
        dateKey
      );

    if (completed) {
      completedCount++;
    }

    const card =
      document.createElement("div");

    card.className = "task-card";

    if (completed) {
      card.classList.add("completed");
    }

    if (task.important) {
      card.classList.add("important");
    }

    /* CHECK */

    const check =
      document.createElement("button");

    check.className = "task-check";

    check.type = "button";

    check.textContent =
      completed ? "✓" : "";

    check.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        setTaskCompletedOnDate(
          task,
          dateKey,
          !completed
        );

        saveTasks();
        renderTasks();

      }
    );

    /* CONTENT */

    const content =
      document.createElement("div");

    content.className =
      "task-content";

    const title =
      document.createElement("div");

    title.className =
      "task-title";

    title.textContent =
      task.title || "Без названия";

    if (completed) {
      title.classList.add(
        "completed-text"
      );
    }

    content.appendChild(title);

    if (task.description) {

      const description =
        document.createElement("div");

      description.className =
        "task-description";

      description.textContent =
        task.description;

      content.appendChild(
        description
      );

    }

    /* META */

    const meta =
      document.createElement("div");

    meta.className =
      "task-meta";

    if (task.time) {

      const time =
        document.createElement("span");

      time.textContent =
        `🕐 ${task.time}`;

      meta.appendChild(time);

    }

    if (task.reminder &&
        task.reminder !== "none") {

      const reminder =
        document.createElement("span");

      reminder.textContent =
        `🔔 ${reminderText(
          task.reminder
        )}`;

      meta.appendChild(reminder);

    }

    if (task.repeat &&
        task.repeat !== "none") {

      const repeat =
        document.createElement("span");

      repeat.textContent =
        `🔁 ${repeatText(
          task.repeat
        )}`;

      meta.appendChild(repeat);

    }

    if (task.important) {

      const important =
        document.createElement("span");

      important.textContent =
        "⭐";

      meta.appendChild(
        important
      );

    }

    if (meta.children.length) {
      content.appendChild(meta);
    }

    /* SUBTASKS */

    if (
      Array.isArray(task.subtasks) &&
      task.subtasks.length
    ) {

      const subtaskInfo =
        document.createElement("div");

      subtaskInfo.className =
        "task-subtasks";

      const done =
        task.subtasks.filter(
          s => s.completed
        ).length;

      subtaskInfo.textContent =
        `Подзадачи: ${done}/${task.subtasks.length}`;

      content.appendChild(
        subtaskInfo
      );

    }

    /* OPEN */

    card.addEventListener(
      "click",
      () => openEditTask(task)
    );

    card.appendChild(check);
    card.appendChild(content);

    tasksList.appendChild(card);
  });

  progressCount.textContent =
    `${completedCount} / ${list.length}`;

  const progress =
    list.length
      ? (completedCount / list.length) * 100
      : 0;

  progressFill.style.width =
    `${progress}%`;
}

/* =====================================================
   MODAL
   ===================================================== */

function openModal() {
  taskModal.classList.remove(
    "hidden"
  );
}

function closeTaskModal() {
  taskModal.classList.add(
    "hidden"
  );
}

function openNewTask() {
  editingTaskId = null;

  modalTitle.textContent =
    "Новая задача";

  taskTitle.value = "";
  taskDescription.value = "";

  taskFormDate =
    getDateKey(selectedDate);

  taskFormTime = "";
  taskFormRepeat = "none";
  taskFormImportant = false;
  taskFormReminder = "none";

  subtasksList.innerHTML = "";

  deleteTaskButton.classList.add(
    "hidden"
  );

  updateFormUI();

  openModal();
}

function openEditTask(task) {
  editingTaskId =
    task.id;

  modalTitle.textContent =
    "Редактировать задачу";

  taskTitle.value =
    task.title || "";

  taskDescription.value =
    task.description || "";

  taskFormDate =
    task.date ||
    getDateKey(selectedDate);

  taskFormTime =
    task.time || "";

  taskFormRepeat =
    task.repeat || "none";

  taskFormImportant =
    Boolean(task.important);

  taskFormReminder =
    task.reminder || "none";

  subtasksList.innerHTML = "";

  if (
    Array.isArray(task.subtasks)
  ) {

    task.subtasks.forEach(
      subtask => {

        createSubtask(
          subtask.text,
          subtask.completed
        );

      }
    );

  }

  deleteTaskButton.classList.remove(
    "hidden"
  );

  updateFormUI();

  openModal();
}

/* =====================================================
   FORM UI
   ===================================================== */

function updateFormUI() {
  taskDateValue.textContent =
    taskFormDate
      ? dateFromKey(
          taskFormDate
        ).toLocaleDateString(
          "ru-RU",
          {
            day: "numeric",
            month: "long"
          }
        )
      : "Сегодня";

  taskTimeValue.textContent =
    taskFormTime ||
    "Без времени";

  taskRepeatValue.textContent =
    repeatText(
      taskFormRepeat
    );

  taskReminderValue.textContent =
    reminderText(
      taskFormReminder
    );

  importantValue.textContent =
    taskFormImportant
      ? "Включено"
      : "Выключено";

  importantSwitch.classList.toggle(
    "active",
    taskFormImportant
  );

  importantButton.classList.toggle(
    "active",
    taskFormImportant
  );
}

/* =====================================================
   SAVE TASK
   ===================================================== */

function collectSubtasks() {
  return [
    ...subtasksList.querySelectorAll(
      ".subtask-row"
    )
  ]
    .map(row => {

      const input =
        row.querySelector(
          ".subtask-input"
        );

      const check =
        row.querySelector(
          ".subtask-check"
        );

      return {
        text:
          input
            ? input.value.trim()
            : "",

        completed:
          Boolean(
            check &&
            check.classList.contains(
              "active"
            )
          )
      };

    })
    .filter(
      item =>
        item.text.length > 0
    );
}

function saveTask() {
  const title =
    taskTitle.value.trim();

  if (!title) {
    taskTitle.focus();
    return;
  }

  const subtasks =
    collectSubtasks();

  if (editingTaskId) {

    const task =
      tasks.find(
        item =>
          item.id ===
          editingTaskId
      );

    if (!task) return;

    task.title =
      title;

    task.description =
      taskDescription.value.trim();

    task.date =
      taskFormDate;

    task.time =
      taskFormTime;

    task.repeat =
      taskFormRepeat;

    task.important =
      taskFormImportant;

    task.reminder =
      taskFormReminder;

    task.subtasks =
      subtasks;

  } else {

    const task = {

      id:
        Date.now().toString(),

      title,

      description:
        taskDescription.value.trim(),

      date:
        taskFormDate,

      time:
        taskFormTime,

      repeat:
        taskFormRepeat,

      important:
        taskFormImportant,

      reminder:
        taskFormReminder,

      completed: false,

      completedDates: {},

      subtasks,

      createdAt:
        Date.now()

    };

    tasks.push(task);

  }

  saveTasks();

  closeTaskModal();

  renderTasks();
}

/* =====================================================
   DELETE
   ===================================================== */

function deleteCurrentTask() {
  if (!editingTaskId) return;

  const confirmed =
    confirm(
      "Удалить эту задачу?"
    );

  if (!confirmed) return;

  tasks =
    tasks.filter(
      task =>
        task.id !==
        editingTaskId
    );

  saveTasks();

  closeTaskModal();

  editingTaskId = null;

  renderTasks();
}

/* =====================================================
   SUBTASKS
   ===================================================== */

function createSubtask(
  text = "",
  completed = false
) {
  const row =
    document.createElement("div");

  row.className =
    "subtask-row";

  const check =
    document.createElement("button");

  check.type =
    "button";

  check.className =
    "subtask-check";

  if (completed) {
    check.classList.add(
      "active"
    );

    check.textContent =
      "✓";
  }

  const input =
    document.createElement("input");

  input.type =
    "text";

  input.className =
    "subtask-input";

  input.placeholder =
    "Подзадача";

  input.value =
    text;

  const remove =
    document.createElement("button");

  remove.type =
    "button";

  remove.className =
    "subtask-remove";

  remove.textContent =
    "×";

  check.addEventListener(
    "click",
    () => {

      check.classList.toggle(
        "active"
      );

      check.textContent =
        check.classList.contains(
          "active"
        )
          ? "✓"
          : "";

    }
  );

  remove.addEventListener(
    "click",
    () => {

      row.remove();

    }
  );

  row.appendChild(check);
  row.appendChild(input);
  row.appendChild(remove);

  subtasksList.appendChild(row);

  input.focus();
}

/* =====================================================
   DATE PICKER
   ===================================================== */

function openDatePicker() {
  dateInput.value =
    taskFormDate;

  datePicker.classList.remove(
    "hidden"
  );
}

function closeDatePickerWindow() {
  datePicker.classList.add(
    "hidden"
  );
}

function confirmSelectedDate() {
  if (dateInput.value) {
    taskFormDate =
      dateInput.value;
  }

  updateFormUI();
  closeDatePickerWindow();
}

/* =====================================================
   TIME PICKER
   ===================================================== */

function openTimePicker() {
  timeInput.value =
    taskFormTime;

  timePicker.classList.remove(
    "hidden"
  );
}

function closeTimePickerWindow() {
  timePicker.classList.add(
    "hidden"
  );
}

function confirmSelectedTime() {
  taskFormTime =
    timeInput.value || "";

  updateFormUI();

  closeTimePickerWindow();
}

function clearTime() {
  taskFormTime = "";
  taskFormReminder = "none";

  updateFormUI();

  closeTimePickerWindow();
}

/* =====================================================
   REPEAT PICKER
   ===================================================== */

function openRepeatPicker() {
  repeatPicker.classList.remove(
    "hidden"
  );

  document
    .querySelectorAll(
      ".repeat-option"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.repeat ===
          taskFormRepeat
      );

    });
}

function closeRepeatPickerWindow() {
  repeatPicker.classList.add(
    "hidden"
  );
}

/* =====================================================
   REMINDER PICKER
   ===================================================== */

function openReminderPicker() {
  reminderPicker.classList.remove(
    "hidden"
  );

  document
    .querySelectorAll(
      ".reminder-option"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.reminder ===
          taskFormReminder
      );

    });
}

function closeReminderPickerWindow() {
  reminderPicker.classList.add(
    "hidden"
  );
}

function selectReminder(value) {
  taskFormReminder =
    value;

  updateFormUI();

  closeReminderPickerWindow();
}

/* =====================================================
   CALENDAR
   ===================================================== */

function openCalendar() {
  calendarInput.value =
    getDateKey(
      selectedDate
    );

  calendarPicker.classList.remove(
    "hidden"
  );
}

function closeCalendarWindow() {
  calendarPicker.classList.add(
    "hidden"
  );
}

function goToSelectedDate() {
  if (!calendarInput.value) return;

  selectedDate =
    dateFromKey(
      calendarInput.value
    );

  renderDate();
  renderTasks();

  closeCalendarWindow();
}

/* =====================================================
   NAVIGATION
   ===================================================== */

function changeDay(amount) {
  selectedDate.setDate(
    selectedDate.getDate() +
      amount
  );

  renderDate();
  renderTasks();
}

function goToToday() {
  selectedDate =
    new Date();

  renderDate();
  renderTasks();
}

/* =====================================================
   EVENTS
   ===================================================== */

/* ADD */

addTaskButton.addEventListener(
  "click",
  openNewTask
);

/* MODAL */

closeModal.addEventListener(
  "click",
  closeTaskModal
);

modalBackdrop.addEventListener(
  "click",
  closeTaskModal
);

saveTaskButton.addEventListener(
  "click",
  saveTask
);

deleteTaskButton.addEventListener(
  "click",
  deleteCurrentTask
);

/* DATE */

taskDateButton.addEventListener(
  "click",
  openDatePicker
);

closeDatePicker.addEventListener(
  "click",
  closeDatePickerWindow
);

datePickerBackdrop.addEventListener(
  "click",
  closeDatePickerWindow
);

confirmDate.addEventListener(
  "click",
  confirmSelectedDate
);

/* TIME */

taskTimeButton.addEventListener(
  "click",
  openTimePicker
);

closeTimePicker.addEventListener(
  "click",
  closeTimePickerWindow
);

timePickerBackdrop.addEventListener(
  "click",
  closeTimePickerWindow
);

confirmTime.addEventListener(
  "click",
  confirmSelectedTime
);

removeTime.addEventListener(
  "click",
  clearTime
);

/* REPEAT */

taskRepeatButton.addEventListener(
  "click",
  openRepeatPicker
);

closeRepeatPicker.addEventListener(
  "click",
  closeRepeatPickerWindow
);

repeatPickerBackdrop.addEventListener(
  "click",
  closeRepeatPickerWindow
);

document
  .querySelectorAll(
    ".repeat-option"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        taskFormRepeat =
          button.dataset.repeat;

        updateFormUI();

        closeRepeatPickerWindow();

      }
    );

  });

/* REMINDER */

taskReminderButton.addEventListener(
  "click",
  openReminderPicker
);

closeReminderPicker.addEventListener(
  "click",
  closeReminderPickerWindow
);

reminderPickerBackdrop.addEventListener(
  "click",
  closeReminderPickerWindow
);

document
  .querySelectorAll(
    ".reminder-option"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectReminder(
          button.dataset.reminder
        );

      }
    );

  });

/* IMPORTANT */

importantButton.addEventListener(
  "click",
  () => {

    taskFormImportant =
      !taskFormImportant;

    updateFormUI();

  }
);

/* SUBTASK */

addSubtaskButton.addEventListener(
  "click",
  () => {
    createSubtask();
  }
);

/* DAYS */

previousDay.addEventListener(
  "click",
  () => {
    changeDay(-1);
  }
);

nextDay.addEventListener(
  "click",
  () => {
    changeDay(1);
  }
);

todayButton.addEventListener(
  "click",
  goToToday
);

/* CALENDAR */

calendarButton.addEventListener(
  "click",
  openCalendar
);

closeCalendarPicker.addEventListener(
  "click",
  closeCalendarWindow
);

calendarPickerBackdrop.addEventListener(
  "click",
  closeCalendarWindow
);

goToDate.addEventListener(
  "click",
  goToSelectedDate
);

/* =====================================================
   KEYBOARD
   ===================================================== */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
    ) {
      return;
    }

    taskModal.classList.add(
      "hidden"
    );

    datePicker.classList.add(
      "hidden"
    );

    timePicker.classList.add(
      "hidden"
    );

    repeatPicker.classList.add(
      "hidden"
    );

    reminderPicker.classList.add(
      "hidden"
    );

    calendarPicker.classList.add(
      "hidden"
    );

  }
);

/* =====================================================
   BOTTOM NAVIGATION
   ===================================================== */

document
  .querySelectorAll(
    ".nav-item"
  )
  .forEach(item => {

    item.addEventListener(
      "click",
      () => {

        const page =
          item.dataset.page;

        if (
          page !== "tasks"
        ) {

          alert(
            "Этот раздел сделаем следующим этапом."
          );

          return;

        }

        document
          .querySelectorAll(
            ".nav-item"
          )
          .forEach(nav =>
            nav.classList.remove(
              "active"
            )
          );

        item.classList.add(
          "active"
        );

      }
    );

  });

/* =====================================================
   EXTRA REMINDER STYLES
   ===================================================== */

function injectReminderStyles() {

  if (
    document.getElementById(
      "tracker-reminder-styles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "tracker-reminder-styles";

  style.textContent = `

    .reminder-option.selected {
      background: rgba(255,255,255,.09);
      font-weight: 600;
    }

    .task-card.completed {
      opacity: .65;
    }

    .task-title.completed-text {
      text-decoration: line-through;
    }

    .task-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
      font-size: 12px;
      opacity: .65;
    }

    .task-subtasks {
      margin-top: 6px;
      font-size: 12px;
      opacity: .55;
    }

    .subtask-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .subtask-check {
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 8px;
      background: transparent;
      color: inherit;
    }

    .subtask-check.active {
      background: rgba(255,255,255,.12);
    }

    .subtask-input {
      flex: 1;
      min-width: 0;
    }

    .subtask-remove {
      width: 28px;
      height: 28px;
      border: 0;
      background: transparent;
      color: inherit;
      opacity: .5;
      font-size: 20px;
    }

  `;

  document.head.appendChild(
    style
  );
}

/* =====================================================
   START
   ===================================================== */

injectReminderStyles();

loadTasks();

renderDate();

renderTasks();
