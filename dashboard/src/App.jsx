import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import Overview from './components/Overview.jsx';
import Directories from './components/Directories.jsx';
import Sessions from './components/Sessions.jsx';
import Efficiency from './components/Efficiency.jsx';
import Summary from './components/Summary.jsx';

export default function App() {
  const [tab, setTab] = useState('overview');
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [health, setHealth] = useState([]);
  const [insights, setInsights] = useState(null);
  const [carbon, setCarbon] = useState(null);
  const [carbonDaily, setCarbonDaily] = useState([]);
  const [carbonSessions, setCarbonSessions] = useState([]);
  const [carbonFiles, setCarbonFiles] = useState([]);
  const [benchmark, setBenchmark] = useState(null);
  const [benchmarkTasks, setBenchmarkTasks] = useState([]);
  const [benchmarkComparison, setBenchmarkComparison] = useState(null);
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
      fetch(`/api/carbon?days=${days}`).then(r => r.json()),
      fetch(`/api/carbon/daily?days=${days}`).then(r => r.json()),
      fetch(`/api/carbon/sessions?days=${days}`).then(r => r.json()),
      fetch(`/api/carbon/files?days=${days}`).then(r => r.json()),
      fetch(`/api/benchmark?days=${days}`).then(r => r.json()),
      fetch(`/api/benchmark/tasks?days=${days}&limit=50`).then(r => r.json()),
      fetch(`/api/benchmark/comparison?days=${days}`).then(r => r.json()),
    ])
      .then(([s, d, dir, sess, h, ins, carb, carbD, carbS, carbF, bench, benchT, benchC]) => {
        setStats(s);
        setDaily(d);
        setDirectories(dir);
        setSessions(sess);
        setHealth(h);
        setInsights(ins);
        setCarbon(carb);
        setCarbonDaily(carbD);
        setCarbonSessions(carbS);
        setCarbonFiles(carbF);
        setBenchmark(bench);
        setBenchmarkTasks(benchT);
        setBenchmarkComparison(benchC);
      })
      .catch(err => console.error('Failed to fetch data:', err))
      .finally(() => setLoading(false));
  }, [days]);

  const summaryEl = !loading && insights ? <Summary insights={insights} /> : null;

  const contentEl = loading ? (
    <div className="empty-state">
      <p>Loading session data...</p>
    </div>
  ) : (
    <>
      {tab === 'overview' && (
        <Overview stats={stats} daily={daily} carbon={carbon} benchmark={benchmark} benchmarkComparison={benchmarkComparison} benchmarkTasks={benchmarkTasks} />
      )}
      {tab === 'directories' && (
        <Directories directories={directories} health={health} />
      )}
      {tab === 'sessions' && (
        <Sessions sessions={sessions} />
      )}
      {tab === 'efficiency' && (
        <Efficiency carbon={carbon} daily={carbonDaily} sessions={carbonSessions} files={carbonFiles} />
      )}
    </>
  );

  return (
    <Layout tab={tab} setTab={setTab} days={days} setDays={setDays} stats={stats}>
      {{ summary: summaryEl, content: contentEl }}
    </Layout>
  );
}
