import React from 'react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'directories', label: 'Directories' },
  { key: 'sessions', label: 'Sessions' },
];

const TIME_OPTIONS = [7, 14, 30];

export default function Layout({ tab, setTab, days, setDays, children }) {
  return (
    <div className="dashboard">
      <header className="header">
        <h1>
          <span>HAM</span> Dashboard
        </h1>
        <div className="header-right">
          <div className="time-filter">
            {TIME_OPTIONS.map(d => (
              <button
                key={d}
                className={`time-btn ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {children}
    </div>
  );
}
