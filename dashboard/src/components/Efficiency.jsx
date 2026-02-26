import React from 'react';
import MetricCard from './MetricCard.jsx';
import InfoTip from './InfoTip.jsx';

// --- Formatting helpers ---

function formatCO2e(grams) {
  if (grams < 1) return '< 1g';
  if (grams < 1000) return Math.round(grams) + 'g';
  return (grams / 1000).toFixed(1) + ' kg';
}

function formatEnergy(wh) {
  if (wh < 1) return '< 1 Wh';
  return '~' + Math.round(wh) + ' Wh';
}

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatPct(n) {
  return n.toFixed(1) + '%';
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '-';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + 'h ' + m + 'm';
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// --- Equivalents ---

function getEquivalent(grams) {
  if (grams < 50) return 'a few minutes of monitor use';
  if (grams < 200) return Math.round(grams / 40) + ' smartphone charges';
  if (grams < 500) return Math.round(grams / 100) + ' hours of laptop use';
  if (grams < 2000) return 'a load of laundry';
  if (grams < 10000) return Math.round(grams / 2000) + ' days of home WiFi';
  return (grams / 3785).toFixed(1) + ' gallons of gas';
}

// --- Did You Know facts ---

const FACTS = [
  {
    fact: 'A single ChatGPT query uses about 10x more electricity than a Google search.',
    source: 'International Energy Agency, 2024',
    url: 'https://www.iea.org/reports/electricity-2024',
    ham: 'HAM reduces the tokens per query, directly cutting the energy each request consumes.',
  },
  {
    fact: 'Data centers are projected to consume 945 TWh by 2030 — more than Japan\'s entire electricity consumption.',
    source: 'IEA Electricity 2024 Report',
    url: 'https://www.iea.org/reports/electricity-2024',
    ham: 'Every token you don\'t send is compute that doesn\'t need to happen.',
  },
  {
    fact: 'AI inference accounts for over 80% of AI-related electricity consumption.',
    source: 'MIT Technology Review, 2024',
    url: 'https://www.technologyreview.com',
    ham: 'HAM targets inference efficiency — the biggest slice of AI energy use.',
  },
  {
    fact: 'Training GPT-4 produced an estimated 5,000+ tonnes of CO2. But inference on deployed models dwarfs training emissions within months.',
    source: 'Stanford HAI AI Index Report, 2024',
    url: 'https://aiindex.stanford.edu/report/',
    ham: 'Reducing per-request tokens compounds across every session, every day.',
  },
  {
    fact: 'The average AI-powered code completion uses 2-10x more tokens than necessary when loading full project context.',
    source: 'Anthropic engineering estimates',
    url: 'https://anthropic.com',
    ham: 'Scoped CLAUDE.md files ensure the model reads only what it needs for the current directory.',
  },
  {
    fact: 'Water usage for data center cooling is a growing concern — some large facilities use millions of gallons per day.',
    source: 'AP News, 2023',
    url: 'https://apnews.com',
    ham: 'Less compute means less heat, which means less cooling water.',
  },
  {
    fact: 'The carbon intensity of electricity varies by 50x across regions — from ~20g CO2/kWh (Norway) to ~900g (coal-heavy grids).',
    source: 'Electricity Maps',
    url: 'https://electricitymaps.com',
    ham: 'Token reduction helps regardless of where your cloud provider\'s servers are located.',
  },
  {
    fact: 'Prompt caching can reduce repeated context loading by 90%, but only works within the same conversation.',
    source: 'Anthropic Docs',
    url: 'https://docs.anthropic.com',
    ham: 'HAM\'s scoped files reduce the base context size, making caching even more effective.',
  },
];

// --- Day name helper ---

function getDayName(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

// --- Status badge ---

const STATUS_LABELS = {
  ok: 'OK',
  consider_splitting: 'Consider splitting',
  split_this: 'Split this',
  stale: 'Stale',
};

function StatusBadge({ status }) {
  return <span className={`file-status file-status-${status}`}>{STATUS_LABELS[status] || status}</span>;
}

// --- Component ---

export default function Efficiency({ carbon, daily, sessions, files }) {
  if (!carbon || carbon.totalSessions === 0) {
    return (
      <div className="empty-state">
        <h3>No efficiency data yet</h3>
        <p>Run a few sessions to start tracking efficiency. HAM is collecting data.</p>
      </div>
    );
  }

  const todayFact = FACTS[Math.floor(Date.now() / 86400000) % FACTS.length];

  // Last 7 days for "This Week" table
  const last7 = (daily || []).slice(-7);

  // Last 10 sessions for "Recent Sessions" table
  const recentSessions = (sessions || []).slice(0, 10);

  return (
    <>
      {/* Section 1: Hero Stats */}
      <div className="metrics-grid">
        <MetricCard
          label="Token Efficiency"
          value={formatPct(carbon.tokenEfficiency)}
          sub="avg tokens saved per request"
          info={'Percentage of input tokens saved compared to a naive baseline. The baseline assumes every request loads all CLAUDE.md files in the project. With HAM, only the relevant directory\u2019s context is loaded, so fewer tokens are sent per prompt.'}
        />
        <MetricCard
          label="CO2e Saved"
          value={formatCO2e(carbon.totalCO2e.saved_grams)}
          sub={carbon.totalCO2e.saved_grams > 0
            ? `since ${formatDate(carbon.trackingSince)} (~${getEquivalent(carbon.totalCO2e.saved_grams)})`
            : 'no savings data yet'}
          info={'Estimated CO\u2082-equivalent emissions avoided by using fewer tokens. Calculated using the EcoLogits energy model: GPU energy from token counts \u00d7 model size, plus server overhead, scaled by datacenter PUE (1.2) and US grid carbon intensity (0.385 kg CO\u2082/kWh).'}
        />
        <MetricCard
          label="Sessions Tracked"
          value={carbon.totalSessions.toLocaleString()}
          sub={`across ${carbon.days} days`}
          info={'Total Claude Code sessions detected in the selected time window. Each session is a conversation with the agent, parsed from JSONL files stored in ~/.claude/projects/.'}
        />
      </div>

      {/* Section 2: This Week at a Glance */}
      <div className="table-card">
        <h3>
          This Week at a Glance
          <InfoTip text={'Energy estimates use the EcoLogits model: GPU energy is computed from token counts and model size, then multiplied by datacenter overhead (PUE 1.2) and US grid carbon intensity (0.385 kg CO\u2082/kWh). The baseline assumes loading all CLAUDE.md tokens on every request without HAM scoping. Savings = baseline energy minus actual energy.'} />
        </h3>
        <div className="weekly-grid">
          <div className="weekly-row weekly-header">
            <div className="weekly-cell weekly-row-label"></div>
            {last7.map(d => (
              <div key={d.date} className="weekly-cell">{getDayName(d.date)}</div>
            ))}
          </div>
          <div className="weekly-row">
            <div className="weekly-cell weekly-row-label">Sessions</div>
            {last7.map(d => (
              <div key={d.date} className={`weekly-cell ${d.sessions === 0 ? 'day-empty' : ''}`}>
                {d.sessions > 0 ? d.sessions : '-'}
              </div>
            ))}
          </div>
          <div className="weekly-row">
            <div className="weekly-cell weekly-row-label">CO2e saved</div>
            {last7.map(d => (
              <div key={d.date} className={`weekly-cell ${d.sessions === 0 ? 'day-empty' : ''}`}>
                {d.co2e_saved_grams > 0 ? formatCO2e(d.co2e_saved_grams) : '-'}
              </div>
            ))}
          </div>
          <div className="weekly-row">
            <div className="weekly-cell weekly-row-label">Prompts</div>
            {last7.map(d => (
              <div key={d.date} className={`weekly-cell ${d.sessions === 0 ? 'day-empty' : ''}`}>
                {d.prompts > 0 ? d.prompts : '-'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="table-card">
          <h3>
            Recent Sessions
            <InfoTip text={'Per-session breakdown of energy and token savings. Tokens Saved = baseline tokens (all CLAUDE.md tokens \u00d7 prompt count) minus actual input tokens. CO\u2082e Saved is derived from the energy difference using the EcoLogits model and US grid carbon intensity.'} />
          </h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Duration</th>
                <th>Prompts</th>
                <th>Tokens Saved</th>
                <th>CO2e Saved</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map(s => (
                <tr key={s.sessionId}>
                  <td className="mono">{formatDateTime(s.startTime)}</td>
                  <td className="mono">{formatDuration(s.durationMs)}</td>
                  <td className="mono">{s.prompts}</td>
                  <td className="mono">
                    {formatTokens(Math.max(0, s.baselineTokens - s.inputTokens))}
                    {s.tokenSavingsPercent > 0 && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                        ({formatPct(s.tokenSavingsPercent)})
                      </span>
                    )}
                  </td>
                  <td className="mono">{formatCO2e(Math.max(0, s.saved_grams))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 4: Project Breakdown */}
      {files && files.length > 0 && (
        <div className="table-card">
          <h3>
            Project Breakdown
            <InfoTip text={'Each CLAUDE.md file in your project, with estimated token size (file bytes \u00f7 4) and how often it was loaded in the last 7 days. Status: OK = normal, Consider splitting = large file loaded frequently (>200 tokens and >10 loads/day), Split this = very high token\u00d7load product (>10,000), Stale = not loaded in 14+ days.'} />
          </h3>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Tokens</th>
                <th>Loaded (7d)</th>
                <th>Loads/Day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.path}>
                  <td className="mono">{f.path}/CLAUDE.md</td>
                  <td className="mono">{f.tokens}</td>
                  <td className="mono">{f.loads7d}</td>
                  <td className="mono">{f.loadsPerDay}</td>
                  <td><StatusBadge status={f.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 5: Cumulative Stats */}
      <div className="section-title">
        Cumulative Stats
        <InfoTip text={'Lifetime totals across all tracked sessions. Energy and CO\u2082e are computed per-session using the EcoLogits model (GPU energy from token counts and model parameters, server overhead, PUE 1.2, US grid 0.385 kg CO\u2082/kWh) and summed. Token efficiency is the overall percentage of baseline tokens avoided.'} />
      </div>
      <div className="cumulative-grid">
        <div className="cumulative-item">
          <div className="cumulative-label">Total CO2e saved</div>
          <div className="cumulative-value">{formatCO2e(carbon.totalCO2e.saved_grams)}</div>
        </div>
        <div className="cumulative-item">
          <div className="cumulative-label">Total energy saved</div>
          <div className="cumulative-value">{formatEnergy(carbon.totalEnergy.saved_wh)}</div>
        </div>
        <div className="cumulative-item">
          <div className="cumulative-label">Total tokens saved</div>
          <div className="cumulative-value">{formatTokens(Math.round((carbon.totalEnergy.baseline_wh - carbon.totalEnergy.actual_wh) / 0.001 || 0))}</div>
        </div>
        <div className="cumulative-item">
          <div className="cumulative-label">Total sessions</div>
          <div className="cumulative-value">{carbon.totalSessions}</div>
        </div>
        <div className="cumulative-item">
          <div className="cumulative-label">Total prompts</div>
          <div className="cumulative-value">{carbon.totalRequests.toLocaleString()}</div>
        </div>
        <div className="cumulative-item">
          <div className="cumulative-label">Avg efficiency</div>
          <div className="cumulative-value">{formatPct(carbon.tokenEfficiency)}</div>
        </div>
        <div className="cumulative-item">
          <div className="cumulative-label">Tracking since</div>
          <div className="cumulative-value">{formatDate(carbon.trackingSince)}</div>
        </div>
      </div>

      {/* Section 6: Did You Know */}
      <div className="fact-card">
        <div className="fact-header">
          DID YOU KNOW
          <InfoTip text={'A rotating daily fact about AI energy consumption and sustainability. Facts are sourced from the IEA, Stanford HAI, MIT Technology Review, and other research. A new fact appears each day.'} />
        </div>
        <p className="fact-text">{todayFact.fact}</p>
        <div className="fact-source">{todayFact.source}</div>
        <div className="fact-hamlabel">{todayFact.ham}</div>
      </div>
    </>
  );
}
