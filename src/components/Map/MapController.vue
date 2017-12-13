<template lang="pug">
#module
  #map(:style="{opacity: 0.5}")
    .content(v-if="!ready", v-loading="!ready")
    .content(v-if="refresh")
      el-button.refresh(type="info", size="small", @click="getLeafletFields()") Повторить
    #date-selector
      el-date-picker(
        v-model="selectedDate",
        format="dd.MM.yyyy"
      )
</template>
<script>
import L from 'leaflet'
import moment from 'moment';
import randomcolor from 'randomcolor'
import {EventBus} from 'services/EventBus';
import RecordsLoaderV2 from 'mixins/RecordsLoaderV2';
import MapControllerMixin from './MapControllerMixin';
import CarDrawer from './Drawers/CarDrawer';
import FieldDrawer from './Drawers/FieldDrawer';
import TrackDrawer from './Drawers/TrackDrawer';

export default {
  name: 'Map',
  mixins: [
    RecordsLoaderV2,
    MapControllerMixin,
    CarDrawer,
    FieldDrawer,
    TrackDrawer
  ],
  props: [
    'polylines',
    'date',
    'filteredAssignments',
  ],
  data() {
    return {
      map: null,
      cars: {},
      fields: new L.FeatureGroup(),
      tracks: new L.FeatureGroup(),
      isEditable: false,
      highlightedPolygons: [],
      carCurrentPositions: [],
      refresh: null,
      assignments: null,
      carCoordinates: null,
      leafletFields: null,
      selectedDate: this.date ? this.date : moment().hour(8).minute(0).second(0).subtract(1, 'days').format(),
    }
  },
  created() {
    EventBus.$on('MapController.SelectedDateChanged', () => {
      this.$store.dispatch('actionDestroy')
    });
  },
  mounted: function () {
    this.$nextTick(function () {
      this.getLeafletFields()
    })
  },
  destroyed() {
    if (this.map) this.map.remove()
    this.$store.dispatch('actionDestroy')
    this.$root.yearControl = false;
  },
  computed: {
    filteredAssignmentsLength() {
      return this.filteredAssignments.length
    },
    colors() {
      let n = this.filteredAssignmentsLength
      let colors = []
      let hue = ["orange", "yellow", "green", "blue", "purple", "pink"]
      let hueLength = hue.length
      while (n) {
        let color = randomcolor({hue: hue[n % hueLength]})
        colors.push(color)
        n--
      }
      return colors
    },
  },
  watch: {
    'polylines' (val, oldVal) {
      this.isEditable = false
      this.drawDetails();
    },
    selectedDate(value) {
      EventBus.$emit('MapController.SelectedDateChanged', value);
    },
  },
  methods: {
    getLeafletFields() {
      this.refresh = false
      this.fetchEntities([
        'assignments',
        'carcoordinates',
        'leafletFields',
      ], this.afterFetch);
    },
    afterFetch() {
      this.assignments = this.fromVuex('assignments')
      this.carCoordinates = this.fromVuex('carCoordinates').filter(c => c.carId !== 0);
      this.leafletFields = this.fromVuex('leafletfields')
      if (this.leafletFields && this.leafletFields.length) {
        this.initMap()
      } else {
        this.refresh = true
      }
    },
  }
}
</script>
<style lang="stylus" scoped>
#module
  width 100%
  height 100%
#map
  height inherit
  width inherit
#date-selector
  position absolute
  top 10px
  left calc(50% - 90px)
  z-index 401
.el-date-editor.el-input
  width 180px
.content
  height inherit
  width inherit
  position relative
.refresh
  position absolute
  left calc(50% - 39.29px)
  top calc(50% - 14px)
  z-index 1000
.field-tooltip
   border 0 !important
   -webkit-box-shadow none !important
   -moz-box-shadow none !important
   box-shadow none !important
   background-color transparent  !important
   font-size 10px
.info
  padding 6px 8px
  font 14px/16px Arial, Helvetica, sans-serif
  background white
  background rgba(255,255,255,0.8)
  box-shadow 0 0 15px rgba(0,0,0,0.2)
  border-radius 5px
</style>
