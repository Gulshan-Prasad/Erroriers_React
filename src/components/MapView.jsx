import { MapContainer, TileLayer, GeoJSON, Pane } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

/* Fix Leaflet marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// data based ward color
const MAX_POP = 100000;

function getPopColor(pop) {
  const p = Math.min(pop / MAX_POP, 1);

  if (p <= 0.2) return "#22c55e"; // green
  if (p <= 0.4) return "#eab308"; // yellow
  if (p <= 0.6) return "#f97316"; // orange
  if (p <= 0.8) return "#ef4444"; // red
  return "#78350f"; // brown
}

// darken any rgb() color by factor
function darkenRgb(rgb, factor = 0.75) {
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;

  const [r, g, b] = match.map(Number);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(
    b * factor
  )})`;
}

export default function MapView({ zones, onSelect, onWardSelect }) {
  const [wards, setWards] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  /* Load wards once */
  useEffect(() => {
    fetch("/data/Delhi_Ward_Prop.geojson")
      .then((res) => res.json())
      .then(setWards);
  }, []);

  const defaultStyle = {
    fill: true,
    color: "#2563eb",
    fillColor: "#fa7260",
    weight: 1,
    fillOpacity: 0.25,
  };

  return (
    <>
      <MapContainer
        center={[28.6139, 77.209]}
        zoom={11}
        style={{ height: "420px", width: "100%" }}
      >
        <Pane name="wards" style={{ zIndex: 200 }} />
        <Pane name="zones" style={{ zIndex: 400 }} />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Ward polygons */}
        {wards && (
          <GeoJSON
            data={wards}
            pane="wards"
            interactive={true}
            style={(feature) => {
              const id = feature?.properties?.FID;
              const pop = Number(feature?.properties?.TotalPop || 0);
              const fillColor = getPopColor(pop);

              return {
                ...defaultStyle,
                fillColor,
                weight: id === selectedId ? 4 : 1,
              };
            }}
            onEachFeature={(feature, layer) => {
              const id = feature.properties?.FID;
              const pop = Number(feature?.properties?.TotalPop || 0);
              const fillColor = getPopColor(pop);

              layer.on({
                mouseover: (e) => {
                  const target = e.target;

                  if (id !== selectedId) {
                    target.setStyle({
                      fillColor: darkenRgb(fillColor, 0.65),
                      fillOpacity: 0.65,
                      weight: 2,
                    });
                  }
                },

                mouseout: (e) => {
                  const target = e.target;

                  target.setStyle({
                    fillColor,
                    fillOpacity: 0.25,
                    weight: id === selectedId ? 4 : 1,
                  });
                },

                click: (e) => {
                  setSelectedId(id);
                  setSelectedWard(feature.properties); // ✅ fixed
                  onWardSelect?.(feature.properties);

                  e.target.setStyle({
                    fillColor,
                    fillOpacity: 0.35,
                    weight: 4,
                  });
                },
              });
            }}
          />
        )}
      </MapContainer>

      {/* Ward info panel */}
      {selectedWard && (
        <div className="mt-3 p-3 rounded bg-gray-900 text-white text-sm">
          <h3 className="font-bold mb-1">Selected Ward</h3>
          <pre>{JSON.stringify(selectedWard, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
