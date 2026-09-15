// ==========================================================================
// CHARGEOPS — Enterprise EV Fleet & Charging Operations Console
// Core Application Controller & Interactive Simulation Engine
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const App = {
    state: {
      activeTab: 'overview',
      selectedVehicleId: 'EV-409',
      filterStatus: 'all',
      searchQuery: '',
      isMuted: false,
      dispatchAssigned: false,
      mapAnimationId: null
    },

    init() {
      this.bindNavigation();
      this.renderEnergyReadinessRail();
      this.renderVehicleTable();
      this.renderChargersGrid();
      this.renderChargingQueue();
      this.renderAlerts();
      this.initDepotMap();
      this.initPowerCurve();
      this.bindHeroDispatchModal();
      this.bindDrawerActions();
      this.bindSoundToggle();

      // Realtime tick simulator
      setInterval(() => this.tickRealtimeData(), 3000);
    },

    // ------------------------------------------------------------------------
    // NAVIGATION & TAB SWITCHING
    // ------------------------------------------------------------------------
    bindNavigation() {
      const navItems = document.querySelectorAll('.nav-item[data-tab]');
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const targetTab = item.getAttribute('data-tab');
          this.switchTab(targetTab);
          if (window.telemetryAudio) window.telemetryAudio.playClick();
        });
      });
    },

    switchTab(tabId) {
      this.state.activeTab = tabId;

      // Update Sidebar state
      document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Update Pane visibility
      document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === `tab-${tabId}`) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Update Page Context Title
      const pageTitleEl = document.getElementById('activePageTitle');
      const titleMap = {
        overview: 'Fleet Telemetry & Operations Overview',
        vehicles: 'Fleet Vehicles & Asset Inventory',
        dispatch: 'Intelligent Dispatch Matrix',
        charging: 'Depot Megawatt Charging & Grid Ops',
        maintenance: 'Battery Health & Preventative Maintenance',
        alerts: 'Live Operational Telemetry & Alert Stream'
      };
      if (pageTitleEl && titleMap[tabId]) {
        pageTitleEl.textContent = titleMap[tabId];
      }
    },

    // ------------------------------------------------------------------------
    // ENERGY READINESS RAIL (VISUAL SIGNATURE)
    // ------------------------------------------------------------------------
    renderEnergyReadinessRail() {
      const track = document.getElementById('energyReadinessRailTrack');
      if (!track) return;

      track.innerHTML = '';

      // Sort vehicles: Ready / High SOC first, Charging second, Deficit third
      const sorted = [...FLEET_DATA.vehicles].sort((a, b) => {
        return b.soc - a.soc;
      });

      sorted.forEach(v => {
        const cell = document.createElement('div');
        let statusClass = 'status-ready';
        if (v.status === 'Maintenance') statusClass = 'status-maintenance';
        else if (v.status === 'Charging') statusClass = 'status-charging';
        else if (v.soc < 35) statusClass = 'status-deficit';

        cell.className = `rail-cell ${statusClass} ${this.state.selectedVehicleId === v.id ? 'selected' : ''}`;
        cell.setAttribute('data-id', v.id);

        let chargeTag = '';
        if (v.status === 'Charging') {
          chargeTag = `<span class="rail-charge-tag">⚡ ${v.chargeKw} kW</span>`;
        } else if (v.status === 'En Route') {
          chargeTag = `<span class="rail-charge-tag" style="color: var(--accent-purple);">En Route</span>`;
        } else if (v.status === 'Maintenance') {
          chargeTag = `<span class="rail-charge-tag" style="color: var(--accent-danger);">Inspection</span>`;
        } else {
          chargeTag = `<span class="rail-charge-tag" style="color: var(--accent-energy);">Ready</span>`;
        }

        cell.innerHTML = `
          <div class="rail-cell-top">
            <span class="rail-vehicle-id">${v.id}</span>
            <span class="rail-soc-pill">${v.soc}%</span>
          </div>
          <div class="rail-progress-bar">
            <div class="rail-progress-fill" style="width: ${v.soc}%;"></div>
          </div>
          <div class="rail-cell-bottom">
            <span class="rail-range-text">${v.currentRangeKm} km</span>
            ${chargeTag}
          </div>
        `;

        cell.addEventListener('click', () => {
          this.openVehicleDrawer(v.id);
          if (window.telemetryAudio) window.telemetryAudio.playRailSlide();
        });

        track.appendChild(cell);
      });

      // Bind rail chevron scroll buttons
      const scrollLeftBtn = document.getElementById('railScrollLeft');
      const scrollRightBtn = document.getElementById('railScrollRight');
      if (scrollLeftBtn && !scrollLeftBtn.dataset.bound) {
        scrollLeftBtn.dataset.bound = 'true';
        scrollLeftBtn.addEventListener('click', () => {
          track.scrollBy({ left: -260, behavior: 'smooth' });
          if (window.telemetryAudio) window.telemetryAudio.playClick();
        });
      }
      if (scrollRightBtn && !scrollRightBtn.dataset.bound) {
        scrollRightBtn.dataset.bound = 'true';
        scrollRightBtn.addEventListener('click', () => {
          track.scrollBy({ left: 260, behavior: 'smooth' });
          if (window.telemetryAudio) window.telemetryAudio.playClick();
        });
      }
    },

    // ------------------------------------------------------------------------
    // VEHICLES DATA GRID & TABLE FILTERING
    // ------------------------------------------------------------------------
    renderVehicleTable() {
      const tbody = document.getElementById('vehicleTableBody');
      if (!tbody) return;

      tbody.innerHTML = '';

      const query = this.state.searchQuery.toLowerCase();
      const filtered = FLEET_DATA.vehicles.filter(v => {
        const matchesQuery = v.id.toLowerCase().includes(query) ||
                             v.model.toLowerCase().includes(query) ||
                             v.plate.toLowerCase().includes(query) ||
                             v.driver.toLowerCase().includes(query);

        if (!matchesQuery) return false;

        if (this.state.filterStatus === 'all') return true;
        if (this.state.filterStatus === 'available') return v.status === 'Available';
        if (this.state.filterStatus === 'charging') return v.status === 'Charging';
        if (this.state.filterStatus === 'enroute') return v.status === 'En Route';
        if (this.state.filterStatus === 'maintenance') return v.status === 'Maintenance';
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px; color: var(--text-muted);">No vehicles match the selected criteria.</td></tr>`;
        return;
      }

      filtered.forEach(v => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', v.id);

        let badgeClass = 'badge-available';
        if (v.status === 'Charging') badgeClass = 'badge-charging';
        if (v.status === 'En Route') badgeClass = 'badge-enroute';
        if (v.status === 'Maintenance') badgeClass = 'badge-maintenance';

        let socFillColor = 'var(--accent-energy)';
        if (v.soc < 30) socFillColor = 'var(--accent-amber)';
        if (v.status === 'Maintenance') socFillColor = 'var(--accent-danger)';

        tr.innerHTML = `
          <td>
            <div class="vehicle-id-cell">
              <span>${v.id}</span>
              <span class="vehicle-model-sub">${v.model}</span>
            </div>
          </td>
          <td><span style="font-family: var(--font-mono); font-size:11px;">${v.plate}</span></td>
          <td>${v.driver}</td>
          <td><span class="badge-status ${badgeClass}">${v.status}</span></td>
          <td class="table-soc-cell">
            <div class="table-soc-wrapper">
              <span class="table-soc-val" style="color: ${socFillColor};">${v.soc}%</span>
              <div class="table-soc-bar">
                <div class="table-soc-fill" style="width: ${v.soc}%; background: ${socFillColor};"></div>
              </div>
            </div>
          </td>
          <td><strong style="font-family: var(--font-mono); color: var(--text-primary);">${v.currentRangeKm} km</strong></td>
          <td><span style="font-family: var(--font-mono); font-weight: 600; color: ${v.soh >= 95 ? 'var(--accent-energy)' : 'var(--accent-amber)'};">${v.soh}%</span></td>
          <td>
            <button class="btn btn-secondary btn-inspect" data-id="${v.id}" style="padding: 4px 10px; font-size: 11px;">
              Telemetry
            </button>
          </td>
        `;

        tr.querySelector('.btn-inspect').addEventListener('click', (e) => {
          e.stopPropagation();
          this.openVehicleDrawer(v.id);
        });

        tr.addEventListener('click', () => {
          this.openVehicleDrawer(v.id);
        });

        tbody.appendChild(tr);
      });

      // Bind search & filter inputs if not already bound
      const searchInput = document.getElementById('vehicleSearchInput');
      if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', (e) => {
          this.state.searchQuery = e.target.value;
          this.renderVehicleTable();
        });
      }

      const filterBtns = document.querySelectorAll('.filter-btn');
      filterBtns.forEach(btn => {
        if (!btn.dataset.bound) {
          btn.dataset.bound = 'true';
          btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.state.filterStatus = btn.getAttribute('data-filter');
            this.renderVehicleTable();
            if (window.telemetryAudio) window.telemetryAudio.playClick();
          });
        }
      });
    },

    // ------------------------------------------------------------------------
    // CHARGING OPERATIONS & PEDESTAL GRID
    // ------------------------------------------------------------------------
    renderChargersGrid() {
      const grid = document.getElementById('chargersGridContainer');
      if (!grid) return;

      grid.innerHTML = '';

      FLEET_DATA.chargers.forEach(ch => {
        const card = document.createElement('div');
        const isActive = ch.status === 'Active';
        card.className = `charger-card ${isActive ? 'active-charging' : ''}`;

        let statusPill = `<span class="badge-status badge-available">Standby</span>`;
        if (ch.status === 'Active') {
          statusPill = `<span class="badge-status badge-charging">Delivering ${ch.currentKw} kW</span>`;
        } else if (ch.status === 'Throttled') {
          statusPill = `<span class="badge-status badge-maintenance">Thermal Throttled</span>`;
        }

        const vehicleInfo = ch.vehicleId 
          ? `<span>Vehicle: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${ch.vehicleId}</strong></span>` 
          : `<span style="color: var(--text-muted);">Port Open / Available</span>`;

        card.innerHTML = `
          <div class="charger-header">
            <div>
              <span class="charger-name">${ch.id}</span>
              <div class="charger-type-tag">${ch.type}</div>
            </div>
            ${statusPill}
          </div>
          <div class="charger-power-display">
            <span class="charger-power-kw">${ch.currentKw}</span>
            <span class="charger-power-unit">kW</span>
          </div>
          <div class="charger-connected-vehicle">
            ${vehicleInfo}
            <span style="font-family: var(--font-mono); color: var(--accent-energy); font-size: 10px;">${ch.efficiency}</span>
          </div>
          <div class="charger-metrics-row">
            <span>Cabinet Temp: ${ch.temp}</span>
            <span>Mode: Smart Dynamic</span>
          </div>
        `;

        grid.appendChild(card);
      });
    },

    renderChargingQueue() {
      const queueList = document.getElementById('chargingQueueList');
      if (!queueList) return;

      queueList.innerHTML = '';

      FLEET_DATA.chargingQueue.forEach(q => {
        const item = document.createElement('div');
        item.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          margin-bottom: 8px;
        `;

        let priorityColor = 'var(--text-secondary)';
        if (q.priority === 'URGENT_DEPARTURE') priorityColor = 'var(--accent-amber)';
        if (q.priority === 'OPTIMIZED_MATCH') priorityColor = 'var(--accent-energy)';

        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted); width: 20px;">#${q.rank}</span>
            <div>
              <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); font-size: 13px;">${q.vehicleId}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${q.bayAssigned}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-mono); font-size: 11px; color: ${priorityColor}; font-weight: 600;">${q.priority}</div>
            <div style="font-size: 10px; color: var(--text-muted);">Target: ${q.targetSoc}% by ${q.deadline}</div>
          </div>
        `;

        queueList.appendChild(item);
      });
    },

    // ------------------------------------------------------------------------
    // ALERTS STREAM
    // ------------------------------------------------------------------------
    renderAlerts() {
      const alertContainer = document.getElementById('alertsStreamContainer');
      if (!alertContainer) return;

      alertContainer.innerHTML = '';

      FLEET_DATA.alerts.forEach(alt => {
        const card = document.createElement('div');
        let borderLeft = 'var(--accent-energy)';
        if (alt.level === 'warning') borderLeft = 'var(--accent-amber)';
        if (alt.level === 'critical') borderLeft = 'var(--accent-danger)';

        card.style.cssText = `
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-left: 4px solid ${borderLeft};
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 10px;
        `;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-family: var(--font-display); font-size: 13px; color: var(--text-primary);">${alt.title}</strong>
            <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">${alt.time}</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${alt.desc}</p>
        `;

        alertContainer.appendChild(card);
      });
    },

    // ------------------------------------------------------------------------
    // VEHICLE DETAIL SLIDE-OVER DRAWER
    // ------------------------------------------------------------------------
    openVehicleDrawer(vehicleId) {
      const vehicle = FLEET_DATA.vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      this.state.selectedVehicleId = vehicleId;

      // Update readiness rail highlight
      document.querySelectorAll('.rail-cell').forEach(c => {
        if (c.getAttribute('data-id') === vehicleId) c.classList.add('selected');
        else c.classList.remove('selected');
      });

      const drawerBackdrop = document.getElementById('vehicleDrawer');
      const titleEl = document.getElementById('drawerVehicleId');
      const subEl = document.getElementById('drawerVehicleModel');
      const specsGrid = document.getElementById('drawerSpecsGrid');

      if (titleEl) titleEl.textContent = `${vehicle.id} — ${vehicle.plate}`;
      if (subEl) subEl.textContent = `${vehicle.model} • Driver: ${vehicle.driver}`;

      if (specsGrid) {
        specsGrid.innerHTML = `
          <div class="spec-box">
            <span class="spec-box-label">State of Charge (SOC)</span>
            <span class="spec-box-value" style="color: var(--accent-energy);">${vehicle.soc}%</span>
          </div>
          <div class="spec-box">
            <span class="spec-box-label">Estimated Usable Range</span>
            <span class="spec-box-value">${vehicle.currentRangeKm} km</span>
          </div>
          <div class="spec-box">
            <span class="spec-box-label">Battery Health (SOH)</span>
            <span class="spec-box-value" style="color: ${vehicle.soh >= 96 ? 'var(--accent-energy)' : 'var(--accent-amber)'};">${vehicle.soh}%</span>
          </div>
          <div class="spec-box">
            <span class="spec-box-label">Pack Temperature</span>
            <span class="spec-box-value">${vehicle.batteryTemp} °C</span>
          </div>
          <div class="spec-box">
            <span class="spec-box-label">Cell Delta Voltage</span>
            <span class="spec-box-value" style="color: ${vehicle.cellDeltaMv > 30 ? 'var(--accent-danger)' : 'var(--text-primary)'};">${vehicle.cellDeltaMv} mV</span>
          </div>
          <div class="spec-box">
            <span class="spec-box-label">Tire Pressure (TPMS)</span>
            <span class="spec-box-value">${vehicle.tirePressurePsi} PSI</span>
          </div>
          <div class="spec-box">
            <span class="spec-box-label">Fleet Location</span>
            <span class="spec-box-value" style="font-size: 12px;">${vehicle.location}</span>
          </div>
          <div class="spec-box">
            <span class="spec-box-label">Battery Pack Capacity</span>
            <span class="spec-box-value">${vehicle.batteryKwh} kWh</span>
          </div>
        `;
      }

      drawerBackdrop.classList.add('open');
      if (window.telemetryAudio) window.telemetryAudio.playClick();
    },

    closeVehicleDrawer() {
      const drawerBackdrop = document.getElementById('vehicleDrawer');
      if (drawerBackdrop) {
        drawerBackdrop.classList.remove('open');
      }
    },

    bindDrawerActions() {
      const closeBtn = document.getElementById('drawerCloseBtn');
      const backdrop = document.getElementById('vehicleDrawer');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeVehicleDrawer());
      }
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) this.closeVehicleDrawer();
        });
      }

      // Precondition button
      const precondBtn = document.getElementById('btnPreconditionCabin');
      if (precondBtn) {
        precondBtn.addEventListener('click', () => {
          this.showToast(`Cabin thermal preconditioning engaged for ${this.state.selectedVehicleId} (Target: 21.5°C).`);
          if (window.telemetryAudio) window.telemetryAudio.playClick();
        });
      }

      // Diagnostics button
      const diagBtn = document.getElementById('btnRunDiagnostics');
      if (diagBtn) {
        diagBtn.addEventListener('click', () => {
          this.showToast(`Diagnostic sweep completed for ${this.state.selectedVehicleId}: All powertrain sensors NOMINAL.`);
          if (window.telemetryAudio) window.telemetryAudio.playClick();
        });
      }
    },

    // ------------------------------------------------------------------------
    // HERO DISPATCH SIMULATOR (142 KM SCENARIO)
    // ------------------------------------------------------------------------
    bindHeroDispatchModal() {
      const triggerBtn = document.getElementById('btnTriggerHeroDispatch');
      const modalBackdrop = document.getElementById('heroDispatchModal');
      const closeBtn = document.getElementById('modalCloseBtn');
      const cancelBtn = document.getElementById('modalCancelBtn');
      const assignBtn = document.getElementById('btnConfirmAssignEV409');

      if (triggerBtn) {
        triggerBtn.addEventListener('click', () => {
          modalBackdrop.classList.add('open');
          if (window.telemetryAudio) window.telemetryAudio.playClick();
        });
      }

      const closeModal = () => {
        modalBackdrop.classList.remove('open');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
          if (e.target === modalBackdrop) closeModal();
        });
      }

      if (assignBtn) {
        assignBtn.addEventListener('click', () => {
          this.executeHeroDispatchAssignment();
          closeModal();
        });
      }
    },

    executeHeroDispatchAssignment() {
      // 1. Mark EV-409 as Assigned & Departing
      const ev409 = FLEET_DATA.vehicles.find(v => v.id === 'EV-409');
      if (ev409) {
        ev409.status = 'En Route';
        ev409.assignedRoute = 'DSP-8842 (Express Cold-Chain 142km)';
        ev409.location = 'En Route: Sector 1 (Departure)';
      }

      // 2. Dynamically Recalculate Charging Queue
      // Since EV-409 departed, EV-104 (which lacked range at 28%) receives priority charge on DC-02
      const ev104 = FLEET_DATA.vehicles.find(v => v.id === 'EV-104');
      if (ev104) {
        ev104.chargeKw = 145.0; // Boosted power allocation
      }

      // Reorder charging queue
      FLEET_DATA.chargingQueue = [
        { rank: 1, vehicleId: "EV-104", currentSoc: 28, targetSoc: 85, bayAssigned: "DC-02 (Supercharged)", powerAllocatedKw: 145, priority: "TOP_PRIORITY_RECHARGING", deadline: "12:50" },
        { rank: 2, vehicleId: "EV-330", currentSoc: 68, targetSoc: 85, bayAssigned: "DC-04", powerAllocatedKw: 112, priority: "STANDARD", deadline: "11:50" },
        { rank: 3, vehicleId: "EV-209", currentSoc: 42, targetSoc: 80, bayAssigned: "DC-01 (Queued next)", powerAllocatedKw: 0, priority: "EN_ROUTE_RETURN", deadline: "14:30" }
      ];

      // Update KPIs
      FLEET_DATA.kpis.activeOnRoad += 1;
      FLEET_DATA.kpis.availableIdle -= 1;
      const kpiOnRoadEl = document.getElementById('kpiOnRoadCount');
      if (kpiOnRoadEl) kpiOnRoadEl.textContent = FLEET_DATA.kpis.activeOnRoad;

      // Update UI components
      this.renderEnergyReadinessRail();
      this.renderVehicleTable();
      this.renderChargingQueue();
      this.renderChargersGrid();

      // Audio feedback
      if (window.telemetryAudio) {
        window.telemetryAudio.playDispatchConfirmed();
      }

      // Flash hero banner
      const heroBanner = document.getElementById('heroDispatchBanner');
      if (heroBanner) {
        heroBanner.innerHTML = `
          <div class="hero-dispatch-left">
            <div class="hero-pulse-indicator" style="background: rgba(0, 208, 156, 0.25); border-color: var(--accent-energy);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="hero-dispatch-content">
              <h4 style="color: var(--accent-energy);">DISPATCH ACTIVE: EV-409 EN ROUTE (142 KM)</h4>
              <p>Vehicle departed Depot at 76% SOC. Depot charging queue dynamically rebalanced — EV-104 prioritized to 145 kW.</p>
            </div>
          </div>
          <div class="hero-dispatch-actions">
            <span class="depot-pill" style="color: var(--accent-energy); border-color: var(--accent-energy);">Status: Dispatched</span>
          </div>
        `;
      }

      this.showToast('✅ 142 km Dispatch Assigned to EV-409. Charging Queue & Power Load Recalculated!');
    },

    // ------------------------------------------------------------------------
    // SOUND TOGGLE
    // ------------------------------------------------------------------------
    bindSoundToggle() {
      const soundBtn = document.getElementById('btnSoundToggle');
      if (!soundBtn) return;

      soundBtn.addEventListener('click', () => {
        if (!window.telemetryAudio) return;
        const isMuted = window.telemetryAudio.toggleMute();
        soundBtn.innerHTML = isMuted 
          ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`
          : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
        
        this.showToast(isMuted ? 'Acoustic Feedback Muted' : 'Acoustic Feedback Active');
      });
    },

    showToast(message) {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-energy)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>${message}</span>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    // ------------------------------------------------------------------------
    // CANVAS 2D: TACTICAL DEPOT & FLEET CORRIDOR MAP
    // ------------------------------------------------------------------------
    initDepotMap() {
      const canvas = document.getElementById('depotMapCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 380;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      let t = 0;
      const vehiclesInMotion = [
        { id: 'EV-202', progress: 0.28, speed: 0.0006, color: '#8B5CF6', label: 'EV-202 (64% SOC)' },
        { id: 'EV-209', progress: 0.62, speed: 0.0008, color: '#8B5CF6', label: 'EV-209 (42% SOC)' },
        { id: 'EV-409', progress: 0.05, speed: 0.0005, color: '#00D09C', label: 'EV-409 (76% SOC)' }
      ];

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // 2. Central Depot Zone (Left side)
        const depotX = 140;
        const depotY = canvas.height / 2;
        ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(depotX - 90, depotY - 90, 180, 180, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 11px JetBrains Mono';
        ctx.fillText('CENTRAL DEPOT (T-4)', depotX - 70, depotY - 65);
        ctx.fillStyle = '#64748B';
        ctx.font = '10px Inter';
        ctx.fillText('16 Chargers • 1.42 MW Draw', depotX - 70, depotY - 48);

        // Depot Charging Stalls micro-dots
        for (let i = 0; i < 6; i++) {
          const stallX = depotX - 60 + (i % 3) * 45;
          const stallY = depotY - 20 + Math.floor(i / 3) * 50;
          ctx.fillStyle = i < 4 ? '#0284C7' : '#00D09C';
          ctx.beginPath();
          ctx.arc(stallX, stallY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94A3B8';
          ctx.font = '9px JetBrains Mono';
          ctx.fillText(`DC-${i+1}`, stallX - 8, stallY + 16);
        }

        // 3. Destination Hub: North Logistics Park (Right side)
        const hubX = canvas.width - 150;
        const hubY = 110;
        ctx.fillStyle = 'rgba(0, 208, 156, 0.08)';
        ctx.strokeStyle = 'rgba(0, 208, 156, 0.3)';
        ctx.beginPath();
        ctx.roundRect(hubX - 80, hubY - 60, 160, 120, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00D09C';
        ctx.font = '600 11px JetBrains Mono';
        ctx.fillText('NORTH LOGISTICS HUB', hubX - 65, hubY - 35);
        ctx.fillStyle = '#64748B';
        ctx.font = '10px Inter';
        ctx.fillText('142 km Route Destination', hubX - 65, hubY - 18);

        // 4. Highway Express Corridor (Bezier Curve between Depot and Hub)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(depotX + 90, depotY);
        ctx.bezierCurveTo(canvas.width * 0.45, depotY + 40, canvas.width * 0.55, hubY + 60, hubX - 80, hubY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 5. Render moving vehicles on the corridor
        vehiclesInMotion.forEach((veh, idx) => {
          veh.progress += veh.speed;
          if (veh.progress > 1) veh.progress = 0;

          // Bezier coordinate interpolation
          const p = veh.progress;
          const p0 = { x: depotX + 90, y: depotY };
          const p1 = { x: canvas.width * 0.45, y: depotY + 40 };
          const p2 = { x: canvas.width * 0.55, y: hubY + 60 };
          const p3 = { x: hubX - 80, y: hubY };

          const cx = Math.pow(1 - p, 3) * p0.x + 3 * Math.pow(1 - p, 2) * p * p1.x + 3 * (1 - p) * Math.pow(p, 2) * p2.x + Math.pow(p, 3) * p3.x;
          const cy = Math.pow(1 - p, 3) * p0.y + 3 * Math.pow(1 - p, 2) * p * p1.y + 3 * (1 - p) * Math.pow(p, 2) * p2.y + Math.pow(p, 3) * p3.y;

          // Pulsing halo
          ctx.fillStyle = veh.color + '33';
          ctx.beginPath();
          ctx.arc(cx, cy, 10 + Math.sin(t * 0.05) * 3, 0, Math.PI * 2);
          ctx.fill();

          // Core dot
          ctx.fillStyle = veh.color;
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();

          // Vehicle Label with staggered vertical positioning to avoid overlap
          const labelOffsetY = (idx % 2 === 0) ? -10 : 16;
          ctx.fillStyle = '#F8FAFC';
          ctx.font = '600 10px JetBrains Mono';
          ctx.fillText(veh.label, cx + 10, cy + labelOffsetY);
        });

        t++;
        requestAnimationFrame(draw);
      };

      draw();
    },

    // ------------------------------------------------------------------------
    // CANVAS 2D: MEGAWATT POWER DEMAND LOAD CURVE
    // ------------------------------------------------------------------------
    initPowerCurve() {
      const canvas = document.getElementById('powerCurveCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const drawPowerCurve = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 180;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let y = 30; y < h; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Peak Shaving Limit (2,000 kW) Red Dashed Line
        const peakY = 40;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, peakY);
        ctx.lineTo(w, peakY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#F43F5E';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('PEAK DEMAND CAP: 2,000 kW', w - 170, peakY - 8);

        // Power Draw Gradient Curve (Current Load ~1,420 kW)
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(0, 208, 156, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 208, 156, 0.01)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, h);

        const points = [
          { x: 0, y: h - 40 },
          { x: w * 0.15, y: h - 55 },
          { x: w * 0.3, y: h - 95 },
          { x: w * 0.45, y: h - 120 },
          { x: w * 0.6, y: h - 110 },
          { x: w * 0.75, y: h - 130 },
          { x: w * 0.9, y: h - 115 },
          { x: w, y: h - 118 }
        ];

        ctx.lineTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2;
          const yc = (points[i].y + points[i - 1].y) / 2;
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Stroke line
        ctx.strokeStyle = '#00D09C';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2;
          const yc = (points[i].y + points[i - 1].y) / 2;
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.stroke();

        // Realtime indicator point
        const lastP = points[points.length - 1];
        ctx.fillStyle = '#00D09C';
        ctx.beginPath();
        ctx.arc(lastP.x - 10, lastP.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 11px JetBrains Mono';
        ctx.fillText('1,420 kW', lastP.x - 65, lastP.y - 12);
      };

      drawPowerCurve();
      window.addEventListener('resize', drawPowerCurve);
    },

    // ------------------------------------------------------------------------
    // REALTIME TELEMETRY TICK SIMULATION
    // ------------------------------------------------------------------------
    tickRealtimeData() {
      // Increment charging vehicles SOC slightly
      FLEET_DATA.vehicles.forEach(v => {
        if (v.status === 'Charging' && v.soc < 100) {
          if (Math.random() > 0.4) {
            v.soc = Math.min(100, v.soc + 1);
            v.currentRangeKm = Math.round((v.soc / 100) * v.ratedRangeKm);
          }
        }
      });

      // Update readiness rail in-place
      this.renderEnergyReadinessRail();
    }
  };

  // Launch App
  window.App = App;
  App.init();
});
