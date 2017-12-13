<template lang="pug">
.filter
  .filters
    .button-row
      el-button.filter-button.combine-button(:class="{'filter-button-focused': filterBy == 'combines'}", @click="updateFilterContent('combines')")
    .button-row
      el-button.filter-button.tractor-button(:class="{'filter-button-focused': filterBy == 'tractors'}", @click="updateFilterContent('tractors')")
    .button-row
      el-button.filter-button.truck-button(:class="{'filter-button-focused': filterBy == 'freights'}", @click="updateFilterContent('freights')")
    .button-row
      el-button.filter-button.field-button(:class="{'filter-button-focused': filterBy == 'fields'}", @click="updateFilterContent('fields')")
    .button-row
      el-button.filter-button.driver-button(:class="{'filter-button-focused': filterBy == 'drivers'}", @click="updateFilterContent('drivers')")
  .filter-content
    template(v-if="filterContent")
      ul.filter-content-ul
        li(v-for="c in filterContentFiltered", @click="updateFilter(c.id)",
          :class="{'filter-content-clicked': checkedFilterContent[filterContext].includes(c.id)}") {{ defineLabel(c) }}
    template(v-else)
      p Нет данных
</template>

<script>
import { EventBus } from "services/EventBus";
import RecordsLoaderV2 from "mixins/RecordsLoaderV2";
import GlobalMethods from "components/FormFieldsLibrary/GlobalMethods";
import moment from "moment";

export default {
  name: "MapFilter",
  props: ["searchText"],
  mixins: [GlobalMethods, RecordsLoaderV2],
  data() {
    return {
      filter: {
        carIds: [],
        endDate: new Date(Date.now()),
        fieldIds: [],
        startDate: new Date(Date.now()),
        employeeIds: [],
        instrumentIds: []
      },
      checkedFilterContent: {
        carIds: [],
        fieldIds: [],
        employeeIds: []
      },
      filterContent: [],
      filterContext: "",
      filterBy: "",
      combines: [],
      freights: [],
      tractors: [],
      carModels: [],
      cars: [],
      carTypes: [],
      employees: [],
      fields: [],
    };
  },
  computed: {
    filterContentFiltered() {
      return this.filterContent.filter(
        f =>
          this.defineLabel(f)
            .toLowerCase()
            .indexOf(this.searchText.toLowerCase()) > -1
      );
    },
  },
  created() {
    this.apply()
    EventBus.$on("MapController.SelectedDateChanged", date => {
      this.filter.startDate = moment(date).set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
      });
      this.filter.endDate = moment(date).set({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 0
      });
      this.apply()
    });
    this.fetchEntities([
      "carmodels",
      "cars",
      "cartypes",
      "employees",
      "fields"
    ], this.afterFetch);
  },
  methods: {
    afterFetch() {
      this.carModels = this.fromVuex("carmodels");
      this.cars = this.fromVuex("cars");
      this.carTypes = this.fromVuex("cartypes");
      this.employees = this.fromVuex("employees");
      this.fields = this.fromVuex("fields");
      if (this.carTypes && this.carTypes.length) {
        this.combines = this.getCarsByCarTypeName("Combine");
        let tractors = this.getCarsByCarTypeName("Tractor");
        let harvesters = this.getCarsByCarTypeName("Harvester");
        let sprayers = this.getCarsByCarTypeName("Sprayer");
        this.tractors = tractors.concat(harvesters).concat(sprayers);
        this.freights = this.getCarsByCarTypeName("FreightCar");
        this.updateFilterContent("combines");
      }
    },
    updateFilterContent(filterBy) {
      this.filterBy = filterBy
      let filterMap = {
        "combines": {content: this.combines, context: "carIds"},
        "tractors": {content: this.tractors, context: "carIds"},
        "freights": {content: this.freights, context: "carIds"},
        "fields": {content: this.fields, context: "fieldIds"},
        "drivers": {content: this.employees, context: "employeeIds"},
      }
      this.filterContent = filterMap[filterBy].content;
      this.filterContext = filterMap[filterBy].context;
    },
    defineLabel(item) {
      return item.newName
        ? item.newName
        : item.name
          ? item.name
          : item.displayString
            ? item.displayString
            : item.fullName ? item.fullName : "";
    },
    updateFilter(id) {
      Object.keys(this.checkedFilterContent)
        .filter(key => key === this.filterContext)
        .forEach(key => {
          let ids = this.checkedFilterContent[key];
          if (!ids.length) {
            this.checkedFilterContent[this.filterContext].push(id);
          } else {
            let found = false;
            ids.filter(j => j === id).forEach(j => {
              found = true;
              let index = this.checkedFilterContent[this.filterContext].indexOf(j);
              this.checkedFilterContent[this.filterContext].splice([index], 1);
            })
            if (!found) {
              this.checkedFilterContent[this.filterContext].push(id);
            }
          }
        })
      this.filter[this.filterContext] = this.checkedFilterContent[this.filterContext]
      this.apply()
    },
    apply() {
      this.$emit("apply", Object.assign({}, this.filter));
    }
  }
};
</script>

<style lang="stylus" scoped>
.field-button {
  background-image: url('~assets/field.png');
}

.combine-button {
  background-image: url('~assets/combine-harvester.svg');
}

.tractor-button {
  background-image: url('~assets/tractor-front.svg');
}

.truck-button {
  background-image: url('~assets/delivery-truck.svg');
}

.driver-button {
  background-image: url('~assets/male-user-manager.svg');
}

.filter {
  padding: 0;
  height: calc(65% - 56px);
  box-sizing: border-box;
  overflow-y: hidden;
  border-bottom: 1px solid #e4e8f1;
}

.filters {
  box-sizing: border-box;
  float: left;
  width: 50px;
  padding: 5px;
}

.button-row {
  margin: 0 auto 15px;
  width: 32px;
}

.filter-button {
  height: 32px;
  width: 32px;
  background-size: 32px;
}

.filter-content {
  box-sizing: border-box;
  float: left;
  width: calc(100% - 50px);
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  overflow-y: auto;
  font-size: 14px;
}

.filter-content-ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.filter-content-ul >>> li {
  margin: 0;
  box-sizing: border-box;
  padding: 8px 5px;
}

.filter-content-ul >>> li:hover {
  cursor: pointer;
  background: #bfc3cc;
}

.filter-content-clicked {
  background: #e4e8f1;

  &:before {
    content: '\2713';
  }
}

.filter-button-focused {
  box-shadow: 1px 1px 20px orange;
  border: 1px solid orange;
}
</style>
