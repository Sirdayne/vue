<template lang="pug">
  div
    el-dialog(:title="carInfoTitle", :visible.sync="dialogVisible", size="tiny", :before-close="handleClose")
      template(v-if="carInfo.length")
        ol(class="car-info")
          li(v-for="c in carInfo") {{ c.displayString }}
    template(v-for="status in statuses")
      div(class="status") {{ status.name + ': ' + status.value}}
        div(class="color-status", :style="{width: countPercentage(status.value) * 2.5 + 'px', background: status.color}", @click="showCarInfo(status.data)")
    template(v-if="!statuses.length")
      div Нет данных
</template>

<script>
  import { EventBus } from 'services/EventBus';
  import RecordsLoaderV2 from 'mixins/RecordsLoaderV2';
  import moment from 'moment';

  export default {
    mixins: [
      RecordsLoaderV2
    ],
    data() {
      return {
        carInfo: [],
        selectedDate: new Date(),
        carInfoTitle: null,
        dialogVisible: false,
        carstatus: null,
      }
    },
    computed: {
      filteredCarStatus() {
        return this.carstatus && this.carstatus.nextRows && this.carstatus.nextRows.length
          ? this.carstatus.nextRows.filter(c => {
            let selectedDate = moment(this.selectedDate).format("DD.MM.YYYY")
            let date = moment(c.date).format("DD.MM.YYYY")
            if (selectedDate === date) {
              return c;
            }
          })
          : [];
      },
      statuses() {
        let statuses = [];
        let name, color;

        this.filteredCarStatus.map(c => {
          c.data.map(d => {

            switch (d.rowHeader) {
              case 'Работало'                     : name = 'Работало';
                                                    color = 'green';
                                                    break;

              case 'простои (от 15мин до 2 часа)' : name = 'Простои';
                                                    color = 'orange';
                                                    break;

              case 'Стоянка (от 2 часа и более)'  : name = 'Стоянка';
                                                    color = 'orange';
                                                    break;

              case 'нет данных GPS'               : name = 'Нет данных GPS';
                                                    color = 'red';
                                                    break;

              case 'не установлен GPS трекер'     : name = 'Не установлен GPS трекер';
                                                    color = 'red';
                                                    break;
            }

            statuses.push({
              name: name,
              legend: d.rowHeader,
              value: d.tractor.length + d.combine.length + d.sprayer.length + d.truck.length,
              color: color,
              data: {
                title: name,
                cars: {
                  tractor: d.tractor,
                  combine: d.combine,
                  sprayer: d.sprayer,
                  truck: d.truck,
                }
              }
            })
          });
        });
        return statuses;
      },
      totalAmountOfCars() {
        return this.$store.getters.getEntities('cars').length;
      }
    },
    methods: {
      afterFetch() {
        this.carstatus = this.fromVuex('carstatus')
      },
      handleClose(done) {
        this.carInfo = [];
        this.carInfoTitle = null;
        done();
      },
      showCarInfo(data) {
        let cars = data.cars;
        let title = data.title;

        for (let i in cars) {
          if (cars[i].length) {
            for (let j in cars[i]) {
              let carId = cars[i][j];
              let car = this.$store.getters.getEntities('cars').find(c => c.id === carId);
              this.carInfo.push(car);
            }
          }
        }

        this.carInfoTitle = title;
        this.dialogVisible = true;
      },
      countPercentage(amount) {
        return (amount * 100) / this.totalAmountOfCars;
      },
    },
    created() {
      EventBus.$on('MapController.SelectedDateChanged', (selectedDate) => {
        this.selectedDate = selectedDate;
      });
      this.fetchEntities([
        'carstatus'
      ], this.afterFetch);
    },
  }
</script>

<style lang="stylus" scoped>
  /**
  1% is 2.5px
   */
  table >>> td
    padding 7px
  .status
    font-size 0.6rem
    width 250px
    margin-bottom 5px
  .color-status
    background green
    padding 2px 5px
    color white
    width 0px
    height 10px
  .color-status:hover
    cursor pointer
  .car-info >>> li
    margin-bottom 15px
</style>
