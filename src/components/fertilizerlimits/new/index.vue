<template lang="pug">
div(v-if="ready")
  update
  el-form(
    :label-position="mediaObject.labelPosition",
    label-width="90px",
    :model="item",
    ref="formStep1Container",
    :inline="true"
  )
    el-form-item(label="Дата")
      el-date-picker(v-model="item.selectedDate", format="dd.MM.yyyy", placeholder="Выберите дату", style="width:100%")
    el-form-item(label="Работа")
      el-select(v-model="item.workId", filterable)
        el-option(v-for="w in works", :label="w.name", :value="w.id", :key="w.id")
    el-form-item(label="Посев")
      el-select(v-model="item.seedlimitId", @change="extractExtraInfoFromSeedlimit()", filterable)
        el-option(v-for="s in filteredSeedlimits", :key="s.id", :label="s.displayString", :value="s.id")
    el-form-item(label="Удобрение")
      el-select(v-model="item.chemicalTreatment.preparationId", @change="refreshNormativeAfterPreparationChange()", filterable)
        el-option(v-for="c in filterChemicalPreparationsBySelected", :label="c.name", :value="c.id", :key="c.id")
      el-button {{ item.chemicalTreatment.unit }}
      el-input-number(v-model="item.chemicalTreatment.normative", :min="minimumNorm", :max="maximumNorm", :debounce="deBounce")
      el-button(type="primary", size="small", @click="save()") Добавить #[i.el-icon-check]

  h2 Расчет удобрений
    span(:style="{marginRight: '30px'}")
    el-button.filter(
      @click="filterUnfolded = true",
      type="default",
    ) .
    el-button(type="default", @click="exportTable('limit')", :loading="loadingButtons.includes('limit')", v-if="!isSeedButton") ЛЗК
    el-button(type="default", @click="exportTable('seed')", :loading="loadingButtons.includes('seed')", v-if="isSeedButton") ЛЗК
    el-button(type="default", @click="exportTable('invoice')", :loading="loadingButtons.includes('invoice')") Накладная

  el-dialog(title="Фильтр", v-model="filterUnfolded")
    el-form(:model="filterModel", label-width="120px")
     el-form-item(label="Начало")
       el-date-picker(v-model="filterModel.startDateFormated", format="dd.MM.yyyy", placeholder="Выберите дату")
     el-form-item(label="Посевы")
       el-select(v-model="filterModel.seedLimitsIds", multiple, filterable)
         el-option(
           v-for="item in seedlimits",
           :label="item.displayString",
           :value="item.id",
           :key="item.id",
         )
     el-form-item
       el-button(@click="resetFilter") Сбросить

  .el-table-cont
    el-table(
      v-if="filteredChemistryLimits.length || loading",
      :data="paginate(search(filteredChemistryLimits))",
      border,
      resizable,
      v-loading="loading",
      element-loading-text="Загружается...",
    )
      el-table-column(label="Дата", prop="shortDate", width="110")
      el-table-column(label="Поле", prop="fieldName")
      el-table-column(label="Площадь га", prop="fieldArea", width="100")
      el-table-column(label="Работа", prop="workName")
      el-table-column(label="Культура", prop="cultureName")
      el-table-column(label="Наименование препарата")
        template(slot-scope="scope")
          el-tag(v-for="item in scope.row.chemistryChemicalTreatments", :key="item.id") {{ item.chemicalPreparationName }}
      el-table-column(label="Норма расхода", width="100")
        template(slot-scope="scope")
          el-tag(v-for="item in scope.row.chemistryChemicalTreatments", :key="item.id") {{ item.normative }}
      el-table-column(label="Требуется")
        template(slot-scope="scope")
          el-tag(v-for="item in scope.row.chemistryChemicalTreatments", :key="item.id") {{ item.total }}
      el-table-column(
        fixed="right",
        label="",
        width="120"
      ): template(slot-scope="scope")
        el-button(@click="update(scope.row.id)", size="small", icon="edit", :disabled="loadingButtons.includes('record'+scope.row.id)")
        el-button(@click="removeFertilizerLimit(scope.row.id)", size="small", icon="delete2", :loading="loadingButtons.includes('record'+scope.row.id)")
    .no-results(v-else) Нет результатов
    el-pagination(
      layout="total, prev, pager, next",
      :total="filteredChemistryLimits.length",
      :page-size="perPage",
      :current-page="currentPage",
      @current-change="onCurrentPageChange",
      @size-change="onPerPageChange"
    )
</template>

<script>
  import http from 'lib/httpQueryV2';
  import RecordsLoaderV2 from 'mixins/RecordsLoaderV2';
  import { createIndex } from 'lib/utils';
  import ListController from 'mixins/ListController';
  import { EventBus } from 'services/EventBus';
  import update from './update.vue';
  import GlobalMethods from 'components/FormFieldsLibrary/GlobalMethods';
  import moment from 'moment';

  import modifiedByName from 'lib/modifiedByName';

  export default {
    components: {
      update
    },
    mixins: [
      GlobalMethods,
      RecordsLoaderV2,
      ListController
    ],
    data() {
      return {
        perPage: 5,
        deBounce: 1200,
        windowWidth: 0,
        windowHeight: 0,
        isSeedButton: false,
        loadingButtons: [],
        item: {
          carId: '',
          workId: '',
          weedAmount: '',
          seedlimitId: '',
          cultureName: '',
          selectedDate: new Date().setFullYear(this.$root.context.year),
          instrumentId: '',
          weedTypesIds: [],
          chemicalTreatment: {
            normative: 0,
            preparationId: '',
            unit: 'ед. изм.',
          },
          chemicalTreatments: [],
        },
        loading: true,
        updatedEnd: false
      }
    },
    watch: {
      'item.workId'(val) {
        // Посев с внесением удобрения
        this.isSeedButton = val === 65;
        this.item.seedlimitId = null;
      },
      paginatedFilteredChemistryLimits: function() {
        if (this.updatedEnd)
          modifiedByName.addTooltips( this.paginatedFilteredChemistryLimits );
      }
    },
    updated() {
      this.updatedEnd = true;
      modifiedByName.addTooltips( this.paginatedFilteredChemistryLimits );
    },
    computed: {
      unitTypes() {
        return this.fromVuex('unittypes')
      },
      cars() {
        return this.fromVuex('cars')
      },
      carModels() {
        return this.fromVuex('carModels')
      },
      chemicalPreparations() {
        return this.fromVuex('chemicalPreparations')
          .filter(c => c.isMacrofertilizer === true);
      },
      chemistryLimits() {
        return this.fertilizerLimits
          .filter(c => c.isMacrofertilizer === true)
          .map(c => {
              c.shortDate = moment(c.date).format("DD.MM.YYYY")
              c.workName =  this.works.filter(w => w.id === c.workTypeParameterPlanWorkTypeId).length
                            ? this.works.filter(w => w.id === c.workTypeParameterPlanWorkTypeId)[0].name
                            : '';
              return c;
          });
      },
      cultures() {
        return createIndex(this.fromVuex('cultures'))
      },
      fertilizerLimits() {
        return this.fromVuex('fertilizerLimits')
      },
      instruments() {
        return this.fromVuex('instruments')
      },
      seedlimits() {
        return this.fromVuex('seedlimits')
          .filter(s => s.year === this.$root.context.year)
          .map(s => {
            if (s.cultureId === this.cultures[s.cultureId].id) {
              s.cultureShortName  = this.cultures[s.cultureId].shortName;
              s.displayString     = s.displayString.split(' - ');
              s.displayString[1]  = s.cultureShortName;
              s.displayString     = s.displayString.join(' - ');
              return s;
            }
          });
      },
      weedTypes() {
        return this.fromVuex('weedTypes')
      },
      works() {
        return this.fromVuex('works')
          .filter(w => w.isMacrofertilizer);
      },
      paginatedFilteredChemistryLimits() {
        return this.paginate(this.filteredChemistryLimits);
      },
      filteredChemistryLimits() {
        if (this.chemistryLimits.length) this.loading = true
        let chemistryLimits = this.chemistryLimits.filter(c => {
          let date = !this.filterModel.startDateFormated || new Date(c.date) >= new Date(this.filterModel.startDateFormated)
          let filterSeedlimits = !this.filterModel.seedLimitsIds.length || this.filterModel.seedLimitsIds.indexOf(c.seedLimitId) > -1
          if (date && filterSeedlimits) return c;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (this.chemistryLimits.length) this.loading = false
        return chemistryLimits
      },
      // FILTER SEEDLIMIT FIELDS BY WORKS APPLIED TO IT
      filteredSeedlimits() {
        let excludeSeedlimitIds = this.chemistryLimits ? this.chemistryLimits : [];
        excludeSeedlimitIds = excludeSeedlimitIds.filter(a => a.workTypeParameterPlanWorkTypeId === this.item.workId).map(a => a.seedLimitId);
        return this.seedlimits.filter(s => !excludeSeedlimitIds.includes(s.id));
      },
      makeAggregate() {
        let carId = this.item.carId;
        let instrumentId = this.item.instrumentId;

        if (carId !== '' && instrumentId !== '') {
          let car = this.cars.find(c => c.id === carId);
          let carModelId = car.carModelId;
          let carModel = this.carModels.find(c => c.id === carModelId);

          let instrumentName = this.instruments.find(i => i.id === instrumentId);
          this.item.aggregate = carModel.name + '+' + instrumentName.name;
        }
      },
      extractExtraInfoFromSeedlimit() {
        let seedlimit = this.seedlimits.find(s => s.id === this.item.seedlimitId);

        if (seedlimit) {
          this.item.fieldArea = seedlimit.area;
          this.item.fieldName = seedlimit.fieldName;
          this.item.cultureName = seedlimit.cultureName;
        }
      },
      filterChemicalPreparationsBySelected() {
        let treatments = this.item.chemicalTreatments.map(c => c.chemicalPreparationId);

        if (treatments.length) {
          return this.chemicalPreparations.filter(c => {
            if (!treatments.includes(c.id)) {
              return c;
            }
          });
        } else {
          return this.chemicalPreparations;
        }
      },
      refreshNormativeAfterPreparationChange() {
        this.item.chemicalTreatment.normative = this.minimumNorm;

        if ((this.filterChemicalPreparationsBySelected.length) && (this.unitTypes.length) && (this.item.chemicalTreatment.preparationId != '')){
          let ourChemicalPreparation = this.filterChemicalPreparationsBySelected.find(x => x.id == this.item.chemicalTreatment.preparationId);
          let ourChemicalPreparationId = ourChemicalPreparation.unitsId;
          let ourChemicalPreparationUnit = this.unitTypes.find(u => u.id == ourChemicalPreparationId );
          this.item.chemicalTreatment.unit = ourChemicalPreparationUnit.name;
        } else {
          this.item.chemicalTreatment.unit = 'ед. изм.';
        }

      },
      // BORDERS FOR CHEMICAL PREPARATION NORMATIVE
      minimumNorm() {
        let id = this.item.chemicalTreatment.preparationId;
        let preparation = this.chemicalPreparations.find(c => c.id === id);
        return preparation ? preparation.minNorm : 0;
      },
      maximumNorm() {
        let id = this.item.chemicalTreatment.preparationId;
        let preparation = this.chemicalPreparations.find(c => c.id === id);
        return preparation ? preparation.maxNorm : 0;
      },
      addToMixtureButtonDisabled() {
        let id = this.item.chemicalTreatment.preparationId;
        let normative = this.item.chemicalTreatment.normative;

        return id === '' || normative === 0;
      },
      mediaObject() {
        // at 1395 px form elements get bizarre
        if (this.windowWidth <= 1395) {
          return {
            colNotDivided: 8,
            colNotDividedBigger: 24,
            labelPosition: 'top',
            datePickerStyle: {width: '100%'},
            tagsStyle: {margin: '0px 0 20px', width: '50%'},
            tagStyle: {margin: '2px'},
          };
        }
        // anything that is greater than 1395 px
        else {
          return {
            colNotDivided: 8,
            colNotDividedBigger: 24,
            labelPosition: 'left',
            datePickerStyle: {width: '100%'},
            tagsStyle: {margin: '0px 0 20px', width: '50%'},
            tagStyle: {margin: '2px'},
          };
        }
      }
    },
    created() {
      EventBus.$on('FertilizerLimits.UpdateComponent.PutObjectCompleted', () => {
        this.refresh();
      });
      EventBus.$on('AppYearChanged', (year) => {
        this.item.selectedDate = new Date(new Date(this.item.selectedDate).setFullYear(year));
        this.filterModel.startDateFormated = new Date(new Date(this.filterModel.startDateFormated).setFullYear(year));
      });
      this.fetchEntities([
        'cars',
        'carModels',
        'chemicalPreparations',
        'cultures',
        'fertilizerLimits',
        'instruments',
        'seedlimits',
        'weedTypes',
        'works',
        'unitTypes'
      ]);
    },
    mounted() {
      this.$nextTick(function() {
        window.addEventListener('resize', this.getWindowWidth);
        window.addEventListener('resize', this.getWindowHeight);

        //Init
        this.getWindowWidth();
        this.getWindowHeight();
      });
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.getWindowWidth);
      window.removeEventListener('resize', this.getWindowHeight);
    },
    methods: {
      initFilter() {
        return {
          //'startDateFormated': this.item.selectedDate,
          'startDateFormated': '',
          'seedLimitsIds': [],
        }
      },
      update(id) {
        EventBus.$emit('FertilizerLimits.InitUpdate', id);
      },
      getWindowWidth(event) {
        this.windowWidth = document.documentElement.clientWidth;
      },
      getWindowHeight(event) {
        this.windowHeight = document.documentElement.clientHeight;
      },
      exportTable(name) {
        let endpoint;
        let filename;

        switch (name) {
          case 'limit'    : endpoint = 'FertilizerLimitCardForm';
                            filename = 'Лимит удобрений за ';
                            break;
          case 'invoice'  : endpoint = 'FertilizerLimitInvoiceForm';
                            filename = 'Накладная за ';
                            break;
          case 'seed'     : endpoint = 'SeedMineralForm';
                            filename = 'Семена и минеральные удобрения за ';
                            break;
        }

        let dateForBody     = moment(this.item.selectedDate).format("YYYY-MM-DDTHH:mm:ss");
        let dateForFilename = moment(this.item.selectedDate).format("DD.MM.YYYY");
        filename            = filename + dateForFilename.split('T')[0];

        let body = {
          organizationId: this.$root.context.organization,
          date: dateForBody
        };

        http.downloadPDF(endpoint, body, filename);
      },
      load() {
        this.fetchEntities([
          'fertilizerLimits',
        ]);
      },
      refresh() {
        this.load();
      },
      addToMixture() {
        let preparationId = this.item.chemicalTreatment.preparationId;
        let normative = this.item.chemicalTreatment.normative;

        this.item.chemicalTreatments.push({
          normative: normative,
          chemicalPreparationId: preparationId
        });

        this.item.chemicalTreatment.preparationId = '';
        this.item.chemicalTreatment.normative = null;
      },
      removeFromMixture(index) {
        this.item.chemicalTreatments.splice(index, 1);
      },
      removeFertilizerLimit(id) {
        this.loadingButtons.push('record'+id);
        let endpoint = 'chemistrylimits';
        http.delete(endpoint, id).then(() => {
          this.loadingButtons.pop('record'+id);
          this.refresh();
        });
      },
      save() {
        this.addToMixture();
        let endpoint = 'chemistrylimits/' + this.$root.context.organization;
        let formattedDate = moment(this.item.selectedDate).format("YYYY-MM-DDTHH:mm:ss");
        let data = {
          organizationId: this.$root.context.organization,
          date: formattedDate,
          seedlimitId: this.item.seedlimitId,
          workTypeParameterPlanWorkTypeId: this.item.workId,
          weedTypesIds: this.item.weedTypesIds,
          weedAmount: this.item.weedAmount,
          carId: this.item.carId,
          instrumentId: this.item.instrumentId,
          fieldName: this.item.fieldName,
          fieldArea: this.item.fieldArea,
          cultureName: this.item.cultureName,
          aggregate: this.item.aggregate,
          chemistryChemicalTreatments: this.item.chemicalTreatments,
        };

        http.post(endpoint, data).then(() => {
          this.refresh();
          this.item.seedlimitId = '';
          this.item.carId = '';
          this.item.instrumentId = '';
          this.item.weedAmount = '';
          this.item.weedTypesIds = [];
          this.item.chemicalTreatments = [];
          this.savingProcess = false;
        });
      }
    }
  }
</script>

<style>

</style>
