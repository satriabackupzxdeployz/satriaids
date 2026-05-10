export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password, panel } = req.body;
  if (panel === 'bimoli') {
    if (username === process.env.BIMOLI_ADMIN_USERNAME && password === process.env.BIMOLI_ADMIN_PASSWORD)
      return res.status(200).json({ success: true });
    return res.status(401).json({ success: false });
  }
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD)
    return res.status(200).json({ success: true });
  return res.status(401).json({ success: false });
}
