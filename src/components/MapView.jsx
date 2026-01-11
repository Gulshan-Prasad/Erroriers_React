import { MapContainer, TileLayer, GeoJSON, Pane, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MAX_POP = 100000;

function getPopColor(pop) {
    const p = Math.min(pop / MAX_POP, 1);

    if (p <= 0.2) return "#22c55e"; // green
    if (p <= 0.4) return "#eab308"; // yellow
    if (p <= 0.6) return "#f97316"; // orange
    if (p <= 0.8) return "#ef4444"; // red
    return "#78350f"; // brown
}

function getRiskColor(risk) {
    if (risk <= 0.2 * 100) return "#22c55e"; // green
    if (risk <= 0.4 * 100) return "#eab308"; // yellow
    if (risk <= 0.6 * 100) return "#f97316"; // orange
    if (risk <= 0.8 * 100) return "#ef4444"; // red
    return "#78350f"; // brown
}

function darkenRgb(rgb, factor = 0.75) {
    const match = rgb.match(/\d+/g);
    if (!match) return rgb;

    const [r, g, b] = match.map(Number);
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(
        b * factor
    )})`;
}

function MapController({ activeWard, wardLayersRef, setSelectedId }) {
  const map = useMap();

  useEffect(() => {
    if (!activeWard || !wardLayersRef.current.length) return;

    const match = wardLayersRef.current.find(
      (w) => w.feature.properties.WardName === activeWard.WardName
    );

    if (!match) return;

    map.fitBounds(match.layer.getBounds(), {
      padding: [40, 40],
    });

    setSelectedId(match.id);
  }, [activeWard, map]);

  return null;
}

export default function MapView({ activeWard, onWardSelect }) {
console.log("MapView render, activeWard:", activeWard);

  const [wards, setWards] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const wardLayersRef = useRef([]);
  const [layersReady, setLayersReady] = useState(false);



  useEffect(() => {
    fetch("/data/wards_with_risk.geojson")
      .then((res) => res.json())
      .then((data) =>{
        wardLayersRef.current = [];
        setWards(data);
        setLayersReady(true);
      });
  }, []);


  const defaultStyle = {
    fill: true,
    color: "#2563eb",
    weight: 1,
    fillOpacity: 0.25,
  };

  useEffect(()=>{
    console.log("selectID: ", selectedId)
  },[selectedId])

  return (
    <div className="mapRow">
        <MapContainer 
        center={[28.6139, 77.209]} 
        zoom={11} 
        className="map"
        >
        <Pane name="wards" style={{ zIndex: 200 }} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {wards && (
            <GeoJSON
            key={selectedId}
            data={wards}
            pane="wards"
            interactive={true}
            style={(feature) => {
              const id = Number(feature?.properties?.Ward_No);
              const pop = Number(feature?.properties?.TotalPop || 0);
              const risk = Number(feature?.properties?.composite_risk_score_100 || 0);
              // const fillColor = getPopColor(pop);
              const fillColor = getRiskColor(risk)
              if (id === selectedId) {
                  return {
                    ...defaultStyle,
                    fillColor,
                    color: "#000000", // black border
                    weight: 4,
                    fillOpacity: 0.4,
                  };
                }

                return {
                ...defaultStyle,
                fillColor,
                weight: 1,
                };
            }}
            onEachFeature={(feature, layer) => {
              const id = Number(feature?.properties?.Ward_No);
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
                    if (id === selectedId) return;

                    const target = e.target;

                    if (id !== selectedId) {
                    target.setStyle({
                        fillColor: darkenRgb(fillColor, 0.65),
                        fillOpacity: 0.25,
                        weight: 1,
                    });
                    }
                },

                mouseout: (e) => {
                    if (id === selectedId) return;

                    const target = e.target;

                                    target.setStyle({
                                        fillColor,
                                        fillOpacity: 0.25,
                                        color: "#000000",
                                        weight: 1,
                                    });
                                },

                                click: (e) => {
                                    setSelectedId(id);
                                    onWardSelect?.(feature.properties);

                    e.target.setStyle({
                    fillColor,
                    fillOpacity: 0.45,
                    weight: 2,
                    });
                },
                });
            }}
            />
        )}
        <MapController
            activeWard={activeWard}
            wardLayersRef={wardLayersRef}
            setSelectedId={setSelectedId}
          />
        </MapContainer>
    </div>
    );
}
