<template lang="pug">
div
  el-form(
    :model="item",
    ref="form",
    :inline="true",
    :label-position="'top'"
  )
    el-form-item(label="Дата от:")
      el-date-picker(v-model="item.selectedDate.from", format="dd.MM.yyyy", placeholder="Выберите дату")
    el-form-item(label="Дата до:")
      el-date-picker(v-model="item.selectedDate.till", format="dd.MM.yyyy", placeholder="Выберите дату")
    el-form-item(label="Топ нарушителей:")
      el-select(v-model="item.rowCount" placeholder="Выбрать")
        el-option(
          v-for="count in item.rowCounts"
          :key="count.value"
          :label="count.label"
          :value="count.value"
          )
    el-form-item(label="Время простоя от (минуты):")
      el-input-number(v-model="item.downtimeMinute" :step="1")
  h2(class="tableHeading") Итого простои за день
    span(:style="{marginRight: '30px'}")
    el-button.excel(type='default', @click="exportTable('form')") .
  el-table(
    v-if="tableData.length || loading",
    :data="paginate(tableData)",
    border,
    resizable,
    v-loading="loading",
    element-loading-text="Загружается...",
    height="1",
  ).content
    el-table-column(
      prop="date.startFormated",
      label="Дата",
      header-align="center",
    )
    el-table-column(
      prop="employee",
      label="Водитель",
      header-align="center",
    )
    el-table-column(
      prop="car",
      label="Машина",
      header-align="center",
    )
    el-table-column(
      prop="instrument",
      label="Орудие",
      header-align="center",
    )
    el-table-column(
      prop="field",
      label="Посев",
      header-align="center",
    )
    el-table-column(
      prop="work",
      label="Работа",
      header-align="center",
    )
    el-table-column(
      prop="mileageArea",
      label="Площадь по пробегу",
      header-align="center",
    )
    el-table-column(
      prop="processedSquare",
      label="S обработки",
      header-align="center",
    )
    el-table-column(
      prop="areaPerHour",
      label="Га в час",
      header-align="center",
    )
    el-table-column(
      prop="stopMinutesDisplayString",
      label="Простои",
      header-align="center",
    )
    el-table-column(
      prop="workHourPercentage",
      label="% рабочего времени",
      header-align="center",
    )
    el-table-column(
      prop="avgSpeed",
      label="Эксплуатационная скорость задания",
      header-align="center",
    )
    el-table-column(
      label="Трек",
      fixed="right",
      width="130",
      align="center",
    ): template(slot-scope="scope")
      el-button(@click="$router.push(`/map/${scope.row.id}`)", type="primary", size="small") Показать
  .no-results(v-else) Нет результатов
  el-pagination(
    layout="total, prev, pager, next",
    :total="totalItems",
    :page-size="perPage",
    :current-page="currentPage",
    @current-change="onCurrentPageChange",
    @size-change="onPerPageChange",
  )
</template>

<script>
import http from 'lib/httpQueryV2'
import RecordsLoaderV2 from 'mixins/RecordsLoaderV2'
import ListController from 'mixins/ListController'
import moment from 'moment'
import MapController from 'components/Map/MapController'
import {EventBus} from 'services/EventBus'

export default {
  components: {
    MapController
  },
  mixins: [
    RecordsLoaderV2,
    ListController
  ],
  data() {
    return {
      item: {
        downtimeMinute: 1,
        rowCount: -1,
        rowCounts: [{
            value: -1,
            label: "Все"
          },
          {
            value: 3,
            label: "3"
          },
          {
            value: 7,
            label: "7"
          },
          {
            value: 10,
            label: "10"
          },
        ],
        selectedDate: {
          from: new Date(new Date(new Date()
              .getTime() - (5 * 24 * 60 * 60 * 1000))
            .setFullYear(this.$root.context.year)),
          till: new Date(new Date()
            .setFullYear(this.$root.context.year)),
        }
      },
      perPage: 5,
      currentPage: 1,
      loading: true,
    }
  },
  computed: {
    assignments() {
      return this.fromVuex('assignments')
    },
    downtime() {
      return this.fromVuex('downtime')
        .sort((a, b) => new Date(b.date.start) - new Date(a.date.start))
        .map(sm => {
          sm.date.startFormated = moment(sm.date.start).format("DD.MM.YYYY")
          return sm
        });
    },
    totalItems: function () {
      return this.tableData.length;
    },
    tableData: function () {
      if (this.downtime.length) this.loading = true
      let from = this.item.selectedDate.from || new Date(new Date()
        .getTime() - (5 * 24 * 60 * 60 * 1000))
      let till = this.item.selectedDate.till || Date.now()
      let rowCount = this.item.rowCount
      let downtimeMinute = this.item.downtimeMinute
      let tableData = this.downtime.filter(function (record) {
          let start = new Date(record.date.start)
          let end = new Date(record.date.end)
          let dateRange = (start >= from) && (end <= till)
          let dt = (downtimeMinute <= record.stopMinutes)
          return dateRange && dt
        })
        .map(function (record) {
          let hours = Math.floor(record.stopMinutes / 60)
          let displayHours = hours ? hours + " ч." : ""
          let minutes = (record.stopMinutes % 60)
          let displayMinutes = minutes ? minutes + " мин." : ""
          let time = displayHours ? displayHours + " " + displayMinutes : displayMinutes
          record.stopMinutesDisplayString = time || "0"
          return record
        })
        .sort((a, b) => b.stopMinutes - a.stopMinutes)
      if (rowCount > 0) tableData = tableData.slice(0, rowCount)
      if (this.downtime.length) this.loading = false
      return tableData
    },
  },
  created() {
    this.fetchEntities([
      'assignments',
      'downtime',
    ]);
    EventBus.$on('AppYearChanged', (year) => {
      this.item.selectedDate.from = new Date(new Date(this.item.selectedDate.from)
        .setFullYear(year));
      this.item.selectedDate.till = new Date(new Date(this.item.selectedDate.till)
        .setFullYear(year));
    });
  },
  methods: {
    exportTable(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          let endpoint = "DowntimeForm";
          let filename = "Итого простои за день";

          let body = {
            OrganizationId: this.$root.context.organization,
            Date: {
              start: moment(this.item.selectedDate.from).format("YYYY-MM-DDTHH:mm:ss"),
              end: moment(this.item.selectedDate.till).format("YYYY-MM-DDTHH:mm:ss"),
            },
            DowntimeMinute: this.item.downtimeMinute,
            rowCount: this.item.rowCount,
          };

          http.downloadXLS(endpoint, body, filename);
        } else {
          return false;
        }
      });
    },
  }
}
</script>

<style>
.tableHeading {
  display: inline-block;
  margin-right: 20px;
}

.downloadLzkStyle {
  display: block;
  margin-top: 20px;
}

.downloadFieldSelect {
  width: 250px;
}
</style>
