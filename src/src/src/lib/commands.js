import { esc } from './telegram.js';

export const DEFAULT_WELCOME =
  'Welcome, <b>{name}</b>! 👋\n\nI am @vipreloaddbot. Send /help to see what I can do.';

const render = (template, name) => template.replaceAll('{name}', esc(name));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function handleMessage({ msg, tg, store, adminId }) {
  const chat = msg.chat;

  // Groups: only welcome new members
  if (chat.type !== 'private') {
    if (msg.new_chat_members?.length) {
      const template = await store.getSetting('welcome', DEFAULT_WELCOME);
      for (const m of msg.new_chat_members) {
        if (m.is_bot) continue;
        await tg.send(chat.id, render(template, m.first_name));
      }
    }
    return;
  }

  if (!msg.text || !msg.from) return;

  const user = msg.from;
  const text = msg.text.trim();
  const cmdRaw = text.split(/\s+/)[0];
  const cmd = cmdRaw.toLowerCase().split('@')[0];
  const args = text.slice(cmdRaw.length).trim();
  const isAdmin = String(user.id) === String(adminId);

  await store.ensureUser(user);

  switch (cmd) {
    case '/start': {
      const template = await store.getSetting('welcome', DEFAULT_WELCOME);
      await tg.send(chat.id, render(template, user.first_name));
      return;
    }

    case '/help': {
      let out =
        '<b>Commands</b>\n' +
        '/start - welcome message\n' +
        '/help - this list\n' +
        '/about - about this bot\n' +
        '/id - show your Telegram ID';
      if (isAdmin) {
        out +=
          '\n\n<b>Admin</b>\n' +
          '/stats - number of users\n' +
          '/broadcast &lt;text&gt; - message all users\n' +
          '/setwelcome &lt;text&gt; - change the welcome message ({name} = user name)';
      }
      await tg.send(chat.id, out);
      return;
    }

    case '/about':
      await tg.send(chat.id, 'This bot is part of my project. More features coming soon.');
      return;

    case '/id':
      await tg.send(chat.id, `Your Telegram ID: <code>${user.id}</code>`);
      return;

    case '/stats':
      if (!isAdmin) break;
      await tg.send(chat.id, `Total users: ${await store.countUsers()}`);
      return;

    case '/setwelcome':
      if (!isAdmin) break;
      if (!args) {
        await tg.send(chat.id, 'Usage: /setwelcome your text here. Use {name} for the user name.');
        return;
      }
      await store.setSetting('welcome', args);
      await tg.send(chat.id, 'Welcome message updated. Preview:\n\n' + render(args, user.first_name));
      return;

    case '/broadcast': {
      if (!isAdmin) break;
      if (!args) {
        await tg.send(chat.id, 'Usage: /broadcast your message');
        return;
      }
      let sent = 0;
      let failed = 0;
      for await (const id of store.allUserIds()) {
        const r = await tg.send(id, esc(args));
        r.ok ? sent++ : failed++;
        await sleep(50); // stay under Telegram rate limits
      }
      await tg.send(chat.id, `Broadcast done. Sent: ${sent}, failed: ${failed}.`);
      return;
    }
  }

  await tg.send(chat.id, 'I did not understand that. Send /help to see the commands.');
}
