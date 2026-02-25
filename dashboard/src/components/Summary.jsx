import React, { useState } from 'react';

export default function Summary({ insights }) {
  const [open, setOpen] = useState(true);

  if (!insights) return null;

  const lines = [insights.summary, ...insights.insights].filter(Boolean);

  return (
    <div className="summary-box">
      <div className="summary-toggle" onClick={() => setOpen(!open)}>
        <div className="summary-label">
          <span className="summary-icon" />
          Summary
        </div>
        <span className={`summary-chevron ${open ? '' : 'collapsed'}`}>&#9660;</span>
      </div>
      {open && (
        <div className="summary-text">
          {lines.map((line, i) => (
            <p key={i} style={i > 0 ? { marginTop: '8px' } : undefined}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
