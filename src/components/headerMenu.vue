<template lang="pug">
  el-menu(theme="dark", mode="horizontal", :router="true")
    template(v-for="item in items")
      el-menu-item(:index="item.index", :id="item.id") {{item.label}}

    el-menu-item(index="", v-if="$root.module === 'agroplan'", id="step-help" ) Помощь
    el-menu-item(index="", v-if="$root.module === 'agroplan'", @click="startHelp") ?
    el-menu-item(index="", v-if="$root.module === 'agromap'" ) Помощь

</template>

<script>

import {EventBus} from 'services/EventBus';

import introLib from 'lib/introLib';
import Steps from 'components/help/steps';

  export default {
    data() {
      return {
        list: {
          "assignments": {index: "/assignments", label: "Задания"},
          "catalog": {index: "/catalog", label: "Справочники"},
          "map": {index: "/map", label: "Карта"},
          "monitoring": {index: "/monitoring", label: "Мониторинг"},
          "news": {index: "/news", label: "Новости"},
          "parttime": {index: "/parttime", label: "Подработка"},
          "recipes": {index: "/recipes", label: "Работы"},
          "reports": {index: "/reports", label: "Отчеты"},
          "reportsplan": {index: "/reportsplan", label: "Отчеты"},
          "reportsbz": {index: "/reportsbz", label: "Отчеты"},
          "silageboard": {index: "/silageboard", label: "Силосная доска"},
          "sowings": {index: "/sowings/new", label: "Посев"},
          "field": {index: "/field", label: "Поле"},
          "notepad": {index: "/notepad", label: "Блокнот"},
          "agromap": {index: "/field", label: "Карта"},
        }
      }
    },
    created() {
//      EventBus.$on('StepsChanged', (steps) => {
//        this.steps = steps;
//      });
    },
    computed: {
      items() {
        let module = this.$root.module
        return this.menu[module]
      },
      menu() {
        let list = this.list
        let menu = {
          "agrofact": [
            list.catalog,
            list.assignments,
            list.map,
            list.monitoring,
            list.reports,
            list.news
          ],
          "agroplan": [
            list.catalog,
            list.sowings,
            list.recipes,
            list.reportsplan,
            list.news
          ],
          "balanszerna": [
            list.catalog,
            list.parttime,
            list.silageboard,
            list.reportsbz,
          ],
          "agromap": [
            list.field,
            list.agromap,
            list.notepad,
            list.news,
          ],
        }
        let i = 1
        menu.agroplan.forEach(m => {m.id = 'step-menu-' + i; i++})
        return menu
      },
    },
    methods: {
      startHelp() {
        if(Steps.agroplan)
          introLib.begin(Steps.agroplan);
      }
    }
  }
</script>
