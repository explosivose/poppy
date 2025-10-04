function journeyPlanner() {
  return {
    map: null,
    currentLeg: { start: null, end: null },
    legs: [],
    markers: [],
    loading: false,
    error: null,
    showTimeModal: false,
    editingLegIndex: null,
    tempStartTime: '',
    tempEndTime: '',
    totalPrice: 0,
    vehicleMarkers: {},

    async initMap() {
      // Initialize the map
      this.map = new maplibregl.Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [4.3517, 50.8503], // Brussels coordinates
        zoom: 12,
      });

      // Add navigation controls
      this.map.addControl(
        new maplibregl.NavigationControl(),
        'bottom-right',
      );

      // Handle map clicks
      this.map.on('click', (e) => this.handleMapClick(e));

      // Load and display vehicles and parking zones once map is ready
      this.map.on('load', () => {
        this.loadVehiclesAndParking();
      });
    },

    loadVehiclesAndParking() {
      try {
        // Get data from window (injected by server)
        const vehicles = window.vehiclesData || [];
        const zones = window.parkingZonesData || [];

        this.displayVehicles(vehicles);
        this.displayParkingZones(zones);
      } catch (error) {
        console.error('Error loading vehicles/parking:', error);
      }
    },

    displayVehicles(vehicles) {
      // Store vehicle markers with their IDs for later updates
      this.vehicleMarkers = {};

      // Add vehicle markers
      vehicles.forEach((vehicle) => {
        const el = document.createElement('div');
        el.style.backgroundColor = '#3b82f6';
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="font-size: 12px;">
            <strong>🚗 ${vehicle.model.make} ${vehicle.model.name}</strong><br>
            Plate: ${vehicle.plate}<br>
            Battery: ${vehicle.autonomyPercentage}%<br>
            Range: ${vehicle.displayAutonomy}km
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([vehicle.locationLongitude, vehicle.locationLatitude])
          .setPopup(popup)
          .addTo(this.map);

        // Store marker reference with vehicle data
        this.vehicleMarkers[vehicle.uuid] = {
          marker: marker,
          vehicle: vehicle,
        };
      });
    },

    displayParkingZones(zones) {
      // Filter parking zones only
      const parkingZones = zones.filter(zone => zone.geofencingType === 'parking');

      // Add parking zones as polygons
      parkingZones.forEach((zone, index) => {
        const zoneId = `parking-zone-${index}`;

        this.map.addSource(zoneId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: zone.geom.geometry.type,
              coordinates: zone.geom.geometry.coordinates,
            },
          },
        });

        // Add fill layer
        this.map.addLayer({
          id: `${zoneId}-fill`,
          type: 'fill',
          source: zoneId,
          paint: {
            'fill-color': '#8b5cf6',
            'fill-opacity': 0.2,
          },
        });

        // Add outline layer
        this.map.addLayer({
          id: `${zoneId}-outline`,
          type: 'line',
          source: zoneId,
          paint: {
            'line-color': '#8b5cf6',
            'line-width': 2,
            'line-opacity': 0.6,
          },
        });

        // Add popup on click
        this.map.on('click', `${zoneId}-fill`, (e) => {
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-size: 12px;"><strong>🅿️ Parking Zone</strong></div>`)
            .addTo(this.map);
        });

        // Change cursor on hover
        this.map.on('mouseenter', `${zoneId}-fill`, () => {
          this.map.getCanvas().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', `${zoneId}-fill`, () => {
          this.map.getCanvas().style.cursor = '';
        });
      });
    },

    handleMapClick(e) {
      const coord = [e.lngLat.lng, e.lngLat.lat];

      if (!this.currentLeg.start) {
        // Set start point
        this.currentLeg.start = coord;
        this.addMarker(coord, '#10b981', 'Start');
      } else if (!this.currentLeg.end) {
        // Set end point and complete the leg
        this.currentLeg.end = coord;
        this.addMarker(coord, '#ef4444', 'End');

        // Add to legs array
        const startTime = Date.now();
        const endTime = startTime + (60 * 60 * 1000); // +1 hour

        this.legs.push({
          startCoord: { lng: this.currentLeg.start[0], lat: this.currentLeg.start[1] },
          startTime: startTime,
          endCoord: { lng: this.currentLeg.end[0], lat: this.currentLeg.end[1] },
          endTime: endTime,
        });

        // Draw line between start and end
        this.drawLine(
          this.currentLeg.start,
          this.currentLeg.end,
          this.legs.length - 1,
        );

        // Reset for next leg
        this.currentLeg = { start: null, end: null };
      }
    },

    addMarker(coord, color, label) {
      const el = document.createElement('div');
      el.style.backgroundColor = color;
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coord)
        .setPopup(new maplibregl.Popup().setText(label))
        .addTo(this.map);

      this.markers.push(marker);
    },

    drawLine(start, end, index) {
      const lineId = `line-${index}`;

      this.map.addSource(lineId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [start, end],
          },
        },
      });

      this.map.addLayer({
        id: lineId,
        type: 'line',
        source: lineId,
        layout: {},
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
        },
      });
    },

    clearAll() {
      // Remove markers
      this.markers.forEach((marker) => marker.remove());
      this.markers = [];

      // Remove lines
      this.legs.forEach((_, index) => {
        const lineId = `line-${index}`;
        if (this.map.getLayer(lineId)) {
          this.map.removeLayer(lineId);
        }
        if (this.map.getSource(lineId)) {
          this.map.removeSource(lineId);
        }
      });

      // Remove path layers if they exist
      this.legs.forEach((leg, legIndex) => {
        if (leg.paths) {
          leg.paths.forEach((_, pathIndex) => {
            const pathId = `path-${legIndex}-${pathIndex}`;
            if (this.map.getLayer(pathId)) {
              this.map.removeLayer(pathId);
            }
            if (this.map.getSource(pathId)) {
              this.map.removeSource(pathId);
            }
          });
        }
      });

      // Reset state
      this.legs = [];
      this.currentLeg = { start: null, end: null };
      this.error = null;
    },

    async planJourney() {
      if (this.legs.length === 0) {
        this.error = 'Please add at least one journey leg';
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await fetch('/journey-planner/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ legs: this.legs }),
        });

        if (!response.ok) {
          throw new Error('Failed to plan journey');
        }

        const result = await response.json();
        this.displayJourneyResult(result);

        // Get price estimation
        await this.getPriceEstimation(result);
      } catch (err) {
        this.error = 'Error planning journey: ' + err.message;
      } finally {
        this.loading = false;
      }
    },

    async getPriceEstimation(journey) {
      try {
        const response = await fetch('/price-estimation/estimate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ legs: journey.legs }),
        });

        if (!response.ok) {
          throw new Error('Failed to get price estimation');
        }

        const priceData = await response.json();

        // Add price data to legs
        this.legs = journey.legs.map((leg, index) => ({
          ...leg,
          estimatedPrice: priceData.legs[index].estimatedPrice,
          priceBreakdown: priceData.legs[index].priceBreakdown,
        }));

        // Store total price
        this.totalPrice = priceData.estimatedPrice;
      } catch (err) {
        console.error('Error getting price estimation:', err);
      }
    },

    displayJourneyResult(result) {
      // Remove old planning lines (dotted lines between start/end)
      this.legs.forEach((_, index) => {
        const lineId = `line-${index}`;
        if (this.map.getLayer(lineId)) {
          this.map.removeLayer(lineId);
        }
        if (this.map.getSource(lineId)) {
          this.map.removeSource(lineId);
        }
      });

      // Update legs with paths
      this.legs = result.legs;

      // Draw the routed paths on the map
      result.legs.forEach((leg, legIndex) => {
        leg.paths.forEach((path, pathIndex) => {
          this.drawPath(path, legIndex, pathIndex);

          // Add waypoint markers for vehicles and parking
          if (pathIndex === 0 && path.coords.length > 1) {
            // Vehicle location (end of first walk)
            const vehiclePickupCoord = path.coords[1];
            this.addMarker([vehiclePickupCoord.lng, vehiclePickupCoord.lat], '#fbbf24', '🚗 Vehicle');
          }
          if (pathIndex === 1 && path.coords.length > 1) {
            // Parking location (end of drive)
            const parkingCoord = path.coords[1];
            this.addMarker([parkingCoord.lng, parkingCoord.lat], '#8b5cf6', '🅿️ Parking');
          }
        });
      });

      // Update vehicle positions from backend response
      if (result.updatedVehiclePositions) {
        result.updatedVehiclePositions.forEach(({ vehicleId, location }) => {
          if (this.vehicleMarkers[vehicleId]) {
            const { marker } = this.vehicleMarkers[vehicleId];
            marker.setLngLat([location.lng, location.lat]);

            // Update vehicle data
            this.vehicleMarkers[vehicleId].vehicle.locationLongitude = location.lng;
            this.vehicleMarkers[vehicleId].vehicle.locationLatitude = location.lat;
          }
        });
      }

      // Fit map to show all paths
      this.fitMapToPaths(result.legs);
    },

    drawPath(path, legIndex, pathIndex) {
      const pathId = `path-${legIndex}-${pathIndex}`;
      const isWalk = path.mode === 'walk';
      const color = isWalk ? '#10b981' : '#3b82f6';

      // Convert coords objects to [lng, lat] arrays
      const coordinates = path.coords.map(coord => [coord.lng, coord.lat]);

      this.map.addSource(pathId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            mode: path.mode,
            distance: path.distance,
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });

      this.map.addLayer({
        id: pathId,
        type: 'line',
        source: pathId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': isWalk ? 3 : 5,
          'line-dasharray': isWalk ? [2, 2] : [1, 0],
          'line-opacity': 0.8,
        },
      });
    },

    fitMapToPaths(legs) {
      if (!legs || legs.length === 0) return;

      const bounds = new maplibregl.LngLatBounds();

      legs.forEach(leg => {
        if (leg.paths) {
          leg.paths.forEach(path => {
            path.coords.forEach(coord => {
              bounds.extend([coord.lng, coord.lat]);
            });
          });
        }
      });

      this.map.fitBounds(bounds, { padding: 50 });
    },

    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    editLegTime(index) {
      this.editingLegIndex = index;
      const leg = this.legs[index];

      // Convert timestamps to datetime-local format
      if (leg.startTime) {
        this.tempStartTime = new Date(leg.startTime).toISOString().slice(0, 16);
      } else {
        this.tempStartTime = new Date().toISOString().slice(0, 16);
      }

      if (leg.endTime) {
        this.tempEndTime = new Date(leg.endTime).toISOString().slice(0, 16);
      } else {
        const endDate = new Date(leg.startTime || Date.now());
        endDate.setHours(endDate.getHours() + 1);
        this.tempEndTime = endDate.toISOString().slice(0, 16);
      }

      this.showTimeModal = true;
    },

    saveLegTime() {
      if (this.editingLegIndex !== null) {
        const leg = this.legs[this.editingLegIndex];
        leg.startTime = new Date(this.tempStartTime).getTime();
        leg.endTime = new Date(this.tempEndTime).getTime();
        this.showTimeModal = false;
        this.editingLegIndex = null;
      }
    },
  };
}
