/* =====================================================
   TRACKER
   Версия с подзадачами и напоминаниями
   GitHub Pages
   ===================================================== */


/* ================= STATE ================= */

let tasks = [];

let selectedDate = new Date();

let editingTaskId = null;

let taskFormDate = "";
let taskFormTime = "";
let taskFormRepeat = "none";
let taskFormImportant = false;
let taskFormReminder = "none";


/* ================= STORAGE ================= */

const STORAGE_KEY = "tracker_tasks_v1";


function loadTasks() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

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


        let subtasks = [];


        if (
          Array.isArray(
            task.subtasks
          )
        ) {

          subtasks =
            task.subtasks
              .map(
                subtask => {

                  if (
                    typeof subtask ===
                    "string"
                  ) {

                    return {
                      text: subtask,
                      completed: false
                    };

                  }


                  return {
                    text:
                      subtask.text || "",

                    completed:
                      Boolean(
                        subtask.completed
                      )
                  };

                }
              )
              .filter(
                subtask =>
                  subtask.text
                    .trim()
                    .length > 0
              );

        }


        return {

          ...task,

          completedDates,

          subtasks,

          reminder:
            task.reminder ||
            "none"

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

    pad(
      date.getMonth() + 1
    ),

    pad(
      date.getDate()
    )

  ].join("-");

}


function dateFromKey(key) {

  const [
    year,
    month,
    day
  ] =
    key
      .split("-")
      .map(Number);


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


  if (
    isToday(date)
  ) {

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


/* ================= REPEAT ================= */

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


  if (
    target < start
  ) {

    return false;

  }


  const repeat =
    task.repeat ||
    "none";


  if (
    repeat === "none"
  ) {

    return (
      dateKey ===
      task.date
    );

  }


  if (
    repeat === "daily"
  ) {

    return true;

  }


  if (
    repeat === "weekdays"
  ) {

    const day =
      target.getDay();


    return (
      day >= 1 &&
      day <= 5
    );

  }


  if (
    repeat === "weekly"
  ) {

    return (
      start.getDay() ===
      target.getDay()
    );

  }


  if (
    repeat === "monthly"
  ) {

    return (
      start.getDate() ===
      target.getDate()
    );

  }


  return false;

}


function getTasksForSelectedDate() {

  const key =
    getDateKey(
      selectedDate
    );


  return tasks.filter(
    task =>
      taskOccursOnDate(
        task,
        key
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
    typeof task.completedDates ===
      "object"
  ) {

    return Boolean(
      task.completedDates[
        dateKey
      ]
    );

  }


  return Boolean(
    task.completed &&
    task.date ===
      dateKey
  );

}


function setTaskCompletedOnDate(
  task,
  dateKey,
  completed
) {

  if (
    !task.completedDates ||
    typeof task.completedDates !==
      "object"
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
    Boolean(
      task.completedDates[
        dateKey
      ]
    );

}


/* ================= REMINDERS ================= */

const reminderOptions = {

  none:
    "Без напоминания",

  at:
    "В момент события",

  "5m":
    "За 5 минут",

  "10m":
    "За 10 минут",

  "15m":
    "За 15 минут",

  "30m":
    "За 30 минут",

  "1h":
    "За 1 час"

};


function reminderText(
  value
) {

  return (
    reminderOptions[value] ||
    "Без напоминания"
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


/* ================= REMINDER UI ================= */

let reminderRow = null;
let reminderValueElement = null;
let reminderPicker = null;
let reminderPickerBackdrop = null;
let closeReminderPicker = null;


/* ================= CREATE REMINDER UI ================= */

function createReminderUI() {

  if (
    document.getElementById(
      "taskReminderButton"
    )
  ) {

    return;

  }


  const anchor =
    taskRepeatButton.closest(
      ".form-row"
    ) ||
    taskRepeatButton.parentElement;


  if (!anchor) {
    return;
  }


  reminderRow =
    document.createElement(
      "div"
    );

  reminderRow.className =
    "form-row";


  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.id =
    "taskReminderButton";

  button.className =
    "task-setting-button";


  button.innerHTML = `
    <span class="task-setting-icon">🔔</span>
    <span class="task-setting-content">
      <span class="task-setting-title">
        Напоминание
      </span>
      <span
        id="taskReminderValue"
        class="task-setting-value"
      >
        Без напоминания
      </span>
    </span>
    <span class="task-setting-arrow">›</span>
  `;


  reminderRow.appendChild(
    button
  );


  anchor.insertAdjacentElement(
    "afterend",
    reminderRow
  );


  reminderValueElement =
    document.getElementById(
      "taskReminderValue"
    );


  button.addEventListener(
    "click",
    openReminderPicker
  );


  createReminderPicker();

}


/* ================= REMINDER PICKER ================= */

function createReminderPicker() {

  reminderPicker =
    document.createElement(
      "div"
    );

  reminderPicker.id =
    "reminderPicker";

  reminderPicker.className =
    "modal hidden";


  reminderPicker.innerHTML = `

    <div
      class="modal-backdrop"
      id="reminderPickerBackdrop"
    ></div>

    <div class="modal-content">

      <div class="modal-header">

        <h2>
          Напоминание
        </h2>

        <button
          type="button"
          class="modal-close"
          id="closeReminderPicker"
        >
          ×
        </button>

      </div>

      <div
        class="reminder-options"
      >

        <button
          type="button"
          class="reminder-option"
          data-reminder="none"
        >
          <span>
            Без напоминания
          </span>
        </button>

        <button
          type="button"
          class="reminder-option"
          data-reminder="at"
        >
          <span>
            В момент события
          </span>
        </button>

        <button
          type="button"
          class="reminder-option"
          data-reminder="5m"
        >
          <span>
            За 5 минут
          </span>
        </button>

        <button
          type="button"
          class="reminder-option"
          data-reminder="10m"
        >
          <span>
            За 10 минут
          </span>
        </button>

        <button
          type="button"
          class="reminder-option"
          data-reminder="15m"
        >
          <span>
            За 15 минут
          </span>
        </button>

        <button
          type="button"
          class="reminder-option"
          data-reminder="30m"
        >
          <span>
            За 30 минут
          </span>
        </button>

        <button
          type="button"
          class="reminder-option"
          data-reminder="1h"
        >
          <span>
            За 1 час
          </span>
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    reminderPicker
  );


  reminderPickerBackdrop =
    document.getElementById(
      "reminderPickerBackdrop"
    );


  closeReminderPicker =
    document.getElementById(
      "closeReminderPicker"
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
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            taskFormReminder =
              button.dataset.reminder;

            updateReminderUI();

            closeReminderPickerWindow();

          }
        );

      }
    );

}


/* ================= REMINDER UI UPDATE ================= */

function updateReminderUI() {

  if (
    reminderValueElement
  ) {

    reminderValueElement.textContent =
      reminderText(
        taskFormReminder
      );

  }


  document
    .querySelectorAll(
      ".reminder-option"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "selected",
          button.dataset.reminder ===
            taskFormReminder
        );

      }
    );

}


/* ================= OPEN REMINDER ================= */

function openReminderPicker() {

  updateReminderUI();

  reminderPicker.classList.remove(
    "hidden"
  );

}


function closeReminderPickerWindow() {

  if (
    reminderPicker
  ) {

    reminderPicker.classList.add(
      "hidden"
    );

  }

}


/* ================= DATE RENDER ================= */

function renderDate() {

  if (
    isToday(
      selectedDate
    )
  ) {

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


/* ================= SUBTASK HELPERS ================= */

function normalizeSubtask(
  subtask
) {

  if (
    typeof subtask ===
    "string"
  ) {

    return {

      text:
        subtask,

      completed:
        false

    };

  }


  return {

    text:
      subtask.text || "",

    completed:
      Boolean(
        subtask.completed
      )

  };

}


function getSubtaskStats(
  task
) {

  const subtasks =
    Array.isArray(
      task.subtasks
    )
      ? task.subtasks
      : [];


  const total =
    subtasks.length;


  const completed =
    subtasks.filter(
      subtask =>
        normalizeSubtask(
          subtask
        ).completed
    ).length;


  return {

    total,

    completed

  };

}


/* ================= RENDER TASKS ================= */

function renderTasks() {

  const currentTasks =
    getTasksForSelectedDate();


  tasksList.innerHTML =
    "";


  if (
    currentTasks.length ===
    0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

  } else {

    emptyState.classList.add(
      "hidden"
    );

  }


  let completedTasks = 0;


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


      if (
        taskCompleted
      ) {

        completedTasks++;

      }


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "task-card";


      if (
        taskCompleted
      ) {

        card.classList.add(
          "completed"
        );

      }


      if (
        task.important
      ) {

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


      if (
        task.description
      ) {

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


      if (
        task.time
      ) {

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


      if (
        task.reminder &&
        task.reminder !==
          "none"
      ) {

        const reminder =
          document.createElement(
            "span"
          );


        reminder.textContent =
          "🔔 " +
          reminderText(
            task.reminder
          );


        info.appendChild(
          reminder
        );

      }


      if (
        task.important
      ) {

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


      const stats =
        getSubtaskStats(
          task
        );


      if (
        stats.total > 0
      ) {

        const subtaskCount =
          document.createElement(
            "span"
          );


        subtaskCount.textContent =
          `☷ ${stats.completed}/${stats.total}`;


        info.appendChild(
          subtaskCount
        );

      }


      if (
        info.children.length >
        0
      ) {

        content.appendChild(
          info
        );

      }


      if (
        stats.total > 0
      ) {

        const preview =
          document.createElement(
            "div"
          );


        preview.className =
          "task-subtasks-preview";


        const progress =
          document.createElement(
            "div"
          );


        progress.className =
          "task-subtasks-progress";


        const fill =
          document.createElement(
            "div"
          );


        fill.className =
          "task-subtasks-fill";


        const percent =
          Math.round(
            (
              stats.completed /
              stats.total
            ) *
            100
          );


        fill.style.width =
          `${percent}%`;


        progress.appendChild(
          fill
        );


        preview.appendChild(
          progress
        );


        content.appendChild(
          preview
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


  const total =
    currentTasks.length;


  const percent =
    total === 0
      ? 0
      : Math.round(
          (
            completedTasks /
            total
          ) *
          100
        );


  progressCount.textContent =
    `${completedTasks} / ${total}`;


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


  taskFormReminder =
    "none";


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


/* ================= FORM UI ================= */

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


  updateReminderUI();

}


/* ================= NEW TASK ================= */

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


/* ================= EDIT TASK ================= */

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
    task.repeat ||
    "none";


  taskFormImportant =
    Boolean(
      task.important
    );


  taskFormReminder =
    task.reminder ||
    "none";


  taskTitle.value =
    task.title ||
    "";


  taskDescription.value =
    task.description ||
    "";


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

        const normalized =
          normalizeSubtask(
            subtask
          );


        createSubtask(
          normalized.text,
          normalized.completed
        );

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
        ".subtask-row"
      )
    )
      .map(
        row => {

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

        }
      )
      .filter(
        subtask =>
          subtask.text.length >
          0
      );


  if (
    editingTaskId !==
    null
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


    task.reminder =
      taskFormReminder;


    task.subtasks =
      subtasks;


    if (
      !task.completedDates ||
      typeof task.completedDates !==
        "object"
    ) {

      task.completedDates =
        {};

    }

  }


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

      reminder:
        taskFormReminder,

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
    editingTaskId ===
    null
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
  value = "",
  completed = false
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "subtask-row";


  const check =
    document.createElement(
      "button"
    );


  check.type =
    "button";


  check.className =
    "subtask-check";


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


  function updateSubtaskVisual() {

    const active =
      check.classList.contains(
        "active"
      );


    row.classList.toggle(
      "completed",
      active
    );


    check.textContent =
      active
        ? "✓"
        : "";

  }


  if (
    completed
  ) {

    check.classList.add(
      "active"
    );


    updateSubtaskVisual();

  }


  check.addEventListener(
    "click",
    event => {

      event.preventDefault();


      check.classList.toggle(
        "active"
      );


      updateSubtaskVisual();

    }
  );


  remove.addEventListener(
    "click",
    event => {

      event.preventDefault();


      event.stopPropagation();


      row.remove();

    }
  );


  row.appendChild(
    check
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
    timeInput.value ||
    "";


  updateFormUI();


  closeTimePickerWindow();

}


function clearTime() {

  taskFormTime =
    "";


  taskFormReminder =
    "none";


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


      closeReminderPickerWindow();

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


            if (
              tasksNav
            ) {

              tasksNav.classList.add(
                "active"
              );

            }

          }

        }
      );

    }
  );


/* ================= REMINDER STYLES ================= */

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

    .task-setting-button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    .task-setting-button:hover {
      background: rgba(255,255,255,.04);
    }

    .task-setting-icon {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(255,255,255,.06);
      flex-shrink: 0;
    }

    .task-setting-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .task-setting-title {
      font-size: 15px;
      font-weight: 600;
    }

    .task-setting-value {
      font-size: 13px;
      opacity: .58;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .task-setting-arrow {
      font-size: 24px;
      opacity: .45;
    }

    .reminder-options {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 0 16px;
    }

    .reminder-option {
      width: 100%;
      padding: 15px 16px;
      border: 0;
      border-radius: 12px;
      background: transparent;
      color: inherit;
      text-align: left;
      font-size: 15px;
      cursor: pointer;
    }

    .reminder-option:hover {
      background: rgba(255,255,255,.05);
    }

    .reminder-option.selected {
      background: rgba(255,255,255,.09);
      font-weight: 600;
    }

    .task-subtasks-preview {
      width: 100%;
      margin-top: 8px;
    }

    .task-subtasks-progress {
      width: 100%;
      height: 4px;
      overflow: hidden;
      border-radius: 99px;
      background: rgba(255,255,255,.08);
    }

    .task-subtasks-fill {
      height: 100%;
      border-radius: inherit;
      background: currentColor;
      opacity: .75;
      transition: width .2s ease;
    }

  `;


  document.head.appendChild(
    style
  );

}


/* ================= INITIALIZE ================= */

injectReminderStyles();

createReminderUI();

loadTasks();

renderDate();

renderTasks();
