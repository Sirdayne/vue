<template lang="pug">
div(v-loading="loading", element-loading-text="Загружается...")
  el-form(
    :inline="true",
    label-position="left"
  )

  h2 Журнал заметок

  el-table(
    v-if="notes"
    :data="paginate(notes)",
    border,
    resizable,
    v-loading="loading",
    element-loading-text="Загружается...",
  )
    el-table-column(label="Текст", prop="text", header-align="center")
    el-table-column(label="Отвественный", prop="responsible", header-align="center")
    el-table-column(label="Сорняки", prop="weeds", header-align="center")
    el-table-column(label="Болезнь", prop="illness", header-align="center")
    el-table-column(label="Насекомые", prop="insects", header-align="center")
  .no-results(v-else) Нет результатов
  el-pagination(
    v-if="notes",
    layout="total, prev, pager, next",
    :total="notes.length",
    :page-size="perPage",
    :current-page="currentPage",
    @current-change="onCurrentPageChange",
    @size-change="onPerPageChange"
  )


</template>

<script>
  import http from 'lib/httpQueryV2'
  import { EventBus } from 'services/EventBus'
  import RecordsLoaderV2 from 'mixins/RecordsLoaderV2'
  import moment from 'moment'
  import ListController from 'mixins/ListController'

  export default {
    mixins: [
      RecordsLoaderV2,
      ListController
    ],
    data() {
      return {
        notes: [
          {
            text: 'Статичный текст',
            responsible: 'ФИО',
            weeds: '-',
            illness: '-',
            insects: '-'
          },
        ],
        perPage: 5,
        currentPage: 1,
        loading: true,
      }
    },
    computed: {

    },
    created() {
//      this.fetchEntities([
//        'cultures'
//      ], this.afterFetch());
      this.loading = false
    },
    methods: {
//      afterFetch(){
//        this.loading = false
//      },
      load() {
        this.fetchEntities([
          'fields',
        ]);
      },
      refresh() {
        this.loading = true
        this.load();
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
