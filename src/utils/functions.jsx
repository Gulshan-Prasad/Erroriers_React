export function averageGeoJsonProperty(features, key) {
  const values = features
    .map(f => Number(f.properties[key]))
    .filter(v => !isNaN(v));

  if (values.length === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

export function preparednessIndex(features) {
  if (!Array.isArray(features) || features.length === 0) return 0;

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const normalize = (v, min, max) =>
    max === min ? 0 : (v - min) / (max - min);

  // columns that still need normalization
  const drainDensity = features.map(f => Number(f.drain_density) || 0);
  const population = features.map(f => Number(f.TotalPop) || 0);

  const minMax = (arr) => ({
    min: Math.min(...arr),
    max: Math.max(...arr),
  });

  const ddMM = minMax(drainDensity);
  const popMM = minMax(population);

  const totalPreparedness = features.reduce((sum, w) => {
    const drainScore = clamp01(Number(w.drain_score) || 0); // already 0–1
    const risk = clamp01((Number(w.composite_risk_score_100) || 0) / 100); // convert to 0–1

    const normDrainDensity = normalize(
      Number(w.drain_density) || 0,
      ddMM.min,
      ddMM.max
    );

    const normPopulation = normalize(
      Number(w.TotalPop) || 0,
      popMM.min,
      popMM.max
    );

    // preparedness formula
    const preparedness =
      0.45 * drainScore +
      0.25 * normDrainDensity -
      0.20 * normPopulation -
      0.10 * risk;

    return sum + clamp01(preparedness);
  }, 0);

  return Math.round((totalPreparedness / features.length) * 100);
}