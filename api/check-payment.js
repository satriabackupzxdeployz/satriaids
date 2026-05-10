export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { orderId } = req.query;
  if (!orderId) return res.status(400).json({ success: false, error: 'orderId diperlukan' });

  const apiKey = process.env.CLAIDEXPAY_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'Payment gateway belum dikonfigurasi' });

  try {
    const checkRes = await fetch(
      `https://api.claidexpayment.host/check-payment.php?api_key=${apiKey}&reference=${orderId}`
    );

    if (!checkRes.ok) {
      const errText = await checkRes.text();
      return res.status(500).json({ success: false, error: errText });
    }

    const data = await checkRes.json();

    const isPaid    = ['paid', 'success', 'PAID', 'SUCCESS', 'completed', 'COMPLETED'].includes(data.status);
    const isExpired = ['expired', 'EXPIRED', 'cancelled', 'CANCELLED', 'failed', 'FAILED'].includes(data.status);

    return res.status(200).json({
      success:  true,
      status:   isPaid ? 'success' : isExpired ? 'expired' : 'pending',
      orderId,
      raw:      data,
    });

  } catch (err) {
    console.error('[check-payment]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
