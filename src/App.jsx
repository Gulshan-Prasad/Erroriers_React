import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import "./App.css";

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

  useEffect(() => {
    fetch("/data/water_logging_spots.json")
      .then((res) => res.json())
      .then(setZones);

    fetch("/data/Delhi_Ward_Prop.geojson")
      .then((res) => res.json())
      .then((geojson) => {
        const wardNames = geojson.features
          .map((f) => f.properties?.WardName)
          .filter(Boolean);

        setWards(wardNames);
      });
  }, []);

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
            </div>

            {activeZone && (
              <div className="card mb-4">
                <div className="section-title">{activeZone.name}</div>

                <div className="grid-info">
                  <div>
                    <div className="info-label">Severity</div>
                    <div className="info-value">{activeZone.severity}</div>
                  </div>

                  <div>
                    <div className="info-label">Coordinates</div>
                    <div className="info-value">
                      {activeZone.lat}, {activeZone.lng}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ward info */}
            {activeWard &&
              (() => {
                const MAX_POP = 100000;
                const pop = Number(activeWard.TotalPop || 0);
                const percent = Math.min((pop / MAX_POP) * 100, 100);

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
                className="textarea mb-4"
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
          <>
            <div className="map-wrapper">
              <MapView
                zones={zones}
                onSelect={setActiveZone}
                onWardSelect={setActiveWard}
              />
            </div>

            {activeZone && (
              <div className="card mb-4">
                <div className="section-title">{activeZone.name}</div>
                <p className="text-muted">
                  Historical waterlogging severity: {activeZone.severity}
                </p>
              </div>
            )}

            {activeWard && (
              <div className="card mb-4">
                <div className="section-title">{activeWard.WardName}</div>

                <div className="grid-info">
                  <div>
                    <div className="info-label">Ward No.</div>
                    <div className="info-value">{activeWard.Ward_No}</div>
                  </div>

                  <div>
                    <div className="info-label">Assembly</div>
                    <div className="info-value">{activeWard.AC_Name}</div>
                  </div>

                  <div>
                    <div className="info-label">Population</div>
                    <div className="info-value">{activeWard.TotalPop}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
