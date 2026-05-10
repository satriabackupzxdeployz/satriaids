import React, { useState, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';

const BADGES   = ['','BEST SELLER','POPULER','BARU','PREMIUM','HEMAT','WEBSITE'];
const GRADIENTS = ['linear-gradient(135deg,#4ade80,#16a34a)','linear-gradient(135deg,#fbbf24,#f97316)','linear-gradient(135deg,#60a5fa,#4f46e5)','linear-gradient(135deg,#c084fc,#ec4899)','linear-gradient(135deg,#2dd4bf,#06b6d4)','linear-gradient(135deg,#f87171,#ef4444)'];
const ICONS    = ['fa-file-alt','fa-image','fa-book','fa-video','fa-font','fa-share-alt'];

const STATUS = {
  success:   { cls:'status-success',   icon:'fa-check-circle',  text:'Berhasil' },
  cancelled: { cls:'status-cancelled', icon:'fa-times-circle',  text:'Dibatalkan' },
  expired:   { cls:'status-expired',   icon:'fa-hourglass-end', text:'Kadaluarsa' },
  pending:   { cls:'status-pending',   icon:'fa-clock',         text:'Pending' },
};

const PANELS = {
  satria: { label:'Satriadevs', seller:'Satriadevs', copyright:'© Satriadevs', color:'#f59e0b', grad:'linear-gradient(135deg,#fbbf24,#f97316)' },
  bimoli: { label:'Bimoli Admin', seller:'Bimoli',   copyright:'Bimoli',       color:'#ec4899', grad:'linear-gradient(135deg,#c084fc,#ec4899)' },
};

function LoginForm({ panel, onLogin }) {
  const cfg = PANELS[panel];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit() {
    setLoading(true); setError('');
    const res  = await fetch('/api/admin-login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username, password, panel }) });
    const json = await res.json();
    if (json.success) onLogin();
    else setError('Username atau password salah.');
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f2f5', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'1.5rem', padding:'2rem', width:'100%', maxWidth:400, boxShadow:'0 20px 50px rgba(0,0,0,.12)' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:cfg.grad, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
            <i className="fas fa-lock" style={{ color:'white', fontSize:'1.5rem' }}></i>
          </div>
          <h2 style={{ fontSize:'1.25rem', fontWeight:900, color:'#1f2937' }}>Login {cfg.label}</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'.875rem', fontWeight:600, color:'#374151', marginBottom:'.25rem' }}>Username</label>
            <input className="input-field" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'.875rem', fontWeight:600, color:'#374151', marginBottom:'.25rem' }}>Password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          {error && <p style={{ color:'#dc2626', fontSize:'.875rem', textAlign:'center' }}>{error}</p>}
          <button className="btn-primary" style={{ width:'100%', padding:'.875rem', background:cfg.grad, border:'none' }} onClick={submit} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Memverifikasi...</> : <><i className="fas fa-sign-in-alt"></i> Masuk</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, seller }) {
  const [name,        setName]        = useState(initial?.name        || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price,       setPrice]       = useState(initial?.price       || '');
  const [discountPrice,setDiscountPrice]=useState(initial?.discountPrice||'');
  const [badge,       setBadge]       = useState(initial?.badge       || '');
  const [imgPreview,  setImgPreview]  = useState(initial?.imageUrl    || '');
  const [imgB64,      setImgB64]      = useState('');
  const [imgMime,     setImgMime]     = useState('');
  const [imgName,     setImgName]     = useState('');
  const [fileB64,     setFileB64]     = useState('');
  const [fileMime,    setFileMime]    = useState('');
  const [fileName,    setFileName]    = useState(initial?.fileName    || '');
  const [fileStatus,  setFileStatus]  = useState(initial?.fileName ? `✅ ${initial.fileName}` : 'Belum ada file');
  const [saving,      setSaving]      = useState(false);
  const imgRef  = useRef();
  const fileRef = useRef();

  function onImgChange(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setImgPreview(ev.target.result); setImgB64(ev.target.result.split(',')[1]); setImgMime(f.type); setImgName(f.name); };
    r.readAsDataURL(f);
  }

  function onFileChange(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setFileB64(ev.target.result.split(',')[1]); setFileMime(f.type); setFileName(f.name); setFileStatus(`✅ ${f.name} (${(f.size/1024).toFixed(1)} KB)`); };
    r.readAsDataURL(f);
  }

  async function save() {
    if (!name || !description || !price || isNaN(parseInt(price))) { alert('Isi semua field wajib!'); return; }
    setSaving(true);
    let imageUrl = initial?.imageUrl || '', imageTgMsgId = initial?.imageTgMsgId || null;
    let fileUrl  = initial?.fileUrl  || '', fileTgMsgId  = initial?.fileTgMsgId  || null;

    if (imgB64) {
      const r = await fetch('/api/upload-media', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ fileBase64:imgB64, fileName:imgName, mimeType:imgMime, caption:`Gambar: ${name}` }) });
      const j = await r.json();
      if (j.success) { imageUrl = j.fileUrl; imageTgMsgId = j.messageId; }
    }
    if (fileB64) {
      const r = await fetch('/api/upload-media', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ fileBase64:fileB64, fileName, mimeType:fileMime, caption:`File: ${name}` }) });
      const j = await r.json();
      if (j.success) { fileUrl = j.fileUrl; fileTgMsgId = j.messageId; }
    }

    const ri = Math.floor(Math.random() * GRADIENTS.length);
    await onSave({ name, description, price:parseInt(price), discountPrice:discountPrice?parseInt(discountPrice):null, badge, seller, imageUrl, imageTgMsgId, fileUrl, fileTgMsgId, fileName, gradient:initial?.gradient||GRADIENTS[ri], icon:initial?.icon||ICONS[ri] });
    setSaving(false);
  }

  const iStyle = { width:'100%', padding:'.625rem .875rem', border:'1.5px solid #e5e7eb', borderRadius:'.625rem', fontSize:'.875rem', outline:'none', fontFamily:'inherit', background:'#fafafa', boxSizing:'border-box' };
  const lStyle = { display:'block', fontSize:'.875rem', fontWeight:600, color:'#374151', marginBottom:'.25rem' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'.75rem', padding:'.75rem 1rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
        <i className="fas fa-tag" style={{ color:'#15803d' }}></i>
        <span style={{ fontSize:'.8rem', color:'#166534', fontWeight:600 }}>Produk diupload oleh: <strong>{seller}</strong></span>
      </div>
      <div>
        <label style={lStyle}>Gambar Produk <span style={{ color:'#9ca3af', fontSize:'.75rem' }}>(opsional)</span></label>
        <div style={{ border:'2px dashed #d1d5db', borderRadius:'.75rem', padding:'1rem', textAlign:'center', cursor:'pointer', background:'#f9fafb' }} onClick={() => imgRef.current.click()}>
          <input type="file" accept="image/*" ref={imgRef} style={{ display:'none' }} onChange={onImgChange} />
          <i className="fas fa-cloud-upload-alt" style={{ fontSize:'2rem', color:'#9ca3af', marginBottom:'.5rem', display:'block' }}></i>
          <p style={{ fontSize:'.875rem', color:'#6b7280' }}>Klik untuk upload gambar</p>
        </div>
        {imgPreview && <img src={imgPreview} alt="preview" style={{ width:'100%', maxHeight:192, objectFit:'contain', borderRadius:'.75rem', marginTop:'.5rem' }} onContextMenu={e => e.preventDefault()} draggable={false} />}
      </div>
      <div>
        <label style={lStyle}>File Produk <span style={{ color:'#ef4444' }}>*</span></label>
        <div style={{ border:'2px dashed #fcd34d', borderRadius:'.75rem', padding:'1rem', textAlign:'center', cursor:'pointer', background:'#fffbeb' }} onClick={() => fileRef.current.click()}>
          <input type="file" ref={fileRef} style={{ display:'none' }} onChange={onFileChange} />
          <i className="fas fa-file-archive" style={{ fontSize:'2rem', color:'#f59e0b', marginBottom:'.5rem', display:'block' }}></i>
          <p style={{ fontSize:'.875rem', color:'#6b7280' }}>Upload file produk</p>
          <p style={{ fontSize:'.75rem', color:'#9ca3af', marginTop:'.25rem' }}>{fileStatus}</p>
        </div>
      </div>
      <div><label style={lStyle}>Nama Produk <span style={{ color:'#ef4444' }}>*</span></label><input className="input-field" placeholder="Nama produk..." value={name} onChange={e => setName(e.target.value)} /></div>
      <div><label style={lStyle}>Deskripsi <span style={{ color:'#ef4444' }}>*</span></label><textarea className="input-field" rows={3} placeholder="Deskripsi produk..." value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div>
        <label style={lStyle}>Harga Normal <span style={{ color:'#ef4444' }}>*</span></label>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', color:'#6b7280', fontWeight:700 }}>Rp</span>
          <input className="input-field" style={{ paddingLeft:'2.5rem' }} type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={lStyle}>Harga Coret <span style={{ color:'#9ca3af', fontSize:'.75rem' }}>(opsional)</span></label>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', color:'#6b7280', fontWeight:700 }}>Rp</span>
          <input className="input-field" style={{ paddingLeft:'2.5rem' }} type="number" placeholder="0" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={lStyle}>Badge <span style={{ color:'#9ca3af', fontSize:'.75rem' }}>(opsional)</span></label>
        <select className="input-field" value={badge} onChange={e => setBadge(e.target.value)}>
          {BADGES.map(b => <option key={b} value={b}>{b || 'Tanpa Badge'}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', gap:'.75rem', paddingTop:'.5rem' }}>
        <button onClick={onCancel} style={{ flex:1, padding:'.875rem', border:'2px solid #d1d5db', borderRadius:999, fontWeight:700, background:'white', cursor:'pointer', color:'#374151' }}>Batal</button>
        <button className="btn-primary" style={{ flex:1, padding:'.875rem' }} onClick={save} disabled={saving}>
          {saving ? <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</> : <><i className="fas fa-save"></i> Simpan</>}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage({ panel = 'satria' }) {
  const cfg = PANELS[panel] || PANELS.satria;
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab,      setTab]      = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { orders, updateOrder } = useOrders();

  if (!loggedIn) return <LoginForm panel={panel} onLogin={() => setLoggedIn(true)} />;

  const myProducts = products.filter(p => (p.seller || 'Satriadevs') === cfg.seller);
  const myOrders   = orders.filter(o   => (o.seller || 'Satriadevs') === cfg.seller);

  async function handleSave(data) {
    if (editing) await updateProduct(editing.id, data);
    else         await addProduct(data);
    setShowForm(false); setEditing(null);
    alert('✅ Produk berhasil disimpan!');
  }

  async function handleDelete(p) {
    if (!confirm(`Hapus "${p.name}"?`)) return;
    await deleteProduct(p);
  }

  const fmt = (ts) => new Date(ts).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem 1rem 4rem', minHeight:'100vh', background:'#f0f2f5' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'.75rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:'#1f2937' }}>
            <i className="fas fa-shield-alt" style={{ color:cfg.color, marginRight:'.5rem' }}></i>{cfg.label} Panel
          </h1>
        </div>
        <button className="btn-danger" style={{ padding:'.5rem 1.25rem', fontSize:'.875rem' }} onClick={() => { if (confirm('Logout?')) setLoggedIn(false); }}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.5rem' }}>
        {[['products','fa-box','Produk'],['orders','fa-receipt','Pesanan']].map(([k,ic,lb]) => (
          <button key={k} className={`nav-btn ${tab === k ? 'nav-btn-active' : 'nav-btn-ghost'}`} onClick={() => setTab(k)}>
            <i className={`fas ${ic}`}></i> {lb}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div>
          {!showForm && (
            <button className="btn-primary" style={{ marginBottom:'1.25rem', padding:'.625rem 1.5rem' }} onClick={() => { setEditing(null); setShowForm(true); }}>
              <i className="fas fa-plus"></i> Tambah Produk
            </button>
          )}
          {showForm && (
            <div style={{ background:'white', borderRadius:'1.25rem', padding:'1.25rem', marginBottom:'1.25rem', boxShadow:'0 4px 15px rgba(0,0,0,.06)' }}>
              <h2 style={{ fontSize:'1.125rem', fontWeight:900, marginBottom:'1rem', color:'#1f2937' }}>
                <i className={`fas ${editing ? 'fa-edit' : 'fa-plus-circle'}`} style={{ marginRight:'.5rem', color:editing ? '#f59e0b':'#22c55e' }}></i>
                {editing ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <ProductForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} seller={cfg.seller} />
            </div>
          )}
          {myProducts.length === 0
            ? <div style={{ textAlign:'center', padding:'3rem', background:'white', borderRadius:'1.25rem' }}>
                <i className="fas fa-box-open" style={{ fontSize:'3rem', color:'#d1d5db', marginBottom:'1rem', display:'block' }}></i>
                <p style={{ color:'#6b7280' }}>Belum ada produk</p>
              </div>
            : <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                {myProducts.map(p => (
                  <div key={p.id} style={{ background:'white', borderRadius:'1rem', padding:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,.05)', display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ width:56, height:56, borderRadius:'.5rem', background:p.gradient||GRADIENTS[0], display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onContextMenu={e => e.preventDefault()} draggable={false} />
                        : <i className={`fas ${p.icon||'fa-file'}`} style={{ color:'rgba(255,255,255,.7)', fontSize:'1.5rem' }}></i>
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</p>
                      <p style={{ fontSize:'.875rem', fontWeight:900, color:'#22c55e' }}>{'Rp'+p.price.toLocaleString('id-ID')}</p>
                      <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap', marginTop:'.2rem' }}>
                        {p.badge && <span style={{ fontSize:'.7rem', fontWeight:700, color:'#6b7280', background:'#f3f4f6', padding:'.15rem .5rem', borderRadius:999 }}>{p.badge}</span>}
                        <span style={{ fontSize:'.68rem', fontWeight:700, color: p.seller==='Bimoli'?'#db2777':'#6b7280', background: p.seller==='Bimoli'?'#fdf2f8':'#f3f4f6', border:`1px solid ${p.seller==='Bimoli'?'#fbcfe8':'#e5e7eb'}`, padding:'.15rem .5rem', borderRadius:999 }}>
                          {p.seller==='Bimoli'?'Bimoli':'© Satriadevs'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'.5rem' }}>
                      <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ padding:'.5rem .75rem', background:'#fef3c7', color:'#b45309', border:'none', borderRadius:999, cursor:'pointer', fontWeight:700 }}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDelete(p)} style={{ padding:'.5rem .75rem', background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:999, cursor:'pointer', fontWeight:700 }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {tab === 'orders' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          {myOrders.length === 0
            ? <div style={{ textAlign:'center', padding:'3rem', background:'white', borderRadius:'1.25rem' }}>
                <i className="fas fa-receipt" style={{ fontSize:'3rem', color:'#d1d5db', marginBottom:'1rem', display:'block' }}></i>
                <p style={{ color:'#6b7280' }}>Belum ada pesanan</p>
              </div>
            : myOrders.map(o => {
                const s = STATUS[o.status] || STATUS.pending;
                return (
                  <div key={o.id} style={{ background:'white', borderRadius:'1rem', padding:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'.5rem' }}>
                      <div style={{ flex:1 }}>
                        <p style={{ fontWeight:700 }}>{o.productName}</p>
                        <p style={{ fontSize:'.75rem', color:'#6b7280' }}>{fmt(o.createdAt)}</p>
                        <p style={{ fontSize:'.8rem', color:'#374151', marginTop:'.25rem' }}>{'Rp'+(o.price||0).toLocaleString('id-ID')}</p>
                        {(o.phone || o.email || o.buyerMessage) && (
                          <div style={{ marginTop:'.5rem', background:'#f9fafb', borderRadius:'.5rem', padding:'.5rem .75rem', fontSize:'.75rem', color:'#374151', display:'flex', flexDirection:'column', gap:'.2rem' }}>
                            {o.phone        && <span><i className="fas fa-phone"   style={{ color:'#6b7280', marginRight:'.35rem', width:14 }}></i>{o.phone}</span>}
                            {o.email        && <span><i className="fas fa-envelope" style={{ color:'#6b7280', marginRight:'.35rem', width:14 }}></i>{o.email}</span>}
                            {o.buyerMessage && <span><i className="fas fa-comment"  style={{ color:'#6b7280', marginRight:'.35rem', width:14 }}></i>{o.buyerMessage}</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span className={s.cls} style={{ display:'inline-block', padding:'.25rem .75rem', borderRadius:999, fontSize:'.75rem', fontWeight:700 }}>
                          <i className={`fas ${s.icon}`} style={{ marginRight:'.25rem' }}></i>{s.text}
                        </span>
                        {o.status === 'pending' && (
                          <div style={{ marginTop:'.5rem' }}>
                            <button className="btn-primary" style={{ fontSize:'.75rem', padding:'.35rem .875rem' }} onClick={() => { if (confirm('Tandai berhasil?')) updateOrder(o.id, { status:'success' }); }}>
                              <i className="fas fa-check"></i> Tandai Berhasil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}
