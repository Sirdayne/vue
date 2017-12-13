import L from 'leaflet';
import moment from 'moment'

export default {
  methods: {
    drawTracks() {
      this.map.removeLayer(this.tracks);
      this.tracks = new L.FeatureGroup();
      let isPolylines = this.polylines && this.polylines.length
      if (isPolylines) {
        this.polylines.forEach((data, i) => {
          let track = JSON.parse(data.track);
          let assignment = this.assignments.find(a => a.id === data.assignmentId);
          let latLng = track.map(l => [l[0], l[1]]);
          let speed = track.map(l => l[2]);
          let time = track.map(l => l[3]);
          let violation = track.map(l => l[4]);
          let inside = track.map(l => l[5]);
          this._addPolylines([], assignment, latLng, speed, time, violation, inside, this.colors[i])
            .forEach(p => this.tracks.addLayer(p))
          this.drawCars(assignment, latLng, speed, time)
        });
        this.map.fitBounds(this.tracks.getBounds());
        this.map.addLayer(this.tracks);
      }
    },
    _addPolylines(polylines, assignment, latLng, speed, time, violation, inside, randomColor) {
      for (let j = 1, n = latLng.length; j < n; j++) {
        let segment = [latLng[j - 1], latLng[j]]
        let outside = !inside[j - 1] || !inside[j]
        let notViolated = !violation[j - 1] || !violation[j]
        let color = (outside || notViolated || this.polylines.length !== 1) ? randomColor : "red"
        let polyline = L.polyline(segment, {color: color, weight: 2, fillOpacity: 0.5})
        let info = "<b style='color: black'>Задание</b>: №" + assignment.id +
        "</br><b style='color: black'>Время</b>: " + time[j - 1] + " - " + time[j] +
        "</br><b style='color: black'>Скорость</b>: " + speed[j - 1] + "км/ч - " + speed[j] + "км/ч"
        polyline.bindPopup(info)
        polylines.push(polyline);
      }
      return polylines
    },
  }
}
