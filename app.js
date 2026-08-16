/* =====================================================
   TRACKER
   Автономная версия для GitHub Pages
   ===================================================== */


/* ================= STATE ================= */

let tasks = [];

let selectedDate = new Date();

let editingTaskId = null;

let taskFormDate = "";
let taskFormTime = "";
let taskFormRepeat = "none";
let taskFormImportant = false;


/* ================= STORAGE ================= */

const STORAGE_KEY = "tracker_tasks_v1";


function loadTasks() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      tasks = [];
      return;
    }

    const parsed =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      tasks = [];
      return;
    }

    /*
     * Миграция старых задач.
     * У старых задач completedDates ещё нет.
     */

    tasks = parsed.map(task => {

      let completedDates =
        task.completedDates;

      if (
        !completedDates ||
        typeof completedDates !== "object"
      ) {

        completedDates = {};

        if (
          task.completed &&
          task.date
        ) {

          completedDates[task.date] = true;

        }

      }

      return {
        ...task,
        completedDates
      };

    });

  } catch (error) {

    console.error(
      "Ошибка загрузки задач:",
      error
    );

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

    console.error(
      "Ошибка сохранения задач:",
      error
    );

  }

}


/* ================= HELPERS ================= */

function pad(number) {

  return String(number)
    .padStart(2, "0");

}


function getDateKey(date) {

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-");

}


function dateFromKey(key) {

  const [
    year,
    month,
    day
  ] = key.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );

}


function isToday(date) {

  const today =
    new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&

    date.getMonth() ===
      today.getMonth() &&

    date.getDate() ===
      today.getDate()
  );

}


function isSameDate(
  first,
  second
) {

  return (
    first.getFullYear() ===
      second.getFullYear() &&

    first.getMonth() ===
      second.getMonth() &&

    first.getDate() ===
      second.getDate()
  );

}


function formatFullDate(date) {

  return date.toLocaleDateString(
    "ru-RU",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  );

}


function formatShortDate(key) {

  const date =
    dateFromKey(key);

  if (isToday(date)) {
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


function repeatText(repeat) {

  const values = {

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
    values[repeat] ||
    "Не повторять"
  );

}


/* ================= REPEAT LOGIC ================= */

/*
 * Проверяет, должна ли задача показываться
 * на конкретной дате.
 */

function taskOccursOnDate(
  task,
  dateKey
) {

  if (
    !task ||
    !task.date
  ) {

    return false;

  }

  const start =
    dateFromKey(task.date);

  const target =
    dateFromKey(dateKey);


  /*
   * До даты начала задача
   * не существует.
   */

  if (target < start) {

    return false;

  }


  const repeat =
    task.repeat || "none";


  /*
   * Обычная одноразовая задача.
   */

  if (repeat === "none") {

    return (
      dateKey === task.date
    );

  }


  /*
   * Каждый день.
   */

  if (repeat === "daily") {

    return true;

  }


  /*
   * По будням.
   */

  if (repeat === "weekdays") {

    const day =
      target.getDay();

    return (
      day >= 1 &&
      day <= 5
    );

  }


  /*
   * Каждую неделю.
   *
   * Например задача создана
   * в понедельник.
   * Она появляется каждый понедельник.
   */

  if (repeat === "weekly") {

    return (
      start.getDay() ===
      target.getDay()
    );

  }


  /*
   * Каждый месяц.
   *
   * Например создана 16 числа.
   * Появляется 16-го каждого месяца.
   */

  if (repeat === "monthly") {

    return (
      start.getDate() ===
      target.getDate()
    );

  }


  return false;

}


/*
 * Получает задачи выбранного дня.
 */

function getTasksForSelectedDate() {

  const key =
    getDateKey(selectedDate);

  return tasks.filter(
    task =>
      taskOccursOnDate(
        task,
        key
      )
  );

}


/* ================= COMPLETION ================= */

/*
 * Получить состояние выполнения
 * задачи именно для выбранной даты.
 */

function isTaskCompletedOnDate(
  task,
  dateKey
) {

  if (
    task.completedDates &&
    typeof task.completedDates === "object"
  ) {

    return Boolean(
      task.completedDates[dateKey]
    );

  }


  /*
   * Совместимость со старыми задачами.
   */

  return Boolean(
    task.completed &&
    task.date === dateKey
  );

}


/*
 * Установить выполнение задачи
 * для конкретного дня.
 */

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

    task.completedDates[
      dateKey
    ] = true;

  } else {

    delete task.completedDates[
      dateKey
    ];

  }


  /*
   * Оставляем старое поле
   * для совместимости.
   */

  task.completed =
    Boolean(
      task.completedDates[
        dateKey
      ]
    );

}


/* ================= ELEMENTS ================= */

const dateMain =
  document.getElementById(
    "dateMain"
  );

const dateSmall =
  document.getElementById(
    "dateSmall"
  );

const previousDay =
  document.getElementById(
    "previousDay"
  );

const nextDay =
  document.getElementById(
    "nextDay"
  );

const todayButton =
  document.getElementById(
    "todayButton"
  );

const calendarButton =
  document.getElementById(
    "calendarButton"
  );

const tasksList =
  document.getElementById(
    "tasksList"
  );

const emptyState =
  document.getElementById(
    "emptyState"
  );

const progressFill =
  document.getElementById(
    "progressFill"
  );

const progressCount =
  document.getElementById(
    "progressCount"
  );

const addTaskButton =
  document.getElementById(
    "addTaskButton"
  );


/* ================= MODAL ================= */

const taskModal =
  document.getElementById(
    "taskModal"
  );

const modalBackdrop =
  document.getElementById(
    "modalBackdrop"
  );

const closeModal =
  document.getElementById(
    "closeModal"
  );

const modalTitle =
  document.getElementById(
    "modalTitle"
  );

const taskTitle =
  document.getElementById(
    "taskTitle"
  );

const taskDescription =
  document.getElementById(
    "taskDescription"
  );

const taskDateButton =
  document.getElementById(
    "taskDateButton"
  );

const taskDateValue =
  document.getElementById(
    "taskDateValue"
  );

const taskTimeButton =
  document.getElementById(
    "taskTimeButton"
  );

const taskTimeValue =
  document.getElementById(
    "taskTimeValue"
  );

const taskRepeatButton =
  document.getElementById(
    "taskRepeatButton"
  );

const taskRepeatValue =
  document.getElementById(
    "taskRepeatValue"
  );

const importantButton =
  document.getElementById(
    "importantButton"
  );

const importantSwitch =
  document.getElementById(
    "importantSwitch"
  );

const importantValue =
  document.getElementById(
    "importantValue"
  );

const subtasksList =
  document.getElementById(
    "subtasksList"
  );

const addSubtaskButton =
  document.getElementById(
    "addSubtaskButton"
  );

const saveTaskButton =
  document.getElementById(
    "saveTaskButton"
  );

const deleteTaskButton =
  document.getElementById(
    "deleteTaskButton"
  );


/* ================= DATE PICKER ================= */

const datePicker =
  document.getElementById(
    "datePicker"
  );

const datePickerBackdrop =
  document.getElementById(
    "datePickerBackdrop"
  );

const dateInput =
  document.getElementById(
    "dateInput"
  );

const confirmDate =
  document.getElementById(
    "confirmDate"
  );

const closeDatePicker =
  document.getElementById(
    "closeDatePicker"
  );


/* ================= TIME PICKER ================= */

const timePicker =
  document.getElementById(
    "timePicker"
  );

const timePickerBackdrop =
  document.getElementById(
    "timePickerBackdrop"
  );

const timeInput =
  document.getElementById(
    "timeInput"
  );

const confirmTime =
  document.getElementById(
    "confirmTime"
  );

const removeTime =
  document.getElementById(
    "removeTime"
  );

const closeTimePicker =
  document.getElementById(
    "closeTimePicker"
  );


/* ================= REPEAT PICKER ================= */

const repeatPicker =
  document.getElementById(
    "repeatPicker"
  );

const repeatPickerBackdrop =
  document.getElementById(
    "repeatPickerBackdrop"
  );

const closeRepeatPicker =
  document.getElementById(
    "closeRepeatPicker"
  );


/* ================= CALENDAR ================= */

const calendarPicker =
  document.getElementById(
    "calendarPicker"
  );

const calendarPickerBackdrop =
  document.getElementById(
    "calendarPickerBackdrop"
  );

const calendarInput =
  document.getElementById(
    "calendarInput"
  );

const goToDate =
  document.getElementById(
    "goToDate"
  );

const closeCalendarPicker =
  document.getElementById(
    "closeCalendarPicker"
  );


/* ================= DATE RENDER ================= */

function renderDate() {

  if (isToday(selectedDate)) {

    dateMain.textContent =
      "Сегодня";

  } else {

    const weekday =
      selectedDate.toLocaleDateString(
        "ru-RU",
        {
          weekday: "long"
        }
      );

    dateMain.textContent =
      weekday
        .charAt(0)
        .toUpperCase() +
      weekday.slice(1);

  }


  dateSmall.textContent =
    formatFullDate(
      selectedDate
    );

}


/* ================= RENDER TASKS ================= */

function renderTasks() {

  const currentTasks =
    getTasksForSelectedDate();


  tasksList.innerHTML =
    "";


  /*
   * Empty state.
   */

  if (
    currentTasks.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

  } else {

    emptyState.classList.add(
      "hidden"
    );

  }


  let completed = 0;


  const currentDateKey =
    getDateKey(
      selectedDate
    );


  currentTasks.forEach(
    task => {

      const taskCompleted =
        isTaskCompletedOnDate(
          task,
          currentDateKey
        );


      if (taskCompleted) {

        completed++;

      }


      /*
       * CARD
       */

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "task-card";


      if (taskCompleted) {

        card.classList.add(
          "completed"
        );

      }


      if (task.important) {

        card.classList.add(
          "important"
        );

      }


      /*
       * CHECK
       */

      const check =
        document.createElement(
          "button"
        );

      check.className =
        "task-check";

      check.type =
        "button";

      check.textContent =
        taskCompleted
          ? "✓"
          : "";


      check.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          toggleTask(
            task.id
          );

        }
      );


      /*
       * CONTENT
       */

      const content =
        document.createElement(
          "div"
        );

      content.className =
        "task-content";


      /*
       * TITLE
       */

      const title =
        document.createElement(
          "div"
        );

      title.className =
        "task-title";

      title.textContent =
        task.title;


      content.appendChild(
        title
      );


      /*
       * DESCRIPTION
       */

      if (task.description) {

        const description =
          document.createElement(
            "div"
          );

        description.className =
          "task-description";

        description.textContent =
          task.description;

        content.appendChild(
          description
        );

      }


      /*
       * INFO
       */

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "task-info";


      /*
       * TIME
       */

      if (task.time) {

        const time =
          document.createElement(
            "span"
          );

        time.textContent =
          "🕐 " +
          task.time;

        info.appendChild(
          time
        );

      }


      /*
       * REPEAT
       */

      if (
        task.repeat &&
        task.repeat !== "none"
      ) {

        const repeat =
          document.createElement(
            "span"
          );

        repeat.textContent =
          "🔁 " +
          repeatText(
            task.repeat
          );

        info.appendChild(
          repeat
        );

      }


      /*
       * IMPORTANT
       */

      if (task.important) {

        const star =
          document.createElement(
            "span"
          );

        star.className =
          "task-star";

        star.textContent =
          "★";

        info.appendChild(
          star
        );

      }


      /*
       * SUBTASK COUNT
       */

      if (
        Array.isArray(
          task.subtasks
        ) &&
        task.subtasks.length > 0
      ) {

        const subtasks =
          document.createElement(
            "span"
          );

        subtasks.textContent =
          "☷ " +
          task.subtasks.length;

        info.appendChild(
          subtasks
        );

      }


      if (
        info.children.length > 0
      ) {

        content.appendChild(
          info
        );

      }


      card.appendChild(
        check
      );

      card.appendChild(
        content
      );


      /*
       * CLICK CARD = EDIT
       */

      card.addEventListener(
        "click",
        () => {

          openEditTask(
            task.id
          );

        }
      );


      tasksList.appendChild(
        card
      );

    }
  );


  /*
   * PROGRESS
   */

  const total =
    currentTasks.length;


  const percent =
    total === 0
      ? 0
      : Math.round(
          (
            completed /
            total
          ) *
          100
        );


  progressCount.textContent =
    `${completed} / ${total}`;


  progressFill.style.width =
    `${percent}%`;

}


/* ================= TOGGLE TASK ================= */

function toggleTask(id) {

  const task =
    tasks.find(
      item =>
        item.id === id
    );


  if (!task) {

    return;

  }


  const dateKey =
    getDateKey(
      selectedDate
    );


  const current =
    isTaskCompletedOnDate(
      task,
      dateKey
    );


  setTaskCompletedOnDate(
    task,
    dateKey,
    !current
  );


  saveTasks();

  renderTasks();

}


/* ================= RESET FORM ================= */

function resetForm() {

  editingTaskId =
    null;


  taskFormDate =
    getDateKey(
      selectedDate
    );


  taskFormTime =
    "";


  taskFormRepeat =
    "none";


  taskFormImportant =
    false;


  taskTitle.value =
    "";


  taskDescription.value =
    "";


  modalTitle.textContent =
    "Новая задача";


  saveTaskButton.textContent =
    "Сохранить";


  deleteTaskButton.classList.add(
    "hidden"
  );


  subtasksList.innerHTML =
    "";


  updateFormUI();

}


/* ================= UPDATE FORM UI ================= */

function updateFormUI() {

  taskDateValue.textContent =
    formatShortDate(
      taskFormDate
    );


  taskTimeValue.textContent =
    taskFormTime ||
    "Без времени";


  taskRepeatValue.textContent =
    repeatText(
      taskFormRepeat
    );


  importantValue.textContent =
    taskFormImportant
      ? "Включено"
      : "Выключено";


  importantSwitch.classList.toggle(
    "active",
    taskFormImportant
  );


  document
    .querySelectorAll(
      ".repeat-option"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "selected",
          button.dataset.repeat ===
            taskFormRepeat
        );

      }
    );

}


/* ================= OPEN NEW TASK ================= */

function openNewTask() {

  resetForm();


  taskModal.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      taskTitle.focus();

    },
    100
  );

}


/* ================= OPEN EDIT TASK ================= */

function openEditTask(id) {

  const task =
    tasks.find(
      item =>
        item.id === id
    );


  if (!task) {

    return;

  }


  editingTaskId =
    id;


  taskFormDate =
    task.date;


  taskFormTime =
    task.time || "";


  taskFormRepeat =
    task.repeat || "none";


  taskFormImportant =
    Boolean(
      task.important
    );


  taskTitle.value =
    task.title || "";


  taskDescription.value =
    task.description || "";


  modalTitle.textContent =
    "Редактировать задачу";


  saveTaskButton.textContent =
    "Сохранить";


  deleteTaskButton.classList.remove(
    "hidden"
  );


  subtasksList.innerHTML =
    "";


  if (
    Array.isArray(
      task.subtasks
    )
  ) {

    task.subtasks.forEach(
      subtask => {

        /*
         * Поддерживаем как строки,
         * так и будущие объекты.
         */

        if (
          typeof subtask ===
          "string"
        ) {

          createSubtask(
            subtask
          );

        } else {

          createSubtask(
            subtask.text || ""
          );

        }

      }
    );

  }


  updateFormUI();


  taskModal.classList.remove(
    "hidden"
  );

}


/* ================= CLOSE MODAL ================= */

function closeTaskModal() {

  taskModal.classList.add(
    "hidden"
  );

}


/* ================= SAVE TASK ================= */

function saveTask() {

  const title =
    taskTitle.value.trim();


  if (!title) {

    taskTitle.focus();

    return;

  }


  const description =
    taskDescription.value.trim();


  const subtasks =
    Array.from(
      subtasksList.querySelectorAll(
        ".subtask-input"
      )
    )
      .map(
        input =>
          input.value.trim()
      )
      .filter(
        value =>
          value.length > 0
      );


  /*
   * EDIT
   */

  if (
    editingTaskId !== null
  ) {

    const task =
      tasks.find(
        item =>
          item.id ===
          editingTaskId
      );


    if (!task) {

      return;

    }


    task.title =
      title;


    task.description =
      description;


    task.date =
      taskFormDate;


    task.time =
      taskFormTime;


    task.repeat =
      taskFormRepeat;


    task.important =
      taskFormImportant;


    task.subtasks =
      subtasks;


    /*
     * Если у старой задачи
     * не было completedDates,
     * создаём его.
     */

    if (
      !task.completedDates ||
      typeof task.completedDates !== "object"
    ) {

      task.completedDates = {};

      if (
        task.completed &&
        task.date
      ) {

        task.completedDates[
          task.date
        ] = true;

      }

    }

  }


  /*
   * NEW
   */

  else {

    tasks.push({

      id:
        Date.now(),

      title,

      description,

      date:
        taskFormDate,

      time:
        taskFormTime,

      repeat:
        taskFormRepeat,

      important:
        taskFormImportant,

      completed:
        false,

      completedDates:
        {},

      subtasks

    });

  }


  saveTasks();

  closeTaskModal();

  renderTasks();

}


/* ================= DELETE ================= */

function deleteCurrentTask() {

  if (
    editingTaskId === null
  ) {

    return;

  }


  const confirmed =
    window.confirm(
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

function createSubtask(
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


  input.type =
    "text";


  input.placeholder =
    "Подзадача";


  input.value =
    value;


  input.maxLength =
    200;


  const remove =
    document.createElement(
      "button"
    );


  remove.className =
    "subtask-remove";


  remove.type =
    "button";


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


  subtasksList.appendChild(
    row
  );

}


/* ================= DATE PICKER ================= */

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

  if (
    dateInput.value
  ) {

    taskFormDate =
      dateInput.value;

    updateFormUI();

  }


  closeDatePickerWindow();

}


/* ================= TIME PICKER ================= */

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

  taskFormTime =
    "";


  updateFormUI();

  closeTimePickerWindow();

}


/* ================= REPEAT PICKER ================= */

function openRepeatPicker() {

  updateFormUI();


  repeatPicker.classList.remove(
    "hidden"
  );

}


function closeRepeatPickerWindow() {

  repeatPicker.classList.add(
    "hidden"
  );

}


/* ================= CALENDAR ================= */

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

  if (
    !calendarInput.value
  ) {

    return;

  }


  selectedDate =
    dateFromKey(
      calendarInput.value
    );


  renderDate();

  renderTasks();

  closeCalendarWindow();

}


/* ================= DAY NAVIGATION ================= */

function changeDay(
  amount
) {

  selectedDate.setDate(
    selectedDate.getDate() +
      amount
  );


  renderDate();

  renderTasks();

}


/* ================= TODAY ================= */

function goToToday() {

  selectedDate =
    new Date();


  renderDate();

  renderTasks();

}


/* ================= EVENTS ================= */


/* ADD */

addTaskButton.addEventListener(
  "click",
  openNewTask
);


/* CLOSE */

closeModal.addEventListener(
  "click",
  closeTaskModal
);


modalBackdrop.addEventListener(
  "click",
  closeTaskModal
);


/* SAVE */

saveTaskButton.addEventListener(
  "click",
  saveTask
);


/* DELETE */

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
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          taskFormRepeat =
            button.dataset.repeat;


          updateFormUI();

          closeRepeatPickerWindow();

        }
      );

    }
  );


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


/* DAY */

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


/* TODAY */

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


/* ================= KEYBOARD ================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

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

      calendarPicker.classList.add(
        "hidden"
      );

    }

  }
);


/* ================= BOTTOM NAV ================= */

document
  .querySelectorAll(
    ".nav-item"
  )
  .forEach(
    item => {

      item.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".nav-item"
            )
            .forEach(
              nav => {

                nav.classList.remove(
                  "active"
                );

              }
            );


          item.classList.add(
            "active"
          );


          const page =
            item.dataset.page;


          if (
            page !== "tasks"
          ) {

            alert(
              "Этот раздел сделаем следующим этапом."
            );


            document
              .querySelectorAll(
                ".nav-item"
              )
              .forEach(
                nav => {

                  nav.classList.remove(
                    "active"
                  );

                }
              );


            const tasksNav =
              document.querySelector(
                '[data-page="tasks"]'
              );


            if (tasksNav) {

              tasksNav.classList.add(
                "active"
              );

            }

          }

        }
      );

    }
  );


/* ================= INITIALIZE ================= */

loadTasks();

renderDate();

renderTasks();
