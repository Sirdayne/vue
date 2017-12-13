<template lang="pug">
.cols(v-loading="isProcessing")
  el-dialog(
    title="Структура посева",
    v-model="showStructure"
  )
    table.infoTable
      tr(v-for="row in info")
        td {{row[0]}}
        td: el-tag.tag(type="gray", v-for="tag in row[1]", :key="tag") {{tag}}
        td {{row[3]}}
      tr
        td(colspan="3"): b Итого: {{totalArea | numberFormat}} га.
  .sidebar.sidebar-new
    el-form( class="el-form-edit", id="step2")
      el-form-item(label="Бюджет:   ")
        .radio-control(v-for="b in budgets"): el-radio(v-model="$root.context.budget", :label="b.id") {{b.name}}

    router-link.link(to="/sowings"): el-button(id="step13") Список посевов
    el-form(label-position="top")
      el-tabs.tabs(active-name="first", type="border-card", id="step8")
        el-tab-pane(label="Культура", name="first")
          el-form-item.culture-control
            el-select(
              placeholder="Культура",
              v-model="firstCultureId",
              :loading="Object.keys(culturesSet).length === 0",
              id="step3"
            )
              el-option-group(
                v-if="culturesSet",
                v-for="cultures in Object.values(culturesSet)",
                :label="cultures[0].type.name",
                :key="cultures[0].type.name",
              )
                el-option(
                  v-for="culture in cultures",
                  :label="culture.name",
                  :value="culture.id",
                  :key="culture.id",
                )
          el-form-item.y(label="Урожайность", id="step4")
            el-input-number(v-model="firstProductivity")
          el-form-item(label="Сорт", v-if="firstCultureId", id="step5")
            el-select(
              v-model="firstSortId"
            )
              el-option(
                v-if="cultures && firstCultureId",
                v-for="sort in cultures[firstCultureId].sorts",
                :label="sort.name",
                :value="sort.id",
                :key="sort.id",
              )
          el-form-item(label="Сорт", v-else, id="step5")
            el-select(v-model="stub")
              el-option(v-for="s in stubs",
                :label="s.name",
                :value="s.id",
                :key="s.id",)
          el-form-item(label="Репродукция", id="step6")
            el-select(
              v-model="firstReproductionId",
              :loading="reproductions.length === 0"
            )
              el-option(
                v-for="reproduction in reproductions",
                :label="reproduction.name",
                :value="reproduction.id",
                :key="reproduction.id",
              )
          el-form-item(label="Конечный продукт", id="step7")
            el-select(
              v-model="firstProductId",
              :loading="cultureparameters.length === 0"
            )
              el-option(
                v-for="c in cultureparameters",
                :label="c.name",
                :value="c.id",
                :key="c.id",
              )

          el-form-item(
            label="Норма высева"
          )
            el-input-number(
              v-model="firstNormative"
            )
        el-tab-pane(label="Вторая культура", name="second")
          el-form-item.culture-control
            el-select(
              placeholder="Вторая культура",
              v-model="secondCultureId",
              :loading="Object.keys(culturesSet).length === 0",
              clearable
            )
              el-option-group(
                v-for="cultures in Object.values(culturesSet)",
                :label="cultures[0].type.name",
                :key="cultures[0].type.name",
              )
                el-option(
                  v-for="culture in cultures",
                  :label="culture.name",
                  :value="culture.id",
                  :key="culture.id",
                )
          el-form-item.y(label="Урожайность", v-if="secondCultureId")
            el-input-number(v-model="secondProductivity")
          template(v-if="secondCultureId")
            el-form-item(label="Сорт")
              el-select(
                v-model="secondSortId"
              )
                el-option(
                  v-if="cultures && secondCultureId",
                  v-for="sort in cultures[secondCultureId].sorts",
                  :label="sort.name",
                  :value="sort.id",
                  :key="sort.id",
                )
            el-form-item(label="Репродукция")
              el-select(
                v-model="secondReproductionId",
                :loading="reproductions.length === 0"
              )
                el-option(
                  v-for="reproduction in reproductions",
                  :label="reproduction.name",
                  :value="reproduction.id",
                  :key="reproduction.id",
                )
            el-form-item(label="Конечный продукт")
              el-select(
                v-model="secondProductId",
                :loading="cultureparameters.length === 0"
              )
                el-option(
                  v-for="c in cultureparameters",
                  :label="c.name",
                  :value="c.id",
                  :key="c.id",
                )
            el-form-item(
              label="Норма высева"
            )
              el-input-number(
                v-model="secondNormative"
              )
            el-form-item
              el-button(type="info", @click="secondCultureId = null") Удалить

      el-form-item(label="Площадь поля", id="step8-1")
        .edit-area(v-if="activeFieldId") {{fieldsAreaInitial[activeFieldId]}} га.
        .edit-area(v-else) Выберите поле
          i(class="el-icon-warning")
      el-form-item(label="Площадь посева", id="step8-2")
        el-slider(v-if="activeFieldId", v-model="fieldsArea[activeFieldId]", show-input, :max="fieldsAreaInitial[activeFieldId]", :min="Math.min(1,fieldsAreaInitial[activeFieldId])")
        .edit-area(v-else) Выберите поле
          i(class="el-icon-warning")

    el-button(@click="showStructure = true", v-if="info", id="step14") Структура посева
    el-button(type="success", @click="save", id="step12") Сохранить
  .workspace
    .panel-fields( :class="{ 'panel-fields-active' : showPanelBottom }")
      template(v-if="fields")
        el-form(:inline="true")
          el-form-item(id="step11")
            el-input(v-model="quickFilter")
          el-form-item(id="step10")
            el-select(v-model="brigadeId")
              el-option(
                label="Все бригады",
                :value="null"
              )
              el-option(
                v-for="brigade in brigades",
                :label="brigade.name",
                :value="brigade.id",
                :key="brigade.id",
              )
          el-form-item
            el-button(@click="startHelpSowings", class="btn-help") ?
            
        fields-controller(id="step9", v-model="checkedFields", :fields="filteredFields", :culture="firstCultureId", @fieldClick="showFieldParams")
      .notify(v-else) Загрузка

    .panel-bottom(v-if="ready && showPanelBottom")
      el-button(@click="startHelpSowingsBottom", class="button-help") ?
      .fx-table(id="bot1")
        .fx-row.fx-light-grey
          button.fx-cell.fx-button( style="cursor: pointer;", @click="changeSpoiler('.fx-spoiler-1')" ) + Севоборот
          .fx-cell( v-for="year in years" )
            el-tag( v-for="item in year.crops", :key="item.id", :color="item.color") {{ item.culture }}
        .fx-spoiler.fx-spoiler-1
          .fx-row
            .fx-cell.fx-head Год
            .fx-cell( v-for="year in years", style="text-align:center;" ) {{ year.year }}
          .fx-row
            .fx-cell.fx-head  Урожайность
            .fx-cell( v-for="year in years" )
              el-tag( v-for="item in year.crops", :key="item.id", :color="item.color") {{item.yield}}
          .fx-row
            .fx-cell.fx-head  Площадь посева
            .fx-cell( v-for="year in years" )
              el-tag( v-for="item in year.crops", :key="item.id", :color="item.color") {{item.sowingArea}}
          .fx-row
            .fx-cell.fx-head  Репродукция
            .fx-cell( v-for="year in years" )
              el-tag( v-for="item in year.crops", :key="item.id", :color="item.color") {{item.reproduction}}
          .fx-row
            .fx-cell.fx-head  Сорт
            .fx-cell( v-for="year in years" )
              el-tag( v-for="item in year.crops", :key="item.id", :color="item.color") {{item.sort}}

      .fx-table(v-if="tableChemistry.length || tableFertilizer.length || tableLast", id="bot2")
        .fx-row.fx-grey
          .fx-cell Работа
          .fx-cell Дата
          .fx-cell Препарат
          .fx-cell Примечание
          .fx-cell Площадь обработки
          .fx-cell % поля
      .fx-table(v-if="tableChemistryLast")
        .fx-row
          button.fx-cell.fx-button.fx-light-grey( style="cursor: pointer;", @click="changeSpoiler('.fx-spoiler-2')" ) + {{ tableChemistryLast.workName }}
          .fx-cell {{ tableChemistryLast.date.startFormated }}
          .fx-cell
            el-tag( v-for="item in tableChemistryLast.chemistryChemicalTreatments", :key="item.id") {{ item.chemicalPreparationName }} ({{ item.factNormative }} )
          .fx-cell
            el-tag( v-for="item in tableChemistryLast.chemistryLimitWeedTypes", :key="item.id") {{ item.weedTypeName }} ({{ item.weedAmount }})
          .fx-cell {{ tableChemistryLast.area }}
          .fx-cell {{ getAreaPercentage(fieldClickedId, tableChemistryLast.area) }}
      .fx-spoiler.fx-spoiler-2
        .fx-table(v-if="tableChemistry.length > 1", v-for="table in tableChemistry")
          .fx-row
            .fx-cell {{ table.workName }}
            .fx-cell {{ table.date.startFormated }}
            .fx-cell
              el-tag( v-for="item in table.chemistryChemicalTreatments", :key="item.id") {{ item.chemicalPreparationName }} ({{ item.factNormative }} )
            .fx-cell
              el-tag( v-for="item in table.chemistryLimitWeedTypes", :key="item.id") {{ item.weedTypeName }} ({{ item.weedAmount }})
            .fx-cell {{ table.area }}
            .fx-cell {{ getAreaPercentage(fieldClickedId, table.area) }}

      .fx-table(v-if="tableFertilizer.length", v-for="table in tableFertilizer")
        .fx-row
          .fx-cell {{ table.workName }}
          .fx-cell {{ table.date.startFormated }}
          .fx-cell
            el-tag( v-for="item in table.chemistryChemicalTreatments", :key="item.id") {{ item.chemicalPreparationName }} ({{ item.factNormative }} )
          .fx-cell(style="line-height: normal;") {{ table.car }} + {{ table.instrument }}
          .fx-cell {{ table.area }}
          .fx-cell {{ getAreaPercentage(fieldClickedId, table.area) }}

      .fx-table(v-if="tableLast")
        .fx-row
          .fx-cell {{ tableLast.workName }}
          .fx-cell {{ tableLast.date.startFormated }}
          .fx-cell -
          .fx-cell(style="line-height: normal;") {{ tableLast.car }} + {{ tableLast.instrument }}
          .fx-cell {{ tableLast.area }}
          .fx-cell {{ getAreaPercentage(fieldClickedId, tableLast.area) }}

</template>

<script>
import fieldsModel          from '_models/Fields'
import sowingsModel         from '_models/Sowings'
import culturesModel        from '_models/Cultures'

import http from 'lib/httpQueryV2'
import datasets  from 'mixins/datasets'
import { createIndexes } from 'helpers'

import FieldsController from 'components/FieldsController'
import RecordsLoaderV2 from 'mixins/RecordsLoaderV2';

import {EventBus} from 'services/EventBus';
import moment from 'moment'
import ListController from 'mixins/ListController'

import $ from 'jquery';

import introLib from 'lib/introLib';
import Steps from 'components/help/steps';

export default {
  mixins: [
    datasets,
    RecordsLoaderV2
  ],
  components: {
    FieldsController
  },
  data() {
    return {
      stub: null,
      stubs: [{
        name: "Выберите культуру",
        id: 0
      }],
      colors: {
        0: {
          color: '#8391a5',
          name: 'grey'
        },
        1: {
          color: '#FF8000',
          name: 'orange'
        },
        2: {
          color: '#74DF00',
          name: 'green'
        },
        3: {
          color: '#2E2EFE',
          name: 'blue'
        },
        4: {
          color: '#FFD100',
          name: 'yellow'
        }
      },
      query: null,
      isProcessing: false,
      showStructure: false,
      showPanelBottom: false,
      spoilers: {
        sevoborot: false,
      },

      cultures: {},
      culturesSet: {},
      reproductions: [],
      cultureparameters: [],
      fields: null,
      fieldsIndexed: {},
      brigades: [],
      sowings: null,
      checkedFields: [],
      fieldsAreaInitial: {},
      fieldsArea: {},
      activeFieldId: null,

      quickFilter: '',
      brigadeId: null,

      firstCultureId: null,
      firstProductivity: 20,
      firstSortId: null,
      firstReproductionId: null,
      firstProductId: null,
      firstNormative: 0,

      secondCultureId: null,
      secondProductivity: null,
      secondSortId: null,
      secondReproductionId: null,
      secondProductId: null,
      secondNormative: null,

      totalArea: 0,
      budgets: null,
      croprotations: null,
      fieldlastassignments: [],
      fieldClickedId: null,
      perPage: 5,
      currentPage: 1,
      loading: true,
    }
  },
  watch: {
    secondCultureId(val) {
      this.secondSortId = null
      if (val) {
        this.secondNormative = this.cultures[val].sowingNormative
      } else {
        this.setSecondtoDefault()
      }
    }
  },
  created() {
    EventBus.$on('fieldClicked', (field) => {
      this.fieldClickedId = field;
      this.showPanelBottom = true;
    });
    this.fetchEntities([
      'budgets',
      'croprotations',
      'fieldlastassignments',
      'cultureparameters',
      'reproductions',
      'brigades'
    ], this.afterFetch );

    if (!/token=/.test(document.cookie) || /token=;/.test(document.cookie) || /token=$/.test(document.cookie)) {
      this.$router.replace('/login')
    } else {
      this.$root.isLogined = true
    }
    this.setSecondtoDefault()
    this.getEntity(culturesModel, (isFinished, records) => {
      this.cultures = createIndexes(records, 'id')
      this.culturesSet = createIndexes(records, 'type.id', true)
    }, true)
    this.getEntity(fieldsModel, (isFinished, records) => {
      this.fieldsIndexed = createIndexes(records, 'id')
      this.fields = records
    }, true)
    this.getSowings()
  },
  mounted() {

  },
  computed: {
    tableData: function() {
      return this.fieldlastassignments.find(x => x.fieldId === this.fieldClickedId)
    },
    tableFertilizer() {
      return this.tableData.fertilizer;
    },
    tableChemistry() {
      return this.tableData.chemistry;
    },
    tableChemistryLast(){
      return this.tableChemistry[this.tableChemistry.length - 1]
    },
    tableLast() {
      return this.tableData.lastWork;
    },
    years() {
      let years = [];
      let firstYear = this.$root.context.year - 1;
      let step = 5;

      for ( var i = 0; i < step; i++ ){
        let crops = this.getSevoborotData(this.fieldClickedId, firstYear);

        let j = -1;
        crops.map(c => {
          if (j < 4) { j++; } else { j = 0; }
          c.color = this.colors[j].color;
          return c;
        });

        years.push({  id: i, year: firstYear, crops: crops });
        firstYear--;
      }

      return years;
    },
    filteredFields() {
      return this.fields.filter(field => {
        return (!this.quickFilter || field.name.toLowerCase().includes(this.quickFilter.toLowerCase())) && (!this.brigadeId || field.brigadeId === this.brigadeId)
      })
    },
    info() {
      let cultures = this.cultures
      let total = []
      let result =  this.sowings? Object.values(
        createIndexes(this.sowings.filter(s => s.year === this.context.year), 'cultureId', true)
      ).map(group => {
        let groupTotal = group.reduce((a, b) => a + b.area, 0)
        total.push(groupTotal)
        return [
        cultures[group[0].cultureId].name +
        ` (${groupTotal} га.)`,
        group.map(s => {return `${s.fieldShortName ? s.fieldShortName : s.fieldNewName ? s.fieldNewName : s.field.name ? s.field.name : null} (${s.area})`}),
        group.reduce((a, b) => a + b.area, 0)
      ]}) : []
      this.totalArea = total.reduce((a, b) => a + b, 0)
      result.forEach((el,i) => {
        result[i].push(((el[2]*100)/this.totalArea).toFixed(2)+"%")
      })
      return result
    }
  },
  methods: {
    changeSpoiler(spoiler){
      $(spoiler).slideToggle(500);
    },
    dateFormat(array){
      array.map(y => {
        y.date.startFormated = moment(y.date.start).format("DD.MM.YYYY")
      });
    },
    colored(array){
      array.map(y => {
        y.date.startFormated = moment(y.date.start).format("DD.MM.YYYY")
        let i = -1;
        y.chemistryLimitWeedTypes.map(c => {
          if (i < 4) {
            i++;
          } else {
            i = 0;
          }
          c.color = this.colors[i].color;
          return c;
        });
        let j = -1;
        y.chemistryChemicalTreatments.map(c => {
          if (j < 4) {
            j++;
          } else {
            j = 0;
          }
          c.color = this.colors[j].color;
          return c;
        });
      });
    },
    getAreaPercentage(fieldId, area){
      return ((area*100)/this.filteredFields.find(f => f.id == this.fieldClickedId).area).toFixed(2)
    },
    getSevoborotData(fieldId, year){
      let croprotation = this.croprotations.find( x => x.fieldId == fieldId );
      if (croprotation){
        let cropYear = croprotation.columns[year];
        let cropArray = [];
        let i = 0;
        if (cropYear){
          cropYear.forEach(x => {
              cropArray.push(
                {
                  culture: x.culture ? x.culture : 'пусто',
                  yield: x.yield ? x.yield : 0,
                  sowingArea: x.sowingArea ? x.sowingArea : 0,
                  reproduction: x.reproduction ? x.reproduction : 'пусто',
                  sort: x.sort ? x.sort : 'пусто'
                });
            i++;
          })
        } else { cropArray = [{ culture: 'нет данных', yield: 0, sowingArea: 0, reproduction: 'нет данных', sort: 'нет данных' }] }
      return cropArray;
      } else {
        return [{ culture: 'нет данных', yield: 0, sowingArea: 0, reproduction: 'нет данных', sort: 'нет данных' }];
      }
    },
    afterFetch(){
      this.budgets = this.fromVuex('budgets');
      this.croprotations = this.fromVuex('croprotations');
      this.cultureparameters = this.fromVuex('cultureparameters');
      this.reproductions = this.fromVuex('reproductions');
      this.brigades = this.fromVuex('brigades');

      this.fieldlastassignments = this.fromVuex('fieldlastassignments').map(x => {
        if(x.chemistry.length > 0){
          this.dateFormat(x.chemistry);
        }
        if(x.fertilizer.length > 0){
          this.dateFormat(x.fertilizer);
        }
        if(x.lastWork){
          x.lastWork.date.startFormated = moment(x.lastWork.date.start).format("DD.MM.YYYY")
        }
        return x
      });
    },
    onContextChange(ctx) {
      if (ctx==='organization') {
        this.getEntity(fieldsModel, (isFinished, records) => {
          this.fields = records
        }, true)
        this.getSowings()
      }
    },
    getSowings(){
      this.getEntity(sowingsModel, (isFinished, records) => {
        this.sowings = records
        let cultures = this.cultures
        this.fields.forEach(field => {
          let sowingsSet = createIndexes(this.sowings.filter(sowing => sowing.year === this.context.year), 'fieldId', true)
          let area = field.area - (sowingsSet[field.id]? sowingsSet[field.id].reduce((a,b)=>a + b.area,0) : 0)
          this.fieldsAreaInitial[field.id] = area
          this.$set(this.fieldsArea, field.id, area)
        })
      }, true)
    },
    save() {
      this.isProcessing = true
      const query = this.checkedFields.map(fieldId => {
        return {
          fieldId:                      fieldId,
          year:                         this.context.year,
          area:                         this.fieldsArea[fieldId],
          cultureId:                    this.firstCultureId,
          secondCultureId:              this.secondCultureId,
          yield:                        this.firstProductivity,
          secondYield:                  this.secondProductivity,
          cultureParameterId:           this.firstProductId,
          secondCultureParameterId:     this.secondProductId,
          sowingNormative:              this.firstNormative,
          secondCultureSowingNormative: this.secondNormative,
          cultureSortId:                this.firstSortId,
          secondCultureSortId:          this.secondSortId,
          reproductionId:               this.firstReproductionId,
          secondCultureReproductionId:  this.secondReproductionId
        }
      })
      http.post('sowings/many/'+this.context.organization+'/'+this.context.budget, query).then(() => {
        this.setSecondtoDefault()
        this.setFirsttoDefault()
        this.isProcessing = false
        //location.reload()
      })
    },
    setSecondtoDefault() {
      this.secondCultureId = null
      this.secondProductivity = 20
      this.secondSortId = null
      this.secondReproductionId = null
      this.secondProductId = null
      this.secondNormative = 0
    },
    setFirsttoDefault() {
      this.firstCultureId = null
      this.firstProductivity = 20
      this.firstSortId = null
      this.firstReproductionId = null
      this.firstProductId = null
      this.firstNormative = 0
    },
    showFieldParams(field) {
      this.activeFieldId = field.id
    },
    startHelpSowings() {
      if(Steps.sowings)
        introLib.begin(Steps.sowings);
    },
    startHelpSowingsBottom() {
      if(Steps.sowingsBottom)
        introLib.begin(Steps.sowingsBottom);
    }
  },
  filters: {
    numberFormat: function(val) {
      return val.toLocaleString('ru-RU')
    }
  }
}
</script>

<style lang="stylus" scoped>
.sidebar
  padding 0 15px 15px 15px
  background #eff2f7
  box-sizing border-box

.tabs
  width 100%
  margin 10px 0 10px
.infoTable
  border solid 1px
  >>> td
    padding 10px
    border solid 1px
  >>> .tag
    margin 5px

.el-form-edit
  margin-top 10px
  >>> .el-radio
        margin 5px 0 3px
  >>> .el-form-item
        margin-bottom 5px
  >>> .el-form-item__label
        padding 8px 0 4px
  >>> .el-radio__label
        font-size 12px
  >>> .el-radio__inner
        width 14px
        height 14px
  >>> .el-form-item__content
        line-height 20px
        font-size 13px

.el-radio
  width 100%

</style>
<style scoped>
.el-select >>> .el-input >>> .el-input__icon {
  display: none !important;
}
.culture-control >>> .y >>> .el-form-item__content {
  float: right;
}
.workspace{
  padding: 0;
}
.panel-fields{
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  padding: 15px;
  overflow: auto;
}
.panel-fields-active{
  height: calc(100vh - 230px);
}
.panel-bottom{
  width: 100%;
  height: 230px;
  box-sizing: border-box;
  padding: 0px;
  border: 1px groove #cfcfcf;
  background: #fff;
  overflow: auto;
  z-index: 3;
  position: relative;
}
.sidebar-new>>>button{
  font-size: 12px;
  padding: 8px;
}
.sidebar-new>>>.el-tabs__item{
  font-size: 12px;
  height: 30px;
  line-height: 30px;
}
.sidebar-new>>>.el-input{
  font-size: 12px;
}
.sidebar-new>>>.el-form-item{
  margin-bottom: 10px;
}
.sidebar-new>>>.el-form-item__label{
  font-size: 12px;
  padding: 0 0 5px;
}
.el-select-dropdown__item{
  font-size: 12px;
  padding: 5px 5px 5px 15px;
  height: 30px;
  line-height: 20px;
}
.edit-area{
  font-size: 12px;
  line-height: 28px;
  color: #48576a;
}
.edit-area i{
  margin-left: 5px;
  color: #48576a;
}
</style>
