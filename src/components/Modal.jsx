import React, { useEffect } from 'react';

export default function Modal({ show, onClose, children, maxWidth = 500 }) {
  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [show]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && show) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}
