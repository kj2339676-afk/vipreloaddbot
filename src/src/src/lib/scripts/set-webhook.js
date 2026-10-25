// Run once after deploying (or when the function URL changes):
// BOT_TOKEN=... FUNCTION_URL=... WEBHOOK_SECRET=... node scripts/set-webhook.js
const { BOT_TOKEN, FUNCTION_URL, WEBHOOK_SECRET } = process.env;

if (!BOT_TOKEN || !FUNCTION_URL || !WEBHOOK_SECRET) {
  console.error('Missing BOT_TOKEN, FUNCTION_URL or WEBHOOK_SECRET');
  process.exit(1);
}

const api = async (method, payload = {}) => {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
};

console.log('setWebhook:', await api('setWebhook', {
  url: FUNCTION_URL,
  secret_token: WEBHOOK_SECRET,
  allowed_updates: ['message'],
  drop_pending_updates: true,
}));

console.log('setMyCommands:', await api('setMyCommands', {
  commands: [
    { command: 'start', description: 'Welcome message' },
    { command: 'help', description: 'List of commands' },
    { command: 'about', description: 'About this bot' },
    { command: 'id', description: 'Show your Telegram ID' },
  ],
}));

console.log('getWebhookInfo:', await api('getWebhookInfo'));
