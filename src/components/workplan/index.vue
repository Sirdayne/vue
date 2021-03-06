<template lang="pug">
div
  el-form(
    :model="item",
    :inline="true",
    ref="form",
    :label-position="'top'"
  )
    el-form-item(label="Дата от")
      el-date-picker(v-model="item.selectedDate.from", format="dd.MM.yyyy", placeholder="Выберите дату")
    el-form-item(label="Дата до")
      el-date-picker(v-model="item.selectedDate.till", format="dd.MM.yyyy", placeholder="Выберите дату")
    el-form-item(label="Тип техники", prop="carTypeId")
      el-select(v-model="item.carTypeId" clearable placeholder="Выбрать")
        el-option(
          v-for="c in cartypes",
          :label="c.name",
          :value="c.id",
          :key="c.id",
          )

  h2(class="tableHeading") Календарь работ
    span(:style="{marginRight: '30px'}")
    el-button.excel(type='default', @click="exportTable('form')") .
  el-table(
    v-if="tableData.length || loading",
    :data="tableData",
    border,
    resizable,
    v-loading="loading",
    element-loading-text="Загружается...",
    height="1",
  ).content
    el-table-column(
      prop="name",
      :label="item.carTypeId ? getCarTypeName() : 'Машина'",
      header-align="center",
      fixed="left",
    )
    el-table-column(
      prop="columns.0.data",
      :label="columns[0] + getDayOfWeek(columns[0])",
      header-align="center",
      class-name="no-escape"
    )
    el-table-column(
      prop="columns.1.data",
      :label="columns[1] + getDayOfWeek(columns[1])",
      header-align="center",
      class-name="no-escape"
    )
    el-table-column(
      prop="columns.2.data",
      :label="columns[2] + getDayOfWeek(columns[2])",
      header-align="center",
      class-name="no-escape"
    )
    el-table-column(
      prop="columns.3.data",
      :label="columns[3] + getDayOfWeek(columns[3])",
      header-align="center",
      class-name="no-escape"
    )
    el-table-column(
      prop="columns.4.data",
      :label="columns[4] + getDayOfWeek(columns[4])",
      header-align="center",
      class-name="no-escape"
    )
    el-table-column(
      label="Навигация/операции",
      fixed="right",
      header-align="center",
      align="center",
    )
      template(slot-scope="scope")
        el-button(@click="handleClickPrev" type="text" size="big" icon="arrow-left")
        el-button(@click="handleClickNext" type="text" size="big" icon="arrow-right")
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
import {EventBus} from 'services/EventBus'

export default {
  mixins: [
    RecordsLoaderV2,
    ListController
  ],
  data() {
    return {
      item: {
        carTypeId: null,
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
      currentCol: 0,
      dayOfWeek: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
      loading: true,
    }
  },
  computed: {
    cartypes() {
      let cartypes = this.fromVuex('cartypes')
      if (cartypes && cartypes.length === 1) this.item.carTypeId = cartypes[0].id
      return cartypes
    },
    workplan() {
      return this.fromVuex('workplan')
    },
    totalItems: function () {
      return this.filteredData.length;
    },
    paginatedData: function () {
      return this.paginate(this.filteredData)
    },
    columns: function () {
      let columns = []
      let from = this.item.selectedDate.from || new Date(new Date()
        .getTime() - (5 * 24 * 60 * 60 * 1000))
      let start = new Date(from)
      start.setDate(start.getDate() + this.currentCol * 5)
      for (var i = 0; i < 5; i++) {
        let date = new Date(start);
        columns.push(moment(date).format("DD.MM.YYYY"))
        start.setDate(start.getDate() + 1)
      }
      return columns
    },
    filteredData: function () {
      this.currentCol = 0
      let from = this.item.selectedDate.from || new Date(new Date()
        .getTime() - (5 * 24 * 60 * 60 * 1000))
      let till = this.item.selectedDate.till || Date.now()
      return this.workplan.filter(record => {
          let carType = record.carTypeId === this.item.carTypeId || !this.item.carTypeId
          return carType && record.columns.filter(c => {
            let d = new Date(c.date)
            return (d >= from && d <= till)
          })
        })
        .sort((a, b) => b.columns.length - a.columns.length)
    },
    tableData: function () {
      if (this.paginatedData.length) this.loading = true
      let tableData = this.paginatedData.map(row => {
        return {
          "name": row.name,
          "carTypeId": row.carTypeId,
          "columns": this.columns.map(col => {
            let res = ""
            for (let i = 0, n = row.columns.length; i < n; i++) {
              let colDate = col.slice(3, 6) + col.slice(0, 3) + col.slice(6)
              let d = new Date(row.columns[i].date)
              let d1 = moment(colDate).format("DD.MM.YYYY")
              let d2 = moment(d).format("DD.MM.YYYY")
              if (d1 === d2) {
                res = row.columns[i].data
                break
              }
            }
            return {
              "data": res
            }
          })
        }
      })
      if (this.paginatedData.length) this.loading = false
      return tableData
    },
  },
  created() {
    EventBus.$on('AppYearChanged', (year) => {
      this.item.selectedDate.from = new Date(new Date(this.item.selectedDate.from)
        .setFullYear(year));
      this.item.selectedDate.till = new Date(new Date(this.item.selectedDate.till)
        .setFullYear(year));
    });
    this.fetchEntities([
      'workplan',
      'cartypes'
    ]);
  },
  methods: {
    getDayOfWeek(d) {
      let date = d.substr(3, 3) + d.substr(0, 3) + d.substr(6, 4)
      let number = new Date(date)
        .getDay()
      let dayOfWeek = this.dayOfWeek[number]
      return '\n' + dayOfWeek
    },
    getCarTypeName() {
      return this.cartypes.filter(c => this.item.carTypeId === c.id)[0].name
    },
    handleClickNext() {
      this.currentCol = this.currentCol + 1;
    },
    handleClickPrev() {
      this.currentCol = Math.max(this.currentCol - 1, 0);
    },
    exportTable(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          let endpoint = "WorkPlanForm";
          let filename = "Нарушения скоростного режима";

          let body = {
            OrganizationId: this.$root.context.organization,
            Date: {
              start: moment(this.item.selectedDate.from).format("YYYY-MM-DDTHH:mm:ss"),
              end: moment(this.item.selectedDate.till).format("YYYY-MM-DDTHH:mm:ss"),
            },
            carTypeId: this.item.carTypeId || -1
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
  margin-right: 20px;
}

.no-escape>.cell {
  white-space: pre-line;
}
</style>
