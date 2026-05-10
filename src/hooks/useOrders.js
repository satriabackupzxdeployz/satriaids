import { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { ref, onValue, set, push, update } from 'firebase/database';

export function useOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onValue(ref(db, 'orders'), (snap) => {
      const data = snap.val();
      setOrders(data
        ? Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.createdAt - a.createdAt)
        : []
      );
    });
    return () => unsub();
  }, []);

  async function createOrder(data) {
    if (!db) throw new Error('Database tidak terhubung');
    const r = push(ref(db, 'orders'));
    await set(r, { ...data, status: 'pending', createdAt: Date.now() });
    return r.key;
  }

  async function updateOrder(id, data) {
    if (!db) throw new Error('Database tidak terhubung');
    await update(ref(db, `orders/${id}`), { ...data, updatedAt: Date.now() });
  }

  function listenToOrder(id, cb) {
    if (!db) return () => {};
    return onValue(ref(db, `orders/${id}`), (snap) => {
      if (snap.exists()) cb(snap.val());
    });
  }

  return { orders, createOrder, updateOrder, listenToOrder };
}
