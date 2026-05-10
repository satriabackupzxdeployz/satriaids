export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messageId, imageTgMsgId, fileTgMsgId } = req.body;
  const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const ids = [...new Set([messageId, imageTgMsgId, fileTgMsgId].filter(Boolean))];
  if (!ids.length) return res.status(400).json({ success:false });
  const results = await Promise.allSettled(ids.map(id =>
    fetch(`https://api.telegram.org/bot${TOKEN}/deleteMessage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ chat_id:CHAT_ID, message_id:id }) }).then(r => r.json())
  ));
  return res.status(200).json({ success:true, deleted:results.map((r,i) => ({ id:ids[i], ok:r.status==='fulfilled'&&r.value?.ok })) });
}
