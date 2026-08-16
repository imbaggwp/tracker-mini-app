/* =====================================================
   TRACKER
   Задачи + повторения + календарь
   ===================================================== */


/* ================= STATE ================= */

let tasks = [];

let selectedDate = new Date();

let editingTaskId = null;

let taskFormDate = "";
let taskFormTime = "";
let taskFormRepeat = "none";
let taskFormImportant = false;

let calendarDate = new Date();


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

    tasks =
      parsed.map(task => {

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

            completedDates[
              task.date
            ] = true;

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
      "Ошибка сохранения:",
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

  const parts =
    key.split("-").map(Number);

  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
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


/* ================= REPEAT ================= */

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
    dateFromKey(
      task.date
    );

  const target =
    dateFromKey(
      dateKey
    );


  if (target < start) {

    return false;

  }


  const repeat =
    task.repeat || "none";


  if (repeat === "none") {

    return (
      dateKey === task.date
    );

  }


  if (repeat === "daily") {

    return true;

  }


  if (repeat === "weekdays") {

    const day =
      target.getDay();

    return (
      day >= 1 &&
      day <= 5
    );

  }


  if (repeat === "weekly") {

    return (
      start.getDay() ===
      target.getDay()
    );

  }


  if (repeat === "monthly") {

    return (
      start.getDate() ===
      target.getDate()
    );

  }


  return false;

}


function getTasksForDate(
  dateKey
) {

  return tasks.filter(
    task =>
      taskOccursOnDate(
        task,
        dateKey
      )
  );

}


function getTasksForSelectedDate() {

  return getTasksForDate(
    getDateKey(
      selectedDate
    )
  );

}


/* ================= COMPLETION ================= */

function isTaskCompletedOnDate(
  task,
  dateKey
) {

  if (
    task.completedDates &&
    typeof task.completedDates === "object"
  ) {

    return Boolean(
      task.completedDates[
        dateKey
      ]
    );

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

    task.completedDates[
      dateKey
    ] = true;

  } else {

    delete task.completedDates[
      dateKey
    ];

  }


  task.completed =
    completed;

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


/* ================= PICKERS ================= */

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

const calendarOverlay =
  document.getElementById(
    "calendarOverlay"
  );

const calendarBackdrop =
  document.getElementById(
    "calendarBackdrop"
  );

const closeCalendar =
  document.getElementById(
    "closeCalendar"
  );

const calendarToday =
  document.getElementById(
    "calendarToday"
  );

const calendarPrevMonth =
  document.getElementById(
    "calendarPrevMonth"
  );

const calendarNextMonth =
  document.getElementById(
    "calendarNextMonth"
  );

const calendarMonthLabel =
  document.getElementById(
    "calendarMonthLabel"
  );

const calendarGrid =
  document.getElementById(
    "calendarGrid"
  );


/* ================= DATE HEADER ================= */

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


/* ================= TASK RENDER ================= */

function renderTasks() {

  const currentTasks =
    getTasksForSelectedDate();


  tasksList.innerHTML =
    "";


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


  const dateKey =
    getDateKey(
      selectedDate
    );


  currentTasks.forEach(
    task => {

      const taskCompleted =
        isTaskCompletedOnDate(
          task,
          dateKey
        );


      if (taskCompleted) {

        completed++;

      }


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


      const content =
        document.createElement(
          "div"
        );


      content.className =
        "task-content";


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


      const info =
        document.createElement(
          "div"
        );


      info.className =
        "task-info";


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


      if (task.important) {

        const star =
          document.createElement(
            "span"
          );

        star.textContent =
          "★";

        star.className =
          "task-star";

        info.appendChild(
          star
        );

      }


      if (
        Array.isArray(
          task.subtasks
        ) &&
        task.subtasks.length
      ) {

        const subtaskInfo =
          document.createElement(
            "span"
          );

        subtaskInfo.textContent =
          "☷ " +
          task.subtasks.length;

        info.appendChild(
          subtaskInfo
        );

      }


      if (
        info.children.length
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


  progressCount.textContent =
    `${completed} / ${currentTasks.length}`;


  const percent =
    currentTasks.length
      ? Math.round(
          (
            completed /
            currentTasks.length
          ) *
          100
        )
      : 0;


  progressFill.style.width =
    `${percent}%`;

}


/* ================= TOGGLE ================= */

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


  const completed =
    isTaskCompletedOnDate(
      task,
      dateKey
    );


  setTaskCompletedOnDate(
    task,
    dateKey,
    !completed
  );


  saveTasks();

  renderTasks();

  renderCalendar();

}


/* ================= FORM ================= */

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

        createSubtask(
          typeof subtask ===
            "string"
            ? subtask
            : subtask.text || ""
        );

      }
    );

  }


  updateFormUI();

  taskModal.classList.remove(
    "hidden"
  );

}


function closeTaskModal() {

  taskModal.classList.add(
    "hidden"
  );

}


/* ================= SAVE ================= */

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
          value
      );


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


    if (
      !task.completedDates ||
      typeof task.completedDates !== "object"
    ) {

      task.completedDates = {};

    }

  } else {

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

  renderCalendar();

}


function deleteCurrentTask() {

  if (
    editingTaskId === null
  ) {

    return;

  }


  if (
    !confirm(
      "Удалить эту задачу?"
    )
  ) {

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

  renderCalendar();

}


/* ================= SUBTASKS ================= */

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


/* ================= TIME ================= */

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


/* ================= REPEAT ================= */

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

  calendarDate =
    new Date(
      selectedDate
    );

  renderCalendar();

  calendarOverlay.classList.remove(
    "hidden"
  );

}


function closeCalendarWindow() {

  calendarOverlay.classList.add(
    "hidden"
  );

}


/*
 * Создаёт сетку месяца.
 */

function renderCalendar() {

  if (!calendarGrid) {

    return;

  }


  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();


  const monthName =
    calendarDate.toLocaleDateString(
      "ru-RU",
      {
        month: "long",
        year: "numeric"
      }
    );


  calendarMonthLabel.textContent =
    monthName
      .charAt(0)
      .toUpperCase() +
    monthName.slice(1);


  calendarTitle.textContent =
    "Календарь";


  calendarGrid.innerHTML =
    "";


  /*
   * Первый день месяца.
   *
   * JS:
   * воскресенье = 0
   *
   * Нам нужно:
   * понедельник = 0
   */

  const firstDay =
    new Date(
      year,
      month,
      1
    );


  let startDay =
    firstDay.getDay();


  if (
    startDay === 0
  ) {

    startDay = 6;

  } else {

    startDay--;

  }


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  /*
   * Дни предыдущего месяца.
   */

  const previousMonthDays =
    new Date(
      year,
      month,
      0
    ).getDate();


  for (
    let i = startDay - 1;
    i >= 0;
    i--
  ) {

    const day =
      previousMonthDays -
      i;


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    createCalendarDay(
      date,
      true
    );

  }


  /*
   * Дни текущего месяца.
   */

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      new Date(
        year,
        month,
        day
      );


    createCalendarDay(
      date,
      false
    );

  }


  /*
   * Следующий месяц.
   */

  const cells =
    calendarGrid.children.length;


  const remaining =
    cells % 7 === 0
      ? 0
      : 7 -
        (
          cells % 7
        );


  for (
    let day = 1;
    day <= remaining;
    day++
  ) {

    const date =
      new Date(
        year,
        month + 1,
        day
      );


    createCalendarDay(
      date,
      true
    );

  }

}


/*
 * Создаёт один день календаря.
 */

function createCalendarDay(
  date,
  outsideMonth
) {

  const key =
    getDateKey(
      date
    );


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "calendar-day";


  if (outsideMonth) {

    button.classList.add(
      "outside"
    );

  }


  if (
    isToday(date)
  ) {

    button.classList.add(
      "today"
    );

  }


  if (
    isSameDate(
      date,
      selectedDate
    )
  ) {

    button.classList.add(
      "selected"
    );

  }


  const dayTasks =
    getTasksForDate(
      key
    );


  const hasTasks =
    dayTasks.length > 0;


  const hasCompleted =
    dayTasks.some(
      task =>
        isTaskCompletedOnDate(
          task,
          key
        )
    );


  if (hasTasks) {

    button.classList.add(
      "has-tasks"
    );

  }


  if (hasCompleted) {

    button.classList.add(
      "has-completed"
    );

  }


  const number =
    document.createElement(
      "span"
    );


  number.className =
    "calendar-day-number";


  number.textContent =
    date.getDate();


  button.appendChild(
    number
  );


  if (
    hasTasks
  ) {

    const dot =
      document.createElement(
        "span"
      );


    dot.className =
      "calendar-day-dot";


    button.appendChild(
      dot
    );

  }


  button.addEventListener(
    "click",
    () => {

      selectedDate =
        new Date(
          date
        );


      renderDate();

      renderTasks();

      renderCalendar();

      closeCalendarWindow();

    }
  );


  calendarGrid.appendChild(
    button
  );

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


function goToToday() {

  selectedDate =
    new Date();


  renderDate();

  renderTasks();

}


/* ================= EVENTS ================= */

addTaskButton.addEventListener(
  "click",
  openNewTask
);


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


closeCalendar.addEventListener(
  "click",
  closeCalendarWindow
);


calendarBackdrop.addEventListener(
  "click",
  closeCalendarWindow
);


calendarToday.addEventListener(
  "click",
  () => {

    selectedDate =
      new Date();

    calendarDate =
      new Date();

    renderDate();

    renderTasks();

    renderCalendar();

  }
);


calendarPrevMonth.addEventListener(
  "click",
  () => {

    calendarDate.setMonth(
      calendarDate.getMonth() - 1
    );

    renderCalendar();

  }
);


calendarNextMonth.addEventListener(
  "click",
  () => {

    calendarDate.setMonth(
      calendarDate.getMonth() + 1
    );

    renderCalendar();

  }
);


/* ================= NAVIGATION ================= */

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


          if (
            item.dataset.page !==
            "tasks"
          ) {

            alert(
              "Этот раздел сделаем следующим этапом."
            );


            item.classList.remove(
              "active"
            );


            document
              .querySelector(
                '[data-page="tasks"]'
              )
              .classList.add(
                "active"
              );

          }

        }
      );

    }
  );


/* ================= KEYBOARD ================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeTaskModal();

      closeDatePickerWindow();

      closeTimePickerWindow();

      closeRepeatPickerWindow();

      closeCalendarWindow();

    }

  }
);


/* ================= INIT ================= */

loadTasks();

renderDate();

renderTasks();
