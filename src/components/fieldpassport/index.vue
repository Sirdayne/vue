<template lang="pug">
div(v-loading="loading", element-loading-text="Загружается...")
  el-form(
    :inline="true",
    label-position="left"
  )

  h2 Поле

  .fx-table-big(v-if="field")
    .fx-table
      .fx-row.fx-light-grey(style="font-weight: bold;")
        .fx-cell Номер поля
        .fx-cell Площадь
        .fx-cell Бал бонитет
      .fx-row
        .fx-cell {{ field.newName }}
        .fx-cell {{ field.area }}
        .fx-cell {{ field.bonitetScore }}

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
        form: {
          field: null,
        },
        loading: true,
      }
    },
    computed: {
      fields() {
        return this.fromVuex('fields')
      },
      field() {
        return this.fields.find(f => f.id === this.$root.context.field)
      }

    },
    created() {
      //this.fetchEntities([], this.afterFetch());
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
