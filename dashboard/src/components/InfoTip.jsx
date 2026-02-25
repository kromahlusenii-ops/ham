import React, { useState } from 'react';

/**
 * Small (i) button that toggles an explanation panel inline.
 */
export default function InfoTip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="infotip-wrap">
      <button
        className={`infotip-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="More info"
      >
        i
      </button>
      {open && (
        <div className="infotip-body">
          {text}
        </div>
      )}
    </span>
  );
}
