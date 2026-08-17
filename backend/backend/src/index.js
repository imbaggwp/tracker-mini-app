const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Telegram-Init-Data",
  "Access-Control-Allow-Methods":
    "GET, POST, PUT, DELETE, OPTIONS"
};

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

function cors() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}


/* =====================================================
   TELEGRAM
   ===================================================== */

async function getTelegramUser(request) {
  const initData =
    request.headers.get(
      "X-Telegram-Init-Data"
    );

  if (!initData) {
    return null;
  }

  const params =
    new URLSearchParams(initData);

  const userData =
    params.get("user");

  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}


/* =====================================================
   DATABASE
   ===================================================== */

async function ensureUser(
  env,
  telegramUser
) {
  if (!telegramUser?.id) {
    throw new Error(
      "Telegram user not found"
    );
  }

  await env.DB.prepare(`
    INSERT INTO users (
      telegram_id,
      username,
      first_name,
      last_name
    )
    VALUES (?, ?, ?, ?)

    ON CONFLICT(telegram_id)
    DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name
  `)
    .bind(
      String(telegramUser.id),
      telegramUser.username || null,
      telegramUser.first_name || null,
      telegramUser.last_name || null
    )
    .run();

  return env.DB.prepare(`
    SELECT *
    FROM users
    WHERE telegram_id = ?
  `)
    .bind(
      String(telegramUser.id)
    )
    .first();
}


/* =====================================================
   API
   ===================================================== */

async function handleRequest(
  request,
  env
) {

  if (
    request.method === "OPTIONS"
  ) {
    return cors();
  }

  const url =
    new URL(request.url);


  /* ---------------------------------------------------
     HEALTH
     --------------------------------------------------- */

  if (
    request.method === "GET" &&
    url.pathname === "/"
  ) {

    return json({
      ok: true,
      service: "tracker-api",
      version: "1.0.0"
    });

  }


  /* ---------------------------------------------------
     DATABASE TEST
     --------------------------------------------------- */

  if (
    request.method === "GET" &&
    url.pathname === "/api/health"
  ) {

    const result =
      await env.DB.prepare(`
        SELECT 1 AS ok
      `)
        .first();

    return json({
      ok: result?.ok === 1,
      database: true
    });

  }


  /* ---------------------------------------------------
     CURRENT USER
     --------------------------------------------------- */

  if (
    request.method === "GET" &&
    url.pathname === "/api/me"
  ) {

    const telegramUser =
      await getTelegramUser(
        request
      );

    if (!telegramUser) {

      return json({
        ok: false,
        authenticated: false,
        message:
          "Telegram authentication required"
      }, 401);

    }

    const user =
      await ensureUser(
        env,
        telegramUser
      );

    return json({
      ok: true,
      authenticated: true,
      user
    });

  }


  /* ---------------------------------------------------
     GET TASKS
     --------------------------------------------------- */

  if (
    request.method === "GET" &&
    url.pathname === "/api/tasks"
  ) {

    const telegramUser =
      await getTelegramUser(
        request
      );

    if (!telegramUser) {

      return json({
        ok: false,
        message:
          "Telegram authentication required"
      }, 401);

    }

    const user =
      await ensureUser(
        env,
        telegramUser
      );

    const result =
      await env.DB.prepare(`
        SELECT *
        FROM tasks
        WHERE user_id = ?
        ORDER BY
          date ASC,
          time ASC,
          created_at ASC
      `)
        .bind(user.id)
        .all();

    return json({
      ok: true,
      tasks:
        result.results || []
    });

  }


  /* ---------------------------------------------------
     CREATE TASK
     --------------------------------------------------- */

  if (
    request.method === "POST" &&
    url.pathname === "/api/tasks"
  ) {

    const telegramUser =
      await getTelegramUser(
        request
      );

    if (!telegramUser) {

      return json({
        ok: false,
        message:
          "Telegram authentication required"
      }, 401);

    }

    const user =
      await ensureUser(
        env,
        telegramUser
      );

    const body =
      await request.json();

    if (
      !body.title ||
      !body.date
    ) {

      return json({
        ok: false,
        message:
          "Title and date are required"
      }, 400);

    }

    const taskId =
      crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO tasks (
        id,
        user_id,
        title,
        description,
        date,
        time,
        repeat_type,
        important,
        reminder,
        completed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        taskId,
        user.id,
        body.title,
        body.description || "",
        body.date,
        body.time || null,
        body.repeat || "none",
        body.important ? 1 : 0,
        body.reminder || "none",
        0
      )
      .run();

    return json({
      ok: true,
      task: {
        id: taskId
      }
    }, 201);

  }


  /* ---------------------------------------------------
     UPDATE TASK
     --------------------------------------------------- */

  if (
    request.method === "PUT" &&
    url.pathname.startsWith(
      "/api/tasks/"
    )
  ) {

    const taskId =
      url.pathname
        .split("/")
        .pop();

    const telegramUser =
      await getTelegramUser(
        request
      );

    if (!telegramUser) {

      return json({
        ok: false,
        message:
          "Telegram authentication required"
      }, 401);

    }

    const user =
      await ensureUser(
        env,
        telegramUser
      );

    const body =
      await request.json();

    const result =
      await env.DB.prepare(`
        UPDATE tasks
        SET
          title = ?,
          description = ?,
          date = ?,
          time = ?,
          repeat_type = ?,
          important = ?,
          reminder = ?,
          completed = ?
        WHERE
          id = ?
          AND user_id = ?
      `)
        .bind(
          body.title,
          body.description || "",
          body.date,
          body.time || null,
          body.repeat || "none",
          body.important ? 1 : 0,
          body.reminder || "none",
          body.completed ? 1 : 0,
          taskId,
          user.id
        )
        .run();

    if (
      result.meta?.changes === 0
    ) {

      return json({
        ok: false,
        message: "Task not found"
      }, 404);

    }

    return json({
      ok: true
    });

  }


  /* ---------------------------------------------------
     DELETE TASK
     --------------------------------------------------- */

  if (
    request.method === "DELETE" &&
    url.pathname.startsWith(
      "/api/tasks/"
    )
  ) {

    const taskId =
      url.pathname
        .split("/")
        .pop();

    const telegramUser =
      await getTelegramUser(
        request
      );

    if (!telegramUser) {

      return json({
        ok: false,
        message:
          "Telegram authentication required"
      }, 401);

    }

    const user =
      await ensureUser(
        env,
        telegramUser
      );

    const result =
      await env.DB.prepare(`
        DELETE FROM tasks
        WHERE
          id = ?
          AND user_id = ?
      `)
        .bind(
          taskId,
          user.id
        )
        .run();

    if (
      result.meta?.changes === 0
    ) {

      return json({
        ok: false,
        message: "Task not found"
      }, 404);

    }

    return json({
      ok: true
    });

  }


  return json({
    ok: false,
    error: "Not found"
  }, 404);
}


/* =====================================================
   CRON
   ===================================================== */

async function handleScheduled(
  env
) {

  console.log(
    "Tracker cron:",
    new Date().toISOString()
  );

  const result =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM tasks
    `)
      .first();

  console.log(
    "Tasks:",
    result?.count || 0
  );
}


/* =====================================================
   WORKER
   ===================================================== */

export default {

  async fetch(
    request,
    env
  ) {

    try {

      return await handleRequest(
        request,
        env
      );

    } catch (error) {

      console.error(
        error
      );

      return json({
        ok: false,
        error:
          error.message
      }, 500);

    }

  },

  async scheduled(
    controller,
    env,
    ctx
  ) {

    ctx.waitUntil(
      handleScheduled(env)
    );

  }

};
