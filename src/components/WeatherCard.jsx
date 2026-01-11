import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./WeatherCard.css";

/* Fix Leaflet marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ✅ Map click handler */
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng); // {lat, lng}
    },
  });
  return null;
}

/* ✅ Waterlogging Risk Calculator */
function calculateWaterloggingRisk(weather) {
  const today = weather?.forecast?.forecastday?.[0]?.day;
  const current = weather?.current;

  const chance = Number(today?.daily_chance_of_rain || 0);
  const precip = Number(today?.totalprecip_mm || 0);
  const humidity = Number(current?.humidity || 0);
  const wind = Number(current?.wind_kph || 0);

  let score = 0;

  // rain chance weight
  if (chance >= 80) score += 45;
  else if (chance >= 70) score += 35;
  else if (chance >= 50) score += 22;
  else if (chance >= 30) score += 12;

  // precipitation weight
  if (precip >= 30) score += 40;
  else if (precip >= 20) score += 30;
  else if (precip >= 10) score += 20;
  else if (precip >= 5) score += 10;

  // humidity weight
  if (humidity >= 85) score += 12;
  else if (humidity >= 75) score += 8;
  else if (humidity >= 60) score += 4;

  // wind: low wind = more stagnant conditions
  if (wind <= 6) score += 10;
  else if (wind <= 12) score += 6;

  if (score > 100) score = 100;

  let level = "LOW";
  let className = "wlLow";
  let message = "Low chance of waterlogging. Conditions look manageable.";

  if (score >= 70) {
    level = "HIGH";
    className = "wlHigh";
    message =
      "High chance of waterlogging in low-lying areas. Avoid underpasses & flooded streets.";
  } else if (score >= 40) {
    level = "MEDIUM";
    className = "wlMid";
    message =
      "Moderate waterlogging risk. Carry protection and avoid poorly drained roads.";
  }

  return {
    score,
    level,
    className,
    chance,
    precip,
    humidity,
    wind,
    message,
  };
}

export default function WeatherCard({ query }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRisk, setAiRisk] = useState(null);

  /* ✅ initial point = Delhi */
  const [point, setPoint] = useState({ lat: 28.6139, lng: 77.209 });

  const finalQuery = query || "New Delhi, India";

  // 1) Fetch weather based on query first time
  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:3001/api/weather?q=${encodeURIComponent(finalQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setWeather(data);

        // update point from API location
        if (data?.location?.lat && data?.location?.lon) {
          setPoint({ lat: data.location.lat, lng: data.location.lon });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [finalQuery]);

  // 2) Fetch weather when user clicks map (coords)
  useEffect(() => {
    if (!point?.lat || !point?.lng) return;

    setLoading(true);

    const coordQuery = `${point.lat},${point.lng}`;

    fetch(`http://localhost:3001/api/weather?q=${encodeURIComponent(coordQuery)}`)
      .then((r) => r.json())
      .then((data) => setWeather(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [point]);

  // ✅ 3) After weather loads, call AI endpoint
  useEffect(() => {
    if (!weather?.current || !weather?.forecast) return;

    setAiLoading(true);
    setAiRisk(null);

    fetch("http://localhost:3001/api/rain-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weather }),
    })
      .then((r) => r.json())
      .then((data) => setAiRisk(data))
      .catch(console.error)
      .finally(() => setAiLoading(false));
  }, [weather]);

  const lat = point?.lat;
  const lon = point?.lng;
  const days = weather?.forecast?.forecastday || [];

  // ✅ map AI risk => CSS class
  const risk = aiRisk?.risk || "NORMAL";
  const riskClass =
    risk === "SAFE"
      ? "riskSafe"
      : risk === "CRUCIAL"
        ? "riskCrucial"
        : risk === "DANGEROUS"
          ? "riskDanger"
          : "riskNormal";

  // ✅ Waterlogging calculation result
  const waterlog = weather?.forecast ? calculateWaterloggingRisk(weather) : null;

  return (
    <div className="weatherSection">
      {/* ✅ LEFT SIDE: Weather Card */}
      <div className="weatherLeft">
        <div className="weatherCard">
          <div className="weatherHeader">
            <h3 className="weatherTitle">Weather</h3>
            <span className="weatherTag">Click Map</span>
          </div>

          <div className="weatherBody">
            {loading && <p className="weatherMuted">Loading weather...</p>}

            {!loading && weather?.current && (
              <>
                {/* Top Info */}
                <div className="weatherTop">
                  <img
                    src={weather.current.condition.icon}
                    alt="icon"
                    className="weatherIcon"
                  />

                  <div>
                    <div className="weatherTemp">{weather.current.temp_c}°C</div>
                    <div className="weatherText">
                      {weather.current.condition.text}
                    </div>
                    <div className="weatherLoc">
                      {weather.location.name}, {weather.location.country}
                    </div>
                  </div>
                </div>

                {/* Map */}
                {lat && lon && (
                  <div className="weatherMiniMap">
                    <MapContainer
                      center={[lat, lon]}
                      zoom={11}
                      style={{ height: "440px", width: "100%" }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <ClickHandler onPick={setPoint} />
                      <Marker position={[lat, lon]} />
                      <Circle
                        center={[lat, lon]}
                        radius={2500}
                        pathOptions={{ color: "blue", fillOpacity: 0.12 }}
                      />
                    </MapContainer>

                    <div className="coordLine">
                      📍 {lat.toFixed(4)}, {lon.toFixed(4)}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="weatherGrid">
                  <div>
                    <span>Humidity</span>
                    <b>{weather.current.humidity}%</b>
                  </div>
                  <div>
                    <span>Wind</span>
                    <b>{weather.current.wind_kph} km/h</b>
                  </div>
                  <div>
                    <span>Rain</span>
                    <b>{weather.current.precip_mm} mm</b>
                  </div>
                  <div>
                    <span>Feels Like</span>
                    <b>{weather.current.feelslike_c}°C</b>
                  </div>
                </div>
              </>
            )}

            {!loading && !weather?.current && (
              <p className="weatherMuted">Weather unavailable right now.</p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ RIGHT SIDE */}
      <div className="weatherRight">
        {/* Forecast */}
        {days.length > 0 && (
          <div className="forecastCard">
            <div className="forecastHeader">
              <h4 className="forecastTitle">3-Day Forecast</h4>
              <span className="forecastTag">Forecast</span>
            </div>

            <div className="forecastGrid">
              {days.map((d) => {
                const rainChance = Number(d.day.daily_chance_of_rain || 0);

                const badgeClass =
                  rainChance >= 70
                    ? "badgeHigh"
                    : rainChance >= 40
                      ? "badgeMid"
                      : "badgeLow";

                return (
                  <div key={d.date} className="forecastDay">
                    <div className="forecastHead">
                      <div className="forecastDate">
                        {new Date(d.date).toDateString().slice(0, 10)}
                      </div>

                      <div className="forecastCondRow">
                        <img className="forecastIcon" src={d.day.condition.icon} alt="icon" />
                        <div className="forecastCond">{d.day.condition.text}</div>
                      </div>
                    </div>

                    <div className="forecastStats">
                      <div>
                        <span>Min</span>
                        <b>{d.day.mintemp_c}°C</b>
                      </div>
                      <div>
                        <span>Max</span>
                        <b>{d.day.maxtemp_c}°C</b>
                      </div>
                      <div>
                        <span>Rain</span>
                        <b>{rainChance}%</b>
                      </div>
                      <div>
                        <span>Precip</span>
                        <b>{d.day.totalprecip_mm} mm</b>
                      </div>
                    </div>

                    <div className={`rainBadge ${badgeClass}`}>
                      Rain Risk: {rainChance}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ✅ AI CARD */}
        <div className="rainAiCard">
          <div className="rainAiHeader">
            <h4 className="rainAiTitle">AI Rain Safety</h4>
            <span className="rainAiTag">AI Generated</span>
          </div>

          {aiLoading && (
            <p className="weatherMuted" style={{ padding: "16px 18px" }}>
              Generating AI safety suggestions...
            </p>
          )}

          {!aiLoading && aiRisk && (
            <>
              <div className={`riskBadge ${riskClass}`}>{risk}</div>

              <p className="riskSummary">{aiRisk.summary}</p>

              {aiRisk.actions?.length > 0 && (
                <div className="riskActions">
                  {aiRisk.actions.map((x, i) => (
                    <div key={i} className="riskAction">
                      {x}
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ GENERAL AI ADVICE BOX */}
              {aiRisk?.advice && (
                <div className="aiAdviceBox">
                  <div className="aiAdviceTitle">AI Suggestion</div>
                  <p className="aiAdviceText">{aiRisk.advice}</p>
                </div>
              )}

              {/* ✅ WATERLOGGING BOX BELOW AI ADVICE */}
              {waterlog && (
                <div className="waterlogBox">
                  <div className="waterlogHeader">
                    <b>Waterlogging Probability</b>
                    <span className={`waterlogBadge ${waterlog.className}`}>
                      {waterlog.level} ({waterlog.score}%)
                    </span>
                  </div>

                  <p className="waterlogMsg">{waterlog.message}</p>
                </div>
              )}

            </>
          )}

          {!aiLoading && !aiRisk && (
            <p className="weatherMuted" style={{ padding: "16px 18px" }}>
              AI unavailable right now.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
