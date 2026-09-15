# CHARGEOPS — EV Fleet & Charging Operations Console

> **Portfolio Case Study 08** | Logistics & Mobility / EV Fleet Operations  
> **Complements**: [VOLTIS Electric Mobility](https://github.com/Ngh1aa/Voltis) with enterprise operational management.  
> **Benchmark Reference**: Geotab EV, Samsara, ChargePoint Fleet, Webfleet, Fleetio, EV Connect.  

---

## ⚡ Executive Summary

**CHARGEOPS** is a high-density, mission-critical operations console engineered for commercial EV fleet dispatchers, fleet managers, and depot charging operators. Built with a **technical, energetic, and controlled** art direction (avoiding generic neon-green tropes), it pairs real-time OCPP 2.0.1 charge point management with intelligent terrain- and payload-aware range prediction.

### Key Personas Served:
- **Dispatcher**: Evaluates vehicle range vs. route gradient, elevation, ambient temperature, and cargo weight to prevent stranded assets.
- **Charging Ops**: Manages 16 depot stalls, autonomous peak-shaving, and dynamic charging queue rebalancing.
- **Fleet Manager**: Monitors aggregate fleet SOC, energy tariffs ($/kWh), and route economics.
- **Maintenance**: Tracks electrochemical battery cell voltage delta (mV) and state-of-health (SOH) degradation.

---

## 💎 Visual Signature: Energy Readiness Rail

Positioned as the hero telemetry anchor across the viewport, the **Energy Readiness Rail** visualizes real-time state-of-charge (SOC) vs. scheduled departure deadlines for all active vehicles. It features:
- Dynamic kinetic charging flow pulses for active stalls.
- Color-calibrated status indicators (*Ready*, *Fast Charging*, *Range Deficit*, *Maintenance Hold*).
- Instant click-to-inspect slide-over drawer with battery thermal telemetry.
- Horizontal chevron scroll controls.

---

## 🚀 Hero Operational Flow: 142 km Dispatch

1. **Trigger**: New 142 km express cold-chain delivery request (+320m net elevation gain, 1,850 kg payload).
2. **AI Range Evaluation**:
   - **Candidate EV-104 (Voltis Cargo 350)**: Current SOC 28% (82 km range) → Flagged as **Ineligible / Range Deficit (-60 km shortfall)**. Held on fast charger DC-02.
   - **Candidate EV-409 (Voltis Cargo 500 Long Range)**: Current SOC 76% (218 km range) → Flagged as **Optimal Match (+76 km reserve buffer)**.
3. **Dispatch Authorization**:
   - User assigns EV-409.
   - Hero banner flashes active green status.
   - **Autonomous Queue Recalculation**: Depot charging queue immediately rebalances — prioritizing EV-104 on Bay DC-02 with boosted 145 kW power delivery.

---

## 🛠️ Architecture & Tech Stack

- **Zero-Dependency Architecture**: Pure Vanilla HTML5, modern modular CSS3, and ES6+ JavaScript.
- **Real-Time 60 FPS Visualizations**:
  - `depotMapCanvas`: Live 2D tactical GPS fleet tracking with animated bezier corridors and depot staging sectors.
  - `powerCurveCanvas`: Real-time depot megawatt power draw curve with automated peak-demand ceiling (2,000 kW) limit.
- **Web Audio Telemetry**: Synthetic acoustic feedback using Web Audio API for tactical clicks and dispatch chimes (with mute toggle).
- **Responsive Reflow**: Desktop-first (1440px), adapting smoothly to tablet (1024px) and mobile (768px).

---

## 🏃 Running Locally

```bash
# Run lightweight Python server
python -m http.server 4288

# Open in browser
http://localhost:4288
```
