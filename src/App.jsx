import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import "./App.css";
import "./components/MapView.css";
import { averageGeoJsonProperty, preparednessIndex } from "./utils/functions";
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
  const [reports, setReports] = useState([]);

  const [weatherCoords, setWeatherCoords] = useState(null);

  const [wardObjects, setWardObjects] = useState([])

  useEffect(() => {
    fetch("/data/wards_with_risk.geojson")
      .then((res) => res.json())
      .then((geojson) => {
        const wardObjects = geojson.features
          .map((f) => f.properties)
        setWardObjects(wardObjects)
      });

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

  const filteredWardObjects = wardObjects.filter((wardObj) =>
    wardObj.WardName.toLowerCase().includes(wardQuery.toLowerCase())
  );

  const filteredWards = wards.filter((w) =>
    w.toLowerCase().includes(wardQuery.toLowerCase())
  );

  const submitReport = () => {
    if (!selectedWard || !description) return;

    setReports((prev) => [
      {
        id: Date.now(),
        ward: selectedWard,
        severity,
        status: "Pending",
        time: new Date().toLocaleString()
      },
      ...prev
    ]);

    alert("Report submitted successfully");

    setSelectedWard("");
    setWardQuery("");
    setSeverity("LOW");
    setDescription("");
  };

  useEffect(() => {
    console.log("activeWard:", activeWard);
  }, [activeWard]);

  useEffect(() => {
    console.log("wardObjects:", wardObjects);
  }, [wardObjects]);

  useEffect(() => {
    console.log("wardQuery:", filteredWardObjects);
  }, [filteredWardObjects]);

  const avgRisk = Math.floor(wardObjects.reduce((sum, w) => sum + (Number(w.composite_risk_score_100) || 0), 0) / wards.length);

  const avgRainfall = Math.floor(wardObjects.reduce((sum, w) => sum + (Number(w.ward_rainfall_avg_rainfall_mm) || 0), 0) / wards.length)

  const criticalWards = wardObjects.filter(
    (w) => Number(w.composite_risk_score_100) > 75
  ).length;

  const prepIndex = preparednessIndex(wardObjects)

  console.log(prepIndex)
  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      <main className="main">
        <h1 className="page-title">Urban Waterlogging Dashboard</h1>

        {activeTab === "home" && (
          <>
            <div className="statsGrid">
              <div className="statCard">
                <div className="statLabel">Average WLPI</div>
                <div className="statValue">{avgRisk}</div>
                {/* <div className="statSub red">↑ 2.4%</div> */}
              </div>

              <div className="statCard">
                <div className="statLabel">Critical Wards</div>
                <div className="statValue">{criticalWards}</div>
                {/* <div className="statSub">Needs attention</div> */}
              </div>

              <div className="statCard">
                <div className="statLabel">Avg Rainfall (june-aug)</div>
                <div className="statValue">{avgRainfall} mm</div>
                {/* <div className="statSub">Forecast: 0mm</div> */}
              </div>

              <div className="statCard">
                <div className="statLabel">Preparedness (0-100)</div>
                <div className="statValue green">{prepIndex}</div>
                {/* <div className="statSub green">↑ 5%</div> */}
              </div>
            </div>
            <div className="ward-search-wrapper">
              <input
                value={wardQuery}
                onChange={(e) => {
                  setWardQuery(e.target.value);
                  setSelectedWard("");
                }}
                placeholder="Search ward"
                className="input mb-2"
                style={{
                  width: 500,
                  position: "relative"
                }}
              />

              {wardQuery && (
                <div className="dropdown"
                  style={{ position: "absolute" }}
                >
                  {filteredWardObjects.map((ward) => (
                    <div
                      key={ward.Ward_No}
                      onClick={() => {
                        setActiveWard(ward)
                        setWardQuery("")
                      }}
                      className="dropdown-item"
                    >
                      {ward.WardName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="map-wrapper">
              <MapView
                zones={zones}
                activeWard={activeWard}
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
                const popPercent = Math.min((pop / MAX_POP) * 100, 100);
                const percent = Math.min((risk / MAX_RISK) * 100, 100)


                const barClass =
                  percent >= 80 ? "fill-red" : percent >= 60 ? "fill-orange" : percent >= 40 ? "fill-yellow" : "fill-green";

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
                        <div className="info-value">{(activeWard.drain_density * 1000).toPrecision(4)} km/km^2</div>
                      </div>

                      <div>
                        <div className="info-label">Ward Name</div>
                        <div className="info-value">{activeWard.WardName}</div>
                      </div>

                      {/* <div style={{ gridColumn: "1 / -1" }}>
                    <div className="pop-row">
                      <span>Population</span>
                      <strong>
                        {Number(activeWard.TotalPop || 0).toLocaleString()} /
                        100,000
                      </strong>
                    </div>

                        <div className="progress-bg">
                          <div
                            className={`progress-fill ${barClass}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div> */}
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
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </>
        )}

        {activeTab === "report" && (
          <div className="grid-2">
            <div className="card">
              <h2 className="section-title">Submit Waterlogging Report</h2>

              <div className="inputWrap">
                <span className="searchIcon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>

                <input
                  className="input input-with-icon"
                  value={wardQuery}
                  onChange={(e) => {
                    setWardQuery(e.target.value);
                    setSelectedWard("");
                  }}
                  placeholder="Search ward"
                />

                {wardQuery &&
                  filteredWards.length > 0 &&
                  !filteredWards.includes(wardQuery) && (
                    <div className="dropdown">
                      {filteredWards.map((ward) => (
                        <div
                          key={ward}
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedWard(ward);
                            setWardQuery(ward);
                          }}
                        >
                          {ward}
                        </div>
                      ))}
                    </div>
                  )}
              </div>

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
              {reports.length === 0 ? (
                <p className="text-muted">No active reports submitted yet.</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="card mb-3">
                    <div className="section-title">{r.ward}</div>

                    <div className="grid-info">
                      <div>
                        <div className="info-label">Severity</div>
                        <div className={`info-value severity-${r.severity.toLowerCase()}`}>
                          {r.severity}
                        </div>
                      </div>

                      <div>
                        <div className="info-label">Status</div>
                        <div className={`info-value status-${r.status.toLowerCase()}`}>
                          {r.status}
                        </div>
                      </div>
                    </div>

                    <div className="text-muted">{r.time}</div>
                  </div>
                ))
              )}

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
