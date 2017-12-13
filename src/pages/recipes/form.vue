<template lang="pug">
.cols(
  v-loading="!ready || savingProcess",
  element-loading-text="Загружается...",
  )
  template(v-if="ready")
    template(v-if="currentStepId === 0")
      el-menu.sidebar(
        v-if="types.length",
        unique-opened=true,
        default-active="1",
        id="step1"
      )
        router-link(v-for="type in visibleTypes", :to="`/recipes/new?recipeType=${type.id}`", :key="type.id" v-if="Object.keys(worksByType).length")
          el-menu-item(:index='`${type.id}`') {{type.name}}
      .workspace
        el-form(
          label-width="120px",
          :rules="formRules",
          :model="item",
          ref="formStep1Container",
          class="form-edited"
        )
          el-button(@click="startHelpRecipes2", class="button-help") ?
          el-form-item(label="Название", prop="name", id="step2")
            el-input(v-model="item.name")
          el-collapse(v-model="unfoldedWorksIds", v-if="item.technologyRecieptTypeId")
            el-collapse-item(
              v-for="(work, index) in worksByType[item.technologyRecieptTypeId]",
              :name="work.id",
              :title="work.name",
              v-if="work.aggregates.length",
              :key="work.id",
              class="el-collapse-edit"
            )

              el-form-item( v-if="work.withCondition", label="Глубина")
                el-button( @click="startHelpRecipesIn2", class="button-help") ?
                el-input-number( v-model="savedCondition[work.id]", :min="0" )

              el-form-item( v-if="work.withChemicalTreatment", label="Препарат")
                el-button( @click="startHelpRecipesIn1", class="button-help") ?
                el-select(v-model="savedChemicalsModel[work.id]", filterable, @change="refreshAfterChange(savedChemicalsModel[work.id], work.id)")
                  el-option(
                    v-for="preparat in chemicals.filter( \
                      preparat => !savedChemicals[work.id] \
                        .map(chemicalTreatment => chemicalTreatment.chemicalPreparationId) \
                        .includes(preparat.id) \
                    )",
                    :label="preparat.name",
                    :value="preparat.id",
                    :key="preparat.id",
                  )
                el-button(v-if="savedChemicalsUnits[work.id]") {{ savedChemicalsUnits[work.id] }}
                el-button(v-else) ед. изм.
                el-input-number(
                  v-model="savedChemicalNormativesModel[work.id]",
                  :min="minimumNorm(savedChemicalsModel[work.id])",
                  :max="maximumNorm(savedChemicalsModel[work.id])",
                  :step="0.001"
                )
                el-button(
                  :disabled="savedChemicalNormativesModel[work.id] === 0 || !savedChemicalsModel[work.id]",
                  @click="addChemicalTreatment(work)"
                ) Добавить
                .tags
                  el-tag(
                    v-for="(chemicalTreatment, index) in savedChemicals[work.id]",
                    :key="index",
                    :closable="true",
                    type="primary",
                    @close="removeChemicalTreatment(work, index)"
                  )
                    | {{chemicals.find(preparat => preparat.id === chemicalTreatment.chemicalPreparationId).name}}
                    b  ( {{chemicalTreatment.normative}} )

              .el-table-help
                el-button( @click="startHelpRecipesInTable", class="button-help") ?
                el-table(
                  :data="work.aggregates",
                  :row-class-name="rowClassName(work)",
                  :row-key="rowKey(work)"
                )
                  el-table-column(
                    prop="carModel.name",
                    label="Модель машины"
                  ): template(slot-scope="scope")
                    span(:class="{spendOut: getTotalAggregatesCount(work).carModels[scope.row.carModel.id] === 0}")
                      | {{scope.row.carModel.name}}
                      b  (&nbsp;{{getTotalAggregatesCount(work).carModels[scope.row.carModel.id]}}&nbsp;шт.&nbsp;)

                  el-table-column(
                    prop="instrument.displayString",
                    label="Инструмент"
                  ): template(slot-scope="scope")
                    span(:class="{spendOut: getTotalAggregatesCount(work).instruments[scope.row.instrument.id] === 0}")
                      | {{scope.row.instrument.displayString}}
                      b  (&nbsp;{{getTotalAggregatesCount(work).instruments[scope.row.instrument.id]}}&nbsp;шт.&nbsp;)

                  el-table-column(
                    prop="rateOfOutput",
                    label="Норма выработки"
                  )

                  el-table-column(
                    prop="fuelConsumption",
                    label="ГСМ"
                  )

                  el-table-column(
                    label="Количество",
                    width="165"
                  ): template(slot-scope="scope")
                    el-input-number(
                      size="small",
                      v-model="scope.row.count",
                      :min="0",
                      :max="maxAggregateCount(work, scope.row)"
                    )

        .bottom-panel
          el-button.m(size="small", @click="$router.push('/recipes')", id="step5") К списку работ
          el-button(size="small", @click="resetAggregatesCount(true)", id="step3") Сброс

          el-button-group.r
            el-button(size="small", type="primary", native-type="submit", @click.prevent="goToStep2", id="step4") Далее #[i.el-icon-arrow-right]

    template(v-if="currentStepId === 1")
      .left-panel
        el-button(@click="startHelpRecipes3", class="button-help") ?
        h2 Работа {{item.name}}
        el-form.recipes-form-2(id="step2-3")
          el-form-item(label="Бригада")
            el-select(v-model="filterSowingsByFieldBrigade")
              el-option(v-for="brigade in brigades", :label="brigade.name", :value="brigade.id", :key="brigade.id")
          el-form-item(label="Культура")
            el-input(v-model="filterSowingsByCultureName")
          el-form-item(label="Название поля")
            el-input(v-model="filterSowingsByFieldName")
        el-button-group.recipes-buttons
          el-button(size="small", @click="resetSowings(true)", id="step2-4") Сброс
          el-button(size="small", @click="currentStepId--", id="step2-5") Предыдущий шаг
          el-button(size="small", type="primary", native-type="submit", @click.prevent="save", id="step2-6") Сохранить #[i.el-icon-check]
          el-button(size="small", @click="$router.push('/recipes')", id="step2-7") К списку работ
      .workspace
        .panel-fields( :class="{ 'panel-fields-active' : showPanelBottom }", id="step2-1")
          el-form(
            label-width="120px",
            :rules="formRules",
            :model="item",
            ref="formStep3Container"
          )

            fields-select-plates(
              ref="fieldsSelectPlates",
              :items="filteredSowings",
              v-model="savedSowings",
              :highlightActive="false",
              :activeCondition="sowingIsActive"
            )
              template(slot='item', slot-scope="props")
                div: b {{props.item.field.newName || props.item.field.name}}
                div {{props.item.culture.shortName}}
                div ( {{props.item.area}} / {{props.item.field.area}} )
                el-button.bottomControl(size="mini", @click="showSowingsPercentDialog(props.item)") {{savedSowingPercents[props.item.id] || props.item.area}}га

            el-dialog(title="Процент обработки", v-model="sowingsPercentDialog", size="tiny"): form(@submit.prevent="")
              el-slider(v-model="savedSowingsPercentModel", show-input, :min="1", :max="maxValue", ref="sowingPercentInput")
              span(slot="footer")
                el-button(type="primary", native-type="submit", @click="setSowingPercent") OK
        .panel-bottom(v-if="ready && showPanelBottom")
          .fx-table
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

          .fx-table(v-if="tableChemistry.length || tableFertilizer.length || tableLast")
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
import {
  createIndex
} from 'lib/utils'
import http from 'lib/httpQueryV2'
import RecordsLoaderV2 from 'mixins/RecordsLoaderV2';
import FieldsSelectPlates from 'components/FieldsSelect/plates'
import {EventBus} from 'services/EventBus';
import moment from 'moment'

import introLib from 'lib/introLib';
import Steps from 'components/help/steps';

import $ from 'jquery';

let _dataLoaded = false
let _watchers = []

export default {
  mixins: [
    RecordsLoaderV2,
  ],
  components: {
    FieldsSelectPlates
  },
  data() {
    return {
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
      savingProcess: false,
      editMode: false,
      currentStepId: 0,
      formRules: {
        name: [{
            required: true,
            message: 'Поле обязательно',
            trigger: 'blur'
          },
          {
            min: 3,
            max: 256,
            message: 'Длина должна быть от 3 до 256 символов',
            trigger: 'blur'
          }
        ],
        technologyRecieptTypeId: [{
          required: true,
          type: 'integer',
          message: 'Поле обязательно',
          trigger: 'change'
        }]
      },
      item: {
        name: '',
        technologyRecieptTypeId: null
      },
      unfoldedWorksIds: [],
      worksByType: {},

      savedAggregatesCount: {},
      savedCondition: {},
      savedChemicals: {},
      savedChemicalNormativesModel: {},
      savedChemicalsModel: {},
      savedChemicalsUnits: [],

      savedSowings: [],
      sowingsPercentDialog: false,
      maxValue: 1000,
      savedSowingsPercentModel: 100,
      savedSowingIdModel: null,
      savedSowingPercents: {},
      filterSowingsByFieldBrigade: null,
      filterSowingsByFieldName: '',
      filterSowingsByCultureName: '',
      fieldClickedId: null,
      fieldlastassignments: [],
      croprotations: null,
      showPanelBottom: false,
      loading: true
    }
  },
  created() {
    EventBus.$on('fieldClicked', (field) => {
      this.fieldClickedId = field;
      this.showPanelBottom = true;
    });
    this.editMode = this.$route.params.id !== undefined
    this.fetchEntities([
      'brigades',
      'cars',
      'carModels',
      'chemicals',
      'cultures',
      'fields',
      'fuelNorms',
      'instruments',
      'instrumentsByOrganization',
      'sowings',
      'technologyRecipe',
      'technologyRecipeTypes',
      'works',
      'workTypes',
      'chemicalpreparations',
      'unitTypes',
      'croprotations',
      'fieldlastassignments',
    ], this.fetchCompleted);
  },
  destroyed() {
    _dataLoaded = false
  },
  computed: {
    tableData() {
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
    chemicalPreparations() {
      return this.fromVuex('chemicalPreparations')
    },
    unitTypes() {
      return this.fromVuex('unitTypes')
    },
    brigades() {
      return this.fromVuex('brigades')
    },
    cars() {
      return this.fromVuex('cars')
    },
    carModels() {
      return this.fromVuex('carModels')
    },
    chemicals() {
      return this.fromVuex('chemicals')
        .map(preparat => {
          preparat.name = preparat.name.trim()
          return preparat
        }).sort((a, b) => a.name.localeCompare(b.name))
    },
    cultures() {
      return this.fromVuex('cultures')
    },
    fields() {
      return this.fromVuex('fields')
    },
    fuelNorms() {
      return this.fromVuex('fuelNorms')
    },
    instruments() {
      return this.fromVuex('instruments')
    },
    instrumentsByOrganization() {
      return this.fromVuex('instrumentsByOrganization')
    },
    sowings() {
      const indexedCultures = createIndex(this.cultures)
      const indexedFields = createIndex(this.fields)
      let sowings = []
      this.fromVuex('sowings').filter(sowing =>
        indexedFields[sowing.fieldId]
      ).forEach(sowing => {
        sowing.culture = indexedCultures[sowing.cultureId]
        sowing.field = indexedFields[sowing.fieldId]
        sowings.push(sowing)
      })
      return sowings
    },
    technologyRecipe() {
      return this.fromVuex('technologyRecipe')
    },
    types() {
      return this.fromVuex('technologyRecipeTypes')
    },
    works() {
      return this.fromVuex('works')
    },
    workTypes() {
      return this.fromVuex('workTypes')
    },
    visibleTypes() {
      return Object.keys(this.worksByType).length && this.types.filter(
        type => this.worksByType[type.id].some(
          work => {
            return work.aggregates && work.aggregates.length
          }
        )
      )
    },
    filteredSowings() {
      return this.sowings.filter(sowing =>
        sowing.year === this.$root.context.year &&
        (this.filterSowingsByFieldName.trim() === '' || sowing.field.newName.toLowerCase().includes(this.filterSowingsByFieldName.trim().toLowerCase())) &&
        (!this.filterSowingsByFieldBrigade || sowing.field.brigadeId === this.filterSowingsByFieldBrigade) &&
        (this.filterSowingsByCultureName.trim() === '' || sowing.culture.name.toLowerCase().includes(this.filterSowingsByCultureName.trim().toLowerCase()) || sowing.culture.shortName.toLowerCase().includes(this.filterSowingsByCultureName.trim().toLowerCase()))
      )
    },
    technologyRecieptSowings() {
      let fields = this.sowings.filter(el => this.savedSowings.some(elem => elem == el.id))
      return this.savedSowings.map(val => ({
        sowingId: val,
        area: this.savedSowingPercents[val] || fields.filter(el => el.id === val)[0].area
      }))
    }
  },
  watch: {
    ['$route.params.id'](val) {
      // TODO !! Fast fix
      location.reload()
    },
    ['$route.fullPath'](val) {
      this.item.technologyRecieptTypeId = (this.$route.query && this.$route.query.recipeType) ? this.$route.query.recipeType : 1
      this.resetAggregatesCount()
    }
  },
  methods: {
    startHelpRecipesIn1() {
      if(Steps.recipesin1)
        introLib.begin(Steps.recipesin1);
    },
    startHelpRecipesIn2() {
      if(Steps.recipesin2)
        introLib.begin(Steps.recipesin2);
    },
    startHelpRecipesInTable() {
      if(Steps.recipesintable)
        introLib.begin(Steps.recipesintable);
    },
    changeSpoiler(spoiler){
      $(spoiler).slideToggle(500);
    },
    startHelpRecipes2() {
      if(Steps.recipes2)
        introLib.begin(Steps.recipes2);
    },
    startHelpRecipes3() {
      if(Steps.recipes3)
        introLib.begin(Steps.recipes3);
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
      return ((area*100)/this.fields.find(f => f.id == this.fieldClickedId).area).toFixed(2)
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
    getUnits(id){

      let unitName = 'ед. изм.';

      if ((this.chemicalPreparations.length) && (this.unitTypes.length)) {
        let chemPrep = this.chemicalPreparations.find(c => c.id === id);
        console.log(chemPrep);
        if (chemPrep) {
          let unitId = chemPrep.unitsId;
          let unit = this.unitTypes.find(u => u.id === unitId);
          unitName = unit.name;

          console.log(unitId)
        }
      }

      return unitName;
    },
    refreshAfterChange(item, workId) {
      let id = item
      let preparation = this.chemicalPreparations.find(c => c.id === id);
      this.savedChemicalNormativesModel[workId] = preparation ? preparation.minNorm : 0;

      let unitName = 'ед. изм.';

      if ((this.chemicalPreparations.length) && (this.unitTypes.length)) {
        let chemPrep = this.chemicalPreparations.find(c => c.id === id);

        if (chemPrep) {
          let unitId = chemPrep.unitsId;
          let unit = this.unitTypes.find(u => u.id === unitId);
          unitName = unit.name;
        }
      }

      this.savedChemicalsUnits[workId] = unitName;
    },
    minimumNorm(item) {
      let id = item
      let preparation = this.chemicalPreparations.find(c => c.id === id);
      return preparation ? preparation.minNorm : 0;
    },
    maximumNorm(item) {
      let id = item;
      let preparation = this.chemicalPreparations.find(c => c.id === id);
      return preparation ? preparation.maxNorm : 0;
    },
    fetchCompleted() {
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
      this.croprotations = this.fromVuex('croprotations');

      if (Object.keys(this.worksByType).length) {
        if (this.editMode) this.getInitialState()
        this.resetAggregatesCount()
        if (this.visibleTypes.length && !this.visibleTypes.find(type => type.id === this.item.technologyRecieptTypeId)) {
          this.item.technologyRecieptTypeId = null
          this.currentStepId = 0
        }
      }
      this.resetSowings()
      this.init()
    },
    init() {
      if (this.editMode && !_dataLoaded) {
        if (!this.getInitialState()) return
      }
      this.updateWorks()
      if (!this.editMode) {
        this.item.technologyRecieptTypeId = (this.$route.query && this.$route.query.recipeType) ? this.$route.query.recipeType : 1
        this.resetAggregatesCount()
      }
    },
    getInitialState() {
      _dataLoaded = true
      let technologyRecipe = this.technologyRecipe.find(recipe => this.$route.params.id * 1 === recipe.id)
      if (!technologyRecipe) {
        _dataLoaded = false
        return false
      }
      this.item = {...technologyRecipe}
      this.unfoldedWorksIds = []
      this.$set(this, 'savedAggregatesCount', {})
      this.item.recieptWorks.forEach(work => {
        this.unfoldedWorksIds.push(work.workTypeParameterPlanWorkTypeId)
        this.$set(this.savedCondition, work.workTypeParameterPlanWorkTypeId, work.condition)
        this.$set(this.savedChemicals, work.workTypeParameterPlanWorkTypeId, work.chemicalTreatments.map(treatment => ({
          chemicalPreparationId: treatment.chemicalPreparationId,
          normative: treatment.normative
        })))
        work.aggregates.forEach(aggregate => {
          this.$set(this.savedAggregatesCount, JSON.stringify({
            carModelId: aggregate.carModelId,
            instrumentId: aggregate.instrumentId,
            workId: work.workTypeParameterPlanWorkTypeId
          }), aggregate.count)
        })
      })
      this.savedSowings = []
      this.item.technologyRecieptSowings.forEach(sowing => {
        this.savedSowings.push(sowing.sowingId)
        this.$set(this.savedSowingPercents, sowing.sowingId, sowing.area)
      })
      return true
    },
    updateWorks() {
      const carModels = createIndex(this.carModels)
      const carsForModel = createIndex(this.cars, 'carModelId', true)
      const instruments = createIndex(this.instruments)
      const instrumentsByOrganization = createIndex(this.instrumentsByOrganization, 'instrumentId')
      const workTypes = createIndex(this.workTypes)

      let works = this.works.map(work => {
        this.$set(
          work, 'withChemicalTreatment',
          workTypes[work.planWorkTypeId] && workTypes[work.planWorkTypeId].isChemicalTreatment
        )
        this.$set(
          work, 'withCondition',
          workTypes[work.planWorkTypeId] && workTypes[work.planWorkTypeId].conditionType == 1
        )
        if (work.withCondition && this.savedCondition[work.id] === undefined) {
          this.$set(this.savedCondition, work.id, 0)
        }
        if (work.withChemicalTreatment && this.savedChemicals[work.id] === undefined) {
          this.$set(this.savedChemicals, work.id, [])
        }
        if (work.withChemicalTreatment && this.savedChemicalsModel[work.id] === undefined) {
          this.$set(this.savedChemicalsModel, work.id, null)
          this.$set(this.savedChemicalNormativesModel, work.id, 0)
        }
        this.$set(work, 'aggregates', [])
        this.$set(work, 'count', {
          carModels: {},
          instruments: {}
        })
        return work
      })

      _watchers.forEach(unwatch => unwatch())
      _watchers = []

      this.fuelNorms.forEach(norm => {
        norm.subOperationsIds.forEach(workParamId => {
          works.filter(work => work.planWorkTypeId === workParamId).forEach(work => {
            norm.carModelsIds.forEach(carModelId => {
              norm.instrumentsIds.forEach(instrumentId => {
                const carModelCount = carsForModel[carModelId] ? carsForModel[carModelId].length : 0
                const instrumentCount = instrumentsByOrganization[instrumentId] ? instrumentsByOrganization[instrumentId].count : 0
                if (!carModelCount || !instrumentCount) return

                const carModel = carModels[carModelId]
                const instrument = instruments[instrumentId]

                const minCondition = Math.min(
                  ...this.fuelNorms.filter(norm =>
                    norm.subOperationsIds.includes(workParamId) &&
                    norm.carModelsIds.includes(carModelId) &&
                    norm.instrumentsIds.includes(instrumentId)
                  ).map(norm => norm.conditionFrom)
                )
                if (minCondition === norm.conditionFrom && !work.aggregates.find(aggregate =>
                    aggregate.carModel.id === carModel.id &&
                    aggregate.instrument.id === instrument.id
                  )) {
                  if (work.count.carModels[carModelId] === undefined) {
                    this.$set(work.count.carModels, carModelId, carModelCount)
                  }
                  if (work.count.instruments[instrumentId] === undefined) {
                    this.$set(work.count.instruments, instrumentId, instrumentCount)
                  }
                  let aggregate = {
                    carModel,
                    instrument,
                    rateOfOutput: norm.rateOfOutput,
                    fuelConsumption: norm.fuelConsumption,
                    count: this.savedAggregatesCount[JSON.stringify({
                      carModelId,
                      instrumentId,
                      workId: work.id
                    })] || 0
                  }
                  work.aggregates.push(aggregate)

                  work.count.carModels[carModelId] -= aggregate.count
                  work.count.instruments[instrumentId] -= aggregate.count

                  const unwatch = this.$watch(() => aggregate.count, (val, prevVal) => {
                    this.$set(this.savedAggregatesCount, JSON.stringify({
                      carModelId,
                      instrumentId,
                      workId: work.id
                    }), val)
                    work.count.carModels[carModelId] += prevVal - val
                    work.count.instruments[instrumentId] += prevVal - val
                  })
                  _watchers.push(unwatch)
                }
              })
            })
          })
        })
      })
      this.types.forEach(type => {
        this.worksByType[type.id] = works.filter(work =>
          work.technologyRecieptTypeId === type.id
        )
      })
    },
    resetAggregatesCount(showNotification = false) {
      if (showNotification) this.$message('Значения сброшены')
      this.savedAggregatesCount = {}
      Object.values(this.worksByType).forEach(works => {
        works.forEach(work => {
          this.$set(this.savedCondition, work.id, 0)
          this.$set(this.savedChemicals, work.id, [])
          this.$set(this.savedChemicalsModel, work.id, null)
          this.$set(this.savedChemicalNormativesModel, work.id, 0)
          work.aggregates.forEach(aggregate => {
            this.$set(aggregate, 'count', 0)
          })
        })
      })
    },
    resetSowings(showNotification = false) {
      if (showNotification) this.$message('Значения сброшены')
      this.savedSowings = []
      this.sowingsPercentDialog = false
      this.savedSowingsPercentModel = 100
      this.savedSowingIdModel = null
      this.savedSowingPercents = {}
      this.filterSowingsByFieldBrigade = null
      this.filterSowingsByFieldName = ''
    },
    maxAggregateCount(work, aggregate) {
      return Math.min(
        this.getTotalAggregatesCount(work).carModels[aggregate.carModel.id] + aggregate.count,
        this.getTotalAggregatesCount(work).instruments[aggregate.instrument.id] + aggregate.count
      )
    },
    rowClassName(work) {
      return aggregate => {
        if (
          (
            work.count.carModels[aggregate.carModel.id] === 0 ||
            work.count.instruments[aggregate.instrument.id] === 0
          ) &&
          aggregate.count === 0
        ) return 'spend-out-row'
        if (aggregate.count > 0) return 'filled-row'
      }
    },
    rowKey(work) {
      return aggregate => {
        return `${work.id}_${aggregate.carModel.id}_${aggregate.instrument.id}`
      }
    },
    getTotalAggregatesCount(work) {
      // Fix, because cache
      return this.worksByType[this.item.technologyRecieptTypeId].find(_work => work.id === _work.id).count
    },
    addChemicalTreatment(work) {
      this.savedChemicals[work.id].push({
        chemicalPreparationId: this.savedChemicalsModel[work.id],
        normative: this.savedChemicalNormativesModel[work.id]
      })
      this.savedChemicalsModel[work.id] = null
      this.savedChemicalNormativesModel[work.id] = 0
    },
    removeChemicalTreatment(work, index) {
      this.savedChemicals[work.id].splice(index, 1)
    },
    sowingIsActive(sowing) {
      return this.savedSowingPercents[sowing.id] && this.savedSowingPercents[sowing.id] < sowing.area
    },
    showSowingsPercentDialog(sowing) {
      this.savedSowingIdModel = sowing.id
      this.maxValue = sowing.field.area
      this.savedSowingsPercentModel = this.savedSowingPercents[this.savedSowingIdModel] || sowing.area
      this.sowingsPercentDialog = true
      this.$nextTick(() => {
        this.$refs.sowingPercentInput.$el.querySelector('.el-input-number .el-input__inner').focus()
      })
    },
    setSowingPercent() {
      this.$set(this.savedSowingPercents, this.savedSowingIdModel, this.savedSowingsPercentModel)
      this.sowingsPercentDialog = false
    },
    resetAll() {
      _dataLoaded = false
      this.currentStepId = 0
      this.$set(this, 'item', {
        name: '',
        technologyRecieptTypeId: null
      }),
      this.unfoldedWorksIds = []
      this.worksByType = {}
      this.savedAggregatesCount = {}
      this.savedCondition = {}
      this.savedChemicals = {}
      this.savedChemicalNormativesModel = {}
      this.savedChemicalsModel = {}
      this.savedSowings = []
      this.sowingsPercentDialog = false
      this.savedSowingsPercentModel = 100
      this.savedSowingIdModel = null
      this.savedSowingPercents = {}

      this.filterSowingsByFieldBrigade = null
      this.filterSowingsByFieldName = ''
    },
    goToStep2() {
      this.$refs.formStep1Container.validate(valid => {
        if (!valid) {
          this.$message({
            message: 'Заполните поля',
            type: 'warning'
          })
          return
        }
        if (!this.worksByType[this.item.technologyRecieptTypeId].some(work =>
            work.aggregates.some(aggregate =>
              aggregate.count > 0
            )
          )) {
          this.$message({
            message: 'Выберите хотя бы одну технику из списка',
            type: 'warning'
          })
          return
        }
        this.currentStepId = 1
        console.log(this.$route.query.recipeType, 'route')
        console.log(this.item.technologyRecieptTypeId, 'id')
        if( this.$route.query.recipeType == 9){
          this.filterSowingsByCultureName = 'пар'
        } else {
          this.filterSowingsByCultureName = ''
        }
      })
    },
    save() {
      const organization = this.$root.context.organization
      const budget = this.$root.context.budget
      const year = this.$root.context.year
      const path = 'technologyReciept/' + organization + '/' + budget

      this.item.technologyRecieptSowings = this.technologyRecieptSowings
      this.item.organizationId = organization
      this.item.budgetId = budget
      this.item.year = year
      this.item.recieptWorks = []
      if (this.editMode) this.item.id = this.$route.params.id

      this.worksByType[this.item.technologyRecieptTypeId].filter(work =>
        work.aggregates.some(aggregate =>
          aggregate.count > 0
        )
      ).forEach(work => {
        let _work = {
          chemicalTreatments: [],
          aggregates: [],
          condition: this.savedCondition[work.id] || 0,
          workTypeParameterPlanWorkTypeId: work.id
        }
        work.aggregates.forEach(aggregate => {
          if (aggregate.count > 0) _work.aggregates.push({
            carModelId: aggregate.carModel.id,
            instrumentId: aggregate.instrument.id,
            count: aggregate.count
          })
        })
        this.savedChemicals[work.id].forEach(chemical => {
          _work.chemicalTreatments.push(chemical)
        })
        this.item.recieptWorks.push(_work)
      })
      this.savingProcess = true
      http.post(path, this.item).then(() => {
        this.resetAll()
        this.init()
        this.savingProcess = false
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.lead-form
  padding-top: 50px
.spendOut
  text-decoration line-through
  color red
tr.spend-out-row
  opacity 0.5
tr.spend-out-row>td,
tr.spend-out-row:hover>td
  background #ffe0e0
tr.filled-row>td,
tr.filled-row:hover>td
  background #b4eab4

.left-panel
  flex 0 1 auto
  padding 16px
  background #f5f5f5
  align-self stretch
  box-sizing border-box
  width 250px
  position relative

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
}

.recipes-buttons
  margin-top 45px
  button
    display block
    float none
    width 217px
    margin-bottom 6px

.recipes-form-2
  .el-form-item__label
    padding 0px 5px 5px 0

  .el-form-item
    margin-bottom 5px

  label
    padding 0px 5px 5px 0

  .el-input
    float left
    width 100%

.form-edited
  position relative

.el-collapse-edit>>>.el-collapse-item__content
  position relative

.el-collapse-edit .button-help
  top 2px
  left -118px

.el-collapse-edit .el-form-item
  position relative

.el-table-help
  position relative

.el-table-help .button-help
  top 2px
  left 2px

</style>
