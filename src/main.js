import { createTelegram } from './lib/telegram.js';
import { createStore } from './lib/db.js';
import { handleMessage } from './lib/commands.js';

export default async ({ req, res, log, error }) => {
  const env = process.env;

  // Opening the function URL in a browser shows this
  if (req.method === 'GET') return res.text('vipreloaddbot is running');

  // Only accept requests that carry your webhook secret
  if (req.headers['x-telegram-bot-api-secret-token'] !== env.WEBHOOK_SECRET) {
    return res.text('forbidden', 403);
  }

  const tg = createTelegram(env.BOT_TOKEN);
  const store = createStore({
    endpoint: env.APPWRITE_FUNCTION_API_ENDPOINT ?? env.APPWRITE_ENDPOINT,
    project: env.APPWRITE_FUNCTION_PROJECT_ID ?? env.APPWRITE_PROJECT_ID,
    key: req.headers['x-appwrite-key'] ?? env.APPWRITE_API_KEY ?? '',
    databaseId: env.DATABASE_ID,
    usersId: env.USERS_COLLECTION_ID,
    settingsId: env.SETTINGS_COLLECTION_ID,
  });

  try {
    const msg = req.bodyJson?.message;
    if (msg) await handleMessage({ msg, tg, store, adminId: env.ADMIN_ID });
  } catch (e) {
    error(String(e?.stack ?? e));
  }

  // Always answer 200 so Telegram does not keep retrying
  return res.text('ok');
};
