<template lang="pug">
div
  el-form(
    label-width="120px",
    :model="filterValues",
    ref="formStep1Container",
    :inline="true",
    label-position="top"
  )
    el-form-item(label="Дата от")
      el-date-picker(
        v-model="filterValues.startDate",
        format="dd.MM.yyyy",
        placeholder="Выберите дату",
        )
    el-form-item(label="Дата до")
      el-date-picker(
        v-model="filterValues.endDate",
        format="dd.MM.yyyy",
        placeholder="Выберите дату")
  h2 Список заданий
    span(:style="{marginRight: '30px'}")
    el-button.filter(
      @click="filterUnfolded = true",
      type="default",
    ) .
    el-button(type="default", @click="exportAssignments()") План задания
    el-select(v-model="printFormId", :style="{marginLeft: '5px'}", placeholder="Выбрать форму")
      el-option(v-for="p in printForms", :label="p.name", :value="p.id", :key="p.id")
  el-dialog(title="Фильтр", v-model="filterUnfolded", size="tiny")
    el-form(:model="filterModel", label-width="120px")
      el-form-item( label="Поле")
        el-select(v-model="filterValues.fieldIds", filterable, multiple)
          el-option(
            v-for="f in fields",
            :label="f.displayString",
            :value="f.id",
            :key="f.id",
            )
      el-form-item( label="Работа")
        el-select(v-model="filterValues.workIds", filterable, multiple)
          el-option(
          v-for="w in works",
          :label="w.name",
          :value="w.id",
          :key="w.id",
          )
      el-form-item( label="Водитель")
        el-select(v-model="filterValues.employeeIds", filterable, multiple)
          el-option(
            v-for="e in employees",
            :label="e.fullName",
            :value="e.id",
            :key="e.id",
          )
      el-form-item( label="Машина" )
        el-select(v-model="filterValues.carIds", filterable, multiple)
          el-option(
            v-for="c in cars",
            :label="c.displayString",
            :value="c.id",
            :key="c.id",
          )
      el-form-item( label="Орудие" )
        el-select(v-model="filterValues.instrumentIds", filterable, multiple)
          el-option(
            v-for="i in instruments",
            :label="i.displayString",
            :value="i.id",
            :key="i.id",
          )
      el-form-item
        el-button(@click="resetFilter") Сбросить

  .el-table-cont
    el-table(
      v-if="true",
      :data="paginate(search(filteredAssignments))",
      resizable,
      border,
      v-loading="loading",
      element-loading-text="Загружается...",
    )
      el-table-column(
        prop="formattedDateTime",
        label="Дата"
      )
      el-table-column(
        prop="fieldNewName",
        label="Поле"
      )
      el-table-column(
        prop="subOperationName",
        label="Работа"
      )
      el-table-column(
        prop="employeeFullName",
        label="Работник"
      )
      el-table-column(
        prop="carDisplayString",
        label="Машина"
      )
      el-table-column(
        prop="instrumentName",
        label="Орудие"
      )
      el-table-column(
        prop="area",
        label="Площадь"
      )
      el-table-column(
        prop="planArea",
        label="Норма выработки"
      )
      el-table-column(
        prop="avgSpeed",
        label="Средняя скорость"
      )
      el-table-column(
        prop="distanceOutsideField",
        label="Км вне поля"
      )
      el-table-column(type="expand")
        template(slot-scope="props")
          p Дата {{ props.row.formattedDateTime }}
          p Время начала {{ getTimeFromDate(props.row.dateTimeRangeStart) }}
          p Время завершения {{ getTimeFromDate(props.row.dateTimeRangeEnd) }}
          p Мин. скорость {{props.row.minSpeed}}
          p Макс. скорость {{props.row.maxSpeed}}
          p Остановки {{props.row.stopMinutes}}
          el-button(@click="$router.push(`/map/${props.row.id}`)", type="primary") Показать трек
    .no-results(v-else) Нет результатов
    el-pagination(
      layout="total, prev, pager, next",
      :total="filteredAssignments.length",
      :page-size="perPage",
      :current-page="currentPage",
      @current-change="onCurrentPageChange",
      @size-change="onPerPageChange"
    )
</template>

<script>
import http from 'lib/httpQueryV2'
import ListController from 'mixins/ListController'
import RecordsLoaderV2 from 'mixins/RecordsLoaderV2'
import moment from 'moment'

import modifiedByName from 'lib/modifiedByName'

import {
  EventBus
} from 'services/EventBus';

export default {
  mixins: [
    RecordsLoaderV2,
    ListController
  ],
  data() {
    return {
      perPage: 5,
      onlyRemote: false,
      filterValues: {
        startDate: new Date(new Date(new Date()
            .getTime() - (10 * 24 * 60 * 60 * 1000))
          .setFullYear(this.$root.context.year)),
        endDate: new Date(new Date(Date.now())
          .setFullYear(this.$root.context.year)),
        employeeIds: [],
        fieldIds: [],
        workIds: [],
        carIds: [],
        instrumentIds: []
      },
      isTrackFetching: [],
      printFormId: null,
      printForms: [{
          id: 1,
          name: 'Посев',
        },
        {
          id: 2,
          name: 'Посев с внесением удобрений',
        },
        {
          id: 4,
          name: 'Химические',
        },
        {
          id: 3,
          name: 'Прочие',
        },
      ],
      loading: true
    }
  },
  watch: {
    paginatedFilteredAssignments() {
      modifiedByName.addTooltips(this.paginatedFilteredAssignments);
    }
  },
  computed: {
    assignments() {
      return this.fromVuex('assignments')
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
    },
    works() {
      return this.fromVuex('works')
    },
    employees() {
      return this.fromVuex('employees')
    },
    cars() {
      return this.fromVuex('cars')
    },
    fields() {
      return this.fromVuex('fields')
    },
    instruments() {
      return this.fromVuex('instruments')
    },
    paginatedFilteredAssignments() {
      return this.paginate(this.filteredAssignments);
    },
    filteredAssignments() {
      if (this.assignments.length) this.loading = true
      let assignments = this.updated && this.assignments.filter(assignment => {
          let condition = (this.filterValues.employeeIds.length === 0 || this.filterValues.employeeIds.includes(assignment.employeeId)) &&
            (this.filterValues.fieldIds.length === 0 || this.filterValues.fieldIds.includes(assignment.fieldId)) &&
            (this.filterValues.workIds.length === 0 || this.filterValues.workIds.includes(assignment.subOperationId)) &&
            (this.filterValues.carIds.length === 0 || this.filterValues.carIds.includes(assignment.carId)) &&
            (this.filterValues.instrumentIds.length === 0 || this.filterValues.instrumentIds.includes(assignment.instrumentId)) &&
            (!this.filterValues.startDate || this.filterValues.startDate.setHours(0, 0, 0, 0) <= Date.parse(assignment.dateTimeRange.start)) &&
            (!this.filterValues.endDate || this.filterValues.endDate.setHours(23, 59, 59, 59) >= Date.parse(assignment.dateTimeRange.start))
          if (condition) {
            assignment.formattedDateTime = moment(assignment.dateTimeRange.start, "YYYY-MM-DDTHH:mm:ss").format("DD.MM.YYYY");
            return assignment;
          }
        })
        .sort((a, b) => new Date(b.dateTimeRange.start) - new Date(a.dateTimeRange.start));
      if (this.assignments.length) this.loading = false
      return assignments
    },
  },
  created() {
    this.fetchEntities(['assignments', 'works', 'employees', 'cars', 'fields', 'instruments'], this.onLoad);

    EventBus.$on('AppYearChanged', (year) => {
      this.filterValues.startDate = new Date(this.filterValues.startDate.setFullYear(year));
      this.filterValues.endDate = new Date(this.filterValues.endDate.setFullYear(year));
    });
  },
  methods: {
    exportAssignments() {
      let endpoint = 'AssignmentSowingForm';
      let body = {
        organizationId: this.$root.context.organization,
        date: {
          start: moment(this.filterValues.startDate).format("YYYY-MM-DDTHH:mm:ss"),
          end: moment(this.filterValues.endDate).format("YYYY-MM-DDTHH:mm:ss")
        },
        PrintForm: this.printFormId,
      };
      let startDate = moment(this.filterValues.startDate).format("DD.MM.YYYY")
      let endDate = moment(this.filterValues.endDate).format("DD.MM.YYYY")
      let filename = 'Список заданий на период ' + startDate + '-' + endDate;

      http.downloadPDF(endpoint, body, filename);
    },
    getTimeFromDate(date) {
      if (!date || date.length <= 10) {
        return null;
      } else {
        let time = date.split('T')[1].split(':');
        return time[0] + ':' + time[1];
      }
    },
    onLoad() {
      Date.prototype.mmddyyyy = function () {
        var mm = this.getMonth() + 1; // getMonth() is zero-based
        var dd = this.getDate();

        return [(mm > 9 ? '' : '0') + mm,
          (dd > 9 ? '' : '0') + dd,
          this.getFullYear()
        ].join('.');
      }
      Date.prototype.hhmm = function () {
        var hh = this.getHours();
        var mm = this.getMinutes();

        return [(hh > 9 ? '' : '0') + hh,
          (mm > 9 ? '' : '0') + mm
        ].join(':');
      }
    }
  },
}
</script>
