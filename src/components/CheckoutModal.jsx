import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { useOrders } from '../hooks/useOrders';

export default function CheckoutModal({ product, show, onClose }) {
  const [step,        setStep]        = useState('form');
  const [buyerName,   setBuyerName]   = useState('');
  const [phone,       setPhone]       = useState('');
  const [email,       setEmail]       = useState('');
  const [buyerMessage,setBuyerMessage]= useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [qrisData,    setQrisData]    = useState(null);
  const [orderId,     setOrderId]     = useState(null);
  const [fbOrderId,   setFbOrderId]   = useState(null);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [fileUrl,     setFileUrl]     = useState(null);
  const [countdown,   setCountdown]   = useState(null);
  const countdownRef = useRef(null);
  const pollRef      = useRef(null);
  const { createOrder } = useOrders();

  useEffect(() => {
    if (!show) {
      setStep('form');
      setBuyerName(''); setPhone(''); setEmail(''); setBuyerMessage('');
      setError(''); setLoading(false);
      setQrisData(null); setOrderId(null); setFbOrderId(null);
      setOrderStatus('pending'); setFileUrl(null); setCountdown(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current)      clearInterval(pollRef.current);
    }
  }, [show]);

  // Polling status setiap 3 detik — persis seperti referensi
  useEffect(() => {
    if (!orderId || step !== 'qris') return;

    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/check-payment?orderId=${orderId}`);
        const data = await res.json();
        if (data.status === 'success') {
          setOrderStatus('success');
          setFileUrl(product.fileUrl || null);
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
          // Update Firebase juga
          if (fbOrderId) {
            await fetch('/api/update-order', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ fbOrderId, status: 'success' }),
            }).catch(() => {});
          }
        } else if (data.status === 'expired') {
          setOrderStatus('expired');
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [orderId, step, fbOrderId, product]);

  async function handleProcess() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId:   product.id,
          amount:      product.price,
          productName: product.name,
          seller:      product.seller || 'Satriadevs',
          buyerName:   buyerName    || null,
          phone:       phone        || null,
          email:       email        || null,
          buyerMessage:buyerMessage || null,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Gagal membuat pembayaran.');
        setLoading(false); return;
      }

      setQrisData(json);
      setOrderId(json.orderId);

      const expiresAt = json.expiresAt || Date.now() + 5 * 60 * 1000;
      setCountdown(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
      countdownRef.current = setInterval(() => {
        setCountdown(p => { if (p <= 1) { clearInterval(countdownRef.current); return 0; } return p - 1; });
      }, 1000);

      // Simpan ke Firebase
      const key = await createOrder({
        productId:    product.id,
        productName:  product.name,
        price:        product.price,
        seller:       product.seller || 'Satriadevs',
        orderId:      json.orderId,
        buyerName:    buyerName    || null,
        phone:        phone        || null,
        email:        email        || null,
        buyerMessage: buyerMessage || null,
        expiryTime:   expiresAt,
        method:       'QRIS',
      }).catch(() => null);
      setFbOrderId(key);

      setStep('qris');
    } catch {
      setError('Terjadi kesalahan koneksi. Coba lagi.');
    }
    setLoading(false);
  }

  const fmt = s => s === null ? '--:--' : `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  if (!product) return null;
  const priceF = 'Rp' + product.price.toLocaleString('id-ID');
  const iStyle = { width:'100%', padding:'.625rem .875rem', border:'1.5px solid #e5e7eb', borderRadius:'.625rem', fontSize:'.875rem', outline:'none', fontFamily:'inherit', background:'#fafafa', boxSizing:'border-box' };
  const lStyle = { display:'block', fontSize:'.8rem', fontWeight:600, color:'#374151', marginBottom:'.3rem' };

  return (
    <Modal show={show} onClose={onClose} maxWidth={500}>
      <div style={{ padding:'1.25rem 1.25rem .75rem', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'white', borderRadius:'1.5rem 1.5rem 0 0', zIndex:10 }}>
        <h2 style={{ fontSize:'1.25rem', fontWeight:900, color:'#1f2937' }}>🛒 Checkout</h2>
        <button onClick={onClose} style={{ width:40, height:40, borderRadius:'50%', background:'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <i className="fas fa-times" style={{ color:'#6b7280' }}></i>
        </button>
      </div>

      <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div style={{ background:'#f0fdf4', borderRadius:'.75rem', padding:'1rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
          <div style={{ width:48, height:48, borderRadius:'.5rem', background:'#bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="fas fa-shopping-cart" style={{ color:'#15803d' }}></i>
          </div>
          <div>
            <p style={{ fontSize:'.875rem', color:'#166534', fontWeight:600 }}>{product.name}</p>
            <p style={{ fontSize:'1.25rem', fontWeight:900, color:'#14532d' }}>{priceF}</p>
          </div>
        </div>

        {step === 'form' && (<>
          <div style={{ background:'#f9fafb', borderRadius:'.75rem', padding:'1rem', display:'flex', flexDirection:'column', gap:'.75rem', border:'1px solid #f3f4f6' }}>
            <p style={{ fontSize:'.8rem', fontWeight:700, color:'#374151', marginBottom:'.15rem' }}>
              <i className="fas fa-user-circle" style={{ color:'#6b7280', marginRight:'.35rem' }}></i>
              Data Pembeli <span style={{ color:'#9ca3af', fontWeight:400 }}>(opsional)</span>
            </p>
            <div>
              <label style={lStyle}>Nama</label>
              <input style={iStyle} type="text" placeholder="Nama kamu..." value={buyerName} onChange={e => setBuyerName(e.target.value)} />
            </div>
            <div>
              <label style={lStyle}>Email</label>
              <input style={iStyle} type="email" placeholder="email@kamu.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={lStyle}>No. Telepon / WhatsApp</label>
              <input style={iStyle} type="tel" placeholder="081234567890" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={lStyle}>Pesan untuk Admin</label>
              <textarea style={{ ...iStyle, resize:'vertical', minHeight:68 }} placeholder="Tulis pesan..." value={buyerMessage} onChange={e => setBuyerMessage(e.target.value)} rows={3} />
            </div>
          </div>

          <div style={{ background:'#eff6ff', borderRadius:'.75rem', padding:'1rem', border:'1px solid #bfdbfe' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.25rem' }}>
              <i className="fas fa-qrcode" style={{ color:'#2563eb' }}></i>
              <span style={{ fontWeight:700, color:'#1e40af' }}>Metode: QRIS</span>
            </div>
            <p style={{ fontSize:'.75rem', color:'#3b82f6' }}>Scan kode QRIS setelah menekan tombol. Berlaku <strong>5 menit</strong>.</p>
          </div>

          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'.75rem', padding:'.75rem 1rem', color:'#dc2626', fontSize:'.875rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <button className="btn-primary" style={{ width:'100%', padding:'.875rem', fontSize:'1rem', opacity: loading ? 0.65 : 1 }} onClick={handleProcess} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight:'.5rem' }}></i>Memproses...</> : <><i className="fas fa-qrcode" style={{ marginRight:'.5rem' }}></i>Proses Pembayaran QRIS</>}
          </button>
        </>)}

        {step === 'qris' && (<>
          {orderStatus === 'success' ? (
            <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
              <i className="fas fa-check-circle" style={{ fontSize:'3rem', color:'#22c55e', marginBottom:'1rem', display:'block' }}></i>
              <p style={{ fontSize:'1.125rem', fontWeight:700, color:'#15803d' }}>Pembayaran Berhasil! 🎉</p>
              <p style={{ color:'#4b7c4b', fontSize:'.875rem', marginTop:'.5rem' }}>Terima kasih sudah membeli {product.name}!</p>
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-download" style={{ marginTop:'1.25rem', width:'100%', justifyContent:'center', display:'flex' }}>
                  <i className="fas fa-download" style={{ marginRight:'.5rem' }}></i>Download Produk
                </a>
              )}
            </div>
          ) : orderStatus === 'expired' ? (
            <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
              <i className="fas fa-hourglass-end" style={{ fontSize:'3rem', color:'#ef4444', marginBottom:'1rem', display:'block' }}></i>
              <p style={{ fontSize:'1.125rem', fontWeight:700, color:'#dc2626' }}>Pembayaran Kadaluarsa</p>
              <p style={{ color:'#6b7280', fontSize:'.875rem', marginTop:'.5rem' }}>Waktu habis. Silakan coba lagi.</p>
              <button className="btn-primary" style={{ marginTop:'1.25rem', width:'100%' }} onClick={onClose}>Tutup & Coba Lagi</button>
            </div>
          ) : (<>
            <div style={{ border:'2px dashed #22c55e', borderRadius:'.75rem', padding:'1.5rem', textAlign:'center', background:'#f0fdf4' }}>
              <h3 style={{ fontWeight:700, fontSize:'1.125rem', marginBottom:'.75rem' }}>Scan QRIS</h3>
              {qrisData?.qrisImage
                ? <img src={qrisData.qrisImage} alt="QRIS" style={{ width:200, height:200, margin:'0 auto', display:'block', borderRadius:'.5rem' }} onContextMenu={e => e.preventDefault()} draggable={false} />
                : <div style={{ width:200, height:200, margin:'0 auto', background:'#e5e7eb', borderRadius:'.5rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <i className="fas fa-qrcode" style={{ fontSize:'5rem', color:'#9ca3af' }}></i>
                  </div>
              }
              <p style={{ fontSize:'.875rem', color:'#15803d', fontWeight:600, marginTop:'.75rem' }}>QRIS — {product.name}</p>
              <p style={{ fontSize:'.75rem', color:'#6b7280' }}>Scan dengan e-wallet / mobile banking apapun</p>
            </div>

            {qrisData?.payUrl && (
              <a href={qrisData.payUrl} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'.75rem', padding:'.75rem', color:'#15803d', textDecoration:'none', fontWeight:600, fontSize:'.875rem' }}>
                <i className="fas fa-external-link-alt"></i> Buka Halaman Pembayaran
              </a>
            )}

            {orderId && (
              <div style={{ background:'#f9fafb', borderRadius:'.75rem', padding:'.75rem 1rem', fontSize:'.8rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'#6b7280' }}>Order ID</span>
                  <span style={{ fontFamily:'monospace', fontWeight:700 }}>{orderId}</span>
                </div>
              </div>
            )}

            <div style={{ background:'#fffbeb', borderRadius:'.75rem', padding:'1rem', textAlign:'center', border:'1px solid #fde68a' }}>
              <p style={{ fontSize:'.75rem', color:'#b45309', marginBottom:'.25rem' }}>
                <i className="fas fa-hourglass-half" style={{ marginRight:'.25rem' }}></i>Sisa waktu pembayaran:
              </p>
              <p className={`qris-countdown ${countdown !== null && countdown < 60 ? 'countdown-warning' : ''}`} style={{ color:'#b45309' }}>{fmt(countdown)}</p>
            </div>

            <p style={{ fontSize:'.75rem', color:'#3b82f6', background:'#eff6ff', padding:'.75rem', borderRadius:'.75rem' }}>
              <i className="fas fa-info-circle" style={{ marginRight:'.25rem' }}></i>
              Menunggu konfirmasi pembayaran... Status berubah otomatis setelah transfer berhasil.
            </p>
          </>)}
        </>)}
      </div>
    </Modal>
  );
}
