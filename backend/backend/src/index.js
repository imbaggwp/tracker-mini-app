const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function cors() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}


// Получаем пользователя Telegram Mini App
async function getTelegramUser(request) {
  const initData = request.headers.get("X-Telegram-Init-Data");

  if (!initData) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const userData = params.get("user");

  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}


// Создаём пользователя в D1,
// если его ещё нет
async function ensureUser(env, telegramUser) {
  if (!telegramUser?.id) {
    throw new Error("Telegram user not found");
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
      last_name = excluded.last_name,
      updated_at = CURRENT_TIMESTAMP
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
    .bind(String(telegramUser.id))
    .first();
}


// Проверка работы Worker
async function handleRequest(request, env) {

  if (request.method === "OPTIONS") {
    return cors();
  }


  const url = new URL(request.url);


  // Главная страница API
  if (
    request.method === "GET" &&
    url.pathname === "/"
  ) {
    return json({
      ok: true,
      service: "tracker-api",
      version: "0.7"
    });
  }


  // Проверка подключения Mini App
  if (
    request.method === "GET" &&
    url.pathname === "/api/me"
  ) {

    const telegramUser =
      await getTelegramUser(request);

    if (!telegramUser) {
      return json({
        ok: false,
        authenticated: false,
        message: "Telegram authentication required"
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


  // Сохранение настроек сводок
  if (
    request.method === "POST" &&
    url.pathname === "/api/settings"
  ) {

    const telegramUser =
      await getTelegramUser(request);

    if (!telegramUser) {
      return json({
        ok: false,
        message: "Telegram authentication required"
      }, 401);
    }

    const user =
      await ensureUser(
        env,
        telegramUser
      );

    const body =
      await request.json();


    await env.DB.prepare(`
      UPDATE users

      SET
        timezone = ?,
        morning_summary_enabled = ?,
        morning_summary_time = ?,
        evening_summary_enabled = ?,
        evening_summary_time = ?,
        show_tomorrow = ?,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
    `)
      .bind(
        body.timezone || "Europe/Moscow",

        body.morningEnabled ? 1 : 0,

        body.morningTime || "08:00",

        body.eveningEnabled ? 1 : 0,

        body.eveningTime || "21:00",

        body.showTomorrow ? 1 : 0,

        user.id
      )
      .run();


    const updated =
      await env.DB.prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `)
        .bind(user.id)
        .first();


    return json({
      ok: true,
      user: updated
    });
  }


  return json({
    ok: false,
    error: "Not found"
  }, 404);
}


// Cron пока только проверяет,
// что Worker умеет запускать
// запланированные задачи.
async function handleScheduled(env) {

  console.log(
    "Tracker scheduled task:",
    new Date().toISOString()
  );

  const result =
    await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM users
    `)
      .first();

  console.log(
    "Users in database:",
    result?.count || 0
  );
}


export default {

  async fetch(request, env) {

    try {

      return await handleRequest(
        request,
        env
      );

    } catch (error) {

      console.error(error);

      return json({
        ok: false,
        error: error.message
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
