import L from 'leaflet'
import tokml from 'tokml'
import 'leaflet-editable'
import 'leaflet-providers'
import 'leaflet-easybutton'
import 'leaflet.browser.print/dist/leaflet.browser.print.min.js'
import 'leaflet/dist/leaflet.css'
import 'lib/Leaflet.PolylineMeasure'
import 'lib/Leaflet.PolylineMeasure.css'
import geodesy from 'leaflet-geodesy'
import http from 'lib/httpQueryV2'
import moment from 'moment'

export default {
  data() {
    return {
      editorButtons: [],
    }
  },
  methods: {
    initMap() {
      this.isEditable = false
      this.drawMap();
      this.drawDetails();
      if (this.$route.params.id === undefined) this.revealLastCoordinatesOfCars()
    },
    drawMap() {
      if (this.map) this.map.remove();
      this._addLayers();
      this._addScale();
      this._addRuler();
      this._addPrinter();
      this._addFieldBoundariesEditor();
    },
    _addLayers() {
      let attribution = 'AgroStream';
      let osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: attribution});
      let satellite = L.tileLayer.provider('Esri.WorldImagery', {attribution: attribution});
      let baseLayers = { "Спутник": satellite, "OpenStreetMaps": osm};
      this.map = L.map('map', {editable: true, layers: [osm]}).setView([53.2858, 69.4466], 12);
      L.control.layers(baseLayers).addTo(this.map);
    },
    _addScale() {
      L.control.scale({maxWidth:240, metric:true, imperial:false, position: 'bottomleft'}).addTo(this.map);
    },
    _addRuler() {
      L.control.polylineMeasure({position:'topright', unit:'metres', clearMeasurementsOnStop: true}).addTo(this.map);
    },
    _addPrinter() {
      L.browserPrint({
        title: "Печать", position: "topright",
        printModesNames: { Portrait: "Портрет", Landscape: "Альбом", Auto:"Авто", Custom:"Выборочно" },
        printModes: ["Auto", "Custom"],
      }).addTo(this.map)
    },
    _addFieldBoundariesEditor() {
      L.easyButton({
        id: 'el-icon-edit', position: 'topright', type: 'replace', leafletClasses: true,
        states:[{stateName: 'edit', onClick: this.changeEditable, title: 'редактировать', icon: 'el-icon-edit'}]
      }).addTo(this.map);
      let saveBtn = L.easyButton({
        id: 'el-icon-check', position: 'topright', type: 'replace', leafletClasses: true,
        states:[{stateName: 'save', onClick: this.saveEdits, title: 'сохранить', icon: 'el-icon-check'}]
      }).addTo(this.map).disable();
      this.editorButtons.push(saveBtn)
      let cancelBtn = L.easyButton({
        id: 'el-icon-close', position: 'topright', type: 'replace', leafletClasses: true,
        states:[{stateName: 'cancel', onClick: this.cancelEdits, title: 'отменить', icon: 'el-icon-close'}]
      }).addTo(this.map).disable();
      this.editorButtons.push(cancelBtn)
    },
    drawDetails() {
      this.removeCars();
      this.drawFields();
      this.drawTracks();
    },
    revealLastCoordinatesOfCars() {
      if (this.carCoordinates.length) {
        let carIcon = L.icon({
            iconUrl: require('assets/tractor_small.png'),
            iconSize:     [32, 32],
            iconAnchor:   [15, 25],
            popupAnchor:  [0, -16],
        });
        this.carCoordinates.forEach(c => {
          let ll = L.latLng(c.point.latitude, c.point.longitude)
          this.cars[c.carId] = {}
          this.cars[c.carId].car = L.marker(ll, {icon: carIcon})
            .addTo(this.map).bindPopup('#' + c.carId + ' ' + c.name).openPopup();
        });
        this.map.fitBounds(this.fields.getBounds());
      }
    },
    changeEditable() {
      this.isEditable = !this.isEditable;
      if (this.isEditable) {
        this.editorButtons.forEach(b => b.enable())
        this.highlightedPolygons.forEach(polygon => {
          polygon.enableEdit();
          polygon.on('click', function (e) {
            if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) {
              this.editor.newHole(e.latlng);
            }
          })
        })
      } else {
        this.editorButtons.forEach(b => b.disable())
        this.highlightedPolygons.forEach(polygon => {
          polygon.disableEdit();
          polygon.off()
        })
      }
    },
    cancelEdits() {
      this.initMap()
    },
    saveEdits() {
      this.highlightedPolygons.forEach(polygon => {
        let kmlData = {
          fieldId: polygon.fieldId,
          kml: tokml(polygon.toGeoJSON())
        };
        http.post('kml', kmlData)
      });
      this.isEditable = false;
    },
  }
}
