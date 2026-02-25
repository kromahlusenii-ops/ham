import React, { useState } from 'react';

export default function Summary({ insights }) {
  const [open, setOpen] = useState(true);

  if (!insights) return null;

  const allText = [insights.summary, ...insights.insights].filter(Boolean).join(' ');

  return (
    <div className="summary-box">
      <div className="summary-toggle" onClick={() => setOpen(!open)}>
        <div className="summary-label">
          <span className="summary-icon" />
          Summary
        </div>
        <span className={`summary-chevron ${open ? '' : 'collapsed'}`}>&#9660;</span>
      </div>
      {open && <p className="summary-text">{allText}</p>}
    </div>
  );
}
