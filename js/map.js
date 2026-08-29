/**
 * ALMS Live Need & Support Map (Leaflet.js Engine)
 * Connected to real backend REST API:
 * - /api/map (Fetch active donations, need food requests, available volunteers)
 */

const ALMS_MAP = {
  map: null,
  markersLayer: null,
  routeLayer: null,
  currentFilter: 'all',

  async init(containerId = 'liveMap') {
    const el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined') return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = L.map(containerId, {
      center: [28.5650, 77.2050],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);

    await this.loadMapPoints();
  },

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.map-chip').forEach(c => c.classList.remove('active'));
    if (event?.currentTarget) event.currentTarget.classList.add('active');
    this.loadMapPoints();
  },

  async loadMapPoints() {
    if (!this.markersLayer) return;
    this.markersLayer.clearLayers();
    this.routeLayer.clearLayers();

    let data = { donations: [], requests: [], volunteers: [] };
    try {
      const res = await ALMS.api('/api/map');
      data = res;
    } catch (e) {
      console.warn("Failed to fetch map data:", e);
    }

    const { donations = [], requests = [], volunteers = [] } = data;

    // 1. Need Food Markers (Red)
    if (this.currentFilter === 'all' || this.currentFilter === 'need') {
      requests.forEach(r => {
        if (!r.latitude || !r.longitude) return;
        const icon = L.divIcon({
          className: 'map-custom-marker marker-red',
          html: `<div class="pulse-ring-red"></div><span class="marker-icon">🔴</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([r.latitude, r.longitude], { icon });
        marker.bindPopup(`
          <div style="font-family:var(--font-sans); padding:4px;">
            <span class="badge badge-danger">NEED FOOD (URGENT)</span>
            <h4 style="margin:6px 0 2px; color:var(--alms-brown-dark);">${r.name}</h4>
            <div style="font-size:0.8rem; color:#666;">📍 ${r.place}</div>
            <div style="font-size:0.85rem; margin-top:6px; font-weight:700;">👥 ${r.meals} Meals Needed (${r.hunger_percent || 85}% Hunger)</div>
            <a href="pages/ngo.html" class="btn btn-sm btn-primary" style="margin-top:8px; display:inline-block;">Fulfill via Priority Pool →</a>
          </div>
        `);
        this.markersLayer.addLayer(marker);
      });
    }

    // 2. Donors (Green)
    if (this.currentFilter === 'all' || this.currentFilter === 'donor') {
      donations.forEach(d => {
        if (!d.latitude || !d.longitude) return;
        const icon = L.divIcon({
          className: 'map-custom-marker marker-green',
          html: `<div class="pulse-ring-green"></div><span class="marker-icon">🟢</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([d.latitude, d.longitude], { icon });
        marker.bindPopup(`
          <div style="font-family:var(--font-sans); padding:4px;">
            <span class="badge badge-success">SURPLUS DONATION READY</span>
            <h4 style="margin:6px 0 2px; color:var(--alms-brown-dark);">${d.food_name || d.food_type}</h4>
            <div style="font-size:0.8rem; color:#666;">📍 ${d.pickup_location}</div>
            <div style="font-size:0.85rem; margin-top:6px; font-weight:700;">🍱 ${d.people_to_feed} Meal Portions Available</div>
            <a href="pages/donor.html" class="btn btn-sm btn-primary" style="margin-top:8px; display:inline-block;">Claim / Collab →</a>
          </div>
        `);
        this.markersLayer.addLayer(marker);
      });
    }

    // 3. Volunteers (Blue)
    if (this.currentFilter === 'all' || this.currentFilter === 'volunteer') {
      volunteers.forEach(v => {
        if (!v.latitude || !v.longitude) return;
        const icon = L.divIcon({
          className: 'map-custom-marker marker-blue',
          html: `<div class="pulse-ring-blue"></div><span class="marker-icon">🔵</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([v.latitude, v.longitude], { icon });
        marker.bindPopup(`
          <div style="font-family:var(--font-sans); padding:4px;">
            <span class="badge badge-brown">VERIFIED COURIER</span>
            <h4 style="margin:6px 0 2px; color:var(--alms-brown-dark);">${v.name}</h4>
            <div style="font-size:0.8rem; color:#666;">🚴 Vehicle: ${v.vehicle_type}</div>
            <div style="font-size:0.85rem; margin-top:6px; font-weight:700; color:var(--color-success);">● Available for Dispatch</div>
          </div>
        `);
        this.markersLayer.addLayer(marker);
      });
    }

    // Draw active dispatch route if all filters are active
    if (this.currentFilter === 'all') {
      const routeCoordinates = [
        [28.5620, 77.2150], // Donor
        [28.5645, 77.2090], // Volunteer
        [28.5684, 77.2065]  // Recipient Shelter
      ];
      const polyline = L.polyline(routeCoordinates, {
        color: '#8B5E3C',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      });
      this.routeLayer.addLayer(polyline);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_MAP.init('liveMap');
  ALMS_MAP.init('fullscreenMap');
});
