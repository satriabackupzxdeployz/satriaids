export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { amount, productId, productName, seller, buyerName, phone, email, buyerMessage } = req.body;

  if (!amount || isNaN(amount) || Number(amount) < 1000) {
    return res.status(400).json({ success: false, error: 'Minimal pembayaran Rp 1.000' });
  }

  const apiKey = process.env.CLAIDEXPAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Payment gateway belum dikonfigurasi' });
  }

  try {
    const qrisRes = await fetch(
      `https://api.claidexpayment.host/create-qr.php?api_key=${apiKey}&amount=${Number(amount)}`
    );

    if (!qrisRes.ok) {
      const errText = await qrisRes.text();
      return res.status(500).json({ success: false, error: `ClaidexPay error: ${errText}` });
    }

    const qrisData = await qrisRes.json();

    if (!qrisData.success) {
      return res.status(500).json({ success: false, error: qrisData.error || 'Gagal membuat QRIS' });
    }

    const orderId   = qrisData.reference || `WEB-${Date.now()}`;
    const expiresAt = Date.now() + 5 * 60 * 1000;

    return res.status(200).json({
      success:      true,
      orderId,
      qrisImage:    qrisData.qrImage,
      qrisContent:  qrisData.qrContent,
      payUrl:       qrisData.payUrl,
      statusUrl:    qrisData.statusUrl,
      expiresAt,
    });

  } catch (err) {
    console.error('[create-payment]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
