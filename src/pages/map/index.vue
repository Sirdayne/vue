<template lang="pug">
.cols(
  v-loading="!ready",
  element-loading-text="Загружается...",
  )
  .sidebar(v-if="ready", v-show="sidebarToggleState")
    .search-bar
      el-input(
        placeholder="Поиск",
        icon="search",
        v-model="searchText",
      )
    map-filter(:searchText="searchText", @apply="applyFilter")
    .status
      car-status
  .workspace(v-if="ready")
    .map-controller
      map-controller(:polylines="filteredTracks", :date="date", :filteredAssignments="filteredAssignments")
    .tabs(v-if="tabData")
      tab-builder(:data="tabData", :type="tabType")
</template>

<script>
import { EventBus } from "services/EventBus";
import RecordsLoaderV2 from "mixins/RecordsLoaderV2";
import CarStatus from "components/Map/CarStatus.vue";
import MapFilter from "components/Map/MapFilter.vue";
import MapController from "components/Map/MapController";
import TabBuilder from "components/Map/tab-builder.vue";
import moment from "moment";

export default {
  mixins: [RecordsLoaderV2],
  components: {
    MapFilter,
    CarStatus,
    MapController,
    TabBuilder
  },
  data() {
    return {
      searchText: "",
      filteredTracks: [],
      date: null,
      assignment: null,
      assignments: null,
      filteredAssignments: null,
      tabData: null,
      tabType: null,
    };
  },
  created() {
    EventBus.$on("MapController.SelectedAssignmentLoadingFinished", tracks => {
      this.filteredTracks = tracks;
    });
    this.fetchEntities([
      "assignments"
    ], this.afterFetch);
  },
  computed: {
    sidebarToggleState() {
      return this.$store.getters.getSidebarToggleState;
    }
  },
  methods: {
    afterFetch() {
      this.assignments = this.fromVuex("assignments");
      if (this.$route.params.id !== undefined) {
        let id = this.$route.params.id;
        let assignment = this.$store.getters.getEntityById(id, "assignments");
        let dateTime = assignment.dateTimeRange.start.toString().split("T");
        this.date = dateTime[0];
        this.assignment = assignment;
      }
    },
    applyFilter(f) {
      this.filterAssignments(f)
      this.prepareTabData(f)
    },
    prepareTabData(f) {
      this.tabData = null
      this.tabType = "car"
      this.tabData = {
        SelectedAssignments: {
          filteredAssignments: this.filteredAssignments,
          assignment: this.assignment,
        }
      }
    },
    filterAssignments(f) {
      let assignments = this.assignments ? this.assignments : [];
      if (assignments.length) {
        let attrIds = ["employeeIds", "fieldIds", "carIds", "instrumentIds"]
        let attrId = ["employeeId", "fieldId", "carId", "instrumentId"]
        assignments = assignments.map(a => {
          a.formattedDateTime = moment(a.dateTimeRangeStart, "YYYY-MM-DDTHH:mm:ss").format("DD.MM.YYYY");
          a.area = Math.round(+a.area);
          return a;
        }).filter(a => {
          let cond1 = f.employeeIds.length === 1 && !f.fieldIds.length && !f.carIds.length
          let cond2 = f.fieldIds.length === 1 && !f.employeeIds.length && !f.carIds.length
          let cond3_1 = attrIds.every((id, i) => !f[id].length || f[id].includes(a[attrId[i]]))
          let cond3_2 = !f.startDate || new Date(f.startDate).getTime() <= new Date(a.dateTimeRange.start)
          let cond3_3 = !f.endDate || new Date(f.endDate).getTime() >= new Date(a.dateTimeRange.end)
          let cond3 = cond3_1 && cond3_2 && cond3_3
          if (cond1) {
            return f.employeeIds.includes(a.employeeId);
          } else if (cond2) {
            return f.fieldIds.includes(a.fieldId);
          } else if (cond3) {
            return true;
          }
        });
      }
      this.filteredAssignments = assignments
    },
  }
};
</script>

<style lang="stylus" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #e4e8f1;
}

.search-bar {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
}

.status {
  padding: 10px;
  height: 35%;
  box-sizing: border-box;
  overflow-y: auto;
  border-top: 1px solid #e4e8f1;
}

.workspace {
  padding: 0;
}

.map-controller {
  height: 65%;
  width: 100%;
  box-sizing: border-box;
}

.tabs {
  overflow-y: auto;
  border-top: 1px solid #e4e8f1;
  height: 35%;
  width: 100%;
  box-sizing: border-box;
}
</style>
