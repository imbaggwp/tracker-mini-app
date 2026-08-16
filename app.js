const STORAGE_KEY = "tracker_tasks";
const SETTINGS_KEY = "tracker_settings";


/* =========================================================
   STATE
========================================================= */

let tasks =
  JSON.parse(
    localStorage.getItem(STORAGE_KEY)
  ) || [];


let settings =
  JSON.parse(
    localStorage.getItem(SETTINGS_KEY)
  ) || {
    morningSummary: "08:00",
    eveningSummary: "21:00"
  };


let selectedDate =
  getToday();


let calendarDate =
  new Date();


let analyticsPeriod =
  "week";


let analyticsSelectedDate =
  null;


/* =========================================================
   DATE
========================================================= */

function getToday() {

  return getDateKey(
    new Date()
  );

}


function getDateKey(date) {

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


function parseDate(dateString) {

  return new Date(
    `${dateString}T12:00:00`
  );

}


function formatFullDate(
  dateString
) {

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  ).format(
    parseDate(dateString)
  );

}


function formatShortDate(
  dateString
) {

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "numeric",
      month: "long"
    }
  ).format(
    parseDate(dateString)
  );

}


function formatMonth(date) {

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      month: "long",
      year: "numeric"
    }
  ).format(date);

}


function getWeekdayShort(
  dateString
) {

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      weekday: "short"
    }
  )
    .format(
      parseDate(dateString)
    )
    .replace(".", "");

}



/* =========================================================
   CLOUDFLARE D1 API
========================================================= */

const API_BASE =
  "https://tracker-api.asiya30092013.workers.dev/api";


function getTelegramUserId() {

  try {

    const id =
      window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    if (id) {
      return String(id);
    }

  } catch (error) {

    console.warn(
      "Telegram user id unavailable:",
      error
    );

  }


  const saved =
    localStorage.getItem(
      "tracker_user_id"
    );


  if (saved) {
    return saved;
  }


  /*
   * Только для локальной проверки.
   * В Telegram будет использоваться
   * настоящий Telegram ID.
   */

  return "418541686";

}


async function apiRequest(
  path,
  options = {}
) {

  const headers = {

    "Content-Type":
      "application/json",

    "X-Telegram-User-Id":
      getTelegramUserId(),

    ...(options.headers || {})

  };


  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        ...options,
        headers
      }
    );


  const text =
    await response.text();


  let data = {};


  try {

    data =
      text
        ? JSON.parse(text)
        : {};

  } catch {

    data = {
      raw: text
    };

  }


  if (!response.ok) {

    throw new Error(
      data?.error ||
      data?.message ||
      `HTTP ${response.status}`
    );

  }


  if (
    data?.success === false
  ) {

    throw new Error(
      data.error ||
      "API error"
    );

  }


  return data;

}


/* -------------------------
   LOAD TASKS
------------------------- */

async function loadTasksFromApi() {

  try {

    const data =
      await apiRequest(
        "/tasks",
        {
          method: "GET"
        }
      );


    const list =
      Array.isArray(data)
        ? data
        : Array.isArray(data.tasks)
          ? data.tasks
          : Array.isArray(data.results)
            ? data.results
            : Array.isArray(data.data)
              ? data.data
              : [];


    tasks =
      list.map(
        item => ({

          id:
            Number(item.id),

          title:
            String(
              item.title || ""
            ),

          description:
            String(
              item.description || ""
            ),

          date:
            item.date ||
            item.due_date ||
            getToday(),

          time:
            item.time ||
            "",

          repeat:
            item.repeat ||
            item.repeat_type ||
            "none",

          repeatDays:
            Array.isArray(
              item.repeatDays
            )
              ? item.repeatDays
              : [],

          repeatEnd:
            item.repeatEnd ||
            null,

          important:
            Boolean(
              item.important
            ),

          completedDates:
            Array.isArray(
              item.completedDates
            )
              ? item.completedDates
              : []

        })
      );


    saveTasks();

    renderAll();


    console.log(
      "D1: loaded",
      tasks.length,
      "tasks"
    );


    return true;

  } catch (error) {

    console.error(
      "D1 GET /tasks failed:",
      error
    );


    return false;

  }

}


/* -------------------------
   CREATE TASK
------------------------- */

async function createTaskInApi(
  task
) {

  const result =
    await apiRequest(
      "/tasks",
      {

        method: "POST",

        body:
          JSON.stringify({

            title:
              task.title,

            description:
              task.description || "",

            date:
              task.date || null,

            time:
              task.time || null,

            repeat_type:
              task.repeat || "none",

            important:
              task.important
                ? 1
                : 0

          })

      }
    );


  console.log(
    "D1: task created",
    result
  );


  return result;

}


/* -------------------------
   UPDATE TASK
------------------------- */

async function updateTaskInApi(
  task
) {

  return apiRequest(
    `/tasks/${encodeURIComponent(task.id)}`,
    {

      method: "PATCH",

      body:
        JSON.stringify({

          title:
            task.title,

          description:
            task.description || "",

          date:
            task.date || null,

          time:
            task.time || null,

          repeat_type:
            task.repeat || "none",

          important:
            task.important
              ? 1
              : 0,

          completed:
            task.completedDates &&
            task.completedDates.length
              ? 1
              : 0

        })

    }
  );

}


/* -------------------------
   DELETE TASK
------------------------- */

async function deleteTaskFromApi(
  taskId
) {

  return apiRequest(
    `/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE"
    }
  );

}


/* =========================================================
   STORAGE
========================================================= */

function saveTasks() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tasks)
  );

}


function saveSettings() {

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );

}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHtml(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    text;

  return div.innerHTML;

}


/* =========================================================
   REPEAT
========================================================= */

function taskOccursOnDate(
  task,
  dateString
) {

  const target =
    parseDate(dateString);

  const start =
    parseDate(task.date);


  if (
    target < start
  ) {

    return false;

  }


  if (
    task.repeatEnd &&
    target >
      parseDate(
        task.repeatEnd
      )
  ) {

    return false;

  }


  switch (
    task.repeat
  ) {

    case "none":

      return (
        dateString ===
        task.date
      );


    case "daily":

      return true;


    case "weekdays": {

      const day =
        target.getDay();

      return (
        day >= 1 &&
        day <= 5
      );

    }


    case "weekends": {

      const day =
        target.getDay();

      return (
        day === 0 ||
        day === 6
      );

    }


    case "custom": {

      const day =
        target.getDay();

      return (
        Array.isArray(
          task.repeatDays
        ) &&
        task.repeatDays.includes(
          day
        )
      );

    }


    case "weekly": {

      const difference =
        Math.floor(
          (
            target -
            start
          ) /
          (
            1000 *
            60 *
            60 *
            24
          )
        );

      return (
        difference % 7 === 0
      );

    }


    case "biweekly": {

      const difference =
        Math.floor(
          (
            target -
            start
          ) /
          (
            1000 *
            60 *
            60 *
            24
          )
        );

      return (
        difference % 14 === 0
      );

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


function getTasksForDate(
  dateString
) {

  return tasks.filter(
    task =>
      taskOccursOnDate(
        task,
        dateString
      )
  );

}


function getRepeatLabel(
  repeat
) {

  const labels = {

    none: "",

    daily:
      "каждый день",

    weekdays:
      "будни",

    weekends:
      "выходные",

    custom:
      "по дням",

    weekly:
      "каждую неделю",

    biweekly:
      "раз в 2 недели",

    monthly:
      "каждый месяц"

  };


  return labels[repeat] || "";

}


/* =========================================================
   COMPLETION
========================================================= */

function isTaskCompleted(
  task,
  dateString
) {

  return Boolean(
    task.completedDates &&
    task.completedDates.includes(
      dateString
    )
  );

}


async function toggleTaskCompletion(
  taskId,
  dateString
) {

  const task =
    tasks.find(
      item =>
        item.id === taskId
    );


  if (!task) {
    return;
  }


  if (
    !Array.isArray(
      task.completedDates
    )
  ) {

    task.completedDates = [];

  }


  const index =
    task.completedDates.indexOf(
      dateString
    );


  if (index === -1) {

    task.completedDates.push(
      dateString
    );

  } else {

    task.completedDates.splice(
      index,
      1
    );

  }


  saveTasks();

  renderAll();

  try {

    await updateTaskInApi(
      task
    );

  } catch (error) {

    console.error(
      "D1 update failed:",
      error
    );

  }

}


/* =========================================================
   HOME
========================================================= */

function renderHome() {

  const container =
    document.getElementById(
      "tasksContainer"
    );


  const today =
    getToday();


  const todayTasks =
    getTasksForDate(
      today
    );


  container.innerHTML =
    "";


  if (
    todayTasks.length === 0
  ) {

    container.innerHTML = `
      <div class="empty">
        На сегодня задач нет.<br>
        Самое время добавить первую.
      </div>
    `;

    updateProgress(
      todayTasks
    );

    return;

  }


  todayTasks.forEach(
    task => {

      const completed =
        isTaskCompleted(
          task,
          today
        );


      const element =
        createTaskElement(
          task,
          today,
          "home"
        );


      if (completed) {

        element.classList.add(
          "completed"
        );

      }


      container.appendChild(
        element
      );

    }
  );


  updateProgress(
    todayTasks
  );

}


function updateProgress(
  todayTasks
) {

  const today =
    getToday();


  const total =
    todayTasks.length;


  const completed =
    todayTasks.filter(
      task =>
        isTaskCompleted(
          task,
          today
        )
    ).length;


  const percent =
    total === 0
      ? 0
      : Math.round(
          completed /
          total *
          100
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


  let message =
    "Начнём?";


  if (
    percent === 100 &&
    total > 0
  ) {

    message =
      "Все выполнено 🎉";

  } else if (
    percent >= 75
  ) {

    message =
      "Почти готово";

  } else if (
    percent >= 50
  ) {

    message =
      "Хороший темп";

  } else if (
    percent > 0
  ) {

    message =
      "Продолжаем";

  }


  document.getElementById(
    "progressMessage"
  ).textContent =
    message;

}


/* =========================================================
   TASK ELEMENT
========================================================= */

function createTaskElement(
  task,
  dateString,
  mode
) {

  const completed =
    isTaskCompleted(
      task,
      dateString
    );


  const element =
    document.createElement(
      "div"
    );


  element.className =
    "task" +
    (
      completed
        ? " completed"
        : ""
    );


  const checkAttribute =
    mode === "home"
      ? `data-task-id="${task.id}"`
      : mode === "calendar"
        ? `data-calendar-id="${task.id}"`
        : `data-analytics-id="${task.id}`;


  const deleteButton =
    mode === "home"
      ? `
        <button
          class="task-delete"
          data-delete="${task.id}"
          type="button"
        >
          ×
        </button>
      `
      : "";


  element.innerHTML = `

    <button
      class="task-check"
      ${checkAttribute}
      type="button"
    ></button>

    <div class="task-content">

      <div class="task-title">
        ${escapeHtml(
          task.title
        )}
      </div>

      <div class="task-time">
        ${
          task.time
            ? task.time
            : "Без времени"
        }
      </div>

    </div>

    ${
      task.repeat !== "none"
        ? `
          <span class="task-repeat">
            ${getRepeatLabel(
              task.repeat
            )}
          </span>
        `
        : ""
    }

    ${deleteButton}

  `;


  return element;

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

  const grid =
    document.getElementById(
      "calendarGrid"
    );


  grid.innerHTML =
    "";


  document.getElementById(
    "calendarMonth"
  ).textContent =
    formatMonth(
      calendarDate
    );


  const year =
    calendarDate.getFullYear();


  const month =
    calendarDate.getMonth();


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  let start =
    firstDay.getDay();


  start =
    start === 0
      ? 6
      : start - 1;


  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const previousDays =
    new Date(
      year,
      month,
      0
    ).getDate();


  for (
    let i = start - 1;
    i >= 0;
    i--
  ) {

    grid.appendChild(
      createCalendarDay(
        new Date(
          year,
          month - 1,
          previousDays - i
        ),
        true
      )
    );

  }


  for (
    let day = 1;
    day <= days;
    day++
  ) {

    grid.appendChild(
      createCalendarDay(
        new Date(
          year,
          month,
          day
        ),
        false
      )
    );

  }


  const cells =
    start + days;


  const remaining =
    cells % 7 === 0
      ? 0
      : 7 -
        cells % 7;


  for (
    let day = 1;
    day <= remaining;
    day++
  ) {

    grid.appendChild(
      createCalendarDay(
        new Date(
          year,
          month + 1,
          day
        ),
        true
      )
    );

  }

}


function createCalendarDay(
  date,
  outside
) {

  const dateString =
    getDateKey(date);


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "calendar-day";


  if (outside) {

    button.classList.add(
      "outside"
    );

  }


  if (
    dateString ===
    getToday()
  ) {

    button.classList.add(
      "today"
    );

  }


  if (
    dateString ===
    selectedDate
  ) {

    button.classList.add(
      "selected"
    );

  }


  const dayTasks =
    getTasksForDate(
      dateString
    );


  const completed =
    dayTasks.filter(
      task =>
        isTaskCompleted(
          task,
          dateString
        )
    ).length;


  button.innerHTML = `

    <span class="calendar-day-number">
      ${date.getDate()}
    </span>

    ${
      dayTasks.length
        ? `
          <span class="calendar-day-stat">
            ${completed}/${dayTasks.length}
          </span>
        `
        : `
          <span class="calendar-day-stat">
            ·
          </span>
        `
    }

  `;


  button.addEventListener(
    "click",
    () => {

      selectedDate =
        dateString;


      calendarDate =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        );


      renderCalendar();

      renderSelectedDay();

    }
  );


  return button;

}


function renderSelectedDay() {

  const tasksContainer =
    document.getElementById(
      "calendarTasks"
    );


  const dayTasks =
    getTasksForDate(
      selectedDate
    );


  document.getElementById(
    "selectedDayWeekday"
  ).textContent =
    new Intl.DateTimeFormat(
      "ru-RU",
      {
        weekday: "long"
      }
    ).format(
      parseDate(
        selectedDate
      )
    );


  document.getElementById(
    "selectedDayTitle"
  ).textContent =
    formatShortDate(
      selectedDate
    );


  const completed =
    dayTasks.filter(
      task =>
        isTaskCompleted(
          task,
          selectedDate
        )
    ).length;


  document.getElementById(
    "selectedDayStat"
  ).textContent =
    `${completed} / ${dayTasks.length}`;


  tasksContainer.innerHTML =
    "";


  if (
    dayTasks.length === 0
  ) {

    tasksContainer.innerHTML = `
      <div class="empty">
        На этот день задач нет.
      </div>
    `;

    return;

  }


  dayTasks.forEach(
    task => {

      tasksContainer.appendChild(
        createTaskElement(
          task,
          selectedDate,
          "calendar"
        )
      );

    }
  );

}


/* =========================================================
   ANALYTICS
========================================================= */

function getStartOfWeek(
  date
) {

  const result =
    new Date(date);


  const day =
    result.getDay();


  const difference =
    day === 0
      ? -6
      : 1 - day;


  result.setDate(
    result.getDate() +
    difference
  );


  return result;

}


function getWeekDates() {

  const monday =
    getStartOfWeek(
      new Date()
    );


  const dates = [];


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date(monday);


    date.setDate(
      monday.getDate() +
      i
    );


    dates.push(
      getDateKey(date)
    );

  }


  return dates;

}


function getMonthDates() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    now.getMonth();


  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const dates = [];


  for (
    let day = 1;
    day <= days;
    day++
  ) {

    dates.push(
      getDateKey(
        new Date(
          year,
          month,
          day
        )
      )
    );

  }


  return dates;

}


function getAnalyticsDates() {

  return analyticsPeriod === "month"
    ? getMonthDates()
    : getWeekDates();

}


function getDayStats(
  dateString
) {

  const dayTasks =
    getTasksForDate(
      dateString
    );


  const completed =
    dayTasks.filter(
      task =>
        isTaskCompleted(
          task,
          dateString
        )
    ).length;


  const total =
    dayTasks.length;


  const percent =
    total === 0
      ? 0
      : Math.round(
          completed /
          total *
          100
        );


  return {

    date:
      dateString,

    total,

    completed,

    missed:
      total - completed,

    percent

  };

}


function renderAnalytics() {

  const dates =
    getAnalyticsDates();


  const stats =
    dates.map(
      date =>
        getDayStats(
          date
        )
    );


  const total =
    stats.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.total,
      0
    );


  const completed =
    stats.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.completed,
      0
    );


  const missed =
    total -
    completed;


  const percent =
    total === 0
      ? 0
      : Math.round(
          completed /
          total *
          100
        );


  document.getElementById(
    "analyticsPercent"
  ).textContent =
    `${percent}%`;


  document.getElementById(
    "analyticsCompleted"
  ).textContent =
    completed;


  document.getElementById(
    "analyticsTotal"
  ).textContent =
    total;


  document.getElementById(
    "analyticsDone"
  ).textContent =
    completed;


  document.getElementById(
    "analyticsMissed"
  ).textContent =
    missed;


  document.getElementById(
    "analyticsRing"
  ).style.setProperty(
    "--progress",
    `${percent}%`
  );


  const container =
    document.getElementById(
      "analyticsDays"
    );


  container.innerHTML =
    "";


  stats.forEach(
    stat => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "analytics-day";


      if (
        stat.date ===
        getToday()
      ) {

        button.classList.add(
          "today"
        );

      }


      if (
        stat.date ===
        analyticsSelectedDate
      ) {

        button.classList.add(
          "selected"
        );

      }


      button.innerHTML = `

        <div class="analytics-day-top">

          <span class="analytics-day-name">
            ${getWeekdayShort(
              stat.date
            )}
          </span>

          <strong>
            ${parseDate(
              stat.date
            ).getDate()}
          </strong>

        </div>

        <div class="analytics-day-progress">

          <div class="analytics-day-bar">

            <span
              style="width:${stat.percent}%"
            ></span>

          </div>

          <small>
            ${stat.completed}/${stat.total}
          </small>

        </div>

      `;


      button.addEventListener(
        "click",
        () => {

          analyticsSelectedDate =
            stat.date;


          renderAnalytics();

          renderAnalyticsDay(
            stat.date
          );

        }
      );


      container.appendChild(
        button
      );

    }
  );


  const daysWithTasks =
    stats.filter(
      stat =>
        stat.total > 0
    );


  const best =
    daysWithTasks.length
      ? [...daysWithTasks]
          .sort(
            (
              a,
              b
            ) =>
              b.percent -
              a.percent
          )[0]
      : null;


  document.getElementById(
    "bestDay"
  ).textContent =
    best
      ? `${formatShortDate(
          best.date
        )} · ${best.percent}%`
      : "Пока нет данных";


  const average =
    daysWithTasks.length
      ? Math.round(
          daysWithTasks.reduce(
            (
              sum,
              item
            ) =>
              sum +
              item.percent,
            0
          ) /
          daysWithTasks.length
        )
      : 0;


  document.getElementById(
    "averageResult"
  ).textContent =
    `${average}%`;


  if (
    analyticsSelectedDate
  ) {

    renderAnalyticsDay(
      analyticsSelectedDate
    );

  }

}


function renderAnalyticsDay(
  dateString
) {

  const details =
    document.getElementById(
      "analyticsDayDetails"
    );


  details.hidden =
    false;


  const stats =
    getDayStats(
      dateString
    );


  document.getElementById(
    "analyticsSelectedWeekday"
  ).textContent =
    new Intl.DateTimeFormat(
      "ru-RU",
      {
        weekday: "long"
      }
    ).format(
      parseDate(
        dateString
      )
    );


  document.getElementById(
    "analyticsSelectedDate"
  ).textContent =
    formatShortDate(
      dateString
    );


  document.getElementById(
    "analyticsSelectedStat"
  ).textContent =
    `${stats.completed} / ${stats.total}`;


  const container =
    document.getElementById(
      "analyticsDayTasks"
    );


  container.innerHTML =
    "";


  const dayTasks =
    getTasksForDate(
      dateString
    );


  if (
    dayTasks.length === 0
  ) {

    container.innerHTML = `
      <div class="empty">
        На этот день задач нет.
      </div>
    `;

    return;

  }


  dayTasks.forEach(
    task => {

      container.appendChild(
        createTaskElement(
          task,
          dateString,
          "analytics"
        )
      );

    }
  );

}


/* =========================================================
   MODAL
========================================================= */

const modal =
  document.getElementById(
    "modalOverlay"
  );


const taskForm =
  document.getElementById(
    "taskForm"
  );


const taskRepeat =
  document.getElementById(
    "taskRepeat"
  );


const customDaysGroup =
  document.getElementById(
    "customDaysGroup"
  );


const repeatEndGroup =
  document.getElementById(
    "repeatEndGroup"
  );


const repeatEnd =
  document.getElementById(
    "repeatEnd"
  );


const weekdayButtons =
  document.querySelectorAll(
    ".weekday-button"
  );


function openModal() {

  modal.classList.add(
    "open"
  );


  document.getElementById(
    "taskDate"
  ).value =
    selectedDate ||
    getToday();


  setTimeout(
    () => {

      document.getElementById(
        "taskTitle"
      ).focus();

    },
    100
  );

}


function closeModal() {

  modal.classList.remove(
    "open"
  );


  taskForm.reset();


  customDaysGroup.hidden =
    true;


  repeatEndGroup.hidden =
    true;


  weekdayButtons.forEach(
    button => {

      button.classList.remove(
        "active"
      );

    }
  );

}


document.getElementById(
  "addButton"
).addEventListener(
  "click",
  openModal
);


document.getElementById(
  "closeModal"
).addEventListener(
  "click",
  closeModal
);


modal.addEventListener(
  "click",
  event => {

    if (
      event.target === modal
    ) {

      closeModal();

    }

  }
);


/* =========================================================
   REPEAT FORM
========================================================= */

taskRepeat.addEventListener(
  "change",
  () => {

    const repeat =
      taskRepeat.value;


    customDaysGroup.hidden =
      repeat !== "custom";


    repeatEndGroup.hidden =
      repeat === "none";


    if (
      repeat === "none"
    ) {

      repeatEnd.value =
        "";

    }

  }
);


weekdayButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        button.classList.toggle(
          "active"
        );

      }
    );

  }
);


/* =========================================================
   CREATE TASK
========================================================= */

taskForm.addEventListener(
  "submit",
  async event => {

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
      taskRepeat.value;


    const repeatDays =
      Array.from(
        document.querySelectorAll(
          ".weekday-button.active"
        )
      ).map(
        button =>
          Number(
            button.dataset.day
          )
      );


    if (
      repeat === "custom" &&
      repeatDays.length === 0
    ) {

      alert(
        "Выберите хотя бы один день недели."
      );

      return;

    }


    if (
      repeatEnd.value &&
      repeatEnd.value < date
    ) {

      alert(
        "Дата окончания не может быть раньше даты начала."
      );

      return;

    }


    const localTask = {

      id:
        Date.now(),

      title,

      date,

      time,

      repeat,

      repeatDays,

      repeatEnd:
        repeat === "none"
          ? null
          : repeatEnd.value ||
            null,

      completedDates: []

    };


    try {

      const result =
        await createTaskInApi(
          localTask
        );


      /*
       * Worker может вернуть
       * созданную запись в разных
       * форматах. Если ID пришёл —
       * используем его.
       */

      const createdId =
        Number(
          result?.id ??
          result?.task?.id ??
          result?.data?.id ??
          localTask.id
        );


      localTask.id =
        Number.isFinite(
          createdId
        )
          ? createdId
          : localTask.id;


      tasks.push(
        localTask
      );


      saveTasks();

      renderAll();

      closeModal();

    } catch (error) {

      console.error(
        "D1 create failed:",
        error
      );


      /*
       * Не теряем задачу, если API
       * временно недоступен.
       */

      tasks.push(
        localTask
      );

      saveTasks();

      renderAll();

      closeModal();


      alert(
        "Задача сохранена локально, " +
        "но не отправлена в D1.\n\n" +
        error.message
      );

    }

  }
);


/* =========================================================
   TASK ACTIONS
========================================================= */

document
  .getElementById(
    "tasksContainer"
  )
  .addEventListener(
    "click",
    event => {

      const check =
        event.target.closest(
          "[data-task-id]"
        );


      const deleteButton =
        event.target.closest(
          "[data-delete]"
        );


      if (check) {

        toggleTaskCompletion(
          Number(
            check.dataset.taskId
          ),
          getToday()
        );

      }


      if (deleteButton) {

        const id =
          Number(
            deleteButton.dataset.delete
          );


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
              task.id !== id
          );


        saveTasks();

        renderAll();


        deleteTaskFromApi(
          id
        ).catch(
          error => {

            console.error(
              "D1 delete failed:",
              error
            );

          }
        );

      }

    }
  );


document
  .getElementById(
    "calendarTasks"
  )
  .addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-calendar-id]"
        );


      if (!button) {
        return;
      }


      toggleTaskCompletion(
        Number(
          button.dataset.calendarId
        ),
        selectedDate
      );

    }
  );


document
  .getElementById(
    "analyticsDayTasks"
  )
  .addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-analytics-id]"
        );


      if (!button) {
        return;
      }


      toggleTaskCompletion(
        Number(
          button.dataset.analyticsId
        ),
        analyticsSelectedDate
      );

    }
  );


/* =========================================================
   CLEAR COMPLETED TODAY
========================================================= */

document
  .getElementById(
    "clearCompleted"
  )
  .addEventListener(
    "click",
    () => {

      const today =
        getToday();


      let changed =
        false;


      tasks.forEach(
        task => {

          if (
            Array.isArray(
              task.completedDates
            )
          ) {

            const before =
              task.completedDates.length;


            task.completedDates =
              task.completedDates.filter(
                date =>
                  date !== today
              );


            if (
              before !==
              task.completedDates.length
            ) {

              changed =
                true;

            }

          }

        }
      );


      if (changed) {

        saveTasks();

        renderAll();

      }

    }
  );


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

document
  .getElementById(
    "previousMonth"
  )
  .addEventListener(
    "click",
    () => {

      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() - 1,
          1
        );


      renderCalendar();

    }
  );


document
  .getElementById(
    "nextMonth"
  )
  .addEventListener(
    "click",
    () => {

      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() + 1,
          1
        );


      renderCalendar();

    }
  );


document
  .getElementById(
    "calendarToday"
  )
  .addEventListener(
    "click",
    () => {

      const today =
        new Date();


      selectedDate =
        getToday();


      calendarDate =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );


      renderCalendar();

      renderSelectedDay();

    }
  );


/* =========================================================
   ANALYTICS SWITCH
========================================================= */

document
  .querySelectorAll(
    ".analytics-tab"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          analyticsPeriod =
            button.dataset.period;


          analyticsSelectedDate =
            null;


          document
            .querySelectorAll(
              ".analytics-tab"
            )
            .forEach(
              tab => {

                tab.classList.toggle(
                  "active",
                  tab === button
                );

              }
            );


          document.getElementById(
            "analyticsDayDetails"
          ).hidden =
            true;


          renderAnalytics();

        }
      );

    }
  );


/* =========================================================
   SETTINGS
========================================================= */

const morningSummary =
  document.getElementById(
    "morningSummary"
  );


const eveningSummary =
  document.getElementById(
    "eveningSummary"
  );


morningSummary.value =
  settings.morningSummary;


eveningSummary.value =
  settings.eveningSummary;


morningSummary.addEventListener(
  "change",
  () => {

    settings.morningSummary =
      morningSummary.value;

    saveSettings();

  }
);


eveningSummary.addEventListener(
  "change",
  () => {

    settings.eveningSummary =
      eveningSummary.value;

    saveSettings();

  }
);


document
  .getElementById(
    "clearAllData"
  )
  .addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Удалить все задачи и данные приложения?"
        );


      if (!confirmed) {
        return;
      }


      tasks = [];


      saveTasks();

      renderAll();

    }
  );


/* =========================================================
   NAVIGATION
========================================================= */

const pages = {

  home:
    document.getElementById(
      "homePage"
    ),

  calendar:
    document.getElementById(
      "calendarPage"
    ),

  analytics:
    document.getElementById(
      "analyticsPage"
    ),

  settings:
    document.getElementById(
      "settingsPage"
    )

};


const navItems =
  document.querySelectorAll(
    ".nav-item"
  );


function showPage(
  pageName
) {

  if (
    !pages[pageName]
  ) {

    return;

  }


  Object.values(
    pages
  ).forEach(
    page => {

      page.hidden =
        true;

    }
  );


  pages[pageName].hidden =
    false;


  navItems.forEach(
    item => {

      item.classList.toggle(
        "active",
        item.dataset.page ===
        pageName
      );

    }
  );


  if (
    pageName ===
    "calendar"
  ) {

    renderCalendar();

    renderSelectedDay();

  }


  if (
    pageName ===
    "analytics"
  ) {

    renderAnalytics();

  }

}


navItems.forEach(
  item => {

    item.addEventListener(
      "click",
      () => {

        showPage(
          item.dataset.page
        );

      }
    );

  }
);


/* =========================================================
   PROFILE
========================================================= */

document
  .getElementById(
    "profileButton"
  )
  .addEventListener(
    "click",
    () => {

      showPage(
        "settings"
      );

    }
  );


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderHome();

  renderCalendar();

  renderSelectedDay();

  renderAnalytics();

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.getElementById(
  "currentDate"
).textContent =
  formatFullDate(
    getToday()
  );


renderAll();

showPage(
  "home"
);


/*
 * После первого рендера пытаемся
 * загрузить актуальные задачи из D1.
 * Если API недоступен — остаёмся
 * на локальных данных.
 */

loadTasksFromApi();
