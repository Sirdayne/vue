import L from 'leaflet'
import 'lib/MovingMarker'
import moment, { duration } from 'moment'
import {EventBus} from 'services/EventBus';

export default {
  destroyed() {
    let ids = Object.keys(this.cars)
    ids.forEach(id => {
      this._destroyCars(id)
    })
  },
  computed: {
    selectedAssignmentsIds() {
      return this.$store.getters.getSelectedAssignments;
    },
  },
  methods: {
    removeCars() {
      let ids = Object.keys(this.cars)
      ids.forEach(id => {
        let notRunning = !this._isRunning(id)
        let notInSAIds = !this.selectedAssignmentsIds.includes(+id)
        if (notRunning || notInSAIds) {
          this.map.removeLayer(this.cars[id].car)
          this._destroyCars(id)
        }
      })
      if (!ids.length || !this.selectedAssignmentsIds.length) this.cars = {}
    },
    drawCars(assignment, latLng, speed, time) {
      let notRunning = !this._isRunning(assignment.id)
      if (notRunning) {
        let carIcon = L.icon({
          iconUrl: require('assets/tractor_small.png'),
          iconSize:     [32, 32],
          iconAnchor:   [15, 25],
          popupAnchor:  [0, -16],
        });
        let durations = this._getDurations([], latLng, speed)
        let last = durations.length
        let marker = L.Marker.movingMarker(latLng, durations, {icon: carIcon, autostart: true})
        let id = assignment.id
        this.cars[id] = {}
        this.cars[id].car = marker
        this.cars[id].car.addTo(this.map)
        this.cars[id].interval = setInterval(() => {this._startMsgPopupUpdate(id, speed, time, last)}, 1000)
      }
    },
    _getDurations(durations, latLng, speed) {
      for (var i = 1, n = latLng.length; i < n; i++) {
        let ll0 = L.latLng(latLng[i - 1])
        let ll1 = L.latLng(latLng[i])
        let dist = ll0.distanceTo(ll1)
        let speedUp = 10
        let avgSpeed = Math.abs(speed[i] + speed[i - 1]) / 2 || 0.1
        let duration = dist / (1000 * avgSpeed) * 3600 * 1000 / speedUp
        durations.push(duration)
      }
      return durations
    },
    _isRunning(id) {
      if (this.cars[id] && this.cars[id].car) {
        try {
          return this.cars[id].car.isRunning()
        } catch (e) {
          return false
        }
      }
      return false
    },
    _startMsgPopupUpdate(id, speed, time, last) {
      let i = this.cars[id].car.getCurrentIndex()
      let info = "<b style='color: black'>Задание</b>: №" + id +
      "</br><b style='color: black'>Работал</b>: с " + time[0] + " до " + time[last] +
      "</br><b style='color: black'>Время</b>: " + time[i] +
      "</br><b style='color: black'>Скорость</b>: " + speed[i] + "км/ч"
      this.cars[id].car.bindPopup(info)
      if (i >= last) this._stopMsgPopupUpdate(id)
    },
    _stopMsgPopupUpdate(id) {
      clearInterval(this.cars[id].interval)
      this.cars[id].interval = 0
    },
    _destroyCars(id) {
      clearInterval(this.cars[id].interval)
      this.cars[id].interval = 0
      this.cars[id] = {}
      delete this.cars[id]
    },
  }
}
