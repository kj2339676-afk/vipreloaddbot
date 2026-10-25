export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function createTelegram(token) {
  const base = `https://api.telegram.org/bot${token}`;

  async function call(method, payload = {}) {
    const r = await fetch(`${base}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.json();
  }

  const send = (chat_id, text, extra = {}) =>
    call('sendMessage', {
      chat_id,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra,
    });

  return { call, send };
}
