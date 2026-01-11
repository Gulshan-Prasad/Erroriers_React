import { useMemo } from "react";
import "./RiskDistribution.css";

function getRiskBucket(score) {
  const s = Number(score || 0);

  // You can change these thresholds if you want
  if (s < 25) return "LOW";
  if (s < 50) return "MEDIUM";
  if (s < 75) return "HIGH";
  return "CRITICAL";
}

export default function RiskDistribution({ wardsGeojson }) {
  const { counts, total, maxCount } = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    const features = wardsGeojson?.features || [];

    for (const f of features) {
      const score = f?.properties?.composite_risk_score_100;
      const bucket = getRiskBucket(score);
      counts[bucket]++;
    }

    const total = features.length;
    const maxCount = Math.max(
      counts.LOW,
      counts.MEDIUM,
      counts.HIGH,
      counts.CRITICAL,
      1
    );

    return { counts, total, maxCount };
  }, [wardsGeojson]);

  const bars = [
    { id: "LOW", label: "Low", colorClass: "barLow", dotClass: "dotLow" },
    {
      id: "MEDIUM",
      label: "Medium",
      colorClass: "barMedium",
      dotClass: "dotMedium",
    },
    { id: "HIGH", label: "High", colorClass: "barHigh", dotClass: "dotHigh" },
    {
      id: "CRITICAL",
      label: "Critical",
      colorClass: "barCritical",
      dotClass: "dotCritical",
    },
  ];

  return (
    <div className="riskCard">
      <div className="riskHeader">
        <h3 className="riskTitle">Risk Distribution</h3>
        <span className="riskBadge">{total} wards</span>
      </div>

      <div className="riskBars">
        {bars.map((b) => {
          const value = counts[b.id] || 0;
          const heightPercent = (value / maxCount) * 100;

          return (
            <div key={b.id} className="riskBarItem">
              <div className="riskBarTrack">
                <div
                  className={`riskBar ${b.colorClass}`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${b.label}: ${value}`}
                />
              </div>
              <div className="riskBarLabel">{b.label}</div>
            </div>
          );
        })}
      </div>

      <div className="riskLegend">
        {bars.map((b) => {
          const value = counts[b.id] || 0;
          return (
            <div key={b.id} className="legendRow">
              <div className="legendLeft">
                <span className={`legendDot ${b.dotClass}`} />
                <span className="legendText">
                  {b.label} Risk
                </span>
              </div>

              <div className="legendRight">
                <b>{value}</b>
                <span className="legendSub">Wards</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
