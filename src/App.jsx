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
  const [reports, setReports] = useState([]);

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


  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      <main className="main">
        <h1 className="page-title">Urban Waterlogging Dashboard</h1>

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

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="pop-row">
                      <span>Population</span>
                      <strong>
                        {Number(activeWard.TotalPop || 0).toLocaleString()} /
                        100,000
                      </strong>
                    </div>

                    <div className="progress-bg">
                      <div
                        className="progress-fill fill-orange"
                        style={{
                          width: `${Math.min(
                            (Number(activeWard.TotalPop || 0) / 100000) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                className="textarea mb-4"
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

        {activeTab === "history" && (
          <div className="history">
            <div className="map-wrapper">
              <MapView
                zones={zones}
                onSelect={setActiveZone}
                onWardSelect={setActiveWard}
              />
            </div>

            <div className="historyGrid">
              <div className="card">
                <h2 className="section-title">Selected Flood Zone</h2>
                {!activeZone ? (
                  <p className="text-muted">Click any flood zone on the map.</p>
                ) : (
                  <>
                    <div className="historyTitle">{activeZone.name}</div>
                    <div className="historyBadge">{activeZone.severity}</div>
                  </>
                )}
              </div>

              <div className="card">
                <h2 className="section-title">Selected Ward</h2>
                {!activeWard ? (
                  <p className="text-muted">Click any ward on the map.</p>
                ) : (
                  <>
                    <div className="historyTitle">{activeWard.WardName}</div>
                    <div className="historyDetails">
                      <div>
                        <div className="info-label">Ward No.</div>
                        <div className="info-value">{activeWard.Ward_No}</div>
                      </div>
                      <div>
                        <div className="info-label">Population</div>
                        <div className="info-value">
                          {Number(activeWard.TotalPop || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
