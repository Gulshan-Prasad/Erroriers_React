# Delhi Ward Waterlogging Risk Predictor (MVP)

*Erroriers_React* – A hackathon prototype for predicting waterlogging/flood risk at the ward level in Delhi using geospatial data and a weighted scoring model. Built in ~3 days for a working MVP.

## Project Overview

This MVP uses publicly available GIS data to compute a *per-ward risk score* for waterlogging/flooding in Delhi. Key factors include:

- Drainage density
- Elevation (topography)
- Average monsoon rainfall
- Historical waterlogging data

Data is processed offline in *QGIS* for normalization and aggregation, then fed into a React + Leaflet frontend for interactive visualization as a choropleth map (green = low risk → yellow/orange = moderate-high → red = very high).

The map realistically shows *very few green (low-risk) wards*, with most in yellow/orange and scattered reds — reflecting Delhi's actual urban challenges (widespread poor drainage, low-lying Yamuna areas, high monsoon rainfall).

## Features

- Interactive Leaflet choropleth map of Delhi wards
- Color-coded risk levels: Green (Low) → Yellow (Moderate) → Orange (High) → Red (Very High)
- Ward search functionality
- Hover tooltips (ward name + risk score breakdown — if implemented)
- Responsive frontend built with React + Vite

## Data Sources

- *Delhi Wards Boundaries*: KML file of MCD wards (sourced from open source like [Kaggel/Open City](https://www.kaggle.com/datasets/wigglerofgems/open-city-delhi-wards-shape-dataset-kml) or Hindustan Times Labs shapefiles)
- *Drainage Lines*: Open drainage network data for Delhi [OpenCity](https://staging.opencity.in/dataset/delhi-drains-maps)
- *Elevation (DEM)*: ISRO Cartosat-1 Digital Elevation Model (~30m resolution), downloaded from [Bhuvan portal](https://bhuvan.nrsc.gov.in/)
- *Rainfall*: Historical average monsoon rainfall (since ~2010) via free WeatherAPI, sampled at 3 locations in Delhi
- *Historical Waterlogging*: Raw historical data (provided via AI prompts), cleaned and integrated

All data processed and normalized in QGIS for accuracy and compatibility.

## Methodology (How the Risk Score is Calculated)

### 1. Base Unit: Delhi Wards

- Used KML of MCD wards as polygons.
- Calculated ward centroids for distance-based assignments.

### 2. Drainage Density Score

- Computed total drainage line length within each ward.
- Calculated density = total length / ward area.
- Normalized using *percentile ranking* across all wards.
- Assigned score 0–1 (higher density = lower risk → inverted for final score).

### 3. Elevation Score

- Used ISRO Cartosat-1 DEM.
- Computed average (zonal mean) elevation per ward in QGIS.
- Normalized using *percentile ranking*.
- Lower elevation = higher risk (inverted score 0–1).

### 4. Rainfall Score

- Fetched average monsoon rainfall (June–September) from WeatherAPI for 3 representative locations.
- Assigned values to each ward based on distance from ward centroid (nearest or simple distance weighting).
- Normalized using *min-max formula*: (x - xmin) / (xmax - xmin) → 0–1.
- Higher rainfall = higher risk.

### 5. Historical Waterlogging Score

- Processed raw historical data (from team member's AI-sourced list).
- Normalized similarly (percentile or min-max) → 0–1.
- Higher historical incidents = higher risk.

### 6. Final Risk Score

- Combined with weights (adjustable):
  (Weights sum to 1; tuned to emphasize key factors like drainage and elevation.)
- Result: Single 0–1 score per ward.

### 7. Visualization

- Exported processed ward data (with scores) as GeoJSON.
- Loaded into Leaflet.js map.
- Applied color ramp based on score thresholds (e.g., 0–0.3 green, 0.3–0.6 yellow, 0.6–0.8 orange, 0.8+ red).
- Added interactivity: search by ward name, zoom, hover info.

## Tech Stack

- *Data Processing*: QGIS (normalization, zonal stats, GeoJSON export), pandas, geopandas
- *Frontend*: React (Vite), Leaflet.js (maps), JavaScript
- *Other*: APIs (WeatherAPI for rainfall), Git for version control

## Team Contributions

- *Mayank Kamboj* GIS processing (QGIS), data rormalization, scoring logic, map integration & fixes
- *Bhavya Pathik*: UI updates, frontend development
- *Gulshan Prasad*: Backend setup, AI & Weather API integrations
- *Harsh Sharma*: Main Idea, Data Collection (QGIS), Documentation

## Installation & Running Locally

1. Clone the repo:

bash
git clone https://github.com/Gulshan-Prasad/Erroriers_React.git
cd Erroriers_React