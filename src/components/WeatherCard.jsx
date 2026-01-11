import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
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

export default function WeatherCard({ query }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ default Delhi India
  const finalQuery = query || "New Delhi, India";

  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:3001/api/weather?q=${encodeURIComponent(finalQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        console.log("✅ WEATHER RESPONSE:", data);
        setWeather(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [finalQuery]);

  const lat = weather?.location?.lat;
  const lon = weather?.location?.lon;
  const days = weather?.forecast?.forecastday || [];

  return (
    <>
      {/* ✅ MAIN WEATHER CARD */}
      <div className="weatherCard">
        <div className="weatherHeader">
          <h3 className="weatherTitle">Weather</h3>
          <span className="weatherTag">Live</span>
        </div>

        <div className="weatherBody">
          {loading && <p className="weatherMuted">Loading weather...</p>}

          {!loading && weather?.current && (
            <>
              {/* ---------------- CURRENT WEATHER ---------------- */}
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

              {/* ---------------- MINI MAP ---------------- */}
              {lat && lon && (
                <div className="weatherMiniMap">
                  <MapContainer
                    center={[lat, lon]}
                    zoom={11}
                    style={{ height: "440px", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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

              {/* ---------------- CURRENT STATS ---------------- */}
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

      {/* ✅ FORECAST AS SEPARATE CARD */}
      {days.length > 0 && (
        <div className="forecastCard">
          <div className="forecastHeader">
            <h4 className="forecastTitle">3-Day Forecast</h4>
            <span className="forecastTag">Forecast</span>
          </div>

          <div className="forecastGrid">
            {days.map((d) => {
              const rain = Number(d.day.daily_chance_of_rain || 0);

              const badgeClass =
                rain >= 70 ? "badgeHigh" : rain >= 40 ? "badgeMid" : "badgeLow";

              return (
                <div key={d.date} className="forecastDay">
                  <div className="forecastDate">
                    {new Date(d.date).toDateString().slice(0, 10)}
                  </div>

                  <div className="forecastTopRow">
                    <img src={d.day.condition.icon} alt="icon" />
                    <div className="forecastCond">{d.day.condition.text}</div>
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
                      <b>{rain}%</b>
                    </div>
                    <div>
                      <span>Precip</span>
                      <b>{d.day.totalprecip_mm} mm</b>
                    </div>
                  </div>

                  <div className={`rainBadge ${badgeClass}`}>
                    Rain Risk: {rain}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
