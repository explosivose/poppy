function journeyPlanner() {
  return {
    map: null,
    currentLeg: { start: null, end: null },
    legs: [],
    markers: [],
    loading: false,
    error: null,

    initMap() {
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
        this.legs.push({
          startCoord: this.currentLeg.start[1], // latitude
          startTime: Date.now(),
          endCoord: this.currentLeg.end[1], // latitude
          endTime: Date.now() + 1000,
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
      } catch (err) {
        this.error = 'Error planning journey: ' + err.message;
      } finally {
        this.loading = false;
      }
    },

    displayJourneyResult(result) {
      // Update legs with paths
      this.legs = result.legs;

      // Draw the paths on the map
      result.legs.forEach((leg, legIndex) => {
        leg.paths.forEach((path, pathIndex) => {
          this.drawPath(path, legIndex, pathIndex);
        });
      });
    },

    drawPath(path, legIndex, pathIndex) {
      const pathId = `path-${legIndex}-${pathIndex}`;
      const color = path.mode === 'walk' ? '#10b981' : '#3b82f6';

      this.map.addSource(pathId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: path.coords.map((coord) => [coord, coord]),
          },
        },
      });

      this.map.addLayer({
        id: pathId,
        type: 'line',
        source: pathId,
        layout: {},
        paint: {
          'line-color': color,
          'line-width': path.mode === 'walk' ? 2 : 4,
          'line-dasharray': path.mode === 'walk' ? [2, 2] : [1, 0],
        },
      });
    },
  };
}
