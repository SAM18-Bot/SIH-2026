import { useState } from 'react'
import './App.css'
import JunctionPanel from './JunctionPanel'
import DecisionLog from './DecisionLog'

function App() {
  const [risk, setRisk] = useState(24)
  const [rainEvent, setRainEvent] = useState(false)

  const simulateRain = () => {
    setRisk(82)
    setRainEvent(true)
  }

  const resetRoute = () => {
    setRisk(24)
    setRainEvent(false)
  }

  const status =
    risk > 70 ? 'HIGH RISK 🔴' :
      risk >= 40 ? 'MODERATE 🟡' :
        'SAFE 🟢'

  const eta = risk > 70 ? '2h 35m' : '2h 15m'

  const recommendation =
    risk > 70 ? 'REROUTE 🔄' : 'CONTINUE 🟢'

  return (
    <div className="dashboard">

      <div className="header">
        <h1>NER Logistics Intelligence</h1>
        <p>NH-10 | Sevoke → Rangpo → Gangtok</p>
      </div>

      <div className="cards">

        <div className="card">
          <h3>Current Status</h3>
          <p>{status}</p>
        </div>

        <div className="card">
          <h3>Risk Score</h3>
          <p>{risk}%</p>
        </div>

        <div className="card">
          <h3>Estimated Time</h3>
          <p>{eta}</p>
        </div>

        <div className="card">
          <h3>Recommendation</h3>
          <p>{recommendation}</p>
        </div>

      </div>

      <div className="map-placeholder">
        <h2>Route Map</h2>
        <p>Sevoke → Teesta → Rangpo → Gangtok</p>
        <div className="route-line">
          🟢━━━━🟡━━━━🟢━━━━🟢
        </div>
        <small>
          Interactive map will be connected here
        </small>
      </div>

      <div className="bottom-grid">
        <JunctionPanel />

        <DecisionLog rainEvent={rainEvent} />
      </div>

      <div className="controls">

        {!rainEvent ? (
          <button onClick={simulateRain}>
            🌧️ Simulate Heavy Rain
          </button>
        ) : (
          <button onClick={resetRoute}>
            ↩️ Reset Scenario
          </button>
        )}

      </div>

    </div>
  )
}

export default App