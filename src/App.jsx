import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import "./App.css";
import "./components/MapView.css";
import WeatherCard from "./components/WeatherCard.jsx";

export default function App() {
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [activeWard, setActiveWard] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const [wards, setWards] = useState([]);
  const [wardQuery, setWardQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [severity, setSeverity] = useState("LOW");
  const [description, setDescription] = useState("");

  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [weatherCoords, setWeatherCoords] = useState(null);

  useEffect(() => {
    fetch("/data/water_logging_spots.json")
      .then((res) => res.json())
      .then(setZones);

    fetch("/data/wards_with_risk.geojson")
      .then((res) => res.json())
      .then((geojson) => {
        const wardNames = geojson.features
          .map((f) => f.properties?.WardName)
          .filter(Boolean);

        setWards(wardNames);
      });
  }, []);

  useEffect(() => {
    if (!activeWard) return;

    setLoadingInsights(true);
    console.log(activeWard);

    fetch("http://localhost:3001/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ward: activeWard,
        zones: zones.slice(0, 10) // optional: nearby zones later
      })
    })
      .then((r) => r.json())
      .then((data) => {
        setInsights(data.insights || []);
      })
      .catch(console.error)
      .finally(() => setLoadingInsights(false));
  }, [activeWard]);


  const filteredWards = wards.filter((w) =>
    w.toLowerCase().includes(wardQuery.toLowerCase())
  );

  const submitReport = () => {
    if (!selectedWard || !description) return;

    alert("Report submitted successfully");
    setSelectedWard("");
    setWardQuery("");
    setSeverity("LOW");
    setDescription("");
  };

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      <main className="main">
        <h1 className="page-title">Urban Waterlogging Dashboard</h1>

        {/* ---------------- HOME TAB ---------------- */}
        {activeTab === "home" && (
          <>
            <div className="card mb-6 card-text">
              This portal allows citizens to report urban waterlogging, track
              complaints, and review historical waterlogging patterns across
              Delhi wards.
            </div>

            <div className="map-wrapper">
              <MapView
                zones={zones}
                onSelect={setActiveZone}
                onWardSelect={setActiveWard}
              />

              <div className="aiCardBox">
                <div className="aiCardHeader">
                  <h3 className="aiCardTitle">
                    <span className="aiHighlight">Actionable</span> Insights
                  </h3>

                  <span className="aiGenerated">AI Generated</span>
                </div>

                {/* Empty content block */}
                <div className="aiCardEmpty">
                  {loadingInsights && <p>Generating insights...</p>}

                  {!loadingInsights && insights.length === 0 && (
                    <p>No insights yet. Select a ward.</p>
                  )}

                  {!loadingInsights &&
                    insights.map((x, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <b>{x.title}</b>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{x.subtitle}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>



            {/* Ward info */}
            {activeWard &&
              (() => {
                const MAX_POP = 100000;
                const MAX_RISK = 100;
                const risk = Number(activeWard.composite_risk_score_100 || 0)
                const pop = Number(activeWard.TotalPop || 0);
                const percent = Math.min((pop / MAX_POP) * 100, 100);
                const riskPercent = Math.min((risk / MAX_RISK) * 100, 100)


                const barClass =
                  percent >= 80
                    ? "fill-red"
                    : percent >= 50
                      ? "fill-orange"
                      : "fill-green";

                return (
                  <div className="card mb-4">
                    <div className="section-title">{activeWard.WardName}</div>

                    <div className="grid-info">
                      <div>
                        <div className="info-label">Ward No.</div>
                        <div className="info-value">{activeWard.Ward_No}</div>
                        <div className="info-label">Drain score</div>
                        <div className="info-value">{activeWard.drain_score * 10}</div>
                        <div className="info-label">Drain density</div>
                        <div className="info-value">{activeWard.drain_density * 1000}</div>
                      </div>

                      <div>
                        <div className="info-label">Ward Name</div>
                        <div className="info-value">{activeWard.WardName}</div>
                      </div>

                      {/* Population Bar */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div className="pop-row">
                          <span>Population</span>
                          <strong>
                            {pop.toLocaleString()} / {MAX_POP.toLocaleString()}
                          </strong>
                        </div>

                        <div className="progress-bg">
                          <div
                            className={`progress-fill ${barClass}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div className="risk-row">
                          <span>Risk</span>
                          <strong>
                            {risk.toLocaleString()} / {MAX_RISK.toLocaleString()}
                          </strong>
                        </div>

                        <div className="progress-bg">
                          <div
                            className={`progress-fill ${barClass}`}
                            style={{ width: `${riskPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </>
        )}

        {/* ---------------- REPORT TAB ---------------- */}
        {activeTab === "report" && (
          <div className="grid-2">
            <div className="card">
              <h2 className="section-title">Submit Waterlogging Report</h2>

              <input
                value={wardQuery}
                onChange={(e) => {
                  setWardQuery(e.target.value);
                  setSelectedWard("");
                }}
                placeholder="Search ward"
                className="input mb-2"
              />

              {wardQuery && (
                <div className="dropdown">
                  {filteredWards.map((ward) => (
                    <div
                      key={ward}
                      onClick={() => {
                        setSelectedWard(ward);
                        setWardQuery(ward);
                      }}
                      className="dropdown-item"
                    >
                      {ward}
                    </div>
                  ))}
                </div>
              )}

              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="select mb-3"
              >
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
              </select>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the waterlogging situation"
                className="textarea mb-4 "
              />

              <button onClick={submitReport} className="btn-primary">
                Submit
              </button>
            </div>

            <div className="card">
              <h2 className="section-title">Active Reports</h2>
              <p className="text-muted">No active reports submitted yet.</p>
            </div>
          </div>
        )}

        {/* ---------------- HISTORY TAB ---------------- */}


        {activeTab === "history" && (

          <div className="map-wrapper">
            
            <WeatherCard query="New Delhi, India" />

          </div>
        )}

      </main>
    </div>
  );
}
