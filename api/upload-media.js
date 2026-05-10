export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { fileBase64, fileName, mimeType, caption } = req.body;
  const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  try {
    const buffer   = Buffer.from(fileBase64, 'base64');
    const blob     = new Blob([buffer], { type: mimeType });
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('caption', caption || fileName);
    const isImage  = mimeType && mimeType.startsWith('image/');
    formData.append(isImage ? 'photo' : 'document', blob, fileName);
    const tgRes  = await fetch(`https://api.telegram.org/bot${TOKEN}/${isImage ? 'sendPhoto' : 'sendDocument'}`, { method:'POST', body:formData });
    const tgData = await tgRes.json();
    if (!tgData.ok) return res.status(500).json({ success:false, error:tgData.description });
    const msg    = tgData.result;
    const fileId = isImage ? msg.photo[msg.photo.length-1].file_id : msg.document.file_id;
    const infoRes  = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
    const infoData = await infoRes.json();
    return res.status(200).json({ success:true, fileId, fileUrl:`https://api.telegram.org/file/bot${TOKEN}/${infoData.result.file_path}`, messageId:msg.message_id });
  } catch (err) {
    return res.status(500).json({ success:false, error:err.message });
  }
}
