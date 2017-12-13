import L from 'leaflet';

export default {
  computed: {
    selectedFields() {
      return this.$store.getters.getSelectedFields;
    },
  },
  methods: {
    drawFields() {
      this.map.removeLayer(this.fields);
      this.fields = new L.FeatureGroup();
      let polygons = [];
      this.highlightedPolygons = [];
      if (this.leafletFields && this.leafletFields.length) {
        this.leafletFields.forEach(field => {
          let latLng = JSON.parse(field.kml);
          let polygon = L.polygon(latLng, {color: 'black', weight: 1, fillOpacity: 0.3});
          polygon.label = field.fieldName;
          polygon.fieldId = field.fieldId;
          polygon.on('mouseover', function () {this.setStyle({color: 'orange'})})
          polygon.on('mouseout', function () {this.setStyle({color: 'black'})})
          if (this.selectedFields && this.selectedFields.length && this.selectedFields.includes(field.fieldId)) {
            polygon.setStyle({color: 'black', weight: 1, fillOpacity: 0.3});
            polygon.bindTooltip(polygon.label, {className: 'field-tooltip', permanent: false, direction: "center"})
            this.map.addLayer(polygon);
            this.highlightedPolygons.push(polygon);
          } else {
            polygons.push(polygon);
            this.fields.addLayer(polygon);
          }
        });
        this.map.addLayer(this.fields);

        if (polygons.length) {
          this.map.fitBounds(this.fields.getBounds());
          this.fields.eachLayer(polygon => {
            polygon.bindTooltip(polygon.label, {
              className: 'field-tooltip',
              permanent: false,
              direction: "center"
            })
          })
        }
      }
    }
  }
}
