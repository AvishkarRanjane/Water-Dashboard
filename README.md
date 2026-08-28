# 💧 AquaWatch — Urban Water Leakage & Loss Detection Intelligence System

<div align="center">

[![Live Demo](https://img.shields.io/badge/🟢_LIVE_DEMO-waterdashboard--woad.vercel.app-00DC82?style=for-the-badge&logo=vercel&logoColor=white)](https://waterdashboard-woad.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br />

### 🌐 [Click Here for Live Demo on Vercel: https://waterdashboard-woad.vercel.app/](https://waterdashboard-woad.vercel.app/)

**A state-of-the-art municipal hydraulic telemetry, Non-Revenue Water (NRW) reduction, and geospatial leak dispatch platform.**

[🔴 Live Website](https://waterdashboard-woad.vercel.app/) • [🚀 Deploy to Vercel](#-deploying-to-vercel) • [✨ Key Modules](#-key-modules--capabilities) • [📐 System Architecture](#-system-architecture) • [🛠️ Local Installation](#-quickstart--local-development) • [📖 API Reference](#-api-specification)

<br />

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAvishkarRanjane%2FWater-Dashboard)

</div>

---

## 📌 Executive Overview

Municipalities worldwide lose **25% to 45%** of treated potable water before it reaches consumers due to subterranean pipe bursts, aging cast iron joint decay, background leakage, and pressure transients—a critical financial and ecological challenge known as **Non-Revenue Water (NRW)**.

**AquaWatch** delivers an end-to-end municipal water intelligence system that bridges high-frequency IoT hydraulic telemetry (electromagnetic flow meters, piezoresistive pressure transducers, and acoustic hydrophones) with real-time geospatial GIS intelligence, statistical rolling Z-score anomaly engines, objective multi-factor maintenance dispatch, and a public citizen leak reporting portal.

```
       [ IoT Hydraulic Telemetry ]          [ Citizen Photo Reports ]
         (Flow / Pressure / Acoustic)          (Geolocated & Flow Severity)
                     │                                     │
                     ▼                                     ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 AquaWatch Ingestion Engine                  │
        │           • High-frequency Telemetry Normalization          │
        │           • Spatial District Metered Area (DMA) Geocoding   │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
        ┌─────────────────────────┐         ┌─────────────────────────┐
        │  Statistical Anomaly    │         │  Spatial Correlation    │
        │  Engine (Z-Score > 2.5) │         │  & Loss Estimation      │
        └────────────┬────────────┘         └────────────┬────────────┘
                     │                                   │
                     └─────────────────┬─────────────────┘
                                       │
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │        Multi-Factor Maintenance Priority Queue              │
        │      Priority = W_sev·S + W_pop·P + W_loss·L + Bonus_cit    │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
        [ Operations GIS Dashboard ]        [ Field Crew Mobile Dispatch ]
```

---

## ✨ Key Modules & Capabilities

### 1. 📊 Operations Command Center
* **Hero KPI Metrics**: Real-time citywide NRW percentage (with MoM delta comparison), cumulative water saved ($m^3$), financial loss recovered ($\$$), active anomaly counters, and System Health Index (SHI).
* **Live Telemetry Stream**: Continuous acoustic hydrophone and electromagnetic flow readouts per District Metered Area (DMA).
* **Interactive City Risk Map**: High-contrast GIS boundary polygons color-coded by real-time leakage probability (Critical, High, Medium, Optimal) with animated burst indicators.

### 2. 🗺️ Multi-Layer GIS Asset Explorer
* **Pipe Asset Intelligence**: Inspect 94.6 km of pipeline infrastructure by vintage era (Pre-1980, 1980–1999, 2000–2014, Modern), structural condition score ($1.0 - 10.0$), diameter ($250\text{mm} - 450\text{mm}$), and material type (**Ductile Iron**, **Cast Iron**, **PVC**, **HDPE**, **Asbestos Cement**).
* **Granular Layer Controls**: Independent layer toggles for Pressure Zones, Pipe Assets, IoT Sensor Telemetry, and Active Leak Hotspots.
* **Basemap Switching**: Toggle between High-Contrast Voyager, Positron, and Satellite imagery.

### 3. 📈 Diurnal Consumption & Hydraulic Analytics
* **Dynamic Confidence Bands**: 24-hour diurnal demand curve with statistical upper ($+2\sigma$) and lower ($-2\sigma$) threshold bounds.
* **Night Flow Analysis**: Enhanced sensitivity during Night Minimum Flow (02:00–05:00 AM) off-peak windows to catch background micro-leaks.
* **Historical Dual-Axis Explorer**: Synchronized flow ($m^3/h$) vs. pressure ($\text{bar}$) time-series trends with burst correlation.

### 4. 🛠️ Emergency Maintenance Dispatch Queue
* **Algorithmic Priority Ranking**: Objective scoring ($0 - 100$) factoring in pipe burst severity, population density, physical volume loss rate, and citizen corroboration.
* **4-Stage Work Order Lifecycle**: Visual status progression: `Reported` ➔ `Assigned` ➔ `In Progress` ➔ `Verified Fixed`.
* **Field Dispatch Management**: Crew assignments, technician work order notes, and valve isolation instructions.

### 5. 📱 Citizen Public Leak Reporting Portal
* **No-Login Community Reporting**: Intuitive form with street address auto-assignment to DMA zones, visual flow severity presets (*Active Geyser*, *Street River*, *Trickle*, *Damp Ground*), and photo proof uploads.
* **Automated Sensor Cross-Referencing**: Citizen reports inside sensor-flagged zones receive an automated **Verified Match (+10 pts)** badge, instantly elevating dispatch priority.
* **Tracking Reference Code**: Public tracking reference lookup (`REP-8492`, `REP-5102`) for citizens to observe live repair progression.

### 6. ⚙️ System Calibration & Role-Based Access Control (RBAC)
* **Per-Zone Sensitivity Tuning**: Adjust rolling Z-score trigger thresholds, window durations ($15 - 60\text{ min}$), minimum flow deviation %, and auto-dispatch cutoffs.
* **RBAC Profiles**: Switch seamlessly between **Administrator** (full write/calibration access), **Utility Staff** (dispatch and repairs), and **Viewer / Auditor** (read-only compliance oversight).
* **Interactive Leak Simulator**: One-click injection sandbox for evaluating system response to sudden bursts, creep leaks, and pressure drops in real time.

---

## 📐 Mathematical & Statistical Models

### 1. Rolling Z-Score Anomaly Detection
Telemetry flow $Q_t$ is benchmarked against a 30-minute rolling baseline mean $\mu_{30}$ and standard deviation $\sigma_{30}$, modulated by the diurnal consumption coefficient $\kappa(h)$:

$$\mathcal{Z} = \frac{Q_t - \mu_{30}(h)}{\sigma_{30}(h)}$$

An anomaly event is triggered when:

$$\mathcal{Z} \ge \mathcal{Z}_{\text{threshold}} \quad \text{AND} \quad \frac{Q_t - \mu_{30}(h)}{\mu_{30}(h)} \times 100 \ge \Delta_{\text{min\_pct}}$$

### 2. Multi-Factor Maintenance Priority Scoring
Work orders are ranked using a normalized composite priority formula:

$$\text{Priority Score} = \min\left(100, \, w_{\text{sev}} \cdot S + w_{\text{pop}} \cdot P + w_{\text{loss}} \cdot L + \mathcal{B}_{\text{citizen}}\right)$$

* $S \in [15, 40]$: Hydraulic severity weight based on pressure drop differential.
* $P \in [10, 25]$: Affected population density factor per DMA sector.
* $L \in [15, 30]$: Physical water loss rate ($m^3/h$).
* $\mathcal{B}_{\text{citizen}} = 10\text{ pts}$: Bonus applied when corroborated by verified citizen visual report.

---

## 🗂️ Project Structure

```
Water-Dashboard/
├── backend/                        # Node.js / Express backend & simulation core
│   ├── api/                        # RESTful API routing endpoints
│   │   ├── anomalies.ts            # Anomaly events & status update routes
│   │   ├── auth.ts                 # User authentication & RBAC switching
│   │   ├── citizen_reports.ts      # Public citizen reports & reference lookup
│   │   ├── ingestion.ts            # Sensor data ingestion endpoint
│   │   ├── maintenance.ts          # Work orders & priority queue management
│   │   └── zones.ts                # DMA zones, pipes, and sensor endpoints
│   ├── core/                       # Core analytical computation engines
│   │   ├── anomaly_engine.ts       # Diurnal baseline & rolling Z-score logic
│   │   ├── loss_estimation.ts      # Physical & financial loss calculations
│   │   ├── priority_ranking.ts     # Multi-factor priority weighting algorithm
│   │   └── websocket_manager.ts    # Native WebSocket broadcaster
│   ├── db/                         # In-memory store & initial seed dataset
│   │   ├── in_memory_store.ts      # High-speed state store & DMA geometries
│   │   └── schema_setup.sql        # PostgreSQL / TimescaleDB schema definition
│   └── simulator/                  # Hydraulic telemetry simulation engine
│       └── data_generator.ts       # Continuous diurnal flow/pressure simulator
├── src/                            # Frontend React 19 + TypeScript application
│   ├── components/                 # Reusable UI & GIS visualization components
│   │   ├── charts/                 # Recharts hydraulic analytical visualizers
│   │   │   ├── ConsumptionBandChart.tsx # Diurnal 2-sigma confidence band
│   │   │   ├── HistoricalTrendChart.tsx # Dual-axis flow & pressure history
│   │   │   └── ZoneComparisonChart.tsx  # Area-wise water loss rankings
│   │   ├── map/                    # Leaflet.js GIS mapping components
│   │   │   ├── CityRiskMap.tsx     # High-contrast DMA risk polygon map
│   │   │   ├── MapComponent.tsx    # Multi-layer pipeline asset GIS explorer
│   │   │   └── PipelineNetworkMap.tsx   # Asset layer wrapper
│   │   ├── AnomalyFeed.tsx         # Live scrolling alert feed
│   │   ├── Header.tsx              # Operations header & user role switcher
│   │   ├── PriorityQueue.tsx       # Maintenance dispatch queue table
│   │   ├── SimulatorModal.tsx      # Leak injection demo sandbox
│   │   └── StatusTimeline.tsx      # 4-stage work order timeline
│   ├── hooks/                      # Custom React hooks
│   │   └── useWebSocket.ts         # Real-time WebSocket + Vercel fallback hook
│   ├── pages/                      # Top-level view controllers
│   │   ├── AdminConfig.tsx         # Calibration sliders & sensor registry
│   │   ├── Analytics.tsx           # GIS explorer & hydraulic analytics
│   │   ├── CitizenPortal.tsx       # Public leak reporting & status tracker
│   │   ├── Dashboard.tsx           # Operational command center
│   │   └── Maintenance.tsx         # Maintenance dispatch & citizen review
│   ├── services/                   # Frontend API client
│   │   └── api.ts                  # Resilient API client with fallback store
│   ├── App.tsx                     # Main layout & router orchestration
│   ├── index.css                   # Tailwind CSS v4 & custom Leaflet styling
│   ├── main.tsx                    # React application entry point
│   └── types.ts                    # TypeScript data models & protocol schemas
├── index.html                      # HTML5 entry, Google Fonts & SVG favicon
├── package.json                    # Dependencies & build scripts
├── server.ts                       # Express + WebSocket + Vite middleware server
├── tsconfig.json                   # TypeScript configuration
├── vercel.json                     # Vercel deployment routing & cache rules
└── vite.config.ts                  # Vite 6 + Tailwind v4 + Rollup chunking
```

---

## 🛠️ Quickstart & Local Development

### Prerequisites
* **Node.js**: `v18.0.0` or later
* **npm** or **bun** / **yarn**

### 1. Clone Repository
```bash
git clone https://github.com/AvishkarRanjane/Water-Dashboard.git
cd Water-Dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Full-Stack Development Server
Starts the Express server with native WebSockets and Vite HMR:
```bash
npm run dev
```
* 🌐 Application UI: `http://localhost:3000`
* ⚡ WebSocket Stream: `ws://localhost:3000/ws`
* 🩺 Health Check: `http://localhost:3000/api/health`

### 4. Client-Only Development Mode
If you prefer running Vite directly without the Express server:
```bash
npm run dev:client
```
* 🌐 Client UI: `http://localhost:5173` *(uses automatic client-side simulation fallback)*

### 5. Build for Production
```bash
npm run build
```

---

## 🚀 Deploying to Vercel

AquaWatch is engineered to deploy seamlessly on **Vercel** with zero custom configuration.

### Method 1: One-Click Deploy (Recommended)
1. Click the button below:
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAvishkarRanjane%2FWater-Dashboard)

2. Connect your GitHub account and select your repository.
3. Vercel will automatically detect the Vite framework and configure the build settings:
   * **Framework Preset**: `Vite`
   * **Build Command**: `vite build` (or `npm run build:client`)
   * **Output Directory**: `dist`
   * **Install Command**: `npm install`
4. Click **Deploy**. Your live dashboard will be online in seconds!

### Method 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login and deploy from project directory
vercel
```

> **Note on Vercel Static Deployment**: AquaWatch contains a built-in fallback simulation engine in `src/services/api.ts` and `src/hooks/useWebSocket.ts`. When deployed on Vercel as a static SPA, 100% of interactive features—including leak injection simulations, sensitivity tuning, citizen reports, work order progressions, and live telemetry ticks—function immediately out of the box!

---

## 📖 API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health status and active anomaly counts |
| `GET` | `/api/stats/summary` | Citywide NRW %, total flow, and financial loss metrics |
| `GET` | `/api/zones` | List all District Metered Areas with risk levels |
| `GET` | `/api/zones/:id` | Detailed DMA metrics, sensors, pipes, and history |
| `PUT` | `/api/zones/:id/sensitivity` | Update Z-score sensitivity and thresholds |
| `GET` | `/api/zones/network/pipes` | Retrieve all GIS pipeline asset segments |
| `GET` | `/api/zones/network/sensors` | List all IoT flow/pressure telemetry sensors |
| `POST` | `/api/zones/network/sensors` | Register a new IoT sensor in the network |
| `GET` | `/api/anomalies` | Query anomaly events by zone, severity, or status |
| `PATCH` | `/api/anomalies/:id/status` | Update anomaly resolution status |
| `GET` | `/api/maintenance` | Retrieve ranked maintenance work orders |
| `POST` | `/api/maintenance` | Create and dispatch a new work order |
| `PATCH` | `/api/maintenance/:id` | Update work order stage and crew notes |
| `POST` | `/api/citizen-reports/submit` | Submit a public leak observation with photo |
| `GET` | `/api/citizen-reports/lookup/:id` | Track repair status by citizen reference ID |
| `POST` | `/api/simulator/inject` | Inject simulated hydraulic burst scenario |
| `POST` | `/api/simulator/clear` | Clear active simulation scenarios |

---

## 🛡️ Standards & Compliance
* **ISO 24516-1**: Guidelines for the management of assets of water supply and wastewater systems.
* **EPA WaterSense / AWWA M36**: Standard Water Audit Methodology for Non-Revenue Water quantification.

---

## 📄 License
This project is open-source and available under the **[MIT License](LICENSE)**.

<div align="center">
  <sub>Built with ❤️ for resilient urban water infrastructure & clean water conservation.</sub>
</div>
