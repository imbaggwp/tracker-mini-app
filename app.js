const STORAGE_KEY = "tracker_tasks";

let tasks =
  JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

let selectedDate = getToday();

let calendarDate = new Date();

let analyticsPeriod = "week";

let analyticsSelectedDate = null;


/* =========================================================
   DATE
========================================================= */

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


function getToday() {

  return getDateKey(
    new Date()
  );

}


function parseDate(dateString) {

  return new Date(
    `${dateString}T12:00:00`
  );

}


function formatFullDate(dateString) {

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


function formatShortDate(dateString) {

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


function getWeekdayShort(dateString) {

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
   STORAGE
========================================================= */

function saveTasks() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tasks)
  );

}


/* =========================================================
   TASK REPETITION
========================================================= */

function taskOccursOnDate(
  task,
  dateString
) {

  const target =
    parseDate(dateString);

  const start =
    parseDate(task.date);


  if (target < start) {
    return false;
  }


  switch (task.repeat) {

    case "none":

      return (
        dateString === task.date
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


    case "weekly": {

      const difference =
        Math.floor(
          (
            target - start
          ) /
          (1000 * 60 * 60 * 24)
        );

      return (
        difference % 7 === 0
      );

    }


    case "biweekly": {

      const difference =
        Math.floor(
          (
            target - start
          ) /
          (1000 * 60 * 60 * 24)
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


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHtml(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent = text;

  return div.innerHTML;

}


/* =========================================================
   TASK REPEAT LABEL
========================================================= */

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
   ELEMENTS
========================================================= */

const tasksContainer =
  document.getElementById(
    "tasksContainer"
  );

const calendarTasks =
  document.getElementById(
    "calendarTasks"
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


/* =========================================================
   HOME
========================================================= */

function renderHome() {

  const today =
    getToday();


  const todayTasks =
    getTasksForDate(
      today
    );


  tasksContainer.innerHTML = "";


  if (
    todayTasks.length === 0
  ) {

    tasksContainer.innerHTML = `
      <div class="empty">
        На сегодня задач нет.<br>
        Самое время добавить первую.
      </div>
    `;

    updateProgress([]);

    return;

  }


  todayTasks.forEach(
    task => {

      const element =
        document.createElement(
          "div"
        );


      const completed =
        isTaskCompleted(
          task,
          today
        );


      element.className =
        "task" +
        (
          completed
            ? " completed"
            : ""
        );


      element.innerHTML = `

        <button
          class="task-check"
          data-id="${task.id}"
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

        <button
          class="task-delete"
          data-delete="${task.id}"
          type="button"
        >
          ×
        </button>

      `;


      tasksContainer.appendChild(
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
   CALENDAR
========================================================= */

function renderCalendar() {

  const grid =
    document.getElementById(
      "calendarGrid"
    );


  const monthTitle =
    document.getElementById(
      "calendarMonth"
    );


  grid.innerHTML = "";


  monthTitle.textContent =
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


  let startingDay =
    firstDay.getDay();


  startingDay =
    startingDay === 0
      ? 6
      : startingDay - 1;


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const previousMonthDays =
    new Date(
      year,
      month,
      0
    ).getDate();


  for (
    let i = startingDay - 1;
    i >= 0;
    i--
  ) {

    const day =
      previousMonthDays - i;


    grid.appendChild(
      createCalendarDay(
        new Date(
          year,
          month - 1,
          day
        ),
        true
      )
    );

  }


  for (
    let day = 1;
    day <= daysInMonth;
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


  const totalCells =
    startingDay +
    daysInMonth;


  const remaining =
    totalCells % 7 === 0
      ? 0
      : 7 -
        (
          totalCells % 7
        );


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
  outsideMonth
) {

  const dateString =
    getDateKey(date);


  const day =
    document.createElement(
      "button"
    );


  day.type = "button";

  day.className =
    "calendar-day";


  if (outsideMonth) {

    day.classList.add(
      "outside"
    );

  }


  if (
    dateString ===
    getToday()
  ) {

    day.classList.add(
      "today"
    );

  }


  if (
    dateString ===
    selectedDate
  ) {

    day.classList.add(
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


  day.innerHTML = `

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
          <span class="calendar-day-stat empty-stat">
            ·
          </span>
        `
    }

  `;


  day.addEventListener(
    "click",
    () => {

      selectedDate =
        dateString;


      if (
        date.getMonth() !==
        calendarDate.getMonth()
      ) {

        calendarDate =
          new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          );

      }


      renderCalendar();

      renderSelectedDay();

    }
  );


  return day;

}


function renderSelectedDay() {

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


  calendarTasks.innerHTML = "";


  if (
    dayTasks.length === 0
  ) {

    calendarTasks.innerHTML = `
      <div class="empty">
        На этот день задач нет.
      </div>
    `;

    return;

  }


  dayTasks.forEach(
    task => {

      const element =
        document.createElement(
          "div"
        );


      const completed =
        isTaskCompleted(
          task,
          selectedDate
        );


      element.className =
        "task" +
        (
          completed
            ? " completed"
            : ""
        );


      element.innerHTML = `

        <button
          class="task-check"
          data-calendar-id="${task.id}"
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

      `;


      calendarTasks.appendChild(
        element
      );

    }
  );

}


/* =========================================================
   CALENDAR ACTIONS
========================================================= */

calendarTasks.addEventListener(
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

      selectedDate =
        getToday();


      const today =
        new Date();


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
   TOGGLE COMPLETION
========================================================= */

function toggleTaskCompletion(
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
    !task.completedDates
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

  renderHome();

  renderCalendar();

  renderSelectedDay();

  renderAnalytics();

}


/* =========================================================
   MODAL
========================================================= */

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

      document
        .getElementById(
          "taskTitle"
        )
        .focus();

    },
    150
  );

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


/* =========================================================
   CREATE TASK
========================================================= */

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


    if (
      !title ||
      !date
    ) {

      return;

    }


    tasks.push({

      id:
        Date.now(),

      title,

      date,

      time,

      repeat,

      completedDates: []

    });


    saveTasks();

    renderHome();

    renderCalendar();

    renderSelectedDay();

    renderAnalytics();

    closeTaskModal();

  }
);


/* =========================================================
   HOME ACTIONS
========================================================= */

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

      toggleTaskCompletion(
        Number(
          check.dataset.id
        ),
        getToday()
      );

    }


    if (deleteButton) {

      const id =
        Number(
          deleteButton.dataset.delete
        );


      tasks =
        tasks.filter(
          task =>
            task.id !== id
        );


      saveTasks();

      renderHome();

      renderCalendar();

      renderSelectedDay();

      renderAnalytics();

    }

  }
);


/* =========================================================
   CLEAR COMPLETED
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


      tasks.forEach(
        task => {

          if (
            task.completedDates
          ) {

            task.completedDates =
              task.completedDates.filter(
                date =>
                  date !== today
              );

          }

        }
      );


      saveTasks();

      renderHome();

      renderCalendar();

      renderSelectedDay();

      renderAnalytics();

    }
  );


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

  const today =
    new Date();


  const monday =
    getStartOfWeek(
      today
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

  if (
    analyticsPeriod ===
    "month"
  ) {

    return getMonthDates();

  }


  return getWeekDates();

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


  /*
    Круговая диаграмма
  */

  const ring =
    document.getElementById(
      "analyticsRing"
    );


  ring.style.setProperty(
    "--progress",
    `${percent}%`
  );


  /*
    Дни
  */

  const container =
    document.getElementById(
      "analyticsDays"
    );


  container.innerHTML = "";


  stats.forEach(
    stat => {

      const element =
        document.createElement(
          "button"
        );


      element.type =
        "button";


      element.className =
        "analytics-day" +
        (
          stat.date ===
          getToday()
            ? " today"
            : ""
        );


      if (
        stat.date ===
        analyticsSelectedDate
      ) {

        element.classList.add(
          "selected"
        );

      }


      element.innerHTML = `

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


      element.addEventListener(
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
        element
      );

    }
  );


  /*
    Лучший день
  */

  const daysWithTasks =
    stats.filter(
      stat =>
        stat.total > 0
    );


  let bestDay =
    null;


  if (
    daysWithTasks.length
  ) {

    bestDay =
      [...daysWithTasks]
        .sort(
          (
            a,
            b
          ) =>
            b.percent -
            a.percent
        )[0];

  }


  document.getElementById(
    "bestDay"
  ).textContent =
    bestDay
      ? `${formatShortDate(
          bestDay.date
        )} · ${bestDay.percent}%`
      : "Пока нет данных";


  /*
    Средний результат
  */

  const average =
    daysWithTasks.length === 0
      ? 0
      : Math.round(
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
        );


  document.getElementById(
    "averageResult"
  ).textContent =
    `${average}%`;


  /*
    Если выбран день —
    обновляем его
  */

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


  details.hidden = false;


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


  container.innerHTML = "";


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

      const element =
        document.createElement(
          "div"
        );


      const completed =
        isTaskCompleted(
          task,
          dateString
        );


      element.className =
        "task" +
        (
          completed
            ? " completed"
            : ""
        );


      element.innerHTML = `

        <button
          class="task-check"
          data-analytics-id="${task.id}"
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

      `;


      container.appendChild(
        element
      );

    }
  );

}


/* =========================================================
   ANALYTICS TASK ACTIONS
========================================================= */

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
   ANALYTICS TABS
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
          ).hidden = true;


          renderAnalytics();

        }
      );

    }
  );


/* =========================================================
   NAVIGATION
========================================================= */

const navItems =
  document.querySelectorAll(
    ".nav-item"
  );


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
    )

};


function showPage(
  pageName
) {

  /*
    Настройки пока
    ещё не реализованы.
  */

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
   INITIALIZATION
========================================================= */

document.getElementById(
  "currentDate"
).textContent =
  formatFullDate(
    getToday()
  );


renderHome();

renderCalendar();

renderSelectedDay();

renderAnalytics();

showPage(
  "home"
);
