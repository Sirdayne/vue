<template lang="pug">
.cols
  el-menu.sidebar(
    unique-opened=true,
    :defaultActive="defaultActive",
    v-if="sidebarToggleState"
  )
    router-link(:to="`/notepad?path=notes`")
      el-menu-item(:index="`1`") Журнал заметок
    router-link(:to="`/notepad?path=notes`")
      el-menu-item(:index="`2`") Добавить заметки
    router-link(:to="`/notepad?path=notes`")
      el-menu-item(:index="`3`") Календарь задач

  .workspace
    template(v-if="this.path === `notes`")
      notes(ref="Notes")

</template>

<script>
import http from 'lib/httpQueryV2'
import RecordsLoaderV2 from 'mixins/RecordsLoaderV2';
import Notes from 'components/notes'

export default {
  mixins: [
    RecordsLoaderV2,
  ],
  components: {
    Notes
  },
  data() {
    return {
      path: 'notes',
      defaultActive: "1",
    }
  },
  computed: {
    sidebarToggleState() {
      return this.$store.getters.getSidebarToggleState;
    }
  },
  created() {
    this.path = (this.$route.query && this.$route.query.path) ? this.$route.query.path : 'notes'
    this.defaultActive = this.path
    this.defineActiveLink()
  },
  watch: {
    ['$route.params.id'] (val) {      // TODO !! Fast fix
      location.reload()
    },
    ['$route.fullPath'] (val) {
      this.path =  (this.$route.query && this.$route.query.path) ? this.$route.query.path : 'field'
    }
  },
  methods: {
    defineActiveLink() {
      switch(this.defaultActive) {
        case 'notes' :
          this.defaultActive = "1"
          break
        default :
          this.defaultActive = "1"
      }
    }
  }
}
</script>
