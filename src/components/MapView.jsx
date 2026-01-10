import { MapContainer, TileLayer, GeoJSON, Pane } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

import L from "leaflet";
import { useEffect,useRef, useState } from "react";

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

function getRiskColor(risk){
  if (risk <= 0.2 *100) return "#22c55e"; // green
  if (risk <= 0.4 *100) return "#eab308"; // yellow
  if (risk <= 0.6*100) return "#f97316"; // orange
  if (risk <= 0.8*100) return "#ef4444"; // red
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

export default function MapView({ activeWard, onWardSelect }) {
  const [wards, setWards] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const mapRef = useRef(null);
  const wardLayersRef = useRef([]);



  useEffect(() => {
    fetch("/data/wards_with_risk.geojson")
      .then((res) => res.json())
      .then((data) =>{
        wardLayersRef.current = [];
        setWards(data);
      });
  }, []);

  useEffect(() => {
    if (!activeWard || !mapRef.current || !wardLayersRef.current.length) return;

    const match = wardLayersRef.current.find(
      (w) => w.feature.properties.WardName === activeWard.WardName
    );

    if (!match) return;

    const { layer, id, feature } = match;

    // zoom to ward
    mapRef.current.fitBounds(layer.getBounds(), {
      padding: [40, 40],
    });

    // simulate click behavior
    setSelectedId(id);
    onWardSelect?.(feature.properties);

    layer.setStyle({
      weight: 4,
      fillOpacity: 0.35,
    });
  }, [activeWard]);


  const defaultStyle = {
    fill: true,
    color: "#2563eb",
    weight: 1,
    fillOpacity: 0.25,
  };

  return (
    <div className="mapRow">
        <MapContainer 
        center={[28.6139, 77.209]} 
        zoom={11} 
        className="map"
        whenCreated={(map) => {mapRef.current = map;}}
        >
        <Pane name="wards" style={{ zIndex: 200 }} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {wards && (
            <GeoJSON
            data={wards}
            pane="wards"
            interactive={true}
            style={(feature) => {
              const id = feature?.properties?.FID;
              const pop = Number(feature?.properties?.TotalPop || 0);
              const risk = Number(feature?.properties?.composite_risk_score_100 || 0);
              // const fillColor = getPopColor(pop);
              const fillColor = getRiskColor(risk)

                return {
                ...defaultStyle,
                fillColor,
                weight: id === selectedId ? 4 : 1,
                };
            }}
            onEachFeature={(feature, layer) => {
              const id = feature.properties?.FID;
              const pop = Number(feature?.properties?.TotalPop || 0);
              const risk = Number(feature?.properties?.composite_risk_score_100 || 0);
              // const fillColor = getPopColor(pop);
              const fillColor = getRiskColor(risk)

              wardLayersRef.current.push({
                id,
                layer,
                feature,
              });

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
    </div>
    );
}
