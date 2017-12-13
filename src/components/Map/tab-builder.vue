<template lang="pug">
el-tabs(v-model="activeName", v-if="tabs")
  template(v-for="tab in tabs")
    el-tab-pane(:label="tab.label", :name="tab.name")
      component(:is="tab.component", v-bind="tab.props")
</template>

<script>
import SelectedAssignments from "components/Map/SelectedAssignments.vue";

export default {
  name: "TabBuilder",
  props: ["data", "type"],
  components: {
    SelectedAssignments,
  },
  data() {
    return {
      activeName: null,
      tabs: null,
    };
  },
  created() {
    if (this.type == "car") this.buildCarTabs()
  },
  computed: {
    dataProps() {
      return this.data
    },
  },
  watch: {
    ['data'](val, oldVal) {
      if (this.type == "car") this.buildCarTabs()
    }
  },
  methods: {
    buildCarTabs() {
      let tabs = []
      let tab = {
        label: "Задания",
        name: "assignments",
        component: "SelectedAssignments",
        props: this.dataProps["SelectedAssignments"]
      }
      tabs.push(tab)
      this.activeName = tabs[0].name
      this.tabs = tabs
    },
  }
};
</script>
