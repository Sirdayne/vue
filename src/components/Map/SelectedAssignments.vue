<template lang="pug">
div
  viewer(
    :options="options",
    :images="[img]",
    @inited="inited",
    class="viewer",
    ref="viewer",
    v-show="false",
  )
    template(slot-scope="scope")
      img(v-for="src in scope.images", :src="src", :key="src")
  el-dialog(
    :visible.sync="dialogVisible",
    :before-close="handleClose",
    title="Просев",
    size="tiny",
  )
    template(v-if="img")
      .content
        el-button.center(type="info", size="small", @click="show()") #[i.el-icon-picture] Показать
    template(v-else-if="img === ''") Нет данных
    template(v-else="img")
      .content(v-if="refresh")
        el-button.center(type="info", size="small", @click="recallShowImg()") Повторить
      .content(v-else, v-loading="true")
  el-table(
    :data="filteredAssignments",
    border,
    resizable,
  )
    el-table-column(prop="id", label="№", width="90")
    el-table-column(prop="formattedDateTime", label="Дата", width="110", :filters="dateFilter", :filter-method="filterByDate", filter-placement="bottom-end")
    el-table-column(prop="subOperationName", label="Работа", :filters="workFilter", :filter-method="filterByWork", filter-placement="bottom-end")
    el-table-column(prop="fieldNewName", label="Поле")
    el-table-column(prop="carDisplayString", label="Машина")
    el-table-column(prop="employeeFullName", label="Водитель")
    el-table-column(prop="area", label="Выработка, га")
    el-table-column(fixed="right", label="Трек", header-align="center", align="center", width="180")
      template(slot-scope="scope")
        template(v-if="scope.row.distance === 0 || hasNoCoordinates.includes(scope.row.id)")
          el-button(type="warning", size="small") Нет данных
        template(v-else-if="selectedAssignments.includes(scope.row.id)")
          el-button-group
            el-button(type="danger", size="small", @click="updateSelectedAssignments(scope.row)") Скрыть
            el-button(type="primary", size="small", @click="showImg(scope.row.id)") #[i.el-icon-picture]
        template(v-else-if="!selectedAssignments.includes(scope.row.id)")
          el-button(type="primary", size="small", @click="selectAssignment(scope.row)") Показать
</template>

<script>
import {EventBus} from 'services/EventBus';
import http from 'lib/httpQueryV2';
import nprogress from 'lib/NProgress';
import Viewer from "v-viewer/src/component.vue"

export default {
  props: ['filteredAssignments', 'assignment'],
  components: {
    Viewer,
  },
  data() {
    return {
      hasNoCoordinates: [],
      dialogVisible: false,
      img: null,
      options: {
        "inline": false,
        "button": true,
        "navbar": false,
        "title": true,
        "toobar": false,
        "tooltip": false,
        "movable": true,
        "zoomable": true,
        "rotatable": true,
        "scalable": true,
        "transition": true,
        "fullscreen": true,
        "keyboard": true,
        "url": "data-source"
      },
      window: window,
      refresh: false,
    }
  },
  computed: {
    selectedAssignments() {
      return this.$store.getters.getSelectedAssignments;
    },
    workFilter() {
      return this.filteredAssignments.map(a => {
        return {
          text: a.subOperationName,
          value: a.subOperationName,
        }
      }).filter((w, i, arr) => {
        return arr.map(a => a.text).indexOf(w.text) === i
      })
    },
    dateFilter() {
      return this.filteredAssignments.map(a => {
        return {
          text: a.formattedDateTime,
          value: a.formattedDateTime,
        }
      }).filter((w, i, arr) => {
        return arr.map(a => a.text).indexOf(w.text) === i
      })
    },
  },
  created() {
    EventBus.$on('MapController.SelectedAssignmentLoadingEmptyResultReturned', (id) => {
      this.hasNoCoordinates.push(id);
    });
    if (this.assignment) this.selectAssignment(this.assignment)
  },
  methods: {
    filterByWork(value, row) {
      return row.subOperationName === value;
    },
    filterByDate(value, row) {
      return row.formattedDateTime === value;
    },
    selectAssignment(assignment) {
      nprogress.start()
      let id = assignment.id
      this.$store.dispatch('actionGetTrackForAssignment', {orgId: this.$root.context.organization, id: id})
        .then((data) => {
          nprogress.done()
          this.$store.dispatch('actionHandleSuccessfulFetch', {
            data: data,
            assignment: assignment
          });
        })
        .catch((error) => {
          nprogress.done()
          this.$message({
            message: "Повторите запрос",
            type: "info",
            duration: 5000,
            showClose: false,
          });
        })
    },
    updateSelectedAssignments(assignment) {
      let id = assignment.id
      let fieldId = assignment.fieldId
      for (let i in this.selectedAssignments) {
        let a = this.selectedAssignments[i];
        if (a === id) {
          this.$store.dispatch('actionUnselectAssignment', id);
          this.$store.dispatch('actionUnselectField', fieldId);
        }
      }
    },
    showImg(id) {
      nprogress.start()
      this.dialogVisible = true
      this.img = null
      this.refresh = false
      this.recallShowImg = () => this.showImg(id)
      http.get('trackImage/' + id)
        .then(data => {
          nprogress.done()
          if (data) {
            this.img = 'data:image/jpg;base64,' + data
          } else {
            this.img = ""
          }
        })
        .catch((error) => {
          nprogress.done()
          this.refresh = true
          this.$message({
            message: "Повторите запрос",
            type: "info",
            duration: 5000,
            showClose: false,
          });
        })
    },
    handleClose(done) {
      done();
    },
    inited(viewer) {
      this.$viewer = viewer
    },
    show() {
      this.$viewer.show()
    }
  }
}
</script>

<style lang="stylus" scoped>
.content
  height 150px
  width inherit
  position relative
.center
  position absolute
  left calc(50% - 39.29px)
  top calc(50% - 14px)
  z-index 1000
</style>
