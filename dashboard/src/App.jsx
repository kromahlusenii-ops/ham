import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import Overview from './components/Overview.jsx';
import Directories from './components/Directories.jsx';
import Sessions from './components/Sessions.jsx';

export default function App() {
  const [tab, setTab] = useState('overview');
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [health, setHealth] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/stats?days=${days}`).then(r => r.json()),
      fetch(`/api/daily?days=${days}`).then(r => r.json()),
      fetch(`/api/directories?days=${days}`).then(r => r.json()),
      fetch(`/api/sessions?days=${days}&limit=100`).then(r => r.json()),
      fetch('/api/health').then(r => r.json()),
      fetch(`/api/insights?days=${days}`).then(r => r.json()),
    ])
      .then(([s, d, dir, sess, h, ins]) => {
        setStats(s);
        setDaily(d);
        setDirectories(dir);
        setSessions(sess);
        setHealth(h);
        setInsights(ins);
      })
      .catch(err => console.error('Failed to fetch data:', err))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <Layout tab={tab} setTab={setTab} days={days} setDays={setDays}>
      {loading ? (
        <div className="empty-state">
          <p>Loading session data...</p>
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <Overview stats={stats} daily={daily} health={health} insights={insights} />
          )}
          {tab === 'directories' && (
            <Directories directories={directories} />
          )}
          {tab === 'sessions' && (
            <Sessions sessions={sessions} />
          )}
        </>
      )}
    </Layout>
  );
}
