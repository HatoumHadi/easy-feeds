import React from 'react';

const FloatingMessage = ({ message, onClose, type = 'error' }) => {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 9999,
      background: type === 'error' ? '#fee2e2' : '#d1fae5',
      color: type === 'error' ? '#b91c1c' : '#065f46',
      border: `1.5px solid ${type === 'error' ? '#f87171' : '#34d399'}`,
      borderRadius: 10,
      padding: '16px 32px 16px 18px',
      minWidth: 220,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontWeight: 500,
      fontSize: 16
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 20, cursor: 'pointer', marginLeft: 8 }}>
        <i className="fa fa-times" />
      </button>
    </div>
  );
};

export default FloatingMessage;
