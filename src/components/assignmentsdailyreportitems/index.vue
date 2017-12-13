<template lang="pug">
.daily-page(v-loading="loadingDaily", element-loading-text="Загружается...")
  update
  el-form(
    :model="item",
    :inline="true",
    ref="form",
    :label-position="'top'"
  )
    el-form-item(label="Дата")
      el-date-picker(v-model="item.selectedDate", format="dd.MM.yyyy", placeholder="Выберите дату")
    el-form-item(label="." :class="{invisibleColor: true}")
      el-button.excel(type='default', @click="exportTable('form')") .

  h2(class="tableHeading") Ежедневный отчет по полевым работам

  el-table(
    v-if="tableData.length",
    :data="paginate(tableData)",
    border,
    resizable,
    )
    el-table-column(
      prop="fieldNewName",
      label="Поле",
      header-align="center",
      width="110"
    )
    el-table-column(
      prop="cultureName",
      label="Культура",
      header-align="center",
      width="180"
    )
    el-table-column(
      prop="subOperationName",
      label="Вид работ",
      header-align="center",
      width="110"
    )
    el-table-column(
      prop="employeeFullName",
      label="ФИО",
      header-align="center",
      width="170"
    )
    el-table-column(
      prop="carDisplayString",
      label="Марка техники",
      header-align="center",
      width="120"
    )
    el-table-column(
      prop="instrumentName",
      label="Марка агрегата",
      header-align="center",
      width="120"
    )
    el-table-column(
      prop="instrumentWidth",
      label="Ширина захвата",
      header-align="center",
      width="120"
    )
    el-table-column(
      prop="dateTimeRangeStart",
      label="Начало",
      header-align="center",
      width="120"
    )
    el-table-column(
      prop="dateTimeRangeEnd",
      label="Конец",
      header-align="center",
      width="120"
    )
    el-table-column(
      prop="area",
      label="Выработка, га",
      header-align="center",
      width="120"
    )
    el-table-column(
      label="Выработка по данным учетчика, га",
      header-align="center",
      width="120",
    )
      template(slot-scope="scope")
        div(v-if="scope.row.isViolated" class="violated")
          .violated-num {{ scope.row.areaByCounter }}
        div(v-else) {{ scope.row.areaByCounter }}

    el-table-column(
      prop="distanceInField",
      label="Пробег по полю, км",
      header-align="center",
      width="120"
    )
    el-table-column(
      prop="avgSpeed",
      label="Средняя скорость по полю, км/ч",
      header-align="center",
      width="120"
    )
    el-table-column(
      label="Операции",
      fixed="right",
      header-align="center",
      align="center",
      width="120"
    )
      template(slot-scope="scope")
        el-button(@click="update(scope.row.id)" size="small" icon="edit")

  .no-results(v-else) Нет результатов
  el-row(type="flex")
    el-col(:span="0")
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
  import { EventBus } from 'services/EventBus';
  import RecordsLoaderV2 from 'mixins/RecordsLoaderV2';
  import ListController from 'mixins/ListController'

  import update from './update.vue';

  import moment from 'moment'

  export default {
    components: {
      update
    },
    mixins: [
      RecordsLoaderV2,
      ListController
    ],
    data() {
      return {
        item: {
          selectedDate: Date.now()
        },
        perPage: 5,
        currentPage: 1,
        assignmentsdailyreportitems: [],
        loadingDaily: true,
      }
    },
    computed: {
      totalItems: function() {
        return this.tableData.length;
      },
      tableData: function() {
        let selectDate = this.item.selectedDate || Date.now()
        selectDate = moment(selectDate).format('L');
        //if (this.assignmentsdailyreportitems.length) this.loadingDaily = false
        let tableData = this.assignmentsdailyreportitems.filter(function(record) {
          let ourDate = new Date(record.dateTimeRangeStart)
          ourDate = moment(ourDate).format('L');
          let isDate = (ourDate == selectDate)
          return isDate
        })
        //if (this.assignmentsdailyreportitems.length) this.loadingDaily = false
        return tableData
      },
    },
    created() {
      EventBus.$on('AssignmentsDailyReportItems.UpdateComponent.PutObjectCompleted', () => {
        this.refresh()
      });
      EventBus.$on('AppYearChanged', (year) => {
        this.item.selectedDate = new Date(new Date(this.item.selectedDate).setFullYear(year));
      });
      this.fetchEntities([
        'assignmentsdailyreportitems',
        'warehouses',
        'cultures',
      ], this.afterFetch );
    },
    methods: {
      afterFetch() {
        this.assignmentsdailyreportitems = this.fromVuex('assignmentsdailyreportitems')
        this.loadingDaily = false
      },
      violationClass(cond) {
        if (cond)
          return 'violated';
        else
          return '';
      },
      update(id) {
        EventBus.$emit('AssignmentsDailyReportItems.InitUpdate', id);
      },
      load() {
        this.fetchEntities([
          'assignmentsdailyreportitems',
        ]);
        this.loadingDaily = false
      },
      refresh() {
        this.loadingDaily = true
        this.load();
      },
      exportTable(name) {
        this.$refs[name].validate((valid) => {
          if (valid) {
            let endpoint        = "AssignmentsDailyReport";
            let filename        = "Ежедневный отчет по полевым работам";

            let body = {
              Date: this.item.selectedDate,
              OrganizationId: this.$root.context.organization,
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

<style scoped>
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

  .daily-page td{
    position: relative;
  }

  .violated{
    position: absolute;

    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    background: rgba(255,0,0,0.8);

    display: flex;
    align-items: center;
  }
  .violated-num{
    padding: 0 18px;
    color: #fff;
  }

</style>
