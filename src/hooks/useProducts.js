import { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { ref, onValue, set, remove, push, update } from 'firebase/database';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const unsub = onValue(ref(db, 'products'), (snap) => {
      const data = snap.val();
      setProducts(data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : []);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  async function addProduct(data) {
    if (!db) throw new Error('Database tidak terhubung');
    const r = push(ref(db, 'products'));
    await set(r, { ...data, createdAt: Date.now() });
    return r.key;
  }

  async function updateProduct(id, data) {
    if (!db) throw new Error('Database tidak terhubung');
    await update(ref(db, `products/${id}`), { ...data, updatedAt: Date.now() });
  }

  async function deleteProduct(product) {
    if (!db) throw new Error('Database tidak terhubung');
    await fetch('/api/delete-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageTgMsgId: product.imageTgMsgId || null,
        fileTgMsgId:  product.fileTgMsgId  || null,
      }),
    });
    await remove(ref(db, `products/${product.id}`));
  }

  return { products, loading, addProduct, updateProduct, deleteProduct };
}
