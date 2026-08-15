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
   
