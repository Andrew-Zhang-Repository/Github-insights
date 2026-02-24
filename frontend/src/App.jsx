import { useState } from 'react'
import './App.css'
import TestChart from './components/TestChart'


const YEARS = [];
for (let y = 2026; y >= 2018; y--) {
  YEARS.push(y);
}

function App() {
  const [url, setUrl] = useState('')
  const [year, setYear] = useState(2024)
  const [username, setUsername] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [totals, setTotals] = useState(null)
  const [freqData, setFreqData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
const [repos, setRepos] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setStatsData(null)
    setFreqData(null)
    setTotals(null)
    setLoading(true)

    try {
      const linkRes = await fetch('/api/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!linkRes.ok) {
        const err = await linkRes.json()
        throw new Error(err.detail || 'Failed to resolve GitHub user')
      }

      const linkData = await linkRes.json()
      setUsername(linkData.username)

      setRepos(linkData.repos)

      const [statsRes, freqRes] = await Promise.all([
        fetch('/api/send_obj', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: linkData.username, year }),
        }),
        fetch('/api/send_obj_freq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: linkData.username, year }),
        }),
      ])

      if (!statsRes.ok) {
        throw new Error('Failed to fetch repo stats')
      }
      if (!freqRes.ok) {
        throw new Error('Failed to fetch code frequency')
      }

      const stats = await statsRes.json()
      const freq = await freqRes.json()

      setStatsData(stats.stats)
      setTotals(stats.totals)
      setFreqData(freq.freq)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="root-container">
      <h1>GitHub Insights</h1>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          placeholder="https://github.com/username"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="url-input"
        />
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="year-select"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Loading...' : 'Fetch Stats'}
        </button>
      </form>

      {error && <p className="error-msg">{error}</p>}

      {repos && username && (
        <div className="repo-list">
          <h3>{username}'s Repositories ({repos.length})</h3>
          <div className="repo-tags">
            {repos.map((name) => (
              <span key={name} className="repo-tag">{name}</span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <p>Fetching data from GitHub API — this may take a minute...</p>
          <div className="spinner"></div>
        </div>
      )}

      {totals && username && (
        <div className="totals-summary">
          <h2>{username} — {year} Totals</h2>
          <div className="totals-grid">
            <div className="total-card">
              <span className="total-value">{totals.commits}</span>
              <span className="total-label">Commits</span>
            </div>
            <div className="total-card">
              <span className="total-value">{totals.prs}</span>
              <span className="total-label">PRs</span>
            </div>
            <div className="total-card">
              <span className="total-value">{totals.merges}</span>
              <span className="total-label">Merges</span>
            </div>
            <div className="total-card">
              <span className="total-value">{totals.issues}</span>
              <span className="total-label">Issues</span>
            </div>
          </div>
        </div>
      )}

      <TestChart statsData={statsData} freqData={freqData} />
    </div>
  )
}

export default App
