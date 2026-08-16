const STORAGE_KEY = "tracker_tasks";

let tasks =
  JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

let selectedDate = getToday();

let calendarDate = new Date();


/* =========================
   DATE HELPERS
========================= */

function getDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getToday() {
  return getDateKey(new Date());
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
   REPEAT LOGIC
========================= */

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


/* =========================
   TASKS FOR DATE
========================= */

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


/* =========================
   COMPLETION
========================= */

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


/* =========================
   HTML SAFETY
========================= */

function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


/* =========================
   ELEMENTS
========================= */

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


/* =========================
   CURRENT DATE
========================= */

document.getElementById(
  "currentDate"
).textContent =
  formatFullDate(
    getToday()
  );


/* =========================
   HOME
========================= */

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


      const repeatNames = {

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


      element.innerHTML = `

        <button
          class="task-check"
          data-id="${task.id}"
          type="button"
          aria-label="Выполнить задачу"
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
                ${repeatNames[
                  task.repeat
                ]}
              </span>
            `
            : ""
        }

        <button
          class="task-delete"
          data-delete="${task.id}"
          type="button"
          aria-label="Удалить"
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


/* =========================
   PROGRESS
========================= */

function updateProgress(
  todayTasks
) {

  const total =
    todayTasks.length;


  const completed =
    todayTasks.filter(
      task =>
        isTaskCompleted(
          task,
          getToday()
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
    percent === 100
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


/* =========================
   CALENDAR
========================= */

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


  /*
    JS:
    воскресенье = 0

    Нам нужен:
    понедельник = 0
  */

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


  /*
    Предыдущие дни
  */

  for (
    let i = startingDay - 1;
    i >= 0;
    i--
  ) {

    const day =
      previousMonthDays - i;


    const cell =
      createCalendarDay(
        new Date(
          year,
          month - 1,
          day
        ),
        true
      );


    grid.appendChild(cell);

  }


  /*
    Текущий месяц
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


    const cell =
      createCalendarDay(
        date,
        false
      );


    grid.appendChild(cell);

  }


  /*
    Следующий месяц
  */

  const totalCells =
    startingDay +
    daysInMonth;


  const remaining =
    totalCells % 7 === 0
      ? 0
      : 7 - (
          totalCells % 7
        );


  for (
    let day = 1;
    day <= remaining;
    day++
  ) {

    const cell =
      createCalendarDay(
        new Date(
          year,
          month + 1,
          day
        ),
        true
      );


    grid.appendChild(cell);

  }

}


/* =========================
   CALENDAR DAY
========================= */

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


      /*
        Если пользователь
        нажал день другого
        месяца — переключаем
        календарь
      */

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


/* =========================
   SELECTED DAY
========================= */

function renderSelectedDay() {

  const tasksForDay =
    getTasksForDate(
      selectedDate
    );


  const title =
    document.getElementById(
      "selectedDayTitle"
    );


  const weekday =
    document.getElementById(
      "selectedDayWeekday"
    );


  const stat =
    document.getElementById(
      "selectedDayStat"
    );


  weekday.textContent =
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


  title.textContent =
    formatShortDate(
      selectedDate
    );


  const completed =
    tasksForDay.filter(
      task =>
        isTaskCompleted(
          task,
          selectedDate
        )
    ).length;


  stat.textContent =
    `${completed} / ${tasksForDay.length}`;


  calendarTasks.innerHTML = "";


  if (
    tasksForDay.length === 0
  ) {

    calendarTasks.innerHTML = `
      <div class="empty">
        На этот день задач нет.
      </div>
    `;

    return;

  }


  tasksForDay.forEach(
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


      const repeatNames = {

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
                ${repeatNames[
                  task.repeat
                ]}
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


/* =========================
   CALENDAR TASK ACTIONS
========================= */

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


    const id =
      Number(
        button.dataset.calendarId
      );


    const task =
      tasks.find(
        item =>
          item.id === id
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
        selectedDate
      );


    if (index === -1) {

      task.completedDates.push(
        selectedDate
      );

    } else {

      task.completedDates.splice(
        index,
        1
      );

    }


    saveTasks();

    renderCalendar();

    renderSelectedDay();

    renderHome();

  }
);


/* =========================
   MONTH NAVIGATION
========================= */

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


/* =========================
   TODAY BUTTON
========================= */

document
  .getElementById(
    "calendarToday"
  )
  .addEventListener(
    "click",
    () => {

      selectedDate =
        getToday();


      const todayDate =
        new Date();


      calendarDate =
        new Date(
          todayDate.getFullYear(),
          todayDate.getMonth(),
          1
        );


      renderCalendar();

      renderSelectedDay();

    }
  );


/* =========================
   MODAL
========================= */

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
    200
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


    if (
      !title ||
      !date
    ) {

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


    tasks.push(
      task
    );


    saveTasks();

    renderHome();

    renderCalendar();

    renderSelectedDay();

    closeTaskModal();

  }
);


/* =========================
   HOME TASK ACTIONS
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
          item =>
            item.id === id
        );


      if (!task) {
        return;
      }


      if (
        !task.completedDates
      ) {

        task.completedDates = [];

      }


      const today =
        getToday();


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

      renderHome();

      renderCalendar();

      renderSelectedDay();

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


      /*
        Здесь мы не удаляем
        сами задачи.

        Для регулярных задач
        это особенно важно:
        они должны продолжить
        появляться завтра.
      */

      saveTasks();

      renderHome();

      renderCalendar();

      renderSelectedDay();

    }
  );


/* =========================
   NAVIGATION
========================= */

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
    )

};


function showPage(
  pageName
) {

  /*
    Пока реально
    существуют только
    Главная и Календарь.
  */

  if (
    pageName !== "home" &&
    pageName !== "calendar"
  ) {

    return;

  }


  Object.values(pages)
    .forEach(page => {

      page.hidden = true;

    });


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


  /*
    Кнопку добавления
    показываем пока
    только на основных
    экранах.
  */

  addButton.style.display =
    "block";


  if (
    pageName === "calendar"
  ) {

    renderCalendar();

    renderSelectedDay();

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


/* =========================
   INITIALIZE
========================= */

renderHome();

renderCalendar();

renderSelectedDay();

showPage("home");
